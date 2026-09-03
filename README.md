<div align="center">

# AstroLib

**面向大学理工科教材与学术资料的数字化阅读与自测系统**

A modern, quiet, and typographic reading system for university mathematics and science textbooks.

<p align="center">
  <a href="https://astro.build"><img src="https://img.shields.io/badge/Astro-v7.0-bc52ee?style=flat-square&logo=astro&logoColor=white" alt="Astro" /></a>
  <a href="https://starlight.astro.build"><img src="https://img.shields.io/badge/Starlight-v0.41-purple?style=flat-square" alt="Starlight" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node-%3E%3D20.0-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node" /></a>
  <a href="https://katex.org"><img src="https://img.shields.io/badge/KaTeX-Fast_Math-00d084?style=flat-square&logo=latex&logoColor=white" alt="KaTeX" /></a>
  <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/"><img src="https://img.shields.io/badge/Dataset_License-CC_BY--NC--SA_4.0-blue?style=flat-square" alt="CC License" /></a>
  <a href="https://github.com/Ariesagittarius/AstroLib/releases"><img src="https://img.shields.io/badge/EPUB3-Offline_Export-orange?style=flat-square" alt="EPUB" /></a>
</p>

<p align="center">
  <a href="#about">关于项目</a> •
  <a href="#features">核心特性</a> •
  <a href="#textbooks">收录教材</a> •
  <a href="#quickstart">快速开始</a> •
  <a href="#copyright">版权说明</a>
</p>

</div>

---

<!-- TODO: Add screenshots -->
<!--
建议捕获并放置 1-2 张无外框、高精度的界面实景图：
1. 桌面端阅读界面（包含侧边栏、长公式与定理卡片）
2. 习题弹窗界面（即时答题、公式推导折叠与 LaTeX 导出预览）
-->

<a id="about"></a>
## 📖 关于项目

做 AstroLib 的初衷非常简单：

纸质理工科教材在数字化时常常面临两难。扫描版 PDF 在小屏或移动设备上难以阅读；而通用的知识库或博客系统又缺乏对教材级排版的严肃支持——公式缩放掉帧、长篇定理缺乏清晰层级、跨章节交叉引用频繁导致读者迷失，课后习题也往往与理论脱节。

AstroLib 尝试在**经典纸质书的严谨排版**与**现代 Web 的流畅交互**之间寻找平衡。我们信奉 **“内容即界面（The Content is the Interface）”**：

- **无多余噪声**：摒弃积分打卡、营销徽章、繁杂嵌套边框等干扰思考的设计。
- **排版至上**：通过精心调优的思源宋黑字体、自适应行距与公式基线对齐，还原沉稳、克制的纸书质感。
- **性能下沉**：将复杂的符号提取、定理引用联动和索引分块全部前置到编译期，让前端页面始终轻盈迅捷。

---

<a id="features"></a>
## ✨ 核心特性

AstroLib 深度集成 KaTeX 排版引擎与原子化 MDX 语义卡片体系（涵盖定理、定义、引理、例题、方法与可折叠推导细节），通过编译期静态计算下沉实现零客户端开销的跨章节交叉引用与公式源码一键复制；内置由北京邮电大学开源团队整理的《大邮数学集》173 套名校历年真题（CC BY-NC-SA 4.0 协议，2900+ 题）与交互式双模式自测面板，支持即时判题与推导折叠；集成基于 `Jinwen-XU/homework` 宏包的印刷级 LaTeX 讲义导出与 GitHub Actions 云端直出 PDF 工作流，并提供全书离线 EPUB3 打包管线与端侧隐私优先的知识检索辅助。

---

<a id="textbooks"></a>
## 📚 已收录教材与题库

| 领域 | 书目 / 资料名称 | 版次 / 主编 | 状态 |
| :--- | :--- | :--- | :---: |
| **数学** | 《工科数学分析基础》 | 第三版 · 王绵森、马知恩 / 高等教育出版社 | 全章上线 · 配套自测 |
| **数学** | 《数学分析》 | 第五版 · 华东师范大学数学系 / 高等教育出版社 | 全章上线 |
| **数学** | 《线性代数及其应用》 | 原书第 5 版 · David C. Lay / 机械工业出版社 | 全章上线 |
| **数学** | 《概率论与数理统计教程》 | 第三版 · 茆诗松、程依明、濮晓龙 / 高等教育出版社 | 全章上线 |
| **数学** | 《新高考数学你真的掌握了吗》 | 第二版 · 清华大学出版社教研团队 | 全章上线 |
| **物理** | 《大学物理学》 | 第七版 · 赵近芳、王登龙 / 北京邮电大学出版社 | 全章上线 · 配套习题 |
| **题库** | **《大邮数学集》真题库** | 173 套名校历年真题（CC BY-NC-SA 4.0） | 2915 题全量结构化 |

---

<a id="quickstart"></a>
## 🚀 快速开始

### 1. 环境准备
- **Node.js**：`>= 20.0.0`
- **包管理器**：`npm`（推荐，与仓库 lockfile 保持一致）
- **Python**（可选）：`>= 3.9`（仅在维护 OCR 抽取流水线时需要）

### 2. 本地运行

```bash
# 克隆仓库
git clone https://github.com/Ariesagittarius/AstroLib.git
cd AstroLib

# 安装依赖
npm install

# 启动本地开发服务
npm run dev
```

启动完成后，打开浏览器访问 `http://localhost:4321` 即可体验。

> [!TIP]
> 你也可以使用后台守护模式运行开发服务器，避免占用终端：
> ```bash
> npx astro dev --background  # 启动后台守护
> npx astro dev status        # 查询运行状态
> npx astro dev stop          # 安全退出
> ```

### 3. 生产构建与本地预览

```bash
# 全量构建（包含习题数据预编译、检索索引构建与静态站点生成）
npm run build

# 预览生产构建产物
npm run preview
```

### 4. 辅助工具与导出命令

```bash
# 一键生成全书离线 EPUB3 电子书
npm run epub

# 检查全站公式的 KaTeX 规范性
npm run check:katex

# 快速验证指定书籍目录下的 MDX 语法
node scripts/scan-mdx.mjs src/content/docs/collections/math/math_analysis
```

---

## ⚙️ 环境变量说明

AstroLib 作为纯静态架构（SSG），**日常浏览、学习与生产打包均无需配置任何环境变量**，即开即用。

如需执行特殊离线数据处理或维护可选的独立微服务，可按需配置：

| 环境变量 | 是否必需 | 说明 |
| :--- | :---: | :--- |
| `AI_PYTHON` | 否 | 执行本地 MCP 工具时的 Python 解释器路径（默认 `python`） |
| `GEMINI_API_KEY` | 否 | 运行离线多模态修复脚本时调用的 Gemini API 密钥 |
| `GITHUB_TOKEN` | 否 | 部署 Serverless 读者勘误代发 Worker 时的鉴权 Token |

---

## 🗂️ 项目结构一览

```text
.
├── astro.config.mjs               # Astro / Starlight 主配置与插件挂载
├── AGENTS.md                      # 工程规范与学术 Commit 约束说明
├── docs/                          # 核心架构设计与详细交接文档全集
├── scripts/                       # 构建管线、题库编译与校验脚本
│   ├── build-exercise-data.mjs    # 题库公式预编译与瘦身脚本
│   ├── build-ai-index.mjs         # 离线检索索引构建脚本
│   ├── generate-epub.mjs          # EPUB3 自动化打包流水线
│   └── lib/math_archive/          # 真题题库解析与清洗算法库
├── src/
│   ├── config/
│   │   ├── collections.config.mjs # 中央书库配置（全站书籍元数据与模块映射单源）
│   │   └── features.config.mjs    # 全站功能注册表（构建装配与零打包开销控制）
│   ├── content/docs/
│   │   ├── dev/                   # 内置开发者手册与设计指南
│   │   └── collections/           # 数字化教材 MDX 章节存储目录
│   ├── components/                # 语义卡片、答题组件与 Starlight 覆盖层
│   │   └── exercises/             # 习题系统交互核心与 LaTeX 导出前端
│   ├── utils/
│   │   └── latex/                 # LaTeX 学术练习册生成引擎
│   └── data/exercises/            # 2900+ 题标准化真题与章节倒排索引
└── public/                        # 静态资源、自托管字体切片与构建缓存
```

---

<a id="copyright"></a>
## ⚖️ 内容与版权声明

本项目严格区分**系统源代码**与**数字化教材/真题数据**的权利归属：

1. **教材正文与原书习题**：
   - 仓库内收录的高校教材章节与插图，版权归原作者及对应出版社（高等教育出版社、清华大学出版社、机械工业出版社、北京邮电大学出版社等）所有。
   - 内容仅供个人学习交流与排版技术研究，不具任何商业属性。若需系统研读，请务必支持正版纸质出版物。
2. **历年真题题库**：
   - 试卷数据库提取自北京邮电大学开源团队维护的《大邮数学集》。
   - 真题数据遵循 **[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans)** 协议。任何衍生使用均需注明出处、保持非商业用途并以相同方式共享。
3. **开源字体**：
   - 思源黑体、思源宋体与 Plus Jakarta Sans 均遵循 [SIL Open Font License 1.1](https://openfontlicense.org/) 协议。

---

## 📜 License

- **系统源代码**：遵循开源理念构建，具体条款以仓库补充的 `LICENSE` 为准。
- **教材与题目数据**：受各自知识产权或 CC 协议约束，**代码许可不适用于任何教材原文与试卷数据**。
