# Gemini-Drafting-Factory (Gemini 绘图工厂) - 项目指南

这是一个基于 OpenAI API 协议规范开发的图像生成 Web 应用程序，旨在利用 Gemini Pro 的图像生成能力，并通过 Rust 后端提供企业级的网关功能。

## 项目概览

- **核心目的**: 提供一个快速、可并行、符合 OpenAI 协议的图像生成界面。
- **技术栈**:
    - **前端**: React (TypeScript), Vite, Tailwind CSS, Lucide React.
    - **后端**: Rust (Axum, Tokio, Reqwest).
    - **存储**: 本地文件系统存储生成的图像。

## 目录结构

- `backend/`: Rust 后端代码。
    - `src/main.rs`: 服务入口及路由定义。
    - `src/models/`: 数据模型（OpenAI 协议兼容结构）。
    - `src/storage/`: 图像下载与存储逻辑。
    - `src/middleware/`: 鉴权、限流、重试等中间件。
- `frontend/`: React 前端代码。
    - `src/App.tsx`: 主界面逻辑。
    - `src/components/`: UI 组件。
- `storage/`: 默认生成的图像存储目录。

## 运行与构建

### 后端 (Rust)
- **运行**: `cd backend && cargo run`
- **配置**: 初次运行后会生成 `config.json`，可配置代理地址、API Key、端口及存储路径。
- **依赖**: 需要安装 Rust 运行环境。

### 前端 (React)
- **安装依赖**: `cd frontend && npm install`
- **运行**: `npm run dev`
- **构建**: `npm run build`

## 开发规范

1. **协议兼容性**: 后端必须保持与 OpenAI `/v1/images/generations` 接口的输入输出格式一致。
2. **并行处理**: 前端需支持用户配置并行任务数（4-16路），并实时展示进度。
3. **本地化**: 所有生成的图片必须经过后端下载并存储在本地 `storage` 目录，前端通过后端映射的 `/images` 路径访问。
4. **代码风格**:
    - 前端使用 TypeScript 强制类型检查。
    - 后端使用 Rust 的异步模型（Tokio）。

## 待办事项 (TODO)

- [ ] 后端：实现 `models` 模块（目前 `main.rs` 中引用但未定义）。
- [ ] 后端：实现 `storage` 模块（图像下载保存逻辑）。
- [ ] 前端：安装并配置 Tailwind CSS 和 Lucide React。
- [ ] 前端：实现卡片式并行任务管理 UI。
- [ ] 前端：增加后端配置管理界面。
