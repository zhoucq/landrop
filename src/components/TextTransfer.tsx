import { useState } from 'react';
import { Send, MessageSquare, Monitor } from 'lucide-react';
import { Device } from '../types';

interface TextTransferProps {
  devices: Device[];
  onSendText: (device: Device, text: string) => void;
}

const TextTransfer = ({ devices, onSendText }: TextTransferProps) => {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendText = async () => {
    if (!selectedDevice || !text.trim() || isSending) return;
    
    setIsSending(true);
    try {
      await onSendText(selectedDevice, text);
      setText('');
    } catch (error) {
      console.error('Failed to send text:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSendText();
    }
  };

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">文本传输</h2>
          <p className="text-gray-500">向局域网内的设备发送文本内容</p>
        </div>

        {devices.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
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

            {/* 文本输入 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-4">输入文本内容</h3>
              <div className="space-y-4">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="在此输入要发送的文本内容..."
                  className="w-full h-48 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {text.length} 字符 • Ctrl+Enter 发送
                  </div>
                  
                  <button
                    onClick={handleSendText}
                    disabled={!selectedDevice || !text.trim() || isSending}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      !selectedDevice || !text.trim() || isSending
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    <Send size={16} />
                    <span>{isSending ? '发送中...' : '发送文本'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 选中设备信息 */}
        {selectedDevice && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-blue-800">
              <Monitor size={16} />
              <span className="font-medium">
                将发送到: {selectedDevice.name} ({selectedDevice.ip})
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextTransfer; 