use crate::types::{Device, DiscoveryMessage, DiscoveryMessageType};
use anyhow::Result;
use std::collections::HashMap;
use std::net::{SocketAddr, UdpSocket};
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::sync::{broadcast, Mutex};

const DISCOVERY_PORT: u16 = 8889;
const MULTICAST_ADDR: &str = "239.255.255.250";

pub struct DiscoveryService {
    device: Device,
    discovered_devices: Arc<Mutex<HashMap<String, Device>>>,
    running: Arc<Mutex<bool>>,
    device_sender: broadcast::Sender<Vec<Device>>,
}

impl DiscoveryService {
    pub fn new() -> Result<Self> {
        let device = Device::current()?;
        let (device_sender, _) = broadcast::channel(100);
        
        Ok(DiscoveryService {
            device,
            discovered_devices: Arc::new(Mutex::new(HashMap::new())),
            running: Arc::new(Mutex::new(false)),
            device_sender,
        })
    }

    pub async fn start(&mut self) -> Result<()> {
        let mut running = self.running.lock().await;
        if *running {
            return Ok(());
        }
        *running = true;
        drop(running);

        // 启动发现监听器
        let discovered_devices = self.discovered_devices.clone();
        let device_sender = self.device_sender.clone();
        let running_clone = self.running.clone();
        
        tokio::spawn(async move {
            if let Err(e) = Self::discovery_listener(discovered_devices, device_sender, running_clone).await {
                eprintln!("Discovery listener error: {}", e);
            }
        });

        // 启动广播器
        let device = self.device.clone();
        let running_clone = self.running.clone();
        
        tokio::spawn(async move {
            if let Err(e) = Self::discovery_broadcaster(device, running_clone).await {
                eprintln!("Discovery broadcaster error: {}", e);
            }
        });

        // 启动设备清理任务
        let discovered_devices = self.discovered_devices.clone();
        let device_sender = self.device_sender.clone();
        let running_clone = self.running.clone();
        
        tokio::spawn(async move {
            Self::device_cleanup_task(discovered_devices, device_sender, running_clone).await;
        });

        println!("Discovery service started");
        Ok(())
    }

    pub async fn stop(&mut self) -> Result<()> {
        let mut running = self.running.lock().await;
        *running = false;
        println!("Discovery service stopped");
        Ok(())
    }

    pub async fn get_devices(&self) -> Vec<Device> {
        let devices = self.discovered_devices.lock().await;
        devices.values().cloned().collect()
    }

    async fn discovery_listener(
        discovered_devices: Arc<Mutex<HashMap<String, Device>>>,
        device_sender: broadcast::Sender<Vec<Device>>,
        running: Arc<Mutex<bool>>,
    ) -> Result<()> {
        let socket = UdpSocket::bind(format!("0.0.0.0:{}", DISCOVERY_PORT))?;
        socket.set_nonblocking(true)?;
        
        let mut buf = [0u8; 1024];
        
        while *running.lock().await {
            match socket.recv_from(&mut buf) {
                Ok((size, addr)) => {
                    if let Ok(message) = serde_json::from_slice::<DiscoveryMessage>(&buf[..size]) {
                        match message.message_type {
                            DiscoveryMessageType::Announce | DiscoveryMessageType::Ping => {
                                let mut devices = discovered_devices.lock().await;
                                devices.insert(message.device.id.clone(), message.device.clone());
                                let device_list: Vec<Device> = devices.values().cloned().collect();
                                let _ = device_sender.send(device_list);
                                
                                // 响应 Ping
                                if matches!(message.message_type, DiscoveryMessageType::Ping) {
                                    let current_device = Device::current().unwrap_or_else(|_| message.device.clone());
                                    let pong_message = DiscoveryMessage {
                                        device: current_device,
                                        message_type: DiscoveryMessageType::Pong,
                                    };
                                    
                                    if let Ok(data) = serde_json::to_vec(&pong_message) {
                                        let _ = socket.send_to(&data, addr);
                                    }
                                }
                            }
                            DiscoveryMessageType::Pong => {
                                let mut devices = discovered_devices.lock().await;
                                devices.insert(message.device.id.clone(), message.device);
                                let device_list: Vec<Device> = devices.values().cloned().collect();
                                let _ = device_sender.send(device_list);
                            }
                            DiscoveryMessageType::Goodbye => {
                                let mut devices = discovered_devices.lock().await;
                                devices.remove(&message.device.id);
                                let device_list: Vec<Device> = devices.values().cloned().collect();
                                let _ = device_sender.send(device_list);
                            }
                        }
                    }
                }
                Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                    tokio::time::sleep(Duration::from_millis(10)).await;
                }
                Err(e) => {
                    eprintln!("UDP receive error: {}", e);
                }
            }
        }
        
        Ok(())
    }

    async fn discovery_broadcaster(device: Device, running: Arc<Mutex<bool>>) -> Result<()> {
        let socket = UdpSocket::bind("0.0.0.0:0")?;
        socket.set_broadcast(true)?;
        
        let multicast_addr: SocketAddr = format!("{}:{}", MULTICAST_ADDR, DISCOVERY_PORT).parse()?;
        
        while *running.lock().await {
            let announce_message = DiscoveryMessage {
                device: device.clone(),
                message_type: DiscoveryMessageType::Announce,
            };
            
            if let Ok(data) = serde_json::to_vec(&announce_message) {
                let _ = socket.send_to(&data, multicast_addr);
            }
            
            tokio::time::sleep(Duration::from_secs(5)).await;
        }
        
        // 发送 Goodbye 消息
        let goodbye_message = DiscoveryMessage {
            device,
            message_type: DiscoveryMessageType::Goodbye,
        };
        
        if let Ok(data) = serde_json::to_vec(&goodbye_message) {
            let _ = socket.send_to(&data, multicast_addr);
        }
        
        Ok(())
    }

    async fn device_cleanup_task(
        discovered_devices: Arc<Mutex<HashMap<String, Device>>>,
        device_sender: broadcast::Sender<Vec<Device>>,
        running: Arc<Mutex<bool>>,
    ) {
        while *running.lock().await {
            let current_time = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs();
            
            let mut devices = discovered_devices.lock().await;
            let mut to_remove = Vec::new();
            
            for (id, device) in devices.iter() {
                if current_time - device.last_seen > 30 {
                    to_remove.push(id.clone());
                }
            }
            
            for id in to_remove {
                devices.remove(&id);
            }
            
            if !devices.is_empty() {
                let device_list: Vec<Device> = devices.values().cloned().collect();
                let _ = device_sender.send(device_list);
            }
            
            drop(devices);
            tokio::time::sleep(Duration::from_secs(10)).await;
        }
    }

    pub fn subscribe_devices(&self) -> broadcast::Receiver<Vec<Device>> {
        self.device_sender.subscribe()
    }
} 