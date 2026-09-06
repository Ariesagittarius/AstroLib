# AstroLib 目标架构规范 (Target Architecture)

> 本规范定义了 AstroLib 项目在经历小步渐进迁移后的**最终理想架构形态**。
> 所有后续的架构重构、目录抽取、模块解耦与新功能开发，均必须以此架构规范为基准，严格遵守各模块的职责边界与依赖方向。

---

## 1. 目标目录拓扑总览

```
AstroLib/
├── .agents/                 # AI Agent 技能配置与指令体系 (纯规范文本，无大二进制资产)
├── .github/workflows/       # GitHub Actions 自动化工作流 (主站 CI、云端 LaTeX 编译、EPUB 发行)
├── dist/                    # 生产打包最终产物 (静态托管目录)
├── docs/                    # 项目技术设计文档、交接文档与架构决策库 (ADRs)
├── generated/               # [NEW] 自动化构建生成的中间数据与索引 (明确生成脚本与来源)
├── public/                  # 浏览器直接访问的纯静态公开资源 (保持极度纯净)
├── scripts/                 # [REORGANIZED] 离线脚本分类组织 (build, import, export, git, lint)
├── src/
│   ├── app/                 # [NEW] 应用顶层骨架、全局路由生命周期与 Starlight 插槽适配器
│   ├── components/          # [REFINED] 纯粹的展示型 UI 组件与教辅结构化卡片 (无领域数据模型)
│   ├── content/             # 内容集合单一真实源 (MDX 教材正文与开发文档)
│   ├── data/                # 结构化领域数据 (处理后的轻量数据字典，无超大生数据)
│   ├── features/            # [NEW] 垂直高内聚业务特性模块 (Exercises, AI, Editor, Graph...)
│   ├── lib/                 # [NEW] 领域数据契约模型 (Types/Models) 与纯无状态工具函数
│   ├── publishing/          # [NEW] 独立无头多格式出版系统 (LaTeX / Typst / EPUB / SVG 编译器)
│   ├── services/            # [NEW] 外部基础设施服务与驱动层 (LLM 直连、云编译调度、IndexedDB)
│   └── styles/              # 样式体系 (VitePress 主题、排版变量、Webfont 字体栈)
└── tests/                   # [NEW] 自动化测试套件 (单元测试、编译器语法验证、AST 防破坏检查)
```

---

## 2. 核心目录规范与依赖边界矩阵

### 2.1 `src/app/` (应用壳与顶层适配)
- **允许放什么**：
  - Starlight 框架的官方组件插槽覆盖 (`HeaderOverride.astro`, `SidebarOverride.astro`, `PageSidebarOverride.astro`, `FooterOverride.astro` 等)；
  - 全站顶层 Provider、路由拦截器与 SPA 导航核心控制器 (`spa-router.ts`)；
  - 全局生命周期与离屏 DOM 预处理管线编排。
- **禁止放什么**：
  - 具体的业务逻辑代码（如题库状态机、AI 问答流程、MDX AST 修改算法）；
  - 静态领域数据或大型 JSON；
  - 纯展示型学术卡片组件。
- **可以依赖谁**：
  - `src/features/`（组装各业务特性的视图入口）；
  - `src/components/`（使用通用 UI 骨架）；
  - `src/lib/`（使用类型与纯工具）；
  - `src/styles/`。
- **谁不能依赖它**：
  - `src/features/`、`src/publishing/`、`src/services/`、`src/components/`、`src/lib/` 严禁反向依赖 `src/app/`。

---

### 2.2 `src/components/` (纯展示型 UI 组件)
- **允许放什么**：
  - 14 种教辅结构化卡片组件 (`Example.astro`, `Knowledge.astro`, `Method.astro`, `Summary.astro`, `Variant.astro`, `Note.astro`, `Block.astro`, `Solution.astro`, `QRCodeVideo.astro` 等)；
  - 纯 UI 视觉元素（按钮、微徽章、骨架屏、图标包装器）。
- **禁止放什么**：
  - ⚠️ **严格禁止包含领域数据模型或 TypeScript 核心接口**（严禁重犯 `exercise-controller.ts` 输出 `SlimQuestionItem` 供编译器引用的错误）；
  - 完整的单页业务应用逻辑或复杂状态机；
  - 针对外部文件系统的扫描或服务端 HTTP 逻辑。
- **可以依赖谁**：
  - `src/lib/`（读取类型与通用格式化函数）；
  - `src/styles/`。
- **谁不能依赖它**：
  - `src/publishing/`（出版导出系统绝对禁止依赖 UI 组件）；
  - `src/services/`、`src/lib/`、`src/data/` 严禁依赖 `src/components/`。

---

### 2.3 `src/features/` (垂直高内聚业务特性)
按业务领域划分子目录（如 `features/exercises/`, `features/ai/`, `features/editor/`, `features/inspector/`, `features/relation-graph/`, `features/feedback/`）。
- **允许放什么**：
  - 该特性的私有状态机、业务逻辑控制器（如拆分后的 `exercise-state.ts`, `exercise-evaluator.ts`）；
  - 该特性专用的弹窗界面与视图组件（如 `ExerciseModal.astro`, `ChatDrawer.astro`）；
  - 该特性的私有样式表 (`*.css`) 与客户端驱动。
- **禁止放什么**：
  - 全站跨业务共享的基础通用工具（应进入 `src/lib/`）；
  - 纯教材排版卡片；
  - 离线构建脚本。
- **可以依赖谁**：
  - `src/services/`（调用 LLM、云编译或本地持久化驱动）；
  - `src/publishing/`（调用文档生成器）；
  - `src/lib/`（使用领域模型与通用工具）；
  - `src/components/`（组合基础卡片）；
  - `src/data/`。
- **谁不能依赖它**：
  - `src/publishing/`（导出系统不得依赖任何 Feature 的 UI 或控制器）；
  - `src/lib/`（模型层不得依赖业务层）；
  - Feature 之间原则上禁止深层横向耦合（若需通信，通过全局事件或 `src/services/` 调度）。

---

### 2.4 `src/content/` (内容集合单一真实源)
- **允许放什么**：
  - 教材正文 MDX 源码 (`collections/math/`, `collections/science/`)；
  - 开发者与项目架构手册 (`docs/dev/`)；
  - Astro Content Layer 架构定义 (`content.config.ts`)。
- **禁止放什么**：
  - 程序可自动重新生成的缓存数据或索引文件；
  - 大体积二进制源文件（如 5MB+ 的原始 PDF，应放于仓库外部或资源暂存区）；
  - 业务控制器或可执行脚本代码。
- **可以依赖谁**：
  - 可以在 MDX 中引用注册好的卡片组件 (`src/components/`)；
  - 依赖标准 Markdown/LaTeX 语法。
- **谁不能依赖它**：
  - 纯无状态工具库（`src/lib/`）不得硬编码依赖特定书籍的章节路径。

---

### 2.5 `src/data/` (静态与结构化领域数据)
- **允许放什么**：
  - 经过清洗、映射和结构化的轻量级 JSON 字典（如章节元数据字典、考点分类映射）；
  - 静态配置数据与常量枚举。
- **禁止放什么**：
  - ⚠️ **严禁存放超过 5MB 的非结构化全量历史题库与百套原始切片**（应外置管理）；
  - 严禁在运行期被开发服务器物理覆写；
  - 严禁存放未路由的孤儿 MDX 页面。
- **可以依赖谁**：
  - 属于纯静态资产层，不依赖任何代码模块。
- **谁不能依赖它**：
  - `src/lib/`（模型定义层不得依赖具体数据实例）。

---

### 2.6 `src/services/` (外部基础设施与服务驱动)
- **允许放什么**：
  - 外部 API 直连封装（如 DeepSeek/OpenAI 流式通信驱动 `llm-service.ts`）；
  - GitHub Actions REST API 调度服务（`github-actions-service.ts`）；
  - 本地缓存与持久化适配器（IndexedDB / CacheStorage 驱动 `storage-service.ts`）；
  - 第三方遥测分析服务驱动（Microsoft Clarity）。
- **禁止放什么**：
  - 前端 DOM 视图模板与 CSS 样式；
  - 教材卡片渲染逻辑；
  - 离线数据生成 CLI。
- **可以依赖谁**：
  - `src/lib/`（类型契约与基础网络工具）。
- **谁不能依赖它**：
  - `src/publishing/`（纯无头文档编译器不得绑定具体网络服务）；
  - `src/lib/`、`src/components/`。

---

### 2.7 `src/publishing/` (独立无头出版系统)
- **允许放什么**：
  - LaTeX 文档生成器与模板编译器（基于 `Jinwen-XU/homework` / `ctex`）；
  - Typst 讲义生成器与本地 WASM/Node 编译器接口；
  - EPUB 3 电子书打包与目录构建逻辑；
  - 公式高清矢量图 (SVG/PNG) 离线导出器。
- **禁止放什么**：
  - ⚠️ **严禁引入任何 DOM 操作、浏览器原生对象 (`window`, `document`) 或 UI 组件**；
  - 严禁依赖 `src/components/`、`src/features/`、`src/app/`。
- **可以依赖谁**：
  - `src/lib/`（只依赖公共数据模型与纯字符串/AST 清洗工具）。
- **谁不能依赖它**：
  - `src/lib/` 不得依赖 `src/publishing/`。

---

### 2.8 `src/lib/` (领域模型与通用纯工具)
包含两大子域：`src/lib/models/` (或 `src/types/`) 与 `src/lib/utils/`。
- **允许放什么**：
  - 全局共享的 TypeScript 类型定义、接口规范与 Zod Schema（如 `SlimQuestionItem`, `BookMeta`, `FeatureDef`）；
  - 纯无状态、无副作用的算法与小助手函数（如 `cleanSlug`, `naturalSort`, `sanitizeLatex`, `srcAttrs`）。
- **禁止放什么**：
  - 包含特定业务分支状态的全局变量；
  - 包含 UI 渲染与 DOM 绑定的函数；
  - Node.js 私有读写逻辑（除非置于明确隔离的 `src/lib/node/` 中）。
- **可以依赖谁**：
  - 第三方纯无状态工具包（如 `github-slugger`）；
  - 不依赖系统内任何上层业务模块。
- **谁不能依赖它**：
  - 无限制，全站所有层级均可安全依赖 `src/lib/`。

---

### 2.9 `src/styles/` (全局样式与主题)
- **允许放什么**：
  - 全局设计系统 Token（颜色、间距、排版负空间变量）；
  - VitePress 主题色板覆盖 (`vitepress-theme.css`)；
  - 自托管思源黑体/宋体/英文字体声明 (`fonts.css`)；
  - 全局打印样式 (`print.css`)。
- **禁止放什么**：
  - 特定业务特性的深层耦合样式（各特性的专有样式应存放在对应 `src/features/<feature>/` 内部）；
  - JS/TS 脚本代码。
- **可以依赖谁**：
  - 引入 `@fontsource-variable` 等 NPM 样式包。
- **谁不能依赖它**：
  - 任何纯计算与文档编译逻辑（`src/lib/`, `src/publishing/`）严禁依赖样式表。

---

### 2.10 `scripts/` (开发构建与维护工具)
严格分类为 6 个专用子目录：
- `scripts/build/`：前置索引与数据生成（被 `package.json` 的 `build` 串行调用）；
- `scripts/import/`：MinerU OCR 结果导入与章节自动化切分（Python/Node）；
- `scripts/export/`：离线批量全书发布与打包；
- `scripts/git/`：双仓脱敏、Conventional Commit 检查与推送流水线；
- `scripts/lint/`：KaTeX 指标校验与 MDX 语法体检；
- `scripts/lib/`：仅供脚本复用的私有库。
- **禁止放什么**：
  - 浏览器运行时代码或前台页面组件；
  - 未清理的临时日志文件 (`_devlog.txt`)；
  - 废弃/重复脚本。
- **可以依赖谁**：
  - `src/lib/`（使用模型与纯工具）；
  - `src/config/`（读取中央配置）；
  - Node.js 原生 API。
- **谁不能依赖它**：
  - ⚠️ **网站前台业务运行时（`src/` 内部代码）绝对禁止反向依赖 `scripts/`**。

---

### 2.11 `generated/` (可重新生成数据区)
- **允许放什么**：
  - 构建期脚本生成的跨页引用索引、AI 语义切片、章节关系图谱、模块巡检明细；
  - 每个生成文件内部或伴随元数据中**必须明确标明其生成脚本 (Generator) 与数据输入源 (Source Input)**。
- **禁止放什么**：
  - 人工手写的源数据（Source of Truth）；
  - 未经版本追踪且无生成来源说明的黑盒 JSON。
- **可以依赖谁**：
  - 产物本身由 `scripts/build/` 生成，供构建期 Astro 打包及客户端懒加载。
- **谁不能依赖它**：
  - 核心源代码不得将生成数据当作 Source of Truth。

---

### 2.12 `tests/` (自动化验证套件)
- **允许放什么**：
  - 文档导出编译器正确性测试（LaTeX 语法闭合检查、Typst 渲染验证）；
  - 双仓注释剥离器回归测试；
  - MDX 语法完整性与死链检测；
  - 纯工具函数单元测试。
- **禁止放什么**：
  - ⚠️ **严禁将测试产物、中间 `.aux/.log` 文件直接输出至 `public/`**；
  - 所有测试产物必须限制在系统临时目录或 `.tmp/` 下，运行完毕即刻清理。
- **可以依赖谁**：
  - 全站任何被测模块。
- **谁不能依赖它**：
  - 生产运行环境绝不依赖 `tests/`。

---

## 3. 架构依赖流向金字塔 (Dependency Hierarchy)

```
                 [ src/content/ ]   [ src/data/ ]
                        ▲                 ▲
                        │ reads           │
                        │                 │
                 [ src/lib/models & utils ]  (纯计算/无依赖底层)
                        ▲                 ▲
                        │                 │
             ┌──────────┴──────────┐      │
             │                     │      │
      [ src/publishing/ ]   [ src/services/ ]
      (无头出版/编译器)       (外部基础设施驱动)
             ▲                     ▲
             │                     │
             └──────────┬──────────┘
                        │
               [ src/features/ ]  (Exercises, AI, Editor...)
                        ▲
                        │ mounts / routes
                        │
                [ src/app/ & components/ ]  (页面壳与卡片)
```
- **单向流动铁律**：箭头上方为被依赖方，下方为发起依赖方。绝对禁止跨越金字塔发生逆向导入（Down-to-Up）。
