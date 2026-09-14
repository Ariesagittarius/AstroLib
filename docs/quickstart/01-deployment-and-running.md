# 本地部署与运行

本文档指导如何在本地开发环境中搭建并运行 AstroLib。

---

## 1. 环境准备

在开始之前，请确认您的系统已安装以下基础运行环境：

| 依赖项 | 最低版本要求 | 推荐版本 | 说明 |
| :--- | :---: | :---: | :--- |
| **Node.js** | `>= 20.0.0` | `v20.x LTS` 或 `v22.x LTS` | Astro 7 与 Vite 编译环境必须 |
| **npm** | `>= 10.0.0` | 自带最新版 | 推荐使用 npm，与项目 `package-lock.json` 保持锁定一致 |
| **Git** | `>= 2.30.0` | 最新版 | 用于源码版本控制与双轨推送 |
| **Python**（可选） | `>= 3.9` | `3.10+` | 仅在运行离线原书切页或题库清洗算法脚本时需要 |

---

## 2. 代码拉取与依赖安装

### 2.1 克隆仓库
```bash
git clone https://github.com/Ariesagittarius/AstroLib.git
cd AstroLib
```

### 2.2 安装 Node 依赖
```bash
npm install
```

> [!NOTE]
> 项目依赖 `sharp` 图像处理库用于封面生成与图片优化。在部分 Windows 网络环境下，若 `sharp` 原生预编译包下载较慢，可设置镜像源加速：
> ```bash
> npm config set sharp_binary_host "https://npmmirror.com/mirrors/sharp"
> npm install
> ```

---

## 3. 本地运行开发服务器

AstroLib 支持前台交互运行与后台守护进程运行两种模式。

### 方式 A：前台运行（常规模式）
```bash
npm run dev
```
启动后终端将输出访问地址，在现代浏览器中打开：
```text
http://localhost:4321
```

### 方式 B：后台守护模式（推荐）
若希望开发服务在后台静默运行而不占用当前终端，可使用 Astro 官方后台指令：

```bash
# 启动后台守护进程
npx astro dev --background

# 查看运行状态与监听端口
npx astro dev status

# 查看实时输出日志
npx astro dev logs

# 安全停止后台服务（基于 .astro/dev.json PID 锁）
npx astro dev stop
```

---

## 4. 生产构建与本地预览

AstroLib 为纯静态站点生成（SSG）架构。生产构建会先执行离线数据预编译，再生成最终静态 HTML。

### 4.1 执行全量构建
```bash
npm run build
```

该命令将按序自动触发以下步骤：
1. `build-exercise-data.mjs`：题库数据预处理与 KaTeX HTML 静态预编译；
2. `build-ai-index.mjs`：全站章节切片与语义检索索引生成；
3. `build-relation-graphs.mjs`：全书知识卡片网络图谱拓扑计算；
4. `build-cross-ref-data.mjs`：跨章节公式与定理交叉引用元数据提取；
5. `build-inspector-data.mjs`：书籍模块巡检与查重索引构建；
6. `astro build`：全站页面静态渲染输出至 `dist/` 目录。

### 4.2 本地预览生产构建产物
```bash
npm run preview
```
启动一个本地静态 HTTP 服务，用于验证打包后的静态站点行为。

---

## 5. 环境变量说明（可选）

本项目绝大部分功能（全书阅读、公式渲染、习题自测、LaTeX 导出、EPUB 打包）均为纯端侧与静态运行，**默认无需配置任何环境变量即可完整使用**。

仅在执行特定离线处理或测试时可选配置以下变量（支持写入根目录 `.env` 文件）：

```env
# 运行离线多模态视觉重建或题库清洗时调用
GEMINI_API_KEY=your_gemini_api_key_here

# 本地 MCP 工具需要调用 Python 时指定 Python 解释器路径（默认 python）
AI_PYTHON=python
```
