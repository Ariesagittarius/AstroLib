# AstroLib 目录职责与架构映射 (Directory Map)

> 本文档针对 AstroLib 项目的全量核心目录进行逐一考古审查，重点核验各目录的“名义职责”与“实际职责”之偏差，并给出架构演进建议。
> 调查原则：**只调查，不移动，不修改。**

---

## 1. 根目录全局概览

```
AstroLib/
├── .agents/              # Agent 技能指令与私有开发资产（夹带大型教材二进制 PDF）
├── .astro/               # Astro 框架运行时缓存与开发服务器锁文件 (dev.json)
├── .backups/             # 历史脚本与在线精修编辑器的自动备份目录
├── .cmd/                 # Windows 辅助批处理环境（本地隐藏）
├── .dsh/                 # 历史遗留 Agent 技能镜像目录（与 .agents/ 存在重复）
├── .git/                 # Git 版本控制元数据
├── .github/workflows/    # GitHub Actions 工作流（LaTeX 云编译、清理、EPUB 发行）
├── .venv/                # Python 虚拟运行环境
├── .vscode/              # VS Code 编辑器配置与推荐设置
├── dist/                 # Astro 最终生产构建打包产物目录
├── docs/                 # 技术设计与交接文档归档
│   └── architecture/     # 本次架构考古系列报告
├── node_modules/         # Node.js 依赖模块目录
├── public/               # 静态资源服务目录（夹带预构建索引与测试输出残留）
├── scripts/              # 构建期、运维、数据处理脚本 God Folder
├── src/                  # 网站主源代码目录（包含组件、工具、数据、AI、页面）
├── task/                 # MinerU OCR 导入作业暂存区与审核报告
└── workspace/            # 学术出版流水线 (academic-content-pipeline) 多智能体作业区
```

---

## 2. 重点审查目录深度解剖

### 2.1 `src/components/` (组件层)
- **当前职责**：存放网站页面渲染所需的 Astro / UI 组件。
- **实际职责**：**已演化为混合杂糅目录**。包含：
  1. 纯展示型教辅卡片组件（14 个：`Example.astro`, `Knowledge.astro`, `Method.astro`, `Summary.astro`, `Variant.astro`, `Note.astro`, `Block.astro`, `Solution.astro` 等）；
  2. Starlight 框架顶层插槽覆盖组件（7 个：`HeaderOverride.astro`, `SidebarOverride.astro`, `PageSidebarOverride.astro`, `FooterOverride.astro`, `PageTitleOverride.astro`, `PaginationOverride.astro`, `ThemeSelectOverride.astro`）；
  3. 重量级独立业务系统入口与弹窗（`EditorMode.astro`, `ModuleInspector.astro`, `BookRelationGraph.astro`, `FeatureToggles.astro`, `FeedbackMode.astro`, `Analytics.astro`）；
  4. 遗留/僵尸组件（`ChapterQuiz.astro`：16KB，已无正文 MDX 引用；`VpFooter.astro`：31 字节空壳）；
  5. 嵌入式独立子系统子目录：
     - `src/components/ai/`（`ChatDrawer.astro`, `InputBar.astro`, `MessageList.astro`, `ai-theme.css`）；
     - `src/components/exercises/`（**114 KB** 的 `exercise-controller.ts`，**48 KB** 的 `ExerciseModal.astro`，**60 KB** 的 `exercise-theme.css`）；
     - `src/components/sidebar/`（包含跨页引用客户端、图片模糊加载器、Mermaid 加载器、选择题排版器、动态目录生成器）。
- **是否合理**：**严重不合理**。
  - 单个子系统（如 `exercises`）的控制器高达 114KB（3017 行），已是完整的单页 Web 应用（SPA），不应作为常规“UI 组件”埋在 `src/components/` 下。
  - `src/components/sidebar/` 中收纳了与侧边栏毫无因果关系的通用页面逻辑（如 `image-blur-loader.ts`、`mermaid-loader.ts`、`question-formatter.ts`），仅因它们被 `PageSidebarOverride.astro` 顺带引用。
- **建议未来归属**：
  - `src/components/cards/`：收拢 14 种纯教辅学术卡片；
  - `src/components/layout/`：收拢 Starlight 官方插槽覆盖组件；
  - `src/features/exercises/`：将习题控制器、弹窗及样式整体提升为特性模块；
  - `src/features/ai/`：收拢 AI 问答 Drawer 与消息列表；
  - `src/features/sidebar/`：仅保留目录树渲染与目录大纲生成；其余加载器归入 `src/client/loaders/`。

---

### 2.2 `src/utils/` (工具库 God Folder)
- **当前职责**：提供全站通用的纯函数、工具类或小助手方法。
- **实际职责**：**已彻底沦为全项目的 God Folder 与异构逻辑垃圾场**。包含：
  1. AST 编译器与转换器：
     - LaTeX 编译器与生成器：`src/utils/latex/latex-generator.ts`, `latex-cloud-compiler.ts`；
     - Typst 编译器：`src/utils/typst/typst-generator.ts`；
     - Remark / Rehype 插件群：`rehype-cross-ref.mjs`, `rehype-katex-source.mjs`, `rehype-math-promote.mjs`, `rehype-mermaid.mjs`, `rehype-image-blur.mjs`, `rehype-editor-annotate.mjs`；
  2. Vite Dev Server 后端 HTTP 中间件：
     - `src/utils/mdx-editor/dev-server-plugin.mjs`（`/__edit__/*`）；
     - `src/utils/module-inspector/dev-server-plugin.mjs`（`/__inspector__/*`）；
     - `src/utils/relation-graph/dev-server-plugin.mjs`（`/__relation_graph__/*`）；
     - `src/utils/exercise-editor/dev-server-plugin.mjs`（`/api/exercise/*`）；
  3. 客户端超大交互控制器与 DOM 逻辑：
     - `src/utils/editor.ts`（**69 KB**，在线富文本编辑器客户端）；
     - `src/utils/module-inspector/inspector.ts`（**48 KB**，巡检弹窗客户端图表与筛选）；
     - `src/utils/relation-graph/relation-graph-client.ts`（**29 KB**，ECharts 知识图谱渲染）；
     - `src/utils/feedback/feedback-controller.ts`（**19 KB**，勘误捕获与 Issue 提交）；
     - `src/utils/exercise-db/exercise-db-client.ts`（**10 KB**，IndexedDB 客户端）；
  4. Node.js 本地文件系统扫描与 AST 修改引擎：
     - `src/utils/mdx-editor/apply-op.mjs`（**28 KB**，文件写回与校验）；
     - `src/utils/module-inspector/scanner.mjs`（**22 KB**，全书正则扫描）；
     - `src/utils/relation-graph/generator.mjs`（**19 KB**，全书图谱关系计算）；
  5. 二维码生成算法：`src/utils/artistic-qr.mjs`（18 KB）。
- **是否合理**：**完全不合理（Critical）**。
  - 将 Node.js 服务端文件读写代码、Vite 中间件、客户端浏览器 DOM 交互脚本、AST 编译插件全部塞在 `src/utils/` 下，彻底破坏了前端工程的层级边界。
  - 构建打包时，Vite/Rollup 极易因客户端/服务端环境混淆而发生打包泄露或潜在报错。
- **建议未来归属**：
  - `src/plugins/rehype/`：统一收拢编译期 Rehype / Remark 插件；
  - `src/server/plugins/`：收拢 4 个 Vite dev-server 中间件；
  - `src/export/`（或 `src/compilers/`）：收拢 LaTeX / Typst 导出与云编译调度；
  - 客户端控制器（`editor.ts`, `inspector.ts`, `relation-graph-client.ts`）移至各对应 `src/features/<feature>/client/`；
  - `src/utils/`：仅保留无副作用、纯无状态的通用工具函数（如 `cleanSlug`, `naturalSort`, `srcAttrs`）。

---

### 2.3 `src/ai/` (AI 智能子系统)
- **当前职责**：AI 检索式问答模块。
- **实际职责**：功能高度完整但边界模糊的自包含子系统。包含：
  1. 构建期切片与索引生成：`chunker.mjs`, `indexer.mjs`, `outline.mjs`；
  2. 运行时检索服务：`retriever.mjs`（BM25 关键词与切片打分）；
  3. LLM 客户端直连层：`llm.mjs`（OpenAI 兼容协议流式调用）；
  4. 浏览器端会话控制器：`src/ai/client/chat-controller.ts`（**51 KB**）；
  5. 外部 MCP 服务端：`src/ai/mcp/server.mjs`, `tools.mjs`。
- **是否合理**：**基本合理，但服务端/客户端混布**。
  - 构建期（Node CLI 执行的 indexer）与运行期（浏览器执行的 chat-controller）以及外部协议服务（MCP）共处同一目录。
- **建议未来归属**：
  - `src/features/ai/build/`：切片与索引构建工具；
  - `src/features/ai/client/`：前端对话控制器与配置；
  - `tools/mcp/`：将 MCP Server 剥离出 `src/`，作为纯粹的外部开发者工具。

---

### 2.4 `src/data/` (静态数据层)
- **当前职责**：存放网站所需的静态数据与结构化配置。
- **实际职责**：**已异化为大容量原始数据暂存与运行时状态读写区**。包含：
  1. 超大型全量原始题库数据库：`src/data/exercises/bupt_math_full_database.json`（**10.3 MB**）；
  2. 工科数分衍生题库：`engineering_analysis_exercises.json`（**2.5 MB**）、`engineering_analysis_textbook_exercises.json`（**1.5 MB**）；
  3. 175 套原始试卷切片：`src/data/exercises/raw_papers/`（共 175 个 JSON/TXT 文件）；
  4. 历史遗留章节 MDX：`src/data/exercises/legacy_pages/`（包含 14 个未被路由装载的 MDX 文件）；
  5. 运行时动态写入目标：`feedbacks.json`, `community_ai_solutions.json`。
- **是否合理**：**极不合理**。
  - 在 `src/` 源码树中存储超过 14MB 的原始 JSON 数据和 175 个文本文件，导致 TypeScript 类型推导、Astro HMR、Vite 依赖分析极其迟钝，迫使构建命令必须声明 `--max-old-space-size=4096`；
  - 在开发模式下，Vite 中间件通过 `/api/exercise/*` 直接将用户提交的数据写回 `src/data/exercises/*.json`，使源码目录处于不可控的脏状态。
- **建议未来归属**：
  - 14MB+ 原始数据库及 175 套试卷应移出 `src/`，放置于项目根目录外挂数据区 `data/source/` 或通过本地 SQLite/DuckDB/云端数据库管理；
  - `legacy_pages/` 彻底归档至 `task/legacy/` 或移除；
  - 运行时写入的反馈与社区数据应存储至系统临时目录或真正的 SQLite/Supabase/D1 数据表中，禁止在运行时向 `src/` 写盘。

---

### 2.5 `src/content/` (内容集合层)
- **当前职责**：Astro 官方推荐的 Content Collections 存储目录。
- **实际职责**：严谨的教材与文档正文存储。
  - `src/content/docs/collections/math/`（工科数分、数分、线代、高数、概统）；
  - `src/content/docs/collections/science/`（大学物理）；
  - `src/content/docs/dev/`（项目架构与开发手册文档）。
- **是否合理**：**结构清晰、职责纯正**。
  - 遵循 Astro 7 标准 Content Layer 体系。
  - 潜在瑕疵：工科数分的所有章节 MDX 末尾均被脚本批量硬编码注入了 `<ExerciseTrigger />` 组件引用，对特定 UI 组件产生了硬绑定。
- **建议未来归属**：保持不变。未来可考虑将 `<ExerciseTrigger />` 下沉至 Rehype 插件或全局 Layout 中自动根据路由挂载，避免批量污染 MDX 源码。

---

### 2.6 `scripts/` (脚本 God Folder)
- **当前职责**：项目自动化构建与辅助脚本。
- **实际职责**：**高度混乱的混合型脚本仓库**（包含 36 个脚本与 2 个子目录）。包含：
  1. 构建前置管线（被 `package.json` 强依赖）：
     - `build-exercise-data.mjs`, `build-ai-index.mjs`, `build-relation-graphs.mjs`, `build-cross-ref-data.mjs`, `build-inspector-data.mjs`；
  2. Python 书籍 OCR 转换与数据映射：
     - `extract_textbook_exercises.py`, `import_engineering_analysis.py`, `import_linear_algebra.py`, `import_probability_statistics.py`, `import_university_physics.py`, `process_bupt_math_archive.py`，以及 `scripts/lib/math_archive/`（7 个 Python 模块）；
  3. EPUB 构建流水线：`generate-epub.mjs`, `scripts/epub/`；
  4. Git 双仓脱敏与推送：`git-clean-push.mjs`, `one-click-push.mjs`, `validate-commit-msg.mjs`, `scripts/lib/comment-stripper.mjs`；
  5. 语法与指标修复/巡检：`fix-katex-metrics.mjs`, `scan-mdx.mjs`, `ai_fix_card_boundaries.mjs`, `ai_fix_figures.mjs`；
  6. 临时测试脚本与残留文件：
     - `_devlog.txt`（开发日志垃圾文件）；
     - `_test-e2e.mjs`, `_test-ops.mjs`, `test-crossref.mjs`, `test-latex-export.mjs`, `test-typst-export.mjs`, `test-full-typst-generation.mjs`；
     - 存在完全重复的文件：`inject-exercise-triggers.js`（CJS 版）与 `inject-exercise-triggers.mjs`（ESM 版）；
     - 夹带独立部署单元：`feedback-bot-worker.mjs`（Cloudflare Worker 脚本）。
- **是否合理**：**不合理**。
  - 构建核心脚本、Python 数据预处理、一次性修补脚本、临时测试、外部 Worker 代码混杂在同一根目录下。
- **建议未来归属**：
  - `scripts/build/`：专职管理 `build-*.mjs` 构建脚本；
  - `scripts/importers/`：收拢所有 Python 导入工具与 `lib/`；
  - `scripts/git/`：收拢提交校验与双仓脱敏流水线；
  - `scripts/lint/`：收拢 KaTeX 指标检查与 MDX 扫描；
  - 独立部署单元（如 `feedback-bot-worker.mjs`）移至 `serverless/` 或 `workers/`；
  - 清理一次性测试脚本与 `_devlog.txt`。

---

### 2.7 `public/` (静态服务目录)
- **当前职责**：Astro 原样复制至 `dist/` 的公共静态资产。
- **实际职责**：**正规产物与污染残留并存**。包含：
  1. 正规构建输出目录：`public/data/`, `public/ai-index/`, `public/inspector-data/`, `public/relation-graphs/`, `public/epub/`；
  2. 静态图标与封面：`public/favicon.svg`, `public/covers/`；
  3. **严重的测试输出与日志污染**：
     - `test_exam_output.aux`, `.idx`, `.log` (128KB), `.mst`, `.pdf` (109KB), `.tex`, `.typ`；
     - `test_handout_output.aux`, `.idx`, `.log` (131KB), `.mst`, `.pdf` (92KB), `.tex`, `.typ`；
     - `test_textbook_ch1_correct.pdf` (109KB)；
     - `test_workbook_output.typ`；
     - `missfont.log`。
- **是否合理**：**受到严重污染**。
  - `test-latex-export.mjs` 测试脚本直接将构建产物写进 `public/`，导致任何执行过测试的本地环境在 `npm run build` 时，都会将数百 KB 的 LaTeX 测试日志与中间产物原样打包上线。
- **建议未来归属**：
  - 测试脚本必须重构，输出路径强制指向 `.tmp/test-output/` 或 `target/`；
  - `public/` 保持干净，仅包含真正的公共静态资源及合法的预构建 JSON/EPUB。

---

### 2.8 `.agents/`、`.dsh/` 与 `workspace/` (智能体与流程工作区)
- **当前职责**：
  - `.agents/`：Antigravity Agent 体系的 Skill 技能集与提示词配置；
  - `.dsh/`：DevShell / 历史 Agent 规范配置；
  - `workspace/`：学术内容流水线作业审查输出目录。
- **实际职责**：
  - `.agents/` 内部违规存放了 `src/` 子目录，内含 **4.8 MB** 的大文件 `大邮数学集-1.4.2.pdf` 及 `2026新高考I+II数学by Charlie.zip`；
  - `.dsh/skills/` 几乎 100% 镜像复制了 `.agents/skills/`（`astro-project-guide`, `astro-site-operations`, `import-book`），属于历史冗余镜像；
  - `workspace/` 包含 `design/`（`DESIGN_BRIEF.md`, `DESIGN_SYSTEM.md`, `MINIMALISM_AUDIT.md`）和 `review/`（`REVIEW.md`, `FINAL_QA.md`），是多智能体流水线的产物落地区。
- **是否合理**：
  - `.dsh/` 存在完全无谓的代码/文档重复；
  - `.agents/src/` 将超大二进制教材放入 Agent 配置目录，不合规范；
  - `workspace/` 职责清晰，但应与生产代码严格隔离。
- **建议未来归属**：
  - 清理 `.dsh/`，统一收敛至 `.agents/`；
  - 将 `.agents/src/` 中的大型原始 PDF 移至外部数据暂存区（如 `task/` 或 `.gitignore` 下的 `assets/raw-books/`）；
  - `workspace/` 加入 `.gitignore` 或仅在发行时予以排除。

---

## 3. 次要与支持性目录快速诊断

| 目录/文件 | 当前职责 | 实际职责 | 诊断与健康度 | 建议未来归属 |
| :--- | :--- | :--- | :--- | :--- |
| `src/scripts/` | 客户端脚本 | 存放浏览器端功能代码（`font-presets.ts`, `feature-toggles.ts`, `site-themes.ts`, `formula/*`） | 容易与根目录 `scripts/` 产生名称与职责混淆 | 更名为 `src/client/` 或移入各特性模块中 |
| `src/config/` | 中央配置 | 包含 `collections.config.mjs`, `features.config.mjs`, `themes.config.mjs`；附带 `features.config.mjs.bak` | 核心配置明确，但遗留备份文件 `.bak` | 删除 `.bak`，保持配置纯洁 |
| `src/styles/` | 样式层 | 包含 `custom.css`, `vitepress-theme.css`, `fonts.css`；附带 `custom.css.bak` | 样式体系层级清晰，但遗留备份文件 `.bak` | 删除 `.bak` |
| `src/pages/` | 自定义路由 | 仅有 `index.astro`, `library.astro`, `print.astro` | 极其干净，文档主路由由 Starlight 接管 | 保持不变 |
| `task/` | 转换任务区 | 仅存 `figure_audit_report.json` | 历史书籍导入工作区 | 保持为开发期暂存区 |
| `.backups/` | 备份目录 | 存放历史自动修改备份 `docs_pre_note_fix_*` | 属于构建无关临时目录 | 保持在 `.gitignore` 中 |
