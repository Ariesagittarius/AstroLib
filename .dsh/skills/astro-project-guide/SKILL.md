---
name: astro-project-guide
description: 在 my-astro-site（Astro + Starlight 数学教辅数字化网站，中文内容）项目中快速定位结构、理解架构并安全修改时使用。适用于：浏览或解释项目结构与路由、添加或编辑 src/content/docs 下的 MDX 章节与卡片组件、修改 collections.config.mjs 的合集/图书/模块配置、排查侧边栏与 slug 404、处理 KaTeX 数学公式、运行或校验 dev 构建、了解 MinerU 转换产物与性能优化约束等一切需要先熟悉此项目上下文的任务。导入新书请使用 import-book 技能。
---

# Astro 项目导航（my-astro-site）

## 项目是什么

- 基于 Astro 7 + @astrojs/starlight 0.41 的文档站，站名“教辅数字化智能智库”。
- 内容来自数学/物理教辅书的数字化（MinerU 转换 + 整理为 MDX）：当前收录《数学分析》《新高考数学你真的掌握了吗》《工科数学分析基础》《大学物理学（第7版）》四本书，共 448 篇 MDX（130 + 90 + 58 + 1 残留 intro + 169 物理）。
- 核心特性均为自研：KaTeX 公式、卡片化内容分块、左侧自然排序侧边栏、右侧动态大纲与跨页联动、SPA 局部刷新、侧栏拖拽折叠、打印导出。
- 部署目标是 Vercel：`git push origin main` 触发自动构建（历史提交：文件名过长会导致解包失败）。

## 目录速览

```
my-astro-site/
├── astro.config.mjs          # Starlight 配置：动态侧边栏、KaTeX(output:html)、组件覆盖、@ 别名
├── src/
│   ├── content.config.ts     # 内容集合定义（docs loader + docsSchema）
│   ├── config/
│   │   ├── collections.config.mjs  # ★ 唯一活跃的中央配置（合集/图书/模块映射）
│   │   └── books.config.mjs        # ⚠️ 遗留副本，无任何引用，不要改它
│   ├── utils/sidebar.mjs     # 侧边栏生成：自然排序 + github-slugger 路由净化
│   ├── routeData.ts          # Starlight 中间件：无 toc 时注入 Overview
│   ├── components/           # 卡片组件 + 左右侧边栏覆盖（见 references）
│   ├── pages/
│   │   ├── index.astro       # 首页：合集/图书卡片入口
│   │   └── print.astro       # PDF 打印导出（⚠️ 当前过滤 book_chapters/，输出为空）
│   └── content/docs/
│       ├── collections/math/math_analysis/      # 数学分析，130 篇
│       ├── collections/math/math_senior/        # 新高考数学，90 篇
│       ├── collections/math/engineering_analysis/ # 工科数学分析基础，58 篇（上下册合并）
│       ├── collections/science/university_physics/ # 大学物理学（第7版），169 篇（上下册合并，课后题按题型拆页）
│       └── guides/, reference/                  # Starlight 示例页，一般可忽略
├── scripts/
│   ├── scan-mdx.mjs          # MDX 语法校验（与构建同款 remark/rehype 插件）
│   ├── import_engineering_analysis.py # 新书导入参考实现（详见 import-book 技能）
│   └── import_university_physics.py    # 《大学物理学》导入（课后题按题型拆页 + Exercise 板块）
├── task/                     # MinerU 原始转换产物（已 gitignore，勿改勿提交）
└── dist/, .astro/            # 生成物，勿手改
```

## 路由与 slug 规则（最重要的知识）

- 内容路径 `src/content/docs/collections/{col.slug}/{book.slug}/{chapter}.mdx` 映射为 URL `/collections/{col.slug}/{book.slug}/{cleaned-slug}/`。
- 文件名经 github-slugger 逐段净化：点号、标点被移除，空格转连字符，大写转小写，下划线保留。例如 `2.5_自然对数的底 e 和 Euler 常数 γ.mdx` → `25_自然对数的底-e-和-euler-常数-γ/`。
- 生成任何指向章节的链接（首页、侧边栏、自定义代码）都必须调用 `cleanSlug()`（src/utils/sidebar.mjs），禁止手写 slug，否则 404。
- 首页入口由图书配置里的 `entryPoint` 指定；它经 `cleanSlug()` 归一化后必须等于该图书目录中某个真实章节的 slug（文件名里可写空格，如 `06_第1章 三角函数`，会归一化为 `06_第1章-三角函数`）。

## 中央配置（改配置前必读）

- `src/config/collections.config.mjs` 是全站唯一数据源：`collections[].books[]`，每本书记录 id/slug/title/description/cover/entryPoint/trackClasses/modules。
- `trackClasses`：本书右侧大纲要抓取的卡片类选择器（如 `.example-card`、`.knowledge-card`、`.fallback-block`）。
- `modules`：把卡片 title 的前缀（例/定理/定义/性质/推论/引理/命题/公理/问题/图等）映射为徽章语义，含 emoji、short、aliases、theme。新增卡片类型时同步更新它；右侧大纲直接读 `modules[key].theme`（chip-example/chip-knowledge/chip-conclusion/chip-default 等）。
- `books.config.mjs` 是旧的重复配置，全项目无引用；不要改它（必要时可删除，删除前先 `rg "books.config"` 确认）。
- science 合集现收录《大学物理学（第7版）》（合集标题“物理”）；曾有的 `???` 占位书已移除。

## 内容编写（MDX）

详细规范见 [references/content-authoring.md](references/content-authoring.md)。核心约定：

- 每篇以 `---` frontmatter 开头，`title` 必须用引号包裹。
- 顶部用 `@/components/...` 导入要用的卡片组件（`@` 别名指向 `/src`）。
- 数学公式用 `$...$` / `$$...$$`（remark-math + rehype-katex 已全局配置）。
- 正文中的“例题 1.74”“图 3-48”等引用会自动变成可点击徽章（同页/跨页联动），不要手写链接；前提是卡片 title 与图注格式规范。
- 图片放该图书 `images/` 子目录，用相对路径引用。

## 性能与架构约束（改动时不要回退）

这些优化已落地，改动相关文件前先理解，避免"修回去"：

1. **左侧栏按当前书过滤**（src/components/SidebarOverride.astro）：服务端只渲染当前所在图书的章节树（首页/非图书页仍渲染全部），单页 HTML 可减 300KB+。删掉过滤会让所有页面回到 ~400KB 的侧边栏。
2. **跨页联动索引按当前书构建**（src/components/PageSidebarOverride.astro）：构建期只扫描当前书的 MDX 卡片 title，且每张卡只存"去空格"key；跨书引用退化为静态徽章。索引以 `data-global-index` 内嵌在右侧 aside。
3. **KaTeX `output: 'html'`**（astro.config.mjs）：去掉了 MathML 重复标记，公式页体积约减半。不要改回默认 `htmlAndMathml`。
4. **客户端公式二次渲染有守卫**：`textContent.includes('$')` 才调用 auto-render。
5. 跨页索引是"类型+编号"扁平映射：同书内重号（如多章都有"定理 2.1"）会指向最后扫描的文件——既有设计，不是 bug。

## 常用命令

- 开发服务器（AGENTS.md 要求后台模式）：`astro dev --background`；用 `astro dev status`、`astro dev logs`、`astro dev stop` 管理。
- 构建/预览：`npm run build`、`npm run preview`。
- 校验 MDX 语法：`node scripts/scan-mdx.mjs`（默认扫 math_analysis；可传目标目录，支持 `--detail=文件名`、`--lines`）。
- 部署：commit 后 `git push origin main` 触发 Vercel。
- 改动涉及路由/侧边栏后，重启 dev server 或构建，抽查生成的链接。

## 已知问题与陷阱

1. **Summary 组件是坏的**：`src/components/Summary.astro` 从初始提交起就是旧版右侧栏组件（没有 `<slot />`）。math_senior 中 17 处 `<Summary title="结论总结 ...">` 的内容实际不会渲染；`summary-card` 类也没有对应组件。新内容不要用 `<Summary>`。
2. **slug 必须走 cleanSlug()**：文件名带点号/大写/中文标点时，手写链接几乎必 404。
3. **books.config.mjs 是死配置**：改动只应在 collections.config.mjs。
4. **print.astro 当前为空**：它按 `doc.id.startsWith('book_chapters/')` 过滤，现有内容没有该前缀；若要恢复打印页需同步改造。
5. **task/ 勿改勿提交**：已加入 .gitignore（还有 .codex/），`git add -A` 不会带上。
6. **文件名别过长**：过长 MDX 文件名会导致 Vercel 解包失败（历史提交 130dd15）。
7. **Python 不在 PATH**：`python` 是 WindowsApps 占位符，脚本请用 `D:\python\python.exe` 运行（如 scripts/import_engineering_analysis.py）。
8. **存在内容残留**：`math_analysis/00_intro.mdx` 的 title 是“新高考数学”（疑似迁移残留）；math_analysis 有重复的 `8.1_*` 两篇。编辑时留意。
9. **新书导入**：走 `import-book` 技能（task/ 勘察 → 脚本转换 → 注册 → scan/build → push）。
10. 校验 MDX 优先用 `scripts/scan-mdx.mjs`（与构建同一套插件），比 `astro build` 快且能定位行列。
11. **卡片组件**：除 Example/Knowledge/Note/Solution/Block 外，还有 `Exercise.astro`（课后题板块，`习题 X.Y.Z` 标题，`.exercise-card`/`chip-problem`）。
12. **science 合集**：现收录《大学物理学（第7版）》，合集标题为“物理”；曾有的 `???` 占位书已移除。

## 参考

- [references/content-authoring.md](references/content-authoring.md)：卡片组件速查、MDX 模板、联动规则、新增图书检查清单。
