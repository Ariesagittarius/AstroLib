# Material You (Material 3) Theme for AstroLib

## 1. 概述与设计定位

本目录实现了 AstroLib 的 **Material You (Material 3) 风格主题**。

该主题旨在为 AstroLib 的学术教辅环境提供一套现代、克制、富有呼吸感的 Material 3 界面质感：
* **Tonal Surfaces**：采用现代 M3 灰度阶梯（`surface`、`surface-container-low`、`surface-container`、`surface-container-high`），告别单纯的线框堆砌与单调白底。
* **Restrained Elevation**：使用柔和的扩散阴影阶梯与环境反光。
* **Academic UI Interpretation**：仅将 M3 语言应用于 UI 壳层（顶栏、侧边栏导览、操作按钮、对话框、浮动反馈），**绝对不修改正文排版（.sl-markdown-content）、KaTeX 公式或学术卡片**。
* **Official Components Primitive**：直接使用 Google 官方 `@material/web`（Web Components / Lit），杜绝粗制滥造的仿制实现。

---

## 2. 核心架构红线与可拆卸契约 (Removability Contract)

本主题遵循严格的边界隔离原则：

> **删除整个 `src/themes/material-you/` 目录后，AstroLib 其它主题（VitePress / Starlight）和全站核心业务功能仍然能够无缝正常工作。**

### 隔离保证：
1. **严格限定 CSS 作用域**：所有样式规则全部以 `html[data-site-theme='material-you']` 为前缀，严禁声明无前缀的 `button`、`input`、`dialog`、`p`、`h1` 全局样式。
2. **字体分工严格解耦**：
   * UI Chrome（顶栏、菜单、按钮、对话框、提示标签）→ `--md-sys-typescale-*`（基于 `--vp-font-family-base` / `--sl-font`）
   * 教材正文排版（定理、推导、例题、练习、数学公式）→ 严格保持 `--font-reading`
3. **遵守 Window Layer 基础设施**：
   * `<md-dialog>` 挂载于 `--layer-dialog` (`500`)
   * `<md-menu>` 挂载于 `--layer-popover` (`300`)
   * Material Snackbar 挂载于 `--layer-toast` (`700`)
   * 严禁声明新的 `z-index` 魔数。
4. **统一挂载点**：
   * 所有全局浮动视窗直接挂载至 `#astro-overlay-root`，不创建任何独立的 theme overlay root。

---

## 3. 目录与文件清单

```text
src/themes/material-you/
├── tokens.css    # Material 3 全套系统设计令牌（M3 System Tokens）与 Starlight 变量桥接
├── theme.css     # UI 壳层表现、Window Layer 消费与 @material/web 样式集成
├── index.ts      # 按需动态加载 @material/web、Dialog / Snackbar 运行时调度
└── README.md     # 本设计与运维说明文档
```

---

## 4. Vertical Slice (垂直切片验证)

在 `html[data-site-theme='material-you']` 模式下：
1. 顶栏右侧调色板按钮唤起 **`<md-dialog>`**；
2. 对话框内使用 **`<md-outlined-button>`** 触发 **`<md-menu>`** 与 **`<md-menu-item>`**；
3. 切换主题后自动触发 **Material Snackbar** 反馈（`--layer-toast`）；
4. 当切换回 `vitepress` 或 `starlight` 时，界面即刻恢复原主题，无任何 Material 样式或 DOM 污染残留。

---

## 5. Global UI Shell (Phase 3 架构覆盖)

Material You 在 AstroLib 中完整覆盖通用 UI 壳层：
1. **Header & Top Navigation**：Tonal Surface 顶栏（`--md-sys-color-surface-container`），圆角胶囊与圆形图标按钮，品牌强调色。
2. **Controls (Theme / Font / Settings)**：M3 风格化外观开关（滑块胶囊）、双栏字体面板、功能开关底部抽屉（Mobile Bottom Sheet）。
3. **Search UI**：全圆角胶囊搜索入口条与 M3 规范的 Pagefind 模态对话框。
4. **Navigation Drawer (Left Sidebar)**：M3 Tonal Surface 侧栏与全圆角导览指示药丸（`secondary-container` 选中态）。
5. **TOC & Floating Action Controls**：胶囊动作按钮、3px 圆角高亮条、Extended FAB 浮动按钮。
6. **Mobile Shell**：支持沉浸式顶栏、侧滑抽屉与 Bottom Sheet 拖拽手柄。
