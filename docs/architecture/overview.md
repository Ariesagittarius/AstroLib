# AstroLib 架构总览 (Overview)

> 本文档为 AstroLib (my-astro-site) 项目的架构考古调查成果。
> 调查原则：**只调查，不修改**。严格保持源代码、配置文件、目录结构与数据完整性。

---

## 1. 系统定位与本质

表面上，AstroLib 呈现为一个基于 **Astro 7.0 + Starlight 0.41** 构建的现代数学与物理大学教材/教辅数字化静态文档网站。

然而，通过架构深度考古分析，AstroLib **实际上是一个高度集成、涵盖 11 个独立子系统的多格式学术出版与交互学习平台**：

```
                              ┌───────────────────────────────────────────────────────────┐
                              │                 AstroLib Platform Core                    │
                              └─────────────────────────────┬─────────────────────────────┘
                                                            │
         ┌──────────────────┬──────────────────┬────────────┴───────┬──────────────────┬──────────────────┐
         ▼                  ▼                  ▼                    ▼                  ▼                  ▼
┌─────────────────┐┌─────────────────┐┌─────────────────┐┌──────────────────┐┌─────────────────┐┌─────────────────┐
│ 1. 教材阅读与卡片 ││ 2. SPA无刷导航 ││ 3. 双向跨页引用 ││ 4. 章节关系图谱  ││ 5. 题库自测系统 ││ 6. 多格式导出    │
│    MDX / KaTeX  ││    DOM 缓存/微调 ││    构建索引/Chip││    ECharts 拓扑  ││    Modal/云编译  ││    EPUB/Typst/TeX│
└─────────────────┘└─────────────────┘└─────────────────┘└──────────────────┘└─────────────────┘└─────────────────┘
         ▼                  ▼                  ▼                    ▼                  ▼                  ▼
┌─────────────────┐┌─────────────────┐┌─────────────────┐┌──────────────────┐┌─────────────────┐
│ 7. 在线精修编辑器││ 8. 卡片巡检工具 ││ 9. AI RAG 问答 ││ 10. 读者勘误反馈 ││ 11. 双仓发布脱敏│
│    Vite API / AST││    查重与全局检索││    BYOK / MCP   ││    Worker / Issue││    注释剥离流水线│
└─────────────────┘└─────────────────┘└─────────────────┘└──────────────────┘└─────────────────┘
```

---

## 2. 独立子系统清单与职责解析

### 2.1 数字化教材与教辅卡片排版系统 (Textbook Reading & Pedagogical Cards)
- **核心定位**：全站内容呈现基石，服务严谨学术阅读。
- **技术栈**：Astro Content Collections、MDX、KaTeX、Unified / Remark / Rehype。
- **关键组件与模块**：
  - 卡片组件库：`src/components/` 目录下的 14 种教辅结构化卡片（`Example.astro`, `Knowledge.astro`, `Method.astro`, `Summary.astro`, `Variant.astro`, `Note.astro`, `Block.astro`, `Solution.astro`, `DigitalResource.astro`, `QRCodeVideo.astro` 等）。
  - 数学公式增强：`rehypeKatexAnnotate` 与 `rehypeKatexPromote`（`src/utils/rehype-katex-source.mjs`）构建期向公式节点注入 `data-latex` 源码；`rehypeMathPromote` 智能提升漏网单字母变量；KaTeX 配置强制使用 `output: 'html'`，彻底消除 MathML 重复标签，削减页面体积 50%。
  - 全书多合集中央配置：`src/config/collections.config.mjs` 作为唯一的书籍元数据、合集结构与卡片样式映射源。

### 2.2 离屏预处理与不可变 SPA 极速导航引擎 (SPA Navigation & Offscreen Preprocessing)
- **核心定位**：打破常规静态多页应用的白屏与闪烁，实现毫秒级即时页面切换与布局零抖动。
- **技术栈**：原生 DOM 操作、DOMParser、LRU 内存缓存、History API。
- **关键模块**：
  - `src/components/SidebarOverride.astro`（行 154-919）：拦截全站内链点击，维护容量为 5 页的母版 DOM LRU 缓存（`pageCache`），实现请求去重（`inFlightRequests`）、顶栏微光进度条、以及 `.main-pane` / `.right-sidebar-panel` 的精确置换。
  - `src/utils/page-preprocess.ts`：在 DOMParser 解析出离屏节点、尚未挂载至文档树前，同步完成选择题选项格式化、引用徽章箭头占位插入、行内公式操作栏宿主包裹，将重排（Reflow）消耗彻底阻隔在离屏状态。
  - `src/components/sidebar/`：包含动态目录生成（`toc-generator.ts`）、滚动高亮监听（`scroll-spy.ts`）、平滑跳转（`jump-navigator.ts`）。

### 2.3 跨页双向学术引用联动系统 (Cross-Reference & Citation Subsystem)
- **核心定位**：在大型科学文献与教材中，建立“例题 x.y / 图 a-b / 定理 c.d”的自动化双向跳转与悬浮即时预览。
- **技术栈**：构建期 AST 下沉插件、懒加载 JSON 索引、客户端 Popover。
- **关键模块**：
  - `src/utils/cross-ref-indexer.mjs`：扫描全书卡片与图表编号，提取目标章节、标题与锚点。
  - `scripts/build-cross-ref-data.mjs`：构建前将索引预编译为 `public/data/cross-ref/<col>-<book>.json`。
  - `src/utils/rehype-cross-ref.mjs`：编译期扫描正文文本，将“例题 1.2”等文本直接替换为带有元数据的静态引用徽章（`<span class="block-ref-badge">`），实现客户端切换零扫描。
  - `src/components/sidebar/cross-ref-client.ts`：客户端按需异步拉取当前书籍的索引 JSON，挂载悬浮卡片微弹窗与跳转定位。

### 2.4 章节内联关系与全书知识图谱系统 (Knowledge Relation Graph)
- **核心定位**：通过跨章引用与知识流动网络，可视化展现全书章节间的依赖拓扑与思维导图。
- **技术栈**：ECharts、Force Directed Graph、Tree Map、Vite Dev Server 中间件。
- **关键模块**：
  - `src/utils/relation-graph/generator.mjs`：基于 cross-ref 索引计算章节入度、出度与引用权重。
  - `scripts/build-relation-graphs.mjs`：预生成 `public/relation-graphs/<col>-<book>.json`。
  - `src/utils/relation-graph/dev-server-plugin.mjs`：dev 模式下拦截 `/__relation_graph__/*`，提供实时扫描。
  - `src/components/BookRelationGraph.astro` + `src/utils/relation-graph/relation-graph-client.ts`：全屏交互式拓扑图对话框。

### 2.5 习题真题自测与试卷系统 (Interactive Exercise & Past Exam System)
- **核心定位**：提供大学数学（以工科数分、《大邮数学集》为主）真题自测、课后练习做题、整卷试卷模式与社区题解。
- **技术栈**：静态数据分片、KaTeX 离线预编译、IndexedDB、GitHub Actions 云编译。
- **关键模块**：
  - 数据核心：`src/data/exercises/` 内存储 14MB+ 题库数据与 175 套原始试卷。
  - 预编译器：`scripts/build-exercise-data.mjs` 将 LaTeX 题目静态预渲染为 HTML，输出至 `public/data/exercises/engineering_analysis/`。
  - 控制器与交互界面：`src/components/exercises/exercise-controller.ts`（**114 KB**，超 3000 行的巨型单体控制器）与 `src/components/exercises/ExerciseModal.astro`（**48 KB**）。
  - 本地开发服务插件：`src/utils/exercise-editor/dev-server-plugin.mjs`，暴露 `/api/exercise/*`，支持运行时热保存题库 JSON。

### 2.6 多格式学术出版物导出系统 (EPUB / LaTeX / Typst Export Subsystem)
- **核心定位**：一套 MDX/JSON 源码，多端输出（网页版、离线 EPUB3、LaTeX 试卷 PDF、Typst 讲义 PDF）。
- **技术栈**：
  - EPUB：`scripts/generate-epub.mjs`, `scripts/epub/mdx-pipeline.mjs`, `scripts/epub/zip.mjs`。
  - LaTeX：`src/utils/latex/latex-generator.ts`，基于 `Jinwen-XU/homework` / `ctex` 宏包模板；搭配 `src/utils/latex/latex-cloud-compiler.ts`，通过浏览器直接调度 GitHub Actions（`.github/workflows/compile-latex.yml`）进行免费无服务器 XeLaTeX 云端编译并下载 Release 资产。
  - Typst：`src/utils/typst/typst-generator.ts`，调用 `@myriaddreamin/typst-ts-node-compiler` 进行高速本地编译。
  - 公式导出：`src/scripts/formula/exporter.ts`，支持网页行内/块级公式一键复制 LaTeX 源码及导出高清矢量 SVG / PNG。

### 2.7 在线可视化 MDX 精修编辑器 (In-Browser MDX Editor, Dev-Only)
- **核心定位**：开发环境下在真实渲染网页中直接点选段落/公式/卡片，进行可视化编辑并直接写回本地 MDX 源码。
- **技术栈**：Vite Connect Middleware、Unified / Remark-MDX / Unist AST 转换、Contenteditable。
- **关键模块**：
  - `src/utils/rehype-editor-annotate.mjs`：编译期注入源码文件绝对路径与行列号（`data-src-file`, `data-src-line`）。
  - `src/utils/mdx-editor/dev-server-plugin.mjs`：Vite 插件，接管 `/__edit__/*` 端点（绕过 Astro 预渲染中间件的 query/body 丢失缺陷）。
  - `src/utils/mdx-editor/apply-op.mjs`：AST 级精准定位、修改与增量写盘，并自动写入 `.backups/` 备份。
  - `src/components/EditorMode.astro` + `src/utils/editor.ts`（**69 KB**）：浏览器端悬浮操作栏、源码对比与热保存。

### 2.8 书籍模块巡检与查重系统 (Module Inspector & Deduplication)
- **核心定位**：全书卡片模块（例题、定理、方法等）全局速查、同章重名编号冲突检测与结构审查。
- **技术栈**：Node 文件系统正则扫描、Vite 插件、静态数据构建。
- **关键模块**：
  - `src/utils/module-inspector/scanner.mjs` + `scripts/build-inspector-data.mjs`。
  - `src/utils/module-inspector/dev-server-plugin.mjs`：提供 `/__inspector__/*` 实时接口。
  - `src/components/ModuleInspector.astro` + `src/utils/module-inspector/inspector.ts`（**48 KB**）。

### 2.9 AI 书内检索问答 (RAG) 与 MCP 工具系统 (AI In-Book QA & MCP)
- **核心定位**：以书籍正文为知识库，提供按书隔离的离线切片检索与客户端 BYOK（自带 Key）流式问答，并提供标准 MCP 服务端。
- **技术栈**：BM25 关键词检索、OpenAI 兼容协议 SSE 流式解析、Model Context Protocol (MCP)。
- **关键模块**：
  - 构建期：`scripts/build-ai-index.mjs` -> `src/ai/chunker.mjs` + `src/ai/indexer.mjs` -> `public/ai-index/<col>-<book>.json`。
  - 客户端：`src/components/ai/` + `src/ai/client/chat-controller.ts`（**51 KB**），浏览器直连 DeepSeek / OpenAI 端点。
  - MCP 服务端：`src/ai/mcp/server.mjs` + `src/ai/mcp/tools.mjs`，对外暴露书籍目录与片段检索工具。

### 2.10 读者段落级勘误反馈系统 (Reader Errata Feedback)
- **核心定位**：读者选中文本或按下快捷键 `Alt+F`，自动捕获当前书籍、章节、段落、选区文字，向 Cloudflare Worker 代理或 GitHub 提交结构化 Issue。
- **技术栈**：DOM Range API、Serverless Worker API、GitHub Issue URL 预填。
- **关键模块**：`src/components/FeedbackMode.astro`、`src/utils/feedback/feedback-controller.ts`、`scripts/feedback-bot-worker.mjs`。

### 2.11 双仓发布脱敏与 Git 运维流水线 (Dual-Repo Distribution Pipeline)
- **核心定位**：保障本地与私有仓库保留完整架构注释与 agent/skill 资产，同时全自动化生成面向开源公共仓库的纯净、脱敏提交。
- **技术栈**：Babel / Acorn 语法树分析、Git 管道命令、Conventional Commit 规范。
- **关键模块**：`scripts/git-clean-push.mjs`、`scripts/lib/comment-stripper.mjs`、`scripts/one-click-push.mjs`、`scripts/validate-commit-msg.mjs`。

---

## 3. 架构设计哲学与运行层级

AstroLib 在宏观设计上贯彻了两大核心设计哲学：

1. **“内容即界面”（The Content is the Interface）**：
   - 遵循极简学术排版哲学，严禁 SaaS 软件式的进度条、打卡激励、徽章积分与多余装饰，强调负空间与排版韵律。
2. **“全站功能开关注册表”（Feature Registry Pattern）**：
   - 全站所有功能在 `src/config/features.config.mjs` 中集中声明（15 项特性）。
   - 在构建期（`astro.config.mjs`）按开关状态**动态拼装**插件、CSS、组件；关闭某功能时，其打包代码、CSS、生成脚本彻底归零，保证生产产物无冗余。

```
                               ┌─────────────────────────────┐
                               │  features.config.mjs        │
                               │  (全站唯一特性开关注册表)      │
                               └──────────────┬──────────────┘
                                              │
                      ┌───────────────────────┼───────────────────────┐
                      ▼                       ▼                       ▼
            [构建层 (Build-time)]     [服务层 (Dev Server)]     [运行层 (Runtime UI)]
            · remark/rehype 插件      · Vite /__edit__/*      · Astro 组件按需渲染
            · customCss 打包导入       · Vite /api/exercise/*  · 读者客户端工具条
            · 预构建 JSON 索引脚本     · Vite /__inspector__/* · 浏览器端功能懒加载
```
