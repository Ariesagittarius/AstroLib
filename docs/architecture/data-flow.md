# AstroLib 数据流向与生命周期全景 (Data Flow)

> 本文档对 AstroLib 内部流动的所有数据进行严谨的分类学界定（Taxonomy），并端到端追踪教材、题库、AI 索引、跨页引用与知识图谱的完整生命周期。
> 调查原则：**只调查，不修改。**

---

## 1. 数据分类学界定 (Data Taxonomy)

为了厘清 AstroLib 复杂的数据形态，全系统的数据被精确区分为 5 种形态：

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   Source Data   ├──────►│ Processed Data  ├──────►│ Generated Data  │
│ (不可变单一真实源)│       │  (中间清洗与映射)│       │  (构建产物/索引) │
└─────────────────┘       └─────────────────┘       └────────┬────────┘
                                                             │
                                                             ▼
┌─────────────────┐                                 ┌─────────────────┐
│  Runtime Data   │◄────────────────────────────────┤  Static Assets  │
│ (客户端状态/存储) │                                 │ (部署静态文件)  │
└─────────────────┘                                 └─────────────────┘
```

### 1.1 核心源数据 (Source Data - Source of Truth)
系统内享有绝对权威、不得被自动脚本无感覆盖的原生数据：
- **中央图书与合集配置**：`src/config/collections.config.mjs`（定义合集、书名、slug、卡片主题、模块别名）。
- **全站特性注册表**：`src/config/features.config.mjs`（声明 15 种特性的开关、开发模式限制与运行参数）。
- **教材正文 MDX 源码**：`src/content/docs/collections/<col>/<book>/*.mdx`（全书章节的主体学术内容）。
- **原始教材 PDF / 归档资源**：`.agents/src/`、`task/`（MinerU OCR 转换前的输入源文件）。
- **全量真题底层数据库**：`src/data/exercises/bupt_math_full_database.json`（**10.3 MB**，173 套试卷与 2765 道真题的初始归档）。
- **试卷原始切片**：`src/data/exercises/raw_papers/*.json`、`*.txt`（175 套试卷的原始文本与标注）。

### 1.2 处理后数据 (Processed Data - Intermediate)
源数据经由预处理流水线转换、映射后的中间态数据：
- **工科数分对应真题集**：`src/data/exercises/engineering_analysis_exercises.json`（**2.5 MB**，经过知识点和章节映射后的结构化试题库）。
- **工科数分课后习题集**：`src/data/exercises/engineering_analysis_textbook_exercises.json`（**1.5 MB**，教材各章各节自带习题）。
- **章节索引字典**：`src/data/exercises/chapter_index.json`（章节与题目的关联速查表）。

### 1.3 生成数据 (Generated Data - Build-Time Artifacts)
在每次 `npm run build` 或特定脚本触发时由程序自动化生成，**绝不应人工编辑**的数据：
- **跨页学术引用索引**：`public/data/cross-ref/<col>-<book>.json`（由 `build-cross-ref-data.mjs` 生成）。
- **AI 语义切片检索索引**：`public/ai-index/<col>-<book>.json`（由 `build-ai-index.mjs` 生成）。
- **章节内联拓扑图谱**：`public/relation-graphs/<col>-<book>.json`（由 `build-relation-graphs.mjs` 生成）。
- **卡片模块巡检与速查数据**：`public/inspector-data/<col>-<book>.json` 与 `books.json`（由 `build-inspector-data.mjs` 生成）。
- **KaTeX 预编译静态分章题目**：`public/data/exercises/engineering_analysis/ch{1..7}.json`、`papers.json`、`papers/p{id}.json`、`meta.json`（由 `build-exercise-data.mjs` 生成）。
- **全书离线 EPUB 文件**：`public/epub/<book-slug>.epub`（由 `generate-epub.mjs` 生成）。

### 1.4 运行时数据 (Runtime Data - Dynamic / Transient)
伴随用户或开发者在浏览器端交互而动态产生的数据：
- **浏览器持久化状态 (localStorage)**：
  - `astrolib_ai_api_key`：用户自带的 OpenAI / DeepSeek API 密钥；
  - `astrolib_compiler_gh_token`：用于云端 LaTeX 编译调度的 GitHub Personal Access Token；
  - `astrolib_recent_reading`：读者当前书目最近阅读位置与章节历史；
  - `astrolib_user_answers_*`：自测答题记录与对错判定状态。
- **浏览器会话缓存 (sessionStorage / Memory)**：
  - `astrolib_sidebar_scroll`：左侧栏滚动高度记忆；
  - `pageCache`（内存 Map）：SPA 路由维护的 5 页 LRU 母版 DOM 节点。
- **开发期写入数据 (Dev Server Mutated Files)**：
  - `src/data/exercises/feedbacks.json`（本地测试读者反馈记录）；
  - `src/data/exercises/community_ai_solutions.json`（本地缓存的读者 AI 题解分享）。

### 1.5 静态公共资产 (Static Public Assets)
直接部署并由 Web 服务器分发的纯静态静态文件：
- 封面图：`public/covers/*`；
- 图标：`public/favicon.svg`；
- （⚠️ 异常污染残留：`public/test_*.pdf`, `public/test_*.log`, `public/missfont.log`）。

---

## 2. 五大关键业务数据流端到端追踪

### 2.1 教材内容数据流 (Textbook Content Pipeline)

```
[原始教材 PDF]
      │
      ▼ (MinerU OCR 解析)
[task/*.md + 图片]
      │
      ▼ (scripts/import_*.py 自动化章节切分与卡片打标)
[src/content/docs/collections/<col>/<book>/*.mdx] ◄── [Source Data]
      │
      ▼ (astro.config.mjs 中的 Unified 编译流水线)
  ├── 1. remarkMath: 识别 $..$ 和 $$..$$
  ├── 2. rehypeMathPromote: 智能提升正文单字母数学变量
  ├── 3. rehypeKatexAnnotate: 暂存 LaTeX 原始字符串
  ├── 4. rehypeKatex: 编译为纯静态 HTML (output: 'html')
  ├── 5. rehypeKatexPromote: 回填 data-latex 属性至公式节点
  ├── 6. rehypeCrossRef: 扫描例题/图表，下沉为静态徽章 (<span class="block-ref-badge">)
  ├── 7. rehypeEditorAnnotate: (devOnly) 注入 data-src-file / data-src-line
  └── 8. rehypeMermaid: 拦截时序图代码块
      │
      ▼ (Astro / Starlight 构建)
[dist/collections/<col>/<book>/*/index.html] (完全静态化，零客户端公式解析开销)
```

---

### 2.2 题库与自测数据流 (Exercise & Question Bank Pipeline)

```
[src/data/exercises/raw_papers/ (175套试卷)]
      │
      ▼ (scripts/process_bupt_math_archive.py 语法规范化与排版清洗)
[src/data/exercises/bupt_math_full_database.json (10.3MB)]
      │
      ▼ (scripts/lib/math_archive/curriculum_mapper.py 知识点映射与去重)
[src/data/exercises/engineering_analysis_exercises.json (2.5MB)] ◄── [Processed Data]
      │
      ▼ (scripts/build-exercise-data.mjs: KaTeX HTML 构建期预渲染与数据瘦身)
[public/data/exercises/engineering_analysis/] ◄── [Generated Data]
  ├── ch1.json ~ ch7.json (按章节聚合，包含教材习题与历年真题精选)
  ├── papers.json (全书试卷大纲索引)
  └── papers/p{id}.json (单张试卷全量详情)
      │
      ▼ (用户在正文点击 <ExerciseTrigger /> 或按快捷键 Alt+E)
[src/components/exercises/ExerciseModal.astro]
      │
      ▼ (src/components/exercises/exercise-controller.ts 异步 fetch() 对应章节 JSON)
[浏览器端呈现交互答题、即时核对对错、查看解析]
      │
      ├──► [导出 LaTeX / 云端编译] ──► 调度 GitHub Actions (compile-latex.yml) ──► 下载 PDF
      └──► [开发者在线修改源码] ──► POST /api/exercise/save ──► 写回源 JSON ──► 同步增量重构
```

---

### 2.3 AI 书内检索问答数据流 (AI Index & RAG Pipeline)

```
[src/content/docs/collections/<col>/<book>/*.mdx]
      │
      ▼ (scripts/build-ai-index.mjs 扫描全书目录)
[src/ai/chunker.mjs: 基于卡片标签与 Heading 深度语义切分 (cap: 1200 字符)]
      │
      ▼ (src/ai/indexer.mjs: 提取 Clean Slug 路由、卡片类别与倒排分词特征)
[public/ai-index/<col>-<book>.json (每本书约 50KB ~ 300KB)] ◄── [Generated Data]
      │
      ▼ (astro build 复制至 dist/ai-index/)
[用户点击 AI 问答抽屉 (AIAsk.astro)]
      │
      ▼ (chat-controller.ts 仅在初次唤起时异步下载当前图书的 JSON 索引)
[用户在前端输入数学/学术提问]
      │
      ▼ (src/ai/retriever.mjs: 本地 BM25 关键词加权打分，筛选 Top-K 片段)
[拼装受限 Prompt 上下文 (严格限制 maxContextChars: 6000 字符)]
      │
      ▼ (src/ai/llm.mjs: 纯前端 Fetch 直连用户自带的 OpenAI / DeepSeek SSE 流式端点)
[浏览器端打字机流式渲染公式与文本答案]
```

---

### 2.4 跨页双向学术引用数据流 (Cross-Reference Pipeline)

```
[src/content/docs/collections/<col>/<book>/*.mdx]
      │
      ▼ (scripts/build-cross-ref-data.mjs 调用 src/utils/cross-ref-indexer.mjs)
[扫描全书 AST: 提取 <Example>, <Knowledge> 等组件及图表捕获正则]
      │
      ▼
[public/data/cross-ref/<col>-<book>.json] (全书所有编号 → 章节/URL/标题的映射表)
      │
      ├──► [构建期 (rehypeCrossRef)]:
      │       在 Markdown 处理阶段直接将正文出现的“例题 1.74”转换为
      │       <span class="block-ref-badge" data-target="...">例题 1.74</span>
      │
      └──► [客户端运行期 (cross-ref-client.ts)]:
              1. 页面加载完成后，空闲期拉取当前书的 cross-ref JSON 字典；
              2. 遍历页面所有 .block-ref-badge；
              3. 查询字典成功后挂载微动效箭头与跳转 URL；
              4. 监听 mouseenter 事件，就地渲染悬浮浮层预览（Popover Card）。
```

---

### 2.5 章节关系与知识图谱数据流 (Relation Graph Pipeline)

```
[public/data/cross-ref/<col>-<book>.json (全书跨页引用索引)]
      │
      ▼ (scripts/build-relation-graphs.mjs 调用 src/utils/relation-graph/generator.mjs)
[拓扑关联计算引擎: 计算章节间跨章引用的加权有向边矩阵]
      │
      ▼
[public/relation-graphs/<col>-<book>.json] ◄── [Generated Data]
  ├── nodes: 章节节点 (包含文件路径、章节编号、名称、重要度权重)
  ├── links: 知识流动边 (包含 source、target、跨章引用次数、具体引用内容)
  └── stats: 全书知识密度与引用网络统计汇总
      │
      ▼ (用户按 Alt+G 或点击大纲顶部“关系图”按钮)
[src/components/BookRelationGraph.astro 挂载全屏模态对话框]
      │
      ▼ (src/utils/relation-graph/relation-graph-client.ts)
[动态按需拉取 ECharts 库并初始化力导向拓扑关系图 (Force-Directed Graph)]
```
