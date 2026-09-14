# Git 提交规范与代码同步

本文档说明 AstroLib 项目中的版本控制规范、Git 提交信息约束以及双轨代码分发机制。

---

## 1. 学术级 Commit 规范（Academic Restrained Spec）

为保持工程演进历史的严谨、清晰与学术沉淀，所有代码提交必须遵循以下准则：

### 1.1 核心约束
- **纯英文撰写**：提交摘要与正文必须使用简洁客观的英文（ASCII 字符），禁止中英混杂；
- **禁止任何 Emoji 表情**：严禁在提交信息中使用任何 Emoji（如 🎉, 🚀, ✨, 🔥 等）；
- **客观克制文风**：禁止夸张修辞与营销词汇，以祈使语气（Imperative mood）准确陈述改动的实质内容与原因。

### 1.2 提交格式
```text
<type>(<scope>): <imperative summary>
```

- **有效类型（Type）**：
  `feat`, `fix`, `perf`, `refactor`, `docs`, `style`, `chore`, `test`, `release`, `ci`, `build`
- **有效作用域（Scope）**：
  `(content)`, `(katex)`, `(ui)`, `(ai)`, `(epub)`, `(sidebar)`, `(header)`, `(render)`, `(editor)`, `(ci)`, `(core)`

### 1.3 规范示例
```text
feat(content): import linear algebra textbook and chapter exercises
fix(layout): prevent math formula overflow on mobile viewport
perf(render): pre-render heading formulas during build time
refactor(sidebar): decouple book traversal from state manager
chore(ci): configure automated EPUB release pipeline
```

### 1.4 本地自动校验
在执行提交前，可通过以下命令进行规范性检查：
```bash
npm run check:commit
```

---

## 2. 双轨代码同步机制（Dual-Repo Distribution）

AstroLib 支持开源公开分发与内部私有开发双轨并行维护：

### 2.1 机制设计
1. **本地与私有分支保留完整注释**：本地工作区与私有仓库中保留详细的架构解析、技术备忘与设计注释；
2. **公开仓库自动剥离注释**：为了避免冗余或陈旧的注释干扰外部协作与外部 AI Agent 分析，推送到公开开源仓库（`origin`）的代码将通过沙箱脱敏流水线自动剥离行内说明注释。

### 2.2 常用推送命令
- **一键自动化提交与推送（推荐）**：
  ```bash
  npm run push
  ```
  自动执行格式校验、学术规范门禁与远端同步。
- **仅推送到公开端（自动脱敏剥离注释）**：
  ```bash
  npm run push:clean
  ```
- **仅推送到私有端（保留完整注释备份）**：
  ```bash
  npm run push:private
  ```
- **双端全量同步**：
  ```bash
  npm run push:all
  ```
