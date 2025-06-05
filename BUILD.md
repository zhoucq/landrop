# LanDrop 构建指南

本文档介绍如何为不同操作系统构建 LanDrop 应用程序。

## 前置条件

在开始构建之前，请确保安装以下软件：

1. **Node.js** (v16 或更高版本)
2. **Rust** (推荐使用 rustup 安装)
3. **Tauri CLI**：`npm install -g @tauri-apps/cli`
4. 各平台的构建工具
   - **Windows**: Visual Studio 构建工具
   - **macOS**: Xcode Command Line Tools
   - **Linux**: 开发工具包 (gcc, libwebkit2gtk, etc.)

## 通用构建步骤

无论目标平台是什么，以下步骤都是通用的：

```bash
# 1. 克隆仓库
git clone <repository-url>
cd LanDrop

# 2. 安装依赖
npm install

# 3. 构建前端（不是必需的，但可以单独测试前端）
npm run build
```

## 构建 macOS 版本

### 构建 Apple Silicon (M1/M2) 版本

```bash
npm run tauri build
```

构建完成后，可在以下位置找到生成的文件：
- `.app` 文件: `src-tauri/target/release/bundle/macos/LanDrop.app`
- `.dmg` 文件: `src-tauri/target/release/bundle/dmg/LanDrop_0.1.0_aarch64.dmg`

### 构建 Intel (x86_64) 版本

首先需要添加目标平台：

```bash
rustup target add x86_64-apple-darwin
```

然后构建：

```bash
npm run tauri build -- --target x86_64-apple-darwin
```

### 构建通用二进制文件 (Universal Binary)

首先需要添加目标平台：

```bash
rustup target add x86_64-apple-darwin
```

然后构建：

```bash
npm run tauri build -- --target universal-apple-darwin
```

## 构建 Windows 版本

### 构建 x64 版本

在 Windows 机器上执行：

```bash
npm run tauri build
```

或者如果你在其他平台上交叉编译：

```bash
rustup target add x86_64-pc-windows-msvc
npm run tauri build -- --target x86_64-pc-windows-msvc
```

构建完成后，可在以下位置找到生成的文件：
- `.exe` 文件: `src-tauri/target/release/LanDrop.exe`
- 安装程序: `src-tauri/target/release/bundle/msi/LanDrop_0.1.0_x64_en-US.msi`

### 构建 x86 版本

```bash
rustup target add i686-pc-windows-msvc
npm run tauri build -- --target i686-pc-windows-msvc
```

## 构建 Linux 版本

### 构建 Debian/Ubuntu 版本

```bash
npm run tauri build
```

构建完成后，可在以下位置找到生成的文件：
- 可执行文件: `src-tauri/target/release/landrop`
- `.deb` 文件: `src-tauri/target/release/bundle/deb/landrop_0.1.0_amd64.deb`
- `.AppImage` 文件: `src-tauri/target/release/bundle/appimage/landrop_0.1.0_amd64.AppImage`

### 构建 Fedora/RHEL 版本

需要额外的RPM打包工具：

```bash
npm run tauri build
```

构建完成后，可在以下位置找到 `.rpm` 文件：
- `src-tauri/target/release/bundle/rpm/landrop-0.1.0-1.x86_64.rpm`

## 自定义构建选项

### 修改应用版本

编辑 `src-tauri/tauri.conf.json` 文件中的 `package.version` 字段。

### 自定义图标

替换 `src-tauri/icons` 目录中的图标文件。

### 签名应用程序

#### Windows 签名

在 `tauri.conf.json` 中配置：

```json
"bundle": {
  "windows": {
    "certificateThumbprint": "YOUR_CERT_THUMBPRINT",
    "timestampUrl": "http://timestamp.digicert.com"
  }
}
```

#### macOS 签名

在构建命令中添加签名选项：

```bash
npm run tauri build -- --sign
```

## 故障排除

### 构建失败：找不到目标

错误：`Target x86_64-apple-darwin is not installed`

解决方案：执行 `rustup target add x86_64-apple-darwin`

### 图标问题

如果出现图标相关错误，确保 `src-tauri/icons` 目录中存在所有必需的图标文件。

### Windows 构建问题

确保安装了Visual Studio 2019及以上版本，并且安装了"使用C++的桌面开发"组件。

### macOS 构建问题

确保安装了最新版本的Xcode Command Line Tools：`xcode-select --install` 