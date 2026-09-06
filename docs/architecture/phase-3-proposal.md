# AstroLib 架构重构 Phase 3 提案：目录边界与关注点分离 (Directory Boundaries & Separation of Concerns)

> **当前阶段**：Phase 3 (Boundary Investigation & Directory Reorganization Proposal)  
> **执行状态**：**只调查，不移动，不修改。** 等待架构审阅。  
> **前序基准**：Phase 0 (Archaeology), Phase 1 (Safe Cleanup), Phase 2 (Decouple Publishing Types) 均已通过全量验证。

---

## 目录

1. [执行概要与核心原则](#1-执行概要与核心原则)
2. [Task 1: `src/utils/` 全量文件分类矩阵](#2-task-1-srcutils-全量文件分类矩阵)
3. [Task 2: 全局真实依赖拓扑与异常跨层诊断](#3-task-2-全局真实依赖拓扑与异常跨层诊断)
4. [Task 3: 三大核心运行环境边界划分](#4-task-3-三大核心运行环境边界划分)
5. [Task 4: 目录结构演进方案与目标拓扑](#5-task-4-目录结构演进方案与目标拓扑)
6. [Task 5: 迁移优先级、禁区与验证策略](#6-task-5-迁移优先级禁区与验证策略)

---

## 1. 执行概要与核心原则

在 Phase 2 中，我们完成了 `src/types/exercises.ts` 领域模型抽取，彻底消除了 LaTeX 与 Typst 编译器对前端 UI 控制器 (`exercise-controller.ts`) 的反向依赖。全站构建、LaTeX 导出、Typst 编译及 KaTeX 检查保持 100% 通过。

进入 **Phase 3**，核心矛盾聚焦于：**AstroLib 的源码目录边界严重失真，导致关注点混杂与运行环境穿透。**
最典型的现象是 `src/utils/` 沦为了容纳 30 个异构文件的 God Folder——它同时塞入了：
- AST 语法转换器与 Rehype 编译期插件；
- Node.js 本地文件扫描与代码修改引擎；
- Vite Dev Server 后端 HTTP 中间件；
- 浏览器端高复杂度 DOM / ECharts 交互控制器；
- 独立出版编译引擎与云端调度客户端；
- 纯无状态工具函数。

本提案严格遵循 **Rule 0（先保护行为，再改善结构）** 与 **Rule 1（禁止大爆炸式重构）**，旨在建立清晰的职责边界模型。

---

## 2. Task 1: `src/utils/` 全量文件分类矩阵

经过对 `src/utils/**` 目录下全部 30 个代码文件的语法分析、环境依赖检测（DOM / Node / Vite / AST）及全站被引用链路追踪，建立如下分类矩阵：

| 文件路径 | 文件大小 | 当前实际职责 | 运行环境 | 主要调用方 (Callers) | 规范归属 (Layer) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `src/utils/artistic-qr.mjs` | 18.2 KB | 基于数理制图学与笛卡尔坐标系的微型学术 SVG 矢量二维码生成算法 | Universal / SSR | `src/components/DigitalResource.astro` | **Domain / Infrastructure** (数理制图服务) |
| `src/utils/cross-ref-indexer.mjs` | 4.6 KB | 扫描 MDX 章节源码并提取定理、定义、例题等交叉引用全局锚点字典 | Build / Node | `scripts/build-cross-ref-data.mjs`<br>`src/utils/relation-graph/generator.mjs` | **Build / Processing** (编译期索引提取) |
| `src/utils/editor.ts` | 69.4 KB | MDX 在线富文本编辑器浏览器端控制器（处理选区、DOM 浮层、与中间件通信） | Browser Runtime | `src/components/EditorMode.astro` | **Client Runtime** (Feature: editor) |
| `src/utils/exercise-db/exercise-db-client.ts` | 10.2 KB | 读者社区题解与反馈数据持久化客户端（处理 Supabase REST / 本地 API / localStorage 离线降级） | Browser Runtime | `src/components/exercises/exercise-controller.ts` | **Data Access / Client** (Feature: exercises) |
| `src/utils/exercise-editor/dev-server-plugin.mjs` | 9.3 KB | Vite 开发服务器插件，拦截 `/api/exercise/*` 请求并写盘 JSON，同步拉起外部构建脚本 | Dev Server (Vite) | `astro.config.mjs` | **Dev Server** (Feature: exercises) |
| `src/utils/feedback/feedback-controller.ts` | 19.3 KB | 读者段落/公式勘误反馈客户端交互控制器（Alt+F 快捷键、高亮选择、弹窗采集与分发） | Browser Runtime | `src/components/FeedbackMode.astro` | **Client Runtime** (Feature: feedback) |
| `src/utils/feedback/format-issue.ts` | 6.1 KB | 勘误 GitHub Issue 文本模板组装、URL 编码器与 Worker Bot 代理转发函数 | Universal / Client | `src/utils/feedback/feedback-controller.ts` | **Domain / Client** (Feature: feedback) |
| `src/utils/latex/latex-cloud-compiler.ts` | 13.3 KB | 基于 GitHub Actions API 的 XeLaTeX 远程编译调度器（状态轮询、令牌管理、Release 下载） | Browser Runtime | `src/components/exercises/exercise-controller.ts` | **Publishing / Client** (云编译客户端) |
| `src/utils/latex/latex-generator.ts` | 20.8 KB | 生产级学术练习册/试卷 LaTeX 源码编译器（基于 Jinwen-XU/homework 宏包标准） | Universal (Pure) | `src/components/exercises/exercise-controller.ts`<br>`scripts/test-latex-export.mjs` | **Publishing** (Core Compiler) |
| `src/utils/mdx-editor/apply-op.mjs` | 28.5 KB | MDX 源码局部修改算子引擎（AST 节点增删改、行列偏移动态修正与 MDX 编译校验） | Build / Node | `src/utils/mdx-editor/dev-server-plugin.mjs`<br>`scripts/_test-ops.mjs` | **Build / Processing** (Feature: editor) |
| `src/utils/mdx-editor/dev-server-plugin.mjs` | 20.8 KB | Vite 开发服务器插件，提供 `/__edit__/*` REST API（读取源码、解析块、保存并安全备份） | Dev Server (Vite) | `astro.config.mjs` | **Dev Server** (Feature: editor) |
| `src/utils/mdx-editor/locate-block.mjs` | 4.6 KB | 根据块标识符 (blockId) 或物理行列坐标在 AST 中精准定位 MDX/JSX 节点 | Build / Node | `src/utils/mdx-editor/apply-op.mjs`<br>`src/utils/mdx-editor/dev-server-plugin.mjs` | **Build / Processing** (Feature: editor) |
| `src/utils/mdx-editor/parse.mjs` | 2.8 KB | 基于 unified + remark-parse + remark-mdx 构建的统一 MDAST 语法解析器 | Build / Node | `scripts/epub/mdx-pipeline.mjs`<br>`src/utils/mdx-editor/apply-op.mjs` 等 | **Build / Processing** (MDX AST Parser) |
| `src/utils/module-inspector/dev-server-plugin.mjs` | 2.4 KB | Vite 开发服务器插件，提供 `/__inspector__/*` 实时热重载端点 | Dev Server (Vite) | `astro.config.mjs` | **Dev Server** (Feature: inspector) |
| `src/utils/module-inspector/inspector.ts` | 48.8 KB | 教材结构化卡片巡检前端控制器（ECharts 指标统计、卡片类型筛选、源码段比对） | Browser Runtime | `src/components/ModuleInspector.astro` | **Client Runtime** (Feature: inspector) |
| `src/utils/module-inspector/scanner.mjs` | 22.6 KB | 递归扫描全站 6 部教材 MDX，正则与 AST 提取 14 种卡片分布、公式与文本指标 | Build / Node | `scripts/build-inspector-data.mjs`<br>`src/utils/module-inspector/dev-server-plugin.mjs` | **Build / Processing** (Feature: inspector) |
| `src/utils/page-preprocess.ts` | 4.1 KB | SPA 路由器切换阶段离屏 DOM 预处理（公式容器包裹、引用徽章箭头占位、选择题排版） | Browser Runtime | `src/components/SidebarOverride.astro` | **Client Runtime** (DOM Preprocessor) |
| `src/utils/rehype-cross-ref.mjs` | 23.8 KB | Rehype 编译期 AST 插件：静态识别并下沉“例题 1.74 / 图 3-48”为交互徽章结构 | Build / Processing | `astro.config.mjs`<br>`scripts/test-crossref.mjs`<br>`src/ai/chunker.mjs` | **Build / Processing** (Rehype Plugin) |
| `src/utils/rehype-editor-annotate.mjs` | 4.0 KB | Rehype AST 插件（仅 dev 生效）：遍历 HTML 节点并自动注入源码位置属性 | Build / Processing | `astro.config.mjs` | **Build / Processing** (Rehype Plugin) |
| `src/utils/rehype-image-blur.mjs` | 4.5 KB | Rehype AST 插件：构建期通过 sharp 读取图片，生成极简 Base64 LQIP 模糊占位并防抖 | Build / Processing | `astro.config.mjs`<br>`scripts/scan-mdx.mjs` | **Build / Processing** (Rehype Plugin) |
| `src/utils/rehype-katex-source.mjs` | 4.2 KB | Rehype AST 插件：在 KaTeX 渲染前后捕获原始 LaTeX 文本并存入 `data-latex` | Build / Processing | `astro.config.mjs`<br>`scripts/test-crossref.mjs` | **Build / Processing** (Rehype Plugin) |
| `src/utils/rehype-math-promote.mjs` | 5.7 KB | Rehype AST 插件：构建期自动识别漏网的单字母变量及简式并提升为标准公式节点 | Build / Processing | `astro.config.mjs` | **Build / Processing** (Rehype Plugin) |
| `src/utils/rehype-mermaid.mjs` | 2.4 KB | Rehype AST 插件：拦截 `pre.mermaid` 代码块并重写为 `.mermaid-container` DOM 结构 | Build / Processing | `astro.config.mjs` | **Build / Processing** (Rehype Plugin) |
| `src/utils/relation-graph/dev-server-plugin.mjs` | 2.3 KB | Vite 开发服务器插件，提供 `/__relation_graph__/*` 实时图谱拓扑数据 API | Dev Server (Vite) | `astro.config.mjs` | **Dev Server** (Feature: relation-graph) |
| `src/utils/relation-graph/generator.mjs` | 19.3 KB | 扫描全量教材正文与交叉引用，计算知识模块关联、前驱后继网络与图谱拓扑矩阵 | Build / Node | `scripts/build-relation-graphs.mjs`<br>`src/utils/relation-graph/dev-server-plugin.mjs` | **Build / Processing** (Feature: relation-graph) |
| `src/utils/relation-graph/relation-graph-client.ts` | 29.3 KB | 知识关系图谱前端弹窗控制器（ECharts 力导向图渲染、节点下钻、高亮搜索） | Browser Runtime | `src/components/BookRelationGraph.astro` | **Client Runtime** (Feature: relation-graph) |
| `src/utils/render-title.mjs` | 3.4 KB | 构建期与 SSR 阶段解析卡片标题中的 `$公式$`，并使用 KaTeX 预渲染为安全 HTML | Universal / SSR | 12 个卡片组件 (`Example.astro` 等)<br>`PageTitleOverride.astro` | **UI Helper** (Title Math Processor) |
| `src/utils/sidebar.mjs` | 3.1 KB | **复合型文件**：包含 `naturalSort` (自然排序)、`cleanSlug` (路由净化) 与 `generateBookSidebar` (Node 目录递归读取) | Mixed (Node + Pure) | `astro.config.mjs`<br>`src/pages/*`<br>`src/ai/*`<br>全站链接生成 | **Domain / Processing** (需解构拆分) |
| `src/utils/src-attrs.mjs` | 0.5 KB | 极简无状态辅助函数：从组件 props 中安全提取 `data-src-*` 属性并展开至卡片根节点 | Universal / SSR | 12 个卡片组件 (`Example.astro` 等) | **UI Helper** (Card Prop Helper) |
| `src/utils/typst/typst-generator.ts` | 39.8 KB | （封存归档）将题库结构化数据编译为 Typst 标记语言文档 | Universal (Pure) | `scripts/test-typst-export.mjs` | **Publishing** (Archived Compiler) |

---

## 3. Task 2: 全局真实依赖拓扑与异常跨层诊断

通过对全站模块引用关系的真实静态扫描，识别出以下典型的反向依赖与架构越层：

### 3.1 `src/utils/` 与 `src/components/` 的双向缠绕

```text
┌─────────────────────────────────┐                 ┌────────────────────────────────┐
│         src/components/         │                 │           src/utils/           │
│                                 │                 │                                │
│  SidebarOverride.astro          │── imports ─────▶│  page-preprocess.ts            │
│                                 │                 │    │                           │
│  sidebar/question-formatter.ts  │◀── imports ─────┼────┘  (⚠️ 反向依赖 UI 私有文件)  │
│                                 │                 │                                │
│  EditorMode.astro               │── imports ─────▶│  editor.ts (69 KB 控制器)      │
│  ModuleInspector.astro          │── imports ─────▶│  module-inspector/inspector.ts │
│  BookRelationGraph.astro        │── imports ─────▶│  relation-graph/client.ts      │
│  FeedbackMode.astro             │── imports ─────▶│  feedback/feedback-controller  │
│  exercises/exercise-controller  │── imports ─────▶│  exercise-db/exercise-db-client│
└─────────────────────────────────┘                 └────────────────────────────────┘
```

**诊断结论**：
1. **职责倒置**：`src/utils/page-preprocess.ts` 本是 SPA 顶层路由的离屏预处理管线，却反向 `import { formatMultipleChoiceQuestions } from '../components/sidebar/question-formatter'`，形成了 `UI -> Utils -> UI` 的概念环路；
2. **伪 Utils 现象**：`editor.ts` (69KB)、`inspector.ts` (48KB)、`relation-graph-client.ts` (29KB)、`feedback-controller.ts` (19KB) 全是重量级的纯浏览器前端交互控制器，却被错误丢在 `src/utils/` 中，导致工具库名不副实。

---

### 3.2 `scripts/` 与 `src/` 的依赖方向诊断

```text
                    ┌────────────────────────────────────────┐
                    │               scripts/                 │
                    │   (构建前置管线、校验工具、测试套件)    │
                    └───────────────────┬────────────────────┘
                                        │ imports
                                        ▼
                    ┌────────────────────────────────────────┐
                    │                 src/                   │
                    │  src/config/collections.config.mjs     │
                    │  src/config/features.config.mjs        │
                    │  src/ai/indexer.mjs                    │
                    │  src/utils/cross-ref-indexer.mjs       │
                    │  src/utils/module-inspector/scanner.mjs│
                    │  src/utils/relation-graph/generator.mjs│
                    │  src/utils/latex/latex-generator.ts    │
                    │  src/utils/typst/typst-generator.ts    │
                    └────────────────────────────────────────┘
```

**诊断结论**：
1. **`scripts/ -> src/`（合法）**：根目录 `scripts/build-*.mjs` 作为 CLI 构建脚本，从 `src/config/` 读取数据配置、从 `src/` 内部调用核心生成算法（如图谱计算、章节索引），依赖方向是由外向内，符合架构分层；
2. **`src/ -> scripts/`（严重违规，已清零但存在动态调用）**：
   - 静态扫描确认：`src/` 中对 `scripts/` 的源码 import 为 **0**（历史遗留的 `src/scripts/` 实际上是前端客户端脚本，非构建脚本）；
   - ⚠️ 动态漏洞：`src/utils/exercise-editor/dev-server-plugin.mjs` 中使用了 `execSync('node scripts/build-exercise-data.mjs')`，Vite 中间件在运行时通过子进程执行外部构建脚本，严重违反 Rule 9（Runtime must not mutate source / call build scripts）。

---

### 3.3 `src/scripts/` 的命名与职责错位

`src/scripts/` 目录包含：
- `feature-toggles.ts` (27.8 KB)
- `font-presets.ts` (4.8 KB)
- `formula-actions.ts` (0.5 KB)
- `site-themes.ts` (2.1 KB)
- `formula/exporter.ts` (26.5 KB)
- `formula/ui.ts` (15.6 KB)

**诊断结论**：
该目录中的文件 **100% 为浏览器端运行时脚本（Client Runtime）**，由于使用了 `scripts` 命名，极易与根目录的 Node 构建脚本 `scripts/` 混淆。

---

## 4. Task 3: 三大核心运行环境边界划分

AstroLib 作为一个多端形态系统（SSG 构建、Vite 中间件、SPA 客户端交互、LaTeX/EPUB 发行、MCP 服务），其代码必须严格区分为三大执行边界：

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   Boundary A: Browser Runtime                          │
│  依赖: window, document, localStorage, IndexedDB, ECharts, DOM 事件, 自定义元素         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  • src/utils/editor.ts                                                                 │
│  • src/utils/module-inspector/inspector.ts                                             │
│  • src/utils/relation-graph/relation-graph-client.ts                                   │
│  • src/utils/feedback/feedback-controller.ts                                           │
│  • src/utils/exercise-db/exercise-db-client.ts                                         │
│  • src/utils/latex/latex-cloud-compiler.ts                                             │
│  • src/utils/page-preprocess.ts                                                        │
│  • src/components/exercises/exercise-controller.ts (114 KB God Controller)             │
│  • src/components/sidebar/ (除 CustomSidebarSublist.astro 外的 8 个客户端 TS)          │
│  • src/scripts/** (全量公式操作、字体切换、特性开关客户端)                             │
│  • src/ai/client/chat-controller.ts                                                    │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   Boundary B: Build / Node                             │
│  依赖: node:fs, node:path, node:child_process, unified, remark, rehype, sharp, Vite    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  [Vite Dev Server 中间件]                                                              │
│  • src/utils/mdx-editor/dev-server-plugin.mjs                                          │
│  • src/utils/module-inspector/dev-server-plugin.mjs                                    │
│  • src/utils/relation-graph/dev-server-plugin.mjs                                      │
│  • src/utils/exercise-editor/dev-server-plugin.mjs                                     │
│  [Rehype / AST 构建期插件]                                                             │
│  • src/utils/rehype-cross-ref.mjs                                                      │
│  • src/utils/rehype-katex-source.mjs                                                   │
│  • src/utils/rehype-math-promote.mjs                                                   │
│  • src/utils/rehype-mermaid.mjs                                                        │
│  • src/utils/rehype-image-blur.mjs                                                     │
│  • src/utils/rehype-editor-annotate.mjs                                                │
│  [构建期分析与生成引擎]                                                                │
│  • src/utils/cross-ref-indexer.mjs                                                     │
│  • src/utils/module-inspector/scanner.mjs                                              │
│  • src/utils/relation-graph/generator.mjs                                              │
│  • src/utils/mdx-editor/apply-op.mjs, locate-block.mjs, parse.mjs                      │
│  • src/utils/sidebar.mjs (generateBookSidebar)                                         │
│  • src/ai/chunker.mjs, indexer.mjs, outline.mjs                                        │
│  [外部服务]                                                                            │
│  • src/ai/mcp/server.mjs, tools.mjs                                                    │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                     Boundary C: Domain                                 │
│  依赖: 无 DOM、无 Node 专有 API、无 Astro / Vite 框架绑定、纯逻辑与数据契约            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  • src/types/exercises.ts (题库、试卷、章节学术领域模型)                               │
│  • src/config/collections.config.mjs (6 部教材与合集真理源)                            │
│  • src/config/features.config.mjs (全站功能注册表)                                     │
│  • src/config/themes.config.mjs (主题调色盘)                                           │
│  • src/utils/latex/latex-generator.ts (纯 LaTeX 标记语法编译器)                        │
│  • src/utils/typst/typst-generator.ts (纯 Typst 标记语法编译器)                        │
│  • src/utils/feedback/format-issue.ts (Issue 格式生成器)                               │
│  • src/utils/render-title.mjs (KaTeX HTML 转译纯函数)                                  │
│  • src/utils/src-attrs.mjs (组件属性无状态过滤)                                        │
│  • src/utils/artistic-qr.mjs (数理 SVG 矢量制图纯算法)                                 │
│  • src/utils/sidebar.mjs (cleanSlug, naturalSort 纯工具算法)                           │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Task 4: 目录结构演进方案与目标拓扑

### 5.1 当前结构缺陷归纳

1. **`src/utils/` 职责爆炸**：容纳了从服务端中间件、AST 编译插件到客户端 ECharts 控制器的全部逻辑，破坏了打包安全边界；
2. **`src/scripts/` 与根目录 `scripts/` 重名歧义**：前端运行时代码混淆在“脚本”概念中；
3. **`src/components/` 混装大型单页应用控制器**：`exercise-controller.ts` (114KB) 实际上是一个复杂的客户端应用，不属于通用 UI 卡片；
4. **编译与出版系统位置散落**：LaTeX 与 Typst 编译系统放在 `utils/`，EPUB 编译管线放在根目录 `scripts/epub/`，缺少统一的 `publishing` 出版层。

---

### 5.2 建议目标架构体系 (Target Architecture)

基于上述职责与运行边界划分，建议将 `src/` 逐步演进为具有清晰单一职责的现代学术出版架构：

```text
src/
├── types/                      # [Layer 0] 全局领域模型契约 (Zero Dependencies)
│   ├── exercises.ts            # 题库、试卷、试题学术模型 (已就位)
│   ├── books.ts                # 教材、目录树、合集领域类型
│   └── feedback.ts             # 勘误元数据契约
│
├── config/                     # [Layer 1] 单一真理源配置 (Canonical Configs)
│   ├── collections.config.mjs  # 教材合集真理源
│   ├── features.config.mjs     # 功能特性注册表
│   └── themes.config.mjs       # 主题定义
│
├── plugins/                    # [Layer 2: Build] 编译期 Markdown/AST 转换插件
│   ├── rehype-cross-ref.mjs    # 交叉引用下沉插件
│   ├── rehype-katex-source.mjs # 公式源码回填插件
│   ├── rehype-math-promote.mjs # 变量智能提升插件
│   ├── rehype-image-blur.mjs   # 图片模糊防抖插件
│   ├── rehype-mermaid.mjs      # Mermaid 代码拦截
│   └── rehype-editor-annotate.mjs # 源码位置注入
│
├── publishing/                 # [Layer 3: Publishing] 学术出版物纯编译引擎 (Headless)
│   ├── latex/
│   │   ├── latex-generator.ts  # Jinwen-XU/homework LaTeX 编译器
│   │   └── templates/          # LaTeX 宏包模板
│   ├── typst/
│   │   └── typst-generator.ts  # Typst 练习册编译器
│   └── epub/                   # （后续演进：将 scripts/epub 纯编译逻辑收拢）
│
├── processing/                 # [Layer 4: Processing] 构建期数据生成与 AST 分析引擎
│   ├── cross-ref/              # 交叉引用字典生成器 (cross-ref-indexer.mjs)
│   ├── relation-graph/         # 关系图谱拓扑计算引擎 (generator.mjs)
│   ├── inspector/              # 教材模块指标扫描器 (scanner.mjs)
│   └── mdx-editor/             # MDX 节点定位与算子修改 (apply-op, parse, locate-block)
│
├── server/                     # [Layer 5: Dev Server] Vite 开发服务器插件与中间件
│   ├── plugins/
│   │   ├── editor-dev-plugin.mjs
│   │   ├── inspector-dev-plugin.mjs
│   │   ├── relation-graph-dev-plugin.mjs
│   │   └── exercise-dev-plugin.mjs
│
├── client/                     # [Layer 6: Browser] 浏览器端交互与运行时
│   ├── runtime/                # 全站通用 DOM 运行时与预处理器
│   │   ├── page-preprocess.ts  # 离屏预处理管线
│   │   ├── question-formatter.ts # 选择题排版器 (从 components/sidebar 迁出)
│   │   └── loaders/            # image-blur, mermaid 等页面动态加载器
│   ├── navigation/             # 侧边栏与大纲交互 (jump-navigator, local-nav, scroll-spy)
│   ├── formula/                # 公式悬浮操作条与导出器 (原 src/scripts/formula/)
│   └── services/               # 客户端外部服务桥接 (latex-cloud-compiler, exercise-db-client)
│
├── features/                   # [Layer 7: Features] 独立业务特性子系统 (UI + Client Controller)
│   ├── exercises/              # 题库子系统 (ExerciseModal, exercise-controller)
│   ├── editor/                 # 在线可视化精修 (EditorMode, editor.ts)
│   ├── inspector/              # 模块巡检系统 (ModuleInspector, inspector.ts)
│   ├── relation-graph/         # 关系图谱弹窗 (BookRelationGraph, relation-graph-client.ts)
│   ├── feedback/               # 读者勘误反馈 (FeedbackMode, feedback-controller.ts)
│   └── ai/                     # AI 问答子系统 (ChatDrawer, chat-controller.ts)
│
├── components/                 # [Layer 8: UI Components] 纯粹的展示型 Astro 组件
│   ├── cards/                  # 14 个教辅学术结构化卡片 (Example, Knowledge, Method 等)
│   └── layout/                 # Starlight 官方插槽覆盖骨架 (Header, Sidebar, Footer 等)
│
├── utils/                      # [Layer 9: Pure Utils] 纯无状态工具函数库 (Utils Purity)
│   ├── render-title.mjs        # KaTeX HTML 标题公式转译
│   ├── src-attrs.mjs           # 卡片 props 解构辅助
│   ├── slug.mjs                # cleanSlug 路由净化器 (从 sidebar.mjs 剥离)
│   ├── natural-sort.mjs        # 自然排序算法 (从 sidebar.mjs 剥离)
│   └── artistic-qr.mjs         # 数理制图矢量二维码引擎
│
├── content/                    # 内容集合资产 (576 个 MDX 章节，保持绝对不动)
├── pages/                      # 基础页面路由 (index, library, print)
└── data/                       # 静态数据与题库数据
```

---

### 5.3 与 Astro / Starlight 的集成兼容性评估

1. **Astro Content Layer 契约**：
   `src/content/docs/collections/` 与 `src/content/docs/dev/` 完全不受任何目录重构影响；
2. **`astro.config.mjs` 插件装配**：
   Astro 配置文件中引用的 `rehypePlugins` 路径只需平稳变更为 `src/plugins/`，Vite 插件变更为 `src/server/plugins/`，零侵入性；
3. **Starlight 插槽组件映射**：
   `componentOverrides` 对应路径保持无缝映射；
4. **路径别名支持**：
   当前 `tsconfig.json` 与 `astro.config.mjs` 中已有 `@/ -> /src` 别名映射，支持优雅重构。

---

## 6. Task 5: 迁移优先级、禁区与验证策略

### 6.1 阶段迁移优先级规划

根据 **Rule 10（one boundary -> one migration -> one verification）**，重构必须小步快跑：

#### 第一批次（极低风险，纯工具与插件纯化）：
- 目标：将 `src/utils/` 中无状态、无副作用的纯函数及编译插件独立归位。
  1. `src/utils/src-attrs.mjs`：纯属性提取，仅卡片组件调用；
  2. `src/utils/render-title.mjs`：纯 KaTeX 字符串转译；
  3. `src/utils/rehype-*.mjs`（6 个编译期 AST 插件）：集中归入 `src/plugins/` 或 `src/processing/rehype/`，仅 `astro.config.mjs` 导入；
  4. 拆解 `src/utils/sidebar.mjs`：将纯函数 `cleanSlug` / `naturalSort` 剥离，解除对 `node:fs` 的隐式强绑定。

#### 第二批次（低风险，出版系统独立化）：
- 目标：践行 Rule 2（Publishing is independent）与 Rule 4。
  1. 建立 `src/publishing/latex/` 与 `src/publishing/typst/`；
  2. 迁移 `latex-generator.ts` 与 `typst-generator.ts`，彻底确立出版独立层；
  3. 验证测试脚本 `test-latex-export.mjs` 与 `test-typst-export.mjs`。

#### 第三批次（中风险，服务端开发中间件与客户端运行时分流）：
- 目标：剥离 `src/utils/` 中的 Vite 中间件与浏览器 DOM 交互脚本。
  1. 将 4 个 `dev-server-plugin.mjs` 移至 `src/server/`；
  2. 将 `src/scripts/` 重命名/重构为 `src/client/`；
  3. 消除 `page-preprocess.ts` 对 `src/components/sidebar/question-formatter.ts` 的反向依赖。

#### 第四批次（高风险，独立特性子系统凝聚）：
- 目标：收拢大型独立功能，解除 `components/` 臃肿。
  1. 将 `inspector`, `editor`, `relation-graph`, `feedback` 聚合为特性模块。

---

### 6.2 严格禁区清单 (Strictly Forbidden in Phase 3)

在本阶段及后续初步迁移中，以下区域**绝对禁止碰触**：

1. 🛑 **`src/components/exercises/exercise-controller.ts` (114 KB)**：
   - 严禁大规模重写或切分；
   - 仅允许调整其对外类型导入与外部工具引用路径。
2. 🛑 **`src/components/SidebarOverride.astro`**：
   - 严禁盲目拆分其内部模板与生命周期钩子，直到测试用例建立完毕。
3. 🛑 **`src/content/**` (576 个 MDX 章节)**：
   - 严禁以架构或目录整洁为由批量重命名、移动文件或修改 Frontmatter。
4. 🛑 **`src/data/exercises/*.json`**：
   - 严禁更改既有题库 JSON 结构。

---

### 6.3 严格验证流水线 (Mandatory Verification)

后续任何单个小批次的文件移动后，必须严格依次执行以下 4 道验证门禁，确认全绿后方可提交与推进：

```bash
# 门禁 1: 576 篇教材 MDX 全量 KaTeX 公式语法无损校验
npm run check:katex

# 门禁 2: LaTeX 练习册与试卷导出生成校验
node scripts/test-latex-export.mjs

# 门禁 3: Typst 原生编译生成校验
node scripts/test-typst-export.mjs

# 门禁 4: 全站生产构建与 595 页面静态生成校验
npm run build
```

---

## 7. 结论与当前状态

当前调查已完备，三大边界与全量 30 个文件的定位已完全明确。

**当前动作：严格停止操作。**  
在获得用户对本提案的正式审阅与授权指令前，**不移动任何文件、不删除任何文件、不修改任何业务逻辑**。
