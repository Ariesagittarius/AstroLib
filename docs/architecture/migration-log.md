# AstroLib 架构迁移执行日志 (Migration Log)

> 本文档用于全程、客观、逐笔记录 AstroLib 架构迁移过程中的每一次实际变更。
> 记录要求：必须包含日期、执行阶段、修改/删除内容明细、涉及文件数、严格的验证结果及回滚措施。

---

## 迁移记录总表

| 记录编号 | 执行日期 | 所属阶段 | 变更主题 | 变动文件数 | 验证状态 | 操作人/Agent |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **LOG-001** | 2026-09-06 | Phase 0 | 架构考古调查与迁移规划基准建立 | 10 个文档 | PASS | Antigravity |
| **LOG-002** | 2026-09-06 | Phase 1 | Safe Cleanup 安全清理 (冗余脚本、.bak、测试垃圾、重复技能与日志) | 27 个文件 | PASS | Antigravity |
| **LOG-003** | 2026-09-06 | Phase 2 | 解除 Publishing/Processing 对 UI Controller 的反向依赖 (抽离领域模型至 src/types/exercises.ts) | 4 个文件 | PASS | Antigravity |
| **LOG-004** | 2026-09-06 | Phase 3-A | Pure Utilities 纯工具纯化 + 编译期 Rehype 插件迁移至 src/plugins/rehype/ | 16 个文件 | PASS | Antigravity |
| **LOG-005** | 2026-09-06 | Phase 3-B | Publishing Layer 独立迁移 (LaTeX / Typst Generator 迁移至 src/publishing/) | 6 个文件 | PASS | Antigravity |

---

## 详细记录明细

### LOG-001: 2026-09-06 — Phase 0: 架构考古与迁移规划建立
- **执行阶段**：Phase 0 (Architecture Archaeology & Planning)
- **修改内容**：
  1. 完成全站架构深度调查，产出 6 份考古报告：`overview.md`, `directory-map.md`, `dependency-map.md`, `data-flow.md`, `build-pipeline.md`, `migration-risks.md`；
  2. 固化 10 项架构底线法则至 `AGENTS.md`；
  3. 创建目标架构规范：`target-architecture.md`；
  4. 建立 5 份核心架构决策记录：ADR 001 ~ ADR 005 (`docs/architecture/decisions/`)；
  5. 制定 7 阶段迁移路线图：`migration-plan.md`；
  6. 建立本迁移追踪日志：`migration-log.md`。
- **变动文件数**：新增 10 个文档，更新 1 个文档 (`AGENTS.md`)。源码、构建配置及业务数据零改动。
- **验证结果**：文档全部生成无误，格式与依赖链路交叉比对一致。
- **风险评估**：**ZERO RISK**（纯文档工作，无运行时副作用）。
- **回滚方式**：`git checkout -- AGENTS.md && rm -rf docs/architecture/`。

---

### LOG-002: 2026-09-06 — Phase 1: Safe Cleanup 安全清理
- **执行阶段**：Phase 1 (Safe Cleanup)
- **修改内容**：
  1. **删除完全重复脚本**：
     - 删除 `scripts/inject-exercise-triggers.js` (CJS，与 `inject-exercise-triggers.mjs` 100% 重复且全项目无任何引用)。
  2. **删除无用历史备份文件**：
     - 删除 `src/config/features.config.mjs.bak`
     - 删除 `src/styles/custom.css.bak`
     - 删除 `astro.config.mjs.bak`
  3. **清理 public 目录测试生成垃圾与日志**：
     - 删除 `public/missfont.log`
     - 删除 `public/test_exam_output.*` (aux, idx, log, mst, pdf, tex, typ)
     - 删除 `public/test_handout_output.*` (aux, idx, log, mst, pdf, tex, typ)
     - 删除 `public/test_textbook_ch1_correct.pdf`
     - 删除 `public/test_workbook_output.typ`
     （共计 18 个测试残留文件，彻底消除生产打包泄漏隐患）。
  4. **重定向测试脚本输出路径**：
     - 修改 `scripts/test-latex-export.mjs` 与 `scripts/test-typst-export.mjs`，将代表性测试文件保存路径从 `public/` 重定向至 `.tmp/test-output/`；
     - 在 `.gitignore` 中追加 `.tmp/` 规则，确保未来测试绝不再次污染 `public/`。
  5. **清理开发期临时日志**：
     - 删除 `scripts/_devlog.txt`。
  6. **合并 Agent 技能并消除冗余目录**：
     - 将 `.dsh/skills/efficient-execution` 完整移入 `.agents/skills/efficient-execution`；
     - 删除冗余镜像目录 `.dsh/`。
- **变动文件数**：
  - 物理删除文件：23 个文件 + 1 个冗余目录 (`.dsh/`)
  - 路径重定向与忽略规则更新：3 个文件 (`test-latex-export.mjs`, `test-typst-export.mjs`, `.gitignore`)
- **验证结果**：
  - `npm run build` 全流程通过（包含 5 步数据生成前置管线，595 个 HTML 页面全部正常编译输出，耗时 3m 4s，Exit Code: 0）；
  - `node scripts/test-latex-export.mjs` 执行通过（工科数分 1511 题 + 题库 2915 题 100% 通过，产物安全输出至 `.tmp/test-output/`）；
  - `node scripts/test-typst-export.mjs` 执行通过（1511 题 100% 通过，原生 Typst 编译 PDF 成功）；
  - `npm run check:katex` 执行通过（576 个 MDX 文件零字符异常）；
  - `public/` 保持绝对纯净，仅含合法封面、图标与构建数据目录。
- **风险评估**：**LOW / ZERO IMPACT**（无任何业务代码改动，无破坏性影响）。
- **回滚方式**：`git checkout -- scripts/ .gitignore && git checkout HEAD -- public/ scripts/`。

---

### LOG-003: 2026-09-06 — Phase 2: 解除 Publishing/Processing 对 UI Controller 的反向依赖
- **执行阶段**：Phase 2 (Dependency Boundary: Decouple Publishing Types)
- **修改内容**：
  1. **新建领域数据模型契约** (`src/types/exercises.ts`)：
     - 将 `SlimQuestionItem`, `ChapterData`, `PaperSummary`, `SinglePaperData`, `QuestionOption`, `SubQuestion`, `ChapterSectionSummary` 接口提升至纯领域类型层（Layer 2）；
     - 遵循 Rule 1（UI is not a domain model）与 Rule 2（Publishing is independent）；
  2. **重定向导出编译器类型依赖**：
     - 修改 `src/utils/latex/latex-generator.ts`，将 `SlimQuestionItem` 导入路径由 `../../components/exercises/exercise-controller` 改为 `../../types/exercises`；
     - 修改 `src/utils/typst/typst-generator.ts`，将 `SlimQuestionItem` 导入路径由 `../../components/exercises/exercise-controller` 改为 `../../types/exercises`；
  3. **重构 UI 控制器类型源并保留向后兼容**：
     - 修改 `src/components/exercises/exercise-controller.ts`，从 `../../types/exercises` 导入领域模型，并通过 `export type { ... }` 保持向后兼容再导出，避免破坏潜在外部引用。
- **变动文件数**：
  - 新建：1 个文件 (`src/types/exercises.ts`)
  - 修改：3 个文件 (`src/utils/latex/latex-generator.ts`, `src/utils/typst/typst-generator.ts`, `src/components/exercises/exercise-controller.ts`)
- **验证结果**：
  - 全局代码依赖反向检查：`src/utils/latex` 与 `src/utils/typst` 对 `components` 的反向依赖全部清零 (0 matches)；
  - `node scripts/test-latex-export.mjs` 执行通过（工科数分 1511 题 + 题库 2915 题全部成功生成并通过语法校验）；
  - `node scripts/test-typst-export.mjs` 执行通过（1511 题全量扫描 0 异常，原生 Typst 编译 PDF 成功）；
  - `npm run check:katex` 执行通过（576 个 MDX 文件零字符异常）；
  - `npm run build` 全站静态构建通过（595 个页面全部生成，耗时 3m 27s，Exit Code: 0）。
- **风险评估**：**ZERO BREAKING / REVERSIBLE**（仅调整 TypeScript 类型契约导入方向，不涉及任何运行时逻辑或数据结构改动）。
- **回滚方式**：`git checkout -- src/components/exercises/exercise-controller.ts src/utils/latex/latex-generator.ts src/utils/typst/typst-generator.ts && rm src/types/exercises.ts`。

---

### LOG-004: 2026-09-06 — Phase 3-A: Pure Utilities 纯化与 Rehype 编译插件独立归位
- **执行阶段**：Phase 3-A (Pure Utilities + Build Plugins)
- **修改内容**：
  1. **纯工具解耦提取 (Pure Utilities Extraction)**：
     - 从复合型文件 `src/utils/sidebar.mjs` 中抽离出纯无状态路由净化算法至 `src/utils/slug.mjs`（`cleanSlug`）；
     - 抽离出高精度自然排序算法至 `src/utils/natural-sort.mjs`（`naturalSort`）；
     - `src/utils/sidebar.mjs` 仅保留 Node.js 文件系统目录读取与侧边栏生成（`generateBookSidebar`），并 re-export 纯工具保持 100% 向后兼容；
     - 调整 `src/pages/index.astro`、`src/pages/library.astro`、`src/ai/indexer.mjs`、`src/utils/cross-ref-indexer.mjs`、`src/utils/module-inspector/scanner.mjs`、`src/utils/relation-graph/generator.mjs` 直接导入纯工具，消除不必要的 Node `fs` 隐式引入；
     - 验证确立 `render-title.mjs`、`src-attrs.mjs` 与 `artistic-qr.mjs` 作为 `src/utils/` 中的合规纯工具。
  2. **Rehype 构建插件收拢归位 (Rehype Plugins Relocation)**：
     - 建立规范插件目录：`src/plugins/rehype/`；
     - 使用 `git mv` 迁移 6 个编译期 AST 插件：
       - `src/utils/rehype-cross-ref.mjs` -> `src/plugins/rehype/rehype-cross-ref.mjs`
       - `src/utils/rehype-katex-source.mjs` -> `src/plugins/rehype/rehype-katex-source.mjs`
       - `src/utils/rehype-math-promote.mjs` -> `src/plugins/rehype/rehype-math-promote.mjs`
       - `src/utils/rehype-mermaid.mjs` -> `src/plugins/rehype/rehype-mermaid.mjs`
       - `src/utils/rehype-image-blur.mjs` -> `src/plugins/rehype/rehype-image-blur.mjs`
       - `src/utils/rehype-editor-annotate.mjs` -> `src/plugins/rehype/rehype-editor-annotate.mjs`
     - 更新对应导入引用：
       - `astro.config.mjs`（更新 6 个插件的引入路径至 `./src/plugins/rehype/*`）
       - `scripts/test-crossref.mjs`（更新 `rehypeKatexAnnotate`, `rehypeKatexPromote`, `rehypeCrossRef` 路径）
       - `scripts/scan-mdx.mjs`（更新 `rehypeImageBlur` 路径）
  3. **依赖方向与边界收益**：
     - `src/utils/` 中 AST 处理插件数量清零（由 6 个减为 0 个）；
     - `rehype` 插件不再混杂于通配工具库，依赖流动明确为：`astro.config.mjs -> src/plugins/rehype/*`；
     - 经全局 grep 扫描，代码库中已无任何对 `src/utils/rehype*` 的旧路径残留。
- **变动文件数**：
  - 新建纯工具：2 个文件 (`src/utils/slug.mjs`, `src/utils/natural-sort.mjs`)
  - 路径迁移：6 个文件 (git mv 至 `src/plugins/rehype/`)
  - 导入与引用更新：8 个文件 (`sidebar.mjs`, `astro.config.mjs`, `test-crossref.mjs`, `scan-mdx.mjs`, `index.astro`, `library.astro`, `indexer.mjs`, `cross-ref-indexer.mjs`, `scanner.mjs`, `generator.mjs`)
- **验证结果**：
  - `npm run check:katex`：PASS（576 个 MDX 文件零异常）；
  - `node scripts/test-latex-export.mjs`：PASS（工科数分 1511 题 + 题库 2915 题全量通过）；
  - `node scripts/test-typst-export.mjs`：PASS（1511 题通过，原生 Typst 编译 PDF 成功）；
  - `node scripts/test-crossref.mjs`：PASS（3244 条引用项构建成功，徽章下沉渲染正常）；
  - `npm run build`：PASS（595 个 HTML 静态页面生成，耗时 3m 20s，Exit Code: 0）；
  - `grep -R "src/utils/rehype" .`：代码文件匹配数为 0。
- **风险评估**：**LOW / CONTROLLED & REVERSIBLE**（仅重构无状态纯工具及调整编译插件物理目录，未触碰任何运行时业务逻辑）。
- **回滚方式**：
  ```bash
  git mv src/plugins/rehype/* src/utils/ && rm -rf src/plugins/rehype src/utils/slug.mjs src/utils/natural-sort.mjs
  git checkout -- astro.config.mjs scripts/test-crossref.mjs scripts/scan-mdx.mjs src/utils/sidebar.mjs src/pages/index.astro src/pages/library.astro src/ai/indexer.mjs src/utils/cross-ref-indexer.mjs src/utils/module-inspector/scanner.mjs src/utils/relation-graph/generator.mjs
  ```

---

### LOG-005: 2026-09-06 — Phase 3-B: Publishing Layer 独立迁移 (LaTeX / Typst Generator)
- **执行阶段**：Phase 3-B (Publishing Layer Independent Migration)
- **修改内容**：
  1. **建立出版层专用物理目录**：
     - 新建 `src/publishing/latex/` 与 `src/publishing/typst/`；
  2. **物理迁移排版编译器 (git mv)**：
     - `src/utils/latex/latex-generator.ts` -> `src/publishing/latex/latex-generator.ts`
     - `src/utils/typst/typst-generator.ts` -> `src/publishing/typst/typst-generator.ts`
     - 清理空目录 `src/utils/typst`；
  3. **严格遵守边界控制**：
     - 🛑 `src/utils/latex/latex-cloud-compiler.ts` 保持原位不动（网络服务调度层，不属于纯出版编译器）；
     - 保持两编译器纯粹性：零 DOM API、零 window/document、零 Node-only API、零 UI 状态依赖；
     - 保持两编译器向上类型契约：`import type { SlimQuestionItem } from '../../types/exercises';`（相对深度保持一致，路径不变）；
  4. **更新引用路径（消除生产代码中的旧路径残留）**：
     - `src/components/exercises/exercise-controller.ts`：更新 `latex-generator` 导入路径至 `../../publishing/latex/latex-generator`（控制器仅更新导入路径 1 行，内部逻辑/功能零修改）；
     - `scripts/test-latex-export.mjs`：更新测试脚本导入路径至 `../src/publishing/latex/latex-generator.ts`；
     - `scripts/test-typst-export.mjs`：更新测试脚本导入路径至 `../src/publishing/typst/typst-generator.ts`；
     - `scripts/test-full-typst-generation.mjs`：更新测试脚本导入路径至 `../src/publishing/typst/typst-generator.ts`；
     - 同步修正两生成器头部注释中的文件路径。
- **变动文件数**：
  - 路径迁移：2 个文件 (`src/publishing/latex/latex-generator.ts`, `src/publishing/typst/typst-generator.ts`)
  - 引用更新：4 个文件 (`exercise-controller.ts`, `test-latex-export.mjs`, `test-typst-export.mjs`, `test-full-typst-generation.mjs`)
- **验证结果**：
  - `grep -R "exercise-controller" src/publishing`：**0 matches**（100% 杜绝反向依赖）；
  - `grep -R "utils/latex/latex-generator" src/ scripts/`：**0 matches**（无旧路径残留）；
  - `grep -R "utils/typst/typst-generator" src/ scripts/`：**0 matches**（无旧路径残留）；
  - `npm run check:katex`：**PASS**（576 篇教材 MDX 零字符异常）；
  - `node scripts/test-latex-export.mjs`：**PASS**（工科数分 1511 题 + 题库 2915 题 100% 通过）；
  - `node scripts/test-typst-export.mjs`：**PASS**（1511 题 100% 通过，原生 Typst 编译 PDF 成功）；
  - `npm run build`：**PASS**（595 个 HTML 页面全量生成，Pagefind 索引成功，耗时 3m 42s，Exit Code: 0）。
- **风险评估**：**ZERO BREAKING / REVERSIBLE**（仅重构独立出版编译模块物理位置并重定向单向引用，行为完全保持一致）。
- **回滚方式**：
  ```bash
  mkdir -p src/utils/typst
  git mv src/publishing/latex/latex-generator.ts src/utils/latex/latex-generator.ts
  git mv src/publishing/typst/typst-generator.ts src/utils/typst/typst-generator.ts
  rm -rf src/publishing
  git checkout -- src/components/exercises/exercise-controller.ts scripts/test-latex-export.mjs scripts/test-typst-export.mjs scripts/test-full-typst-generation.mjs
  ```

### LOG-006: 2026-09-06 — Phase 3-C: Dev Server Boundary Migration

- **执行阶段**：Phase 3-C (Dev Server Boundary Migration)
- **修改内容**：
  1. **建立 Dev Server 插件专用物理目录**：
     - 新建 `src/server/plugins/mdx-editor/`
     - 新建 `src/server/plugins/module-inspector/`
     - 新建 `src/server/plugins/relation-graph/`
     - 新建 `src/server/plugins/exercise-editor/`
  2. **物理迁移 Vite 插件 (git mv)**：
     - `src/utils/mdx-editor/dev-server-plugin.mjs` -> `src/server/plugins/mdx-editor/dev-server-plugin.mjs`
     - `src/utils/module-inspector/dev-server-plugin.mjs` -> `src/server/plugins/module-inspector/dev-server-plugin.mjs`
     - `src/utils/relation-graph/dev-server-plugin.mjs` -> `src/server/plugins/relation-graph/dev-server-plugin.mjs`
     - `src/utils/exercise-editor/dev-server-plugin.mjs` -> `src/server/plugins/exercise-editor/dev-server-plugin.mjs`
  3. **插件内部路径适配与严格边界约束**：
     - `mdx-editor/dev-server-plugin.mjs`：将依赖的未迁移工具（`apply-op.mjs`, `locate-block.mjs`, `parse.mjs`）的相对路径调整为 `../../../utils/mdx-editor/*`；扩展 `resolveProjectRoot()` 的向上探测候选层级（支持 4 级嵌套）；
     - `module-inspector/dev-server-plugin.mjs`：调整 `scanner.mjs` 导入路径为 `../../../utils/module-inspector/scanner.mjs`；
     - `relation-graph/dev-server-plugin.mjs`：调整 `generator.mjs` 导入路径为 `../../../utils/relation-graph/generator.mjs`；
     - `exercise-editor/dev-server-plugin.mjs`：更新 ROOT 路径深度为 4 级 (`path.resolve(__dirname, '..', '..', '..', '..')`)；
     - 🛑 严格维持零逻辑重构，保持 `execSync('node scripts/build-exercise-data.mjs')` 原样不动；
     - 🛑 未触碰任何 processing 工具（`scanner.mjs`, `generator.mjs`, `apply-op.mjs`, `locate-block.mjs`, `parse.mjs` 均留在 `src/utils/`）；
     - 🛑 未触碰 `exercise-controller.ts`、`SidebarOverride.astro`、`src/content/**`、`src/data/**`、`latex-cloud-compiler.ts` 等无关模块。
  4. **生产调用与配置更新**：
     - `astro.config.mjs`：更新 4 个 Dev Server Plugin 导入路径至 `src/server/plugins/...`。
- **变动文件数**：
  - 路径迁移：4 个文件
  - 配置与调用更新：1 个文件 (`astro.config.mjs`)
  - 内部依赖适配：4 个文件
- **依赖与隔离审计**：
  - `utils → server` 反向依赖：**0 matches**（100% 消除逆向耦合）；
  - `src/` 与 `scripts/` 旧路径残留：**0 matches**；
  - 运行时纯度：所有插件仅挂载于 Vite connect middleware 层，生产构建（build）时完全隔离，零运行时污染。
- **验证结果**：
  - `Dev Server 运行时探活`：PASS
    - `/__inspector__/health` → 200 `{"ok":true,"inspector":true}`
    - `/__relation_graph__/health` → 200 `{"ok":true,"relationGraph":true}`
    - `/__edit__/health` → 200 `{"ok":true,"dev":true}`
    - `/api/exercise/community-solutions` → 200 `[]`
    - `/__inspector__/books` → 200 `books.length: 6`
  - `npm run check:katex`：PASS（576 个 MDX 文件零异常）；
  - `node scripts/test-crossref.mjs`：PASS（3244 条引用项构建成功，徽章下沉渲染正常）；
  - `node scripts/test-latex-export.mjs`：PASS（工科数分 1511 题 + 题库 2915 题 100% 通过）；
  - `node scripts/test-typst-export.mjs`：PASS（1511 题 100% 通过，原生 Typst 编译 PDF 成功）；
  - `npm run build`：PASS（595 个 HTML 静态页面全量生成，Pagefind 索引成功，耗时 3m 34s，Exit Code: 0）。
- **风险评估**：**LOW / REVERSIBLE**（仅建立开发服务器插件的物理边界并适配单向路径，未改变任何插件的内部处理行为）。
- **回滚方式**：
  ```bash
  git mv src/server/plugins/mdx-editor/dev-server-plugin.mjs src/utils/mdx-editor/dev-server-plugin.mjs
  git mv src/server/plugins/module-inspector/dev-server-plugin.mjs src/utils/module-inspector/dev-server-plugin.mjs
  git mv src/server/plugins/relation-graph/dev-server-plugin.mjs src/utils/relation-graph/dev-server-plugin.mjs
  git mv src/server/plugins/exercise-editor/dev-server-plugin.mjs src/utils/exercise-editor/dev-server-plugin.mjs
  rm -rf src/server
  git checkout -- astro.config.mjs src/utils/mdx-editor/dev-server-plugin.mjs src/utils/module-inspector/dev-server-plugin.mjs src/utils/relation-graph/dev-server-plugin.mjs src/utils/exercise-editor/dev-server-plugin.mjs
  ```

### LOG-007: 2026-09-06 — Phase 3-E1: Cross-Reference Core Migration

- **执行阶段**：Phase 3-E1 (Cross-Reference Core Migration)
- **修改内容**：
  1. **建立领域索引层专用物理目录**：
     - 新建 `src/core/indexing/`；
  2. **物理迁移跨页引用索引构建器 (git mv)**：
     - `src/utils/cross-ref-indexer.mjs` -> `src/core/indexing/cross-ref-indexer.mjs`；
  3. **插件内部路径适配与严格边界约束**：
     - `cross-ref-indexer.mjs`：更新纯工具 `slug.mjs` 导入路径至 `../../utils/slug.mjs`；
     - 🛑 严格维持零逻辑重构，保持 `parseTitleDetails` 与 `buildGlobalBlockIndex` 内部算法、数据结构及缓存原样不动；
     - 🛑 未触碰任何无关模块（`sidebar.mjs`, `exercise-controller.ts`, `SidebarOverride.astro`, `src/content/**`, `src/data/**`, `latex-cloud-compiler.ts`）。
  4. **生产调用与构建脚本更新**：
     - `scripts/build-cross-ref-data.mjs`：更新导入路径至 `../src/core/indexing/cross-ref-indexer.mjs`；
     - `src/utils/relation-graph/generator.mjs`：更新导入路径至 `../../core/indexing/cross-ref-indexer.mjs`；
     - `src/components/PageSidebarOverride.astro`：修正注释中的路径。
- **变动文件数**：
  - 路径迁移：1 个文件 (`src/core/indexing/cross-ref-indexer.mjs`)
  - 引用更新：2 个文件 (`scripts/build-cross-ref-data.mjs`, `src/utils/relation-graph/generator.mjs`)
  - 注释修正：1 个文件 (`src/components/PageSidebarOverride.astro`)
- **依赖与隔离审计**：
  - `src/core → src/features` 反向依赖：**0 matches**；
  - `src/core → src/components` 反向依赖：**0 matches**；
  - `src/core → src/client` 反向依赖：**0 matches**；
  - `src/core → src/server` 反向依赖：**0 matches**；
  - 旧路径残留：**0 matches**（100% 清洁无残留）。
- **验证结果**：
  - `npm run check:katex`：PASS（576 个 MDX 文件零异常）；
  - `node scripts/build-cross-ref-data.mjs`：PASS（6 本书、共 3244 条引用项成功写入 `public/data/cross-ref/`）；
  - `node scripts/test-crossref.mjs`：PASS（33 个 block badges，30 个 interactive badges 正常生成）；
  - `node scripts/build-relation-graphs.mjs`：PASS（6 本书、共 93 条关联边、138 次跨章引用拓扑构建成功）；
  - `node scripts/test-latex-export.mjs`：PASS（工科数分 1511 题 + 题库 2915 题全部通过）；
  - `node scripts/test-typst-export.mjs`：PASS（1511 题全量通过，原生 Typst 编译 PDF 成功）；
  - `npm run build`：PASS（595 个 HTML 静态页面全量生成，Pagefind 索引成功，耗时 3m 26s，Exit Code: 0）。
- **风险评估**：**ZERO BREAKING / REVERSIBLE**（仅平移独立领域索引模块至 core 物理目录，单向流完全成立）。
- **回滚方式**：
  ```bash
  git mv src/core/indexing/cross-ref-indexer.mjs src/utils/cross-ref-indexer.mjs
  rm -rf src/core/indexing src/core
  git checkout -- scripts/build-cross-ref-data.mjs src/utils/relation-graph/generator.mjs src/components/PageSidebarOverride.astro src/utils/cross-ref-indexer.mjs
  ```

### LOG-008: 2026-09-06 — Phase 3-E2: Sidebar Domain/Core Split

- **执行阶段**：Phase 3-E2 (Sidebar Domain/Core Split)
- **修改内容**：
  1. **建立领域目录层专用物理目录**：
     - 新建 `src/core/catalog/` 与 `src/server/adapters/`；
  2. **提取纯粹教材目录领域核心**：
     - 新建 `src/core/catalog/book-catalog.mjs`，递归扫描教材目录并提取 `BookCatalog` 树（`{ type: 'group' | 'chapter', title, slug, filePath, children }`），零 Starlight UI 属性渗透；
  3. **建立 Starlight 展示适配器**：
     - 新建 `src/server/adapters/starlight-sidebar.mjs`，实现 `toStarlightSidebar` 与 `generateStarlightBookSidebar`，专职将领域目录树映射为 Starlight 侧边栏结构（`{ label, link, collapsed: true, items }`）；
  4. **重构历史工具门面**：
     - `src/utils/sidebar.mjs` 降级为 100% 向后兼容的 Facade，re-export `naturalSort` 与 `cleanSlug`，并将 `generateBookSidebar` 代理转发至 `generateStarlightBookSidebar`；
  5. **迁移现有真实调用方**：
     - `astro.config.mjs`：导入改为 `src/server/adapters/starlight-sidebar.mjs`；
     - `src/ai/mcp/tools.mjs`：`book_toc` 工具改为导入并直接调用 `src/core/catalog/book-catalog.mjs`；
     - 🛑 严格维持零越界修改，未触碰 `exercise-controller.ts`、`SidebarOverride.astro`、`src/content/**`、`src/data/**`、`latex-cloud-compiler.ts`。
- **变动文件数**：
  - 新建文件：2 个 (`src/core/catalog/book-catalog.mjs`, `src/server/adapters/starlight-sidebar.mjs`)
  - 门面重构：1 个 (`src/utils/sidebar.mjs`)
  - 引用迁移：2 个 (`astro.config.mjs`, `src/ai/mcp/tools.mjs`)
  - 总结报告：1 个 (`docs/architecture/phase-3-e2-migration.md`)
- **依赖与隔离审计**：
  - `src/core → src/features` 反向依赖：**0 matches**；
  - `src/core → src/components` 反向依赖：**0 matches**；
  - `src/core → src/client` 反向依赖：**0 matches**；
  - `src/core → src/server` 反向依赖：**0 matches**；
  - `src/core → starlight/astro` 反向依赖：**0 matches**；
  - 旧调用残留：除 `sidebar.mjs` 门面自身外，全站 **0 matches**。
- **验证结果**：
  - `npm run check:katex`：PASS（576 个 MDX 文件零异常）；
  - `node scripts/test-crossref.mjs`：PASS（33 个 block badges，30 个 interactive badges 正常生成）；
  - `node scripts/build-cross-ref-data.mjs`：PASS（6 本书、共 3244 条引用项成功写入）；
  - `node scripts/build-relation-graphs.mjs`：PASS（6 本书、共 93 条关联边、138 次跨章引用拓扑构建成功）；
  - `node scripts/test-latex-export.mjs`：PASS（工科数分 1511 题 + 题库 2915 题全部通过）；
  - `node scripts/test-typst-export.mjs`：PASS（1511 题全量通过，原生 Typst 编译 PDF 成功）；
  - `npm run build`：PASS（595 个 HTML 静态页面全量生成，Pagefind 索引成功，耗时 3m 33s，Exit Code: 0）。
- **风险评估**：**ZERO BREAKING / REVERSIBLE**（输出结构与原侧边栏 100% 逐字段一致，兼容门面无缝托底）。
- **回滚方式**：
  ```bash
  rm -rf src/core/catalog src/server/adapters
  git checkout -- astro.config.mjs src/ai/mcp/tools.mjs src/utils/sidebar.mjs
  ```

---

*(后续 Phase 3-F ~ Phase 7 执行记录将在每次实际变更后即时在此追加)*

