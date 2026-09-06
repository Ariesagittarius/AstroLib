# ADR 002: 单一真实源确立与源码不可变性保障 (Source of Truth & Mutability)

- **状态**：Accepted
- **日期**：2026-09-06
- **决策者**：AstroLib 架构委员会

---

## 1. 当前问题 (Context & Problem Statement)

AstroLib 当前在数据源定义与修改控制上面临严重违规：
1. **源码树遭受运行时物理篡改（违反 Rule 9）**：
   - 开发模式下，前端在习题修改页面提交后，Vite 插件 [`src/utils/exercise-editor/dev-server-plugin.mjs`](file:///d:/Antigravity/project/AstroLib/src/utils/exercise-editor/dev-server-plugin.mjs) 会调用 `fs.writeFileSync` 直接将修改内容写回 Git 追踪下的源文件 `src/data/exercises/engineering_analysis_exercises.json`，并同步执行 `execSync` 重新构建。这极易造成源文件物理损坏、产生冲突脏树，且不可撤销。
2. **海量原始非结构化数据挤占源码目录**：
   - `src/data/exercises/` 堆积了超过 **14 MB** 的 JSON 数据与 175 套原始试卷文件，将原本应作为离线输入源的原始题库错误放置在 `src/` 下，导致编译期内存爆炸（必须 `--max-old-space-size=4096`）。
3. **真实源与衍生源边界模糊**：
   - `engineering_analysis_exercises.json` 是从 `bupt_math_full_database.json` 衍生清洗出来的，但由于缺少自动化版本追踪与隔离，二者并列放置，后续修改时极易产生“到底哪一个是真实源”的认知混乱。

---

## 2. 决策 (Decision)

确立并强制推行**单一真实源原则（Single Source of Truth）**与**源码运行时不可变法则（Immutability at Runtime）**：

1. **唯一真实源清单**：
   - **图书与目录**：`src/config/collections.config.mjs`
   - **特性与开关**：`src/config/features.config.mjs`
   - **教材正文**：`src/content/docs/**/*.mdx`
   - **基础题库数据库**：外置于项目根目录 `data/source/`（移出 `src/`）
2. **严禁运行时直接篡改源码**：
   - 开发服务器、Vite 插件和运行时端点**绝对禁止**物理覆盖写入任何由 Git 追踪的源文件；
   - 开发者或读者的编辑动作，统一转为生成**差异补丁 (Patch / Diff)** 或保存至独立的本地草稿暂存区 (`.cache/drafts/` / 本地 IndexedDB)；只有在开发者执行显式的 CLI 确认命令时，方可合并写回；
   - 彻底废除在 HTTP 请求线程中同步执行 `execSync('node scripts/...')` 的反模式。

---

## 3. 原因 (Rationale)

- **系统稳定性保障**：防止因网络闪断、JSON 序列化中断或并发写入造成的核心学术数据损坏。
- **构建性能与内存大幅改善**：将 14MB+ 原始数据移出 `src/` 后，TypeScript 编译器和 Vite 依赖分析器无需再解析这数十万行 AST，大幅削减开发环境首屏与热重载耗时。
- **审计追踪清晰**：所有对教材或题库的变更，都必须作为明确的 Git Commit 记录，杜绝黑盒静默写盘。

---

## 4. 替代方案 (Alternatives Considered)

- **方案 A：继续允许开发环境物理写回，但增加自动 `.bak` 备份**
  - *弃用原因*：项目已经产生了大量无用的 `.bak` 文件（如 `features.config.mjs.bak`），污染版本库且无法防止 Git 脏树问题。
- **方案 B：直接接入外部云端数据库（如 Supabase / PostgreSQL）完全取代本地 JSON**
  - *弃用原因*：破坏了 AstroLib “纯静态、零运维成本、离线可构建”的学术出版初心，增加了外部服务强依赖。

---

## 5. 风险 (Risks)

- **开发期编辑闭环需要重构适配**：前端在线修改题目的工作流需要重构为“生成 Draft ➔ 预览 ➔ 导出 Patch / 显式保存 CLI”，开发者需要适应新的草稿提交机制。

---

## 6. 迁移策略 (Migration Strategy)

1. **第一步（隔离）**：在 `data/` 根目录下建立 `data/source/`，作为离线源数据仓库；
2. **第二步（安全网）**：修改 `dev-server-plugin.mjs`，切断直接覆写 `src/data/` 的逻辑，重定向到临时草稿文件；
3. **第三步（轻量化）**：`src/data/` 仅保留构建期和前端运行真正需要的轻量化静态数据字典。
