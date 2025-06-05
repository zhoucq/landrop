// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod discovery;
mod transfer;
mod types;

use discovery::DiscoveryService;
use transfer::TransferService;
use types::*;

use std::sync::Arc;
use tauri::{Manager, State};
use tokio::sync::Mutex;

type AppState = Arc<Mutex<AppData>>;

#[derive(Default)]
struct AppData {
    discovery: Option<DiscoveryService>,
    transfer: Option<TransferService>,
    devices: Vec<Device>,
}

#[tauri::command]
async fn start_discovery(state: State<'_, AppState>) -> Result<(), String> {
    let mut app_data = state.lock().await;
    if app_data.discovery.is_none() {
        let discovery = DiscoveryService::new().map_err(|e| e.to_string())?;
        app_data.discovery = Some(discovery);
    }
    
    if let Some(discovery) = &mut app_data.discovery {
        discovery.start().await.map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

#[tauri::command]
async fn stop_discovery(state: State<'_, AppState>) -> Result<(), String> {
    let mut app_data = state.lock().await;
    if let Some(discovery) = &mut app_data.discovery {
        discovery.stop().await.map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn get_devices(state: State<'_, AppState>) -> Result<Vec<Device>, String> {
    let app_data = state.lock().await;
    Ok(app_data.devices.clone())
}

#[tauri::command]
async fn send_file(
    file_path: String,
    target_device: Device,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut app_data = state.lock().await;
    if app_data.transfer.is_none() {
        app_data.transfer = Some(TransferService::new().map_err(|e| e.to_string())?);
    }
    
    if let Some(transfer) = &app_data.transfer {
        transfer.send_file(&file_path, &target_device).await.map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

#[tauri::command]
async fn send_text(
    text: String,
    target_device: Device,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut app_data = state.lock().await;
    if app_data.transfer.is_none() {
        app_data.transfer = Some(TransferService::new().map_err(|e| e.to_string())?);
    }
    
    if let Some(transfer) = &app_data.transfer {
        transfer.send_text(&text, &target_device).await.map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

#[tauri::command]
async fn get_device_info() -> Result<Device, String> {
    let device = Device::current().map_err(|e| e.to_string())?;
    Ok(device)
}

fn main() {
    tauri::Builder::default()
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            start_discovery,
            stop_discovery,
            get_devices,
            send_file,
            send_text,
            get_device_info
        ])
        .setup(|app| {
            let app_handle = app.handle();
            
            // 启动传输服务
            tauri::async_runtime::spawn(async move {
                let state: State<AppState> = app_handle.state();
                let mut app_data = state.lock().await;
                if let Ok(transfer_service) = TransferService::new() {
                    if let Err(e) = transfer_service.start_server(app_handle.clone()).await {
                        eprintln!("Failed to start transfer server: {}", e);
                    }
                    app_data.transfer = Some(transfer_service);
                }
            });
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
} 