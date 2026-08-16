# 内容编写速查（MDX）

## 卡片组件速查

| 组件 | 文件 | props | 渲染类 | 进右侧大纲 |
| --- | --- | --- | --- | --- |
| Guide | Guide.astro | 无 | .guide-block | 是（toc-chunk） |
| Knowledge | Knowledge.astro | title | .knowledge-card | 是 |
| Example | Example.astro | title | .example-card | 是 |
| Variant | Variant.astro | title | .variant-card | 是 |
| Method | Method.astro | title | .method-card | 是 |
| Block | Block.astro | title | .fallback-block | 是 |
| Summary | Summary.astro | title | ⚠️ 旧版右侧栏组件，无 slot | 否（坏） |
| Solution | Solution.astro | title（默认“查看解析与步骤”） | .solution-details（details/summary） | 否 |
| Analysis | Analysis.astro | 无 | .analysis-block | 否 |
| Note | Note.astro | 无 | .note-block | 否 |

说明：

- 带 toc-chunk 的卡片会把 `data-title` 交给右侧大纲解析成“徽章 + 编号”，并被 `collections.config.mjs` 里本书的 trackClasses 抓取。
- title 建议遵循“前缀 + 空格 + 编号”格式，如 `例题 1.74`、`结论总结 4.2`；编号支持 `$10.2.2$` 这种 LaTeX 片段。
- Solution 常嵌在 Example 等卡片内部作为可折叠解析。

## MDX 模板

```mdx
---
title: '4.3.5 圆幂定理'
---

import Guide from '@/components/Guide.astro';
import Knowledge from '@/components/Knowledge.astro';
import Example from '@/components/Example.astro';
import Analysis from '@/components/Analysis.astro';
import Solution from '@/components/Solution.astro';
import Variant from '@/components/Variant.astro';
import Note from '@/components/Note.astro';
import Block from '@/components/Block.astro';
import Method from '@/components/Method.astro';

<Guide>
  章节导读文字，可含 $公式$。
</Guide>

<Knowledge title="知识点 4.2">
  ...
</Knowledge>

<Example title="例 4.46">
  题干，可含 $...$ 公式与 `![](images/xxx.jpg)` 图片。

  A. $\frac{8}{3}$ B. 3 C. $\frac{10}{3}$ D. $\frac{5}{2}$

  <Solution>解析与步骤</Solution>
</Example>

<Method title="方法总结 4.1">...</Method>

<Note>标注说明</Note>
```

## title 解析与联动规则

- 右侧大纲的 `parseTitleFromConfig` 会从卡片 title 中拆出“类型 + 编号”，例如 `例题 1.74` → 徽章“例” + 编号“1.74”；类型由 books 配置的 modules.aliases 决定。
- 正文里出现的“前缀 + 数字”（如“例 10.2.3”）会被客户端自动替换为徽章：同页跳转到对应卡片锚点；跨页则跳转到构建期生成的全局索引（PageSidebarOverride 扫描所有 MDX 的 title 属性）。所以正文引用无需手写链接，但卡片 title 必须可被解析。
- 图片联动：图注必须是独立文本行且格式为 `图 3-48`（数字-数字，可带空格），放在图片后；正文引用“图 3-48”时自动高亮/跳转。
- 选择题：card-body 中出现 A. B. C. D. 形式的选项文本时，客户端会自动重排成响应式选项卡片（长选项自动单列）。

## 数学公式

- `$...$` 行内、`$$...$$` 独立行；KaTeX 渲染。侧边栏、大纲、卡片标题都会二次渲染公式。
- 超长公式会横向滚动（`.katex-display` 有 overflow-x），不需要手动截断。

## 新增一本书的检查清单

1. 建目录 `src/content/docs/collections/{col.slug}/{book.slug}/`（图片放其 `images/`）。
2. 在 `src/config/collections.config.mjs` 对应 collection 下加 book 条目：id/slug/title/description/cover/entryPoint/trackClasses/modules。
3. 编写章节 MDX：frontmatter title 加引号、顶部 import 组件、正文用卡片分块。
4. 确认 `entryPoint` 指向真实章节（首页链接会经 cleanSlug 生成）。
5. 运行 `node scripts/scan-mdx.mjs <book目录>` 校验语法，`npm run build` 后抽查首页与侧边栏链接。
