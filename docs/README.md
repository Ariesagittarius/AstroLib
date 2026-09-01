# 架构设计与技术交接文档索引

本目录收录了本项目（AstroLib / my-astro-site）在各项核心架构重构、性能优化及新特性落地过程中的技术设计与交接文档。

---

## 文档清单与导航

| 文档名称 | 核心主题与说明 | 关联文件与模块 |
| :--- | :--- | :--- |
| [特性模块与插件系统.md](./特性模块与插件系统.md) | **全站 Feature Registry 架构**：功能声明规范、构建期动态装配与零打包开销机制、前端开发调试开关面板设计。 | `src/config/features.config.mjs`<br>`src/components/FeatureToggles.astro`<br>`astro.config.mjs` |
| [AI 书内问答模块实现交接.md](./AI%20书内问答模块实现交接.md) | **AI 书内问答（RAG）实现交接**：构建期分块索引管线、客户端 BYOK 直连流式生成、上下文成本硬约束与端侧检索设计。 | `src/ai/`<br>`src/components/AIAsk.astro`<br>`scripts/build-ai-index.mjs` |
| [AI 赋能模块设计.md](./AI%20赋能模块设计.md) | **AI 赋能体系设计与 RAG 开发者指南**：包含全量 8 个 MCP/客户端工具规格、动态 Prompt 解耦串联架构、请求处理逻辑链及长远路线图。 | `src/ai/mcp/`<br>`src/ai/tools-client.mjs`<br>`src/ai/llm.mjs`<br>`src/ai/client/chat-controller.ts` |
| [文章切换性能优化交接文档.md](./文章切换性能优化交接文档.md) | **跨页引用与 SPA 性能优化**：正文引用徽章识别从客户端扫描下沉至构建期 Rehype 插件（方案 B）的技术细节。 | `src/utils/rehype-cross-ref.mjs`<br>`src/components/PageSidebarOverride.astro` |
| [VitePress主题改造交接文档.md](./VitePress主题改造交接文档.md) | **UI/UX 主题重塑**：重构 Starlight 默认皮肤，复刻 VitePress 色彩体系、极简图标主题切换与思源字体系统。 | `src/styles/vitepress-theme.css`<br>`src/styles/fonts.css`<br>`src/components/ThemeSelectOverride.astro` |
| [精修工具交接.md](./精修工具交接.md) | **在线可视化 MDX 精修工具**：dev 模式下源码位置注入（AST 标记）与 Vite dev server 写回端点设计。 | `src/utils/mdx-editor/dev-server-plugin.mjs`<br>`src/utils/editor.ts`<br>`src/components/EditorMode.astro` |
| [模块查重与巡检工具.md](./模块查重与巡检工具.md) | **书籍模块巡检与查重工具**：dev 模式下快速查看与搜索全书模块、同章/全书查重、异常拆分标记与一键精准定位跳转。 | `src/utils/module-inspector/`<br>`src/components/ModuleInspector.astro` |
| [公式末尾编号-tag-重叠问题修复记录.md](./公式末尾编号-tag-重叠问题修复记录.md) | **KaTeX 编号与排版排错**：独立行公式 `\tag{...}` 在移动端和窄屏下与公式内容重叠的 CSS 定位修复。 | `src/styles/custom.css` |
| [大邮数学集题库结构化与分章习题交接文档.md](./大邮数学集题库结构化与分章习题交接文档.md) | **全量真题题库抽取与分章习题建设**：173套试卷/2765道题结构化抽取、Unicode规范化、KaTeX公式平衡与工科数分分章自测页集成。 | `scripts/lib/math_archive/`<br>`src/data/exercises/`<br>`src/components/ChapterQuiz.astro` |

---

## 开发者与 AI 快速阅读建议

1. **理解系统功能开关**：先读 [特性模块与插件系统.md](./特性模块与插件系统.md)。
2. **理解跨页引用与侧边栏**：先读 [文章切换性能优化交接文档.md](./文章切换性能优化交接文档.md)。
3. **理解 AI 问答交互与 RAG 核心逻辑**：读 [AI 书内问答模块实现交接.md](./AI%20书内问答模块实现交接.md) 与 [AI 赋能模块设计.md（第十二章节：开发者指南）](./AI%20赋能模块设计.md#十二开发者指南ai-书内问答-rag-核心逻辑mcp-规格与-prompt-串联全解)。
4. **日常操作与新书导入**：请直接激活 `.agents/skills/` 下的项目专属技能。
