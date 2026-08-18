---
name: efficient-execution
description: 在 my-astro-site 执行任何任务（新书导入、内容修改、构建验证、git 提交）前先读本 skill——它总结 DSH 沙箱下的环境已知坑、勘察/验证/提交的流程纪律与成本守则，避免无意义的尝试、重复劳动和过度谨慎。与 astro-project-guide（结构）、import-book（导入步骤）、astro-site-operations（提交/构建）配合使用。
---

# 高效执行纪律（流程防坑手册）

本 skill 来自一次《概率论与数理统计教程》导入任务的复盘：耗时过长、绕弯太多、成本控制不理想。
以下是踩过的坑与**正确的做法**，执行任务前先对照一遍。

## 总原则

1. **一步到位，不反复试探**：勘察一次、写脚本一次、验证一次、提交一次。每个环节先想清楚再动手。
2. **已知环境问题不重复确认**：build 在本沙箱已知不可用（见下），不要为"排除自己的改动"反复做基线测试。
3. **用替代验证代替昂贵验证**：内容正确性用 `node scripts/scan-mdx.mjs`（与构建同款编译管线、快），上线正确性交给 Vercel 云端构建，本地不跑全量 build。
4. **读文件/列目录用专用工具**：read/grep/glob，不用 pwsh 递归列目录、不用 cat 读大文件。

## 勘察与读文件规范

- **列 task 目录只到目录层**：`Get-ChildItem task -Directory` 拿目录名即可，配 `full.md` 行数/字节数。**不要**递归列目录——MinerU images 有上千个文件，输出会刷屏截断。
- **统计图片引用**用 grep/正则计数（`Select-String -Pattern '!\[\]\(images/' -AllMatches`），不要列文件清单。
- **同一文件区间只读一次**：read 一次用够 offset/limit（如一次读 120 行覆盖边界），不要分多次小段读同一区域。
- **边界定位用 grep 先行**：拼接点、答案区、附录边界先用 grep 拿行号，再精准 read 一次首尾确认。
- 一次 pwsh 调用合并多条命令（`;` 分隔），减少往返；但**输出量大时拆开**，避免截断丢失关键信息。

## 环境已知坑（不要再踩）

| 坑 | 现象 | 正确做法 |
| --- | --- | --- |
| 本地 `npm run build` 不可用 | npm.ps1 报 StandardOutputEncoding；npm.cmd 拒绝访问；`node node_modules/astro/bin/astro.mjs build` 在加载 astro.config 阶段报 vite 加载 source-map-js `require is not defined` | **不跑本地 build**。内容验证用 scan-mdx，上线验证靠 git push 触发 Vercel。若确需验证 EPUB 用 `npm run epub -- --only <slug>` |
| git 命令带管道/重定向 | `git status --short \| Select-Object` 等报"拒绝访问"/"cannot create standard input pipe" | git 命令**单独执行不带管道**；要过滤输出用 grep 工具或让输出直接返回 |
| `git push` 必失败一次 | `cannot create standard input pipe for ssh: Permission denied` | 直接在**同一条**命令上带 `sandbox_permissions: "danger-full-access"` + justification 重试，不要先失败再试，也不要换 HTTPS 绕过 |
| `git stash` / `git show --output` 不可靠 | stash 报 update-index 管道被拒；`git show HEAD:file > out` 的 `--output` 参数本环境不支持，可能写出 0 字节文件 | 不要用 git 命令生成/恢复文件副本；**不要用 stash 做基线测试** |
| 临时文件备份丢失 | 用 `git show > head` 得到 0 字节文件，Copy-Item 覆盖后配置变空 | 备份用 `Copy-Item x x.sav`，**操作前验证源非空、操作后验证备份非空**；恢复后删除备份文件 |
| Windows 下 LF→CRLF warning | 提交时提示 `LF will be replaced by CRLF` | 无害，忽略 |

## 转换脚本编写纪律

1. **复制参考实现改常量**：新书导入复制 `scripts/import_university_physics.py`（课后题拆页/卡片/转义最全）或 `import_engineering_analysis.py`（按节拆分），不要从零写。
2. **一次防御 MinerU 已知坑**（写脚本时就处理，不要跑完再补）：
   - 纯数字行被误判为标题（如 `## 4.5 5.0 4.7 4.0 4.2` 样本数据）→ 节切分与 tokenize 都要按"标题部分全为数字"降级为正文；
   - HTML 表格里的裸 `{ }` 会被 MDX 当 JSX 表达式（acorn 报错）→ 表格行按 `$...$` 数学感知转义 `{`→`&#123;`、`}`→`&#125;`，数学内保留；
   - 表格里的 `~` 被当删除线 → 换全角 `～`；
   - 跨 PDF 拼接处 `$$` 行不折叠，直接顺序拼接；
   - 答案区同名标题加" 答案"后缀。
3. **写完先小样本试跑**：可以先只生成一章（临时改输出或加开关）或直接全量跑一次，但**跑完立刻 scan-mdx**，根据错误集中修，不要改一行跑一次。
4. scan-mdx 的 stderr 里 `No character metrics for 'Ⅲ'` 之类是 KaTeX 字体警告，**无害，忽略**；只看"通过/失败"计数与 acorn 错误。

## 验证纪律

- 本地验证唯一标准：`node scripts/scan-mdx.mjs src/content/docs/collections/<col>/<book>` 全过。
- 图片引用校验用一次性 pwsh：遍历 mdx 正则提取 `images/xxx`，对照目录存在性。
- 封面/图片/配置注册在脚本里一并完成，不要分多次手工补。
- 不要为了"确认 build 失败是不是我改的"回退文件、建临时项目、试多种 node 入口——**build 失败发生在 config 加载阶段，与内容文件无关**，直接判为环境问题。

## 提交纪律

1. `git status`（不带管道）确认范围，`git add -A`，`git commit -m "feat: 新增…"`（中文 + conventional 前缀，参考 `git log --oneline -5`）。
2. `git push origin main` 一步到位带 `danger-full-access` 升级 + 一句 justification。
3. 推送成功后 `git status` 确认干净；`.dsh/skills/` 下的 skill 本身也随仓库提交。
4. 不在 `git add -A` 时误入 `dist/`、`public/epub/`、`task/`、`.codex/`（已 gitignore，仍用 status 复核）。

## 成本守则（省 token / 省时间）

- 每步先问"这步验证能改变我的下一步吗？"——不能就不做。
- 不要为已知结论反复确认（例如拼接点已 grep 确认过就不再 read 第二遍）。
- 合并 pwsh 命令、合并 read（大 offset/limit 一次读完）。
- 后台任务用 `job_output`（必要时 wait:true），等待期间做独立工作，不空转轮询。
- 用户明确说"减少不必要的验证"时，立即停止验证类操作，切换到能推进任务的步骤。
