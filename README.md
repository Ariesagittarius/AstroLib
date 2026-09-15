<div align="center">

# AstroLib

<p align="center">
  <a href="https://astro.build"><img src="https://img.shields.io/badge/Astro-v7.0-bc52ee?style=flat-square&logo=astro&logoColor=white" alt="Astro" /></a>
  <a href="https://starlight.astro.build"><img src="https://img.shields.io/badge/Starlight-v0.41-purple?style=flat-square" alt="Starlight" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node-%3E%3D20.0-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node" /></a>
  <a href="https://katex.org"><img src="https://img.shields.io/badge/KaTeX-Fast_Math-00d084?style=flat-square&logo=latex&logoColor=white" alt="KaTeX" /></a>
  <a href="https://github.com/Ariesagittarius/AstroLib/releases"><img src="https://img.shields.io/badge/EPUB3-Offline_Export-orange?style=flat-square" alt="EPUB" /></a>
</p>



</div>

AstroLib 是一个面向中国高校数学、物理等理工科内容的学术数字书库。项目将教材正文、数学公式、插图、结构化习题、章节引用和知识关系组织在同一套内容管线中，并提供适合网页阅读、离线阅读和再排版的输出形式。



## 项目特色

* **Material You 阅读界面**：基于 Material 3 组件和动态主题，支持亮暗模式、字体选择及响应式布局。
* **KaTeX 公式支持**：Markdown/MDX 中的 LaTeX 公式由 KaTeX 渲染；并拥有可选设置项，打开时正文视图公式将可以复制 LaTeX 源码，或导出为 SVG/PNG。
* **章节 LaTeX / PDF 导出**：将当前章节输出为教材风格的 LaTeX 源码、离线编译包或 PDF，其中PDF支持本地编译（需要 XeLaTeX 环境）或提交到 Github Action 编译。
* **全书 EPUB 导出**：将书籍章节、图片、KaTeX 样式和字体组装为可离线阅读的 EPUB。
* **习题**：在侧栏或单独窗口练习和书籍关联的习题，并随时询问  AI 有关内容。
* **跨章节引用**：识别结构化内容信息并链接。
* **知识体系构建**：构建期生成章节关系图、模块索引和书内检索数据。
* **AI 书内问答**：检索当前书籍的知识索引后调用模型 API 生成回答；支持 Gemini、DeepSeek 和自定义 OpenAI 兼容端点。
* **贡献者工具**：提供 OCR 导入、图像处理、内容巡检、开发期编辑器、题库构建和 AI 辅助清洗脚本。

## 在线使用

项目的线上部署地址和可下载资源以仓库发布页面为准：
* 在线阅读站点：[astrolib.cloud](https://www.astrolib.cloud)
* GitHub 仓库：[https://github.com/Ariesagittarius/AstroLib](https://github.com/Ariesagittarius/AstroLib)
* GitHub Releases：[https://github.com/Ariesagittarius/AstroLib/releases](https://github.com/Ariesagittarius/AstroLib/releases)

使用在线 AI 问答时，API Key 由读者在浏览器中自行配置。**项目不提供共享密钥，也不会把读者的密钥写入仓库**。

## 本地运行

### 环境要求

* Node.js： LTS
* npm
* Git
* PDF 编译：XeLaTeX
* 仅在运行 Python 导入、OCR 或视觉脚本时：Python 3 及相应脚本依赖

### 安装依赖

```powershell
git clone https://github.com/Ariesagittarius/AstroLib.git
cd AstroLib
npm install
```

### 启动开发服务器

```powershell
npm run dev
```

然后打开终端显示的本地地址，通常为：

```text
http://localhost:4321
```

也可以使用：

```powershell
npm start
```

开发模式包含若干仅开发期启用的工具，例如对当前页面（相当不完善）的即时修改工具、查看可能有问题的模块、并使用针对本地端口的 Gemini 请求代理。

### 构建生产站点

```powershell
npm run build
npm run preview
```

`npm run build` 会依次生成：

1. 习题静态数据
2. AI 书内检索索引
3. 章节关系图数据
4. 跨章节引用数据
5. 模块索引数据
6. Astro 静态站点

生产构建输出到 `dist/`。构建过程中生成的索引和题库数据属于派生数据，应由源内容和脚本重新生成，不应反向作为内容源编辑。

## 常用命令

|命令|用途|
|-|-|
|`npm run dev`|启动 Astro 开发服务器|
|`npm run build`|生成全部派生数据并构建生产站点|
|`npm run build:exercises`|单独构建习题数据|
|`npm run build:all`|生成 EPUB 后执行完整构建|
|`npm run epub`|生成书籍 EPUB|
|`npm run preview`|预览生产构建|
|`npm run check:katex`|检查公式度量|
|`npm run fix:katex`|修复公式度量|
|`npm run check:commit`|检查提交信息格式|
|`npm run test:stripper`|测试公共分发前的注释剥离器|

常用脚本：

```powershell
# 检查一本书的 MDX
node scripts/scan-mdx.mjs src/content/docs/collections/math/math\\\\\\\_analysis

# 导出一个章节的 LaTeX
node scripts/export-chapter-latex.mjs `
  src/content/docs/collections/math/engineering\\\\\\\_analysis/1.1\\\\\\\_集合映射与函数.mdx `
  --zip

# 导出并尝试调用本地 XeLaTeX 编译 PDF
node scripts/export-chapter-latex.mjs `
  src/content/docs/collections/math/engineering\\\\\\\_analysis/1.1\\\\\\\_集合映射与函数.mdx `
  --zip --compile

# 只生成一本书的 EPUB
node scripts/generate-epub.mjs --only engineering\\\\\\\_analysis
```

脚本参数和特殊前置条件以各脚本顶部的帮助信息或说明为准。需要查看帮助时，可直接运行：

```powershell
node scripts/export-chapter-latex.mjs --help
python scripts/process\\\\\\\_bupt\\\\\\\_math\\\\\\\_archive.py --help
```

## AI 书内问答

AI 功能采用 BYOK（Bring Your Own Key）模式：

1. 打开页面右上角的快速设置。
2. 进入 AI 设置区域。
3. 选择提供商和模型。
4. 填写自己的 API Key。
5. 点击“测试连接”。

当前内置提供商：

* **Google Gemini**：使用 Google 的 OpenAI 兼容端点。开发模式默认经过本地 `/api/proxy/gemini/` 代理。
* **DeepSeek**：默认端点为 `https://api.deepseek.com/v1/chat/completions`。
* **自定义**：可添加任何协议兼容、允许浏览器请求的 OpenAI 兼容服务。

Gemini 通常需要能够访问 Google 服务的网络环境；如果所在网络无法直接访问 Google，需要自行准备代理或可用的反向代理端点。代理只负责网络转发，不负责申请 API Key。

AI 问答使用构建期生成的 `public/ai-index/` 作为书内检索来源。修改书籍正文后，应重新运行：

```powershell
node scripts/build-ai-index.mjs
```

不要将 API Key 写入源码、配置文件、Issue、日志、截图或提交历史。


## 内容与数据结构

### 书籍配置

书籍、collection 和书籍元数据集中维护在：

```text
src/config/collections.config.mjs
```

新增书籍时，必须同时满足：

* `slug` 与正文目录名一致；
* `entryPoint` 与实际入口章节文件名一致；
* 书籍目录位于 `src/content/docs/collections/<collection>/<book>/`；
* 必要图片位于书籍目录的 `images/`；
* 书籍拥有清晰的来源、版本和版权说明。

### 功能注册表

全站功能由：

```text
src/config/features.config.mjs
```

统一注册。公式、主题、跨页引用、关系图、EPUB、章节导出、AI 问答、勘误反馈和习题等功能的开关与基础配置都应优先在此维护。

### 习题库

题库配置位于：

```text
src/config/exercise-banks.config.ts
```

题库源数据位于：

```text
src/data/exercises/
```

生成的题库数据位于：

```text
public/data/exercises/
```

不要直接编辑生成目录。新增题库时，需要填写来源类型、适用书籍 slug 和许可证信息。

## 添加一本新书

完整流程如下：

1. 在 `src/content/docs/collections/<collection>/<book>/` 准备章节 MDX 和图片。
2. 在 [`collections.config.mjs`](./src/config/collections.config.mjs) 的对应 `books` 数组注册书籍。
3. 为章节添加正确的标题、结构化组件和数学定界符。
4. 运行 MDX 检查：

```powershell
   node scripts/scan-mdx.mjs src/content/docs/collections/<collection>/<book>
   ```

5. 运行完整构建：

```powershell
   npm run build
   ```

6. 检查网页侧栏、章节跳转、公式、图片、关系图、AI 问答索引、EPUB 和章节导出。

不需要也不应手动修改 `public/ai-index/`、`public/data/cross-ref/`、`public/relation-graphs/` 或 `public/inspector-data/` ；这些数据应当由源内容和构建脚本生成。

## 加入一本习题册

1. 将题目整理为项目现有 JSON 数据结构，放入 `src/data/exercises/`。
2. 在 `EXERCISE\\\\\\\_BANKS` 中注册题库。
3. 让 `applicableBooks` 使用中央书籍配置中的 `book.slug`。
4. 填写题库来源、许可证和原始仓库。
5. 运行：

```powershell
   npm run build:exercises
   node scripts/check-all-datasets.mjs
   ```

6. 在对应书籍页面检查章节筛选、题目渲染、答案和解析。

OCR 或模型生成的题目、答案和解析必须人工复核。题库不是书籍正文的替代品，涉及教材结论时应保留返回正文的引用。

## 贡献内容

### 贡献书籍

贡献书籍前，请确认拥有处理、改编和发布原始资料的权利。推荐流程：



1. 用 Gemma 26B（本地运行）或 Gemini 3.5 Flash Lite 辅助清洗断行、标题层级、公式和图注。
2. 将清洗结果转换为 MDX。
3. 对公式、定理、图注、章节顺序和引用进行人工校对。
4. 使用 `scan-mdx.mjs`、`npm run build`、EPUB 和 LaTeX 导出进行检查。



项目提供了一个结构化清洗提示词模板：

```text
public/dev/prompts/book-cleaning-prompt.txt
```

Gemma 26B 和 Gemini 均只是辅助工具。项目没有内置 Gemma 推理服务。

### 在线提交勘误

在需要勘误的页面按 `Alt+F`，选中错误的段落并填写勘误信息；

勘误经维护者审阅后才会修改源 MDX，并重新生成派生数据。

### 贡献 AI 答案

本项目支持直接上传用户针对习题生成的 AI 答案；答案和模型信息将自动关联到相关题目，并支持所有阅读在线网站的用户查看；提交您的答案**不会泄露您的 API KEY 或者个人隐私信息**。

## 项目结构

```text
.
├── astro.config.mjs                 # Astro、Starlight、侧栏和构建插件
├── package.json                     # 依赖和常用命令
├── src/
│   ├── config/
│   │   ├── collections.config.mjs   # 书籍与 collection 来源
│   │   ├── features.config.mjs      # 功能注册表
│   │   └── exercise-banks.config.ts # 题库注册表
│   ├── content/docs/collections/    # 书籍正文
│   ├── components/                  # Astro UI 组件
│   ├── features/                    # 按功能组织的客户端与服务端逻辑
│   ├── ai/                          # AI 配置、索引和对话逻辑
│   ├── publishing/                  # LaTeX、Typst 等发布器
│   └── data/exercises/              # 题库源数据
├── scripts/                         # 导入、构建、导出和测试自动化
├── public/                          # 浏览器直接访问的静态资源与派生数据
├── docs/                            # 项目内部设计与交接资料
└── dist/                            # 生产构建输出
```

## 检查与测试

最小检查：

```powershell
npm install
node scripts/scan-mdx.mjs src/content/docs/collections/<collection>/<book>
npm run build
```

专项测试脚本位于 `scripts/test-\\\\\\\*.mjs`，覆盖：

* LaTeX、Typst 和 EPUB 导出；
* 跨章节引用；
* AI 工具和提供商错误；
* 题库和真实场景；
* 字体与排版；
* UI 模态框和评论剥离。

某些测试需要本地字体、XeLaTeX、Python 包或外部服务。

## 许可证与内容责任

代码、书籍、题库、图片和外部数据可能适用不同许可证。请以各文件、题库配置和来源仓库中的许可证声明为准，不要把第三方教材或扫描资料默认视为可自由再发布内容。

贡献者应对自己提交的内容来源、准确性和授权负责。AI 生成或 OCR 生成的内容应当经过人工复核（虽然现在并没有经过复核）。

## 进一步阅读

详细的运行、贡献和 AI 配置说明见站内[项目开发文档](/dev/)：

## 联系与反馈

发现正文错误，请优先使用站内勘误入口；发现代码问题、构建问题或希望贡献内容，请在 GitHub 仓库提交 Issue 或 Pull Request，并附上可复现步骤、相关路径和检查结果。

