---
name: import-book
description: 把 task/ 目录里的 MinerU 转换产物（每本教材一个 "<书名>.pdf-<hash>/" 目录，内含 full.md）导入 my-astro-site 为 MDX 章节的完整流程。适用于：新书入库、重新生成或修复既有导入、调整拆分粒度、更新卡片映射、注册图书配置。包含批量转换脚本适配、MDX 校验、构建与 Vercel 部署检查清单。
---

# 导入新书（MinerU → MDX）

## 总览

- 输入：`task/<书名>.pdf-<hash>/full.md`（MinerU markdown；一本教材常按"上册/下册 × 前半/后半"拆成 4 个目录，跨 PDF 章节需拼接）
- 输出：`src/content/docs/collections/{col.slug}/{book.slug}/*.mdx` + `images/`，并在 `src/config/collections.config.mjs` 注册
- 参考实现：仓库内 `scripts/import_engineering_analysis.py`（《工科数学分析基础》）与
  `scripts/import_university_physics.py`（《大学物理学》，含课后题按题型拆页），新书复制后改常量

## 流程

1. **勘察**：列出 `task/` 目录；对每个 `full.md` 抽取标题行（`^#{1,6}\s`）与文件首尾，确定：章节层级（第X章/第X节/小节编号）、PDF 拼接边界、书末"部分习题答案与提示"起止、附录区域。
2. **设计拆分**（与书本层级一致）：
   - 每"节"一篇 MDX（`{章}.{节}_标题.mdx`），节尾的 `习题x.y` 作为该篇末尾 `<Block>`；
   - 课后题不整章混排：每章按题型拆成独立页面
     `{章}.{末节+1}_第X章习题-选择题.mdx`、`{章}.{末节+2}_第X章习题-填空题.mdx`、
     `{章}.{末节+3}_第X章习题-解答题.mdx`，每题一个 `<Exercise title="习题 X.Y.Z">` 板块；
     参考答案单独一页 `{章}.{末节+4}_第X章习题参考答案.mdx`（有答案内容才生成）；
   - 书前 `00_内容简介.mdx`（内容提要 + 结构说明）、`01_绪论.mdx`；
   - 附录用 `a1_...` 前缀排在章节之后。
3. **编写/适配转换脚本**：复制 `scripts/import_engineering_analysis.py`，修改源目录、输出目录、封面、模块配置。详见 [references/converter-guide.md](references/converter-guide.md)。
4. **生成与注册**：运行脚本；在 `collections.config.mjs` 对应 collection 下加 book 条目（字段见下）。
5. **校验**：`node scripts/scan-mdx.mjs <book目录>` 必须全过；修 MDX 语法错误（多为正文裸 `<`/`{` 被当 JSX，由脚本的转义器处理）。
6. **构建**：`npm run build`；抽查首页卡片链接、章节页、侧边栏、图片引用。
7. **部署**：`git add -A`（`task/`、`.codex/` 已在 .gitignore，不入库）→ commit → `git push origin main` 触发 Vercel 自动构建。

## 卡片映射（重复内容 → 板块）

| 原文模式 | 板块 | 说明 |
| --- | --- | --- |
| 例 / 例题 + 编号（标题或段首） | `<Example title="例 1.9">` | title 只放"类型 编号"，题干放内容，跨页联动才能命中 |
| 定理 / 定义 / 性质 / 推论 / 引理 / 命题 / 公理 + 编号 | `<Knowledge title="定理 3.6">` | 编号后跟的括注（如"（单调有界准则）"）放首行内容 |
| 证 / 证明 / 解 段首 | `<Solution title="证明\|解">` | 卡片内嵌；独立出现时也作独立 Solution，注意先关闭 Note |
| 想一想 / 注意 / 注 | `<Note>` | 与正文混排的边注也适用 |
| 习题x.y / 第X章习题 / 综合练习题 | `<Block title="...">` | 块内不再识别卡片；`(A)/(B)` 归一为 `**（A）**` |
| 课后题 X.Y.Z（选择题/填空题/解答题） | `<Exercise title="习题 X.Y.Z">` | 每题一个板块；题号丢失时按图号引用 `题X.Y.Z图` 或顺序回填恢复 |
| 答案区同名标题 | `<Block title="习题1.1 答案">` | 加" 答案"后缀避免与题干锚点冲突 |

正文其余小节标题保留为 `##` 标题；公式保持 `$...$` / `$$...$$` 原样。

## 注册配置（collections.config.mjs）

```js
{
  id: 'xxx', slug: 'xxx', title: '书名（版次）',
  description: '作者、出版社、册数结构',
  cover: '/covers/xxx.jpg',          // 拷贝书封面到 public/covers/
  entryPoint: '00_内容简介',          // cleanSlug 后必须等于真实章节 slug
  trackClasses: ['.example-card', '.knowledge-card', '.exercise-card', '.fallback-block'],
  modules: { /* 例/定理/定义/性质/推论/引理/命题/公理 + 图 */ }
}
```

`modules` 必须覆盖脚本生成的所有卡片前缀：key 为类型名，含 `emoji`、`short`、`aliases`、`theme`（`chip-example/chip-knowledge/chip-conclusion/chip-problem/chip-default` 等，右侧大纲直接读 `theme`）。`图` 模块保留 `isImage` 与 `targetPattern`。

新增卡片组件（如 `Exercise.astro`）时，除了建组件 + 注册 config，还必须把组件名加进
`src/components/PageSidebarOverride.astro` 的 `tagRegex`（构建期跨页索引扫描的标签白名单），
否则正文里的"习题 X.Y.Z"引用无法跨页联动。

## 关键坑位（务必逐条核对）

1. **PDF 拼接处 `$$`**：前一个 PDF 以完整 `$$` 块结尾、后一个以 `$$` 开头时，不要"折叠相邻 `$$` 行"——折叠会破坏配对，导致后续所有数学块状态翻转、MDX 把 `{...}` 当 JSX 报 acorn 错。直接拼接即可。
2. **章习题编号用阿拉伯数字**：正文是 `## 第1章习题`（不是"第一章"），正则需同时匹配中文与阿拉伯数字（`第[\d一二三四五六七八九十]+章习题`）。
3. **答案区切分**：书末答案区以裸 `## 第X章`（无标题）开头，需在最后一个 `## 附录` 标题之后定位并切出；答案区内部分章可能没有裸章标题（如下册第6章），需按 `习题X.Y`/`第X章习题` 的编号分组。
4. **MDX 转义**：正文裸 `<` `{` `}` 会被当 JSX。用"数学感知"转义器逐行处理：`$$` 单独成行与 `$...$` 内不转义，纯文本中 `<`→`&lt;`、`{`/`}`→`\{`/`\}`。
5. **Python 不在 PATH**：`python` 指向 WindowsApps 占位符，用 `D:\python\python.exe`。
6. **文件名别过长**：过长 MDX 文件名会导致 Vercel 解包失败（历史提交 130dd15）；图片用源 hash 名即可。
7. **重号冲突**：跨页联动索引按"类型+编号"扁平映射，同书内重号（如多个章节都有"定理 2.1"）会指向最后扫描的文件；这是站点既有设计，不要试图在脚本里"修复"。
8. **章标记可能是阿拉伯数字**：正文 `## 第2章` 里的"2"不一定是中文数字，章切分正则需同时支持 `[\d一二三四五六七八九十]+`。
9. **HTML 表格**：源里偶有 `<table>...</table>` 整行，转义器要原样放行；表格里的裸 `~`（如 `590~640`）会被 MDX 当成删除线分隔符跨单元格配对，需替换为全角 `～`。
10. **课后题丢号恢复**：MinerU 常丢题目编号，恢复顺序为：编号行 → 段落内 `题X.Y.Z图` 引用 → 求解/疑问标记（试求/求/？/多少…）按顺序回填。短小续文（"请问…""那么…""若…则"、`( )` 选项行）要判为延续，避免碎片卡片与重号。

## 校验清单（交付前逐项确认）

- `node scripts/scan-mdx.mjs src/content/docs/collections/math/<book>` 全部通过
- `npm run build` 成功；页面数较上次增加
- 首页出现新书卡片，entryPoint 链接可访问（`/collections/{col}/{book}/{entryPoint}/`）
- 章节页左侧栏只含当前书章节；`data-global-index` 可 `JSON.parse` 且只含当前书 URL
- MDX 中 `![](...)` 引用的图片全部存在于 book `images/`
- `git status` 不包含 `task/`、`.codex/`、`dist/`
