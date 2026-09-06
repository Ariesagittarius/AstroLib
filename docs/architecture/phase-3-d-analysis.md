# AstroLib Phase 3-D 架构勘察与归类报告：Processing & Feature-Core 边界分析

> **状态**：ANALYSIS COMPLETE (NO CODE MUTATION / NO FILE MOVES)  
> **对应阶段**：Phase 3-D (Processing Architecture Classification & Discovery)  
> **基线状态**：Phase 3-C Complete (`LOG-006`), Dev Server 边界已独立建立，全部测试门禁 100% 通过  

---

## 1. Scope（勘察范围与对象）

本阶段遵照指令，**严格禁止修改任何生产代码、移动文件或变更目录结构**。本阶段唯一目标是深入静态源码、调用拓扑、运行时环境与业务耦合度，对原留在 `src/utils/` 中的 7 个核心 Build / Processing / Feature 模块进行彻底的架构解构与职责归类：

### 核心调查对象（7 个模块）
1. `src/utils/cross-ref-indexer.mjs`（全书跨页引用索引构建器）
2. `src/utils/sidebar.mjs`（图书目录扫描与 Starlight 侧边栏结构生成器）
3. `src/utils/mdx-editor/parse.mjs`（MDX 源码解析与行号空间换算）
4. `src/utils/mdx-editor/locate-block.mjs`（AST 块级节点与卡片定位）
5. `src/utils/mdx-editor/apply-op.mjs`（结构化编辑操作执行与 MDX 编译校验）
6. `src/utils/module-inspector/scanner.mjs`（全书卡片模块扫描与查重聚合分析）
7. `src/utils/relation-graph/generator.mjs`（全书知识图谱、思维导图与矩阵拓扑生成器）

### 关联调查对象（发现的强相关模块）
- **客户端控制器**：
  - `src/utils/editor.ts`（在线精修工具客户端控制器）
  - `src/utils/module-inspector/inspector.ts`（模块巡检抽屉前端逻辑）
  - `src/utils/relation-graph/relation-graph-client.ts`（ECharts 图谱前端控制器）
  - `src/utils/exercise-db/exercise-db-client.ts`（题库客户端缓存与查询）
  - `src/utils/feedback/feedback-controller.ts` / `format-issue.ts`（读者勘误反馈控制器）
  - `src/utils/page-preprocess.ts`（侧边栏前端 DOM 扫描）
- **纯工具类**：
  - `src/utils/slug.mjs`（Phase 3-A 提纯的标准 cleanSlug）
  - `src/utils/natural-sort.mjs`（Phase 3-A 提纯的标准自然排序）
  - `src/utils/render-title.mjs`（KaTeX 公式标题服务端渲染工具）
  - `src/utils/src-attrs.mjs`（源码追踪 data-src-* 属性提取工具）
- **外部云编译调度**：
  - `src/utils/latex/latex-cloud-compiler.ts`（GitHub Actions 外部调度适配层）

---

## 2. Current Architecture（当前拓扑与痛点诊断）

### 2.1 当前 `src/utils/` 物理残局
在 Phase 3-A（提纯 slug/sort、下沉 rehype 插件）、Phase 3-B（独立 publishing 编译器）、Phase 3-C（建立 server/plugins 物理边界）之后，`src/utils/` 目录虽然剥离了编译插件、出版引擎和开发服务器端点，但剩余的文件依然呈现出**高度异构、环境混杂、职责割裂**的“大杂烩”状态：

```text
src/utils/
├── [纯工具 / 无状态]
│   ├── slug.mjs                     (纯工具: URL slug 净化)
│   ├── natural-sort.mjs             (纯工具: 文件名自然排序)
│   ├── render-title.mjs             (纯工具: KaTeX 字符串渲染)
│   ├── src-attrs.mjs                (纯工具: 源码属性解析)
│   └── artistic-qr.mjs              (纯工具: 艺术二维码生成)
├── [领域基础 / 索引构建]
│   ├── cross-ref-indexer.mjs        (Node I/O: 教材全局块索引)
│   └── sidebar.mjs                  (Node I/O: 章节目录树生成)
├── [特性核心 / AST 纯算法 (In-Memory)]
│   ├── mdx-editor/
│   │   ├── parse.mjs                (纯算法: unified/remark AST)
│   │   ├── locate-block.mjs         (纯算法: AST 范围命中)
│   │   └── apply-op.mjs             (纯算法: 源码编辑与编译校验)
├── [特性数据扫描 / 图拓扑 (Node I/O)]
│   ├── module-inspector/
│   │   └── scanner.mjs              (Node I/O: 模块提取与查重)
│   └── relation-graph/
│       └── generator.mjs            (Node I/O: 拓扑图与矩阵生成)
├── [浏览器客户端控制器 (Browser DOM)] ⚠️ 环境严重泄漏
│   ├── editor.ts                    (Browser: DOM / 浮动工具条)
│   ├── page-preprocess.ts           (Browser: DOM 文本节点扫描)
│   ├── exercise-db/
│   │   └── exercise-db-client.ts    (Browser: IndexedDB / Fetch)
│   ├── feedback/
│   │   ├── feedback-controller.ts   (Browser: 反馈浮窗交互)
│   │   └── format-issue.ts          (通用: Issue 模板格式化)
│   ├── module-inspector/
│   │   └── inspector.ts             (Browser: 巡检抽屉 UI 交互)
│   └── relation-graph/
│       └── relation-graph-client.ts (Browser: ECharts 图表渲染)
└── [云端调度适配层]
    └── latex/
        └── latex-cloud-compiler.ts  (Node/Browser: GitHub Actions API 调度)
```

### 2.2 核心架构痛点（Smell Analysis）
1. **环境严重泄漏（Environment Leakage）**：
   - 开发者无法仅凭路径判断一个文件是否可以在 Node 运行或在浏览器运行。
   - `editor.ts`、`inspector.ts` 等直接引用 `window`、`document`、`HTMLElement`，若在 SSR 或 CLI 构建期导入立即抛出 `ReferenceError: window is not defined`；
   - `scanner.mjs`、`generator.mjs`、`cross-ref-indexer.mjs` 依赖 `node:fs`，若被客户端误导入则会触发 Vite 打包错误或运行时崩溃。
2. **特性内聚性被物理割裂（Feature Fragmentation）**：
   - 一个完整的业务特性（如 `mdx-editor`）被生硬拆散成 5 个不同位置：
     - UI 层：`src/components/EditorMode.astro`
     - 客户端交互：`src/utils/editor.ts`
     - 编译器注入：`src/plugins/rehype/rehype-editor-annotate.mjs`
     - 服务端端点：`src/server/plugins/mdx-editor/dev-server-plugin.mjs`
     - 核心算法：`src/utils/mdx-editor/{parse,locate-block,apply-op}.mjs`
   - 维护者如果要新增一个编辑操作（Op），必须跨越 4 个一级目录同时修改，认知负荷极高。
3. **“垃圾桶”误区（The God-Folder Trap）**：
   - 历史代码将所有“无法直接放进 `components/`”的代码一律丢入 `utils/`，严重违背了架构法则 **Rule 7（Utils Purity）** 和 **Rule 6（Feature Isolation）**。

---

## 3. Dependency Matrix（全量依赖矩阵）

对 7 个重点调查模块及其衍生模块进行完整依赖与调用关系梳理：

| 模块名 | 运行时环境 (Runtime) | 调用方 (Called By) | 直接依赖 (Depends On) | 领域耦合度 (Domain) | 特性绑定度 (Feature) | 真实职责定位 | 候选边界 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`cross-ref-indexer.mjs`** | Node CLI / Build | `scripts/build-cross-ref-data.mjs`<br>`src/utils/relation-graph/generator.mjs` | `node:fs`, `node:path`<br>`slug.mjs` (`cleanSlug`) | **极高**（卡片标签正则、emoji 剥离、例题编号命名空间、URL 路由规则） | **中**（作为 cross-ref 与 relation-graph 的公共领域底座） | 教材全局块级交叉引用索引构建器 | `src/core/indexing/` 或 `src/features/cross-ref/core/` |
| **`sidebar.mjs`** | Node CLI / Build | `astro.config.mjs`<br>`src/ai/mcp/tools.mjs` | `node:fs`, `node:path`<br>`slug.mjs`, `natural-sort.mjs` | **极高**（教材合集文件树排版、Frontmatter title 提取、Starlight Sidebar Schema） | **低**（全站通用教材目录服务） | 教材目录导航模型生成器 | `src/core/navigation/` 或 `src/core/catalog/` |
| **`mdx-editor/parse.mjs`** | **Universal**<br>(Pure in-memory) | `locate-block.mjs`<br>`apply-op.mjs`<br>`dev-server-plugin.mjs`<br>`rehype-editor-annotate.mjs` | `unified`, `remark-parse`<br>`remark-math`, `remark-mdx` | **中**（MDX Frontmatter 约定、换行统计、line-offset） | **高**（服务于编辑器行号对齐） | MDX 抽象语法树与行号空间换算器 | `src/features/mdx-editor/core/` |
| **`mdx-editor/locate-block.mjs`** | **Universal**<br>(Pure in-memory) | `apply-op.mjs`<br>`dev-server-plugin.mjs` | `./parse.mjs` | **极高**（AstroLib 12 种卡片组件类型 `CARD_KINDS`、AST 定位） | **极高**（100% 编辑器专用） | 源码行号命中与编辑块识别定位器 | `src/features/mdx-editor/core/` |
| **`mdx-editor/apply-op.mjs`** | **Universal**<br>(Pure in-memory) | `dev-server-plugin.mjs` | `@mdx-js/mdx`, `remark-math`<br>`./parse.mjs`, `./locate-block.mjs` | **极高**（13 种编辑操作语义、JSX 属性转义/反转义、编译校验） | **极高**（100% 编辑器专用） | 编辑操作源码变换引擎与语法安全校验器 | `src/features/mdx-editor/core/` |
| **`module-inspector/scanner.mjs`** | Node CLI / Dev Server | `scripts/build-inspector-data.mjs`<br>`dev-server-plugin.mjs` | `node:fs`, `node:path`, `katex`<br>`slug.mjs`, `natural-sort.mjs`<br>`collections.config.mjs` | **极高**（22 种学术卡片元数据映射 `CARD_TYPES`、标题去重算法、KaTeX 预渲染） | **极高**（100% 模块巡检专用） | 全书卡片模块扫描、查重与学术元数据提取器 | `src/features/module-inspector/core/` |
| **`relation-graph/generator.mjs`** | Node CLI / Dev Server | `scripts/build-relation-graphs.mjs`<br>`dev-server-plugin.mjs` | `node:fs`, `node:path`<br>`slug.mjs`, `natural-sort.mjs`<br>`cross-ref-indexer.mjs`<br>`collections.config.mjs` | **极高**（全书章节拓扑网络、Apache ECharts 5 兼容模型、导图树与追溯矩阵） | **极高**（100% 关系图谱专用） | 全书知识图谱、层级导图与双向矩阵生成器 | `src/features/relation-graph/core/` |

---

## 4. Runtime Classification（运行时环境与隔离分析）

根据环境依赖和执行时机，所有待迁移模块可以分为严格的 4 级运行时：

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. Universal / Environment-Independent (纯内存运算，零环境绑定)            │
│    - mdx-editor/parse.mjs, locate-block.mjs, apply-op.mjs               │
│    - slug.mjs, natural-sort.mjs, src-attrs.mjs, render-title.mjs        │
│    特性：无 fs、无 DOM、无网络请求，输入字符串/AST，输出结构化数据/字符串。        │
├─────────────────────────────────────────────────────────────────────────┤
│ 2. Node Build / CLI (构建期文件读写与批处理，Node 原生环境)                 │
│    - cross-ref-indexer.mjs                                              │
│    - sidebar.mjs                                                        │
│    - module-inspector/scanner.mjs                                       │
│    - relation-graph/generator.mjs                                       │
│    特性：使用 node:fs 深度遍历教材源码，生成预计算 JSON 数据放入 public/。     │
├─────────────────────────────────────────────────────────────────────────┤
│ 3. Vite Dev Server Middleware (开发态中间件，动态响应 HTTP)                │
│    - src/server/plugins/mdx-editor/dev-server-plugin.mjs                │
│    - src/server/plugins/module-inspector/dev-server-plugin.mjs          │
│    - src/server/plugins/relation-graph/dev-server-plugin.mjs            │
│    - src/server/plugins/exercise-editor/dev-server-plugin.mjs           │
│    特性：拦截开发态特权路由（/__edit__/*, /__inspector__/*），按需写盘/查询。   │
├─────────────────────────────────────────────────────────────────────────┤
│ 4. Browser Client Runtime (浏览器交互运行时，强依赖 Web API)               │
│    - editor.ts, inspector.ts, relation-graph-client.ts                  │
│    - exercise-db-client.ts, feedback-controller.ts                      │
│    特性：操作 DOM、监听鼠标手势、挂载 ECharts 实例、读取 localStorage。        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Feature Coupling Analysis（特性内聚性深度解构）

### 5.1 为什么把这 7 个文件统称为“Processing”是严重的架构退化？
如果机械地建立 `src/processing/` 并把它们全部挪入：
```text
src/processing/
├── cross-ref-indexer.mjs
├── sidebar.mjs
├── mdx-editor/
├── module-inspector/
└── relation-graph/
```
**后果**：
- `src/processing/` 瞬间变成另一个“垃圾桶”。
- 它违背了 **高内聚、低耦合** 的核心原则：`mdx-editor` 的三个文件与 `module-inspector` 的 `scanner.mjs` 没有任何业务交集；它们唯一的共性仅仅是“都包含了某种文本或 AST 处理”。
- 抹杀了特性边界：在代码演进中，删除或重构 `module-inspector` 特性时，开发者必须去 `components/` 找 UI、去 `utils/`（或 `processing/`）找扫描器、去 `server/` 找插件、去 `scripts/` 找脚本，遗漏和残留风险极高。

### 5.2 发现的真正“架构坏味道（Code Smells）”
在深入审查 7 个模块代码时，发现了如下具体坏味道：

1. **表现层配置向下渗透进数据引擎（Presentation Leaking into Data Engine）**：
   - 在 `module-inspector/scanner.mjs` 中，硬编码了前端 CSS 类名：
     ```javascript
     export const CARD_TYPES = {
       example: { label: '例题', code: 'EG', theme: 'chip-example' }, // 👈 chip-example 是 CSS 样式名！
     ...
     ```
   - 在 `relation-graph/generator.mjs` 中，硬编码了 ECharts 图表调色板：
     ```javascript
     const CATEGORY_COLORS = ['#3451b2', '#059669', '#d97706', ...]; // 👈 视觉样式侵入图拓扑模型
     ```
2. **跨特性的横向直接依赖（Cross-Feature Coupling）**：
   - `relation-graph/generator.mjs` 第 26 行：
     ```javascript
     import { buildGlobalBlockIndex } from '../cross-ref-indexer.mjs';
     ```
   - 关系图谱需要解析跨章节引用，因此它直接调用了交叉引用的索引函数。这意味着 `cross-ref-indexer` 绝不仅是 cross-ref 插件的私有工具，而是**整个教材内容知识拓扑的核心数据基础设施**。
3. **隐式全局状态与缓存风险（Hidden In-Memory Caches）**：
   - `cross-ref-indexer.mjs` 与 `relation-graph/generator.mjs` 均在模块作用域定义了全局 `new Map()` 缓存，依赖文件 mtime 签名判定是否复用。在长期运行的多任务脚本或 dev 模式下，若文件外部变动未能更新签名，可能导致陈旧数据。

---

## 6. 重点调查专题结论

### 6.1 `cross-ref-indexer.mjs` 到底是什么？
- **结论**：它既不是单纯的通用工具，也不是前端插件的私有代码，而是：
  > **Domain Content Indexer（教材领域内容知识索引引擎）**。
- **证据链**：
  1. 它读取的是全站最高领域模型：`src/content/docs/collections/<col>/<book>`；
  2. 它识别的是 AstroLib 独有的卡片领域标签：`<Example>`, `<Knowledge>`, `<Theorem>`；
  3. 它的产物被两大系统同时消费：
     - 构建期脚本 `scripts/build-cross-ref-data.mjs` → 生成 `public/data/cross-ref/*.json` → 浏览器客户端跨页联动；
     - 拓扑生成器 `generator.mjs` → 建立章节间的有向引用图。
- **推荐归属**：未来应归属于 **教材核心领域基础设施（`src/core/indexing/` 或 `src/core/cross-ref/`）**。

### 6.2 `sidebar.mjs` 到底是什么？
- **结论**：它不仅是生成 HTML 侧边栏的辅助函数，而是：
  > **Textbook Catalog Navigation Model（教材知识体系目录模型生成器）**。
- **证据链**：
  1. 它定义了 AstroLib 纸质教材数字化后的层级树结构（册 → 章 → 节 → 附录）；
  2. 它同时被网站主配置 `astro.config.mjs`（构建 Starlight 侧边栏）和 `src/ai/mcp/tools.mjs`（AI 智能体感知全书大纲）所依赖；
  3. 它已经通过 Phase 3-A 解除了对 slug 算法和自然排序的杂糅，自身已成为高阶领域组装器。
- **推荐归属**：未来应归属于 **教材核心目录与导航服务（`src/core/navigation/` 或 `src/core/catalog/`）**。

### 6.3 `mdx-editor` 三模块到底是什么？
- **结论**：`parse.mjs`、`locate-block.mjs`、`apply-op.mjs` 是极其标准的：
  > **Pure Functional Feature Core（纯函数式特性核心）**。
- **证据链**：
  1. 零 DOM、零 fs、零网络；
  2. 100% 聚焦于 AST 解析、行号对齐、文本替换与 `@mdx-js/mdx` 语法校验；
  3. 与 `src/server/plugins/mdx-editor/dev-server-plugin.mjs`（I/O 适配器）形成了完美的“核心-适配器”六边形分离。

---

## 7. 目标架构方案比选

针对上述分析，建立两个候选架构方案供评审：

### 候选方案 A：分层优先架构（Layer-Centric Architecture）

将所有模块严格按“技术分层”归集：

```text
src/
├── processing/                 <-- 新增：所谓处理层
│   ├── cross-ref-indexer.mjs
│   ├── sidebar.mjs
│   ├── mdx-editor/
│   │   ├── parse.mjs
│   │   ├── locate-block.mjs
│   │   └── apply-op.mjs
│   ├── module-inspector/
│   │   └── scanner.mjs
│   └── relation-graph/
│       └── generator.mjs
├── server/
│   └── plugins/                <-- Phase 3-C 已建
├── publishing/                 <-- Phase 3-B 已建
├── client/                     <-- 将各客户端控制器集中
│   ├── editor.ts
│   ├── inspector.ts
│   └── relation-graph-client.ts
├── components/                 <-- 仅保留 Astro UI 模板
└── utils/                      <-- 纯工具
```

#### 方案 A 评估：
- **优点**：按技术概念（处理/服务/客户端/组件）划分，看似分类整齐。
- **致命缺点**：
  1. **制造新的垃圾桶（God-Folders）**：`processing/` 和 `client/` 将迅速退化为新的 `utils/`；
  2. **严重破坏特性内聚**：以 `module-inspector` 为例，一个特性被强行切碎在 `src/processing/`、`src/server/`、`src/client/`、`src/components/` 四个完全不同的树杈下；
  3. **生命周期管理极其困难**：如果需要弃用某个 feature（例如下线 inspector），必须在 4 个目录中手工搜寻关联文件，极易产生僵尸代码；
  4. **违背 10 大原则之 Rule 6（Feature Isolation）**。

---

### 候选方案 B：特性垂直切片 + 领域底座架构（Domain & Feature-Centric Architecture）⭐ 【强烈推荐】

将业务特性按 **垂直闭环（Feature Isolation）** 组织，同时抽取全站共用的 **核心领域模型（Core Domain）** 与 **纯工具（Pure Utils）**：

```text
src/
├── core/                               <-- 【领域底座】全书内容与导航基础设施
│   ├── indexing/                       <-- 全局块索引 (cross-ref-indexer.mjs)
│   └── catalog/                        <-- 全书大纲导航模型 (sidebar.mjs)
├── features/                           <-- 【业务特性闭环】高度内聚、可独立启闭
│   ├── mdx-editor/
│   │   ├── core/                       <-- parse.mjs, locate-block.mjs, apply-op.mjs
│   │   ├── server/                     <-- dev-server-plugin.mjs
│   │   ├── client/                     <-- editor.ts (客户端交互)
│   │   └── components/                 <-- EditorMode.astro (UI 壳)
│   ├── module-inspector/
│   │   ├── core/                       <-- scanner.mjs (扫描与查重)
│   │   ├── server/                     <-- dev-server-plugin.mjs
│   │   ├── client/                     <-- inspector.ts (抽屉逻辑)
│   │   └── components/                 <-- ModuleInspector.astro (UI 壳)
│   ├── relation-graph/
│   │   ├── core/                       <-- generator.mjs (拓扑生成)
│   │   ├── server/                     <-- dev-server-plugin.mjs
│   │   ├── client/                     <-- relation-graph-client.ts (ECharts 逻辑)
│   │   └── components/                 <-- BookRelationGraph.astro (UI 壳)
│   ├── exercises/
│   │   ├── core/                       <-- 题库解析与模型 (未来归入)
│   │   ├── server/                     <-- dev-server-plugin.mjs
│   │   ├── client/                     <-- exercise-db-client.ts, exercise-controller.ts
│   │   └── components/                 <-- ExerciseModal.astro, ChapterQuiz.astro
│   └── feedback/
│       ├── core/                       <-- format-issue.ts
│       ├── client/                     <-- feedback-controller.ts
│       └── components/                 <-- FeedbackMode.astro
├── publishing/                         <-- 【纯出版编译层】LaTeX / Typst 格式化器 (Phase 3-B)
│   ├── latex/
│   └── typst/
├── plugins/                            <-- 【构建编译器插件】AST 转换中间件 (Phase 3-A)
│   └── rehype/
├── types/                              <-- 【纯类型契约】(Phase 2)
│   └── exercises.ts
└── utils/                              <-- 【纯无状态通用工具】极简、通用、零业务语义
    ├── slug.mjs
    ├── natural-sort.mjs
    ├── render-title.mjs
    ├── src-attrs.mjs
    └── artistic-qr.mjs
```

#### 方案 B 评估：
- **优点**：
  1. **完全符合 10 大架构原则**：
     - 严格落实 **Rule 6（Feature Isolation）**：每个 feature 是一个自洽的微架构，包含其 Core、Server、Client 与 UI。
     - 严格落实 **Rule 7（Utils Purity）**：`src/utils/` 彻底提纯，仅保留真正的通用纯工具，杜绝垃圾桶效应。
     - 严格落实 **Rule 1（UI is not a domain model）**：UI 位于最外层组件，核心逻辑在 `core/`。
  2. **与 `features.config.mjs` 完美映射**：
     - 项目中已有统一的特性配置中心 `features.config.mjs`。方案 B 与之形成 **1 对 1 的物理映射**。开启/关闭/重构一个 feature，边界极其清晰。
  3. **测试性极大提升**：每个 feature 的 `core/` 是纯逻辑，可直接编写针对纯函数的单元测试（如已有的 `scripts/_test-ops.mjs`）。
  4. **渐进式演进零风险**：每次可以只迁移一个 feature（如先单迁 `mdx-editor`），完全符合 **Rule 10（one boundary → one migration → one verification）**。

---

## 8. 单向依赖拓扑模型（Dependency Direction Model）

在推荐的方案 B 下，严格杜绝逆向依赖，依赖方向单向流动如下：

```text
               ┌──────────────────────────────┐
               │    src/types/ , src/utils/   │  (纯类型、纯工具：无状态、无业务)
               └──────────────┬───────────────┘
                              ▲
                              │
               ┌──────────────┴───────────────┐
               │          src/core/           │  (教材领域底座: catalog, indexing)
               └──────────────┬───────────────┘
                              ▲
                              │
               ┌──────────────┴───────────────┐
               │     src/features/*/core/     │  (特性纯核心: AST 算法, 扫描器, 拓扑引擎)
               └──────────────┬───────────────┘
                              ▲
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
┌────────┴────────┐  ┌────────┴────────┐  ┌────────┴────────┐
│  src/publishing │  │  src/features/  │  │  src/features/  │
│  (排版导出)      │  │  */server/      │  │  */client/      │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
               ┌──────────────┴───────────────┐
               │     src/components/ & UI     │  (页面、Astro 模板组件、布局)
               └──────────────────────────────┘
```

**铁律验证规则**：
- `core/` 不得依赖任何 `features/`；
- `features/*/core/` 不得依赖 `features/*/server/` 或 `features/*/client/`；
- `features/*/core/` 必须保持纯计算（无 Node `fs`，无浏览器 `window`）；
- `utils/` 不得依赖项目内任何其他目录。

---

## 9. 渐进式迁移步骤建议（Migration Order Proposal）

> ⚠️ **声明**：本建议仅供人工审阅决策，**本阶段绝对不执行任何迁移**。

若方案 B 获得批准，后续可严格遵循“小步快跑、单向验证”原则，按以下批次分步推进：

### 第一步：Phase 3-E — 提纯领域底座（Core Domain Extraction）
- 将全站共享的教材领域服务迁移至 `src/core/`：
  - `src/utils/cross-ref-indexer.mjs` → `src/core/indexing/cross-ref-indexer.mjs`
  - `src/utils/sidebar.mjs` → `src/core/catalog/sidebar.mjs`
- 验证门禁：`astro.config.mjs`、`build-cross-ref-data.mjs`、`test-crossref.mjs` 全量通过。

### 第二步：Phase 4-A — 特性闭环试点：MDX Editor 独立成岛
- 以独立性最高、已具备完善纯 Core 的 `mdx-editor` 为首个试点：
  - 将 `src/utils/mdx-editor/{parse,locate-block,apply-op}.mjs` 迁入 `src/features/mdx-editor/core/`
  - 将 `src/server/plugins/mdx-editor/dev-server-plugin.mjs` 迁入 `src/features/mdx-editor/server/`
  - （可选后续）将 `src/utils/editor.ts` 迁入 `src/features/mdx-editor/client/`
- 验证门禁：`dev-server` 探活 `/__edit__/health`，单元测试 `scripts/_test-ops.mjs` 通过。

### 第三步：Phase 4-B — 特性闭环推进：Module Inspector & Relation Graph
- 依照相同模型，依次建立：
  - `src/features/module-inspector/`
  - `src/features/relation-graph/`
- 消除两特性内部硬编码的 CSS/调色板坏味道，将展示配置提取到 client/UI 边界。

### 第四步：Phase 4-C — 客户端控制器归位与 `src/utils/` 最终提纯
- 将剩余在 `src/utils/` 的浏览器客户端控制器（`feedback-controller.ts`, `exercise-db-client.ts`, `page-preprocess.ts`）归入其对应边界；
- `src/utils/` 最终仅保留 4~5 个绝对纯净的通用算法工具。

---

## 10. 明确延期事项（Explicitly Deferred Work）

以下模块结构极其复杂或涉及大量前端组件，**严格禁止在近期迁移中触碰**：

1. `exercise-controller.ts`：
   - 包含 2000+ 行题库业务状态流转，必须在题库 feature core 稳定且有独立自动化回归套件后才可拆解；
2. `SidebarOverride.astro` 与 `PageSidebarOverride.astro`：
   - Astro 核心布局组件，深度耦合 Starlight 内部 props，延期至组件层解耦阶段；
3. `latex-cloud-compiler.ts`：
   - GitHub Actions 云端编译调度层，具有外部网络副作用，延期至出版云服务重构阶段；
4. `src/content/**` 与 `src/data/**`：
   - 教材与题库源数据，属于资产数据层，重构全过程绝对禁止直接修改内容。

---

*报告生成时间：2026-09-06*  
*执行原则遵循：Rule 0（行为保护）｜ Rule 1（禁止大爆炸）｜ Rule 6（特性隔离）｜ Rule 7（工具纯粹性）*  
*状态：等待人工审阅与方案决议。*
