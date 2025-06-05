use crate::types::{Device, TransferData, TransferMessage, TransferProgress, TransferStatus};
use anyhow::Result;
use axum::{
    extract::{State as AxumState},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager};
use tokio::sync::{broadcast, Mutex};
use tower_http::cors::CorsLayer;

pub struct TransferService {
    device: Device,
    transfers: Arc<Mutex<HashMap<String, TransferStatus>>>,
    progress_sender: broadcast::Sender<TransferProgress>,
}

impl TransferService {
    pub fn new() -> Result<Self> {
        let device = Device::current()?;
        let (progress_sender, _) = broadcast::channel(100);
        
        Ok(TransferService {
            device,
            transfers: Arc::new(Mutex::new(HashMap::new())),
            progress_sender,
        })
    }

    pub async fn start_server(&self, app_handle: AppHandle) -> Result<()> {
        let transfers = self.transfers.clone();
        let progress_sender = self.progress_sender.clone();
        let device = self.device.clone();
        
        let shared_state = SharedState {
            transfers,
            progress_sender,
            device,
            app_handle,
        };

        let app = Router::new()
            .route("/api/receive/file", post(receive_file))
            .route("/api/receive/text", post(receive_text))
            .route("/api/ping", get(ping))
            .route("/api/device", get(get_device_info))
            .layer(CorsLayer::permissive())
            .with_state(shared_state);

        let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await?;
        println!("Transfer server listening on http://0.0.0.0:8080");
        
        tokio::spawn(async move {
            if let Err(e) = axum::serve(listener, app).await {
                eprintln!("Server error: {}", e);
            }
        });

        Ok(())
    }

    pub async fn send_file(&self, file_path: &str, target_device: &Device) -> Result<()> {
        let file_data = fs::read(file_path)?;
        let file_name = PathBuf::from(file_path)
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("unknown")
            .to_string();

        let mime_type = mime_guess::from_path(file_path)
            .first_or_octet_stream()
            .to_string();

        let transfer_message = TransferMessage {
            message_type: "file".to_string(),
            sender: self.device.clone(),
            data: TransferData::File {
                name: file_name,
                size: file_data.len() as u64,
                mime_type,
                data: file_data,
            },
            timestamp: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        };

        self.send_to_device(&transfer_message, target_device).await
    }

    pub async fn send_text(&self, text: &str, target_device: &Device) -> Result<()> {
        let transfer_message = TransferMessage {
            message_type: "text".to_string(),
            sender: self.device.clone(),
            data: TransferData::Text {
                content: text.to_string(),
            },
            timestamp: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        };

        self.send_to_device(&transfer_message, target_device).await
    }

    async fn send_to_device(&self, message: &TransferMessage, target_device: &Device) -> Result<()> {
        let client = reqwest::Client::new();
        let url = match &message.data {
            TransferData::File { .. } => format!("http://{}:{}/api/receive/file", target_device.ip, target_device.port),
            TransferData::Text { .. } => format!("http://{}:{}/api/receive/text", target_device.ip, target_device.port),
            _ => return Err(anyhow::anyhow!("Unsupported transfer data type")),
        };

        let response = client
            .post(&url)
            .json(message)
            .send()
            .await?;

        if response.status().is_success() {
            println!("Transfer successful");
        } else {
            println!("Transfer failed: {}", response.status());
        }

        Ok(())
    }

    pub fn subscribe_progress(&self) -> broadcast::Receiver<TransferProgress> {
        self.progress_sender.subscribe()
    }
}

#[derive(Clone)]
struct SharedState {
    transfers: Arc<Mutex<HashMap<String, TransferStatus>>>,
    progress_sender: broadcast::Sender<TransferProgress>,
    device: Device,
    app_handle: AppHandle,
}

async fn receive_file(
    AxumState(state): AxumState<SharedState>,
    Json(message): Json<TransferMessage>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    if let TransferData::File { name, size, mime_type, data } = message.data {
        // 获取下载目录
        let downloads_dir = dirs::download_dir()
            .unwrap_or_else(|| std::env::current_dir().unwrap());
        
        let file_path = downloads_dir.join(&name);
        
        // 写入文件
        if let Err(e) = fs::write(&file_path, &data) {
            eprintln!("Failed to write file: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }

        // 发送事件到前端
        let _ = state.app_handle.emit_all("file-received", serde_json::json!({
            "sender": message.sender,
            "fileName": name,
            "filePath": file_path.to_string_lossy(),
            "fileSize": size,
            "mimeType": mime_type,
            "timestamp": message.timestamp
        }));

        println!("File received: {} from {}", name, message.sender.name);

        Ok(Json(serde_json::json!({
            "status": "success",
            "message": "File received successfully"
        })))
    } else {
        Err(StatusCode::BAD_REQUEST)
    }
}

async fn receive_text(
    AxumState(state): AxumState<SharedState>,
    Json(message): Json<TransferMessage>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    if let TransferData::Text { content } = message.data {
        // 发送事件到前端
        let _ = state.app_handle.emit_all("text-received", serde_json::json!({
            "sender": message.sender,
            "content": content,
            "timestamp": message.timestamp
        }));

        println!("Text received from {}: {}", message.sender.name, content);

        Ok(Json(serde_json::json!({
            "status": "success",
            "message": "Text received successfully"
        })))
    } else {
        Err(StatusCode::BAD_REQUEST)
    }
}

async fn ping() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "ok",
        "timestamp": SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs()
    }))
}

async fn get_device_info(AxumState(state): AxumState<SharedState>) -> Json<Device> {
    Json(state.device)
} 