# AstroLib 重构风险与技术债务评估 (Migration Risks)

> 本文档针对 AstroLib 当前架构中潜藏的技术债务、高耦合黑盒、边界侵蚀与潜在破裂点进行全方位风险评估。
> 按照危险程度严格划分为 **CRITICAL**、**HIGH**、**MEDIUM**、**LOW** 四个等级，为未来重构与演进提供安全防御指南。
> 调查原则：**只调查，不修改。**

---

## 1. 风险全景概览

```
  ┌──────────────────────────────────────────────────────────────────────────┐
  │                           CRITICAL (严重阻断/高危破坏)                      │
  │  · 114KB 单体题库控制器 (exercise-controller.ts)                            │
  │  · Dev Server 运行时写回源码与同步执行 Shell 命令                          │
  │  · src/ 源码树内嵌 14MB+ 巨型数据导致构建 OOM 风险                           │
  │  · 核心编译层反向依赖前端 UI 控制器类型                                   │
  └─────────────────────────────────────┬────────────────────────────────────┘
                                        │
  ┌─────────────────────────────────────┴────────────────────────────────────┐
  │                              HIGH (高风险架构耦合)                         │
  │  · 919 行 SidebarOverride 内嵌自定义 SPA 路由缓存引擎                     │
  │  · God Folder src/utils/ 混淆服务端/客户端/构建脚本                       │
  │  · 双仓注释剥离流水线强依赖特定 AST 结构                                  │
  │  · public/ 目录被测试脚本严重污染并暴露至生产环境                         │
  └─────────────────────────────────────┬────────────────────────────────────┘
                                        │
  ┌─────────────────────────────────────┴────────────────────────────────────┐
  │                             MEDIUM (中度维护负担)                         │
  │  · 历史遗留孤儿代码与未路由 MDX 页面 (ChapterQuiz, legacy_pages)          │
  │  · 重复脚本与冗余镜像目录 (inject-exercise-triggers.js/.mjs, .dsh/)       │
  │  · 源码目录残留备份文件 (*.bak) 与版本库夹带超大 PDF                     │
  │  · 脚本目录职责膨胀与 Python/Node 混合堆叠                                │
  └─────────────────────────────────────┬────────────────────────────────────┘
                                        │
  ┌─────────────────────────────────────┴────────────────────────────────────┐
  │                              LOW (轻微改进建议)                           │
  │  · 31 字节空壳组件 (VpFooter.astro)                                       │
  │  · 默认关闭的边缘特性配置 (imageBlur)                                     │
  │  · 缺少针对主站构建的 GitHub Actions CI 工作流                            │
  └──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. CRITICAL 级别（致命级风险与高危重构区域）

### 2.1 114 KB 超重单体题库控制器 (`exercise-controller.ts`)
- **风险位置**：`src/components/exercises/exercise-controller.ts` (3017 行，114,183 字节)。
- **核心风险**：
  1. **巨型单体（God Controller）**：该文件集成了答题状态机、DOM 生成、选择题/填空题判断逻辑、KaTeX 浏览器端二次渲染、LaTeX 导出配置弹窗、GitHub Actions 云端编译调度、AI 交互流式对接、以及本地 IndexedDB 缓存。
  2. **逻辑割裂与代码复制**：内部重复实现了 LaTeX 清洗逻辑 `sanitizeLatexString()`（与 `scripts/build-exercise-data.mjs` 中的 `sanitizeMathLatex` 重复）。
  3. **重构破裂风险**：任何针对自测功能、样式切换或导出逻辑的微调，都必须在这个 3000 行的庞然大物中动刀，极易引发难以预测的回归问题。
- **重构防范指南**：
  - 必须采用状态机模式（如 XState）或模块化分解，拆分为：`exercise-state.ts`（答题状态）、`exercise-renderer.ts`（DOM 渲染）、`exercise-latex-bridge.ts`（导出桥接）、`exercise-evaluator.ts`（对错判定）。

---

### 2.2 Dev Server 运行时写回源码与阻塞式 Shell 触发 (`dev-server-plugin.mjs`)
- **风险位置**：
  - `src/utils/exercise-editor/dev-server-plugin.mjs`（第 132-136 行）
  - `src/utils/mdx-editor/dev-server-plugin.mjs`（第 43 行）
- **核心风险**：
  1. **数据破坏与脏树风险**：在开发模式下，前端向 `/api/exercise/save` 发起 POST 请求时，服务端插件会**直接覆写**物理磁盘上的源文件 `src/data/exercises/engineering_analysis_exercises.json`。若发生网络中断或并发写入，源数据极易发生 JSON 解析损坏。
  2. **阻塞式构建反冲**：写回源 JSON 后，代码直接使用 `execSync('node scripts/build-exercise-data.mjs')` 阻塞 Vite 主事件循环！当题库数据增大时，此操作会导致整个本地开发服务器卡死数秒。
  3. **MDX 源码 AST 篡改风险**：`mdx-editor` 具有在开发期直接修改 `src/content/docs/**/*.mdx` 的权限，虽然有 `.backups/` 备份机制，但若 AST 定位发生漂移，可能导致正文公式与卡片排版被不可逆损坏。
- **重构防范指南**：
  - 将所有“编辑/保存”动作与生产数据源隔离；采用持久化 Draft 机制，禁止直接修改 Git 跟踪下的源 JSON 文件；移除 `execSync`，采用异步 Worker 或 Vite HMR 机制。

---

### 2.3 `src/` 源码树内嵌 14MB+ 巨型数据导致构建 OOM 风险
- **风险位置**：
  - `src/data/exercises/bupt_math_full_database.json`（**10.3 MB**）
  - `src/data/exercises/engineering_analysis_exercises.json`（**2.5 MB**）
  - `src/data/exercises/engineering_analysis_textbook_exercises.json`（**1.5 MB**）
  - `src/data/exercises/raw_papers/`（175 个原始试卷切片）
- **核心风险**：
  1. **构建内存溢出 (OOM)**：由于这些巨型 JSON 处于 `src/` 源码目录中，Vite/Rollup、TypeScript 编译器及 IDE 语言服务都会对其进行深度依赖扫描，导致常规 Node.js 进程内存迅速被撑爆，不得不依靠 `--max-old-space-size=4096` 勉强维持。
  2. **开发体验恶化**：任何针对 `src/` 下文件的修改都可能触发 Vite 全量依赖图重新分析，导致热更新（HMR）迟钝。
- **重构防范指南**：
  - 严禁在 `src/` 下存放未清洗的原始数据库。必须将 14MB+ 的底层 JSON 与 175 套试卷整体移出 `src/`（如移入根目录 `data/` 或外部云存储），构建脚本只从外部读取，编译产物只输出至 `public/`。

---

### 2.4 核心编译层反向依赖前端 UI 控制器类型 (Dependency Inversion)
- **风险位置**：
  - `src/utils/latex/latex-generator.ts`（第 9 行）
  - `src/utils/typst/typst-generator.ts`（第 11 行）
- **核心风险**：
  - 底层文档导出编译器本应是纯粹、无前端依赖的无状态服务，但却从 UI 层 `src/components/exercises/exercise-controller.ts` 导入数据类型 `SlimQuestionItem`。
  - 这在架构分层上形成了严重的**下层依赖上层**反向倒置，使得解耦或重构 UI 控制器时，底层编译脚本会发生级联报错。
- **重构防范指南**：
  - 创建独立的 `src/types/exercises.ts`，将所有纯数据类型接口提升为公共基础类型。

---

## 3. HIGH 级别（高风险架构耦合与系统杂质）

### 3.1 919 行 `SidebarOverride.astro` 内嵌自定义 SPA 路由缓存引擎
- **风险位置**：`src/components/SidebarOverride.astro`（第 154-919 行）。
- **核心风险**：
  1. **职责严重越界**：该文件原本是 Starlight 官方的“侧边栏组件”，但实际被塞入了全站核心的 **SPA 路由导航引擎**（包括：LRU 页面缓存管理、`DOMParser` 离屏清洗、并发请求合并、顶栏加载进度条控制、局部 DOM 置换与无感转场）。
  2. **隐形状态耦合**：该脚本在全局作用域挂载了 `window.__spaNavInstalled` 等全局变量，全站页面一旦离开该侧边栏或在非 Starlight 页面上打开，SPA 极速切换机制将直接失效或产生断裂。
- **重构防范指南**：
  - 将 SPA 导航引擎彻底剥离为独立的 `src/client/spa-router.ts`，侧边栏组件仅保留纯粹的目录折叠与链接呈现逻辑。

---

### 3.2 God Folder `src/utils/` 混淆异构执行环境
- **风险位置**：`src/utils/` 全目录。
- **核心风险**：
  - 目录内同时混杂了：
    - 运行在 Node.js 环境下的 AST 遍历与文件写回逻辑（`apply-op.mjs`, `scanner.mjs`）；
    - 运行在 Vite Dev Server 内部的 HTTP 插件（4 个 `dev-server-plugin.mjs`）；
    - 运行在浏览器端拥有庞大 DOM 交互的客户端脚本（`editor.ts` 69KB, `inspector.ts` 48KB, `relation-graph-client.ts` 29KB）；
    - 运行在构建期的 Rehype 插件。
  - **打包泄露风险**：一旦某处引入关系不当，Node.js 核心库（如 `node:fs`）极易被 Vite 误判打包进客户端 Bundle，造成致命的浏览器端运行时崩溃。
- **重构防范指南**：
  - 按照运行环境（Runtime Environment）物理拆分：`src/plugins/`（编译插件）、`src/server/`（开发中间件）、`src/client/`（前端交互控制器）。

---

### 3.3 双仓注释剥离流水线依赖风险 (`git-clean-push.mjs`)
- **风险位置**：`scripts/git-clean-push.mjs` 与 `scripts/lib/comment-stripper.mjs`。
- **核心风险**：
  - AstroLib 严格推行“私有仓保留注释，公共开源仓剥离注释”的发布原则，依赖 Babel AST 遍历实现精准剥离。
  - 若重构时引入了新型语法糖、特殊宏或非标准注释格式，注释剥离流水线可能解析失败阻断发布，或者因误删代码导致公共开源仓构建故障。
- **重构防范指南**：
  - 保持 `npm run test:stripper` 测试套件在重构期间常态化运行；任何引入新语法与文件类型时，必须同步升级剥离测试用例。

---

### 3.4 `public/` 目录被测试脚本严重污染并暴露至生产环境
- **风险位置**：`public/` 根目录下的测试输出文件（`test_exam_output.*`, `test_handout_output.*`, `missfont.log` 等共 18 个测试生成文件，累计超 600 KB）。
- **核心风险**：
  - `test-latex-export.mjs` 运行测试时直接将 PDF、TeX 源码及构建日志写入 `public/`；
  - Astro 在构建时会原样将 `public/` 复制进 `dist/`，导致私密测试用例、未定稿试卷和上百 KB 的排版报错日志被永久部署在公开生产服务器上。
- **重构防范指南**：
  - 重写测试脚本输出路径，重定向至临时目录；对 `public/` 实施白名单校验机制。

---

## 4. MEDIUM 级别（中度维护负担与架构杂质）

| 风险项 | 风险路径/对象 | 现状与风险成因 | 处置建议 |
| :--- | :--- | :--- | :--- |
| **孤儿组件与数据** | `src/components/ChapterQuiz.astro`<br>`src/data/exercises/legacy_pages/` | `ChapterQuiz` 在主站 MDX 中已完全零引用，仅被存放在 `legacy_pages/` 中的 14 个废弃 MDX 使用。属于被 `ExerciseModal` 取代后的技术遗蜕，但依然在消耗维护心智。 | 确认无外链依赖后彻底下线归档。 |
| **重复脚本实现** | `scripts/inject-exercise-triggers.js`<br>`scripts/inject-exercise-triggers.mjs` | 同一批量注入脚本同时存在 CJS 和 ESM 两个完全一样的版本。 | 废弃删除 `.js`，保留 `.mjs`。 |
| **历史冗余技能库** | `.dsh/skills/` | 完全重复镜像了 `.agents/skills/` 中的内容。 | 清理删除 `.dsh/`，统一由 `.agents/` 管理。 |
| **版本库夹带大文件** | `.agents/src/大邮数学集-1.4.2.pdf` (4.8MB) | 将接近 5MB 的二进制教材直接存放在 Agent 配置目录中，污染 Git 历史。 | 移出仓库或使用 Git LFS 管理。 |
| **源码目录备份残留** | `src/config/features.config.mjs.bak`<br>`src/styles/custom.css.bak`<br>`astro.config.mjs.bak` | 历史热修遗留备份，容易误导后续开发者并产生修改分歧。 | 彻底清理。 |
| **脚本目录职责混乱** | `scripts/` (共 36 个脚本) | Python 爬虫/转换工具、Node 构建脚本、一次性修复补丁、测试脚本横向铺平堆砌。 | 建立清晰子目录 `scripts/build/`, `importers/`, `tests/`。 |

---

## 5. LOW 级别（轻度问题与潜在优化点）

1. **31 字节空壳组件 (`src/components/VpFooter.astro`)**：
   - 文件内容仅为 `<!-- Empty footer placeholder -->`，属于未完成的特性占位符，不影响运行但应清理。
2. **边缘特性配置常年关闭 (`imageBlur`)**：
   - `features.config.mjs` 中 `imageBlur.enabled = false`，但 `rehype-image-blur.mjs` 与客户端 `image-blur-loader.ts` 依然存留在代码库中。后续若无启用计划，可整套废弃。
3. **缺少针对 Astro 主站构建的 CI/CD 工作流**：
   - `.github/workflows/` 中拥有 LaTeX 云编译与 EPUB 发行，但缺少针对 `npm run build` 和 `npm run check:katex` 的自动化 PR 校验工作流，容易导致错误提交被推送到 main 分支。
