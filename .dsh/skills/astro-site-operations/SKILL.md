---
name: astro-site-operations
description: Use when working on this AstroLib 数学资料站（my-astro-site）——提交/推送改动到 GitHub、增删改图书内容或组件、运行构建与 EPUB 导出。包含仓库结构、提交规范、DSH 沙箱下 git push 的已知坑，以及省 token 省时间的操作方式。
---

# AstroLib 数学资料站操作指南

本仓库是一个基于 Astro + Starlight 的数学资料站（书库），内容为 OCR 导入的教材正文与课后题，按"题题型"分页。本文是模型在本仓库工作的操作手册：怎么提交推送、怎么改内容、有哪些已知的坑和成本陷阱。

## 仓库概况

- 远端：`git@github.com:Ariesagittarius/AstroLib.git`（SSH），分支 `main`，git 身份已配置，无需额外设置。
- 技术栈：Astro 7 + Starlight + KaTeX（remark-math / rehype-katex）。
- 关键路径：

| 路径 | 作用 |
|---|---|
| `src/config/collections.config.mjs` | **中央书库配置**：集合（math/science）、每本书的 slug/标题/封面/题型模块映射。加书先改这里。 |
| `src/content/docs/collections/<collection>/<book>/…` | 图书内容（mdx/md）。 |
| `src/utils/sidebar.mjs` | 侧边栏自动生成器（`generateBookSidebar`），**不要手写侧边栏**。 |
| `src/components/` | 页面组件：`Example/Exercise/Knowledge/Method/Note/…`、`SidebarOverride`、`PageSidebarOverride` 等。 |
| `src/styles/custom.css` | 全局样式（移动端适配、公式排版等大改都在这）。 |
| `scripts/generate-epub.mjs` | 生成全书 EPUB3 下载文件 → `public/epub/<slug>.epub`（gitignored 构建产物）。 |
| `scripts/epub/` | EPUB 管线：`mdx-pipeline.mjs`（章节渲染）、`zip.mjs`、`site.css`。 |
| `src/utils/rehype-katex-source.mjs` | 公式源码回填：把 LaTeX 原文写进成品 HTML 的 `data-latex` 属性，供前端复制。 |
| `src/scripts/formula-actions.ts` | 公式复制交互；`src/scripts/sidebar-resizer.ts` 侧边栏拖拽。 |
| `scripts/import_*.py`、`scan-mdx.mjs`、`fix-*.mjs` | 历史内容导入/修复工具，一般不再跑。 |

## 常规工作流

- **开发**：`astro dev --background`（后台），用 `astro dev stop / status / logs` 管理。迭代改页面用 dev server，不要每次改一点就全量构建。
- **构建（贵！）**：`npm run build` = `node scripts/generate-epub.mjs && astro build`——先全量生成所有 EPUB 再构建全站，跑一次成本高。除非要验证上线产物，否则别跑。
- **只导出 EPUB**：`npm run epub`（或 `node scripts/generate-epub.mjs --only <slug>` 只生成一本书，验证 EPUB 改动时用这个）。
- **预览**：`npm run preview`（需先 build）。

## 提交与推送（DSH 沙箱下的正确姿势）

流程固定为：

1. `git status` + `git diff --stat` 摸清改动范围，确认没有误入的构建产物。
2. `git add -A`，`git commit -m "…"`。
3. `git push origin main`。

提交信息规范（与历史一致）：**中文 + conventional commit 前缀**，如 `feat: 新增…`、`fix: 修复…`、`docs: …`。写清改了什么、为什么，可带要点列表。参考 `git log --oneline -10`。

⚠️ **已知坑（本次实测）**：在 DSH `workspace-write` 沙箱下直接 `git push` 会失败，报错：

```
error: cannot create standard input pipe for ssh: Permission denied
fatal: unable to fork
[sandbox: file access denied under workspace-write mode]
```

原因是 git 需要 fork ssh 并用管道通信，被沙箱拦截。**正确解法**：用 `sandbox_permissions: "danger-full-access"` 把**同一条** `git push origin main` 命令重试一次，附一句 justification（如"git push 需要 fork ssh 连接 GitHub，workspace-write 沙箱阻止了管道创建"）。这是沙箱规则允许的唯一升级路径——**不要**改走 HTTPS/换命令绕过，也不要反复重试别的变体。审批通过即推送成功，输出形如 `807881d..ce37ec5 main -> main`。

其他要点：

- Windows 下提交时 `LF will be replaced by CRLF` 的 warning 无害，忽略即可。
- 不要提交：`dist/`、`public/epub/`、`task/`、`.codex/`、`node_modules/`、`package-lock.json` 改动若只是版本抖动也先确认。上述目录已在 `.gitignore`，但提交前仍用 `git status` 复核。
- 推送成功后顺手 `git status` 确认工作区干净。

## 内容维护（加书/加章节）

- **加一本书**：先在 `src/config/collections.config.mjs` 的对应集合里加 `books` 条目（slug、标题、封面、entryPoint、题型模块映射），再放内容文件到 `src/content/docs/collections/<collection>/<book>/`。侧边栏与首页由配置自动生成，别手改。
- **加章节/题型页**：按现有文件命名与 frontmatter 约定复制即可；题型由组件（Example/Exercise 等）+ 配置中的模块映射驱动。
- **KaTeX 配置**（`astro.config.mjs`）：`output: 'html'`、`strict: false`、`throwOnError: false` 是**有意为之**——OCR 出来的 LaTeX 常不严谨，不能让构建被公式报错阻断。不要"修复"成 strict 模式，除非用户明确要求。

## 改公式复制 / EPUB 机制前必读

- 公式复制链路：`rehypeKatexAnnotate`（rehype-katex 之前，把源码藏进占位符）→ rehype-katex 渲染 → `rehypeKatexPromote`（之后把源码提升到 `.katex` 根元素的 `data-latex`）。插件顺序不能乱；改 `astro.config.mjs` 的 rehypePlugins 数组时保持"前后夹住"的结构。
- 前端交互在 `src/scripts/formula-actions.ts`（`src/scripts/` 下的 ts 会被构建注入，无需手动引入）。
- EPUB 生成依赖 `public/covers/` 封面与 katex dist，验证改动用 `npm run epub -- --only <slug>`。

## 省 token / 省时间操作规范（重要）

- **读文件用 read 工具（带 offset/limit），不要用 cat/Get-Content 读大文件**——mdx 正文动辄上千行，全量读入纯属浪费。
- **pwsh 一次调用合并多条命令**（用 `;` 或换行），减少往返次数。
- **不要无谓 `npm install`、删 `node_modules`、跑 `astro check` 全量检查**；依赖没动就不装。
- **不要轮询/睡等后台任务**：后台 job 用 `job_output`（必要时 `wait: true`），等待期间去做独立的工作。
- 改动前先 `git status` / `git diff --stat` 确定范围，避免改错文件后反复返工。
- 纯内容（mdx）改动通常不需要跑全量 build；只有动到组件/配置/构建管线时才需要验证构建。
- 大批量机械修改（如批量改组件、扫全库文件）优先考虑子代理/工作流并行，而不是逐个文件串行读改。

## 维护本 skill

本文件位于 `.dsh/skills/astro-site-operations/SKILL.md`（项目级 skill，DSH 按 `<项目根>/.dsh/skills/<name>/SKILL.md` 发现；frontmatter 的 `name` 必须 kebab-case，`description` 说明何时使用）。每次踩到新坑、或项目结构变化（如新增目录/脚本），就把要点补进对应小节，保持简短可执行。
