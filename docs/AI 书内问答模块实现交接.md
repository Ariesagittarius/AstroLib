# AI 书内智能问答 · 实现验收与交接记录

> 本文档记录第二版 AI 书内问答模块（`aiAsk` 功能）已落地的能力、关键改动、存储约定与验证方式，供后续 agent 直接接手。设计总览见《AI 赋能模块设计.md》。

---

## 一、已实现能力（对照需求清单）

| # | 需求 | 实现点 | 相关文件 |
|---|---|---|---|
| UI-1 | AI 回复公式缺乏渲染 | 流式过程中**逐帧 KaTeX 渲染**（`renderMathInElement`），`$$…$$`/`$…$` 双 delimiter、`throwOnError:false` 容错 | `AIAsk.astro` `_generateAnswer` |
| UI-2 | 引用源显示为脚注 + 提前告知规范引用 | `buildContext` 每段标 `[1]…[n]`；系统提示要求“句末上标 `[n]`”且“只引用实际编号”；前端把回答 `[n]` 转成**可点击上标脚注**，底部渲染**“来源”编号列表**（`1·类型 标题`+跳转原文） | `src/ai/llm.mjs`、`AIAsk.astro` |
| UI-3 | 设置抽屉显示不全、不可滚动 | `.ask-settings`/`.ask-history` 增加 `max-height: min(62vh, 470px)` + `overflow-y: auto` + `overscroll-behavior: contain`，内容多时可在抽屉内滚动 | `AIAsk.astro` CSS |
| UI-4 | 历史会话没保存、找不到以前对话 | **每书会话线程存 localStorage**（`dsh-aiask-threads-<col>-<book>`），刷新/重开页面自动恢复上次活动会话；头部新增「历史」按钮 → 历史列表面板，可**切换/删除/新建会话**；会话标题取首条提问 | `AIAsk.astro` |
| UI-5 | 来源卡死板、看不到命中内容 | `_renderSources` 每张来源卡显示**被命中内容的摘要**（`capSnippet`：折叠空白+截断，规避 `\r\n` 断行），可跳转原文 | `AIAsk.astro` |
| UI-6 | 回答与工具调用堆在底部、topK 来源遮挡流式回复 | **顺序流式输出**：不再把整段回答与所有工具调用堆进同一容器，而是按 `【AI 回复 1】→【工具调用】→【AI 回复 2】→【工具调用】【工具调用】` 的次序逐个追加独立块（`.ask-blocks` 内 `.ai-md.ask-ai-reply` 与 `.ask-tool-block` 交替）；**来源引用改为回答完成后才出现**，且渲染为**横向滑动条**（`.ask-sources` 改用 `flex-direction:row` + `overflow-x:auto`，来源卡片固定 `13.5rem` 宽），避免流式期间遮挡/抢占底部滚动、节省纵向空间 | `AIAsk.astro` 的 `_ask` / `_generateAnswer`、CSS |
| 逻辑-1a | 告知 AI 可用工具查找 | 系统提示注入“可用工具 + 适当调用”指引；`streamChat` 支持 OpenAI function-calling | `llm.mjs` |
| 逻辑-1b | 多轮回复机制 | `this._history` 累积历史（同书内，切书清空，上限 12 条），追问带上下文；`buildMessages` 组装 system+history+user | `AIAsk.astro`、`llm.mjs` |
| 逻辑-1c | 工具调用显示 | `_generateAnswer` 函数调用循环（上限 6 轮），面板内**🔧 工具调用块**；块内**参数与原始结果可折叠**（默认收起，保留原始 JSON 供排查） | `AIAsk.astro` |
| 逻辑-2 | 自定义 topK / 最大 token / 最大回答长度 | 设置面板新增 **topK / 上下文总字符上限 / 回答最大 token** 输入（存 localStorage）；`max_tokens` 已传入请求 | `AIAsk.astro`、`llm.mjs` |
| 逻辑-3a | 每模型独立 API Key | 按 `dsh-aiask-key-<modelId>` 存储，回退旧全局 Key；切换模型自动读对应 Key | `AIAsk.astro` |
| 逻辑-3b | 自定义接入接口 | 端点可编辑覆盖（`dsh-aiask-endpoint-<modelId>`）；**可新增自定义模型**（id/显示名/端点/Key），合并进模型下拉 | `AIAsk.astro` |
| 逻辑-4 | 上下文 / 回答最大 token 允许 `-1`（不限制） | `_params()` 对 `maxContextChars`/`maxAnswerTokens` 支持 `-1`；`buildContext` 在 `cap<=0` 时不截断；`streamChat` 仅在 `max_tokens>0` 时设置（`-1` 省略该字段=由服务商默认） | `AIAsk.astro`、`src/ai/llm.mjs` |
| 逻辑-5 | 工具调用展示太乱（裸 dump JSON / 截断） | 新增 `_toolBlocksHtml`/`_jsonHtml`：工具栏块**可折叠**，**参数与原始结果默认收起**，展开后**JSON 语法高亮**；摘要行人类可读（含命中前 2 条标题）。结果经 `runClientTool`→`role:'tool'`+`tool_call_id` **逐条回传模型**，保证上下文/结果正确 | `AIAsk.astro` |
| 逻辑-6 | 深度讨论模式（不默认检索） | 设置抽屉新增「回答方式」下拉（`dsh-aiask-mode`）：默认「检索本书」＝当前行为（注入 topK 片段+来源卡）；切换「深度讨论」后**不做 topK 检索、不注入片段、不渲染来源卡**，AI 基于理解与对话历史深入讲解。用**讨论版系统提示**告知模型「默认不要检索、需要原文时按需调用检索工具」（索引懒加载，`list_books` 除外）；讨论回答不做脚注化，避免把偶发 `[n]` 误转成死链 | `AIAsk.astro`、`src/ai/llm.mjs` |

---

## 二、关键文件与职责

- `src/components/AIAsk.astro`：Web Component `ai-ask`，VitePress 风格浮动面板。全部逻辑在 `<script>`（浏览器）。
- `src/ai/llm.mjs`：能力层原语。
  - `buildContext(chunks, cap)` → 编号上下文 `[n] 【类型｜标题】\n文本`。
  - `buildSystemPrompt(bookTitle, opts)` → 只依据片段、可溯源、中文+公式、`[n]` 上标引用、可用工具说明。
  - `buildMessages({question, context, bookTitle, history, toolsDesc})` → system + history + user。
  - `streamChat({endpoint, apiKey, model, messages, onDelta, signal, tools, toolChoice, maxTokens})` → 返回 `{text, toolCalls}`，聚合流式 `delta.tool_calls`。
- `src/ai/tools-client.mjs`（**新增**）：客户端可执行检索工具，全部基于已加载索引。
  - `buildToolDefs()` → OpenAI 工具定义（`list_books`/`book_toc`/`book_retrieve`/`book_chunk`/`book_slice_search`）。
  - `runClientTool(name, args, ctx)` → 实际执行（`ctx = { index, bookList, col, book }`）。
  - `toolsDesc()` → 系统提示里的人类可读工具清单。

---

## 三、设计取舍 / 已知约束

1. **静态站零后端**：浏览器端工具只做“基于已加载索引的检索”。文件级工具（`python_exec`、按原始 MDX 行扫描）仍只在服务端 `src/ai/mcp/tools.mjs`（MCP 宿主/本地用），**不**在浏览器暴露——避免引入 serverless/adapter 改动。
2. **工具循环自持**：模型调用 → 客户端执行 → 回传 `tool` 结果 → 继续，默认上限 6 轮防死循环。
3. **体系内不重复造向量库**：检索仍用 `retriever.mjs` 的 keyword/BM25-ikdf 打分；`hybrid` 为预留。
4. **Key/端点/参数均在 localStorage**，不落地、不随构建产物暴露；建议服务商侧绑定受限 Key。
5. **多轮历史为纯文本**（user/assistant 截断到文本），不落 `tool` 消息，避免无限膨胀。
6. **`[n]` 脚注转换是全文本正则**：对回答里的形如 `[1]` 都会转成脚注链接；若模型在不该用的地方写 `[1]`（如列表项）也会被转换——属已知可接受取舍。
7. **`-1` = 不限制是用户自担成本**：默认仍用 config 上限（`maxContextChars/maxAnswerTokens`）；一旦用户把输入设为 `-1`，`buildContext` 不再截断、`max_tokens` 字段不再发送（由服务商默认值决定），token 消耗由用户自担。
8. **工具结果编号局限**：模型经工具（如 `book_retrieve`）再取到的片段**不进入** `buildContext` 的 `[1]…[n]` 编号，因此若模型对这些结果用 `[n]` 引用，脚注可能与底部“来源”列表（仅初始 topK）对不上——属已知限制；已通过「来源卡带内容摘要 + 工具块可展开原始结果」缓解可追溯性（完全对齐见待办）。
9. **历史会话持久化只存展示所需数据**：线程内每条消息存 `{role,text,sources,tools}`，工具只存 `name/args/summary/resultText`（截断 JSON，不存大对象）；单会话消息上限 `MAX_MSGS=60`、每书会话上限 `MAX_THREADS=30`，控制 localStorage 体积。

---

## 四、存储 key（localStorage）

| key | 用途 |
|---|---|
| `dsh-aiask-model` | 上次选中的模型 id |
| `dsh-aiask-key-<modelId>` | 每模型 API Key |
| `dsh-aiask-key` | （兼容回退）旧版全局 Key |
| `dsh-aiask-endpoint-<modelId>` | 每模型端点覆盖 |
| `dsh-aiask-custom-models` | 自定义模型数组 `[{id,label,endpoint}]` |
| `dsh-aiask-topk` / `dsh-aiask-maxctx` / `dsh-aiask-maxtok` | topK / 上下文字符 / 最大 token（`maxctx`/`maxtok` 可为 `-1` = 不限制） |
| `dsh-aiask-mode` | 回答方式：`retrieve`（检索本书，默认，带来源引用）| `discussion`（深度讨论，不默认检索、AI 按需查原文） |
| `dsh-aiask-src-open` | 来源跳转方式 `new`/`same` |
| `dsh-aiask-threads-<col>-<book>` | 该书会话列表 `[{id,title,createdAt,updatedAt,messages}]`（messages 每条 `{role,text,sources,tools,segments?}`；`segments` 为顺序块 `[{kind:'reply',text}|{kind:'tool',name,args,summary,resultText}]`，恢复时按序拼装；旧数据无 `segments` 时回退为 `[完整文本]+[全部工具]` 布局） |
| `dsh-aiask-active-<col>-<book>` | 该书当前活动会话 id，用于刷新/重开恢复 |

---

## 五、验证方式

- **能力层（已跑通）**：用真实索引 `public/ai-index/math-math_analysis.json` 在 Node 下验证：
  - `buildSystemPrompt` 含引用编号指令 + 工具指引；
  - `buildContext` 编号 `[1][2]`；`buildMessages` 组装 system+history+user；
  - `runClientTool`：`book_retrieve`（夹逼定理 命中）、`book_chunk`、`book_slice_search`、`book_toc`(120 条)、`list_books` 均正确；`buildToolDefs` 5 个工具。
- **前端（需浏览器实测）**：本沙箱无法运行 Astro build/dev（`astro.config` 加载期失败，与改动无关）。请在 `http://localhost:4321` 打开任一书页 → 右下角「AI 提问」→ ⚙ 填 Key/选模型/调参数 → 提问观察：
  1. 流式公式是否会实时渲染；
  2. 回答里的 `[n]` 是否可点击跳到底部“来源”（带内容摘要）；
  3. 模型是否按需调用工具并显示 🔧 工具块（参数/原始结果可展开）；
  4. 追问是否带上下文（多轮）；
  5. 设置抽屉内容较多时是否可内部滚动（UI-3）；
  6. 刷新页面/切书回来是否恢复上次会话；头部「历史」能否切换/删除/新建会话（UI-4/5）；
  7. 把「上下文总字符上限/回答最大 token」填 `-1` 后，回答是否不再被截断（逻辑-4）；
  8. **顺序流式（UI-6）**：是否按 `【回复】→【工具】→【回复】` 逐块出现；流式期间“来源”不出现、回答结束才出现且为**横向滑动条**（可左右滚动、不纵向堆叠）；
  9. **来源恢复**：刷新/切回会话后，旧回答的 `[n]` 仍可点到底部“来源”，且来源卡片保持横向布局。

---

## 六、待办 / 后续候选

- 若需**站点托管 Key + 读者零配置**：把生成层换成服务端 adapter（检索层不动）。
- `python_exec` / 原始行级切片如需在浏览器用：要么开 serverless 端点，要么在 `tools-client` 补一个“基于索引文本的近似的 slice search”（当前 `book_slice_search` 已是索引级子串/正则，可视为该需求的轻量替代）。
- 可按需在产品里扩展自定义模型是否允许删除/改名为真实 CRUD（当前仅可新增）。
- 若需**工具结果与 `[n]` 引用完全对齐**：把模型工具（尤以 `book_retrieve`）命中的片段与初始 topK 合并、统一重新编号后再送入 `buildContext`，并同步刷新“来源”列表（当前工具命中不进入 `[n]` 编号，见“已知约束 8”）。
- **`-1` 不限制的安全提示**：设置面板对 `-1` 目前无二次提醒；若担心用户误用导致高消耗，可加一个“不限制将显著增加 token 消耗”的提示或改成仅开发者可见的档位。
