export function buildContext(chunks = [], capChars = 6000) {
  const parts = chunks.map((c, i) => {
    const meta = `【${c.type || '正文'}｜${c.title || ''}】`;
    const url = c.url ? `\n来源：${c.url}` : '';
    const trunc = c.truncated ? '（…该片段较长，上面只保留最相关部分）' : '';
    return `[${i + 1}] ${meta}${url}\n${c.text || ''}${trunc}`;
  });
  let ctx = parts.join('\n\n');

  if (capChars > 0 && ctx.length > capChars) ctx = `${ctx.slice(0, capChars)}\n…（上下文过长已截断）`;
  return ctx;
}

export function buildSystemPrompt(bookTitle = '本书', opts = {}) {
  const common = [
    `你是「${bookTitle}」相关学科的讲解与讨论助手。`,
  ];
  const linkNote = [
    `当回答涉及书中具体的定义、定理、性质、方法、结论或例题时，请给出一句**指向原文的 markdown 链接**，格式严格为 [章节或定理名称](url)（例如 [4.6 节定理 14](/collections/math/linear_algebra/46_秩/#定理-14)，括号内直接紧跟 url，绝不要有多余空格，直接使用片段/工具结果里给出的以 / 开头的“来源 url”，不要省去开头的斜杠 /，也不要擅自修改路径），让读者可直接回到原文核对。`,
  ];
  const neverSuggest = [
    `回答要**给出总结性的内容本身**，例如把相关的定义、定理、推导、方法、结论讲清楚；`,
    `**不要只给出“相关内容在第 X 章 / 请去查看原文”这类引导语**——那是把读者打发走；请先把自己的理解与书里的内容整理成完整答案讲给读者。`,
    `若片段或工具不足以完全回答，请如实说明你能确定的部分与不确定的部分，并给出**最接近的线索（带链接）**，不要编造。`,
  ];

  if (opts.discussion) {
    const lines = [
      ...common,
      `你可以基于自己的理解，就用户的疑问做深入、自由的讲解、推导与讨论，不局限于任何已提供的片段。`,
      `回答用中文：先给结论或观点，再展开推理、推导与例证；数学公式用 $...$ 或 $$...$$。`,
      ...neverSuggest,
      ...linkNote,
    ];
    if (opts.toolsDesc) {
      lines.push(`你没有被默认注入书中片段。默认请【不要检索】，优先基于自己的理解与已有的对话回答；仅当需要更精确的原文、或对某个知识点拿不准时，才调用下面的工具按需查找书内信息：${opts.toolsDesc}。`);
      lines.push(`调用工具并拿到结果后，请**结合工具结果给出总结性回答**；若某次回复只发起工具调用而没有正文，那么工具返回后请继续用正文作答，绝不以空内容结束。`);
      lines.push(`工具结果里常带“url”字段，可用它生成指向原文的 markdown 链接。`);
    }
    return lines.join('\n');
  }

  const lines = [
    ...common,
    `请基于给定的【书中片段】与工具检索结果，直接给出**完整、总结性的中文回答**：`,
    ...neverSuggest,
    `回答用中文：先给结论，再给必要的推理步骤与说明。数学公式用 $...$ 或 $$...$$。`,
    `引用信息来源时，在句末用上标形式标注来源编号，例如 …[1]、…[2]。编号与【书中片段】里标注的 [1]、[2]、[3] 一一对应；只引用实际出现的编号，不要引用没给出的编号。`,
    ...linkNote,
  ];
  if (opts.toolsDesc) {
    lines.push(`你可以调用以下工具来查找书内信息：${opts.toolsDesc}。当上下文不足或需要更精确的原文时调用工具；工具最多只需必要的几次，不要重复调用同一工具。`);
    lines.push(`调用工具并拿到结果后，必须结合工具结果给出总结性回答；若某次回复只发起工具调用而没有正文，那么工具返回后请继续用正文作答，绝不以空内容结束。`);
    lines.push(`工具结果里常带“url”字段，可用它生成指向原文的 markdown 链接。`);
  }
  return lines.join('\n');
}

export function buildMessages({ question, context, bookTitle = '本书', history = [], toolsDesc = '', discussion = false }) {
  const messages = [{ role: 'system', content: buildSystemPrompt(bookTitle, { toolsDesc, discussion }) }];
  for (const h of history || []) {
    if (h && h.role && typeof h.content === 'string' && h.content) {
      messages.push({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content });
    }
  }
  messages.push({
    role: 'user',

    content: discussion
      ? question
      : `书中片段（每段有来源编号与“来源 url”，可据此引用并生成指向原文的链接）：\n\n${context}\n\n请根据以上片段回答下面的问题，给出**总结性回答**；引用来源在句末用上标 [编号] 标注，并可为书中具体内容附上指向原文的 markdown 链接：\n${question}`,
  });
  return messages;
}

export async function streamChat({
  endpoint, apiKey, model, messages, onDelta, signal,
  tools, toolChoice, maxTokens,
}) {
  const body = { model, messages, stream: true };
  if (Array.isArray(tools) && tools.length) body.tools = tools.map((t) => (t && t.function ? t : { type: 'function', function: t }));
  if (toolChoice) body.tool_choice = toolChoice;
  if (Number.isFinite(maxTokens) && maxTokens > 0) body.max_tokens = Math.floor(maxTokens);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`LLM 请求失败 ${res.status}: ${text.slice(0, 300)}`);
  }
  if (!res.body) throw new Error('LLM 未返回可读流');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';
  const callAcc = new Map();
  let callSeq = 0;

  function absorbToolCalls(toolCalls) {
    for (const tc of toolCalls || []) {
      const i = tc.index ?? callSeq;
      const cur = callAcc.get(i) || { id: '', name: '', arguments: '' };
      if (tc.id) cur.id = tc.id;
      if (tc.type) cur.type = tc.type;
      if (tc.function) {
        if (tc.function.name) cur.name += tc.function.name;
        if (tc.function.arguments) cur.arguments += tc.function.arguments;
      }
      if (i >= callSeq) callSeq = i + 1;
      callAcc.set(i, cur);
    }
  }

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta || {};
        if (typeof delta.content === 'string' && delta.content) {
          full += delta.content;
          onDelta && onDelta(delta.content);
        }
        if (Array.isArray(delta.tool_calls) && delta.tool_calls.length) {
          absorbToolCalls(delta.tool_calls);
        }
      } catch {

      }
    }
  }

  buffer += decoder.decode();
  if (buffer) {
    const remainingLines = buffer.split('\n');
    for (const line of remainingLines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta || {};
        if (typeof delta.content === 'string' && delta.content) {
          full += delta.content;
          onDelta && onDelta(delta.content);
        }
        if (Array.isArray(delta.tool_calls) && delta.tool_calls.length) {
          absorbToolCalls(delta.tool_calls);
        }
      } catch {}
    }
  }

  const toolCalls = [];
  for (const cur of callAcc.values()) {
    let args = {};
    try { args = JSON.parse(cur.arguments || '{}'); } catch { args = {}; }
    toolCalls.push({ id: cur.id || '', name: cur.name || '', arguments: args });
  }

  return { text: full, toolCalls };
}
