# ADR 001: 业务特性高内聚边界划分与垂直化解耦 (Feature Boundaries)

- **状态**：Accepted
- **日期**：2026-09-06
- **决策者**：AstroLib 架构委员会

---

## 1. 当前问题 (Context & Problem Statement)

AstroLib 当前的业务功能呈现高度碎片化和横向割裂的状态：
1. **跨目录零散散落**：
   - 比如“习题系统 (Exercises)”的逻辑散布在 `src/components/exercises/`（前端视图与 114KB 控制器）、`src/utils/exercise-editor/`（Vite 插件）、`src/utils/exercise-db/`（本地缓存客户端）、`src/data/exercises/`（数据库）、`scripts/build-exercise-data.mjs`（构建脚本）中。
   - “在线精修编辑器 (Editor)”的逻辑散落在 `src/components/EditorMode.astro`、`src/utils/editor.ts`、`src/utils/mdx-editor/`、`src/utils/rehype-editor-annotate.mjs` 中。
2. **控制器与视图重度混合**：
   - `exercise-controller.ts`（3017 行 / 114 KB）作为一个 UI 目录下的文件，直接承载了完整的答题引擎、状态持久化、AI 流式对接、KaTeX 离线重排以及 LaTeX 云编译调度。
3. **全局挂载总线失控**：
   - 全站全部弹窗（精修、巡检、图谱、自测、问答、勘误）统统被无差别挂载在 `FooterOverride.astro` 底部，导致所有页面均需为未开启或未使用的功能背负组件初始化代码。

---

## 2. 决策 (Decision)

在 `src/features/` 下建立**垂直业务特性边界（Vertical Feature Slices）**，将 AI、Exercise、Editor、Inspector、Relation Graph、Feedback 彻底封装为独立的特性模块：

```
src/features/<feature-name>/
├── components/          # 该特性私有的交互视图与弹窗 (如 Modal, Drawer)
├── state/               # 独立的状态机与领域业务逻辑 (无直接 DOM 污染)
├── services/            # 该特性专用的网络/持久化驱动
├── styles/              # 该特性的专有样式表
└── index.ts             # 统一对外暴露的特性入口 (干净的装配契约)
```

- **第一批建立的特性边界**：
  1. `features/exercises/`：习题答题、试卷做题、对错校验、社区题解；
  2. `features/ai/`：书内问答抽屉、Top-K 片段检索、BYOK 流式解析；
  3. `features/editor/`：在线可视化 MDX 精修、AST 节点写回与安全备份；
  4. `features/inspector/`：全书卡片模块多维度筛选、重名冲突检测；
  5. `features/relation-graph/`：全书拓扑关系 ECharts 可视化；
  6. `features/feedback/`：读者选段勘误与 GitHub Issue 提交。

---

## 3. 原因 (Rationale)

- **认知负荷最小化**：开发者修改“习题”或“精修”功能时，只需聚焦在对应的 `features/<feature>/` 目录下，彻底告别在 `components/`, `utils/`, `data/`, `scripts/` 间反复横跳的心智消耗。
- **真正实现“未启用零打包”**：特性注册表（`features.config.mjs`）中一旦关闭某特性，打包工具可直接通过特性的单一入口（`index.ts`）进行完整 Tree Shaking，不会残留任何孤立碎片。
- **解耦视图与状态**：将 114KB 的 `exercise-controller.ts` 解构为无 DOM 依赖的状态机与纯视图渲染器，便于单独进行单元测试。

---

## 4. 替代方案 (Alternatives Considered)

- **方案 A：保持现状，仅在 `src/components/` 下拆分子目录**
  - *弃用原因*：无法解决业务状态、数据访问、网络中间件与 UI 混在一起的问题，依然违反“UI 不得成为领域模型来源”的原则。
- **方案 B：按技术类型横向分层（`controllers/`, `views/`, `models/`）**
  - *弃用原因*：传统的 MVC 横向分层在复杂前端项目中会导致每次修改一个功能都需要在 5 个顶层目录中同步改动，内聚性极低。

---

## 5. 风险 (Risks)

- **路径重定向与导入断裂**：大量现存组件和页面对 `../../components/exercises/` 等路径存在硬编码引用，重命名和移动可能导致构建短时间不可用。
- **全局事件监听丢失**：部分特性（如快捷键 `Alt+E`, `Alt+F`）目前依赖全局挂载点，提取后需确保生命周期事件仍能正确注册。

---

## 6. 迁移策略 (Migration Strategy)

严格遵循 **Rule 10（One boundary → One migration → One verification）**：
1. **阶段 1**：优先定义公共类型 `src/lib/models/`，解除编译器与控制器的耦合；
2. **阶段 2**：按风险从低到高逐个抽取 Feature：`feedback` ➔ `inspector` ➔ `relation-graph` ➔ `ai` ➔ `editor` ➔ `exercises`；
3. **阶段 3**：每个 Feature 迁移后，立即执行全套 `npm run build` 和功能验证，严禁多特性同时搬迁。
