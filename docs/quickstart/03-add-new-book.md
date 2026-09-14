# 添加新书

本文档介绍在 AstroLib 中录入一本新教材的完整规范与步骤。

---

## 1. 目录结构与命名规范

全站教材按“学科合集（Collection）→ 具体图书（Book）→ 章节 MDX 文件”的树状结构组织：

```text
src/content/docs/collections/
└── math/                                 # 学科合集目录（如 math, science）
    └── linear_algebra/                   # 图书 Slug 目录（下划线命名）
        ├── images/                       # 该书专属配图目录
        │   └── fig_1_1.png
        ├── 00_前言与说明.mdx              # 绪论或说明页
        ├── 1.1_线性方程组.mdx             # 章节 MDX 文件
        ├── 1.2_行化简与阶梯形.mdx
        └── a1_附录_部分习题解答.mdx       # 附录篇章
```

### 命名规则
- **普通章节**：`{章}.{节}_{标题}.mdx`，例如 `2.1_导数的概念.mdx`。
- **前言/简介**：以 `00_` 开头，确保排序在全书最前。
- **附录**：以 `a1_`, `a2_` 开头，确保排序在全书正文之后。

---

## 2. MDX 章节文件编写规范

每个 MDX 文件包含 Frontmatter 元数据与正文内容。

### 2.1 头部 Frontmatter 与组件引入
```mdx
---
title: '1.1 线性方程组'
---
import Knowledge from '@/components/Knowledge.astro';
import Example from '@/components/Example.astro';
import Solution from '@/components/Solution.astro';
import SideNote from '@/components/SideNote.astro';
import ExerciseTrigger from '@/components/exercises/ExerciseTrigger.astro';
```

### 2.2 大纲层级与标题规范
- **禁止重复 H1**：Astro 模板已自动将 Frontmatter 中的 `title` 渲染为唯一的页面一级标题（`<h1>`）。**正文开头严禁再次书写 `# 1.1 线性方程组`**，避免大纲重复与视觉突兀。
- **正文二级标题**：概念板块必须从 `##` 开始（如 `## 一、线性方程组的基本概念`）。
- **正文三级标题**：子模块或细分步骤使用 `###`。

### 2.3 语义卡片使用准则
为保障学术严肃性与排版一致性，请按语义选用官方卡片组件，禁止自造嵌套边框：

| 卡片组件 | 适用场景 | 使用示例 |
| :--- | :--- | :--- |
| `<Knowledge>` | 定理、定义、性质、引理、公理 | `<Knowledge title="定理 1.1 线性方程组解的存在性定理">...</Knowledge>` |
| `<Example>` | 例题题面 | `<Example title="例 1.1 求解三元一次线性方程组">...</Example>` |
| `<Solution>` | 例题解答或定理证明（通常置于卡片下方） | `<Solution title="解">...</Solution>` 或 `<Solution title="证明">...</Solution>` |
| `<SideNote>` | 边栏提示、重要说明、反思批注 | `<SideNote title="注意">系数矩阵与增广矩阵的列数差异。</SideNote>` |

> [!NOTE]
> `<SideNote>` 在桌面端将自动向右侧浮动排列（`float: right`），移动端自动下沉折叠，主文证明与推导切勿被边栏文字强行切断。

### 2.4 数学公式排版规范
- **行内公式**：必须且只能使用单个 `$...$`，例如 `$A \mathbf{x} = \mathbf{b}$`。
- **独立块级公式**：必须使用独立的 `$$...$$`，前后各保留一行空行：
  ```markdown
  $$
  \begin{bmatrix}
  a_{11} & a_{12} \\
  a_{21} & a_{22}
  \end{bmatrix}
  \begin{bmatrix}
  x_1 \\
  x_2
  \end{bmatrix}
  =
  \begin{bmatrix}
  b_1 \\
  b_2
  \end{bmatrix}
  \tag{1.1}
  $$
  ```
- **禁止语法**：严禁在正文中使用 LaTeX 原生界定符 `\[ ... \]` 或 `\( ... \)`。

---

## 3. 在中央配置注册图书

新书的章节编写完成后，必须在中央书库配置中进行声明：

**打开文件**：`src/config/collections.config.mjs`

在对应的合集数组中追加条目：

```javascript
{
  id: 'linear-algebra',                       // 唯一英文 ID
  slug: 'linear_algebra',                     // 对应的目录名与路由 slug
  title: '线性代数及其应用',                    // 完整书名
  author: 'David C. Lay',                     // 原作者 / 译者
  publisher: '机械工业出版社',                  // 出版社
  edition: '原书第 5 版',                      // 版次
  category: 'textbook',                       // 分类：textbook（教材）/ supplement（教辅）
  description: '经典大学线性代数教材，注重几何直观与矩阵计算应用。',
  cover: '/covers/linear_algebra.jpg',        // 封面图路径（建议放入 public/covers/）
  entryPoint: '00_前言与说明',                  // 默认进入章节（须对应实际文件名）
  trackClasses: [
    '.example-card',
    '.knowledge-card',
    '.exercise-card',
    '.fallback-block'
  ],
  modules: {
    '例': { emoji: '✍️', short: '例', aliases: ['例', '例题'], theme: 'chip-example' },
    '定理': { emoji: '📐', short: '理', aliases: ['定理'], theme: 'chip-conclusion' },
    '定义': { emoji: '📖', short: '定', aliases: ['定义'], theme: 'chip-knowledge' },
    '性质': { emoji: '🔬', short: '性', aliases: ['性质'], theme: 'chip-knowledge' },
    '推论': { emoji: '➡️', short: '推', aliases: ['推论'], theme: 'chip-conclusion' },
    '习题': { emoji: '📝', short: '习', aliases: ['习题'], theme: 'chip-problem' }
  }
}
```

---

## 4. 校验与验证

添加完成后，运行项目内建的 MDX 语法校验工具进行质量检查：

```bash
node scripts/scan-mdx.mjs src/content/docs/collections/math/linear_algebra
```

当终端输出全绿（0 语法报错、0 缺失闭合、0 KaTeX 错误）后，启动本地开发服务验证侧边栏与正文渲染：

```bash
npm run dev
```
