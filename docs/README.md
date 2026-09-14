# AstroLib 开发与架构文档中心

本文档目录收录了 AstroLib（面向大学理工科教材与学术资料的数字化阅读与自测系统）的开发指南、贡献规程与核心架构设计交接文档。

---

## 1. 核心开发与贡献指南

### 1.1 概览
- [**项目概览**](./01-overview.md)：系统定位与 6 大核心优势（Material You 排版、印刷级 LaTeX 导出、离线 EPUB3 打包、配套习题册、跨页知识网络、Agent MCP 工具链融合 AI 问答）。

### 1.2 快速入门
- [**doc1: 本地部署与运行**](./quickstart/01-deployment-and-running.md)：运行环境要求、依赖安装、前台/后台守护开发服务启动与生产打包预览。
- [**doc2: 脚本列表与说明**](./quickstart/02-all-runnable-scripts.md)：全站 npm 命令速查与 `scripts/` 构建、校验、抽取工具分类说明。
- [**doc3: 添加新书**](./quickstart/03-add-new-book.md)：目录规范、MDX 章节结构、语义卡片使用准则、中央书库注册与语法校验。
- [**doc4: 加入习题册**](./quickstart/04-add-exercise-booklet.md)：题目数据 Schema 规范、KaTeX 预编译流水线、章节触发器挂载与验证。

### 1.3 贡献指南
- [**doc1: 贡献新书：AI 数据清洗**](./contributing/01-contribute-book-ai-cleaning.md)：以扫描原图为唯一真实源，利用 Gemma 4 26B 与 Gemini 3.5 Flash Lite 进行视觉重构；附生产级脚本与 Prompt 模版。
- [**doc2: 贡献勘误**](./contributing/02-contribute-errata.md)：使用内置工具进行教材正文一键选行勘误（`Alt+F`）与真题题库题目报错。
- [**doc3: 贡献 AI 题解**](./contributing/03-contribute-ai-solutions.md)：调用本地模型生成规范推导、审阅与多端对照，并将高质量题解共享至社区题库。

### 1.4 附加说明
- [**doc1: AI 模型 API Key 申请与配置**](./advanced/01-ai-api-keys-setup.md)：Google Gemini（含代理环境说明）、DeepSeek（国内直连）及自定义 OpenAI 兼容端点配置。
- [**doc2: MCP 工具链与 RAG 架构**](./advanced/02-mcp-and-rag-deep-dive.md)：基于 Model Context Protocol 的 8 个端侧工具规格与抗幻觉证据链工作原理。
- [**doc3: 环境配置与常见问题**](./advanced/03-local-env-setup-troubleshooting.md)：Windows 脚本策略、sharp 镜像源、Git 换行符与 Node 内存配额排坑。
- [**doc4: MDX 编辑模式与模块检查**](./advanced/04-developer-mode-and-inspection.md)：基于 Vite 的浏览器双向源码回写与全书模块结构健康度检查。
- [**doc5: Git 提交规范与代码同步**](./advanced/05-academic-git-and-dual-push.md)：学术级 Commit Specification 约束与双轨自动脱敏推送流水线。

---

## 2. 核心架构与专项技术交接

| 文档名称 | 核心主题与说明 | 关联代码模块 |
| :--- | :--- | :--- |
| [Material-You主题改造交接文档.md](./Material-You主题改造交接文档.md) | **UI/UX 核心设计规范**：优先官方 `@material/web` 组件、Filter Chips、Outlined Text Field、无边框 Filled Tonal 卡片与学术排版准则。 | `src/themes/material-you/`<br>`src/components/FeatureToggles.astro` |
| [AI问答Material-You重构与设置收敛交接文档.md](./AI问答Material-You重构与设置收敛交接文档.md) | **AI 问答交互架构**：Harness 调用树收敛、公式原生排版、三向自由缩放、设置项收拢与 M3 胶囊输入。 | `src/ai/client/chat-controller.ts`<br>`src/ai/ai-config.ts` |
| [侧载系统架构与扩展交接文档.md](./侧载系统架构与扩展交接文档.md) | **Sideload Dock 侧载底座**：大纲、习题、AI 统一宿主、SideloadManager 单例状态机与多视口自适应联动。 | `src/components/sideload/`<br>`src/components/PageSidebarOverride.astro` |
| [特性模块与插件系统.md](./特性模块与插件系统.md) | **Feature Registry 架构**：功能统一声明、构建期动态装配与零打包开销控制。 | `src/config/features.config.mjs`<br>`astro.config.mjs` |
| [AI 赋能模块设计.md](./AI%20赋能模块设计.md) | **AI 工具链与 RAG 规范**：全量 8 个端侧 MCP 工具定义、Prompt 串联链条与请求处理流。 | `src/ai/mcp/`<br>`src/ai/tools-client.mjs` |
| [文章切换性能优化交接文档.md](./文章切换性能优化交接文档.md) | **跨页引用与 SPA 性能**：正文引用徽章从客户端识别下沉至编译期 Rehype 插件的技术细节。 | `src/utils/rehype-cross-ref.mjs` |
| [精修工具交接.md](./精修工具交接.md) | **在线 MDX 可视化精修**：源码位置 AST 标记注入与 Vite 开发服务器写回端点设计。 | `src/utils/mdx-editor/` |
| [模块查重与巡检工具.md](./模块查重与巡检工具.md) | **全书模块巡检与查重**：模块集中索引、同章查重与异常拆分定位。 | `src/utils/module-inspector/` |
| [大邮数学集题库结构化与分章习题交接文档.md](./大邮数学集题库结构化与分章习题交接文档.md) | **真题题库抽取与分章习题**：173 套试卷结构化解析、LaTeX 公式平衡与分章自测页集成。 | `scripts/lib/math_archive/`<br>`src/data/exercises/` |
| [Gemma4原书扫描全视觉推倒重建与全书构建流水线交接文档.md](./Gemma4原书扫描全视觉推倒重建与全书构建流水线交接文档.md) | **原书全视觉推倒重建流水线**：以原书 PDF 物理扫描页为 Ground Truth，采用 `gemma-4-26b-a4b-it` 进行流式端到端视觉重构与验证体系。 | `scripts/vision_reconstruct/`<br>`src/content/docs/collections/math/` |

---

## 3. 历史归档说明 (Archive)

- [**docs/archive/legacy-vitepress/README.md**](./archive/legacy-vitepress/README.md)：早期 VitePress 风格历史文档已全面封存，当前全站统一以 Material You (Material 3) 规范为准。
