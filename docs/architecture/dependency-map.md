# AstroLib 依赖拓扑与边界诊断 (Dependency Map)

> 本文档通过对 AstroLib 全局 ESM import、类型依赖及运行时调用的全量扫描，建立理想分层架构并深度挖掘违反分层原则的反向依赖与潜在循环依赖。
> 调查原则：**只调查，不修改。**

---

## 1. 规范分层架构拓扑 (Ideal Architecture Layers)

依据科学出版平台与现代前端工程规范，AstroLib 的理想单向依赖流动应严格遵循如下 7 层金字塔模型：

```
                    ┌──────────────────────────────────────────┐
                    │               Layer 6: Pages             │
                    │  src/pages/ (index, library, print)      │
                    └────────────────────┬─────────────────────┘
                                         │ imports
                                         ▼
                    ┌──────────────────────────────────────────┐
                    │            Layer 5: Components           │
                    │  src/components/ (Cards, Layout Shells)  │
                    └────────────────────┬─────────────────────┘
                                         │ imports
                                         ▼
                    ┌──────────────────────────────────────────┐
                    │             Layer 4: Features            │
                    │  Exercises, AI Chat, Inspector, Graph    │
                    └────────────────────┬─────────────────────┘
                                         │ imports
                                         ▼
                    ┌──────────────────────────────────────────┐
                    │             Layer 3: Services            │
                    │  LLM Client, Cloud Compiler, DB Client   │
                    └────────────────────┬─────────────────────┘
                                         │ imports
                                         ▼
                    ┌──────────────────────────────────────────┐
                    │               Layer 2: Data              │
                    │  Central Configs, Derived JSON Datasets  │
                    └────────────────────┬─────────────────────┘
                                         │ imports
                                         ▼
                    ┌──────────────────────────────────────────┐
                    │            Layer 1: Processing           │
                    │  Remark/Rehype AST Plugins, Compilers    │
                    └────────────────────┬─────────────────────┘
                                         │ reads / parses
                                         ▼
                    ┌──────────────────────────────────────────┐
                    │              Layer 0: Content            │
                    │  src/content/docs/ (MDX Chapters)        │
                    └──────────────────────────────────────────┘
```

各层级职责约束准则：
- **严格向下依赖**：上层模块可以依赖下层模块，下层模块**严禁反向依赖**上层模块。
- **横向平级隔离**：同层模块之间应保持低耦合，避免跨业务子系统横向穿透。
- **纯粹性要求**：Layer 1 与 Layer 2 必须保持无前端 DOM 依赖（纯粹的数据计算与 AST 转换），可安全在 Node.js 构建期或 Web Worker 中脱离浏览器运行。

---

## 2. 违反分层方向的严重反向依赖 (Inverted Dependencies)

在当前实际代码实现中，存在多处严重破坏上述单向流动方向的反向依赖与越层调用：

### 2.1 依赖倒置：底层编译工具反向依赖顶层 UI 控制器
- **问题文件**：
  - `src/utils/latex/latex-generator.ts`（第 9 行）
  - `src/utils/typst/typst-generator.ts`（第 11 行）
- **反向依赖代码**：
  ```typescript
  // 在 src/utils/latex/latex-generator.ts 中
  import type { SlimQuestionItem } from '../../components/exercises/exercise-controller';

  // 在 src/utils/typst/typst-generator.ts 中
  import type { SlimQuestionItem } from '../../components/exercises/exercise-controller';
  ```
- **架构违规判定**：
  - `latex-generator` 与 `typst-generator` 属于 **Layer 1 (Processing / Compilers)**，其职责是将题目抽象数据结构转化为 LaTeX / Typst 标记语言；
  - `exercise-controller.ts` 属于 **Layer 5 (Components / UI Controller)**，包含了大量浏览器 DOM 事件绑定、localStorage 读取与 CSS 动画。
  - **违规事实**：底层编译器将本应属于 Layer 2 的通用题目数据契约（Data Model / Interface），直接从一个长达 3000 行的前端 UI 控制器中反向导入！一旦 UI 控制器发生重构，底层的文档导出编译器将产生连锁破坏。

---

### 2.2 依赖倒置：离屏预处理管线反向依赖侧边栏附属排版器
- **问题文件**：
  - `src/utils/page-preprocess.ts`（第 21 行）
- **反向依赖代码**：
  ```typescript
  // 在 src/utils/page-preprocess.ts 中
  import { formatMultipleChoiceQuestions } from '../components/sidebar/question-formatter';
  ```
- **架构违规判定**：
  - `page-preprocess.ts` 是 SPA 路由核心生命周期中的通用 DOM 预处理器（属于 Layer 1/3 通用逻辑）；
  - `question-formatter.ts` 却被存放在 `src/components/sidebar/`（属于 Layer 5 视图组件子目录）。
  - **违规事实**：系统级预处理工具反向依赖视图组件的内部私有文件。

---

### 2.3 潜伏闭环：SidebarOverride ↔ page-preprocess ↔ sidebar 形成间接环状网
- **调用链路追踪**：
  1. `src/components/SidebarOverride.astro` 作为根侧边栏组件，在 `<script>` 中导入：
     ```javascript
     import { preprocessPage } from '../utils/page-preprocess';
     ```
  2. `src/utils/page-preprocess.ts` 为了预处理选择题，反向导入：
     ```javascript
     import { formatMultipleChoiceQuestions } from '../components/sidebar/question-formatter';
     ```
  3. `src/components/sidebar/question-formatter.ts` 又处于 `src/components/sidebar/` 家族中，与 `SidebarOverride.astro` 共享侧边栏上下文。
- **架构违规判定**：
  - 逻辑流在 `components/` 与 `utils/` 之间来回跳跃，形成了概念上的环形缠绕。任何对侧边栏结构的拆分，都会意外影响全站页面的离屏预处理渲染。

---

### 2.4 越层硬打包：UI 组件直接静态全量捆绑多兆字节底层数据库
- **问题文件**：
  - `src/components/ChapterQuiz.astro`（第 8 行）
- **反向依赖代码**：
  ```astro
  import exercisesData from '../data/exercises/engineering_analysis_exercises.json';
  ```
- **架构违规判定**：
  - 该组件在 Astro frontmatter 中直接静态 `import` 了高达 **2.5 MB** 的全量题目 JSON。
  - 这种直接越层将海量离线数据库强行内联进组件模板的做法，导致只要该组件被实例化，巨量 JSON 就会直接阻塞 Astro 编译进程，严重消耗打包内存。

---

### 2.5 服务端插件越层调用构建期自动化脚本
- **问题文件**：
  - `src/utils/exercise-editor/dev-server-plugin.mjs`（第 7、136 行）
- **反向依赖代码**：
  ```javascript
  import { execSync } from 'node:child_process';
  // ...
  execSync('node scripts/build-exercise-data.mjs', { cwd: ROOT, stdio: 'pipe' });
  ```
- **架构违规判定**：
  - 一个运行在 Vite Dev Server 内部的 HTTP 请求处理中间件（Layer 3），在捕获到客户端保存动作后，使用阻塞式的 `execSync` 强行拉起外部 CLI 构建脚本 `scripts/build-exercise-data.mjs`。
  - 这破坏了“服务层调用内部服务”的原则，将外部构建管线（CLI Scripts）作为运行期依赖直接硬编码进开发服务器中间件。

---

## 3. 全局模块依赖矩阵表

下表列出各核心模块的向上依赖（被谁依赖）与向下依赖（依赖了谁），标有 ⚠️ 者为违规跨层依赖：

| 模块名称 | 所在路径 | 自身层级 | 向上主要被依赖方 | 向下主要依赖方 | 违规诊断 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **collections.config** | `src/config/collections.config.mjs` | Layer 2 (Data) | `astro.config.mjs`, `PageSidebarOverride`, `build-*.mjs`, `scanner.mjs` | 无（单一真理源） | 正常 |
| **features.config** | `src/config/features.config.mjs` | Layer 2 (Data) | 全站组件、插件与构建脚本 | 无（单一功能表） | 正常 |
| **rehype-cross-ref** | `src/utils/rehype-cross-ref.mjs` | Layer 1 (Processing) | `astro.config.mjs` | `unist-util-visit` | 正常 |
| **rehype-katex-source**| `src/utils/rehype-katex-source.mjs`| Layer 1 (Processing) | `astro.config.mjs` | `unist-util-visit` | 正常 |
| **page-preprocess** | `src/utils/page-preprocess.ts` | Layer 1 (Processing) | `SidebarOverride.astro` | ⚠️ `src/components/sidebar/question-formatter.ts` | **反向依赖 Layer 5** |
| **latex-generator** | `src/utils/latex/latex-generator.ts` | Layer 1 (Processing) | `exercise-controller.ts`, `test-latex-export.mjs` | ⚠️ `src/components/exercises/exercise-controller.ts` | **反向依赖 Layer 5** |
| **typst-generator** | `src/utils/typst/typst-generator.ts` | Layer 1 (Processing) | `test-typst-export.mjs` | ⚠️ `src/components/exercises/exercise-controller.ts` | **反向依赖 Layer 5** |
| **exercise-controller**| `src/components/exercises/exercise-controller.ts` | Layer 5 (Components) | `ExerciseModal.astro` | `ai/llm.mjs`, `latex-generator.ts`, `latex-cloud-compiler.ts`, `exercise-db-client.ts` | 职责过载（God Controller） |
| **SidebarOverride** | `src/components/SidebarOverride.astro` | Layer 5 (Components) | `astro.config.mjs` (Starlight overrides) | `features.config.mjs`, `page-preprocess.ts` | 承载过多 SPA 引擎代码 |
| **FooterOverride** | `src/components/FooterOverride.astro` | Layer 5 (Components) | `astro.config.mjs` (Starlight overrides) | `EditorMode`, `ModuleInspector`, `AIAsk`, `BookRelationGraph`, `ExerciseModal`, `FeedbackMode` | 成为全站弹窗汇总总线 |
| **ChapterQuiz** | `src/components/ChapterQuiz.astro` | Layer 5 (Components) | `legacy_pages/*.mdx` | ⚠️ `src/data/exercises/engineering_analysis_exercises.json` | **直接硬打包 2.5MB 数据** |

---

## 4. 架构解耦路线指引 (Decoupling Guidelines)

为在未来的重构中消除反向依赖并纯化各层职责，必须确立以下隔离边界：

1. **确立独立的 Types / Model 基础层 (`src/types/` 或 `src/models/`)**：
   - 将 `SlimQuestionItem`、`ExerciseChapterData`、`PaperMeta` 等数据结构抽取到顶层无依赖的 TypeScript 类型声明中，解绑编译器与 UI 控制器。
2. **提取客户端页面增强运行时 (`src/client/runtime/`)**：
   - 将 `question-formatter`、`image-blur-loader`、`mermaid-loader` 从 `src/components/sidebar/` 中剥离出来，放置在独立的客户端运行时目录中，供 `page-preprocess.ts` 与页面生命周期统一调用。
3. **隔离编译层与 UI 控制层**：
   - 让 `src/utils/latex/` 和 `src/utils/typst/` 成为完全不依赖浏览器环境的纯 Node.js / WebWorker 编译服务。
