import { useState } from 'react';
import { Upload, File, Monitor, FolderOpen } from 'lucide-react';
import { Device } from '../types';

interface FileTransferProps {
  devices: Device[];
  onSendFile: (device: Device) => void;
}

const FileTransfer = ({ devices, onSendFile }: FileTransferProps) => {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (!selectedDevice) {
      alert('请先选择目标设备');
      return;
    }

    // 这里可以处理拖拽的文件
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      // 由于当前实现限制，我们只处理第一个文件
      console.log('Dropped files:', files);
      alert('拖拽文件功能正在开发中，请使用选择文件按钮');
    }
  };

  const handleSendFile = () => {
    if (selectedDevice) {
      onSendFile(selectedDevice);
    }
  };

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">文件传输</h2>
          <p className="text-gray-500">向局域网内的设备发送文件</p>
        </div>

        {devices.length === 0 ? (
          <div className="text-center py-12">
            <File className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              没有可用设备
            </h3>
            <p className="text-gray-500">
              请先在设备页面中发现设备
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 设备选择 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-4">选择目标设备</h3>
              <div className="space-y-2">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedDevice?.id === device.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedDevice(device)}
                  >
                    <div className="flex items-center space-x-3">
                      <Monitor size={20} className="text-gray-500" />
                      <div>
                        <div className="font-medium text-gray-900">{device.name}</div>
                        <div className="text-sm text-gray-500">{device.ip}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 uppercase font-medium">
                      {device.os}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 文件上传区域 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-4">选择文件</h3>
              
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto text-gray-400 mb-4" size={48} />
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">
                    拖拽文件到此处
                  </p>
                  <p className="text-gray-500">
                    或者点击下方按钮选择文件
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <button
                  onClick={handleSendFile}
                  disabled={!selectedDevice}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    !selectedDevice
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  <FolderOpen size={20} />
                  <span>选择文件发送</span>
                </button>

                <div className="text-xs text-gray-500 text-center">
                  支持所有文件类型，建议单个文件不超过 100MB
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 选中设备信息 */}
        {selectedDevice && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-green-800">
              <Monitor size={16} />
              <span className="font-medium">
                将发送到: {selectedDevice.name} ({selectedDevice.ip})
              </span>
            </div>
          </div>
        )}

        {/* 使用说明 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">使用说明</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 选择目标设备后，点击"选择文件发送"按钮</li>
            <li>• 文件将被发送到目标设备的下载文件夹</li>
            <li>• 确保目标设备正在运行 LanDrop 应用</li>
            <li>• 传输过程中请保持网络连接稳定</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FileTransfer; 