# AstroLib Phase 3-E0 核心边界校验报告：Core Boundary Validation

> **阶段属性**：Phase 3-E0 (Architecture Boundary Verification & Decision)
> **操作纪律**：**零代码修改、零文件移动、零函数重构、零依赖变更、零破坏性操作**
> **前序基线**：Phase 3-C (`LOG-006` 门禁全通), Phase 3-D (`Candidate B` 架构方向暂定采纳)
> **本阶段目标**：穿透源码、调用链与合约语义，严格审验 `cross-ref-indexer.mjs` 与 `sidebar.mjs` 是否有资格成为独立无染的 `src/core/` 领域底座。

---

## 1. Scope（校验范围与目标）

本阶段仅对 Phase 3-D 提议归入 `src/core/` 的两个核心模块进行针对性深度检验：
1. **`src/utils/cross-ref-indexer.mjs`**：验证其是否真正属于 `src/core/indexing/`（教材内容实体索引底座）；
2. **`src/utils/sidebar.mjs`**：验证其产出究竟是独立于 UI 的教材目录领域模型，还是绑定了 Starlight 的前端侧边栏 Schema。

---

## 2. `cross-ref-indexer` 边界审定与判决

### 2.1 稳定领域能力审视
`cross-ref-indexer.mjs` 负责提供教材级别的 **学术实体块（Academic Block Entities）与位置解析能力**：
- 递归遍历合集内图书所有 MDX 文件；
- 识别并提取所有形式化学术容器：`<Example>`, `<Variant>`, `<Knowledge>`, `<Summary>`, `<Method>`, `<Conclusion>`, `<Block>`, `<Exercise>`, `<Solution>`；
- 执行规范化标题解析（剥离 Emoji、分解类别、序号与附加标题）；
- 生成稳定的块级路由定位锚点：`/${cleanSlugPath}/#${cleanId}`；
- 构建以标准核心 Key（如 `例1.74`）和全量 Key（如 `例1.74(洛必达法则)`）为索引的双向寻址字典。

### 2.2 核心概念辨析：Cross Reference Index vs. Cross Reference UI Feature
必须严格划清领域索引与交互特性的界限：
- **Cross Reference Index（领域索引底座）**：
  - 本质：纯粹的教材学术实体元数据字典（Key $\to$ Location Mapping）；
  - 职责：建立“哪本书的哪一章哪一行定义了哪个例题/定理”的绝对客观事实；
  - 属于：**Core Domain**。
- **Cross Reference UI Feature（引用交互特性）**：
  - 本质：AST 语法树重写、HTML 徽章渲染、浮层悬停预览、点击定位、滚动动画；
  - 载体：`src/plugins/rehype/rehype-cross-ref.mjs`、`src/components/sidebar/cross-ref-client.ts`；
  - 属于：**Compiler Plugin & Client Feature**。

### 2.3 语义与环境渗透审查
- **是否渗透 UI 表现层语义**：**否**。代码中无任何 HTML 标签拼接（只生成 URL 字符串与 cleanTitle 文本）、无 CSS 类名、无 SVG、无图标。
- **是否渗透 Starlight 专用概念**：**否**。无任何 Starlight props、无 sidebar 字段。
- **依赖纯粹性**：仅依赖 Node 原生 `node:fs`、`node:path` 与纯工具 `src/utils/slug.mjs`。
- **工具依赖合理性**：依赖 `slug.mjs` (`cleanSlug`) 完全合规，符合 `Core -> Utils` 的单向依赖原则。

### 2.4 多方消费与未来复用潜力
当前消费者：
1. `scripts/build-cross-ref-data.mjs`：构建期导出静态 JSON（供客户端懒加载）；
2. `src/utils/relation-graph/generator.mjs`：利用块索引反查章节间的依赖连线，构建拓扑图。

未来核心复用场景：
1. **AI / RAG / MCP 知识召回**：`src/ai/indexer.mjs` 当前仅切文本 chunk，未来利用实体索引可实现“直接召回例题 1.74 原文并附带精准章节跳转链接”；
2. **全文搜索扩展**：为 Pagefind / 本地搜索提供结构化的定理/例题独立搜索词条；
3. **教材出版索引页**：LaTeX / Typst 导出时生成书末“定理与例题索引表”。

### 2.5 审定结论
`cross-ref-indexer.mjs` 拥有明确、稳定、无 UI 污染、多方共享的领域能力。

> **判决：`cross-ref-indexer → APPROVE`**
> 允许后续整体迁移至 `src/core/indexing/cross-ref-indexer.mjs`。

---

## 3. `sidebar.mjs` 边界审定与判决（重点突破）

### 3.1 消费方式溯源
全代码库中 `sidebar.mjs` (`generateBookSidebar`) 仅有两个真实消费者：

#### 消费方 1：`astro.config.mjs`
```javascript
// astro.config.mjs
items: generateBookSidebar(`src/content/docs/collections/${col.slug}/${book.slug}`)
```
直接挂载到 Starlight 配置项 `starlight({ sidebar: dynamicSidebar })` 中。

#### 消费方 2：`src/ai/mcp/tools.mjs`
```javascript
// src/ai/mcp/tools.mjs (book_toc 工具)
run: (args) => {
  const meta = resolveBook(args.col, args.book);
  return { title: meta.title, toc: generateBookSidebar(meta.dir) };
}
```
AI MCP Agent 调用 `book_toc` 工具获取全书目录树。

### 3.2 实际输出对象结构审查
查看 `generateBookSidebar` 返回的数据结构：
```javascript
// 嵌套子文件夹
items.push({
  label: file.replace(/^\d+[_-]/, '').replace(/_/g, ' '),
  collapsed: true,  // 👈 致命审查点！
  items: subItems
});

// MDX 章节文件
items.push({
  label: title,
  link: slug
});
```

### 3.3 架构问题穿透：领域模型与 UI 表现配置的严重混淆
经严格审查，当前 `sidebar.mjs` 存在根本性的双重职责耦合：

1. **职责 A：Textbook Catalog Construction（教材目录结构解析，属于领域模型）**：
   - 扫描合集文件树；
   - 依据自然排序（Natural Sorting）对章节编号排序（1.1 $\to$ 1.2 $\to$ 1.10）；
   - 读取 Frontmatter 中的学术章节标题；
   - 提取规范化 slug。
2. **职责 B：Starlight Sidebar Formatting（Starlight UI 侧栏配置格式化，属于适配器层）**：
   - 将章节标题命名为 `label`；
   - 将路由命名为 `link`；
   - **硬编码注入 `collapsed: true`**（用于控制前端浏览器折叠手风琴展开状态的视觉表现参数！）。

### 3.4 为什么不能强行将 `sidebar.mjs` 整体定义为 Core？
1. **违背 Rule 1（UI is not a domain model）**：
   - `collapsed: true` 是纯粹的前端 UI 展示偏好，根本不属于教材目录的客观领域知识。一本书的章节只有“父子包含关系”和“前后次序关系”，不存在“折叠状态”这种物理属性。
2. **对下游消费者的不合理污染**：
   - 当 `src/ai/mcp/tools.mjs` 中的 AI 智能体查询 `book_toc` 时，返回的 JSON 数据中充斥着每个节点无意义的 `"collapsed": true`。AI 智能体不需要了解前端侧边栏是否折叠。
3. **架构适配器缺失**：
   - 如果未来 Astro 升级或将 Starlight 替换为其他呈现方案（或输出纯文本 TOC、EPUB NCX、PDF 书签），带有 `label`/`link`/`collapsed` 的结构将无法直接复用。

### 3.5 审定结论
当前 `sidebar.mjs` 属于“混合体”。绝不能将其作为一个整体文件直接晋升为 `src/core/`。

> **判决：`sidebar.mjs → SPLIT`**
> 必须拆分为：
> 1. **领域核心**：`src/core/catalog/book-catalog.mjs`（构建纯净的教材目录树）
> 2. **展示适配器**：`src/server/adapters/starlight-sidebar.mjs`（将纯目录树转译为 Starlight sidebar schema 并注入 `collapsed: true`）

---

## 4. Actual Input / Output Contracts（输入/输出契约设计）

### 4.1 `src/core/indexing/cross-ref-indexer.mjs` 契约
```typescript
// 纯数据契约，无任何 UI 属性
export interface BlockLocation {
  url: string;           // e.g. "/math/linear_algebra/ch1/#例-1-74"
  chapterTitle: string;  // e.g. "1.1 向量空间与子空间"
  rawTitle: string;      // e.g. "例 1.74 (洛必达法则)"
  cleanTitle: string;    // e.g. "例 1.74 (洛必达法则)"
}

export type GlobalBlockIndex = Record<string, BlockLocation[]>;

// 输入：合集 slug 与图书 slug (或绝对目录)，可选是否强制绕过缓存
export function buildGlobalBlockIndex(
  colSlug: string,
  bookSlug: string,
  force?: boolean
): GlobalBlockIndex;

export interface TitleDetails {
  type: string;
  num: string;
  extra: string;
  coreKey: string;
  fullKey: string;
  cleanTitle: string;
}

export function parseTitleDetails(rawTitle: string): TitleDetails;
```

### 4.2 拆分后的 `src/core/catalog/` 契约（纯领域模型）
```typescript
// 教材目录节点模型（完全中立于任何前端框架）
export interface CatalogChapterNode {
  type: 'chapter';
  title: string;
  slug: string;
  filePath: string;
}

export interface CatalogGroupNode {
  type: 'group';
  title: string;
  slug: string;
  children: Array<CatalogChapterNode | CatalogGroupNode>;
}

export type BookCatalog = Array<CatalogChapterNode | CatalogGroupNode>;

// 核心函数：读取教材目录树
export function buildBookCatalog(bookDir: string): BookCatalog;
```

### 4.3 拆分后的 Starlight Adapter 契约（UI 适配器）
```typescript
// 仅在配置/服务器层使用，负责贴合 Starlight 格式
export interface StarlightSidebarLeaf {
  label: string;
  link: string;
}

export interface StarlightSidebarGroup {
  label: string;
  collapsed: boolean;
  items: Array<StarlightSidebarLeaf | StarlightSidebarGroup>;
}

export function toStarlightSidebar(
  catalog: BookCatalog,
  options?: { defaultCollapsed?: boolean }
): Array<StarlightSidebarLeaf | StarlightSidebarGroup>;
```

---

## 5. Runtime Boundaries（运行时边界分析）

| 模块 / 拆分后单元 | 运行环境 | Node 原生依赖 | 浏览器 Web API 依赖 | 内存副作用 |
| :--- | :--- | :---: | :---: | :--- |
| `cross-ref-indexer.mjs` | Node CLI / Build | `node:fs`, `node:path` | 零 | 含有基于 mtime 签名的模块级 Map 缓存 |
| `core/catalog/book-catalog.mjs` | Node CLI / Build / Server | `node:fs`, `node:path` | 零 | 纯文件树遍历，无全局可变状态 |
| `adapters/starlight-sidebar.mjs` | Node (Astro config 评估期) | 无（纯数据映射） | 零 | 纯函数（输入 Catalog，输出 Starlight 结构） |

---

## 6. Consumer Analysis（调用方影响矩阵）

```text
[Current Topology]
astro.config.mjs ─────────────────► src/utils/sidebar.mjs (混杂 UI 属性)
src/ai/mcp/tools.mjs ─────────────► src/utils/sidebar.mjs (被动接收 collapsed)

scripts/build-cross-ref-data.mjs ─► src/utils/cross-ref-indexer.mjs (领域索引)
src/utils/relation-graph/generator ► src/utils/cross-ref-indexer.mjs (领域索引)

[Proposed Target Topology]
astro.config.mjs ──► src/adapters/starlight/sidebar.mjs ──► src/core/catalog/
src/ai/mcp/tools.mjs ─────────────────────────────────────► src/core/catalog/ (获取纯净 TOC)

scripts/build-cross-ref-data.mjs ─────────────────────────► src/core/indexing/
src/features/relation-graph/core/ ────────────────────────► src/core/indexing/
```

---

## 7. Hidden Coupling & Smells（遗留隐式耦合排查）

1. **路径依赖隐含 `process.cwd()`**：
   - `cross-ref-indexer.mjs` 内部当前写死 `path.resolve('src/content/docs/collections/...')`；
   - 后续进入 Core 时，应允许显式传入 `bookDir` 或根路径参数，使其具备真正的环境自洽能力。
2. **向后兼容性假性导出**：
   - `src/utils/sidebar.mjs` 当前末尾仍保留 `export { naturalSort, cleanSlug }` 用于历史兼容；
   - 拆分后应在过渡期保留别名重定向，避免老脚本中断。

---

## 8. Proposed Final Boundaries（最终物理边界规划）

在未来执行阶段（本次不操作），边界规划如下：

```text
src/
├── core/                                   <-- 【领域底座】
│   ├── indexing/
│   │   └── cross-ref-indexer.mjs           <-- APPROVED: 全局块实体索引器
│   └── catalog/
│       └── book-catalog.mjs                <-- SPLIT: 纯净全书大纲目录模型生成器
├── server/
│   └── adapters/
│       └── starlight-sidebar.mjs           <-- SPLIT: 专门将 Catalog 转换为 Starlight Sidebar 格式
...
```

---

## 9. Migration Preconditions（后续迁移前置条件）

在真正批准对上述模块执行迁移代码前，必须满足：
1. **无行为变化测试套件**：建立针对 `buildGlobalBlockIndex` 和 `generateBookSidebar` 输出快照（Snapshot）的回归测试，保证迁移前后输出的 JSON 和 Sidebar 数组完全一致；
2. **单步迁移纪律**：
   - 先迁 `cross-ref-indexer`（整体移动，风险极小）；
   - 后做 `sidebar` 的“先提纯 Core、后抽离 Adapter”两步式平滑过渡；
3. **保持测试门禁全绿**：`npm run build`、`test-crossref`、`test-latex-export`、`test-typst-export`。

---

## 10. Risks（风险评估）

| 风险点 | 影响面 | 等级 | 缓解方案 |
| :--- | :--- | :---: | :--- |
| `sidebar.mjs` 拆分导致 Starlight 侧栏丢失 | 站点全局导航 | 中 | 在过渡期让 `src/utils/sidebar.mjs` 作为 Adapter 的包装转发层，保持原有调用签名 100% 不变 |
| `cross-ref-indexer` 相对路径变动 | 跨页引用与关系图 | 低 | 仅涉及 2 处直接调用方（`build-cross-ref-data.mjs` 和 `relation-graph/generator.mjs`）的导入路径更新 |

---

## 11. Explicitly Deferred Work（明确延期事项）

1. `src/content/**` 与 `src/data/**`：严禁修改；
2. `exercise-controller.ts` 与 `SidebarOverride.astro`：冻结；
3. `latex-cloud-compiler.ts`：维持现状；
4. 特性闭环（`src/features/`）：等待 Core 底座迁移并验证完成后再行开启。

---

## 12. 最终审定结论与推荐下一步

### 审定判决
* **`cross-ref-indexer → APPROVE`**：契约稳定，零 UI 污染，具备明确的全局领域索引价值，准予作为 `src/core/indexing/`。
* **`sidebar.mjs → SPLIT`**：拒绝直接作为整体 Core。必须拆解为 `src/core/catalog/`（纯目录模型）与 `src/server/adapters/`（Starlight UI 适配器）。

### 推荐下一步执行顺序（需待批准后启动）
1. **Step 1 (Phase 3-E1)**：迁移 `cross-ref-indexer.mjs` $\to$ `src/core/indexing/cross-ref-indexer.mjs`（单边界平移，更新 2 处引用并验证）；
2. **Step 2 (Phase 3-E2)**：重构并解耦 `sidebar.mjs` $\to$ 提取 `src/core/catalog/book-catalog.mjs` + 保留/建立 Starlight 导航适配器。

---

*报告生成时间：2026-09-06*
*执行原则遵循：Rule 0（行为保护）｜ Rule 1（UI 不是领域模型）｜ 零修改勘察*
*状态：已停止操作，等待人工审核决策。*
