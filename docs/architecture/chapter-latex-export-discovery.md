# AstroLib 章节 LaTeX 与 PDF 导出架构考古与发现报告 (Chapter LaTeX Export Discovery)

> **文档版本**: 1.0.0  
> **编写日期**: 2026-09-07  
> **定位**: 为 AstroLib 增加“导出本章为 LaTeX + PDF”功能的架构摸底与边界规范报告。严格遵守《第一原则：先考古，不要立即修改代码》。

---

## 1. 考古总览与核心事实

经代码库全面检索与分析，关键基础设施现状如下：

| 关键模块 | 真实路径 | 现状与职责 | 复用策略 |
| :--- | :--- | :--- | :--- |
| **LaTeX 生成引擎** | `src/publishing/latex/latex-generator.ts` | 现有 `generateLatexDocument` 基于 `homework.cls`，专用于试卷/练习册生成；包含成熟的公式清洗、Unicode 映射、下划线保护与文本 LaTeX 转义能力。 | **完全复用其公式与文本转换内核**，扩展出 Chapter 级别生成能力（`generateChapterLatex`），严禁新建副本。 |
| **LaTeX 云端编译与调度** | `src/utils/latex/latex-cloud-compiler.ts` | 基于 GitHub Actions `workflow_dispatch`（支持 Gzip 压缩与 Git Blob 100MB 大文件传输）、轮询 Release 资产获取 PDF 直链、打印与下载。 | **完全复用该编译调度系统**，无需开发第二套云编译链。 |
| **GitHub Actions 工作流** | `.github/workflows/compile-latex.yml` | 使用 `xu-cheng/latex-action@v4` (TeX Live 2024 / XeLaTeX / latexmk)。 | **完全复用**，仅需确保工作流工作区可读取模板样式文件与正文引用图片。 |
| **本地 TeX Live 环境** | 本地环境探测结果：`D:\texlive\2026\bin\windows\xelatex.exe` 与 `latexmk.exe` | 本地已具备完整的 TeX Live 2026 发行版环境，支持本地直调 XeLaTeX 进行极速测试与回归验证。 | 用于离线测试脚本（`scripts/test-chapter-latex.mjs`）的真实验收，不依赖网络。 |
| **Typst 生成引擎** | `src/publishing/typst/typst-generator.ts` | 源码标注 `@deprecated` / `@archived [2026-09]`，仅包含历史试卷题库生成逻辑，无通用教材 AST 管道。 | 保持封存归档，不作为本次 LaTeX 导出的中间依赖。 |
| **MDX AST 解析管线** | `scripts/epub/mdx-pipeline.mjs` & `src/features/mdx-editor/core/parse.mjs` | 项目已深度使用 `unified` + `remark-parse` + `remark-mdx` + `remark-math` 提取 MDX 语法树与自定义卡片组件。 | **直接复用 remark AST 解析机制**，严禁使用正则做整篇文档替换。 |
| **中央模块语义源** | `src/config/collections.config.mjs` & `src/plugins/rehype/rehype-cross-ref.mjs` | 定义了 `modules` 映射（例题、定理、定义、性质、推论、引理、命题、公理、习题、图等）与前缀解析规则（`parseTitleFromConfig`）。 | **以此为单一真实源**，驱动 LaTeX 学术定理环境映射。 |

---

## 2. 当前 Pipeline 详细分析

### A. 当前 LaTeX Pipeline (现有题库导出流程)

```text
src/data/exercises/*.json (题库数据)
       │
       ▼
SlimQuestionItem[] (标准化题目模型)
       │
       ▼
latex-generator.ts (formatLatexContent + 宏包组装)
       │
       ▼
main.tex (基于 homework.cls)
       │
       ├───────────────────────────────────────────────┐
       ▼                                               ▼
[本地脚本] scripts/test-latex-export.mjs      [Web端] latex-cloud-compiler.ts
       │                                               │
       ▼ (语法平衡校验)                                 ▼ (GitHub Actions dispatch)
.tmp/test-output/test_*.tex                   .github/workflows/compile-latex.yml
                                                       │ (XeLaTeX + TeX Live 2024)
                                                       ▼
                                              GitHub Release PDF Asset
                                                       │
                                                       ▼
                                              浏览器直链下载 / Iframe 打印
```

**目标演进**（本任务增加 Chapter 支线，共享编译后端）：

```text
MDX Chapter Source (src/content/docs/collections/<col>/<book>/<chapter>.mdx)
       │
       ▼
MDX AST (remark-parse + remark-mdx + remark-math)
       │
       ▼
Chapter Semantic Extraction (Scope: Title, Headings, Sections, Knowledge, Example, Solution, Figures...)
       │
       ▼
latex-generator.ts (新增 generateChapterLatexDocument / 扩展现有导出能力)
       │
       ▼
chapter.tex + astrolib.sty + assets/ (独立纯正 ctexbook 学术教材排版)
       │
       ├───────────────────────────────────────────────┐
       ▼                                               ▼
[本地离线测试] xelatex / latexmk               [浏览器客户端] latex-cloud-compiler.ts
       │                                               │
       ▼                                               ▼
chapter.pdf (本地验证)                         .github/workflows/compile-latex.yml
                                                       │
                                                       ▼
                                              chapter.pdf (云端直出下载)
```

### B. 当前 Typst Pipeline 现状

`src/publishing/typst/typst-generator.ts` 已经明确废弃封存：
* 该文件仅为旧版题目 JSON 提供排版，并未形成中间通用语义表示（IR）；
* 按照项目《双规约定与十条架构公理》，**LaTeX 与 Typst 应当是 Publishing 层的两个平行兄弟输出，绝不允许出现 `Typst → LaTeX` 或 `HTML → LaTeX` 的扭曲依赖**；
* 因此，本任务的章节 LaTeX 导出不依赖 Typst 管道，而是直接从 MDX AST 抽取学术语义并输出标准 LaTeX。

---

## 3. 当前 MDX 实际学术语义模块全量盘点

根据 `src/config/collections.config.mjs`、`src/features/mdx-editor/core/locate-block.mjs` 及各教材 MDX 源码实测，全站实际存在的组件与节点如下：

### 3.1 结构化卡片组件 (`CARD_KINDS`)

| 组件名 | 常见 Title 格式 | 真实学术语义 | 对应 LaTeX 环境 | 编号策略 |
| :--- | :--- | :--- | :--- | :--- |
| `<Knowledge>` | `定义 1.1 实数集的有界性` | 数学定义 (Definition) | `\begin{definition}[实数集的有界性]` | 由 LaTeX 计数器按章/节自动编号 |
| `<Knowledge>` | `定理 1.1 确界存在定理` | 核心定理 (Theorem) | `\begin{theorem}[确界存在定理]` | 自动编号 |
| `<Knowledge>` | `引理 2.3` | 引理 (Lemma) | `\begin{lemma}` | 自动编号 |
| `<Knowledge>` | `推论 3.1` | 推论 (Corollary) | `\begin{corollary}` | 自动编号 |
| `<Knowledge>` | `命题 1.2` | 命题 (Proposition) | `\begin{proposition}` | 自动编号 |
| `<Knowledge>` | `公理 1` | 公理 (Axiom) | `\begin{axiom}` | 自动编号 |
| `<Knowledge>` | `性质 1.4` | 性质 (Property) | `\begin{property}` | 自动编号 |
| `<Knowledge>` | `准则 I` | 极限/收敛准则 (Criterion) | `\begin{criterion}` | 自动编号 |
| `<Example>` | `例 1.1`, `例题 2.3` | 典型例题 (Example) | `\begin{example}[例题名]` | 自动编号 |
| `<Variant>` | `变式 1.1` | 变式训练 (Variant) | `\begin{variant}` | 自动编号 |
| `<Solution>` | `证明`, `证` | 数学严谨证明 (Proof) | `\begin{proof} ... \end{proof}` (含 QED $\square$) | 标准 amsthm 语义 |
| `<Solution>` | `解`, `解析`, `查看解析与步骤` | 例题解答/解析 (Solution) | `\begin{solution} ... \end{solution}` | 独立解题环境 |
| `<Note>` | `想一想`, `注记`, `注意` | 学术注记与思考 (Remark/Note) | `\begin{remark}` 或 `\begin{note}` | 灰阶学术线框/留白 |
| `<Analysis>` | `思路分析` | 解题思路 (Analysis) | `\begin{analysis}` | 紧随例题之分析 |
| `<Method>` | `方法总结`, `方法` | 解题方法与学术技巧 | `\begin{method}` | 学术方法块 |
| `<Block>` | `法则 1`, `法则 2 对偶原理` | 数学法则与公理系统 | `\begin{academicblock}[法则名]` | 定理族环境 |
| `<Guide>` | `章节导读` | 本章/本节导读与知识结构 | `\begin{guide}` | 节前导读块 |
| `<Summary>` | `总结`, `结论总结` | 章节总结与方法回顾 | `\begin{summary}` | 总结环境 |
| `<Exercise>` | `习题 1.1` | 课后习题 (Exercise) | `\begin{exercise}` | 独立习题环境 |
| `<QRCodeVideo>` / `<DigitalResource>` | 配套微课/数字资源 | 数字化扩展资源 | `\footnote{数字资源：...}` | 脚注式学术弱化处理 |

### 3.2 标准 Markdown/MDX 正文节点

| AST 节点类型 | 内容特征 | 对应 LaTeX 转换标准 |
| :--- | :--- | :--- |
| `heading` (depth: 1) | `# 1.1 集合、映射与函数` | `\chapter{1.1 集合、映射与函数}` |
| `heading` (depth: 2) | `## 1.1 集合及其运算` | `\section{集合及其运算}` |
| `heading` (depth: 3) | `### 1. 乘积集合` | `\subsection{乘积集合}` |
| `paragraph` | 普通文字段落 | 标准 LaTeX 空行段落，中文自然首行缩进 2 字符 |
| `math` | 独立块级公式 `$$...$$` | `\[ ... \]` 或 `equation*` / `align*` |
| `inlineMath` | 行内数学公式 `$...$` | `$ ... $` 或 `\( ... \)` |
| `list` (ordered) | `(1)`, `1.`, `①` | `\begin{enumerate} \item ... \end{enumerate}` |
| `list` (unordered) | `- `, `* ` | `\begin{itemize} \item ... \end{itemize}` |
| `table` / HTML `<table>` | 矩阵、公式对照表、真值表 | `\begin{tabular}` + `booktabs` (`\toprule`, `\midrule`, `\bottomrule`) |
| `image` / `<figure>` | `![](images/xxx)` + `<figcaption>` | `\begin{figure}[htbp]\centering\includegraphics{...}\caption{...}\end{figure}` |
| 引用徽章 | `例 1.1`、`定理 1.1`、`图 1.1` | 对应生成 `\label{...}` 与 `\ref{...}` / `\cref{...}` |

---

## 4. 当前 Publishing 架构边界与职责划分

根据《AstroLib 目标架构规范 (Target Architecture)》：

```text
src/
├── publishing/                  # [独立无头多格式出版系统]
│   └── latex/
│       ├── latex-generator.ts   # [Generator] 负责“内容是什么”：AST 遍历、语义模块输出、公式保护
│       └── templates/
│           └── astrolib-chapter.sty # [Template] 负责“内容长什么样”：ctexbook、tcolorbox、字体、页边距
├── services/                    # [外部基础设施服务]
│   └── latex-compiler.ts        # 封装云编译与本地执行接口
└── components/                  # [纯展示型 UI]
    └── PageSidebarOverride.astro# 仅挂载“导出本章”轻量触发按钮，绝不侵入生成逻辑
```

* **严格禁止**：
  * Generator 内部绝不硬编码大量视觉参数（如 `colback=gray!5, arc=3mm` 等），视觉风格统一封装在 `astrolib-chapter.sty`；
  * `src/publishing/` 严禁引入任何 DOM 操作或浏览器环境（`window`, `document`）；
  * 不修改任何 MDX 源文件或题库数据。

---

## 5. 考古结论与下一步实施建议

1. **零重复造轮子**：
   * 现有 `latex-generator.ts` 中的 10 余个公式清洗与 Unicode 处理函数健壮且经过 4000+ 题库验证，必须作为公共工具完整复用；
   * 现有 GitHub Actions 云端 XeLaTeX 编译链完整可用，只需补充章节所需的 `.sty` 模板包即可直接出 PDF。
2. **极简学术视觉**：
   * 采用 `ctexbook` 文档类，页边距按经典大学教材标准设置（版心紧凑、双面印刷留白舒适）；
   * 彻底摒弃 SaaS 圆角与大面积彩底，定理与例题采用精致黑白/双灰阶微细线框（0.5pt 边框，无阴影，无圆角）；
   * 答案与证明严格区分：证明结尾附纯正 Halmos 符号（$\square$ / QED）。
