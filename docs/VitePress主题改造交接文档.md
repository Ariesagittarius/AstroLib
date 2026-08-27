# VitePress 风格改造交接文档

> 交接日期：本阶段工作完成时
> 提交：`e898c0e 修改组件风格为VitePress`（已推送 origin/main，工作树干净）
> 交接对象：后续继续本主题或相关工作的 agent

## 〇〇、进度更新（移动端顶栏一体化 + 左侧栏 VitePress 侧滑抽屉，已完成）

> 日期：紧随 069f38b 之后的本阶段
> 验证：astro dev 下章节页（数学分析/大学物理）编译 200 无错，CSS/JS 均注入；浏览器端交互由用户验收
> 提交：**未提交**（等待用户决定是否 git push）

- **左侧栏入口挪到顶栏左侧**：Starlight 的 `starlight-menu-button` 原是固定在顶栏**右侧**的浮动圆钮，现改为 fixed 顶栏**左侧**的透明汉堡按钮（bars/close 图标，hover 圆角 soft 底），站名右侧让位 3.5rem
- **右侧大纲入口并入顶栏右侧**：原「顶部 sticky 条 + popup 面板」形态废弃——大纲按钮由 JS 搬运进顶栏右侧 `.right-group`（与社交/主题并列），popup 面板从按钮下方弹出；`--sl-mobile-toc-height` 归零（不再占一行）
- **左侧栏改为 VitePress 侧滑抽屉**：`.sidebar-pane` 由 Starlight 默认「header 下缘到屏幕底的全宽上下抽屉」改为 `translateX(-100%) → 0` 左侧滑入窄面板（宽 `calc(100vw - 4rem)` / max 20rem，对照 `VPSidebar.vue`），配合 `::before` 遮罩（VPBackdrop 语义）；关闭 = 汉堡按钮（变 X）或点击遮罩
- 对照源码：`task/theme/theme-default/components/VPSidebar.vue`、`VPNavBarHamburger.vue`、`VPLocalNavOutlineDropdown.vue`

### 改动文件

| 文件 | 改动 |
| --- | --- |
| `src/styles/custom.css` | 重写移动端区块：删旧 sticky 条占位/补偿逻辑；hamburger 定位到顶栏左侧；抽屉 transform + 遮罩；`.right-group` 纯移动端强制显示为只含大纲按钮；`--sl-mobile-toc-height: 0rem` |
| `src/styles/vitepress-theme.css` | 区块 11 改造：按钮/面板适配顶栏内（`top: calc(100% + 0.5rem)`、`right: 0`、`width: min(20rem, …)`）；**新增区块 12**：移动端站名让位、抽屉内边距/滚动条、菜单按钮图标尺寸 |
| `src/components/PageSidebarOverride.astro` | `setupVPLocalNav` 搬运目标：`header.after(nav)` → `rightGroup.prepend(nav)` |
| `src/components/SidebarOverride.astro` | SPA 脚本新增「点击遮罩/抽屉外关闭」（VitePress VPBackdrop 行为） |

### 关键点（勿回退）

1. **修正坏选择器**：`data-mobile-menu-expanded` 由 Starlight 加在 **`<body>`** 上，原 `html[data-mobile-menu-expanded] .vp-local-nav` 永不匹配（"左菜单展开时 local nav 让位"从未生效），已改为 `body[...]`，让位逻辑现在真正工作
2. **断点**：<50rem 抽屉+汉堡+顶栏大纲按钮；50–72rem 左侧栏固定显示、社交/主题/大纲按钮并列顶栏右侧；≥72rem 大纲按钮隐藏（右侧栏固定显示）
3. **抽屉从 header 下缘开始**（`inset-block: nav-height 0`），顶栏与汉堡始终可见可关（z-index 遮罩 4 < 抽屉 5 < 顶栏 10）；VitePress 官方是全高抽屉，本站在此有意取舍
4. **级联顺序**：站名让位 `.header { padding-inline-start: 3.5rem }` 必须写在 vitepress-theme.css（后加载），否则被区块 9 的 `padding-inline: 1.5rem` 覆盖
5. 打印/PDF：vp-local-nav 与 sidebar 打印隐藏逻辑保留

## 〇、进度更新（移动端大纲 VPLocalNav 化，已完成）

> 日期：紧随 e898c0e 之后的本阶段
> 提交：`069f38b 移动端右侧大纲改造为 VitePress VPLocalNav 风格`、`f25e1ff 在线精修工具 + refs static`（均已推送 origin/main）
> 验证：astro dev 下 CSS 与章节页编译 200 无错；移动端断点/交互逻辑已实现，浏览器端视觉效果由用户验收

- 右侧大纲**移动端**形态从"底部抽屉（FAB+遮罩+drawer）"改为 VitePress VPLocalNav 顶部 sticky 条 + popup 大纲面板（见区块 11）
- **桌面端**右侧大纲的 VitePress 化（区块 8）在上一阶段已完成，本阶段补齐移动端，右侧大纲现已全端 VitePress 化
- 断点对齐项目右侧栏：<72rem 显示 local nav（右侧栏隐藏），≥72rem 右侧栏显示、local nav 隐藏
- 同一批推送还包含之前会话遗留的未提交工作：在线可视化精修工具（dev-only）、`refs` 切换 static（详见 `docs/精修工具交接.md`）

## 一、任务概述

将本站（Astro 7 + Starlight 0.41 数学教辅数字化文档站）从 Starlight 默认观感改造为 **VitePress 官方主题视觉与排版**。已交付：

1. 全站配色/字体/顶栏/侧栏/正文排版 VitePress 化（新增覆盖层 CSS）
2. 首页改造为 VitePress Hero + Feature 卡片风格
3. 正文模块卡片（例题/知识点/解析等 11 种）参照 VitePress custom-block 重构（去边框、去 emoji、VitePress 字号体系）

用户已验收并自行推送，**无需再推送**。

## 二、改动文件清单

| 文件 | 改动 | 说明 |
| --- | --- | --- |
| `src/styles/vitepress-theme.css` | **新增（核心，~400 行）** | 主题覆盖层，含 7 个区块（见下） |
| `astro.config.mjs` | customCss 数组末尾注册上文件 | 注释标明"删除即可整体回退" |
| `src/pages/index.astro` | 全量重写 | VitePress Hero + Feature 图书卡片，内置亮/暗色板 |
| `src/scripts/sidebar-resizer.ts` | `DEFAULT_WIDTH` 18.75rem→17rem | 否则拖拽引擎会覆盖回 300px |
| 11 个卡片组件 `.astro` | 标题去除 emoji 前缀 | Example/Variant/Exercise/Method/Summary/Knowledge/Note/Analysis/Guide/Block/Solution |
| `src/components/PageSidebarOverride.astro` | 移动端大纲形态重写 | 底部抽屉（FAB+遮罩+drawer）→ VitePress VPLocalNav 顶部 sticky 条 + popup 大纲面板（详见区块 11） |
| `src/styles/custom.css` | 移动端功能样式替换 | 旧 FAB/遮罩/抽屉样式块 → `vp-local-nav` 断点/滚动锁/占位高度 |
| `src/styles/vitepress-theme.css` | 新增区块 11 + 8 区块作用域迁移 | VPLocalNav VitePress 观感（按钮/面板/大纲项/过渡）；`.mobile-toc-drawer .toc-*` 作用域改 `.vp-local-nav .toc-*` |

### vitepress-theme.css 区块结构

1. **色板映射（亮）**：`--sl-color-*` → VitePress light 色值（bg #ffffff / 侧栏 #f6f6f7 / 分割线 #e2e2e3 / 文字三阶 / 品牌 indigo #3451b2）
2. **色板映射（暗）**：VitePress dark（bg #1b1b1f / 侧栏 #161618 / 品牌 #a8b1ff），含无 `data-theme` 兜底
3. **字体**：VitePress 字体栈（含中文回退）
4. **顶栏**：恒 4rem 高、站名 1rem/600、留白 1.5rem/2rem、半透明毛玻璃
5. **侧栏**：宽 17rem、无右边框、padding 1.5rem 6rem、链接 14px/500/行高 1.714、hover 仅变色、当前项品牌色+600、分组标题 14px/700、嵌套 1rem 缩进
6. **正文排版**：h2 顶部细分隔线、链接下划线、引用 2px 左边框、表格全边框+隔行、行内代码品牌色胶囊、pre 圆角
7. **卡片 custom-block 化**：无边框、soft 背景（亮 8%/暗 12% 透明度）、字号 0.875rem、行高 1.7142857、标题 600 中性色
8. **右侧大纲（桌面端）**：outline-marker 2px 品牌色指示条跟随高亮项、13px/行高 2.2857143、中性灰 chip 标签（对照 `VPDocAsideOutline` / `VPDocOutlineItem`）
9. **顶栏 VPNavBar 化**：内边距 1.5rem、动作组间距 8px、社交图标 20px、站名 hover 品牌色（顶栏高度见区块 4）
10. **翻页 VPDocFooter 化**：pager 卡片式、desc 小字 + 品牌色章节标题
11. **移动端本地导航 VPLocalNav**：顶部 sticky 条 + 大纲 popup 面板（对照 `VPLocalNav.vue` / `VPLocalNavOutlineDropdown.vue` / `VPDocOutlineItem.vue` 移植；功能样式在 custom.css 移动端区块，视觉覆盖在本区块）

## 三、关键技术决策（勿轻易回退）

1. **覆盖层架构**：所有 VitePress 化集中在 `vitepress-theme.css`，用 `!important` 胜过 Astro 组件 scoped 样式。**回退 = 删除该文件 + 移除 astro.config.mjs 注册**，零残留。
2. **正文宽度保留宽版**（用户明确选择）：`.sl-container` 1080px 及折叠扩宽系统不变，未采用 VitePress 688px 窄列（数学公式需要宽版）。
3. **亮/暗双主题**（用户明确选择）：内容页走 Starlight `data-theme` 切换器；首页是独立 HTML（不加载 Starlight CSS），内置色板用 `prefers-color-scheme` 跟随系统。
4. **卡片完全对齐 VitePress custom-block**：官方新版 border 全为 `transparent`（无边框），soft 背景 + 圆角 0.5rem + 字号 0.875rem + 行高 1.7142857 + 标题 600 中性色。色值沿用项目原语义色（tailwind 500 系，与官方 soft 体系一致）。
5. **侧栏当前项无背景高亮**：VitePress 新版是"品牌色文字 + 600 字重"（无 soft 背景、无竖条——竖条仅 level-2+ 才有，本项目章节是 level-1）。

## 四、VitePress 参照来源

- 官方主题源码（完整下载）：`task/theme/theme-default/`（已被 .gitignore，不入库）
  - 色板/字号：`styles/vars.css`
  - 正文排版：`styles/components/vp-doc.css`、`styles/base.css`
  - 卡片特殊块：`styles/components/custom-block.css`（border 全 transparent）
  - 顶栏/侧栏排版：`components/VPNavBar.vue`、`VPSidebar.vue`、`VPSidebarItem.vue`（新版样式内嵌于 .vue，不在独立 css）
- 官方仓库：`github.com/vuejs/vitepress`，路径 `src/client/theme-default/`

## 五、验证方式（本项目环境坑）

- **本地 build 不可用**（沙箱已知：config 加载阶段报错），不跑全量 build。
- 标准验证：`astro dev`（后台）+ 请求 `http://localhost:4321/src/styles/vitepress-theme.css` 确认编译 200 无错；curl 章节页确认样式注入。
- 内容校验：`node scripts/scan-mdx.mjs`（本次未改 MDX，无需跑）。
- 上线正确性：git push 触发 Vercel 云端构建（本次已由用户推送）。

## 六、注意事项与已知坑

1. **侧栏宽度 localStorage**：resizer 持久化键 `starlight:sidebar-resizer`。拖过侧栏的用户保留自己的宽度；想看 272px 默认值需清除该键。
2. **首页与内容页主题机制不同**：首页 `prefers-color-scheme`，内容页 `data-theme` 切换器——两套色板值相同（VitePress 官方值），但机制独立。
3. **卡片内公式随容器 14px 缩小**（VitePress custom-block 特性）：若觉公式偏小，可对 `.card-body .katex` 单独放大，当前未处理。
4. **顶栏毛玻璃**：`backdrop-filter` 半透明是生态常见定制，VitePress 官方默认纯色。用户未提异议，保留。
5. **右侧大纲已全部 VitePress 化**：桌面端见区块 8（outline-marker + 中性 chip），移动端见区块 11（VPLocalNav popup）。早期"左侧 2px 高亮条 + 彩色 chip"样式已废弃，不再生效。
6. **Summary.astro 是历史遗留坏组件**（无 `<slot />`，内容不渲染），本次仅去 emoji + 样式覆盖，未修复（不在本任务范围）。
7. **移动端大纲已 VitePress 化**：右侧大纲在移动端由 VPLocalNav 顶部 sticky 条 + 大纲 popup 面板承载（对照 `VPLocalNav.vue` / `VPLocalNavOutlineDropdown.vue` / `VPDocOutlineItem.vue` 移植）。断点对齐项目右侧栏：<72rem 显示 local nav（右侧栏隐藏），≥72rem 右侧栏显示、local nav 隐藏。左侧抽屉菜单仍沿用 Starlight 结构（local nav 在左菜单展开时 `visibility: hidden` 让位）。

## 七、建议后续（可选，非必须）

- ~~右侧大纲 VitePress 化~~（已完成：桌面端见区块 8，移动端 VPLocalNav 见区块 11）
- 顶栏加"返回首页"链接或面包屑（VitePress 站点头部常见）
- 修复 Summary.astro 或废弃（skill 已记录）
- 首页 Hero 可加图书封面轮播/搜索入口

## 八、本次未触碰的既有优化（勿误改）

- 左侧栏按当前书过滤（`SidebarOverride.astro`）、跨页联动索引（`PageSidebarOverride.astro`）
- KaTeX `output:'html'`、公式 data-latex 回填、公式复制/导出按钮
- 双侧栏拖拽折叠系统（仅改了一个默认宽度常量）
- SPA 局部刷新导航（在 SidebarOverride 内）
