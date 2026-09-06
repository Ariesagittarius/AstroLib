# AstroLib 构建管线与任务编排分析 (Build Pipeline)

> 本文档详细拆解 AstroLib 的全链路构建过程，理清预构建脚本（Pre-build Scripts）、Astro 核心编译、MDX 增强处理、离线出版物导出、以及 GitHub Actions 云端任务之间的拓扑调度关系。
> 调查原则：**只调查，不修改。**

---

## 1. 全局构建任务拓扑图

```
                           [npm run build / npm run build:all]
                                            │
                                            ├────────────────────────────────┐
                                            ▼ (仅在 build:all 或 npm run epub 时触发)
                                   ┌─────────────────┐
                                   │  EPUB Packager  │
                                   │generate-epub.mjs│
                                   └────────┬────────┘
                                            ▼
                                   [public/epub/*.epub]
                                            │
                                            ▼
                  ┌──────────────────────────────────────────────────┐
                  │          5 步构建前置数据生成管线 (Pre-Build)        │
                  │  (依次串行执行，各自受 features.config.mjs 开关控制) │
                  └─────────────────────────┬────────────────────────┘
                                            │
   ┌──────────────────┬─────────────────────┼─────────────────────┬──────────────────┐
   ▼                  ▼                     ▼                     ▼                  ▼
┌──────────────┐┌──────────────┐   ┌─────────────────┐   ┌─────────────────┐┌─────────────────┐
│ 1. 题库预编译 ││ 2. AI 索引   │   │ 3. 关系图谱     │   │ 4. 跨页引用     ││ 5. 模块巡检     │
│build-exercise││build-ai-index│   │build-relation   │   │build-cross-ref  ││build-inspector  │
└──────┬───────┘└──────┬───────┘   └────────┬────────┘   └────────┬────────┘└────────┬────────┘
       ▼               ▼                    ▼                     ▼                  ▼
[public/data/ex] [public/ai-idx]   [public/relation]     [public/data/ref]  [public/inspector]
       └───────────────┴────────────────────┼─────────────────────┴──────────────────┘
                                            │
                                            ▼
                  ┌──────────────────────────────────────────────────┐
                  │       node_modules/astro/bin/astro.mjs build     │
                  │  (--max-old-space-size=4096 内存保障)             │
                  └─────────────────────────┬────────────────────────┘
                                            │
                  ┌─────────────────────────┴────────────────────────┐
                  ▼                                                  ▼
      ┌───────────────────────┐                          ┌───────────────────────┐
      │ Unified / MDX 编译流   │                          │ Starlight 静态页面生成 │
      │ · remarkMath          │                          │ · 动态多合集侧边栏   │
      │ · rehypeKatex (html)  │                          │ · 布局与组件插槽装配  │
      │ · rehypeCrossRef (下沉)│                          │ · Pagefind 离线索引   │
      │ · rehypeMermaid       │                          └───────────┬───────────┘
      └───────────┬───────────┘                                      │
                  └─────────────────────────┬────────────────────────┘
                                            │
                                            ▼
                  ┌──────────────────────────────────────────────────┐
                  │                   dist/ 产物输出                 │
                  │ (包含 HTML、CSS、JS、静态资源与 public/ 预构建数据)│
                  └──────────────────────────────────────────────────┘
```

---

## 2. 构建阶段深度拆解

### 2.1 任务脚本定义与差异 (`package.json`)
在 `package.json` 的 `scripts` 中，存在如下关键构建命令：

```json
{
  "build": "node --max-old-space-size=4096 scripts/build-exercise-data.mjs && node --max-old-space-size=4096 scripts/build-ai-index.mjs && node --max-old-space-size=4096 scripts/build-relation-graphs.mjs && node --max-old-space-size=4096 scripts/build-cross-ref-data.mjs && node --max-old-space-size=4096 scripts/build-inspector-data.mjs && node --max-old-space-size=4096 node_modules/astro/bin/astro.mjs build",
  "build:exercises": "node scripts/build-exercise-data.mjs",
  "build:all": "node scripts/generate-epub.mjs && npm run build",
  "epub": "node scripts/generate-epub.mjs"
}
```

#### 关键事实发现：
1. **强制性 4GB 堆内存保护 (`--max-old-space-size=4096`)**：
   - 每一个构建步骤都显式配置了 4GB 内存上限。这是因为 `src/data/exercises/` 中存在高达 14MB+ 的原始 JSON，且全站 300+ 章节 MDX 包含数千个 KaTeX 复杂公式，若不扩容堆内存，Node 默认垃圾回收机制会在 `astro build` 期间频繁崩溃 (OOM)。
2. **常规构建不包含 EPUB 生成**：
   - `npm run build`（生产标准部署命令）**不执行** `generate-epub.mjs`；
   - 只有 `npm run build:all` 或单独的 `npm run epub` 才会生成 EPUB。
   - EPUB 的实际发行通过 GitHub Actions 的独立工作流（`epub-release.yml`）承载。
3. **LaTeX / Typst 不参与站点静态构建**：
   - LaTeX 试卷与 Typst 讲义的生成脚本不在 `npm run build` 流程中，它们属于**按需触发的外部服务与本地校验工具**（详见后文）。

---

### 2.2 串行预构建数据阶段 (Pre-Build Pipeline)

在 Astro 启动对 `.mdx` 和 `.astro` 的编译前，必须先生成供客户端运行时异步拉取的 JSON 索引。各步骤执行逻辑与开关控制如下：

| 步骤序号 | 执行脚本 | 对应特性开关 | 数据输入源 | 产物输出路径 | 核心行为与减负考量 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Step 1** | `scripts/build-exercise-data.mjs` | `features.exercises.enabled` | `src/data/exercises/*.json` | `public/data/exercises/engineering_analysis/` | 构建期用 KaTeX 预渲染所有题目公式为纯 HTML，拆分成分章/分卷轻量 JSON，避免客户端运行时解析 LaTeX。 |
| **Step 2** | `scripts/build-ai-index.mjs` | `features.aiAsk.enabled` | `src/content/docs/collections/` | `public/ai-index/<col>-<book>.json` | 将正文按语义卡片拆分成不超过 1200 字符的切片，提取关键词索引，每本书独立成包。 |
| **Step 3** | `scripts/build-relation-graphs.mjs` | `features.relationGraph.enabled` | `src/content/docs/` + cross-ref 索引 | `public/relation-graphs/<col>-<book>.json` | 扫描计算全书章节间跨章引用矩阵，输出节点权重与边关联，供 ECharts 渲染。 |
| **Step 4** | `scripts/build-cross-ref-data.mjs` | `features.crossRef.enabled` | `src/content/docs/` | `public/data/cross-ref/<col>-<book>.json` | 扫描全书卡片编号（例题、定理、图表），建立“编号 → 目标章节 URL/锚点”速查表。 |
| **Step 5** | `scripts/build-inspector-data.mjs` | `features.inspector.enabled` | `src/content/docs/` | `public/inspector-data/` | 扫描全书卡片模块，生成全局模块索引字典 `books.json` 与各书模块明细。 |

> **关键机制**：如果某项特性在 `src/config/features.config.mjs` 中被置为 `enabled: false`，其对应的脚本会输出 `[已跳过]` 并立即退出，实现零产物生成与构建提速。

---

### 2.3 Astro 构建与 MDX 编译阶段 (Astro Build & MDX Engine)

当全部前置数据生成在 `public/` 目录下就绪后，执行核心 Astro 静态编译：

1. **配置组装 (`astro.config.mjs`)**：
   - 动态调用 `generateBookSidebar()` 对物理文件执行自然排序（Natural Sorting 1.1 -> 1.10），生成侧边栏树状配置；
   - 根据 `features.config.mjs` 启停状态，动态挂载 Remark / Rehype 插件与 CSS。
2. **Unified AST 处理流水线**：
   - `remarkMath`：识别 Markdown 中的数学公式定界符；
   - `rehypeMathPromote`：通过模式识别将正文中的独立孤立变量提升为公式；
   - `rehypeKatexAnnotate` + `rehypeKatex` + `rehypeKatexPromote`：采用 `output: 'html'` 编译 KaTeX，并使用自定义双向包装器把原始 LaTeX 源码写进 HTML 节点的 `data-latex` 自定义属性；
   - `rehypeCrossRef`：在编译阶段扫描“例题 1.2”等文本，直接在 AST 树上将其替换为带有目标元数据的静态 `<span class="block-ref-badge">`，彻底免除客户端运行时的正则文本遍历；
   - `rehypeMermaid`：将 Mermaid 代码块转译为容器节点；
   - `rehypeImageBlur`：（默认关闭）生成 LQIP 模糊占位图。
3. **Starlight 页面渲染与公共资产搬运**：
   - 执行 Astro 静态页面生成，各页面结合 `componentOverrides` 完成布局组装；
   - 自动将 `public/` 目录下的所有文件原样完整拷贝至 `dist/`（使前面生成的 `public/data/`、`public/ai-index/` 等直接变为部署后的静态 URL 可访问端点）；
   - 调用 `pagefind` 执行静态全文检索索引构建。

---

## 3. 离线出版物与多格式引擎关系

### 3.1 EPUB 生成流水线 (`scripts/generate-epub.mjs`)
- **运行定位**：脱机出版物构建，不随日常 Web 构建运行。
- **流程机制**：
  1. 读取 `src/config/collections.config.mjs` 获取全书元数据与封面；
  2. 遍历章节 MDX，使用专用的 `scripts/epub/mdx-pipeline.mjs` 编译正文为干净的 XHTML；
  3. 将 `node_modules/katex/dist/katex.min.css` 与定制版 `site.css` 嵌入；
  4. 通过 `scripts/epub/zip.mjs` 按照 EPUB 3 标准目录规范压缩为 `.epub` 文件，输出到 `public/epub/`。

### 3.2 LaTeX 生成与无服务器云端编译引擎 (`latex-generator.ts` + GitHub Actions)
- **运行定位**：学术级纸质试卷与练习册的按需实时 PDF 生成。
- **架构解耦**：
  - AstroLib **本地不需要安装 5GB+ 的 TeX Live 环境**；
  - 浏览器端或脚本调用 `generateLatexDocument()` 输出符合 `Jinwen-XU/homework` 与 `ctex` 规范的标准 LaTeX 源码；
  - 客户端通过 `latex-cloud-compiler.ts` 调度 GitHub Actions API，触发云端编译（详见后文）。

### 3.3 Typst 本地高性能编译引擎 (`typst-generator.ts`)
- **运行定位**：现代排版技术探索与单题/分章高速 PDF 导出。
- **实现方式**：
  - 在 `src/utils/typst/typst-generator.ts` 中完成 LaTeX 公式到 Typst 数学语法的 AST 转换；
  - 通过 `@myriaddreamin/typst-ts-node-compiler` 本地 WASM/Node 编译器在毫秒内直接输出 PDF；
  - 当前主要用于测试与自测（`scripts/test-typst-export.mjs`），尚未并入全站一键导出 UI。

---

## 4. GitHub Actions 自动化工作流与云端协同

项目在 `.github/workflows/` 下声明了 3 个自动化工作流，构成了云端构建与算力分担矩阵：

```
                    ┌────────────────────────────────────────────────────────┐
                    │               GitHub Actions Workflows                 │
                    └───────────────────────────┬────────────────────────────┘
                                                │
         ┌──────────────────────────────────────┼──────────────────────────────────────┐
         ▼                                      ▼                                      ▼
┌───────────────────────────────┐┌──────────────────────────────┐┌───────────────────────────────┐
│       compile-latex.yml       ││  cleanup-latex-releases.yml  ││       epub-release.yml        │
│  (XeLaTeX 云端免运维编译池)   ││   (每日定时自动清理过期临时包)││   (全书 EPUB 自动构建与发布)  │
├───────────────────────────────┤├──────────────────────────────┤├───────────────────────────────┤
│ · 触发: workflow_dispatch     ││ · 触发: cron (每天 UTC 03:00) ││ · 触发: push/tag (书籍目录变动)│
│ · 接收: Base64 LaTeX 源码     ││ · 扫描: tag 名为 job-* 的发行 ││ · 步骤: npm run epub          │
│ · 编译: TeX Live 2024 (XeLaTeX)││ · 判定: 存活时间超过 24 小时  ││ · 发布: 上传 public/epub/ 产物│
│ · 产物: 自动建 Release 发行包 ││ · 动作: 自动调用 REST API 物理││   至 GitHub Release 'latest' │
│   供浏览器直接下载 PDF 打印文件││   删除 Release 及 Git Tag     ││   或版本 Tag                  │
└───────────────────────────────┘└──────────────────────────────┘└───────────────────────────────┘
```

#### 架构亮点：
- **云端作为 LaTeX 编译集群**：用户在浏览器前端配置个人 GitHub Token 后，AstroLib 即可将 GitHub Actions 免费并发计算资源转化为无需自建服务器的“云端 LaTeX 打印机”。
- **阅后即焚生命周期管理**：`cleanup-latex-releases.yml` 每天定时巡检并删除超过 24 小时的临时编译 Job 发行包，确保公共 Release 仓库干净整洁，杜绝存储膨胀。
- **持续出版 (Continuous Publishing)**：只要作者向 `src/content/docs/collections/**` 推送教材改动，`epub-release.yml` 就会全自动重新编译全书 EPUB 并更新 GitHub Releases。
