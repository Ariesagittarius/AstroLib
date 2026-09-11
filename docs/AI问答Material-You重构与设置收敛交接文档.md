# AI 书内问答 · Material You 重构与设置收敛交接文档

> **文档定位**：本文档记录本项目（AstroLib / my-astro-site）正文「AI 问答（`ai-ask`）」功能及其关联的设置架构、排版规范、组件体系经历的全面 Material You (Material 3) 风格重构与系统级收敛。旨在为后续接手开发、测试及维护的 AI Agent 或工程师提供详尽的架构设计、实现细节、配置约定及验证规范。

---

## 一、重构背景与核心目标

原有的 AI 书内问答组件（`src/components/ai/ChatDrawer.astro`）在长期迭代中积累了若干视觉逼仄与交互割裂问题：
1. **工具调用冗长抢占视口**：每次检索工具执行均展开大量原始 JSON，占满整个对话界面，在 AI 生成最终回复后仍处于常开状态，严重干扰读者对核心数学推导的阅读；
2. **正文排版原始逼仄**：受制于早期的硬编码窄气泡（440px）与简易 Markdown 样式，公式块、引用块及代码块缺乏现代学术排版的层次感与呼吸感；
3. **顶部 Tab 组严重浪费空间**：顶部的 `.ask-tabs` 标签条占据大量宝贵垂直阅读高度，在窄屏和常规桌面下显得杂乱；
4. **窗口尺寸不可调节**：无法根据读者屏幕或长公式阅读需求自由缩放面板，缺乏默认尺寸阶梯；
5. **设置弹窗孤立割裂**：AI 问答内部自带一套简易设置表单，与顶栏的「快速设置（`FeatureToggles.astro`）」严重重复冲突，造成配置真理来源（Source of Truth）分歧；
6. **历史会话组件风格陈旧**：历史抽屉使用手写普通 DOM，未遵从 Google 官方 Material 3 规范；
7. **底部输入框体验粗糙**：Windows 浏览器下常态出现原生纵向滚动条，发送按钮缺少流式生成中断控制；
8. **图标风格不一**：界面中混杂有旧版非标 SVG 与 emoji，缺乏统一的 Material Symbols 视觉规范。

本次阶段性重构彻底贯彻了项目《AGENTS.md》中的 **Material You UI 架构规范** 与 **学术出版极端减法原则**，达成了全链路的体验与架构跃升。

---

## 二、架构决策与关键能力实现

### 1. 设置单一真理来源（Settings Single Source of Truth）
- **剔除内部冗余表单**：彻底移除了 `ChatDrawer.astro` 内的独立设置模态窗（`.ask-settings`）及相关的旧版输入控件，避免了模型 Key、端点与参数的双重维护。
- **收敛至「快速设置」AI 模块**：在 `src/components/FeatureToggles.astro` 的「AI 学术模型」模块底部新增 `<details class="ft-ai-advanced-group" data-ai-advanced-details>` 容器（默认收起，点击展开），将 AI 问答特有的控制项集中收纳：
  - **答题模式**：选用 `<md-chip-set>` 配合 `<md-filter-chip>`（检索本书 / 深度讨论）；
  - **来源跳转方式**：选用 `<md-chip-set>` 配合 `<md-filter-chip>`（新窗口打开 / 本页平滑跳转）；
  - **检索片段数 (Top K)**：选用 `<md-slider>`（范围 1~20）联动 `<md-assist-chip>` 实时显示数值；
  - **上下文上限与最大 Tokens**：选用 `<md-outlined-text-field>`，支持精准数值与 `-1`（不限制）；
  - **窗口尺寸预设**：选用 `<md-chip-set>` 配合 `<md-filter-chip>`（紧凑 460px / 标准 560px / 宽屏 720px）。
- **全局事件一键唤起与自动定位**：
  在 AI 问答面板顶栏点击设置齿轮按钮时，通过派发 `new CustomEvent('astrolib:open-settings', { detail: { section: 'ai' } })` 事件，通知全站快速设置面板打开、滚动聚焦至 AI 区域，并自动展开该高级设置折叠组，体验浑然一体。

### 2. Harness 风格轻量调用树与最终回答自动收折
- **调用树微型化（Compact Harness Tree）**：
  将原本庞大的工具调用块重构为 `.ask-tool` 悬浮组件：
  - 头部包含微型状态指示徽标（`Tool`）、等宽工具名、执行概要提示（如“命中 2 条：夹逼定理”）及轻量旋转箭头；
  - 参数与原始结果置于可折叠的 `.ask-tool-raw` 内，配备语法高亮等宽 JSON 预览框，默认紧凑展示。
- **回答流出时自动收起（Auto Collapse on Answer Streaming）**：
  在 `src/ai/client/chat-controller.ts` 的 `streamChat` 流程中：
  - 工具执行中向界面追加 open 状态的工具块；
  - 当 LLM 接收到工具结果开始进入后续轮次并在 `onDelta` 回调输出最终回答文本的瞬间，控制器调用 `_collapseTools(blocksEl)` 自动收起所有展开的工具面板，将读者的视觉焦点即时归还给最终解答；
  - 在历史会话回放（`_renderThread`）与 `finally` 阶段均确保工具块默认处于收折状态。

### 3. 学术排版优雅升级与自适应布局
- **消除气泡束缚**：彻底废除原先 440px 强制宽度与气泡式容器，采用 Material 3 标准 Surface-Container 柔和底色与宽广视野。
- **学术公式与图文排版**：
  - 标题（`h1` ~ `h4`）按照 Material 3 学术比例缩放，配备清晰的下边距与留白；
  - 独立公式块（KaTeX `p.md-math`）在容器中居中摆放，内部公式过长时支持平滑横向滚动，严禁撑爆容器正文；
  - 引用块（`blockquote`）采用微弱主色表面底色与左侧强调竖条；
  - 行内代码与代码块采用 M3 等宽字体配比。

### 4. 彻底删除顶部对话 Tab 组
- 彻底删除了 `.ask-tabs` 标签条及其增删切换代码（`_renderTabs`），彻底消除了纵向空间浪费。
- 顶栏精简为：左侧显示书名与状态提示，右侧依序排列「新建会话」、「历史会话」、「AI 设置」与「关闭」四个标准圆角操作动作。

### 5. 窗口自由多向拖拽缩放与持久化
- **三向拖拽手柄**：在问答面板的左侧边缘（`.ask-resize-w`，光标 `ew-resize`）、顶部边缘（`.ask-resize-n`，光标 `ns-resize`）以及左上角（`.ask-resize-nw`，光标 `nwse-resize`）嵌入拖拽抓手。
- **智能锚定与边界约束**：
  - 面板右下角通过 `position: fixed; right: 0; bottom: 3.8rem;` 锚定；
  - 拖动左边界即向左平滑增大宽度（`newWidth = startWidth + deltaX`），设置安全范围 `[380px, min(1000px, window.innerWidth - 24px)]`；
  - 拖动上边界即向上平滑增大高度（`newHeight = startHeight + deltaY`），设置安全范围 `[420px, min(960px, window.innerHeight - 80px)]`；
- **双向即时生效与持久化**：
  - 拖拽松开后自动保存至 `localStorage`（`astrolib_ai_panel_width` / `astrolib_ai_panel_height`）；
  - 在快速设置面板切换预设 Chip 时，通过 `onAiConfigChange` 广播即时同步生效至当前打开的面板。

### 6. 历史会话全 M3 组件推倒重构
- 在 `ChatDrawer.astro` 中将历史抽屉重构为覆盖式 Sheet 面板。
- 列表全面采用 Google 官方 `@material/web` 的 `<md-list>` 与 `<md-list-item>` 构建：
  - `slot="start"`：标准空心对话气泡图标；
  - `slot="headline"`：会话标题（截取前 32 字符）；
  - `slot="supporting-text"`：相对时间（如“刚刚”、“20 分钟前”、“3 天前”）及消息总数；
  - `slot="end"`：独立的删除图标按钮（SVG 垃圾桶），点击支持快速清理，且阻止冒泡。

### 7. 底部输入框 M3 胶囊化与滚动条消除
- **胶囊化容器**：外框采用 `border-radius: 24px` 的轻量 Surface-Container 胶囊底色，聚焦时呈现精准的 Outline 轮廓高亮。
- **消除丑陋垂直滚动条**：
  - 初始状态及未溢出时设置 `overflow-y: hidden`；
  - 输入时通过 `_grow()` 动态计算 `Math.min(t.scrollHeight, 128)` 增高；只有内容高度真正超过 128px 时才开启滚动，彻底根除了 Windows 下 `rows="1"` 带来的视觉噪点与原生滚动条闪烁。
- **流式发送/停止联动按钮**：
  - 空闲或输入中呈现 M3 圆形发送按钮（内含 `arrow_upward` 图标）；
  - 一旦触发生成、`_streaming` 为 true 时，按钮无缝切换为停止图标（`stop`），并且始终保持可点击；点击即调用 `_abort.abort()` 中断当前请求。

### 8. 全站官方 Material Symbols 标准矢量
- 界面内所有功能操作与状态指示徽标 100% 替换为 Google 官方 Material Symbols Outlined 标准矢量路径（统一 20px / 24px 物理光学尺寸）：
  - `auto_awesome`（空态与助手标识）
  - `add`（新开对话）
  - `history`（历史会话）
  - `tune`（AI 设置跳转）
  - `close`（关闭抽屉）
  - `arrow_upward`（发送问题）
  - `stop`（停止流式生成）
  - `chat_bubble_outline`（历史列表会话标识）
  - `delete`（删除历史会话）

---

## 三、文件与模块职责清单

| 文件路径 | 核心改动说明 |
| :--- | :--- |
| `src/ai/ai-config.ts` | 扩展存储常量（`ANSWER_MODE`, `SRC_OPEN`, `PANEL_WIDTH`, `PANEL_HEIGHT`, `SIZE_PRESET`），提供统一的 getter/setter，并在迁移方法中完成对旧版 `dsh-aiask-*` 键名的无缝兼容迁移。 |
| `src/components/FeatureToggles.astro` | 在 AI 模块加入可折叠高级配置组 `<details class="ft-ai-advanced-group">`，全量集成 M3 Filter Chips、Slider 与 Outlined Text Field；实现全局统一设置。 |
| `src/scripts/feature-toggles.ts` | 增加高级 AI 设置项的双向数据绑定、Slider 数值联动更新，以及监听 `astrolib:open-settings` 全局事件打开侧栏并自动展开折叠项。 |
| `src/components/ai/ChatDrawer.astro` | 彻底移除 `.ask-tabs` 与 `.ask-settings`；顶栏重构为紧凑 M3 Action 区域；加入左/上/左上三向拖拽手柄；历史面板全面采用 `<md-list>`。 |
| `src/components/ai/InputBar.astro` | 重构为 M3 胶囊输入外框，嵌入 auto-grow 文本域，以及支持在 `arrow_upward` 与 `stop` 之间无缝切换的圆形发送按钮。 |
| `src/components/ai/MessageList.astro` | 升级空态为 Material Symbols `auto_awesome` 矢量与优雅提示文案。 |
| `src/components/ai/ai-theme.css` | 全面推倒重写为 Material 3 设计系统变量；实现 Harness 工具调用卡片、学术排版、输入胶囊、自适应滚动与拖拽手柄的精细样式。 |
| `src/ai/client/chat-controller.ts` | 移除已弃用的 tab 和内部设置逻辑；接入尺寸记忆与三向拖拽逻辑；实现流式输出 `onDelta` 自动收折工具调用；实现 `<md-list-item>` 历史会话构建；接入流式停止控制。 |

---

## 四、存储键名规范与迁移机制

系统遵循渐进式平滑迁移原则，在用户首次加载时由 `migrateLegacyStorage()` 自动将历史分散键值迁移至标准键名，同时保持向后兼容：

| 功能项 | 标准统一存储键名 (`STORAGE_KEYS`) | 旧版兼容键名 (`LEGACY_KEYS`) | 默认值 |
| :--- | :--- | :--- | :--- |
| 答题模式 | `astrolib_ai_answer_mode` | `dsh-aiask-mode` | `'retrieve'` |
| 来源跳转 | `astrolib_ai_src_open` | `dsh-aiask-src-open` | `'new'` |
| 问答窗口宽度 | `astrolib_ai_panel_width` | `dsh-aiask-panel-width` | `560` (px) |
| 问答窗口高度 | `astrolib_ai_panel_height` | `dsh-aiask-panel-height` | `680` (px) |
| 尺寸预设 | `astrolib_ai_size_preset` | `dsh-aiask-size-preset` | `'standard'` |
| 检索 Top K | `astrolib_ai_top_k` | `dsh-aiask-topk` | `8` |
| 上下文字符上限 | `astrolib_ai_max_context` | `dsh-aiask-maxctx` | `6000` |
| 单次最大 Token | `astrolib_ai_max_tokens` | `dsh-aiask-maxtok` | `4096` |
| 活动模型 ID | `astrolib_ai_active_model` | `dsh-aiask-model` | `'gemini-2.5-flash'` |
| 活动提供商 ID | `astrolib_ai_active_provider` | - | `'gemini'` |
| 各提供商 API Key | `astrolib_ai_provider_key_<providerId>` | `astrolib_ai_key_<modelId>` | `''` |
| 各提供商专属端点 | `astrolib_ai_provider_endpoint_<providerId>` | - | 对应官方端点 |
| 活动模型 ID | `astrolib_ai_active_model` | `dsh-aiask-model` | `'gemini-3.8-flash'` |

---

## 五、提供商架构与多维度错误诊断体系 (最新演进)

### 1. 提供商分层体系 (`Provider -> API Key -> Model`)
- **交互逻辑**：规范为【选择提供商 -> 填写 API Key -> 选择模型】三步联动；
- **提供商与密钥收敛**：同属 Google Gemini 的 7 个预置免费额度模型（`gemini-3.8-flash`, `gemini-3.7-flash`, `gemini-3.6-flash`, `gemini-3.5-flash`, `gemini-3.5-flash-lite`, `gemini-3-flash`, `gemini-3.1-flash-lite`）统合于 `gemini` 提供商，用户仅需配置一次 API Key 即可跨模型自由切换；
- **DeepSeek 升级**：同样作为一级提供商，提供 `DeepSeek V4.1 Flash` (`deepseek-flash`)、`DeepSeek V4 Flash` (`deepseek-v4-flash`)、`DeepSeek V4 Pro` (`deepseek-v4-pro`) 模型；已彻底淘汰过时的 R1 / V3 模型。
- **自定义提供商**：提供端点与自定义模型输入通道。

### 2. 诊断级错误拦截与 Material 3 卡片渲染 (`src/ai/error-handler.ts`)
- **异构格式解析**：针对 Gemini REST 报错返回顶级数组 `[{ error: { code, message, status } }]` 以及 OpenAI/DeepSeek 标准对象统一解构，防止数据被截断为 `[object Object]`；
- **七维错误分类**：精准识别 `quota` (429), `auth` (401/403/key invalid), `rate_limit`, `model_not_found`, `invalid_request`, `timeout`, `network`；
- **M3 诊断卡片交互**：
  - 明确中文诊断标题与分类徽标；
  - 针对性故障排除指引（如切换模型、检查 Key、等待配额重置）；
  - **一键重试（Retry）** 按钮与 **直达设置（Settings）** 按钮；
  - **复制诊断日志** 按钮与默认折叠的 `<details>` 原始报错 JSON。

---

## 六、验证与测试情况

1. **自动化测试套件**：
   - 运行校验命令：`node scripts/test-ai-providers-errors.mjs`
   - 验证内容：覆盖提供商注册、Gemini 7 大模型与 DeepSeek 3 大模型存在性、异构 429/400/401 报错解析、卡片 HTML 渲染及真实 Gemini REST 端点连通性测试，全部通过。
2. **MDX 语法与公式完整性巡检**：
   - 运行校验命令：`node scripts/scan-mdx.mjs src/content/docs/collections/math/math_analysis`
   - 结果：**130 / 130** 个文件全部通过，数学公式与组件标签完整无破损。
3. **本地 Dev 渲染联调**：
   - 启动本地开发服务：`http://localhost:4321`，正文与设置面板交互正常响应。

---

## 七、后续维护与演进建议

1. **多端协同与 Sideload 整合可能**：
   当前 AI 问答为桌面右下浮动面板。未来若需要将其接入右侧基准底座，可直接以视图身份挂载入 `PageSidebarOverride.astro` 的 `.astrolib-sideload-dock` 中，由 `sideloadManager` 统一分配侧载宽度。
2. **移动端手势优化**：
   在屏幕宽度小于 `50rem` 时，问答窗口转为全宽底部抽屉。未来可考虑引入轻量触摸下拉手势（Swipe to dismiss）进一步提升触控手感。

