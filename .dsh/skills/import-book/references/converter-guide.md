# 转换脚本适配指南

仓库里有两本例书的完整可运行实现：

- `scripts/import_engineering_analysis.py`：《工科数学分析基础》（数学书，A/B 两类习题、书末答案区）
- `scripts/import_university_physics.py`：《大学物理学》第 7 版（物理书，17 章、课后题按题型拆页、每题一个 Exercise 板块）

新书导入时复制最接近的一例、按下述清单修改。

## 需要修改的常量

| 常量 | 说明 |
| --- | --- |
| `VOL1_A/VOL1_B/VOL2_A/VOL2_B` | 源目录名（`task/` 下的 `<书名>.pdf-<hash>`）。单册书只需 1-2 个；多册书按"册 × 半部"排列并保证拼接顺序正确 |
| `OUT` | 输出目录 `src/content/docs/collections/{col.slug}/{book.slug}` |
| `IMAGES_OUT` | 随 OUT 变化 |
| `cover_src` / `COVERS` | 封面图源与 `public/covers/` 目标文件名 |
| `modules` 相关 | 见 collections.config.mjs，二者必须一致 |

《大学物理学》脚本额外提供：

| 常量/函数 | 说明 |
| --- | --- |
| `CHAPTER_TITLES` | 章标题字典（下册正文没有"第X章"标题行，必须从目录硬编码） |
| `tokenize_exercise` | 课后题切分：每题一个 `<Exercise title="习题 X.Y.Z">` |
| `split_tail_by_type` / `extract_answer_chunk` | 把章尾按 选择题/填空题/解答题 拆页；切出"习题参考答案"图片区 |
| `split_chapters` | 章边界推断：`## 第X章`（阿拉伯/中文数字）、节号 X.Y 变化、篇标题 |

## 关键函数（改结构时对照）

- `cut_answer_key(lines)`：切出书末"部分习题答案与提示"（最后一个 `## 附录` 标题之后、`## 参考文献`/`## 二维码清单` 之前的裸 `## 第X章` 区域）。
- `split_chapters / split_sections`：按 `第X章`、`第X节` 标题切分。
- `split_chapter_tail`：从最后一节内容里切出 `第X章习题` + `综合练习题`。
- `split_answer_chapters`：答案区按 `习题X.Y`/`第X章习题` 编号分组（兼容缺裸章标题的章）。
- `tokenize`：卡片识别核心，正则集中在文件顶部：
  - `EX_RE`（例/例题）、`KN_RE`（定理/定义/性质/推论/引理/命题/公理）、`NOTE_RE`（想一想/注意/注）、`SOL_RE`（证明/证/解）、`BLOCK_RE`（习题/章习题/综合练习）。
  - 新书出现新模式时在此扩展，并同步更新 collections.config.mjs 的 modules。
- `tokenize_exercise`（大学物理学）：题目切分优先级为 编号行 → 段落内 `题X.Y.Z图` 引用 → 求解/疑问标记（试求/求/？/多少…）顺序回填；
  短小续文（"请问…""那么…""若…则"、`( )` 选项行、`(n)` 子题、图注行）判为延续；页眉残留行（"大学物理学（第7版）（下）"、`# Physics ...`）整行丢弃。
- `MDXEscaper`：数学感知转义器，`$$` 块与 `$...$` 内不转义，纯文本 `<`→`&lt;`、`{`/`}`→`\{`/`\}`。**不要删除**，这是 MDX 编译通过的关键。
- `render_tokens / write_mdx`：渲染与落盘；frontmatter 用单引号包裹 title。

## 结构差异时的调整

- **单册无答案区**：`cut_answer_key` 返回空答案区即可，答案文件循环自然跳过。
- **拆分粒度变化**（如超大节拆到小节）：调整 `split_sections` 的边界正则与文件命名规则，同时保持自然排序（`{章}.{节}_...`）。
- **新增卡片类型**：在 `tokenize` 加正则 + 在 `render_tokens` 加渲染分支 + 在 config `modules` 注册 aliases/theme。
- **课后题分题型拆页**（大学物理学做法）：章尾不再是单个 `<Block>`，而是按 选择题/填空题/解答题 拆成三个页面，每题一个 `<Exercise>` 卡片；
  需要新建 `src/components/Exercise.astro`，并把 `Exercise` 加进 `PageSidebarOverride.astro` 的 `tagRegex`。
- **章号/节号缺失**：正文可能没有"第X章"标题行（下册常见），用节号 X.Y 的 X 变化推断章边界；`\*2.2` 是字面反斜杠+星号；节标题行偶尔跑到节号前面（6.4）或节号整行丢失只剩 `X.Y.Z` 小节（6.7/14.6），转换器需分别回迁标题/按小节号开新节。
- **HTML 表格**：源里偶有整行 `<table>...</table>`（物理常量表、壳层结构表），转义器原样放行；表格内裸 `~` 会触发 MDX 删除线误判，替换为全角 `～`。

## 课后题编号恢复规则（tokenize_exercise）

MinerU 经常丢失题目编号（本书 83 处），按以下顺序恢复：

1. 编号行 `X.Y.Z ` → 直接作为卡片标题；
2. 未编号段落内含 `题X.Y.Z图` → 用该图号作为题号（裸图注行只作配图）；
3. 段落含求解/疑问标记（试求/试问/求：/求+汉字/计算/能否/是否/为什么/？/多少…）→ 按当前题型连续编号回填；
4. 短小续文（<30 字且含 ？/求/试/多少）与 `( )` 选项行 → 并入当前题，避免碎片卡片；
5. 缺号多道题且后续编号为 X.Y.N（N>2）时，按含 A-D 选项集的段落切分回填 X.Y.1...X.Y.N-1。

## 运行与清理

- 用 `D:\python\python.exe` 运行（`python` 在 PATH 是 WindowsApps 占位符）。
- 脚本会重建整个 book 目录：重新生成前先删除旧目录，避免旧文件名残留。
- 图片只拷贝 MDX 实际引用的（脚本按引用收集）；缺失会打印 `[warn] 图片缺失`。
