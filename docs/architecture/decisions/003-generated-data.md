# ADR 003: 生成数据隔离与公共目录白名单准入 (Generated Data & Public Hygiene)

- **状态**：Accepted
- **日期**：2026-09-06
- **决策者**：AstroLib 架构委员会

---

## 1. 当前问题 (Context & Problem Statement)

1. **`public/` 目录严重污染（违反 Rule 5）**：
   - 现行测试脚本（如 `test-latex-export.mjs`）在执行测试时，直接将编译产物与运行日志输出到 `public/`；
   - 导致 `public/` 下遗留了 `test_exam_output.aux`, `.idx`, `.log`, `.mst`, `.pdf`, `.tex`, `.typ` 以及 `missfont.log` 等 18 个测试生成文件（超 600 KB）；
   - 由于 Astro 构建机制是将 `public/` 原样无条件拷贝至 `dist/`，这些测试碎片、失败日志与未定稿 PDF 被直接公网分发，构成生产环境泄漏。
2. **生成数据（Generated Data）黑盒化与身份缺失（违反 Rule 4）**：
   - 现有的 `public/ai-index/`、`public/relation-graphs/`、`public/inspector-data/` 均为脚本生成的数据，但 JSON 内部缺乏统一的元数据标示，外界无法一眼判断该数据是“手写的真实源”还是“可随时销毁重建的中间产物”。

---

## 2. 决策 (Decision)

1. **建立独立的 `generated/` 根目录或受控产物管线**：
   - 所有在构建期自动衍生、可完全复现的数据（跨页引用字典、AI 切片索引、关系图谱数据、预渲染 KaTeX 题目、EPUB 打包）归类为**生成数据 (Generated Data)**；
   - **标明生成来源（Rule 4）**：每个生成的 JSON 产物必须在头部注入标准元数据字段：
     ```json
     {
       "_meta": {
         "generated": true,
         "generator": "scripts/build/build-ai-index.mjs",
         "source_input": "src/content/docs/collections/math/math_analysis",
         "generated_at": "2026-09-06T12:00:00Z"
       },
       "data": { ... }
     }
     ```
2. **推行 `public/` 严格白名单准入（Rule 5）**：
   - `public/` 仅允许存放直接面向读者的纯静态文件：
     - 允许：`covers/`（封面图片）、`favicon.svg`、以及构建脚本显式放入的已校验静态分片；
     - 严禁：测试输出 (`test_*`)、编译器中间文件 (`*.aux`, `*.idx`, `*.mst`)、运行日志 (`*.log`)、临时文件 (`*.tmp`)；
   - 所有测试脚本的输出目录一律强制重定向至 `.tmp/test-output/`，严禁踏入 `public/` 半步。

---

## 3. 原因 (Rationale)

- **生产分发安全**：确保发布上线的网站没有任何测试日志和中间编译器垃圾，减少网络传输流量，维护学术站点的严谨形象。
- **可复现性（Reproducibility）保障**：明确标明数据来源后，任何开发者或 Agent 都可以放心删除 `generated/` 或 `public/data/`，并随时通过一键命令完整重新生成。

---

## 4. 替代方案 (Alternatives Considered)

- **方案 A：将生成数据直接提交并混在 `src/data/` 中**
  - *弃用原因*：生成数据体积庞大（数 MB），混在 `src/` 中会严重干扰 Git 差异比对与 IDE 检索，并混淆真实源。
- **方案 B：完全不生成静态 JSON，全部改为浏览器客户端运行时动态计算**
  - *弃用原因*：计算 300+ 章节的跨页引用拓扑和全书 KaTeX 公式需要大量 CPU 算力，客户端动态计算会导致移动端严重卡顿白屏，破坏毫秒级阅读体验。

---

## 5. 风险 (Risks)

- 客户端 fetch 的 URL 路径如果发生变动（例如从 `/data/...` 改为其他路径），需要同步更新客户端各加载器的请求路径。

---

## 6. 迁移策略 (Migration Strategy)

1. **Phase 1（立即执行）**：彻底清除 `public/` 下遗留的所有 `test_*` 文件与 `.log` 日志；
2. **Phase 1（修正测试）**：修改 `scripts/test-latex-export.mjs`，将其输出重定向至 `.tmp/`；
3. **后续阶段**：在构建脚本中统一步伐，为生成的 JSON 附加标准 `_meta` 签名。
