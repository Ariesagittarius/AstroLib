# Material You (Material 3) 现代学术设计规范与技术架构交接文档

> **生效日期**：2026-09-11  
> **核心宗旨**：全面以 **Material You (Material 3 / M3)** 风格为全站唯一核心设计语言，深度贯彻 Google 现代 Web 视觉范式与大学学术出版排版规范。  
> **交接对象**：所有承接 AstroLib 界面、组件、交互与视觉重构的后续 Agent  
> **开发环境**：Astro 7 + Starlight 0.41 本地后台开发服务器（`http://localhost:4321`）  
> **权威参考**：[Material Design 3 官方规范 (m3.material.io)](https://m3.material.io/) 与 `@material/web` 官方 Web Component 组件库  

---

## 〇、核心规范与第一性铁律（必须严格遵循）

所有后续承接本项目的 Agent 在进行任何界面设计、组件编写或样式调整时，**必须严格遵守以下五条核心铁律**：

### 1. 优先使用 Google 官方 Material 3 组件，坚决避免自造组件
- **组件首选**：凡是界面交互涉及标准控件，**必须优先使用 Google 官方 `@material/web` 组件**：
  - 开关控件：`<md-switch>`
  - 离散选项与过滤器：`<md-chip-set>`、`<md-filter-chip>`、`<md-assist-chip>`、`<md-input-chip>`
  - 用户输入与搜索：`<md-outlined-text-field>`
  - 触发按钮：`<md-filled-button>`、`<md-outlined-button>`、`<md-tonal-button>`、`<md-text-button>`、`<md-icon-button>`
  - 弹窗与确认框：`<md-dialog>`
  - 范围与字阶调节：`<md-slider>`
  - 单选与复选：`<md-radio>`、`<md-checkbox>`
  - 列表与分割线：`<md-list>`、`<md-list-item>`、`<md-divider>`
- **避免自造组件（No Reinventing the Wheel）**：严禁凭空发明自定义非标控件、手写复杂滑块轨道或拼凑多层灰色嵌套容器。

### 2. 界面全面对齐 Google 成熟 Web 产品设计蓝本
所有组件形态、间距骨架与状态流向，以 Google 官方已有的顶级 Web 产品为学习与对齐范式：
- **【Google Play】(`play.google.com`)**：
  - 离散选项的水平滚动 Filter Chip 组（`height: 32px/36px`，`border-radius: 8px`，选中着色 `secondary-container`）；
  - 极为克制的卡片层级，完全摒弃厚重描边与重阴影，以表面容器填色（Tonal Surfaces）区隔语义；
  - 呼吸感留白与扁平化网格。
- **【Gmail】(`mail.google.com`)**：
  - 顶部快速操作与工具栏（紧凑、清晰、图标与文字语义精确）；
  - 右下角标准悬浮动作按钮（`56px × 56px` FAB，`16px` 大圆角，`primary-container` 填色）；
  - 紧凑克制的抽屉侧边栏与微缩状态线框示意。
- **【Android Studio 官方开发文档】(`developer.android.com`)**：
  - 严肃、高可读性的现代技术与工程排版；
  - 侧边栏树形导航与当前章节指示（无多余色块污染，聚焦文字本身）；
  - 规范的代码高亮与精准参数对照表。
- **【Google 云端硬盘】(`drive.google.com`)**：
  - 克制沉稳的 Dialog 弹窗规范（`28px` 圆角，`surface-container-high` 背景，无边缘刺眼描边）；
  - 聚焦时 `2px solid primary` 的轮廓输入框；
  - 极佳的状态反馈与极低认知负荷。

### 3. 离散选项统一用 Chip 组，用户输入统一用 Inputbox
- **离散选项**：模式切换、单选、多选过滤器一律采用 **M3 Filter Chip 组**。
- **用户输入**：凡是文本、数值、URL、模型端点或搜索输入框，一律采用 **M3 Outlined Text Field**（`border-radius: 4px`，`1px solid outline` 描边，聚焦时 `2px solid primary`）。

### 4. 卡片采用无边框主题色填色卡片（Filled Tonal Cards）
- 章节翻页卡片（Pager）、自测习题入口卡片等大面积功能块，统一采用 **Filled Tonal 卡片范式**：
  - 背景色：`var(--md-sys-color-surface-container-low)`；
  - 边框：**完全无 1px 细线描边（`border: none`）**；
  - 圆角：`16px`（M3 Large Corner）；
  - 悬浮过渡：平滑过渡至 `surface-container`，严禁使用夸张浮雕或高光阴影。

### 5. 学术出版第一性原则与极端减法（Radical Subtraction）
- **内容即界面（The Content is the Interface）**：AstroLib 是大学级数学与科学教科书库，读者是大学生与严肃学者。
- **神圣红线**：UI 必须绝对服务于正文阅读，**严禁引入任何形式的学习管理玩具化元素**（无分数、无正确率、无打卡标签、无胶囊徽章堆叠、无彩色高亮框嵌套）。
- **公式纯正**：KaTeX 数学排版、Unicode 字符规范与 MDX 语义结构受到绝对保护，严禁任何破坏公式韵律与行内基线的样式污染。

---

## 一、关键文件与模块架构索引

| 关键文件路径 | 核心职责与架构说明 |
| :--- | :--- |
| [`src/themes/material-you/theme.css`](file:///d:/Antigravity/project/AstroLib/src/themes/material-you/theme.css) | **M3 核心样式层**：全站 Material 3 视觉层，集中覆盖 Design Tokens、Top App Bar、FAB、Dialog、Filter Chips、Outlined Text Fields、Switch、Filled Tonal Pagers 等。 |
| [`src/themes/material-you/index.ts`](file:///d:/Antigravity/project/AstroLib/src/themes/material-you/index.ts) | **M3 客户端运行时**：导入并注册官方 `@material/web` 组件（`md-switch`, `md-dialog`, `md-filter-chip`, `md-slider` 等），挂载全局 Overlay，提供自动水合逻辑。 |
| [`src/themes/material-you/color-engine.ts`](file:///d:/Antigravity/project/AstroLib/src/themes/material-you/color-engine.ts) | **动态色彩引擎**：基于 `@material/material-color-utilities` 实现 Google Chrome 风格的 4×4 色板预设与取色器，实时生成 HCT 算法驱动的 M3 完整色阶（Light / Dark）。 |
| [`src/components/ThemeSelectOverride.astro`](file:///d:/Antigravity/project/AstroLib/src/components/ThemeSelectOverride.astro) | **顶栏主题与外观切换入口**：默认以 `material-you` 启动首屏，注入首屏免闪烁脚本。 |
| [`src/components/FeatureToggles.astro`](file:///d:/Antigravity/project/AstroLib/src/components/FeatureToggles.astro) | **快速设置面板（Gmail 风格）**：顶栏快捷设置抽屉，包含字体预设、排版控制、UI风格展示（旧主题设为不可用并标注已封存）、M3 动态主题色 4×4 矩阵与功能开关。 |
| [`src/scripts/feature-toggles.ts`](file:///d:/Antigravity/project/AstroLib/src/scripts/feature-toggles.ts) | **设置项状态机**：管理 localStorage、动态广播与状态同步，确保多实例一致。 |
| [`src/components/SidebarOverride.astro`](file:///d:/Antigravity/project/AstroLib/src/components/SidebarOverride.astro) | **左侧栏适配器**：章节阅读扁平化展开当前书籍目录，具备 Android Studio 文档级别的干净纯粹度。 |
| [`src/components/ai/ChatDrawer.astro`](file:///d:/Antigravity/project/AstroLib/src/components/ai/ChatDrawer.astro) | **AI 问答表现层**：对标 Gmail / Material 3 的 56×56 FAB 与 28px 圆角 Dialog 弹窗。 |
| [`src/components/exercises/ExerciseModal.astro`](file:///d:/Antigravity/project/AstroLib/src/components/exercises/ExerciseModal.astro) | **习题自测与导出模态窗**：Filter Chips 选项组、Outlined Text Fields、无边框 Tonal 卡片与 M3 胶囊操作按钮。 |
| [`src/styles/fonts.css`](file:///d:/Antigravity/project/AstroLib/src/styles/fonts.css) | **字体系统定义**：解耦中英文阅读字体栈，提供 `--font-reading` 统一派发。 |

---

## 二、Material 3 规范在各业务模块的具体落地

### 1. 顶栏与全站布局 (Top App Bar & Layout)
- **Small Top App Bar**：高度为规范 `3rem`（48px/64px），底色在浅色下为纯白 `#ffffff`，深色下为 `surface-container-low`（`#131314`），配合 `1px solid outline-variant` 分隔，**完全去除任何模糊发虚的毛玻璃**，对标 Chrome / Google Web 沉稳纯色体系。
- **Brand 图标与站名**：克制紧凑，微阴影与 0.2s 缓动微动效。
- **顶栏图标设计原则（空心优先与审慎判断）**：
  - **优先选用空心或半空心设计，拒绝大面积粗重实心黑块**：如日夜太阳、齿轮、GitHub 徽标均全面空心化，打破大黑圆饼造成的视觉沉重感；
  - **审慎判断、拒绝机械教条**：对于特殊细碎点阵形态（如 9 点工具箱 `apps` 图标），过细的空心圆环在小尺寸下易产生杂色与噪点，适度采用精细微填充（`r=1.5` 实心圆点）更为扎实锐利；
  - **大纲入口 (`toc`)**：三条横线骨架搭配右侧 3 个细环空心定位圆（`r="1.5"`），告别粗重黑方块；
  - **工具箱入口 (`apps`)**：9 个精细微填充圆点（`r="1.5"`），清晰扎实且与右侧空心图标群相映成趣；
  - **日夜切换 (`light_mode` / `dark_mode`)**：采用双层空心圆环太阳（镂空内芯 + 8 向射线）与双弧镂空月牙，杜绝实心黑球；
  - **设置入口 (`settings`)**：采用 Google 官方 Outlined 空心齿轮（齿圈与轴心通透）；
  - **GitHub 入口**：覆盖默认带黑圆底盘的硬币贴片，采用 GitHub 官方 Primer Octicon 纯净矢量；
  - **尺寸规格**：统一严格为 `20px × 20px`（`viewBox="0 0 24 24"`），居中对齐于 34px/40px 圆形 hover 底座。

### 2. 快速设置面板 (Quick Settings & Feature Toggles)
- **对齐 Gmail 风格**：面板右上角收起，顶部配备“恢复默认设置”药丸操作按钮（`.ft-m3-see-all-btn`）。
- **主题风格封存**：UI 预设列表中，Material You 作为唯一首选高亮；历史主题（VitePress / Starlight）设置为 `disabled` 不可用状态，带有 `is-disabled` 弱化样式、禁止手势与 `（已封存）` 明确状态标记。
- **色彩矩阵**：Chrome 风格 4×4 颜色球与动态自定义颜色采集器，实时通过 `color-engine.ts` 演算出精准的 primary / secondary / tertiary / surface-container-low/high 等 30+ 维度的设计令牌。

### 3. 开关组件 (Switch)
- **双轨可靠机制**：
  - 运行时挂载官方 `<md-switch>` Web Component。
  - 回退环境下使用 `position: relative; width: 52px; height: 32px;` 的等规纯 CSS 椭圆轨道与圆形滑块，确保任何状况下绝无丢失。

### 4. 章节翻页与功能卡片 (Filled Tonal Cards)
- **底栏翻页**：上一节 / 下一节由传统的单薄 1px 细线边框升级为 M3 官方 Filled Tonal 卡片：
  - `background: var(--md-sys-color-surface-container-low)`
  - `border: none`
  - `border-radius: 16px`
  - 悬浮时过渡至 `var(--md-sys-color-surface-container)`
- **自测入口卡片**：采用同等规格的无边框 Tonal 卡片设计。

### 5. 模态窗口与浮层 (Dialogs & Overlays)
- **视窗挂载容器**：所有弹窗、抽屉与浮动面板统一挂载至全站根容器 `#astro-overlay-root`，遵从 `src/styles/tokens/layers.css` 定义的 `--layer-*` 层级规范，杜绝 z-index 随意攀比。
- **Dialog 形态**：严格遵守 `28px` 圆角、`surface-container-high` 填充、无外边框，背景遮罩使用 32% 纯黑蒙层。

---

## 三、后续 Agent 实施与审查待办列表 (Backlog)

1. **自测习题主答题界面（ExerciseModal 题面与题解）深度 M3 审查**：
   - 检查题型过滤器（单选/多选/解答），确保全部采用 `<md-filter-chip>` 或标准 Filter Chip 样式；
   - 选项按钮（`.ex-option-btn`）统一对齐 M3 Outlined / Tonal 选项风格。
2. **书籍模块巡检（Module Inspector）与关系图谱（Relation Graph）浮窗对齐**：
   - 抽屉与浮窗顶栏对齐 M3 Small Top App Bar；
   - 搜索输入框全面升级为 M3 Outlined Text Field。
3. **行内正文卡片（Card Components）的 M3 纯净呈现**：
   - 保持 11 种卡片的学术纯净度，引入 `--md-sys-color-surface-container-low` 柔和填色；
   - 严禁任何彩色粗边框、药丸标签或低幼化徽章。

---

## 四、开发与验证防踩坑守则

1. **开发服务器管理**：
   - 必须使用后台模式：`astro dev --background`（或通过 node 运行）。
   - 检查状态：`astro dev status`。
2. **Switch 布局绝对红线**：
   - 永远不要将 `.ft-switch` 的 `position` 设为 `static`，必须保持 `position: relative; width: 52px; height: 32px;`。
3. **提交前自动化验证管线**：
   ```bash
   # 1. 视窗层级（Window Layer Lint）检查
   node scripts/check-window-layers.mjs

   # 2. KaTeX 公式规范与语法检查
   npm run check:katex

   # 3. MDX 语法校验
   node scripts/scan-mdx.mjs src/content/docs/dev
   ```
4. **Git 提交标准**：
   - Commit message 必须是纯英文学术风格（如 `feat(ui): standardize material 3 official components and documentation`），禁止中文、禁止 Emoji、禁止 AI 浮夸辞藻。
   - 推送必须走沙箱脱敏脚本：`npm run push:clean`。
