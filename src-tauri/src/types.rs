use serde::{Deserialize, Serialize};
use std::net::IpAddr;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Device {
    pub id: String,
    pub name: String,
    pub ip: IpAddr,
    pub port: u16,
    pub device_type: String,
    pub os: String,
    pub last_seen: u64,
}

impl Device {
    pub fn current() -> anyhow::Result<Self> {
        let hostname = hostname::get()
            .map_err(|e| anyhow::anyhow!("Failed to get hostname: {}", e))?
            .to_string_lossy()
            .to_string();
        
        let local_ip = local_ip_address::local_ip()
            .map_err(|e| anyhow::anyhow!("Failed to get local IP: {}", e))?;
        
        let os = std::env::consts::OS.to_string();
        
        Ok(Device {
            id: uuid::Uuid::new_v4().to_string(),
            name: hostname,
            ip: local_ip,
            port: 8080,
            device_type: "desktop".to_string(),
            os,
            last_seen: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        })
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransferMessage {
    pub message_type: String,
    pub sender: Device,
    pub data: TransferData,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum TransferData {
    Text { content: String },
    File { 
        name: String, 
        size: u64, 
        mime_type: String,
        data: Vec<u8> 
    },
    FileRequest { 
        name: String, 
        size: u64 
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscoveryMessage {
    pub device: Device,
    pub message_type: DiscoveryMessageType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DiscoveryMessageType {
    Announce,
    Goodbye,
    Ping,
    Pong,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransferProgress {
    pub transfer_id: String,
    pub bytes_transferred: u64,
    pub total_bytes: u64,
    pub percentage: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransferStatus {
    pub transfer_id: String,
    pub status: String, // "pending", "transferring", "completed", "failed"
    pub error: Option<String>,
} 