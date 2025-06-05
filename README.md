# LanDrop

![Build Status](https://github.com/zhoucq/landrop/actions/workflows/build.yml/badge.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.1.0-green.svg)

一个基于 Tauri 的局域网文件和内容传输工具，支持设备自动发现和无缝文件传输。

## 功能特性

- 🔍 **自动发现设备** - 自动扫描并发现局域网内的其他 LanDrop 设备
- 📁 **文件传输** - 支持任意类型文件的快速传输
- 📝 **文本传输** - 快速发送文本内容到其他设备
- 🖥️ **跨平台支持** - 支持 Windows、macOS 和 Linux
- 🎨 **现代化界面** - 使用 React + Tailwind CSS 构建的美观界面
- 🚀 **高性能** - 基于 Rust 和 Tauri 框架，性能优异

## 技术栈

### 前端
- **React** - 用户界面框架
- **TypeScript** - 类型安全的 JavaScript
- **Tailwind CSS** - 实用程序优先的 CSS 框架
- **Lucide React** - 美观的图标库
- **Vite** - 快速的构建工具

### 后端
- **Rust** - 系统编程语言
- **Tauri** - 跨平台桌面应用框架
- **Tokio** - 异步运行时
- **Axum** - 现代 Web 框架
- **Serde** - 序列化/反序列化库

## 安装和运行

### 前置要求

1. **Node.js** (版本 16 或更高)
2. **Rust** (版本 1.70 或更高)
3. **Tauri CLI**

### 安装步骤

1. 克隆仓库：
   ```bash
   git clone <repository-url>
   cd LanDrop
   ```

2. 安装前端依赖：
   ```bash
   npm install
   ```

3. 安装 Tauri CLI：
   ```bash
   npm install -g @tauri-apps/cli
   ```

4. 运行开发服务器：
   ```bash
   npm run tauri dev
   ```

### 构建生产版本

```bash
npm run tauri build
```

构建完成后，可执行文件将位于 `src-tauri/target/release/` 目录中。

## 使用方法

1. **启动应用** - 在需要传输文件的设备上启动 LanDrop
2. **开始发现** - 点击"开始发现"按钮扫描局域网内的设备
3. **选择设备** - 在设备列表中选择目标设备
4. **传输内容**：
   - **文件传输**：点击"发送文件"按钮选择文件
   - **文本传输**：在文本传输页面输入内容并发送

## 网络协议

- **发现协议** - 使用 UDP 广播在端口 8889 进行设备发现
- **传输协议** - 使用 HTTP 在端口 8080 进行文件和文本传输
- **数据格式** - 使用 JSON 进行数据序列化

## 安全说明

- 应用仅在局域网内工作，不会向互联网发送数据
- 传输的文件会保存到系统默认的下载目录
- 建议仅在可信任的网络环境中使用

## 开发

### 项目结构

```
LanDrop/
├── src/                    # 前端源代码
│   ├── components/         # React 组件
│   │   ├── discovery.rs   # 设备发现服务
│   │   ├── transfer.rs    # 文件传输服务
│   │   ├── types.rs       # 数据类型定义
│   │   └── main.rs        # 应用入口
│   ├── types.ts           # TypeScript 类型定义
│   ├── App.tsx            # 主应用组件
│   └── main.tsx          # 应用入口
├── src-tauri/             # 后端源代码
│   ├── src/               # Rust 源代码
│   │   ├── discovery.rs   # 设备发现服务
│   │   ├── transfer.rs    # 文件传输服务
│   │   ├── types.rs       # 数据类型定义
│   │   └── main.rs        # 应用入口
│   ├── Cargo.toml         # Rust 依赖配置
│   └── tauri.conf.json    # Tauri 配置
└── package.json           # 前端依赖配置
```

### 开发命令

- `npm run dev` - 启动前端开发服务器
- `npm run build` - 构建前端
- `npm run tauri dev` - 启动 Tauri 开发模式
- `npm run tauri build` - 构建生产版本

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

[MIT License](LICENSE) 