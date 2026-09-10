# Material You (Material 3) 风格改造与合规审计交接文档

> **交接日期**：本阶段工作完成时（2026-09-09）  
> **交接对象**：后续继续推进 AstroLib Material You (M3) 主题、组件合规及视觉重构的 agent  
> **服务运行环境**：Astro 5 + Starlight 0.41 本地开发服务器（`http://localhost:4321`，后台常驻运行）  
> **基准规范**：[Material Design 3 官方规范 (m3.material.io)](https://m3.material.io/) 与 `@material/web` 官方组件库  

---

## 〇、核心原则与铁律（必须严格遵守）

后续承接本任务的 agent 在进行任何样式或组件改动时，**必须严格遵守以下四条核心原则**：

1. **绝对禁止自编组件，严格使用 MD3 官方语言**：
   > *“最重要：使用 md3 库已有组件（switch 等等），禁止自编组件！”*  
   所有组件的形态、交互、层级、状态和语义，必须严格符合 Google Chrome / Material 3 官方标准。严禁凭空发明非标的自定义控件、多层灰色套娃容器或非标开关。
2. **离散选项统一用 Chip 组，用户输入统一用 Inputbox**：
   > *“（选项统一用 chip 组，输入统一用 inputbox）”*  
   - 凡是模式切换、单选、过滤器等离散选项，一律采用 **M3 Filter Chip 组**（`height: 32px` 或 `36px`，`border-radius: 8px`，未选为 `outline-variant` 描边，选中为 `secondary-container` 软色填色）。
   - 凡是文本、数值、URL 或搜索输入框与下拉框，一律采用 **M3 Outlined Text Field (Inputbox)**（`border-radius: 4px`，`outline` 描边，聚焦时 `2px solid primary`）。
3. **卡片采用无边框主题色填色卡片（Filled Tonal Cards）**：
   章节翻页、自测习题入口等大面积卡片，参照 M3 官网（`m3.material.io`）底栏范式，采用 `surface-container-low` 填色、`16px` 大圆角、**完全无 1px 细线描边**的 Tonal 卡片，悬浮时平滑过渡至 `surface-container`。
4. **学术出版第一性原则与极端减法**：
   严格遵循 `AGENTS.md`：AstroLib 是大学级数学与科学教科书库，“内容即界面”，绝不可因套用 UI 框架而引入任何破坏排版严谨性的花哨元素。公式字体、KaTeX 排版与 MDX 源码结构为神圣红线，严禁任何形式的破坏。

---

## 一、关键文件与模块索引

| 关键文件路径 | 核心职责与改动点 |
| :--- | :--- |
| [`src/themes/material-you/theme.css`](file:///d:/Antigravity/project/AstroLib/src/themes/material-you/theme.css) | **M3 核心样式层（最关键）**：全站所有 M3 视觉覆盖规则集中于此，使用 `html[data-site-theme='material-you']` 强作用域隔离。涵盖 Design Tokens、Top App Bar、FAB、Dialog、Filter Chips、Outlined Text Fields、Switch、Filled Tonal Pagers 等。 |
| [`src/themes/material-you/index.ts`](file:///d:/Antigravity/project/AstroLib/src/themes/material-you/index.ts) | **M3 客户端运行时**：导入并注册 `@material/web` 组件（`md-switch`, `md-dialog`, `md-filled-button` 等），挂载 overlay，提供 `upgradeSwitchesToMaterialWeb` 与 `upgradeAppearanceSwitchToMaterialWeb` 自动水合逻辑。 |
| [`src/components/ThemeSelectOverride.astro`](file:///d:/Antigravity/project/AstroLib/src/components/ThemeSelectOverride.astro) | **顶栏主题与字体切换入口**：挂载 `<starlight-theme-select>` 与 `<starlight-feature-toggles>`，注入首屏字体与主题即时预选 script。 |
| [`src/components/FeatureToggles.astro`](file:///d:/Antigravity/project/AstroLib/src/components/FeatureToggles.astro) | **全站设置抽屉（面板 DOM）**：字体预设、主题切换、功能开关、AI 模型/密钥配置。所有开关统一由 `.ft-switch` 承载，选项统一由 `.ft-segment-track` 承载。 |
| [`src/scripts/feature-toggles.ts`](file:///d:/Antigravity/project/AstroLib/src/scripts/feature-toggles.ts) | **设置项状态机**：管理 localStorage、功能开关广播、字体切换即时应用 (`applyFontPref`) 与 switch 状态双向同步。 |
| [`src/components/SidebarOverride.astro`](file:///d:/Antigravity/project/AstroLib/src/components/SidebarOverride.astro) | **左侧栏适配器**：章节阅读模式下扁平化展开当前书籍目录，剥离无意义的分类折叠层。 |
| [`src/components/ai/ChatDrawer.astro`](file:///d:/Antigravity/project/AstroLib/src/components/ai/ChatDrawer.astro) | **AI 问答表现层**：`.ask-fab`（悬浮球）与 `.ask-panel`（对话弹窗）。 |
| [`src/components/exercises/ExerciseModal.astro`](file:///d:/Antigravity/project/AstroLib/src/components/exercises/ExerciseModal.astro) | **习题自测与学术导出模态窗**：包含阶段 1 排版配置（`.ex-typst-config-pane`）与右侧交付卡片（`.ex-delivery-card`）。 |
| [`src/styles/fonts.css`](file:///d:/Antigravity/project/AstroLib/src/styles/fonts.css) | **字体系统定义**：解耦中英文阅读字体栈，提供 `--font-reading` 统一派发。 |

---

## 二、本阶段已交付的改动清单

### 1. 导出学术 LaTeX / PDF 模态窗（M3 全量重写）
- **选项全部转为 M3 Filter Chip 组**：
  - 排版版式（`.ex-segmented-control`）：学术讲义练习本 / 课程自测试卷。
  - 卷头模式（`.ex-typst-radio-group`）：标准学术卷头 / 紧凑单行卷头 / 无卷头纯题面。
  - 作答书写留白：充裕留白 / 紧凑排版 / 无留白。
  - 参考答案附录：独立文末附录 / 随题附解 / 不输出答案。
  - *重构手法*：隐藏原生单选 radio 与无意义多行小字说明，统一为 `36px` 高、`8px` 圆角的 M3 Chip，选中时高亮 `secondary-container`。
- **输入全部转为 M3 Outlined Text Field**：
  - 文档主标题（`#ex-latex-title-input`）、副标题（`#ex-latex-subtitle-input`）及纸张尺寸、出版风格、正文字号、页码展示格式下拉框，统一为 `44px` 高、`4px` 圆角、`1px solid outline` 的标准输入框。
  - 移除包裹在卷头设置外的多层浅灰底嵌套卡片（`.ex-header-meta-details`），还原纯净留白。
- **交付卡片与按钮**：
  - 右侧 Overleaf、本地源码、云端编译三张卡片重塑为 `16px` 圆角的 M3 Tonal 卡片。
  - 主按钮（`.ex-btn-primary`）为 M3 Filled 胶囊按钮，辅助按钮（`.ex-btn-secondary`）为 M3 Tonal 胶囊按钮。

### 2. 设置项面板（FeatureToggles）Switch 修复与克制化
- **根除 Switch 丢失与错位 Bug**：
  - 历史版本中曾对 `.ft-switch` 使用 `position: static !important;`，导致内部绝对定位的 `.ft-switch-slider` 脱离包含块进而塌陷消失。
  - 现已彻底更正：`.ft-switch` 保持 `position: relative !important;`，严格设定为 M3 官方规格 `52px × 32px`。
  - 双轨机制：运行时若挂载了官方 `<md-switch>`，则无缝显现 Web Component；若尚未水合或在纯 CSS 环境下，纯 CSS 回退滑块呈现**像素级一致的 M3 椭圆轨道与圆形滑块**（未选中时带 outline 描边与 16px 圆钮，选中时为 primary 轨道与 24px 放大白钮），**保证任何情况下开关绝不丢失**。
- **字体与主题选项转为 Filter Chips**：
  - 中文字体（系统无衬线/系统宋体/思源黑体/思源宋体）、英文公式字体（无衬线/衬线/KaTeX）、界面主题、章节预加载选项，全部转换为水平排列的 M3 Filter Chips（`height: 32px`、`border-radius: 8px`）。
- **AI 配置项与按钮尺寸收拢**：
  - 模型与端点输入框采用 M3 Outlined Text Field（`height: 40px`、`border-radius: 4px`）。
  - 测试连接、保存模型等操作按钮收拢为 M3 标准克制尺寸（`36px` / `32px` 胶囊按钮），解决“按钮过大”的问题。

### 3. AI 问答触发器 (FAB) 与对话面板
- **触发器重构为标准 56×56 FAB**：
  - 移除原胶囊中的“AI 问答”文字，固定为 `56px × 56px`。
  - `border-radius: 16px`（M3 Large Corner），填充 `primary-container`，居中 24px 闪烁星芒图标，配置 Elevation Level 3。
- **对话面板重构为 M3 Dialog**：
  - 面板圆角设定为 `28px`（M3 Extra Large Corner），背景采用 `surface-container-high`。
  - 顶部栏对齐 M3 Small Top App Bar；会话标签重写为 M3 Input Chip（带 `[✕]` 删除钮）；底部提问栏升级为 M3 轮廓胶囊输入框与 40px 圆形发送按钮。

### 4. 章节翻页与习题卡片（Filled Tonal Cards）
- 对照 `media_1788952552839.png`（M3 官网）：
  - 底部**上一节 / 下一节**章节翻页卡片（`.prev-next .pager-link`、`.pagination-links a`）从 1px 细线描边卡片重写为**无边框软色填色卡片**：
    - `background-color: var(--md-sys-color-surface-container-low)`
    - `border: none`
    - `border-radius: 16px`
    - 悬浮时平滑过渡至 `surface-container`。
  - 习题自测触发卡片（`.exercise-trigger-card`）同步重构为一致的无边框 Tonal 卡片。

### 5. 侧边栏与字体切换逻辑
- **左侧栏单书扁平化**：在 [`SidebarOverride.astro`](file:///d:/Antigravity/project/AstroLib/src/components/SidebarOverride.astro) 中解开 `currentBookEntries = books[0].entries`，在阅读章节时直接列出当前书籍章节，去除非必要的“数学 → 线性代数”等外层折叠组。
- **左侧栏高亮悬浮 Bug 修复**：为激活项补充 `a[aria-current='page']:hover` 等选择器，确保鼠标移入激活章节时主题色高亮不会异常消失。
- **字体切换立即生效**：分离 CJK 与 Latin 字体堆叠，`ThemeSelectOverride.astro` 注入即时执行脚本，`feature-toggles.ts` 启动即调 `applyFontPref`。

---

## 三、下一任 Agent 的任务待办列表 (Backlog)

后续接手 M3 主题工作的 agent 请按优先级推进以下具体任务：

### 待办 1：自测习题主答题界面（ExerciseModal 题面与题解）细化 M3 审计
- **现状**：LaTeX / PDF 导出子模态窗已全面 M3 化，但用户点击“进入自测”打开的**习题解析主弹窗**中：
  - 题目题型过滤器（选择题 / 填空题 / 解答题）仍可进一步精简为标准 M3 Filter Chips。
  - 单选答案选项按钮（`.ex-option-btn`）可对齐 M3 Outlined / Tonal 选项风格。
- **目标**：检查 `src/components/exercises/exercise-theme.css` 与 `theme.css`，确保题解弹窗与题型过滤器同样贯彻“选项统一用 chip 组，输入统一用 inputbox”。

### 待办 2：书籍模块巡检（Module Inspector）与关系图谱（Relation Graph）浮窗对齐
- **现状**：Alt+M 快捷键唤起的模块巡检面板（`.insp-panel`）与章节图谱弹窗（`.brg-modal`）目前已有基础 M3 变量覆盖。
- **目标**：
  - 巡检抽屉顶栏对齐 M3 Top App Bar。
  - 巡检筛选 Chip 组与搜索输入框规范化为 M3 Outlined Text Field。

### 待办 3：行内正文卡片（Card Components）的 M3 表现审查
- **现状**：当前正文中的例题、定理、知识点、解析等 11 种卡片沿用无边框 soft 背景（VitePress custom-block 式），与学术阅读契合良好。
- **审计要求**：
  - 若需进一步融合 Material You，可在 `theme.css` 中为卡片引入 `--md-sys-color-surface-container` / `--md-sys-color-surface-container-low` 变量映射。
  - **切记禁令**：严禁给卡片加上厚重彩色边框、药丸胶囊徽章或任何花哨装饰，必须保持纯净学术排版。

---

## 四、开发与验证防踩坑守则

1. **开发服务器管理（严禁在前台卡住命令行）**：
   - 必须使用后台模式：`astro dev --background`（或通过 node 运行）。
   - 检查状态：`astro dev status` 或 `node node_modules/astro/bin/astro.mjs dev status`。
2. **样式优先级与作用域隔离**：
   - 所有 M3 样式必须被限定在 `html[data-site-theme='material-you']` 选择器内，严禁污染 VitePress 风格与 Starlight 经典主题。
   - 由于 Astro 组件 Scoped CSS 会注入 `data-astro-cid-*`，全局覆盖类通常需使用 `!important` 确保稳定压制。
3. **Switch 组件防踩坑**：
   - 永远不要将 `.ft-switch` 的 `position` 设为 `static`。
   - 必须保持 `position: relative; width: 52px; height: 32px;`。
4. **提交前自动化验证管线**：
   任何修改提交前，务必顺序执行以下两项自动化检查：
   ```bash
   # 1. 视窗层级（Window Layer Lint）检查
   node scripts/check-window-layers.mjs

   # 2. KaTeX 公式规范与语法检查
   npm run check:katex
   ```
5. **Git 提交与发布标准**：
   - Commit message 必须是纯英文学术风格（如 `fix(ui): harmonize m3 filter chips and pager cards`），禁止中文、禁止 Emoji、禁止 AI 浮夸辞藻。
   - 严禁直接运行 bare `git push origin`。若需推送，必须走沙箱脱敏脚本：
     ```bash
     npm run push:clean
     ```

