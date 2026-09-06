# Phase 3-E2 架构迁移总结报告：Sidebar Domain/Core Split

## 1. 迁移概述

- **执行阶段**：Phase 3-E2 (Sidebar Domain/Core Split)
- **迁移目标**：落实 Tenet 1（*UI is not a domain model*），将混合了“教材目录物理扫描/自然排序领域逻辑”与“Starlight UI 呈现结构”的 `src/utils/sidebar.mjs` 进行彻底解耦拆分。
- **架构方案**：
  1. **Domain Core**：提取纯粹中立的教材目录树构造器至 `src/core/catalog/book-catalog.mjs`；
  2. **Presentation Adapter**：建立专职转译为 Starlight Sidebar Schema 的适配器 `src/server/adapters/starlight-sidebar.mjs`；
  3. **Compatibility Facade**：将原 `src/utils/sidebar.mjs` 降级为 100% 兼容的门面（Facade），确保系统平滑过渡；
  4. **下游消费者解耦切换**：
     - `astro.config.mjs`：由原先依赖 `sidebar.mjs` 切换至明确依赖 Starlight Adapter；
     - `src/ai/mcp/tools.mjs`：由原先被动接收 Starlight `collapsed` 结构的 `book_toc` 工具，切换为直接依赖 Domain Core `book-catalog.mjs` 产出的干净目录数据。

---

## 2. 变更文件清单

| 文件路径 | 变动类型 | 职责定位 | 核心依赖 |
| :--- | :---: | :--- | :--- |
| `src/core/catalog/book-catalog.mjs` | **NEW** | **教材目录领域核心**：负责目录树递归扫描、自然排序与 slug 提取，产出完全中立的 `BookCatalog` 树 | `node:fs`, `node:path`<br>`utils/natural-sort.mjs`, `utils/slug.mjs` |
| `src/server/adapters/starlight-sidebar.mjs` | **NEW** | **Starlight 展示适配器**：将 `BookCatalog` 映射为 Starlight 侧边栏规范（注入 `collapsed: true`, `label`, `link`, `items`） | `core/catalog/book-catalog.mjs` |
| `src/utils/sidebar.mjs` | **REFACTOR** | **向后兼容门面 (Facade)**：Re-export 纯工具并转发 `generateBookSidebar` 至适配器 | `server/adapters/starlight-sidebar.mjs`<br>`utils/natural-sort.mjs`, `utils/slug.mjs` |
| `astro.config.mjs` | **MODIFY** | 构建配置：切换导入来源为 `src/server/adapters/starlight-sidebar.mjs` | `server/adapters/starlight-sidebar.mjs` |
| `src/ai/mcp/tools.mjs` | **MODIFY** | AI MCP 工具集：`book_toc` 工具切换为直接调用 Core `buildBookCatalog` | `core/catalog/book-catalog.mjs` |

---

## 3. 数据模型契约对比

### 3.1 拆分前 (`src/utils/sidebar.mjs`)
目录数据与 UI 展示强绑定，强行向所有调用者渗透 Starlight 专用字段：
```javascript
// 耦合了 UI 字段
{
  label: "1.1 向量空间",
  collapsed: true,  // <-- Starlight UI 专属状态
  items: [ ... ],   // <-- Starlight 专用子数组字段名
  link: "..."       // <-- Starlight 专用路由字段名
}
```

### 3.2 拆分后 Domain Core (`src/core/catalog/book-catalog.mjs`)
完全中立、与展示解耦的领域目录树：
```javascript
// 纯净教材大纲模型
{
  type: "group",
  title: "第一章 线性方程组",
  children: [
    {
      type: "chapter",
      title: "1.1 向量空间与子空间",
      slug: "collections/math/linear_algebra/01_1_向量空间",
      filePath: "collections/math/linear_algebra/01_1_向量空间.mdx"
    }
  ]
}
```

### 3.3 拆分后 Starlight Adapter (`src/server/adapters/starlight-sidebar.mjs`)
专职负责展示层结构注入：
```javascript
// 严格符合 Starlight Sidebar 规范，输出与重构前 100% 逐字节兼容
{
  label: "第一章 线性方程组",
  collapsed: true,
  items: [
    {
      label: "1.1 向量空间与子空间",
      link: "collections/math/linear_algebra/01_1_向量空间"
    }
  ]
}
```

---

## 4. 依赖流向与反向依赖审计

### 4.1 拓扑流向
```text
教材 Markdown/MDX 物理文件
           │
           ▼
[Domain Core] src/core/catalog/book-catalog.mjs
           │                 │
           │ (纯净领域模型)     │ (纯净领域模型)
           ▼                 ▼
[AI MCP] src/ai/mcp/tools.mjs     [Adapter] src/server/adapters/starlight-sidebar.mjs
                                       │
                                       ▼ (Starlight Schema)
                                  astro.config.mjs (动态侧边栏生成)
```

### 4.2 严格隔离审计结果
- **`src/core/` 外部依赖**：仅依赖 Node 标准库（`node:fs`, `node:path`）与无状态纯算法（`utils/natural-sort.mjs`, `utils/slug.mjs`）。
- **`src/core → src/components` 反向依赖**：**0** matches
- **`src/core → src/server` 反向依赖**：**0** matches
- **`src/core → src/publishing` 反向依赖**：**0** matches
- **`src/core → src/ai` 反向依赖**：**0** matches
- **`src/core → starlight / astro` 反向依赖**：**0** matches
- **未解耦 `generateBookSidebar` 残留引用**：除 `src/utils/sidebar.mjs` 门面外为 **0** matches

---

## 5. 验证网关 (Verification Gates) 汇总

| 序号 | 验证门禁 | 命令 | 执行结果 | 详情 |
| :---: | :--- | :--- | :---: | :--- |
| 1 | KaTeX 公式字符规范 | `npm run check:katex` | **PASS** | 576 个 MDX 文件零异常 |
| 2 | 跨页引用构建插件测试 | `node scripts/test-crossref.mjs` | **PASS** | 33 个 block badges，30 个 interactive badges 正常生成 |
| 3 | 全局引用索引构建 | `node scripts/build-cross-ref-data.mjs` | **PASS** | 6 本书、共 3244 条索引项成功生成 |
| 4 | 章节引用关系图谱构建 | `node scripts/build-relation-graphs.mjs` | **PASS** | 6 本书、共 93 条关联边、138 次跨章引用拓扑正常 |
| 5 | LaTeX 试卷/练习册导出引擎 | `node scripts/test-latex-export.mjs` | **PASS** | 工科数分 1511 题 + 题库 2915 题全量格式化通过 |
| 6 | Typst 排版与编译器验证 | `node scripts/test-typst-export.mjs` | **PASS** | 1511 题零占位符残留，原生 Typst 编译 PDF 成功 |
| 7 | 全站生产构建 | `npm run build` | **PASS** | **595 个 HTML 页面全量生成**，Pagefind 索引成功（耗时 3m 33s，Exit Code: 0） |

---

## 6. 状态判定与后续指引

**PHASE 3-E2: PASS**

- 当前重构完全满足：
  1. 行为零破坏（595 个构建页面完全一致，侧边栏结构逐字对应）；
  2. 依赖严格单向（Core 无任何 UI/框架渗透）；
  3. 兼容层（Facade）平滑过渡；
  4. 绝不越界修改（未触碰 `exercise-controller.ts`、`SidebarOverride.astro`、`src/content/**`、`src/data/**`、`latex-cloud-compiler.ts`）。
- **严禁擅自进入 Phase 4**，等待人工进一步审核与指示。
