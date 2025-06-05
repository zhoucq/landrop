#!/bin/bash

echo "🚀 启动 LanDrop 开发环境..."

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查 Rust
if ! command -v rustc &> /dev/null; then
    echo "❌ Rust 未安装，请先安装 Rust"
    exit 1
fi

# 检查 Tauri CLI
if ! command -v tauri &> /dev/null; then
    echo "📦 安装 Tauri CLI..."
    npm install -g @tauri-apps/cli
fi

# 安装依赖
echo "📦 安装前端依赖..."
npm install

# 启动开发服务器
echo "🔥 启动开发服务器..."
npm run tauri dev 