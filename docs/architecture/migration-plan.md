# AstroLib 渐进式架构迁移路线图 (Migration Plan)

> 本文档定义了 AstroLib 从当前“高耦合混合态”平滑演进至“清晰目标架构”的端到端实施路线图。
> 核心策略：**保持功能与行为不变、小步迁移、独立验证、按阶段实施。**

---

## 1. 迁移阶段全景甘特表

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  Phase 1: Safe Cleanup (零风险安全清理: 冗余脚本, .bak, 测试垃圾, 重复技能, 临时日志)     │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  Phase 2: Dependency Boundary (解耦反向依赖: 提取独立 models 层, 切断编译器->UI 倒置)     │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  Phase 3: Utils Decomposition (体系化拆解 src/utils: 抽离出版系统, 编译插件与纯工具)     │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  Phase 4: Feature Extraction (垂直特性抽取: exercises, ai, editor, inspector, graph)    │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  Phase 5: Script Organization (脚本库结构化重组: build, import, export, git, lint)     │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  Phase 6: Generated Data (建立 generated/ 目录与元数据签名, 彻底隔离 14MB+ 原始生数据)   │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  Phase 7: Tests & CI (建立 tests/ 套件, 在 GitHub Actions 中配置构建门禁与全自动回归)    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 各阶段任务明细与风险矩阵

### Phase 1 — Safe Cleanup (安全清理，本阶段唯一执行项)
- **目标**：在不触碰任何业务逻辑、不改变任何 import 路径的前提下，清理明确冗余的垃圾与副本。
- **任务清单**：
  1. **[LOW] 删除完全重复的脚本**：删除 `scripts/inject-exercise-triggers.js`（CJS），保留标准的 `.mjs` 版本；
  2. **[LOW] 删除备份残留文件**：删除 `src/config/features.config.mjs.bak`、`src/styles/custom.css.bak`、`astro.config.mjs.bak`；
  3. **[MEDIUM] 净化 public 目录**：删除 `public/` 下遗留的 18 个测试生成文件（`test_exam_output.*`, `test_handout_output.*`, `test_textbook_ch1_correct.pdf`, `test_workbook_output.typ`, `missfont.log`）；
  4. **[LOW] 清理开发临时日志**：删除 `scripts/_devlog.txt`；
  5. **[LOW] 消除 Agent 技能重复**：清理 `.dsh/skills/` 冗余镜像，统一收敛在 `.agents/skills/` 下；
  6. **[LOW] 修正测试脚本输出路径**：在 `scripts/test-latex-export.mjs` 中将测试输出重定向至 `.tmp/test-output/`，防止后续运行测试时再次污染 `public/`。
- **风险等级**：**LOW**
- **影响范围**：纯外部文件清理与测试脚本输出路径调整，完全不影响网站前台与正式构建。
- **依赖数量**：0 个业务依赖。
- **回滚方式**：`git checkout -- .` 或恢复已删除的未追踪文件。
- **验证方式**：执行全套预构建与 `astro build`，确认构建通过且 `dist/` 中不再含有测试垃圾。

---

### Phase 2 — Dependency Boundary (依赖边界治理与类型抽取)
- **目标**：切断底层排版系统对顶层 UI 控制器的反向依赖（Rule 1、Rule 2）。
- **任务清单**：
  1. **[CRITICAL] 提取数据契约层 `src/lib/models/`**：
     - 将 `SlimQuestionItem`、`QuestionOption`、`ChapterData` 从 `src/components/exercises/exercise-controller.ts` 中抽离出来，建立独立的 `src/lib/models/exercise.ts`；
     - 修改 `src/utils/latex/latex-generator.ts` 与 `src/utils/typst/typst-generator.ts`，从 `src/lib/models/` 导入类型，彻底解除对 UI 文件的反向绑定。
  2. **[HIGH] 抽离页面增强格式化器**：
     - 将 `question-formatter.ts` 从 `src/components/sidebar/` 移出至 `src/lib/formatters/`；
     - 更新 `src/utils/page-preprocess.ts` 的导入路径，切断预处理管线对侧边栏组件私有文件的依赖。
- **风险等级**：**CRITICAL（类型抽取） / HIGH（预处理解耦）**
- **影响范围**：LaTeX 导出、Typst 导出、习题控制器、SPA 页面离屏预处理。
- **依赖数量**：约 6-8 个核心文件。
- **回滚方式**：Git 单 Commit 回滚。
- **验证方式**：运行 `npm run test:latex-export`、`npm run test:typst-export` 并启动 `astro dev` 验证页面切换无抖动。

---

### Phase 3 — Utils Decomposition (体系化拆解 `src/utils/`)
- **目标**：彻底消除 `src/utils/` 中的环境混杂，严禁继续添加业务模块（Rule 7）。
- **分步实施细则**（不可一次性移动全部文件，每次只迁一个子域）：
  1. **[HIGH] Step 3.1 独立出版系统 `src/publishing/`**：
     - 将 `src/utils/latex/`、`src/utils/typst/` 平移至 `src/publishing/`，保持其无 DOM 依赖的无头纯净性；
  2. **[HIGH] Step 3.2 编译插件收拢 `src/plugins/rehype/`**：
     - 将 `rehype-cross-ref.mjs`、`rehype-katex-source.mjs`、`rehype-math-promote.mjs` 等统一收拢至插件目录，更新 `astro.config.mjs`；
  3. **[HIGH] Step 3.3 开发服务中间件收拢 `src/server/`**：
     - 整合 4 个 `dev-server-plugin.mjs` 至 `src/server/plugins/`；
  4. **[MEDIUM] Step 3.4 通用小助手纯化 `src/lib/utils/`**：
     - 留下的 `cleanSlug`、`naturalSort`、`srcAttrs` 等移入 `src/lib/utils/`。
- **风险等级**：**HIGH**
- **影响范围**：构建配置、Vite 插件注册、所有使用 AST 插件的流程。
- **依赖数量**：涉及全站 20+ 文件引用路径。
- **回滚方式**：针对各子步骤的独立 Commit 进行原子级回滚。
- **验证方式**：各步骤完成后单独执行 `npm run build` 和 `npm run check:katex`。

---

### Phase 4 — Feature Extraction (业务特性垂直抽取)
- **目标**：将大型复合单体从 `src/components/` 与 `src/utils/` 抽取至 `src/features/`（Rule 6）。
- **任务清单**（逐个特性独立搬迁）：
  1. **[MEDIUM] Step 4.1 迁移 `features/feedback/`**（低耦合先迁）；
  2. **[MEDIUM] Step 4.2 迁移 `features/inspector/`**；
  3. **[MEDIUM] Step 4.3 迁移 `features/relation-graph/`**；
  4. **[HIGH] Step 4.4 迁移 `features/ai/`**；
  5. **[HIGH] Step 4.5 迁移 `features/editor/`**；
  6. **[CRITICAL] Step 4.6 深度重构与迁移 `features/exercises/`**：
     - 严禁第一轮重写 114KB 控制器内部算法；
     - 采用“原样封装入包”策略，先将 `exercise-controller.ts` 与 `ExerciseModal.astro` 原样移入 `features/exercises/`，确保导入路径正常并构建通过；
     - 后续再择期进行状态机与视图的内部解耦。
- **风险等级**：**CRITICAL**
- **影响范围**：各特性的弹窗加载、交互逻辑与样式。
- **回滚方式**：针对每个特性的迁移建立独立分支或原子 Commit。
- **验证方式**：逐个在开发模式下点击测试弹窗，验证做题、问答、图谱功能完全一致。

---

### Phase 5 — Script Organization (脚本库结构化重组)
- **目标**：规范 `scripts/` 目录组织，消除与 `src/scripts/` 概念混淆（Rule 8）。
- **任务清单**：
  1. **[MEDIUM] 建立分类目录**：创建 `scripts/build/`, `import/`, `export/`, `git/`, `lint/`；
  2. **[HIGH] 更新 `package.json`**：将 `package.json` 中的 `build`、`epub`、`push` 等命令执行路径同步更新；
  3. **[MEDIUM] 解决命名冲突**：将 `src/scripts/`（浏览器端字体、主题脚本）重命名为 `src/client/` 或移入各对应 Feature。
- **风险等级**：**HIGH**
- **影响范围**：`npm run build`、`npm run push`、日常运维 CLI。
- **回滚方式**：Git 回滚 `package.json` 与 `scripts/` 目录。
- **验证方式**：依次运行 `npm run build`、`npm run epub`、`npm run check:katex`。

---

### Phase 6 — Generated Data (建立受控生成数据区)
- **目标**：隔离 14MB+ 原始题库，规范生成数据的元数据签名（Rule 3、Rule 4、Rule 9）。
- **任务清单**：
  1. **[CRITICAL] 原始题库移出 `src/`**：
     - 将 `bupt_math_full_database.json` (10.3MB) 与 175 套原始试卷移至项目根目录 `data/source/`，彻底释放 `src/` 源码负担；
     - 修改 `scripts/build/build-exercise-data.mjs` 的输入路径；
  2. **[CRITICAL] 消除运行时直接修改源 JSON**：
     - 改造 `dev-server-plugin.mjs`，前端修改时改为向草稿目录写入，移除 `execSync` 阻塞调用；
  3. **[MEDIUM] 建立 `generated/` 规范**：
     - 为所有构建脚本生成的 JSON 产物统一增加 `_meta` 来源元数据。
- **风险等级**：**CRITICAL**
- **影响范围**：题库编译全链路、开发期在线修改流程。
- **回滚方式**：恢复源 JSON 文件路径与开发服务中间件。
- **验证方式**：执行全套预构建脚本，确保生成的 `public/data/exercises/` 结构与内容 100% 字节级一致。

---

### Phase 7 — Tests & CI (建立自动化验证与持续集成)
- **目标**：建立回归防御体系，配置 GitHub Actions 构建门禁。
- **任务清单**：
  1. **[LOW] 建立 `tests/` 目录**：收拢现有的测试脚本，编写轻量级的 AST 语法检查与链接有效性测试；
  2. **[MEDIUM] 配置主站构建 CI (`.github/workflows/ci.yml`)**：
     - 配置在 PR 与 Push 时自动触发：`npm run check:katex` ➔ `npm run build` ➔ 运行导出校验；
     - 确保未来任何代码修改若违反规则会立即在 CI 阶段被拦截。
- **风险等级**：**LOW**
- **影响范围**：仅影响 GitHub Actions 工作流。
- **验证方式**：在 GitHub 上触发一次完整 PR 构建。
