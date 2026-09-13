# Gemma 4 31B 数据清洗与教材重构生产流水线交接文档

> **面向接棒 Agent / 工程师的行动指令**：
> 前期的旁注基础设施建设、流水线设计与第 2.4 节实战试点测试已全部验收通过。**您可以立即启用 Gemma 4 31B 流水线推进全书各章节的高质量数据清洗与重构！**

---

## 1. 架构背景与业务边界定义

### 1.1 核心问题诊断回顾
此前利用 MinerU OCR 导入教材时，由于算法对“主栏正文 + 宽边栏批注”的二维空间版面降维失败，造成了严重的版面塌陷：
1. **主栏与边栏绞杀混流**：边栏文字（如“想一想”、“注”）被暴力插入到主栏正在进行的证明句子当中（甚至插在逗号中间）；
2. **AST 容器早泄与悬空孤儿证明**：`<Knowledge>` 提前闭合，证明推导后半段在卡片外裸奔；
3. **图像资产残缺**：图 2.12 彻底丢失，多子图（图 2.14）被撕裂为离散散图；
4. **数学符号坏味道**：单侧右极限 $\lim_{x\to x_0^+}$ 被 OCR 错识为 $x_0^*$ 或 $x_0^\prime$，大量裸 ASCII 变量混排；
5. **微课二维码噪音**：标题残片散落在正文中形成幽灵文本。

### 1.2 明确的业务边界原则
- **课后习题已独立提取至全书题库**：项目通过 `scripts/extract_textbook_exercises.py` 建立了结构化题库，**各章节 MDX 正文末尾不再保留课后大题正文，统一规范挂载 `<ExerciseTrigger />`**；
- **旁注采用专属组件并排排版**：原书边栏的“想一想”、“注”、“注意”、“思路分析”、“几何解释”等一律解耦并封装为 `<SideNote>`，还原原书并排阅读质感。

---

## 2. 基础设施就绪清单（已落盘并验证）

接棒 Agent 无需重复开发组件或配置文件，以下基础设施均已 100% 建设完毕并编译通过：

| 基础设施文件 | 功能与规范 |
| :--- | :--- |
| [`src/components/SideNote.astro`](file:///D:/Antigravity/project/AstroLib/src/components/SideNote.astro) | **旁注核心组件**：桌面端（$\ge 50\text{rem}$）自动 `float: right; width: min(18rem, 36%)` 向右浮动与主文并排；移动端自动紧凑降级；内置 `think` / `caution` / `analysis` / `geom` / `note` 五大学术语义类别；支持标题 KaTeX 公式。 |
| [`src/components/MarginNote.astro`](file:///D:/Antigravity/project/AstroLib/src/components/MarginNote.astro) | **旁注同义别名**：直接包装并映射至 `SideNote.astro`，提升 MDX 编写自由度。 |
| [`scripts/lib/mdx_sanitizer.py`](file:///D:/Antigravity/project/AstroLib/scripts/lib/mdx_sanitizer.py) | 已向 `VALID_TAGS` 注册 `SideNote` 与 `MarginNote`，避免清洗脚本将 JSX 标签括号误转义。 |
| [`src/content/docs/dev/authoring/card-components.mdx`](file:///D:/Antigravity/project/AstroLib/src/content/docs/dev/authoring/card-components.mdx) | 补齐第 4 节“旁注/边注”标准文档与使用范式，通过 `@mdx-js/mdx` 严格编译。 |
| [`images/fig_2_12.png`](file:///D:/Antigravity/project/AstroLib/src/content/docs/collections/math/engineering_analysis/images/fig_2_12.png) | 已从原书第 131 页高保真切图恢复，供中值定理章节引用。 |
| [`test/output/2.4_微分中值定理及其应用.reconstructed.mdx`](file:///D:/Antigravity/project/AstroLib/test/output/2.4_微分中值定理及其应用.reconstructed.mdx) | **实战样板**：重构后的标准第 2.4 节，全绿通过校验，作为全书重构的最佳实践标杆。 |
| [`test/output/2.4_diff_report.md`](file:///D:/Antigravity/project/AstroLib/test/output/2.4_diff_report.md) | **前后三向审查报告**：原书截图 vs 旧版清洗 vs 重构后，供验收比对。 |

---

## 3. Gemma 4 31B 重构流水线标准操作规程（SOP）

```text
       ┌────────────────────────────────────────────────────────┐
Step 1 │ 按节提取原始输入流 (以节为单位，容纳整节 5~15 页扫描文本)│
       └──────────────────────────┬─────────────────────────────┘
                                  ▼
       ┌────────────────────────────────────────────────────────┐
Step 2 │ 调用 Gemma 4 31B 执行语义重构 (使用标准契约 System Prompt)│
       └──────────────────────────┬─────────────────────────────┘
                                  ▼
       ┌────────────────────────────────────────────────────────┐
Step 3 │ 语法与数学确定性校验 (node scripts/scan-mdx.mjs <file>) │
       └──────────────────────────┬─────────────────────────────┘
                                  ▼
       ┌────────────────────────────────────────────────────────┐
Step 4 │ 规范落盘与 Git 提交 (Conventional Commits 纯学术英文)  │
       └────────────────────────────────────────────────────────┘
```

### 3.1 核心调用策略：整节上下文输入（128k Window）
- **严禁按单页切片提示模型**：大学教材中值定理、导数应用等长篇推导频繁横跨 2～3 个物理页码。必须将**整节的所有页码扫描文本作为单次请求的上下文一次性送入**。
- 一节教材平均为 8,000～18,000 tokens，完全位于 Gemma 4 31B（128k 上下文）的最佳推理与全局长程依赖感知区间内。

### 3.2 Gemma 4 31B 标准系统提示词（System Prompt Contract）

在调用 Gemma 4 31B 处理各章节时，请严格注入以下 System Prompt：

```text
你是一名顶级大学数学教材出版总监与 AstroLib MDX 结构化专家。
你的任务是将传入的 OCR 扫描文本流重构为符合 AstroLib 规范的高质量学术 MDX 章节。

必须严格遵循以下六项铁律：

1. 边栏拓扑解耦（Marginalia & SideNote）：
   - 扫描流中经常有边栏文字混入证明主句（例如在条件判断中插入“想一想...”或“注...”）；
   - 你必须理顺主栏句子逻辑，将所有边栏内容抽取为 <SideNote title="..."> 组件；
   - 将 <SideNote> 放置在它所批注的定理、例题、证明段落的开头或卡片内部，使其在桌面端右侧自然并排浮动；
   - 严禁将边栏文字断开主干数学证明！

2. 语义卡片状态机完整性（AST Integrity）：
   - 定理、定义、性质、推论使用 <Knowledge title="...">，其前提条件与核心结论必须完整包裹；
   - 定理证明使用 <Solution title="证明">，必须严格包裹完整推导过程，严禁证明后半截掉出卡片；
   - 例题使用 <Example title="例 X.Y">，解答使用 <Solution title="解"> 或 <Solution title="证">；
   - 过渡段落（如“由此可见...”、“下面我们介绍...”）必须放置在卡片外部，作为标准 Markdown 段落。

3. 数学排版精度（KaTeX Rigor）：
   - 严禁正文出现裸 ASCII 数学符号，统一转为 LaTeX，如 f, x, I, a, b 必须写作 $f$, $x$, $I$, $a$, $b$；
   - 修复 OCR 符号错误：单侧右极限 \lim_{x\to x_0^+} 严禁识别为 x_0^* 或 x_0^\prime；
   - 规范公式编号标签为 \tag{X.Y}。

4. 图像资产规范化：
   - 几何配图统一使用：
     <figure class="vp-figure">
       <img src="images/xxx.jpg" alt="图 X.Y" />
       <figcaption>图 X.Y</figcaption>
     </figure>
   - 复合子图（如 (a), (b), (c)）使用 flex 布局包裹，保持组图完整。

5. 微课融媒体净化：
   - 微课二维码统一收拢为单一组件：<QRCodeVideo id="X.Y.Z" title="..." url="..." />；
   - 彻底删除正文中残留的“二维码X.Y.Z...”文本行与标题碎片。

6. 节末习题解耦：
   - 章节正文在遇到“习题 X.Y”或“(A)/(B)”大题时立即结束正文输出；
   - 节末统一接入：
     <ExerciseTrigger chapter={ch} section="{sec}" title="{sec} {title} 课后真题与自测练习" />
```

---

## 4. 章节交付标准与质量验收栅栏

每个章节经流水线生成后，接棒 Agent 必须执行以下双重校验方可合入：

### 4.1 自动化编译命令
```bash
node scripts/scan-mdx.mjs src/content/docs/collections/math/engineering_analysis/<章节文件名>.mdx
```
* **验收红线**：必须输出 `🎉 所有 MDX 与 KaTeX 数学公式均校验通过！`，零语法解析报错、零 KaTeX 渲染异常。

### 4.2 人工审查核对表（Checklist）
- [ ] **边栏无侵入**：全文无任何混在逗号或句号中间的“想一想/注”碎片；
- [ ] **卡片不早泄**：检索所有 `<Knowledge>` 和 `<Example>`，确认对应的 `<Solution>` 推导完整闭合；
- [ ] **正文无乱码**：无残留的 `二维码 2.x.x` 或断裂的行尾汉字；
- [ ] **极限符号纯正**：无 `\lim_{x\to x_0^*}` 等错误上标；
- [ ] **节末有触发器**：包含标准的 `<ExerciseTrigger />` 且题库联动正常。

---

## 5. Git 提交规范（Conventional Commits）

根据项目根目录 `AGENTS.md` 第 4 节的强制约束：
- **禁止使用中文写 Commit 信息**；
- **禁止包含任何 Emoji 表情符号**；
- **采用纯学术克制英文字符（Academic Restrained Conventional Specification）**：
  ```bash
  # 示例：完成某章的 Gemma 重构
  refactor(content): reconstruct chapter 2 middle value theorems with gemma pipeline and sidenote
  fix(katex): normalize one-sided limit superscripts in section 2.4
  ```

---

**总结**：当前基础设施完备，输入输出契约已固化，验证闭环全绿。请接棒 Agent 按照上述 SOP 放手推进全书的流水线重构！
