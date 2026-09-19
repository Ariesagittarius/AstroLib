# 脚本列表与说明

本文档对 AstroLib 项目中所有可执行的 npm 命令与 `scripts/` 目录下的自动化工具进行分类说明。

---

## 1. npm scripts 命令速查

| 命令 | 对应脚本与底层执行 | 核心用途 |
| :--- | :--- | :--- |
| `npm run dev` | `astro dev` | 启动本地热重载开发服务器 |
| `npm run build` | 依次执行 5 个预处理脚本后执行 `astro build` | 生产全量打包，预渲染题库、索引与知识网络 |
| `npm run build:exercises` | `node scripts/build-exercise-data.mjs` | 单独预编译题库数据与 KaTeX 静态 HTML |
| `npm run build:all` | `node scripts/generate-epub.mjs && npm run build` | 一键生成全书离线 EPUB 产物并完成全站生产打包 |
| `npm run preview` | `astro preview` | 本地托管预览 `dist/` 生产静态构建目录 |
| `npm run epub` | `node scripts/generate-epub.mjs` | 执行全书离线 EPUB3 打包流水线 |
| `npm run check:katex` | `node scripts/fix-katex-metrics.mjs --check` | 检查全站数学公式排版度量衡规范（只读检查） |
| `npm run fix:katex` | `node scripts/fix-katex-metrics.mjs` | 自动修复全站数学公式度量衡与微调参数 |
| `npm run check:commit`| `node scripts/validate-commit-msg.mjs` | 验证 Git 提交信息是否符合学术规范约束 |
| `npm run push` | `node scripts/one-click-push.mjs` | 一键完成暂存、格式化校验、提交与远端同步 |
| `npm run update` | `node scripts/one-click-push.mjs` | 等同于 `npm run push` |
| `npm run push:clean` | `node scripts/git-clean-push.mjs --clean` | 自动剥离开发注释后推送到公开仓库 `origin` |
| `npm run push:private`| `node scripts/git-clean-push.mjs --private` | 保留完整开发注释备份推送到私有仓库 |
| `npm run push:all` | `node scripts/git-clean-push.mjs --all` | 双轨同步：同时推送到公开端与私有端 |
| `npm test` | `vitest run tests/unit tests/contract tests/acceptance` | 运行核心自动化测试套件 (Unit + Contract + Acceptance，约 1.5s 完成) |
| `npm run test:unit` | `vitest run tests/unit` | 单独运行 Tier 1 纯逻辑单元测试（算法、状态机、错误封装，~200ms） |
| `npm run test:contract` | `vitest run tests/contract` | 单独运行 Tier 2 架构契约测试（public卫生、Window Layers令牌、Schema，~300ms） |
| `npm run test:acceptance` | `vitest run tests/acceptance` | 单独运行 Tier 3 业务端到端验收测试（导出联动、LaTeX闭合、Typst转换，~1.5s） |
| `npm run test:system` | `vitest run tests/system` | 运行 Tier 4 系统级集成测试（Typst内存渲染、XeLaTeX双通编译自适应，~8s） |
| `npm run test:all` | `vitest run` | 全量运行所有 4 个层级的 20 套测试与 72 个测试用例 |
| `npm run test:watch` | `vitest` | 启动 Vitest 交互式热重载测试监听模式（日常开发边写边测） |
| `npm run check:types` | `tsc --noEmit` | 执行 TypeScript 严格模式全量静态类型检查（0 errors 质量门禁） |
| `npm run check:all` | `npm run check:types && npm test` | 全站质量门禁：提交代码前必跑（严格类型检查 + 核心测试套件） |

---

## 2. 核心独立脚本详解

### 2.1 构建与预处理脚本（Build Pipeline）

#### `scripts/build-exercise-data.mjs`
- **功能**：全站习题与真题预编译管线。读取原始 JSON 题库，针对题干与选项内的 LaTeX 数学公式执行编译期 KaTeX `output: 'html'` 静态渲染，并生成分章轻量 JSON。
- **输入**：`src/data/exercises/engineering_analysis_exercises.json` 与 `src/data/exercises/engineering_analysis_textbook_exercises.json`
- **输出**：`public/data/exercises/engineering_analysis/` 下的分章数据（`ch1.json` ~ `ch7.json`）与试卷数据（`papers.json`, `papers/p*.json`）
- **执行方式**：
  ```bash
  node scripts/build-exercise-data.mjs
  ```

#### `scripts/build-ai-index.mjs`
- **功能**：构建书内 AI 问答离线分块检索索引。解析全书 MDX 章节正文，按语义卡片与段落生成带位置标记的轻量索引字典。
- **输出**：`public/data/ai-search-index.json`
- **执行方式**：
  ```bash
  node scripts/build-ai-index.mjs
  ```

#### `scripts/build-relation-graphs.mjs`
- **功能**：全书知识体系与定理关系图谱构建器。扫描全书 `<Knowledge>`、`<Example>` 卡片及概念引用，构建概念前驱/后继拓扑图。
- **输出**：`public/data/relation-graphs/` 对应图书的图谱 JSON 数据
- **执行方式**：
  ```bash
  node scripts/build-relation-graphs.mjs
  ```

#### `scripts/build-cross-ref-data.mjs`
- **功能**：跨页交叉引用元数据提取。收集各章节中所有带编号的定理、例题、公式 `\tag{}`，生成全局符号表。
- **输出**：`public/data/cross-ref-data.json`
- **执行方式**：
  ```bash
  node scripts/build-cross-ref-data.mjs
  ```

#### `scripts/build-inspector-data.mjs`
- **功能**：全书模块巡检与查重数据构建。扫描各书模块 ID、层级与标题，为前端开发模式下的模块检查工具提供数据支撑。
- **输出**：`public/data/inspector-data.json`
- **执行方式**：
  ```bash
  node scripts/build-inspector-data.mjs
  ```

#### `scripts/generate-epub.mjs`
- **功能**：全书离线 EPUB3 电子书打包。包含封面合成、KaTeX 离线公式渲染、目录（NCX/NAV）构建与样式适配。
- **参数支持**：`--only <book_slug>`（仅打包指定书籍）
- **输出**：`dist-epub/<book_slug>.epub`
- **执行示例**：
  ```bash
  # 打包全部已启用 EPUB 的图书
  node scripts/generate-epub.mjs

  # 仅打包指定图书
  node scripts/generate-epub.mjs --only engineering_analysis
  ```

---

### 2.2 语法校验与质量门禁（Validation & Quality Gates）

#### `scripts/scan-mdx.mjs`
- **功能**：MDX 语法与 AST 深度扫描工具。检测未转义的 JSX 字符（如裸 `<` 或 `{}`）、未闭合标签、KaTeX 公式闭合完整性。
- **执行方式**：
  ```bash
  # 校验单本书籍或目录
  node scripts/scan-mdx.mjs src/content/docs/collections/math/engineering_analysis

  # 校验特定单篇 MDX 文件
  node scripts/scan-mdx.mjs src/content/docs/collections/math/engineering_analysis/2.1_导数的概念.mdx
  ```

#### `scripts/validate-commit-msg.mjs`
- **功能**：Git 提交信息规范校验。确保提交摘要符合学术克制规范：全英文（ASCII）、无 Emoji、使用规范动词（`feat`, `fix`, `perf`, `refactor`, `docs`, `chore` 等）。
- **执行方式**：
  ```bash
  node scripts/validate-commit-msg.mjs
  ```

#### `scripts/fix-katex-metrics.mjs`
- **功能**：全站公式度量衡校验与微调工具。检查长公式移动端换行与 `\tag{}` 定位。
- **参数支持**：`--check`（只检查不修改文件）
- **执行方式**：
  ```bash
  node scripts/fix-katex-metrics.mjs --check
  ```

#### `scripts/clean-cjk-punctuation.mjs`
- **功能**：排版标点规范化。清理中英文混排时的全角半角标点异常、多余空白符与不规则空格。
- **执行方式**：
  ```bash
  node scripts/clean-cjk-punctuation.mjs <target_path>
  ```

---

### 2.3 数据清洗与推倒重建脚本（Vision Reconstruct & Import）

#### `scripts/vision_reconstruct/` 目录
包含基于 Gemma 4 26B 与 Gemini 3.5 Flash Lite 的视觉推倒重建工具集：
- `slice_pdf_pages.py`：使用 PyMuPDF 对原书 PDF 进行高精物理切页（输出 150 DPI 高清扫描图）；
- `gemma_vision_client.mjs`：基于 `gemma-4-26b-a4b-it` 模型的 SSE 流式视觉请求客户端（内置思考限额守护与重试）；
- `gemini_vision_client.mjs`：基于 `gemini-3.5-flash-lite` 模型的流式视觉客户端；
- `reconstruct_section.mjs`：按节调度多模态模型执行重建并生成标准 MDX 的调度器；
- `materialize_figures.py`：原书插图切图与实体化脚本。

#### 传统 MinerU 转换脚本
- `scripts/import_engineering_analysis.py`
- `scripts/import_linear_algebra.py`
- `scripts/import_probability_statistics.py`
- `scripts/import_university_physics.py`

---

### 2.4 题库处理脚本（Exercise Archive）

#### `scripts/process_bupt_math_archive.py`
- **功能**：全量处理《大邮数学集》真题试卷。完成试卷 PDF 题目解析、Unicode 字符规范化、LaTeX 宏转义与章节映射，输出全量题库 JSON 与精选 MDX 页面。
- **执行方式**：
  ```bash
  python scripts/process_bupt_math_archive.py
  ```

#### `scripts/extract_textbook_exercises.py`
- **功能**：从教材原文 Markdown 中提取课后练习题并结构化为统一题目对象。
- **执行方式**：
  ```bash
  python scripts/extract_textbook_exercises.py
  ```

---

### 2.5 自动化测试与质量门禁套件（Test Pyramid & Quality Gates）

为了根治旧版本散落在 `scripts/test-*.mjs` 的 14 个独立脚本无法统一运行与收集结果的痛点，本项目全面引入 **Vitest 5.x + TypeScript 严格模式**，建立了结构清晰的四层测试金字塔架构：

#### 目录布局与测试分层
- `tests/unit/`（Tier 1 纯逻辑单元测试）：测试 AST 注释剥离、路由 Slug 解析、自然排序、通知引擎状态机、AI 统一错误处理与 Gemini 端侧工具解析（~200ms）。
- `tests/contract/`（Tier 2 架构契约测试）：严格执行 `AGENTS.md` Rule 5 公共目录卫生守卫（`public/` 零污染）、全站 173 个源文件 Window Layers 层级令牌扫描、KaTeX 度量补丁、Feature Registry 与书库配置单一真实源 Schema 契约（~300ms）。
- `tests/acceptance/`（Tier 3 业务端到端验收）：验证章节与习题导出设置联动、静态资源 Chapter-scoped 解析、LaTeX 语法平衡与环境闭合、Typst 转换无占位符残留、AST 交叉引用徽章注入与全量题库数据集完备性（~1.5s）。
- `tests/system/`（Tier 4 物理引擎与系统集成）：调用 Typst 原生 Node 编译器执行内存多页 PDF 生成、通过 `env-detector.ts` 环境自适应调用本地 XeLaTeX 验证双通编译与字体嵌入（~8s）。

#### 零污染与环境自适应原则
- **Zero Side-Effects**：任何测试均不得向 `public/` 写入测试产物；物理编译必须在操作系统隔离临时目录中执行并在生命周期钩子中完全清理。
- **Environment Defensive**：依赖外部物理编译器的系统测试在环境未就绪时自动通过 `it.skip()` 优雅跳过，保证在纯 Node.js 的 GitHub Actions CI 容器中 100% 绿灯通过。

> 📘 **深入了解**：完整架构设计与测试编写 SOP 请参阅 [docs/自动化测试套件与类型守卫架构交接文档.md](../自动化测试套件与类型守卫架构交接文档.md) 及 [tests/TESTING.md](../../tests/TESTING.md)。

