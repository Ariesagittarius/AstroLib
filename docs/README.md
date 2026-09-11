# 架构设计与技术交接文档索引

本目录收录了本项目（AstroLib / my-astro-site）在各项核心架构重构、性能优化及新特性落地过程中的技术设计与交接文档。

---

## 活跃核心技术文档

| 文档名称 | 核心主题与说明 | 关联文件与模块 |
| :--- | :--- | :--- |
| [Material-You主题改造交接文档.md](./Material-You主题改造交接文档.md) | **UI/UX 核心设计规范（Material You / M3）**：对齐 Google 现代 Web 范式（Google Play / Gmail / Android Studio 文档 / Google Drive），优先官方 `@material/web` 组件、坚决避免自造组件；Filter Chips 离散选项组、Outlined Text Field 输入框、无边框 Filled Tonal 卡片、FAB 悬浮动作钮、Switch 双轨机制与极端减法学术排版准则。 | `src/themes/material-you/theme.css`<br>`src/themes/material-you/index.ts`<br>`src/themes/material-you/color-engine.ts`<br>`src/components/FeatureToggles.astro`<br>`src/components/exercises/ExerciseModal.astro` |
| [AI问答Material-You重构与设置收敛交接文档.md](./AI问答Material-You重构与设置收敛交接文档.md) | **AI 问答 Material You 深度重构与设置收敛**：8项痛点彻底重构；Harness 调用树微型化与答案输出自动收折、正文学术公式与排版、删除 Tab 栏、三向自由拖拽缩放与预设、历史会话 `<md-list>`、设置合并至「快速设置」AI 折叠项去重、M3 胶囊输入与滚动条消除、100% 官方 Material Symbols 矢量。 | `src/ai/client/chat-controller.ts`<br>`src/components/ai/`<br>`src/components/FeatureToggles.astro`<br>`src/scripts/feature-toggles.ts`<br>`src/ai/ai-config.ts` |
| [侧载系统架构与扩展交接文档.md](./侧载系统架构与扩展交接文档.md) | **Sideload Dock 统一侧载架构**：解决右侧大纲、习题、AI 等对正文空间的争抢与抖动；同宿主多视图栈机制、SideloadManager 单例状态机、CSS 变量平滑联动、多视口自适应（Desktop Docked / Tablet Side Sheet / Mobile Bottom Sheet）与新业务接入指南。 | `src/components/sideload/sideload-manager.ts`<br>`src/components/PageSidebarOverride.astro`<br>`src/themes/material-you/theme.css`<br>`src/components/exercises/exercise-sidebar-controller.ts` |
| [特性模块与插件系统.md](./特性模块与插件系统.md) | **全站 Feature Registry 架构**：功能声明规范、构建期动态装配与零打包开销机制、前端开发调试开关面板设计。 | `src/config/features.config.mjs`<br>`src/components/FeatureToggles.astro`<br>`astro.config.mjs` |
| [AI 书内问答模块实现交接.md](./AI%20书内问答模块实现交接.md) | **AI 书内问答（RAG）实现交接（历史记录）**：构建期分块索引管线、客户端 BYOK 直连流式生成、上下文成本硬约束与端侧检索设计。 | `src/ai/`<br>`src/components/AIAsk.astro`<br>`scripts/build-ai-index.mjs` |
| [AI 赋能模块设计.md](./AI%20赋能模块设计.md) | **AI 赋能体系设计与 RAG 开发者指南**：包含全量 8 个 MCP/客户端工具规格、动态 Prompt 解耦串联架构、请求处理逻辑链及长远路线图。 | `src/ai/mcp/`<br>`src/ai/tools-client.mjs`<br>`src/ai/llm.mjs`<br>`src/ai/client/chat-controller.ts` |
| [文章切换性能优化交接文档.md](./文章切换性能优化交接文档.md) | **跨页引用与 SPA 性能优化**：正文引用徽章识别从客户端扫描下沉至构建期 Rehype 插件（方案 B）的技术细节。 | `src/utils/rehype-cross-ref.mjs`<br>`src/components/PageSidebarOverride.astro` |
| [精修工具交接.md](./精修工具交接.md) | **在线可视化 MDX 精修工具**：dev 模式下源码位置注入（AST 标记）与 Vite dev server 写回端点设计。 | `src/utils/mdx-editor/dev-server-plugin.mjs`<br>`src/utils/editor.ts`<br>`src/components/EditorMode.astro` |
| [模块查重与巡检工具.md](./模块查重与巡检工具.md) | **书籍模块巡检与查重工具**：dev 模式下快速查看与搜索全书模块、同章/全书查重、异常拆分标记与一键精准定位跳转。 | `src/utils/module-inspector/`<br>`src/components/ModuleInspector.astro` |
| [公式末尾编号-tag-重叠问题修复记录.md](./公式末尾编号-tag-重叠问题修复记录.md) | **KaTeX 编号与排版排错**：独立行公式 `\tag{...}` 在移动端和窄屏下与公式内容重叠的 CSS 定位修复。 | `src/styles/custom.css` |
| [大邮数学集题库结构化与分章习题交接文档.md](./大邮数学集题库结构化与分章习题交接文档.md) | **全量真题题库抽取与分章习题建设**：173套试卷/2765道题结构化抽取、Unicode规范化、KaTeX公式平衡与工科数分分章自测页集成。 | `scripts/lib/math_archive/`<br>`src/data/exercises/`<br>`src/components/ChapterQuiz.astro` |

---

## 历史归档说明 (Archived Documents)

- [**docs/archive/legacy-vitepress/README.md**](./archive/legacy-vitepress/README.md)：
  收录早期以 VitePress 风格为重心的历史文档。相关进度已全面封存，**所有 AI Agent 严禁将归档文档作为当前 UI 开发与排版规范，必须统一遵循 Material You (Material 3) 现代学术规范**。

---

## 开发者与 AI 快速阅读建议

1. **理解 UI/UX 设计规范与组件标准**：先读 [Material-You主题改造交接文档.md](./Material-You主题改造交接文档.md)。
2. **理解系统功能开关**：读 [特性模块与插件系统.md](./特性模块与插件系统.md)。
3. **理解跨页引用与侧边栏**：读 [文章切换性能优化交接文档.md](./文章切换性能优化交接文档.md)。
4. **理解 AI 问答交互与最新 M3 架构**：读 [AI问答Material-You重构与设置收敛交接文档.md](./AI问答Material-You重构与设置收敛交接文档.md) 以及 [AI 赋能模块设计.md（第十二章节：开发者指南）](./AI%20赋能模块设计.md#十二开发者指南ai-书内问答-rag-核心逻辑mcp-规格与-prompt-串联全解)。
5. **日常操作与新书导入**：请直接激活 `.agents/skills/` 下的项目专属技能。
