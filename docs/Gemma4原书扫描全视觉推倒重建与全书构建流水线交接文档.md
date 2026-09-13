# Gemma 4 原书扫描全视觉推倒重建与全书构建生产流水线交接文档

> **面向接棒 Agent / 工程师的战略总纲**：
> 本文档定义了《工科数学分析基础 上册》彻底抛弃低质量 MinerU OCR 脏数据文本，以原书 PDF 物理扫描高清原图为**唯一真实源（Ground Truth）**，利用 **Google Gemma 4 多模态视觉模型（`gemma-4-26b-a4b-it`）** 进行全视觉端到端推倒重建的完整工程标准、自动化流水线工具链与全书执行操作规程（SOP）。
> 
> **实战检验状态**：
> - 基础设施建设：100% 就绪；
> - 独立测试图书上线：《工科数学分析基础（视觉重建版·测试）》（Slug: `engineering_analysis_rebuild`）；
> - 第二章（2.1~2.6 全 6 节）、第三章（3.1~3.5 全 5 节）、第四章（4.1~4.3 全 3 节）：已全量视觉重建并上线；
> - **第五章（5.1~5.7 全 7 节，物理页 338~427，跨 90 页）**：**100% 视觉推倒重建成功并完成全量数据清洗与外科手术修复，语法与 KaTeX 强校验 0 错误全绿通过**；
> - **第六章前 3 节（6.1~6.3，物理页 428~459）**：**100% 视觉推倒重建成功并完成深度清洗修整，语法、图片与 AST 卡片 100% 达标**；
> - 全书已上线 25 篇重构 MDX，`node scripts/scan-mdx.mjs` **25/25 篇 100% 绿灯全过（0 语法报错、0 KaTeX 报错、0 缺失图片）**；
> - 创新建立并执行**三层【真实情景实测】体系（静态门禁 + 服务守护 + 真实端到端 HTTP/DOM/图片可达性巡检）**，实测章节全部 HTTP 200 OK、0 处 KaTeX 红字、0 处破损图片链接！
> 
> **接棒 Agent 可直接按照本文档规程与防坑经验，从第六章第 6.4 节无缝继续推进全书构建！**

---

## 1. 为什么“推倒重建”？（战略认知与真实源转向）

### 1.1 传统 OCR 修补清洗的破产与根因
此前试图基于 MinerU OCR 产出的 Markdown 进行“数据清洗”已被证明是修修补补且事倍功半的死胡同。其物理根因在于原书的二维复杂印刷版面：
1. **双栏绞杀与截断**：原书采用“主栏推导正文 + 宽边栏批注”的版面。OCR 线性文本流将边栏（“想一想”、“注”）无序截断并暴力塞入主栏证明的一句话中间（例如原书 92 页“读者不难举例说明，这样定义曲线上一点处的切线是不恰当的”被掐为两截，中间硬插进旁注），导致句子语法破碎、数学逻辑中断；
2. **AST 容器早泄与悬空孤儿**：卡片识别算法因遇到行间公式或分栏产生边界误判，导致 `<Knowledge>` / `<Example>` 提前闭合，后续大段推导在卡片外裸奔；
3. **数学符号失真**：单侧极限 $x \to x_0^+$ 错识为 $x_0^*$ 或 $x_0^\prime$，大量单个英文字母变量未被包裹进 `$...$`，形成裸西文字符污染；
4. **插图索引残缺与孤立**：多子图（如抛物镜面聚光 (a)(b)）被撕裂为离散无序散图，甚至核心图表彻底蒸发；
5. **课后习题与正文混杂**：纸质教材每节末尾印刷的大量课后习题直接平铺在正文尾部，挤占篇幅并破坏“内容即界面”的极简学术呼吸感。

### 1.2 转向 Ground Truth：全视觉推倒重建铁律
在全视觉推倒重建流水线中：
- **禁止依赖或参考原 MinerU OCR 的清洗文本**；
- **唯一真实源（Single Source of Truth）是原书物理高清扫描图（150 DPI）**；
- **多模态端到端直出**：由 Gemma 4 视觉模型统揽整页视觉版面，直接理解空间排版关系，一步到位输出符合 AstroLib 标准组件规范（`<SideNote>`, `<Knowledge>`, `<Example>`, `<Solution>`, `<figure>`, `<QRCodeVideo>`, `<ExerciseTrigger>`）的纯净 MDX。

---

## 2. Gemma 4 视觉模型关键认知与避坑铁律

在调用 Google Gemma 4 视觉能力时，必须严格遵守以下经过实战检验的核心工程认知：

### 2.1 模型选型铁律：必须且只能选用 `gemma-4-26b-a4b-it`
- ❌ **`models/gemma-4-31b-it`**：**纯文本模型**！如果向其传入含有 `inlineData`（Base64 图像）的请求体，Google API 会直接返回 `HTTP 500: Internal Server Error`。
- ✅ **`models/gemma-4-26b-a4b-it`**：**全功能多模态视觉模型**。具备 256K 超大输入上下文与 32K 输出空间，原生支持多张高分辨率图片并行输入（经实测支持 1~6 张高清原图单次推理），并具备细致的图文协同与公式推导能力。

### 2.2 协议选型铁律：必须使用 SSE 流式传输（Server-Sent Events）
- **现象**：当一次请求携带 2~4 张 150 DPI 教材页面（Base64 数据量约 1MB~1.8MB）时，非流式单次 HTTP POST 请求在等待完整生成的 1~2 分钟内极易触发底层网络重置（`SocketError: other side closed` 或 TCP Timeout）。
- **解法**：必须使用带有 `alt=sse` 的流式端点：
  ```text
  https://generativelanguage.googleapis.com/v1beta/models/gemma-4-26b-a4b-it:streamGenerateContent?key=...&alt=sse
  ```
  项目已封装并落盘在 [`scripts/vision_reconstruct/gemma_vision_client.mjs`](file:///d:/Antigravity/project/AstroLib/scripts/vision_reconstruct/gemma_vision_client.mjs)，接棒 Agent 请直接 import 使用。

### 2.3 思考预算硬约束与防爆死循环机制（Thinking Token Guardrail & Anti-Runaway）
- **现象与实战血泪教训**：
  在处理大学高阶数学高密度公式版面（如第 5.4 节批次 2，涉及多元 Taylor 展开、二次型正定性判别、最小二乘法及 Lagrange 乘数法）时，Gemma 4 自发启动了极其长程的思维链（CoT `<thought>` 狂飙至 94KB），直接把 `maxOutputTokens: 16384` 的输出上限全部在思考阶段耗光，导致最终输出的正文截断为 **0 字节**！
- **连锁灾难：跨章节“借尸还魂”严重串位**：
  由于 5.4 节后半截因思考链耗尽而截断，后续流水线在处理 5.5 节批次 1（从物理第 74 页起跑）时，模型在缺乏显式重置的情况下，误将 5.4 节残存未完成的条件极值推导（例 4.8 及 Lagrange 乘数法）直接写在了 5.5 节的开头（导致 5.5 节开头混入了长达 250 行的 5.4 节内容），造成跨节严重串位与内容重复！
- **防爆与防串位三大守则**：
  1. **思考大纲极简压制**：在 Prompt 顶端强制注入更严格的指令：
     ```text
     【核心指令】：思考过程请保持极简（不超过 80 字简要大纲），把全部输出配额用于生成完整的 MDX 正文！
     ```
  2. **跨批次首尾咬合连续性审计**：在将批次拼装为单节 MDX 时，必须人工或自动化校验上一批次的尾部知识点（如定理/例题编号）与下一批次的头部知识点是否严丝合缝咬合，坚决杜绝章节内容跨界杂糅；
  3. **客户端熔断守护**：在流式客户端 `gemma_vision_client.mjs` 中监控思考块字符数，一旦发现 `<thought>` 异常膨胀且无正文产出即提前中断流并触发重试，避免耗费长耗时等待与无效配额。

### 2.4 分块颗粒度黄金法则（Batch Sizing）
- **最佳单次批次**：**2 至 3 个物理页码**（对应原书 1~1.5 个跨页展开面）。
- **耗时与吞吐**：2~3 页单次流式耗时约为 50~90 秒，网络最稳，既能保持跨页证明（如一个定理跨两页）的上下文连贯，又绝不会触发超时或内存溢出。
- **一节总控**：一节教材通常长约 6~12 页，拆解为 2~4 个串行分块批次生成，最后通过拼装器合并。

### 2.5 自适应退避重试（Backoff Retry）
- Google API 在高并发或高峰期易返回 `HTTP 503: The model is currently experiencing high demand`。
- `gemma_vision_client.mjs` 内置了 3 次自适应指数退避重试（间隔 5s、10s、15s），保障长耗时全书批量构建时无人值守的鲁棒性。若遇大面积持续繁忙，应暂停自动化流水线，先转入已生成章节的数据清洗与实测验证。

---

## 3. AstroLib 六大排版重构契约（The 6 Golden Rules）

在生成每一节 MDX 时，Prompt 和最终输出必须 100% 遵守以下六大契约：

### 契约 1：边栏批注彻底抽离为 `<SideNote>`
- 原书双栏版面中印在侧边的“想一想”、“注”、“注意”、“思路分析”、“几何解释”等，必须**从主文物理段落中完全剥离**，封装为：
  ```astro
  <SideNote title="想一想">
  举例说明用与曲线只有一个交点的直线来定义该曲线在此点切线是不恰当的。
  </SideNote>
  ```
- **正文严禁断句**：边栏抽离后，主文的证明、定理、概念叙述必须前后连贯、主谓完整。
- **排版形态**：桌面端（$\ge 50\text{rem}$）自动向右浮动并排（`float: right`），移动端自动下沉紧凑折叠。

### 契约 2：AST 语义卡片严格闭合与大纲层级规范（杜绝早泄与标题溢出）
- **核心语义卡片使用规范**：
  - 核心概念/定理定义使用 `<Knowledge title="...">...</Knowledge>`；
  - 例题题面使用 `<Example title="例 X.Y ...">...</Example>`；
  - 解题与证明过程使用 `<Solution title="解">...</Solution>` 或 `<Solution title="证明">...</Solution>`；
  - 严禁出现标签不匹配、漏闭合或将证明步骤散落在卡片外裸奔。
- **大纲层级规范（杜绝重复 H1）**：
  - Astro 页面模板默认由 frontmatter 的 `title` 统一渲染页面的唯一 H1 标题；
  - MDX 正文开头**严禁再次书写 `# 第 X 节 ...` 的一级大标题**，避免导致大纲（TOC）产生双重 H1 混乱与版面突兀；
  - 正文子章节必须从二级标题 `## X.1 概念板块` 开始，三级标题使用 `### 1. 细分子模块`。
- **例题长题干强制分流（防全局加粗与溢出）**：
  - 严禁将长达 100~200 字的复杂题干直接塞入 `<Example title="...">`，避免导致标题强制加粗、头部比例失调与窄屏折行挤压；
  - 规范做法：`title` 属性仅保留精炼的题号与核心题名（如 `title="例 4.5 三角形最大面积"` 或 `title="例 5.1"`），将详细题设与长文本放入 `<Example>` 卡片内部作为第一段 Markdown 题干。

### 契约 3：100% 工业级 KaTeX 纯净度（避坑铁律）
- **变量与算子标准化**：
  - 严禁裸 ASCII 变量：文本中出现的单个字母变量一律包裹为数学模式（如 `$x$`, `$y$`, `$f(x)$`, `$\Delta t$`）；
  - 规范微积分算子：微商使用 `\frac{\mathrm{d}y}{\mathrm{d}x}`，求值坚线使用 `\left. \frac{\mathrm{d}s}{\mathrm{d}t} \right|_{t=t_0}` 或 `\Big|_{x=x_0}`；
  - 规范极限与单侧导数：`\lim_{\Delta x \to 0^+}`，`f'_+(x_0)`，`f'_-(x_0)`；
  - 独立行重要公式右侧编号统一使用 `\tag{X.Y}`。
- **环境内严禁嵌套 `\tag`（防 ParseError: Multiple \tag 致命错误）**：
  - KaTeX 严格遵循数学规范，如果在 `\begin{cases} ... \end{cases}` 或矩阵等环境内部嵌套 `\tag{1}`，或者在一个公式块中出现多个 `\tag`，会直接触发 `ParseError: Multiple \tag` 致命编译中断；
  - **规范解法**：方程组或多行联立式内部编号，统一使用对齐符与带括号数字，如 `& (1) \\ & (2)`，严禁在内部嵌套 `\tag`！
- **杜绝 Unicode 特殊字符字体缺失警告（Font Metrics Warning）**：
  - 在公式或数学环境中使用带圈字符（如 `①`, `②`）时，KaTeX 会抛出 `No character metrics for '①' in style 'Main-Regular'` 警告，并可能导致回退字体排版畸变；
  - **规范解法**：公式与步骤编号统一使用 ASCII 标准括号数字 `(1)`, `(2)`。
- **括号与环境成对闭合**：
  - 严禁矩阵末尾出现孤立或多余的 `\end{bmatrix}`，严格保证环境与括号一一对应。

### 契约 4：响应式配图管线与多子图实体化合成
- **标准配图语义包裹**：
  - 统一使用 Markdown 图片语法触发 Astro 原生图片优化与响应式分发服务：
    ```markdown
    <figure class="vp-figure">
      ![](./images/fig_X_Y.png)
      <figcaption>图 X.Y 平面曲线及其割线与切线示意图</figcaption>
    </figure>
    ```
  - 图片命名统一遵循 `fig_<章>_<图号>.png` 语义规范。
- **多子图合成策略（Composite Figures）**：
  - 原书经常出现 (a)(b)(c) 多联子图（如 5.5 节抛物面、双带状、椭圆区域），若作为离散碎图切出极易丢失图号或排版割裂；
  - 统一通过 PyMuPDF 编写合成脚本（如 `scripts/vision_reconstruct/materialize_ch5_ch6_figures.py`），从原书切出高清子图后进行矢量拼接，输出为单张紧凑的复合标准配图（如 `fig_5_5.png`）。
- **MinerU Hash 图像资产高保真映射**：
  - 充分利用已有的原始高清插图切片（位于 `engineering_analysis/images/*.jpg`），通过哈希映射表与视觉语义快速实体化到 `engineering_analysis_rebuild/images/`，实现 100% 资产覆盖与 0 碎图（0 ImageNotFound）。

### 契约 5：二维码微课标准化
- 原书印刷的微课二维码一律转化为标准微课组件：
  ```astro
  <QRCodeVideo id="X.Y.Z" title="视频微课标题" url="https://..." />
  ```
- 严禁将“二维码 2.1.2”等乱码作为正文普通段落输出。

### 契约 6：课后习题切断解耦（侧载接管）
- **核心原则**：正文页面只呈现精粹的理论推导与典型例题，绝不将课后成百上千道纸质练习题平铺在正文底部；
- **自动阻断点**：在视觉扫描流中遇到“习题 X.Y”大标题时，**立即终结正文生成**；
- **末尾标准挂载**：在章节最末尾统一插入：
  ```astro
  <ExerciseTrigger chapter={X} section="X.Y" title="X.Y <节标题> 课后真题与自测练习" />
  ```
- 用户点击该触发器即可平滑唤起右侧 Sideload Dock 侧载题库进行互动自测。

---

## 4. 全书物理页码编排与目录真实源映射表

全书物理页与原书纸质印刷页具有严格且唯一的常数偏移关系：
$$\mathbf{PHYSICAL\_PAGE} = \mathbf{BOOK\_PAGE} + 17$$
（例如：原书目录第 91 页 = PDF 物理第 108 页；原书目录第 103 页 = PDF 物理第 120 页）。

源文件位置：`task/工科数学分析基础 上册.pdf`（或 `test/data/工科数学分析基础 上册.pdf`）。

### 全书物理页码与章节规划表（全量真实源对照）

| 章节编号 | 章节标题 | 原书印刷页码 (Book Page) | PDF 物理页码 (Phys Page) | 当前重建状态 |
| :--- | :--- | :--- | :--- | :--- |
| **00** | 内容简介 / 说明 | - | Phys 1~12 | 已上线 (`00_内容说明.mdx`) |
| **01** | 绪论 | 页 1 ~ 3 | Phys 18 ~ 20 | 待视觉重建 |
| **第一章** | **极限理论与连续函数** | **页 4 ~ 90** | **Phys 21 ~ 107** | 待视觉重建 |
| 1.1 | 集合 映射与函数 | 页 4 ~ 22 | Phys 21 ~ 39 | 待视觉重建 |
| 1.2 | 数列的极限 | 页 23 ~ 42 | Phys 40 ~ 59 | 待视觉重建 |
| 1.3 | 函数的极限 | 页 43 ~ 61 | Phys 60 ~ 78 | 待视觉重建 |
| 1.4 | 无穷小量与无穷大量 | 页 62 ~ 71 | Phys 79 ~ 88 | 待视觉重建 |
| 1.5 | 连续函数 | 页 72 ~ 90 | Phys 89 ~ 107 | 待视觉重建 |
| **第二章** | **一元函数微分学** | **页 91 ~ 180** | **Phys 108 ~ 197** | **100% 视觉重建上线 (2.1~2.6 全 6 节全绿通过)** |
| 2.1 | 导数的概念 | 页 91 ~ 103 | Phys 108 ~ 120 | 100% 视觉推倒重建完成 (已上线) |
| 2.2 | 求导的基本法则 | 页 104 ~ 120 | Phys 121 ~ 137 | 100% 视觉推倒重建完成 (已上线) |
| 2.3 | 微分 | 页 121 ~ 130 | Phys 138 ~ 147 | 100% 视觉推倒重建完成 (已上线) |
| 2.4 | 微分中值定理及其应用 | 页 131 ~ 147 | Phys 148 ~ 164 | 100% 视觉推倒重建完成 (黄金对照样本) |
| 2.5 | Taylor定理及其应用 | 页 148 ~ 161 | Phys 165 ~ 178 | 100% 视觉推倒重建完成 (已上线) |
| 2.6 | 函数性态的研究 | 页 162 ~ 180 | Phys 179 ~ 197 | 100% 视觉推倒重建完成 (已上线) |
| **第三章** | **一元函数积分学** | **页 181 ~ 260** | **Phys 198 ~ 277** | **100% 视觉重建上线 (3.1~3.5 全 5 节全绿通过)** |
| 3.1 | 定积分的概念存在条件与性质 | 页 181 ~ 198 | Phys 198 ~ 215 | 100% 视觉推倒重建完成 (已上线) |
| 3.2 | 微积分基本公式与基本定理 | 页 199 ~ 210 | Phys 216 ~ 227 | 100% 视觉推倒重建完成 (已上线) |
| 3.3 | 两种基本积分法 | 页 211 ~ 230 | Phys 228 ~ 247 | 100% 视觉推倒重建完成 (已上线) |
| 3.4 | 定积分的应用 | 页 231 ~ 246 | Phys 248 ~ 263 | 100% 视觉推倒重建完成 (已上线) |
| 3.5 | 反常积分 | 页 247 ~ 260 | Phys 264 ~ 277 | 100% 视觉推倒重建完成 (已上线) |
| **第四章** | **常微分方程** | **页 261 ~ 320** | **Phys 278 ~ 337** | **100% 视觉重建上线 (4.1~4.3 全 3 节全绿通过)** |
| 4.1 | 几类简单的微分方程 | 页 261 ~ 280 | Phys 278 ~ 297 | 100% 视觉推倒重建完成 (已上线) |
| 4.2 | 高阶线性微分方程 | 页 281 ~ 304 | Phys 298 ~ 321 | 100% 视觉推倒重建完成 (已上线) |
| 4.3 | 线性微分方程组 | 页 305 ~ 320 | Phys 322 ~ 337 | 100% 视觉推倒重建完成 (已上线) |
| **第五章** | **多元函数微分学** | **页 321 ~ 410** | **Phys 338 ~ 427** | **100% 视觉推倒重建完成 (全 7 节零报错/实测通过)** |
| 5.1 | n维Euclid空间Rn中点集的初步知识 | 页 321 ~ 334 | Phys 338 ~ 351 | 100% 视觉重建与实测通过 (已上线) |
| 5.2 | 多元函数的极限与连续性 | 页 335 ~ 347 | Phys 352 ~ 364 | 100% 视觉重建与实测通过 (已上线) |
| 5.3 | 多元数量值函数的导数与微分 | 页 348 ~ 368 | Phys 365 ~ 385 | 100% 视觉重建与实测通过 (已上线) |
| 5.4 | 多元函数的Taylor公式与极值问题 | 页 369 ~ 384 | Phys 386 ~ 401 | 100% 视觉重建与实测通过 (已缝合补全) |
| 5.5 | 多元向量值函数的导数与微分 | 页 385 ~ 398 | Phys 402 ~ 415 | 100% 视觉重建与实测通过 (已剥离错位) |
| 5.6 | 多元函数微分学在几何上的简单应用 | 页 399 ~ 405 | Phys 416 ~ 422 | 100% 视觉重建与实测通过 (已上线) |
| 5.7 | 空间曲线的曲率与挠率 | 页 406 ~ 410 | Phys 423 ~ 427 | 100% 视觉重建与实测通过 (已上线) |
| **第六章** | **多元函数积分学** | **页 411 ~ 500** | **Phys 428 ~ 517** | **前 3 节已完成实测通过 (6.4 待接棒启动)** |
| 6.1 | 多元数量值函数积分的概念与性质 | 页 411 ~ 417 | Phys 428 ~ 434 | 100% 视觉重建与实测通过 (已上线) |
| 6.2 | 二重积分的计算 | 页 418 ~ 445 | Phys 435 ~ 462 | 100% 视觉重建与实测通过 (已上线) |
| 6.3 | 三重积分的计算 | 页 446 ~ 459 | Phys 463 ~ 476 | 100% 视觉重建与实测通过 (已上线) |
| 6.4 | 含参变量的积分与反常重积分 | 页 460 ~ 472 | Phys 477 ~ 489 | **当前流水线接棒推进起点** |
| 6.5 | 重积分的应用 | 页 473 ~ 478 | Phys 490 ~ 495 | 待视觉重建 |
| 6.6 | 第一型线积分与面积分 | 页 479 ~ 488 | Phys 496 ~ 505 | 待视觉重建 |
| 6.7 | 第二型线积分与面积分 | 页 489 ~ 494 | Phys 506 ~ 511 | 待视觉重建 |
| 6.8 | 各种积分的联系及其在场论中的应用 | 页 495 ~ 500 | Phys 512 ~ 517 | 待视觉重建 |
| **第七章** | **无穷级数** | **页 501 ~ 560** | **Phys 518 ~ 577** | 待视觉重建 |

---

## 5. 生产流水线工具箱使用说明

为实现全书无人值守或半自动批量构建，相关生产级脚本已在 `scripts/vision_reconstruct/` 部署就绪：

### 5.1 工具 1：PDF 物理页面切片器 (`slice_pdf_pages.py`)
使用 PyMuPDF 高保真无损切出 150 DPI 高清页面原图：
```bash
# 语法：--start <起始物理页> --end <结束物理页> --out <输出目录>
.venv/Scripts/python scripts/vision_reconstruct/slice_pdf_pages.py --start 121 --end 137 --out test/data/ch2_pages --dpi 150
```

### 5.2 工具 2：流式推理客户端 (`gemma_vision_client.mjs`)
在 Node.js 中直连 Gemma 4 视觉模型，自动附带思考截断指令、分片打印与 503 重试：
```javascript
import { streamGemmaVision } from '../../scripts/vision_reconstruct/gemma_vision_client.mjs';

const { text, thought } = await streamGemmaVision(prompt, [
  'test/data/ch2_pages/phys_121.jpg',
  'test/data/ch2_pages/phys_122.jpg'
]);
```

#### 5.3 工具 3：MDX 语法与 KaTeX 强校验门禁 (`scan-mdx.mjs`)
每生成一节必须执行，只有输出 `🎉 所有 MDX 与 KaTeX 数学公式均校验通过！` 方可落盘并提交：
```bash
node scripts/scan-mdx.mjs "src/content/docs/collections/math/engineering_analysis_rebuild/<章节文件名>.mdx"
```

### 5.4 工具 4：章节错位外科手术与缝合器 (`fix_sections_5_4_and_5_5.py` / `assemble_section_5_4.py`)
当发生思维链截断导致跨节串位或内容遗漏时使用：
- `fix_sections_5_4_and_5_5.py`：自动从目标章节中剥离误植的跨节段落（如剥离 5.5 开头误植的 5.4 节 250 行内容），并清理冗余公式标签；
- `assemble_section_5_4.py`：基于分块产物精确缝合完整推导、例题解答、最小二乘法对照表与有约束极值推导。

### 5.5 工具 5：大纲层级与卡片题干批量优化器 (`polish_all_hierarchies.py`)
用于全量扫描并修整 AST 结构与大纲规范：
- 自动消除正文中的冗余 `#` 一级标题；
- 自动将长达数百字的例题题干从 `title="..."` 转移至卡片内部主体，根除全局加粗与折行溢出；
- 自动闭合悬空的 `<Solution>` 卡片，规范大纲三级子标题。
```bash
.venv/Scripts/python scripts/vision_reconstruct/polish_all_hierarchies.py
```

### 5.6 工具 6：图像资产实体化与多子图合成器 (`materialize_ch5_ch6_figures.py`)
用于全量补齐几何插图与组合子图：
- 通过 PyMuPDF 自动将多张离散子图（如 (a) 椭圆、(b) 双带状、(c) 抛物面）矢量合成为标准紧凑的三联复合配图（如 `fig_5_5.png`）；
- 建立 MinerU 历史切图 Hash 与标准语义名 `fig_X_Y.png` 的映射并完成拷贝落盘，实现 100% 资产覆盖与 0 碎图。
```bash
.venv/Scripts/python scripts/vision_reconstruct/materialize_ch5_ch6_figures.py
```

### 5.7 工具 7：全章节批量流水线调度器 (`reconstruct_chapters_5_6.mjs`)
集成切片、分批推理、思考截断守护与拼装的一键式调度引擎：
```bash
# 执行单节构建（如第 6.4 节）：
node scripts/vision_reconstruct/reconstruct_chapters_5_6.mjs --section 6.4
```

---

## 6. 双轨隔离与全书渐进式构建规范（Invariants）

根据 `AGENTS.md` 核心架构第 10 条原则（*one boundary → one migration → one verification，严禁 Big Bang Rewrite*）：

1. **绝对双轨隔离原则**：
   - 生产环境旧目录：`src/content/docs/collections/math/engineering_analysis/`（严禁在全书重建全部完成前直接覆盖！保持原有线上版本可用）；
   - 测试重构新目录：`src/content/docs/collections/math/engineering_analysis_rebuild/`（所有全视觉新构建章节在此累加，目前已包含 25 篇就绪章节）；
2. **在线实时无缝对比**：
   - 用户与测试人员可通过浏览器访问 `http://localhost:4321`，在首页书架上自由切换两本书，并排查看旧版 vs 视觉重构新版在排版、公式与旁注上的巨大质感差异；
3. **分章推进节奏**：
   - 以“章”为阶段交付单元。第二、三、四、五章已全量完成，第六章已完成 6.1~6.3，当前聚焦推进第六章剩余章节（6.4~6.8）；
4. **Git 提交纯学术规范**：
   - 必须使用纯学术、克制、无表情符号的英文提交信息：
     - `feat(content): reconstruct chapter 6 section 4 using gemma-4 vision`
     - `fix(katex): resolve multiline cases tag parse errors in section 5.4`
     - `test(render): verify end-to-end routing and image accessibility for chapter 5 and 6`

---

## 7. 三层【真实情景实测】闭环验证体系 (3-Tier Real-Scenario Empirical Verification)

为确保“零报错、版面干净、层次清晰、学术克制”，本流水线首创并严格执行**三层立体质检门禁**：

```text
┌────────────────────────────────────────────────────────────────────────┐
│ Level 1: 静态编译与语法强校验 (Static Compiler Gate)                    │
│ node scripts/scan-mdx.mjs <directory_or_file>                         │
│ ➜ 门禁红线：100% 全绿，0 MDX 语法错误，0 KaTeX 解析报错，0 缺失本地图片     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Level 2: 开发服务器实时状态守护 (Dev Server Sentinel)                  │
│ astro dev status                                                      │
│ ➜ 门禁红线：Vite/Astro 开发服务器后台常驻（端口 4321），无悬挂死锁或崩溃    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Level 3: 端到端真实 HTTP 路由与 DOM 巡检 (E2E HTTP & DOM Inspector)    │
│ node scripts/test_real_scenario.mjs                                   │
│ ➜ 门禁红线：真实路由 HTTP 200 OK、DOM 中 0 处 .katex-error 红字、        │
│   <ExerciseTrigger /> 侧载组件成功就绪、全部 <img> 图片真实 GET 200 (0 碎图)│
└────────────────────────────────────────────────────────────────────────┘
```

### 7.1 实测执行 SOP
每完成一个批次或章节的构建清洗后，必须按顺序执行上述三层检验：
1. **执行 Level 1 静态扫描**：
   ```bash
   node scripts/scan-mdx.mjs "src/content/docs/collections/math/engineering_analysis_rebuild"
   ```
2. **确认 Level 2 服务存活**：
   若服务未启动，执行 `node node_modules/astro/bin/astro.mjs dev --background`；
3. **执行 Level 3 真实情景巡检**：
   ```bash
   node scripts/test_real_scenario.mjs
   ```
   脚本将真实遍历页面路由、深度检索 `.katex-error` 选择器、检验习题触发器挂载并对页面中所有图片资源发起实际 HTTP 请求，彻底消灭渲染白屏与碎图隐患。

---

## 8. 下一步 Agent 立即执行行动指南（Action Checklist）

当前第二、三、四、五章已全部就绪，第六章前 3 节（6.1~6.3）已全绿通过实测。接棒 Agent 启动时，请严格按以下步骤推进 **第六章第 6.4 节（含参变量的积分与反常重积分）**：

- [ ] **Step 1：物理切片（Phys 477 ~ 489）**
  对应原书印刷第 460 ~ 472 页（常数偏移 +17），运行切片命令：
  ```bash
  .venv/Scripts/python scripts/vision_reconstruct/slice_pdf_pages.py --start 477 --end 489 --out test/data/ch6_pages --dpi 150
  ```
- [ ] **Step 2：启动 Gemma 4 流式批处理**
  运行调度脚本执行第 6.4 节多批次生成：
  ```bash
  node scripts/vision_reconstruct/reconstruct_chapters_5_6.mjs --section 6.4
  ```
  *注意*：确保 Prompt 附带 `思考过程请保持极简（不超过 80 字简要大纲）`，防范 CoT 暴走。
- [ ] **Step 3：首尾咬合审查与配图实体化**
  - 检查分批生成结果首尾定理/例题是否完美咬合；
  - 运行配图补全工具将相关插图实体化至 `engineering_analysis_rebuild/images/`，使用 Markdown 图片语法与 `<figure class="vp-figure">` 包裹。
- [ ] **Step 4：层级修整与末尾习题解耦**
  - 确保正文无冗余 `#` 一级标题，二级标题从 `## 4.1 ...` 展开；
  - 识别到“习题 6.4”即刻切断，在章节末尾挂载：
    ```astro
    <ExerciseTrigger chapter={6} section="6.4" title="6.4 含参变量的积分与反常重积分 课后真题与自测练习" />
    ```
- [ ] **Step 5：执行三层【真实情景实测】**
  - Level 1: `node scripts/scan-mdx.mjs "src/content/docs/collections/math/engineering_analysis_rebuild/6.4_含参变量的积分与反常重积分.mdx"`
  - Level 3: 在 `scripts/test_real_scenario.mjs` 追加该节路由并执行，确保 HTTP 200、0 KaTeX 红字、图片全部 200 OK。
- [ ] **Step 6：纯学术英文 Git 提交**
  ```bash
  git add src/content/docs/collections/math/engineering_analysis_rebuild/6.4_*.mdx
  git commit -m "feat(content): reconstruct section 6.4 parametric and improper integrals using gemma vision"
  ```
