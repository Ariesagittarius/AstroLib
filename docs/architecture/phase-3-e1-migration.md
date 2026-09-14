# AstroLib Phase 3-E1 迁移执行报告：Cross-Reference Core Migration

> **阶段执行结果**：**PHASE 3-E1: PASS**
> **执行时间**：2026-09-06
> **目标**：仅将 `src/utils/cross-ref-indexer.mjs` 物理迁移至 `src/core/indexing/cross-ref-indexer.mjs`，完成首个核心领域底座的物理归位。
> **执行纪律**：零业务重构、零算法修改、零数据结构改动、无多余文件变动。

---

## 1. Before / After（迁移前后对照）

| 项目 | 迁移前 (Before) | 迁移后 (After) |
| :--- | :--- | :--- |
| **物理路径** | `src/utils/cross-ref-indexer.mjs` | `src/core/indexing/cross-ref-indexer.mjs` |
| **架构归属** | 工具目录（`src/utils/`）混杂态 | 核心领域底座（`src/core/indexing/`） |
| **层级深度** | 2 级（`src/utils/`） | 3 级（`src/core/indexing/`） |
| **内部工具引用** | `import { cleanSlug } from './slug.mjs'` | `import { cleanSlug } from '../../utils/slug.mjs'` |

---

## 2. 实际移动文件（Files Moved via `git mv`）

```bash
git mv src/utils/cross-ref-indexer.mjs src/core/indexing/cross-ref-indexer.mjs
```

物理目录变化：
- 新建目录：`src/core/indexing/`
- 移动文件：1 个文件 (`cross-ref-indexer.mjs`)
- 原路径 `src/utils/cross-ref-indexer.mjs` 彻底消除，无残留。

---

## 3. Import 变更（Import Changes）

全量扫描并更新了代码库中所有真实引用点（共 3 处）：

1. **[scripts/build-cross-ref-data.mjs](file:///d:/Antigravity/project/AstroLib/scripts/build-cross-ref-data.mjs#L9)**：
   ```javascript
   // 迁移前: import { buildGlobalBlockIndex } from '../src/utils/cross-ref-indexer.mjs';
   import { buildGlobalBlockIndex } from '../src/core/indexing/cross-ref-indexer.mjs';
   ```
2. **[src/utils/relation-graph/generator.mjs](file:///d:/Antigravity/project/AstroLib/src/utils/relation-graph/generator.mjs#L26)**：
   ```javascript
   // 迁移前: import { buildGlobalBlockIndex } from '../cross-ref-indexer.mjs';
   import { buildGlobalBlockIndex } from '../../core/indexing/cross-ref-indexer.mjs';
   ```
3. **[src/core/indexing/cross-ref-indexer.mjs](file:///d:/Antigravity/project/AstroLib/src/core/indexing/cross-ref-indexer.mjs#L3)**：
   ```javascript
   // 迁移前: import { cleanSlug } from './slug.mjs';
   import { cleanSlug } from '../../utils/slug.mjs';
   ```
4. **[src/components/PageSidebarOverride.astro](file:///d:/Antigravity/project/AstroLib/src/components/PageSidebarOverride.astro#L3)**：
   - 同步修正注释中的架构路径说明至 `src/core/indexing/cross-ref-indexer.mjs`。

---

## 4. 依赖审计与单向流验证（Dependency & Isolation Audit）

执行代码静态扫描，对 `src/core/` 进行了严格的反向依赖审查：

1. **反向依赖审计**：
   - `src/core` $\to$ `src/features`：**0 matches**
   - `src/core` $\to$ `src/components`：**0 matches**
   - `src/core` $\to$ `src/client`：**0 matches**
   - `src/core` $\to$ `src/server`：**0 matches**
   - 结论：`src/core/indexing/cross-ref-indexer.mjs` 仅依赖 Node 内置模块（`node:fs`, `node:path`）与纯通用工具（`src/utils/slug.mjs`），无任何向上的逆向耦合。
2. **旧路径残留扫描**：
   - 全代码库搜索 `utils/cross-ref-indexer`、`../cross-ref-indexer`：**0 matches**（100% 清洁无残留）。

---

## 5. 验证结果（Verification Gates）

| 门禁项 | 执行命令 | 预期 / 实际结果 | 状态 |
| :--- | :--- | :--- | :---: |
| **Gate 1: KaTeX 规范检查** | `npm run check:katex` | 576 篇 MDX 字符合规，0 异常 | **PASS** |
| **Gate 2: 跨页引用构建** | `node scripts/build-cross-ref-data.mjs` | 6 本书、共 3244 条引用项成功写入 `public/data/cross-ref/` | **PASS** |
| **Gate 3: 引用徽章下沉测试** | `node scripts/test-crossref.mjs` | 33 个 block badges，30 个 interactive badges 正常生成 | **PASS** |
| **Gate 4: 关系图谱构建** | `node scripts/build-relation-graphs.mjs` | 6 本书、共 93 条关联边、138 次跨章引用拓扑构建成功 | **PASS** |
| **Gate 5: LaTeX 出版导出** | `node scripts/test-latex-export.mjs` | 工科数分 1511 题 + 题库 2915 题全部通过 | **PASS** |
| **Gate 6: Typst 出版导出** | `node scripts/test-typst-export.mjs` | 1511 题全量通过，原生 Typst 编译 PDF 成功 | **PASS** |
| **Gate 7: 生产构建** | `npm run build` | **595 个 HTML 静态页面全量生成**，耗时 3m 26s，Exit Code 0 | **PASS** |

---

## 6. 是否发现隐藏耦合（Hidden Coupling Findings）

- 勘察中确认：`cross-ref-indexer.mjs` 内部当前使用 `path.resolve('src/content/docs/collections/...')`，依赖当前工作目录 `process.cwd()` 为项目根。
- 在当前构建流水线（所有脚本与 Astro 均在项目根启动）下工作完全正常。
- 建议未来在 Core 层深化时，可考虑允许显式传入根路径参数以增强纯度。本阶段保持零逻辑修改，未引入任何风险。

---

## 7. 是否发现行为变化（Behavioral Changes）

- **零行为变化**：
  - 生成的 `public/data/cross-ref/*.json` 校验和与内容条目完全一致；
  - 引用徽章下沉渲染结果完全一致；
  - 构建产物页面数量（595 页）与内容完全一致。

---

## 8. Rollback 方法（回滚指令）

若需单步回滚 Phase 3-E1：
```bash
git mv src/core/indexing/cross-ref-indexer.mjs src/utils/cross-ref-indexer.mjs
rm -rf src/core/indexing src/core
git checkout -- scripts/build-cross-ref-data.mjs src/utils/relation-graph/generator.mjs src/components/PageSidebarOverride.astro src/utils/cross-ref-indexer.mjs
```

---

## 9. 结论

**PHASE 3-E1: PASS**

- `src/utils/cross-ref-indexer.mjs` 已成功、平稳迁移至 `src/core/indexing/cross-ref-indexer.mjs`。
- 所有 7 项验证门禁全绿通过。
- 严格遵循纪律：**立即停止，不执行 Phase 3-E2，等待人工审核。**
