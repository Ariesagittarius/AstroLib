# 添加新书（ABP 标准内容包导入）

本文档介绍在 AstroLib 中录入一本新教材的完整规范与步骤。根据 **Rule 8.1 框架与内容彻底解耦** 原则，所有图书源内容独立维护于 `content-sources/` 目录，并通过官方编译器打包为 ABP 内容包分发。

---

## 1. 目录结构与命名规范

全站教材按“学科合集（Collection）→ 具体图书（Book）→ 章节 MDX 文件”的树状结构组织于 `content-sources/`：

```text
content-sources/collections/
└── math/                                 # 学科合集目录（如 math, cs, science）
    └── linear_algebra/                   # 图书 Slug 目录（下划线命名）
        ├── images/                       # 该书专属配图目录
        │   └── fig_1_1.png
        ├── 00_前言与说明.mdx              # 绪论或说明页
        ├── 1.1_线性方程组.mdx             # 章节 MDX 文件
        ├── 1.2_行化简与阶梯形.mdx
        └── a1_附录_部分习题解答.mdx       # 附录篇章
```

> [!IMPORTANT]
> **绝对禁止放入 `src/content/docs/collections/`**！底座工程与书籍数据彻底解耦，严禁将大批量教材 MDX 重新放入 `src/content/docs/collections/` 迫使 Astro 静态构建树膨胀。

### 命名规则
- **普通章节**：`{章}.{节}_{标题}.mdx`，例如 `2.1_导数的概念.mdx`。
- **前言/简介**：以 `00_` 开头，确保排序在全书最前。
- **习题与注解**：每章独立设立 `{章}.{末节+1}_第X章习题.mdx` 与 `{章}.{末节+2}_第X章注解.mdx`。
- **附录与索引**：以 `a1_`, `a2_` 开头，确保排序在全书正文之后。

---

## 2. MDX 章节文件编写与排版规范

每个 MDX 文件包含 Frontmatter 元数据与正文内容。

### 2.1 头部 Frontmatter 与组件引入
```mdx
---
title: '1.1 线性方程组'
---
import Knowledge from '@/components/Knowledge.astro';
import Example from '@/components/Example.astro';
import Solution from '@/components/Solution.astro';
import Exercise from '@/components/Exercise.astro';
import SideNote from '@/components/SideNote.astro';
```

### 2.2 大纲层级与边界规范
- **禁止重复 H1**：Astro 模板已自动将 Frontmatter 中的 `title` 渲染为唯一的页面一级标题（`<h1>`）。**正文开头严禁再次书写 `# 1.1 线性方程组`**。
- **小节末尾严禁残留异节标题**：上一小节末尾绝不可遗留下一小节的大标题（例如 `1.5_树和森林.mdx` 末尾不得出现 `## 1.6 二部图`）。切分时必须在下一小节标题前精准截断。
- **正文二级/三级标题**：概念板块从 `##` 开始，细分子模块使用 `###`。

### 2.3 语义卡片使用准则
为保障学术严肃性与排版一致性，请按语义选用官方卡片组件，禁止自造嵌套边框：

| 卡片组件 | 适用场景 | 使用示例 |
| :--- | :--- | :--- |
| `<Knowledge>` | 定理、定义、性质、引理、公理的正规陈述 | `<Knowledge title="定理 1.1 线性方程组解的存在性定理">...</Knowledge>` |
| `<Example>` | 例题题面 | `<Example title="例 1.1 求解三元一次线性方程组">...</Example>` |
| `<Solution>` | 例题解答、定理证明或习题提示 | `<Solution title="解">...</Solution>` 或 `<Solution title="提示">...</Solution>` |
| `<Exercise>` | 各章课后练习与习题独立离散化 | `<Exercise title="练习 1⁺">题干内容...<Solution title="提示">提示内容...</Solution></Exercise>` |
| `<SideNote>` | 边栏提示、重要说明、反思批注 | `<SideNote title="注意">系数矩阵与增广矩阵的列数差异。</SideNote>` |

> [!WARNING]
> **定理引用与提及防误卡化机制**：
> 凡是“提及、引用、讨论、历史渊源”等上下文（如含有“定理 1.5.1 的常用推论是...”、“定理 3.2.3 通常归功于...”），**严禁封装为 `<Knowledge>` 卡片**，必须保持为行内纯文本。
> 所有“第X章注解/研讨”章节纯粹用于文献回顾，**全章严禁包装 `<Knowledge>` 定理卡片**。

### 2.4 插图与图注语义绑定规范
插图统一使用语义化 `<figure>` 结构，确保图注居中且不被脱节剥离。
> [!IMPORTANT]
> **图片相对路径语法铁律**：严禁在 MDX 中使用 HTML 原生 `<img src="...">` 引用本地相对图片（Astro 打包管线无法识别相对路径会导致生产/开发环境 404 破图）。**必须在 `<figure class="vp-figure">` 内部统一使用 Markdown 图片语法 `![alt](images/...)` 紧跟 `<figcaption>`**：

```html
<figure class="vp-figure">
  ![图 1.1 线性方程组的几何直观](images/fig_1_1.png)
  <figcaption>图 1.1 线性方程组的几何直观</figcaption>
</figure>
```

### 2.5 数学公式排版规范
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

新书章节编写完成后，必须在中央书库配置中进行声明：

**打开文件**：`src/config/collections.config.ts`

在 `sourceCollections` 数组中对应学科追加条目：

```typescript
{
  id: 'math-linear_algebra',                  // 唯一英文 ID（前缀带学科合集名）
  slug: 'linear_algebra',                     // 对应的目录名与路由 slug
  title: '线性代数及其应用',                    // 完整书名
  author: 'David C. Lay',                     // 原作者 / 译者
  publisher: '机械工业出版社',                  // 出版社
  edition: '原书第 5 版',                      // 版次
  category: 'textbook',                       // 分类：textbook（教材）/ supplement（教辅）
  description: '经典大学线性代数教材，注重几何直观与矩阵计算应用。',
  cover: '/covers/linear_algebra.jpg',        // 封面图路径（放入 public/covers/）
  entryPoint: '00_前言与说明',                  // 默认进入章节（须对应实际文件名经 cleanSlug）
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
    '习题': { emoji: '📝', short: '习', aliases: ['习题', '练习'], theme: 'chip-problem' }
  }
}
```

---

## 4. 全真质量门禁与 ABP 打包发布

### 4.1 MDX 语法质量门禁
运行项目内建的 MDX 语法校验工具进行质量检查：

```bash
node scripts/scan-mdx.mjs content-sources/collections/math/linear_algebra
```

必须达到 **100% 通过（0 语法报错、0 缺失闭合、0 KaTeX 错误、0 缺失图片）**。

### 4.2 编译打包为标准 ABP 内容包
运行官方 ABP 打包编译器：

```bash
node scripts/pack-book-abp.mjs content-sources/collections/math/linear_algebra
```

- 自动产出 `public/abp-packs/math-linear_algebra.abp` 与静态解压目录；
- 自动镜像至 `dist/abp-packs/`；
- 自动更新全局编目索引 `catalog.json`。

### 4.3 自动化测试与类型验证
```bash
npm run check:types
npx vitest run tests/unit/content-provider.test.ts tests/acceptance/abp-dynamic-serving.test.ts
```

### 4.4 多智能体校对与子代理分派防漫游纪律
当需要指派子代理进行全书或剩余章节的协同校对时，必须遵守以下防漫游纪律：
- **严禁赋予命令执行权限**：禁止开放 `run_command`，杜绝子代理在后台自行运行 KaTeX 渲染探针、全库搜索或无谓测试脚本消耗额度；
- **最小动词原则**：子代理只允许通过 `read_file` 查阅原书 Ground Truth 页面切片并在目标篇章内执行 `write_file` 覆盖输出；
- **小颗粒度定额**：单次任务分配上限 ≤ 10 物理页，严防上下文过载引发 65k 截断与额度迅速耗尽。
