import { useState } from 'react';
import { Monitor, Smartphone, Tablet, Laptop, Send, Circle } from 'lucide-react';
import { Device } from '../types';

interface DeviceListProps {
  devices: Device[];
  isDiscovering: boolean;
  onSendFile: (device: Device) => void;
}

const DeviceList = ({ devices, isDiscovering, onSendFile }: DeviceListProps) => {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const getDeviceIcon = (deviceType: string, os: string) => {
    if (deviceType === 'mobile' || os === 'android' || os === 'ios') {
      return <Smartphone className="text-blue-500" size={24} />;
    }
    if (deviceType === 'tablet') {
      return <Tablet className="text-green-500" size={24} />;
    }
    if (deviceType === 'laptop' || os === 'macos') {
      return <Laptop className="text-purple-500" size={24} />;
    }
    return <Monitor className="text-gray-500" size={24} />;
  };

  const getOSBadgeColor = (os: string) => {
    switch (os.toLowerCase()) {
      case 'windows':
        return 'bg-blue-100 text-blue-800';
      case 'macos':
        return 'bg-gray-100 text-gray-800';
      case 'linux':
        return 'bg-orange-100 text-orange-800';
      case 'android':
        return 'bg-green-100 text-green-800';
      case 'ios':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatLastSeen = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    
    if (diff < 60) return '刚刚在线';
    if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
    return `${Math.floor(diff / 86400)} 天前`;
  };

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            发现的设备 ({devices.length})
          </h2>
          {isDiscovering && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Circle className="animate-pulse text-green-500" size={8} />
              <span>正在搜索设备...</span>
            </div>
          )}
        </div>

        {!isDiscovering && devices.length === 0 && (
          <div className="text-center py-12">
            <Monitor className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              未发现设备
            </h3>
            <p className="text-gray-500 mb-4">
              点击"开始发现"按钮来搜索局域网内的设备
            </p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => (
            <div
              key={device.id}
              className={`bg-white rounded-lg border shadow-sm p-4 transition-all hover:shadow-md cursor-pointer ${
                selectedDevice?.id === device.id
                  ? 'ring-2 ring-primary-500 border-primary-500'
                  : 'border-gray-200'
              }`}
              onClick={() => setSelectedDevice(device)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getDeviceIcon(device.device_type, device.os)}
                  <div>
                    <h3 className="font-medium text-gray-900">{device.name}</h3>
                    <p className="text-sm text-gray-500">{device.ip}:{device.port}</p>
                  </div>
                </div>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getOSBadgeColor(device.os)}`}
                >
                  {device.os}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {formatLastSeen(device.last_seen)}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSendFile(device);
                  }}
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 transition-colors"
                >
                  <Send size={14} />
                  <span>发送文件</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {selectedDevice && (
          <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-3">设备详情</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">设备名称:</span>
                <span className="ml-2 font-medium">{selectedDevice.name}</span>
              </div>
              <div>
                <span className="text-gray-500">IP 地址:</span>
                <span className="ml-2 font-medium">{selectedDevice.ip}</span>
              </div>
              <div>
                <span className="text-gray-500">端口:</span>
                <span className="ml-2 font-medium">{selectedDevice.port}</span>
              </div>
              <div>
                <span className="text-gray-500">操作系统:</span>
                <span className="ml-2 font-medium">{selectedDevice.os}</span>
              </div>
              <div>
                <span className="text-gray-500">设备类型:</span>
                <span className="ml-2 font-medium">{selectedDevice.device_type}</span>
              </div>
              <div>
                <span className="text-gray-500">最后在线:</span>
                <span className="ml-2 font-medium">{formatLastSeen(selectedDevice.last_seen)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceList; 