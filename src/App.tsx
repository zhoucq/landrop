import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/api/dialog';
import { Wifi, WifiOff, Send, FileText, Users } from 'lucide-react';
import DeviceList from './components/DeviceList';
import TextTransfer from './components/TextTransfer';
import FileTransfer from './components/FileTransfer';
import Notifications from './components/Notifications';
import { Device, Notification } from './types';

function App() {
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
  const [activeTab, setActiveTab] = useState<'devices' | 'text' | 'files'>('devices');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // 获取当前设备信息
    invoke<Device>('get_device_info').then(setCurrentDevice);

    // 监听文件接收事件
    const unlistenFile = listen<any>('file-received', (event) => {
      const { sender, fileName } = event.payload;
      addNotification({
        id: Date.now().toString(),
        type: 'file',
        title: '文件已接收',
        message: `从 ${sender.name} 接收到文件: ${fileName}`,
        timestamp: Date.now(),
      });
    });

    // 监听文本接收事件
    const unlistenText = listen<any>('text-received', (event) => {
      const { sender, content } = event.payload;
      addNotification({
        id: Date.now().toString(),
        type: 'text',
        title: '文本已接收',
        message: `从 ${sender.name} 接收到: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
        timestamp: Date.now(),
      });
    });

    return () => {
      unlistenFile.then(f => f());
      unlistenText.then(f => f());
    };
  }, []);

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const toggleDiscovery = async () => {
    try {
      if (isDiscovering) {
        await invoke('stop_discovery');
        setIsDiscovering(false);
        setDevices([]);
      } else {
        await invoke('start_discovery');
        setIsDiscovering(true);
        // 定期更新设备列表
        const interval = setInterval(async () => {
          try {
            const deviceList = await invoke<Device[]>('get_devices');
            setDevices(deviceList);
          } catch (error) {
            console.error('Failed to get devices:', error);
          }
        }, 2000);

        // 清理定时器
        setTimeout(() => clearInterval(interval), 0);
      }
    } catch (error) {
      console.error('Failed to toggle discovery:', error);
    }
  };

  const sendFile = async (device: Device) => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'All Files',
          extensions: ['*']
        }]
      });

      if (selected && typeof selected === 'string') {
        await invoke('send_file', {
          filePath: selected,
          targetDevice: device
        });
        
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          title: '文件发送成功',
          message: `文件已发送到 ${device.name}`,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error('Failed to send file:', error);
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: '文件发送失败',
        message: '发送文件时出现错误',
        timestamp: Date.now(),
      });
    }
  };

  const sendText = async (device: Device, text: string) => {
    try {
      await invoke('send_text', {
        text,
        targetDevice: device
      });
      
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: '文本发送成功',
        message: `文本已发送到 ${device.name}`,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to send text:', error);
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: '文本发送失败',
        message: '发送文本时出现错误',
        timestamp: Date.now(),
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">LanDrop</h1>
            {currentDevice && (
              <div className="text-sm text-gray-500">
                {currentDevice.name} • {currentDevice.ip}
              </div>
            )}
          </div>
          
          <button
            onClick={toggleDiscovery}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isDiscovering
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
            }`}
          >
            {isDiscovering ? <WifiOff size={20} /> : <Wifi size={20} />}
            <span>{isDiscovering ? '停止发现' : '开始发现'}</span>
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 px-6">
        <div className="flex space-x-8">
          {[
            { id: 'devices', label: '设备', icon: Users },
            { id: 'text', label: '文本传输', icon: FileText },
            { id: 'files', label: '文件传输', icon: Send },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'devices' && (
          <DeviceList
            devices={devices}
            isDiscovering={isDiscovering}
            onSendFile={sendFile}
          />
        )}
        {activeTab === 'text' && (
          <TextTransfer
            devices={devices}
            onSendText={sendText}
          />
        )}
        {activeTab === 'files' && (
          <FileTransfer
            devices={devices}
            onSendFile={sendFile}
          />
        )}
      </main>

      {/* Notifications */}
      <Notifications notifications={notifications} />
    </div>
  );
}

export default App; 