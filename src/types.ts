export interface Device {
  id: string;
  name: string;
  ip: string;
  port: number;
  device_type: string;
  os: string;
  last_seen: number;
}

export interface TransferMessage {
  message_type: string;
  sender: Device;
  data: TransferData;
  timestamp: number;
}

export interface TransferData {
  type: 'Text' | 'File' | 'FileRequest';
  content?: string;
  name?: string;
  size?: number;
  mime_type?: string;
  data?: number[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'file' | 'text';
  title: string;
  message: string;
  timestamp: number;
}

export interface TransferProgress {
  transfer_id: string;
  bytes_transferred: number;
  total_bytes: number;
  percentage: number;
} 