# AstroLib

AstroLib 是一个基于 Astro 与 Starlight 框架构建的高精度理科（数学、物理）学术文献与教材数字化发布系统。该系统专注于教材内容的语义结构化抽取、KaTeX 公式排版、跨章节知识拓扑关联、端侧检索增强生成（RAG）以及学术级离线出版物分发。

---

## 1. 核心架构设计

系统设计遵循关注点分离、编译期计算下沉与单一可信源原则，确保在大规模公式与长篇幅章节场景下依然具备极低的渲染负载与高效的浏览体验。

### 1.1 中央元数据驱动 (Central Metadata Driver)
* `src/config/collections.config.mjs` 作为全站合集（Collections）、图书（Books）与卡片模块（Modules）的唯一数据源（Single Source of Truth）。
* 统一维护书籍 ISBN、出版信息、阅读入口、模块卡片类别（如定义、定理、例题、习题）及跨页识别特征。

### 1.2 全站特性注册表 (Feature Registry)
* `src/config/features.config.mjs` 集中管理全站功能（如 KaTeX、主题、自托管字体、引用联动、图谱、AI 问答、EPUB 导出、在线精修等）的构建开关与运行参数。
* 构建阶段依据注册表动态挂载 Remark/Rehype 插件、Vite 端点与样式表。未启用的功能在编译阶段被完全剥离，实现零打包体积开销（Zero Bundle Overhead）。

### 1.3 编译期计算下沉管线 (Build-time Lowering Pipeline)
* **LaTeX 源码双向绑定**：通过自定义 Rehype 插件在 AST 处理阶段将原始 LaTeX 语法注入元素属性（`data-latex`），为前端公式复制提供完整支持。
* **交叉引用静态下沉**：正文中出现的定理、例题与图表编号在构建期由 `rehype-cross-ref` 插件自动转换为标准超链接与语义徽章，消除了客户端单页跳转时的 DOM 扫描开销。
* **公式体积优化**：KaTeX 采用纯 HTML 模式输出（`output: 'html'`），剔除 MathML 冗余标记，大幅压缩单页 HTML 体积。

### 1.4 路由与侧边栏隔离
* **自然排序生成**：侧边栏自动解析章节编号（如 1.1 至 10.1）进行自然排序。
* **Slug 规范化**：所有内部链接统一通过 `cleanSlug()` 进行字符过滤与归一化，防止特殊字符与大小写导致的 404 路由异常。
* **单书渲染作用域**：服务端仅渲染当前正在阅读的图书目录树，避免跨书全量渲染带来的首屏性能退化。

---

## 2. 核心功能与技术实现

### 2.1 数学公式与排版引擎
* 深度集成 KaTeX 渲染管线，支持行内公式（`$...$`）与独立块级公式（`$$...$$`）。
* 针对公式末尾编号（`\tag{...}`）在移动端与窄屏设备下的排版冲突，提供了专用 CSS 弹性定位方案，杜绝内容重叠。
* 支持公式一键复制 LaTeX 原始源码。

### 2.2 结构化语义卡片系统
* 提供标准化的 MDX 卡片组件库，用于对教材内容进行原子化封装：
  * 知识与概念：`<Knowledge>`（知识点）、`<Note>`（注解/说明）
  * 理论推演：`<Block type="theorem">`（定理）、`<Block type="definition">`（定义）、`<Block type="lemma">`（引理）、`<Block type="corollary">`（推论）
  * 实践解析：`<Example>`（例题）、`<Variant>`（变式训练）、`<Method>`（方法总结）、`<Solution>`（解题步骤）、`<Exercise>`（课后习题）
* 卡片支持统一的折叠交互、主题色绑定以及大纲动态索引关联。

### 2.3 书内检索增强问答 (Book-Scoped RAG)
* **构建期语义切片**：`scripts/build-ai-index.mjs` 扫描书籍 MDX 内容，按卡片与标题切分为语义块并生成独立的 JSON 索引文件。
* **端侧按需检索**：支持关键词检索（Keyword）与混合检索（Hybrid），严格限制召回片段数量（Top-K）与上下文长度（Max Context Chars）。
* **客户端直连 (BYOK)**：用户自备 API Key（存储于本地 LocalStorage），基于 OpenAI 兼容流式接口直接与大语言模型通信，保障数据隐私与服务端零负载。无 Key 状态下自动平滑降级为纯本地目录检索。

### 2.4 关系图谱与拓扑可视化
* 集成 ECharts 与 Mermaid，支持教材内知识节点引用拓扑、章节依赖脉络与流程时序图的可视化展示。
* 提供动态关系图谱提取端点，辅助读者建立结构化知识体系。

### 2.5 开发期精修与巡检体系 (Dev-Only)
* **可视化在线精修**：在开发环境下注入 AST 源码定位标记，支持在浏览器中点击文本直接定位并写回 MDX 源文件。
* **模块查重与巡检**：提供模块索引速查、同章重名冲突预警与异常拆分定位工具，保障海量教材数字化转换的质量。

### 2.6 学术级 EPUB3 导出管线
* 依托 `scripts/generate-epub.mjs` 实现从 MDX 源文档到标准 EPUB3 电子书的自动化编译转换，完整保留目录层级、公式标记与嵌入式矢量资源。

---

## 3. 代码库组织结构

```
.
├── astro.config.mjs               # Astro 与 Starlight 核心配置（插件装配、侧边栏、主题覆盖）
├── package.json                   # 项目依赖与运行脚本
├── AGENTS.md                      # 智能体开发规范与 Git 提交约束
├── docs/                          # 架构设计、性能优化与技术交接文档
│   ├── README.md                  # 交接文档全量索引
│   ├── 特性模块与插件系统.md
│   ├── AI 书内问答模块实现交接.md
│   ├── AI 赋能模块设计.md
│   ├── 文章切换性能优化交接文档.md
│   ├── VitePress主题改造交接文档.md
│   ├── 精修工具交接.md
│   └── 模块查重与巡检工具.md
├── scripts/                       # 构建管线、语法校验与数据索引脚本
│   ├── build-ai-index.mjs         # AI 问答语义分块索引构建脚本
│   ├── build-inspector-data.mjs   # 模块巡检数据预构建
│   ├── build-relation-graphs.mjs  # 知识关系拓扑图谱预构建
│   ├── generate-epub.mjs          # EPUB3 电子书构建生成器
│   ├── scan-mdx.mjs               # MDX 语法极速校验工具
│   ├── fix-katex-metrics.mjs      # KaTeX 指标与公式排版修正
│   └── git-clean-push.mjs         # 生产分发代码注释剥离与同步工具
├── src/
│   ├── config/
│   │   ├── collections.config.mjs # 中央书库与模块映射配置 (Single Source of Truth)
│   │   └── features.config.mjs    # 全站功能注册表 (Feature Registry)
│   ├── ai/                        # 端侧 RAG、检索控制器与 LLM 客户端通信模块
│   ├── components/                # 语义卡片组件与 Starlight 视图插槽覆盖组件
│   ├── styles/                    # 样式表（VitePress 风格主题、思源字体体系、自定义排版）
│   ├── utils/                     # 编译期 Remark/Rehype 插件、Slug 净化与编辑器服务
│   └── content/docs/
│       ├── dev/                   # 系统内置开发者指南与技术规范
│       └── collections/           # 数字化教材 MDX 章节存储目录
│           ├── math/              # 数学合集
│           └── science/           # 物理合集
└── public/                        # 静态资源、自托管字体切片与构建期生成的索引数据
```

---

## 4. 运行环境与开发指令

### 4.1 环境要求
* **Node.js**: >= 18.0.0
* **包管理器**: npm 或 pnpm
* **Python** (可选，仅在执行 OCR 原始产物导入管线时需要): Python 3.9+

### 4.2 常用开发指令

#### 服务启动与进程管理
开发服务器支持以后台守护进程模式运行：

```bash
# 启动开发服务器（默认端口 4321）
npm run dev

# 以后台守护进程模式启动
astro dev --background

# 查询开发服务器运行状态与端口
astro dev status

# 查看开发服务器实时日志
astro dev logs

# 安全终止开发服务器进程
astro dev stop
```

#### 语法验证与静态构建
```bash
# 快速校验指定书籍目录下的 MDX 语法正确性（推荐在提交前执行）
node scripts/scan-mdx.mjs src/content/docs/collections/math/math_analysis

# 校验 KaTeX 排版指标
npm run check:katex

# 完整静态站点生产构建（包含索引生成与页面渲染）
npm run build

# 本地预览生产构建产物
npm run preview

# 单独构建全书离线 EPUB 产物
npm run epub
```

---

## 5. 工程规范与版本控制

### 5.1 学术化 Commit 规范 (Academic Restrained Convention)
项目要求所有 Git 提交日志采用严谨、客观、学术风格的英文叙述，禁止使用非 ASCII 字符、Emoji 表情符号及夸大营销词汇。

* **格式规范**：`<type>(<scope>): <imperative summary>`
* **允许的 Type**：`feat`, `fix`, `perf`, `refactor`, `docs`, `style`, `chore`, `test`, `release`, `ci`, `build`
* **允许的 Scope**：`(content)`, `(katex)`, `(ui)`, `(ai)`, `(epub)`, `(sidebar)`, `(header)`, `(render)`, `(editor)`, `(ci)`, `(core)`
* **提交示例**：
  * `feat(content): import linear algebra textbook and chapter exercises`
  * `fix(layout): prevent math formula overflow on mobile viewport`
  * `perf(render): pre-render heading formulas during build time`
  * `refactor(sidebar): decouple book traversal from state manager`

### 5.2 双仓库分发机制 (Dual-Repository Pipeline)
* **本地与私有仓库**：完整保留所有架构解析、设计推导与源码注释。
* **公开仓库**：通过自动脱敏流水线去除内部注释与私有开发资产（`.agents/`, `.dsh/`, `CLAUDE.md` 等），请通过以下指令进行代码推送：

```bash
# 推送至公开仓库（自动过滤注释与私有资产）
npm run push:clean

# 推送至私有完整备份仓库
npm run push:private

# 双端同步推送
npm run push:all
```

---

## 6. 技术文档索引

详细的技术架构、性能优化推演及新书导入流程请参阅以下技术交接文档：

* 架构与插件系统：[docs/特性模块与插件系统.md](docs/特性模块与插件系统.md)
* 渲染性能与跨页引用优化：[docs/文章切换性能优化交接文档.md](docs/文章切换性能优化交接文档.md)
* AI 问答架构与 MCP 规范：[docs/AI 赋能模块设计.md](docs/AI%20赋能模块设计.md) 与 [docs/AI 书内问答模块实现交接.md](docs/AI%20书内问答模块实现交接.md)
* UI 与主题体系改造：[docs/VitePress主题改造交接文档.md](docs/VitePress主题改造交接文档.md)
* 数字化新书导入规范：[项目内置技能 import-book](.agents/skills/import-book/SKILL.md)

