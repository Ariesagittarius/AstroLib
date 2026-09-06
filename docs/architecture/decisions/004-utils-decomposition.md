# ADR 004: God Folder `src/utils/` 的体系化拆解与职责纯化 (Utils Decomposition)

- **状态**：Accepted
- **日期**：2026-09-06
- **决策者**：AstroLib 架构委员会

---

## 1. 当前问题 (Context & Problem Statement)

`src/utils/` 已彻底沦为 AstroLib 最大的代码堆积地与架构违规集中区（违反 Rule 7）：
1. **环境完全混杂**：
   - 依赖 Node 原生 `node:fs`、`node:child_process` 的文件系统扫描器（`scanner.mjs`, `generator.mjs`, `apply-op.mjs`）；
   - 运行在 Vite Dev Server 内部的 4 个 HTTP 中间件（`dev-server-plugin.mjs`）；
   - 拥有巨型 DOM 事件、弹窗与动画逻辑的客户端脚本（`editor.ts` 69KB, `inspector.ts` 48KB, `relation-graph-client.ts` 29KB）；
   - Unified / Remark / Rehype AST 编译插件；
   - LaTeX 和 Typst 专业排版编译器。
2. **严重的反向依赖温床**：
   - 因为所有“非组件代码”都被塞进 `src/utils/`，导致底层排版编译器为了获取类型，不得不反向从顶层 UI 控制器中导入 `SlimQuestionItem`（违反 Rule 1、Rule 2）。

---

## 2. 决策 (Decision)

按照**执行宿主环境（Runtime Target）**与**业务领域职责**，系统性拆解 `src/utils/`，严禁继续向 `utils/` 添加任何具有业务语义的模块（Rule 7）：

```
[原 src/utils/ 杂糅资产]
        │
        ├──► 独立出版与编译器 ──► src/publishing/ (LaTeX, Typst, EPUB, SVG)
        │
        ├──► 编译期 AST 插件  ──► src/plugins/rehype/ (KaTeX, CrossRef, Mermaid)
        │
        ├──► 开发服务中间件   ──► src/server/plugins/ (Vite Connect Handlers)
        │
        ├──► 特性私有控制器   ──► src/features/<feature>/ (Editor, Inspector, Graph)
        │
        └──► 纯无状态通用工具 ──► src/lib/utils/ (cleanSlug, naturalSort, srcAttrs)
```

- **纯化后的 `src/lib/utils/` 准入标准**：
  - 必须是**纯函数（Pure Functions）**；
  - 必须是**无状态的（Stateless）**；
  - **绝不包含任何业务分支硬编码**（例如不出现“若是工科数分则执行 A”的逻辑）；
  - **绝不包含具体的 UI/DOM 操作与 Node 原生 I/O**。

---

## 3. 原因 (Rationale)

- **消除 Bundle 污染与打包崩溃**：Node.js 原生 API 与浏览器 DOM 操作物理隔离，彻底避免 Vite/Rollup 将 Node 模块误打包进客户端产物导致的运行时抛错。
- **确立清晰的分层边界**：出版系统可独立于 UI 运行，开发服务器插件可集中配置，各业务特性高度内聚。

---

## 4. 替代方案 (Alternatives Considered)

- **方案 A：仅按文件类型拆分（如 `utils/ts/`, `utils/mjs/`）**
  - *弃用原因*：毫无语义价值，仍无法解决环境混淆与反向依赖问题。
- **方案 B：一次性将 `src/utils/` 整个目录彻底重命名或平移**
  - *弃用原因*：违反 Rule 10（禁止 Big Bang Rewrite）。全站有几十个文件引用了 `src/utils/` 下的路径，一枪过容易引发灾难性语法故障。

---

## 5. 风险 (Risks)

- **模块重导出与引用路径更新**：多层级迁移过程中，需要细心处理各文件的相对导入路径（`../`）。

---

## 6. 迁移策略 (Migration Strategy)

严格推行**多步走渐进迁移**：
1. **第一步（类型先导）**：先建立 `src/lib/models/`，抽离纯数据契约，消除编译器的反向依赖；
2. **第二步（无头出版隔离）**：将 `latex/` 与 `typst/` 迁至 `src/publishing/`；
3. **第三步（AST 插件收拢）**：将 `rehype-*.mjs` 整理至 `src/plugins/rehype/`；
4. **第四步（特性下沉）**：将各业务子系统客户端与 Vite 插件迁移至 `src/features/`；
5. **第五步（纯化）**：将留下的通用工具移入 `src/lib/utils/`，安全废弃旧 `src/utils/`。
