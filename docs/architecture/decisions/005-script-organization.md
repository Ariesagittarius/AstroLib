# ADR 005: 自动化脚本库的结构化重组与运行时边界防御 (Script Organization)

- **状态**：Accepted
- **日期**：2026-09-06
- **决策者**：AstroLib 架构委员会

---

## 1. 当前问题 (Context & Problem Statement)

1. **扁平横向堆砌与职责失控**：
   - 根目录 `scripts/` 包含 36 个脚本与 2 个子目录，Python 导入脚本、Node 前置构建脚本、Git 双仓自动化、KaTeX 指标修复、临时测试与开发日志（`_devlog.txt`）横向平铺，难以分清谁是生产构建必需品，谁是一次性修补工具。
2. **命名概念混淆（`scripts/` vs `src/scripts/`）**：
   - 根目录 `scripts/` 是 Node/Python 离线自动化工具；
   - `src/scripts/` 却是浏览器端运行时前端脚本（如 `font-presets.ts`, `feature-toggles.ts`, `formula-actions.ts`）。
   - 两者命名极其相似，极易造成开发者与 Agent 的概念混淆与路径误投。
3. **存在明确的冗余实现**：
   - `inject-exercise-triggers.js` (CJS) 与 `inject-exercise-triggers.mjs` (ESM) 100% 重复。
4. **违规放置独立部署单元**：
   - `feedback-bot-worker.mjs` 是一个独立的 Cloudflare Worker，被直接裸放在 `scripts/` 根目录下。

---

## 2. 决策 (Decision)

1. **确立 `scripts/` 唯一职责（Rule 8）**：
   - `scripts/` 专属负责：构建（build）、导入（import）、导出（export）、维护（maintenance）与测试（test）自动化；
   - **铁律**：前台业务代码与运行期模块（`src/` 内部代码）**绝对禁止反向 import 任何 `scripts/` 下的代码**。
2. **重组为 6 大功能子目录**：
   ```
   scripts/
   ├── build/            # 前置数据生成 (build-exercise, build-ai-index, build-cross-ref...)
   ├── import/           # MinerU OCR 导入与章节切分流水线 (Python/Node)
   ├── export/           # 批量出版物生成 (generate-epub, batch-typst...)
   ├── git/              # 双仓脱敏与代码推送自动化 (git-clean-push, one-click-push...)
   ├── lint/             # 静态语法与指标检查 (scan-mdx, fix-katex-metrics...)
   └── lib/              # 仅供构建与脚本复用的私有工具库
   ```
3. **消除命名混淆**：
   - 将 `src/scripts/` 重构更名为 `src/client/` 或并入相关 Feature 目录，杜绝两个 `scripts` 目录并存的混乱局面。
4. **清理垃圾与移位部署单元**：
   - 删除 `_devlog.txt`；
   - 删除重复的 `.js` 脚本；
   - 将 `feedback-bot-worker.mjs` 移至专用的 `workers/` 目录。

---

## 3. 原因 (Rationale)

- **构建流程一目了然**：`package.json` 的 `build` 命令只需关注 `scripts/build/`，新人接手项目可快速理清构建流。
- **避免生产打包误用**：物理隔离离线脚本与浏览器运行时，防止任何脚本代码意外被 Vite 打包进网页端。

---

## 4. 替代方案 (Alternatives Considered)

- **方案 A：将所有脚本移入 `tools/` 根目录**
  - *弃用原因*：Astro 社区与 Node 项目通常以 `scripts/` 为标准脚本入口，变更目录名称会影响现存 CI 与 npm script 约定，改造成本大于收益。

---

## 5. 风险 (Risks)

- `package.json` 中的各构建指令路径需同步更新；若路径遗漏会导致 `npm run build` 抛出 `MODULE_NOT_FOUND`。

---

## 6. 迁移策略 (Migration Strategy)

1. **Phase 1（安全清理）**：删除 `scripts/inject-exercise-triggers.js`，删除 `_devlog.txt`；
2. **Phase 5（脚本重组）**：逐批建立子目录，移动脚本的同时同步更新 `package.json` 中的调用路径，并在每次移动后执行 `npm run build` 进行回归验证。
