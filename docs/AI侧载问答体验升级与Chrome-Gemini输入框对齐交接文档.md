# AI 侧载问答体验升级与 Chrome Gemini 输入框完全对齐交接文档

> **文档性质**：技术架构交接与下阶段实施蓝图（Handover & Implementation Blueprint）  
> **交接对象**：接替本任务的后续开发/重构 AI Agent  
> **编写日期**：2026-09-19  
> **项目范围**：AstroLib（my-astro-site）AI 书内问答侧载模式（Sideload Dock Mode）体验升级

---

## 一、任务背景与用户核心诉求画像

### 1.1 任务源起与前序探索
在前序迭代中，AI 智能问答实现了从悬浮抽屉停靠到右侧辅助分栏（Sideload Dock）的初步贯通，并初步引入了当前阅读章节提示条。然而在实机体验中，用户明确指出存在 **两项严重阻碍使用的核心体验缺陷**，并提供了 **5 张核心截图（包含当前 Bug 标注与 Google Chrome 内置 Gemini 侧载面板的官方标准 UI/UX 截图）**。

### 1.2 用户核心反馈与精确痛点画像

#### 痛点 1：右侧栏混杂滚动、滚动穿透与输入框沉底逃逸
- **用户原话**：“需求1效果不佳，右侧栏会随着正文先不动后跟随滚动，输入框也位于页面底部，导致翻不动且无法输入；应当单独滚动，输入框始终位于最下部”。
- **实机现象（对照截图 `media_1789813226938.png`）**：
  - 当正文篇幅较长（数千至万像素）时，读者在桌面端向下阅读正文，右侧栏在滚动初期看似固定，但随着正文继续下滚，整个右侧栏被整屏拉动向上逃逸；
  - 问答输入框（`.ask-input-bar`）沉在右侧栏万像素的最底端（即正文末尾相对应高度处），导致读者在正常阅读视口内 **根本看不到输入框、无法输入**；
  - 鼠标在右侧栏内滚轮操作时，无法独立滚动消息流，产生正文与侧栏的相互拉扯穿透。
- **目标预期**：
  - **右侧栏在视口内绝对固定**：桌面端无论正文如何向下翻滚，右侧栏纹丝不动，高度严格锁定为视口可见区域（`calc(100vh - var(--sl-nav-height))`）；
  - **正文与侧栏完全独立滚动**：中间正文自由滚动，右侧栏内部消息流（`.ask-thread`）具备独立且平滑的内部滚动条，正文与侧栏互不干扰、互不穿透；
  - **三段式视口锚定**：AI 面板顶部操作栏固定在顶端，底部复合输入框始终紧贴右侧栏视口最底部，永不被推出屏幕。

#### 痛点 2：输入框文字偏下、样式割裂
- **用户原话**：“需求2效果不佳，【文本依然偏下】；建议【完全仿照Gemini的输入框的ui设计和功能设计】”。
- **实机现象（对照截图 `media_1789813340349.png` 用户红圈标注）**：
  - 当前输入框采用外置 Chip + 下方胶囊输入框的拼凑结构；
  - 胶囊输入框内部的输入光标与 placeholder 文本紧贴着下边框，在单行时严重偏下，视觉重心失衡失重；
  - 上方漂浮的引用提示条（`📄 正在引用“6.5 重积分的应用” ✕`）与输入框之间缺乏有机整合，窗口违和感很强。

#### 痛点 3：完全仿照 Chrome 内置 Gemini 侧载输入框 UI 与功能设计
- **用户原话**：“建议【完全仿照Gemini的输入框的ui设计和功能设计】，输入@可以引用【一个或多个章节】，还可以快捷切换模型；语音能力倒是不必保留”。
- **关键设计参考（逐一拆解 4 张 Gemini 官方截图）**：
  1. **一体化圆角卡片（对照截图 `media_1789813332116.png`）**：
     - 外层为 Material 3 `surface-container-high` 柔和圆角卡片（`border-radius: 20px ~ 24px`，无多余内嵌边框）；
     - 上下文引用区、文本输入区、底部操作区统一内嵌在同一个卡片内部，而非外挂浮动。
  2. **顶层上下文引用行**：
     - **单章节引用（截图 `media_1789813332116.png`）**：左侧图标（如 Chrome 图标或文档图标），正文显示 `正在分享“新标签页”标签页`（在 AstroLib 中显示 `正在引用“章节标题”`），右侧提供轻量 `✕` 移除按钮；
     - **多章节引用（截图 `media_1789813417868.png`）**：当勾选多个章节时，聚合展示为 `正在分享 2 个标签页`（AstroLib 中展示为 `正在引用 2 个章节`），右侧提供折叠/展开指示（`∨` / `^`）。
  3. **中层文本输入区**：
     - 无边框、无背景透明 `textarea`，文字在单行时垂直居中对齐；
     - 动态提示占位符：未添加章节时提示 `输入 @ 即可添加章节`（或 `就本书提问，输入 @ 可引用章节...`）；
     - 支持内容弹性增高（Auto-grow），多行时平滑扩展，但限制最大高度并启用平滑内滚。
  4. **底层快捷操作工具栏**：
     - **左侧**：`+` 快捷插入按钮（点击唤起章节选择浮层，鼠标悬停提示“添加章节”）；
     - **右侧**：**快捷切换模型胶囊下拉按钮**（显示当前模型名称，如 `自动 ∨`、`3.8 Flash ∨`、`3.1 Pro ∨`）；
     - **最右侧**：发送按钮（`arrow_upward` 圆形按钮，生成中变为 `stop` 终止按钮）；
     - **明确排除项**：用户明确强调 **“语音能力倒是不必保留”**，严禁引入麦克风图标或 Web Speech API 相关冗余代码。
  5. **模型切换浮层菜单（对照截图 `media_1789813445089.png`）**：
     - 点击输入框内的模型胶囊（如 `自动 ∨`）后，在输入框上方向上弹出标准 Material 3 Menu / Popover；
     - 菜单项包含：
       - `自动`（标题） / `根据需求调整回答`（副标题），激活项右侧带勾选标记 `✓`；
       - `3.5 Flash-Lite`（标题） / `极速回答`（副标题）；
       - `3.8 Flash`（标题） / `全方位帮助`（副标题）；
       - `3.1 Pro`（标题） / `高级推理`（副标题）；
       - 分割线 `<md-divider>`；
       - `扩展思考`（标题） / `思考时间较长，适合处理复杂任务`（副标题），右侧配备 `<md-switch>` 开关；
       - 底部注脚文本：`已配置的模型均支持公式渲染与知识库问答`；
     - 点击任意模型后，立即生效、持久化存储至 `localStorage`，同时胶囊文字联动更新，无需跳转至全站设置面板。
  6. **`@` 章节引用机制与多章节选择器**：
     - 在输入框中键入 `@` 字符或点击 `+` 按钮时，唤出章节选择 Popover；
     - 列出当前图书的所有章节列表（支持快速模糊搜索）；
     - 允许勾选 1 个或多个章节（多选 Checkbox）；
     - 提问发送时，LLM 提示词将所有勾选章节的内容一并结构化组装（章节标题、路径与正文前序片段）。

---

## 二、关键技术根因深度剖析 (Root Cause Analysis)

后续接手 Agent 必须先理解以下底层根因，避免盲目尝试：

### 2.1 根因 1：右侧栏随正文滚动且输入框沉底万像素之外
- **问题源头代码**：
  在 `src/themes/material-you/theme.css` 第 2058 行：
  ```css
  html[data-site-theme='material-you'][data-sideload-active='ai'] .right-sidebar-container {
    ...
    height: 100% !important;
    max-height: 100% !important;
  }
  ```
- **布局机理机制**：
  1. 在 Starlight 框架（`TwoColumnContentOverride.astro`）中，`.right-sidebar-container` 和 `.main-pane` 是父容器 `.lg:sl-flex` 的直接子节点；
  2. 当中间正文篇幅非常长时，`.main-pane` 的高度可能达到 8,000px ~ 15,000px，因此 flex 容器 `.lg:sl-flex` 的高度也被撑大至 8,000px ~ 15,000px；
  3. 当 `.right-sidebar-container` 被赋予 `height: 100%` 时，它的物理高度直接等同于 `.lg:sl-flex` 的高度（即上万像素）；
  4. 虽然设置了 `position: sticky; top: var(--sl-nav-height)`，但 sticky 元素的粘性定位 **仅在自身元素相对于视口移动且未达到其自身高度底边前生效**。因为该容器本身就有 10,000px 高，当页面向下滚动时，整个容器与正文并排滚动；
  5. 挂载在 `.right-sidebar-container` 内部底部的输入框 `.ask-input-bar` 便被推到了 10,000px 处的最底下，在视口内不可见；
  6. 此外，`.ask-thread` 设为了 `flex: 1; min-height: 200px;`，未加 `min-height: 0;`，导致 Flexbox 在高度过大时无法正确计算收缩与内部滚动。
- **彻底根治方案**：
  在桌面端（`min-width: 72rem`）下，无论何种状态，`.right-sidebar-container` 的高度 **必须硬性锁定为视口高度**：
  ```css
  height: calc(100vh - var(--sl-nav-height)) !important;
  max-height: calc(100vh - var(--sl-nav-height)) !important;
  overflow: hidden !important;
  position: sticky !important;
  top: var(--sl-nav-height) !important;
  ```
  内部宿主层层透传 `height: 100%; display: flex; flex-direction: column; overflow: hidden;`，`.ask-thread` 设为 `flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain;`，`.ask-input-bar` 设为 `flex-shrink: 0; margin-top: auto;`。这样侧栏与正文彻底隔离，输入框永远紧贴可视视口最底边。

### 2.2 根因 2：输入框文本偏下
- **问题源头代码**：
  在 `src/components/ai/ai-theme.css` 第 1114 行：
  ```css
  ai-ask .ask-input-box {
    display: flex;
    align-items: flex-end; /* 此处强行将多行与单行元素底端对齐 */
    padding: 5px 8px 5px 14px;
    ...
  }
  ```
  同时 `textarea.ask-input` 带有 `padding: 4px 0; min-height: 24px; line-height: 1.5;`。
  在仅有一行文字时，`align-items: flex-end` 强行将单行文本压至容器底部，导致光标和占位符紧贴底边边框。
- **彻底根治方案**：
  重构成一体化三层卡片后：
  1. 顶部为 Context Row；
  2. 中部为 Textarea Row（文本自适应行高，`align-items: center` 或独立行块，消除底部挤压）；
  3. 底部为 Actions Row（左侧 `+`，右侧模型切换与发送按钮）。

---

## 三、前序已完成工作与可直接复用资产 (Completed & Reusable)

为了避免重复造轮子，接手 Agent 请直接复用以下已验证且已测试通过的基础设施：

### 3.1 配置与存储层 (`src/ai/ai-config.ts`)
- `STORAGE_KEYS.SIDELOAD_REF_CHAPTER`：用于存储「侧载是否默认引用本章」的配置键值（已落地）；
- `getAiSideloadRefChapter(): boolean` 与 `saveAiSideloadRefChapter(val: boolean): void`（已落地）；
- `getEffectiveAiClientConfig()`：已包含 `sideloadRefChapter` 字段透传（已落地）；
- **模型配置体系**（直接可用于模型切换 Popover）：
  - `getAllAiProviders(): AiProviderDef[]`：返回所有支持的提供商定义；
  - `getActiveAiModel(): string` 与 `saveAiActiveModel(modelId: string): void`：当前激活模型读取与存储，自动触发持久化；
  - `DEFAULT_ACTIVE_MODEL_ID = 'gemini-3.8-flash'`；
  - `MODEL_PRESETS` 与各个 Provider 的 `models` 数组：包含模型 ID、中文 Label、副标题 Desc（如 `极速回答`、`高级推理`）等完备元数据。

### 3.2 全局设置层 (`src/components/FeatureToggles.astro` & `src/scripts/feature-toggles.ts`)
- 全站设置面板 AI 高级区域已实现「侧载默认引用本章」开关（`.ft-ai-ref-chapter-toggle`）；
- 已与 `localStorage` 及 `astrolib:ai-config-change` 事件双向同步；
- 当读者在设置中开启该项时，侧载打开自动将当前章节纳入引用；关闭时则不自动引用，完全尊重读者偏好。

### 3.3 大模型消息组装层 (`src/ai/llm.mjs`)
- `buildMessages({ question, context, bookTitle, history, toolsDesc, discussion, chapterRef })`：
  - 已支持在发送给 LLM 的 user message 头部注入当前章节信息（章节标题、URL、正文片段）；
  - **下阶段升级方向**：将单对象 `chapterRef` 扩展为支持数组 `chapterRefs: Array<{ title: string; url: string; text?: string }>`，或做向下兼容。

### 3.4 客户端控制器层 (`src/ai/client/chat-controller.ts`)
- `_getCurrentChapterInfo()`：已实现从 DOM 抓取当前章节标题（`h1` / `document.title`）、路径（`window.location.pathname`）与正文内容（清理掉 script、style、hidden 按钮后的纯文本）；
- `_isDocked`：当前是否处于侧边栏侧载模式的准确状态追踪；
- 全局事件监听：已监听 `astrolib:sideload-change` 与 `astrolib:ai-config-change`；
- 停靠与脱离生命周期守卫：`mountToOverlayRoot` 守卫已建立。

### 3.5 自动化测试
- `tests/unit/sideload-ai.test.ts`：包含了对 `SideloadManager` 注册、宽面板阶梯、`mountToOverlayRoot` 防御、配置持久化及 `buildMessages` 的单元测试。运行 `npm test` 目前全站 113 项测试 100% 通过。

---

## 四、下一阶段实施保姆级指南 (Step-by-Step Action Plan)

接手 Agent 请按以下步骤依序推进，每一步完成后进行快速验证：

```
+--------------------------------------------------------------------------------+
| Step 1: 侧栏视口高度硬锁定与独立滚动修复 (彻底消除跟随滚动与输入框掉底)        |
+--------------------------------------------------------------------------------+
                                       ↓
+--------------------------------------------------------------------------------+
| Step 2: Gemini 样式一体化复合输入卡片重构 (解决文本偏下，对齐 Chrome 视觉)     |
+--------------------------------------------------------------------------------+
                                       ↓
+--------------------------------------------------------------------------------+
| Step 3: `@` 章节引用联动与多章节选择器实现 (支持多章节勾选与聚合展示)        |
+--------------------------------------------------------------------------------+
                                       ↓
+--------------------------------------------------------------------------------+
| Step 4: 输入框快捷切换模型 Popover 菜单构建 (完全对照 Gemini 截图 5)          |
+--------------------------------------------------------------------------------+
                                       ↓
+--------------------------------------------------------------------------------+
| Step 5: 全链路质量门禁与端到端回归验证 (TypeScript 0 错误 + Vitest 测试通过)   |
+--------------------------------------------------------------------------------+
```

---

### Step 1: 侧栏视口高度硬锁定与独立滚动修复

#### 涉及文件
- `src/themes/material-you/theme.css`
- `src/styles/components/exercise-m3.css`
- `src/components/ai/ai-theme.css`

#### 关键改动要点
1. **修正 `theme.css` 中的致命规则**：
   在 `src/themes/material-you/theme.css` 约 2056 行附近，将原有的：
   ```css
   html[data-site-theme='material-you'][data-sideload-active='ai'] .right-sidebar-container {
     height: 100% !important; /* 错误：导致继承上万像素的高度 */
   }
   ```
   **纠正为**：
   ```css
   html[data-site-theme='material-you'][data-sideload-active='ai'] .right-sidebar-container {
     height: calc(100vh - var(--sl-nav-height)) !important;
     max-height: calc(100vh - var(--sl-nav-height)) !important;
     overflow: hidden !important;
     position: sticky !important;
     top: var(--sl-nav-height) !important;
     align-self: flex-start !important;
   }
   ```
2. **确保整个侧载容器链路具备硬约束**：
   ```css
   /* 侧载宿主与面板视图硬性锁定 */
   .custom-page-sidebar,
   .astrolib-sideload-dock,
   .sideload-panel-view[data-panel-id='ai'],
   .ai-sidebar-panel,
   ai-ask.is-docked {
     height: 100% !important;
     max-height: 100% !important;
     display: flex !important;
     flex-direction: column !important;
     overflow: hidden !important;
     box-sizing: border-box !important;
     min-height: 0 !important;
   }
   ```
3. **锁定 `ask-panel` 与三段式结构**：
   ```css
   ai-ask.is-docked .ask-panel {
     height: 100% !important;
     max-height: 100% !important;
     display: flex !important;
     flex-direction: column !important;
     overflow: hidden !important;
     min-height: 0 !important;
     flex: 1 1 auto !important;
   }

   /* 顶栏固定 */
   ai-ask.is-docked .ask-head {
     flex-shrink: 0 !important;
   }

   /* 消息列表：占据剩余所有空间，内部平滑自滚动，阻止穿透 */
   ai-ask.is-docked .ask-thread {
     flex: 1 1 0% !important;
     min-height: 0 !important;
     overflow-y: auto !important;
     overflow-x: hidden !important;
     overscroll-behavior: contain !important;
     -webkit-overflow-scrolling: touch;
   }

   /* 输入栏：始终钉在底部 */
   ai-ask.is-docked .ask-input-bar {
     flex-shrink: 0 !important;
     margin-top: auto !important;
   }
   ```

---

### Step 2: Gemini 样式一体化复合输入卡片重构

#### 涉及文件
- `src/components/ai/InputBar.astro`
- `src/components/ai/ai-theme.css`

#### 结构重构规划 (DOM 蓝图)
将原本松散外挂的结构替换为整合在一个外层卡片容器内的三层架构：
```html
<div class="ask-input-bar">
  <!-- Gemini 统一圆角复合输入卡片 -->
  <div class="ask-gemini-input-card">
    
    <!-- 1. 顶层：上下文引用行 (Context Row) -->
    <div class="ask-context-row" id="ask-context-row" style="display: none;">
      <div class="ask-context-indicator">
        <svg class="ask-context-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
        </svg>
        <!-- 文本可展示“正在引用“6.5 重积分””或多章收拢“正在引用 2 个章节” -->
        <span class="ask-context-text" id="ask-context-text">正在引用本章节内容</span>
      </div>
      <div class="ask-context-actions">
        <!-- 多章节收拢展开箭头 (多章时展示) -->
        <button type="button" class="ask-context-expand-btn" id="ask-context-expand-btn" style="display: none;" title="查看引用的章节" aria-label="查看引用的章节">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
        </button>
        <!-- 移除引用按钮 -->
        <button type="button" class="ask-context-remove-btn" id="ask-context-remove-btn" title="取消引用" aria-label="取消引用">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
    </div>

    <!-- 多章节展开明细列表抽屉 (点击 expand-btn 展开，列出每一章及单独删除 x) -->
    <div class="ask-context-dropdown" id="ask-context-dropdown" style="display: none;">
      <ul class="ask-context-items-list" id="ask-context-items-list"></ul>
    </div>

    <!-- 2. 中层：纯净多行文本输入框 (Textarea Row) -->
    <div class="ask-textarea-row">
      <textarea
        class="ask-input"
        id="ask-main-input"
        rows="1"
        placeholder="输入 @ 即可添加章节，或就本书提问..."
        autocomplete="off"
        spellcheck="false"
      ></textarea>
    </div>

    <!-- 3. 底层：操作工具栏 (Actions Row) -->
    <div class="ask-actions-row">
      <!-- 左侧：添加章节按钮与 @ 快捷入口 -->
      <div class="ask-actions-left">
        <button type="button" class="ask-action-btn ask-add-chapter-btn" id="ask-add-chapter-btn" title="添加章节引用 (输入 @ 亦可)" aria-label="添加章节">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </button>
      </div>

      <!-- 右侧：快捷模型切换胶囊 + 发送/停止按钮 -->
      <div class="ask-actions-right">
        <!-- 快捷模型切换胶囊按钮 (点击弹出 M3 模型选择菜单) -->
        <button type="button" class="ask-model-pill-btn" id="ask-model-pill-btn" aria-haspopup="true" aria-expanded="false" title="切换模型">
          <span class="ask-model-pill-name" id="ask-model-pill-name">3.8 Flash</span>
          <svg class="ask-model-pill-arrow" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </button>

        <!-- 发送 / 停止生成主操作按钮 -->
        <button class="ask-send-btn" id="ask-send-btn" type="button" title="发送 (Enter)" aria-label="发送" disabled>
          <svg class="ask-send-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"/>
          </svg>
          <svg class="ask-stop-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="display:none;">
            <path d="M6 6h12v12H6z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>

  <!-- 底部居中快捷键提示 -->
  <div class="ask-hint">Enter 发送 · Shift+Enter 换行</div>
</div>
```

#### 样式重构要点
- `.ask-gemini-input-card`：
  - `background: var(--md-sys-color-surface-container-high, var(--ai-bg-soft));`
  - `border: 1px solid var(--md-sys-color-outline-variant, var(--ai-border));`
  - `border-radius: 20px;`
  - `padding: 8px 12px;`
  - 聚焦内层 textarea 时：`box-shadow: 0 0 0 2px var(--ai-brand-soft); border-color: var(--ai-brand-strong);`
- `.ask-textarea-row`：
  - `display: flex; align-items: center; min-height: 36px;`
  - `textarea.ask-input`: `border: none; outline: none; background: transparent; padding: 6px 4px; line-height: 1.5; font-size: 0.9rem; vertical-align: middle;`
  - **彻底解决文本偏下**：因为将 textarea 抽离为单独一行并使用自然行高，单行时光标与文字在行内垂直居中，绝不再被压缩在容器底部。
- `.ask-model-pill-btn`：
  - 参照截图 `media_1789813332116.png` 与 `media_1789813445089.png`；
  - 椭圆胶囊形状（`border-radius: 9999px;`），高 28px，包含当前模型简短别名（如 `自动`、`3.8 Flash`、`3.1 Pro`）与轻量下箭头 `∨`；
  - 悬停带有 Surface-Container 效果。

---

### Step 3: `@` 章节引用联动与多章节选择器

#### 涉及文件
- `src/ai/client/chat-controller.ts`
- `src/components/ai/InputBar.astro`
- `src/ai/llm.mjs`

#### 数据源获取策略 (无需额外后端请求)
- 在当前图书页面中，左侧栏 `#starlight__sidebar a[href]` 已包含当前图书的完整章节树；
- 控制器初始化时，调用 `_extractBookChaptersFromSidebar()` 提取所有章节：
  ```ts
  interface ChapterItem {
    title: string;
    url: string;
  }
  ```
- 若跨页或左侧栏未完全挂载，回退至从 `<ai-ask data-config="...">` 中的 `bookList` 或 `collections.config` 中获取。

#### 交互逻辑实现
1. **多章节状态结构**：
   在 `ChatController` 中，将原有的单布尔值 `_refCurrentChapter: boolean` 升级为：
   ```ts
   interface ReferencedChapter {
     title: string;
     url: string;
     text?: string;
   }
   private _referencedChapters: ReferencedChapter[] = [];
   ```
2. **唤出章节选择器浮层**：
   - 当用户在 `textarea` 中键入 `@` 符号时；
   - 或点击左下角 `+` 按钮时；
   - 在输入卡片上方弹出 `ChapterPickerPopover`，内含轻量搜索输入框与全书章节复选列表；
   - 支持按键盘上下键与回车快速勾选；勾选后在文本框中自动剔除 `@` 触发字符；
3. **卡片顶层动态同步**：
   - 勾选 0 章：顶层上下文行 `display: none;`；
   - 勾选 1 章：展示 `📄 正在引用“<章节名>” ✕`；
   - 勾选 ≥ 2 章：展示 `📄 正在引用 N 个章节 ∨`；点击展开列表抽屉可查看引用的全部章节，并支持单独点击 `✕` 剔除某章节；
4. **LLM 提示词注入 (`src/ai/llm.mjs`)**：
   - 升级 `buildMessages({ ..., chapterRefs })`；
   - 如果用户当前在阅读《6.5 重积分的应用》，同时 `@` 引用了《6.1 二重积分的概念与性质》与《6.2 二重积分的计算》，模型提示词头部格式化为：
     ```markdown
     【读者引用的相关章节内容】：
     1. 《6.5 重积分的应用》（当前正在阅读章节，链接：/collections/...）
        正文片段：...
     2. 《6.1 二重积分的概念与性质》（读者引用章节，链接：/collections/...）
        正文片段：...
     3. 《6.2 二重积分的计算》（读者引用章节，链接：/collections/...）
        正文片段：...
     ```
   - 引导模型精准交叉推导读者指定的各章节知识点。

---

### Step 4: 输入框快捷切换模型 Popover 菜单构建

#### 涉及文件
- `src/components/ai/InputBar.astro`
- `src/ai/client/chat-controller.ts`
- `src/components/ai/ai-theme.css`

#### 界面与交互细节（完全对标截图 `media_1789813445089.png`）
1. **Popover 菜单骨架**：
   在输入框上方锚定一个 Material 3 Menu 容器（`role="menu"`）：
   ```html
   <div class="ask-model-menu" id="ask-model-menu" style="display: none;">
     <div class="ask-model-menu-list">
       <!-- 动态渲染或静态骨架 -->
       <button type="button" class="ask-model-menu-item" data-model-id="auto">
         <div class="ask-model-item-text">
           <div class="ask-model-item-headline">自动</div>
           <div class="ask-model-item-support">根据需求调整回答</div>
         </div>
         <svg class="ask-model-check-icon" viewBox="0 0 24 24" width="18" height="18"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
       </button>
       <button type="button" class="ask-model-menu-item" data-model-id="gemini-3.5-flash-lite">
         <div class="ask-model-item-text">
           <div class="ask-model-item-headline">3.5 Flash-Lite</div>
           <div class="ask-model-item-support">极速回答</div>
         </div>
       </button>
       <button type="button" class="ask-model-menu-item is-active" data-model-id="gemini-3.8-flash">
         <div class="ask-model-item-text">
           <div class="ask-model-item-headline">3.8 Flash</div>
           <div class="ask-model-item-support">全方位帮助</div>
         </div>
         <svg class="ask-model-check-icon" ...></svg>
       </button>
       <button type="button" class="ask-model-menu-item" data-model-id="gemini-3.1-pro">
         <div class="ask-model-item-text">
           <div class="ask-model-item-headline">3.1 Pro</div>
           <div class="ask-model-item-support">高级推理</div>
         </div>
       </button>
       <div class="ask-model-menu-divider"></div>
       <div class="ask-model-menu-switch-item">
         <div class="ask-model-item-text">
           <div class="ask-model-item-headline">扩展思考</div>
           <div class="ask-model-item-support">思考时间较长，适合处理复杂任务</div>
         </div>
         <md-switch id="ask-thinking-switch"></md-switch>
       </div>
       <div class="ask-model-menu-footer">已配置的模型均支持公式渲染与知识库问答</div>
     </div>
   </div>
   ```
2. **逻辑联动**：
   - 点击选项时：
     1. 调用 `saveAiActiveModel(modelId)`；
     2. 更新 `.ask-model-pill-name` 的文本；
     3. 关闭 Popover；
     4. 派发 `window.dispatchEvent(new CustomEvent('astrolib:ai-config-change'))`，使得全局设置面板与控制器状态完全保持一致。

---

### Step 5: 全链路质量门禁与端到端回归验证

在所有功能开发完毕后，接手 Agent 必须执行以下标准验证步骤：

1. **类型检查**：
   ```bash
   npm run check:types
   ```
   要求严格 100% 通过，0 任何 TypeScript 报错。
2. **单元测试与契约测试**：
   ```bash
   npm test
   ```
   在 `tests/unit/sideload-ai.test.ts` 中补充多章节引用数据结构与模型切换状态同步的测试用例，确保全套测试用例通过。
3. **滚动与交互实机验证**：
   - 验证桌面端正文快速滚动时，右侧栏纹丝不动；
   - 验证光标在右侧消息流中时，滚轮只滚动消息流；
   - 验证输入框始终稳稳吸附在右侧视口最下方，且文本不再偏下；
   - 验证输入 `@` 弹出章节菜单并能多选；
   - 验证点击模型胶囊弹出菜单并成功切换。

---

## 五、严格遵循的项目规范与负面清单 (Rules & Invariants)

接手 Agent **必须严格遵守** 以下工程底线：
1. **绝对禁止实现语音能力**：用户明确告知“语音能力倒是不必保留”，切勿引入麦克风图标或 Web Speech 相关的任何代码；
2. **遵守《AGENTS.md》UI 规范**：
   - 优先采用官方标准矢量，严禁使用带纯黑实心外圆底盘的“黑硬币”贴片；
   - 遵守第 7 章《Sideload Dock 侧载底座架构》，单例状态机 `sideloadManager` 为唯一状态源；
3. **严禁 Big Bang Rewrite**：分步骤修改与验证，每完成一步均确保代码可正常运行；
4. **单源真理**：模型列表与激活状态复用 `src/ai/ai-config.ts` 中的函数，严禁在 UI 层私设平行的存储键。

---

> **结语**：本文档已梳理清了根因定位、UI 蓝图、数据结构及代码改动点。请接手 Agent 放心依照上述 Step 1 至 Step 5 扎实推进！
