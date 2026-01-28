# Gemini-Image-Tools (Gemini 绘图工作站)

Gemini-Image-Tools 是一个基于 OpenAI 协议标准构建的专业图像生成 Web 应用程序。它专为 **Gemini 3 Pro** 等图像生成模型设计，提供企业级的反向代理网关支持及卓越的用户交互体验。

## 🌟 核心特性

- **极致 UI/UX**：采用 Apple 设计语言，极致扁平化风格，支持 **原生黑暗模式**。
- **高性能协议转换**：将 OpenAI 格式的图像生成请求无缝转发至 Gemini Chat 协议后端，支持 `extra_body` 中的 `size` 参数。
- **多任务并行处理**：支持 1 至 16 路任务并行生成，每路任务拥有独立的进度状态及重试逻辑。
- **生产力工具集**：
    - **提示词增强 (Sparkles ✨)**：集成 AI 提示词优化，自动扩充描述细节。
    - **历史创意库**：后端持久化存储所有生成记录，支持按提示词分组查看。
    - **一键打包下载**：支持将一组生成任务的所有图像实时打包为 ZIP 导出。
- **深度配置管理**：支持通过 Web 界面动态调整代理地址、API Key、超时时间及最大重试次数，所有设置即时保存至本地 `config.json`。
- **本地化存储**：生成的图像自动保存至服务器本地，通过 UUID 命名，确保数据隐私与持久化。

## 🛠️ 技术栈

- **前端**: React 19, TypeScript, Tailwind CSS, Framer Motion (动效), Sonner (消息)
- **后端**: Rust (Axum, Tokio), Reqwest, Zip-rs
- **协议**: OpenAI Chat Completions 兼容协议

## 🚀 快速开始

### 环境要求
- [Rust](https://rustup.rs/) (最新稳定版)
- [Node.js](https://nodejs.org/) (v18+)

### 一键启动 (Windows)
直接双击根目录下的 `start_all.bat`，脚本将自动编译并启动前后端服务。

### 手动运行
1. **后端**:
   ```bash
   cd backend
   cargo run --release
   ```
2. **前端**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## ⚙️ 配置说明

首次启动后，可以通过前端右上角的 **“设置”** 面板进行高级配置：
- **Primary Endpoint**: 您的 Gemini 代理地址 (例如 `http://127.0.0.1:8045/v1`)。
- **Advanced Control**: 设置单次请求超时（建议 300s）和最大重试策略。

## 📦 容器化部署

项目已内置 Docker 支持：
```bash
docker-compose up -d
```

---

**Gemini-Image-Tools** - 让创意捕捉更坚韧、更优雅。
