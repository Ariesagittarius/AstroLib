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
    `你是「${bookTitle}」相关学科的高级学术讲师与知识答疑导师。你的职责是为读者深入、透彻、清晰地讲解知识本身，必须输出具有实质学术价值、条理严谨的汇总回答。`,
  ];
  const linkNote = [
    `当回答涉及书中具体的定义、定理、性质、方法、结论或例题时，请在正文中自然地给出一句**指向原文的 markdown 链接**，格式严格为 [章节或定理名称](url)（例如 [4.6 节定理 14](/collections/math/linear_algebra/46_秩/#定理-14)，括号内直接紧跟 url，绝不要有多余空格，直接使用片段/工具结果里给出的以 / 开头的“来源 url”，不要省去开头的斜杠 /，也不要擅自修改路径），让读者可直接回到原文核对。来源链接应当作为论述的佐证自然嵌入，绝不要把链接列表单独堆砌成回答。`,
  ];
  const coreAcademicRules = [
    `【核心回答准则 · 实质性学术汇总】：`,
    `1. **实质内容优先**：回答必须直接解决读者的学术疑惑。完整阐明核心结论、概念定义、定理条件、推导逻辑、关键数学公式、计算步骤或几何/物理直观，做到言之有物、推导严密、条理清晰。`,
    `2. **绝对严禁仅罗列来源清单**：`,
    `   - 严禁像搜索引擎一样仅输出“找到了以下关键资料：1. 附录... 2. 第X章...”或“命中X条”这类的清单当做回答；`,
    `   - 严禁只给出“关于此问题请参考第 X 章 / 请去查看原文”等空洞引导语把读者打发走；`,
    `   - 严禁对检索片段做生硬拼接。你必须对获取到的所有内容进行**归纳、消化、提炼与融会贯通**，组织成连贯、深刻、有逻辑的学术讲解文本。`,
    `3. **标准学术解答结构**：`,
    `   - **直接结论**：首段开门见山，正面回答读者的核心问题（直接给出定理定义、核心公式、参数方程或计算答案）；`,
    `   - **深入解析与推导**：分步骤展开关键推导、数学公式、成立条件或典型解法。数学公式规范书写：行内公式用 $...$，独立块级公式用 $$...$$；`,
    `   - **融会总结与原文溯源**：自然地将指向原文的 markdown 链接融入讲解脉络中，使来源服务于正文论述。`,
    `4. **专业知识学术兜底**：`,
    `   - 若书中检索片段或工具结果未能完全覆盖所有细节，**严禁仅抛出搜索失败或空清单**！`,
    `   - 必须基于你作为专业导师深厚的学科底蕴，直接给出标准、严谨的学科通用解答与推导，并说明书中可参考的相近 [章节名称](url) 供读者延伸阅读。`,
  ];

  if (opts.discussion) {
    const lines = [
      ...common,
      `你可以基于自己的专业理解，就用户的疑问做深入、自由的学术讲解、推导与讨论，不局限于任何已提供的片段。`,
      `回答用中文：先给结论，再展开严谨的数学推导、逻辑论证与例题说明；数学公式规范书写（行内 $...$，块级 $$...$$）。`,
      ...coreAcademicRules,
      ...linkNote,
    ];
    if (opts.toolsDesc) {
      lines.push(`你没有被默认注入书中片段。默认优先基于自己的专业知识与已有对话深入回答；当需要查验书中精确原文、公式编号或特殊例题时，按需调用工具：${opts.toolsDesc}。`);
      lines.push(`调用工具拿到结果后，必须**结合工具返回的内容与你的学科知识，直接输出完整的实质性汇总解答**；若某次回复发起了工具调用，工具返回后请立即用详实正文作答，绝不以空内容或纯来源列表结束。`);
    }
    return lines.join('\n');
  }

  const lines = [
    ...common,
    `请基于给定的【书中片段】与工具检索结果，结合你的深厚专业学科知识，直接给出**完整、有深度、总结性的中文解答**：`,
    ...coreAcademicRules,
    `回答用中文：先给结论，再给必要的推导步骤与原理解析。数学公式规范书写：行内公式用 $...$，块级公式用 $$...$$。`,
    `引用信息来源时，在句末用上标形式标注来源编号，例如 …[1]、…[2]。编号与【书中片段】里标注的 [1]、[2]、[3] 一一对应；只引用实际出现的编号，不要引用没给出的编号。`,
    ...linkNote,
  ];
  if (opts.toolsDesc) {
    lines.push(`你可以调用以下工具来查阅书内更详尽的信息：${opts.toolsDesc}。工具用于查证具体原文、定理编号与例题。`);
    lines.push(`每次调用工具并获得返回后，你的核心任务是**将检索到的知识与你的学术储备融会贯通，直接为读者输出高价值的实质性汇总回答**。绝不允许只将工具的原始返回或来源清单倾倒给读者，绝不以空内容结束。`);
  }
  return lines.join('\n');
}

export function buildMessages({ question, context, bookTitle = '本书', history = [], toolsDesc = '', discussion = false, chapterRef = null, chapterRefs = null, extendedThinking = false }) {
  const messages = [{ role: 'system', content: buildSystemPrompt(bookTitle, { toolsDesc, discussion }) }];
  for (const h of history || []) {
    if (h && h.role && typeof h.content === 'string' && h.content) {
      messages.push({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content });
    }
  }

  const refs = Array.isArray(chapterRefs) && chapterRefs.length > 0
    ? chapterRefs
    : (chapterRef && chapterRef.title ? [chapterRef] : []);

  let chapterPrefix = '';
  let chapterHint = '';

  if (refs.length === 1) {
    const r = refs[0];
    chapterPrefix = `【读者当前正在查看的本章节】：${r.title}${r.url ? `（链接：${r.url}）` : ''}\n${
      r.text ? `本章正文片段：\n${r.text.slice(0, 4000)}\n\n` : '\n'
    }`;
    chapterHint = `（优先结合当前引用的《${r.title}》章节内容）`;
  } else if (refs.length > 1) {
    const lines = refs.map((r, i) => {
      return `${i + 1}. 《${r.title}》${r.url ? `（链接：${r.url}）` : ''}\n${
        r.text ? `   正文片段：\n   ${r.text.slice(0, 2500)}\n` : ''
      }`;
    });
    chapterPrefix = `【读者引用的相关章节内容】：\n${lines.join('\n')}\n\n`;
    chapterHint = `（优先结合读者引用的《${refs.map((r) => r.title).filter(Boolean).join('》、《')}》等章节内容进行交叉分析与讲解）`;
  }

  const thinkingHint = extendedThinking
    ? '\n【思考深度模式】：已开启扩展深度思考，请在回答中展开全面、深入、步骤详尽的逻辑推演与数学论证，条理分明地阐明核心机制。'
    : '';

  messages.push({
    role: 'user',

    content: discussion
      ? `${chapterPrefix}${question}\n\n【回答要求】：请直接给出有深度、有逻辑、有推导的实质性中文学术解答${chapterHint}，把具体概念、定理或推导讲透彻；严禁仅罗列检索条目或来源清单！${thinkingHint}`
      : `${chapterPrefix}书中检索片段（每段有来源编号与“来源 url”，可据此引用并生成指向原文的链接）：\n\n${context}\n\n【用户提问】：\n${question}\n\n【回答要求】：\n请根据以上片段及你的专业学科知识${chapterHint}，直接给出具有实质学术价值、有逻辑、有推导的完整中文汇总解答。把具体的定义、定理、公式推导或计算步骤讲解透彻；引用来源在句末用上标 [编号] 标注，并为关键内容自然附上指向原文的 markdown 链接。严禁仅罗列片段或来源清单！${thinkingHint}`,
  });
  return messages;
}

export async function streamChat({
  endpoint, apiKey, model, messages, onDelta, onReasoningDelta, signal,
  tools, toolChoice, maxTokens,
}) {

  const isGemini =
    (typeof model === 'string' && model.toLowerCase().includes('gemini')) ||
    (typeof endpoint === 'string' && (endpoint.includes('googleapis.com') || endpoint.includes('/proxy/gemini')));

  const normalizedMessages = (messages || []).map((m) => {
    if (!m || m.role !== 'assistant' || !Array.isArray(m.tool_calls) || !m.tool_calls.length) {
      return m;
    }
    if (isGemini) {
      const fixedCalls = m.tool_calls.map((tc, idx) => {
        const copy = { ...tc };
        const hasSig = copy.extra_content?.google?.thought_signature;
        if (!hasSig) {
          copy.extra_content = {
            ...(copy.extra_content || {}),
            google: {
              ...((copy.extra_content && copy.extra_content.google) || {}),
              thought_signature: 'skip_thought_signature_validator',
            },
          };
        }
        return copy;
      });
      return { ...m, tool_calls: fixedCalls };
    } else {
      const cleanCalls = m.tool_calls.map((tc) => {
        if (!tc || typeof tc !== 'object') return tc;
        const { extra_content, ...rest } = tc;
        return rest;
      });
      return { ...m, tool_calls: cleanCalls };
    }
  });

  const body = { model, messages: normalizedMessages, stream: true };
  if (Array.isArray(tools) && tools.length) body.tools = tools.map((t) => (t && t.function ? t : { type: 'function', function: t }));
  if (toolChoice) body.tool_choice = toolChoice;

  if (isGemini) {

    body.extra_body = {
      google: {
        thinking_config: {
          thinking_level: 'high',
          include_thoughts: true,
        },
      },
    };

    body.max_tokens = maxTokens && maxTokens > 0 ? Math.max(maxTokens, 16384) : 16384;
  } else if (maxTokens && maxTokens > 0) {
    body.max_tokens = maxTokens;
  }

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
    const err = new Error(`LLM 请求失败 ${res.status}: ${text.slice(0, 300)}`);
    err.status = res.status;
    err.statusCode = res.status;
    err.responseBody = text;
    throw err;
  }
  if (!res.body) throw new Error('LLM 未返回可读流');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';
  let fullReasoning = '';
  let insideThinkTag = false;
  let streamExtraContent = null;
  const callAcc = new Map();
  let callSeq = 0;

  function absorbToolCalls(toolCalls, extraFromDelta) {
    for (const tc of toolCalls || []) {
      const i = tc.index ?? callSeq;
      const cur = callAcc.get(i) || { id: '', name: '', arguments: '', extra_content: null };
      if (tc.id) cur.id = tc.id;
      if (tc.type) cur.type = tc.type;
      if (tc.function) {
        if (tc.function.name) cur.name += tc.function.name;
        if (tc.function.arguments) cur.arguments += tc.function.arguments;
      }
      if (tc.extra_content) {
        cur.extra_content = tc.extra_content;
      } else if (tc.thought_signature) {
        cur.extra_content = { google: { thought_signature: tc.thought_signature } };
      } else if (!cur.extra_content && extraFromDelta) {
        cur.extra_content = extraFromDelta;
      } else if (!cur.extra_content && streamExtraContent) {
        cur.extra_content = streamExtraContent;
      }
      if (i >= callSeq) callSeq = i + 1;
      callAcc.set(i, cur);
    }
  }

  function processDelta(delta, rawJson, choice) {
    if (!delta) return;

    const isExplicitThought =
      delta.thought === true ||
      choice?.thought === true ||
      rawJson?.thought === true ||
      Boolean(delta.reasoning_content) ||
      Boolean(delta.reasoning) ||
      (typeof delta.thought === 'string' && delta.thought.length > 0) ||
      delta.extra_content?.google?.thought === true ||
      (typeof delta.extra_content?.google?.thought === 'string' && delta.extra_content.google.thought.length > 0);

    let reasoningChunk =
      delta.reasoning_content ||
      delta.reasoning ||
      (typeof delta.thought === 'string' ? delta.thought : null) ||
      (typeof delta.extra_content?.google?.thought === 'string' ? delta.extra_content.google.thought : null);

    if (!reasoningChunk && Array.isArray(delta.parts)) {
      const thoughtParts = delta.parts.filter((p) => p && p.thought && typeof p.text === 'string');
      if (thoughtParts.length) {
        reasoningChunk = thoughtParts.map((p) => p.text).join('');
      }
    }

    if (isExplicitThought && !reasoningChunk && typeof delta.content === 'string' && delta.content) {
      reasoningChunk = delta.content;
    }

    if (typeof reasoningChunk === 'string' && reasoningChunk) {
      fullReasoning += reasoningChunk;
      onReasoningDelta && onReasoningDelta(reasoningChunk);
    }

    if (!isExplicitThought && typeof delta.content === 'string' && delta.content) {
      let contentChunk = delta.content
        .replace(/<thought>/gi, '<think>')
        .replace(/<\/thought>/gi, '</think>');

      if (contentChunk.includes('<think>')) {
        insideThinkTag = true;
        const parts = contentChunk.split('<think>');
        if (parts[0]) {
          full += parts[0];
          onDelta && onDelta(parts[0]);
        }
        contentChunk = parts.slice(1).join('<think>');
      }

      if (insideThinkTag) {
        if (contentChunk.includes('</think>')) {
          insideThinkTag = false;
          const parts = contentChunk.split('</think>');
          if (parts[0]) {
            fullReasoning += parts[0];
            onReasoningDelta && onReasoningDelta(parts[0]);
          }
          const remainingContent = parts.slice(1).join('</think>');
          if (remainingContent) {
            full += remainingContent;
            onDelta && onDelta(remainingContent);
          }
        } else {
          fullReasoning += contentChunk;
          onReasoningDelta && onReasoningDelta(contentChunk);
        }
      } else {
        full += contentChunk;
        onDelta && onDelta(contentChunk);
      }
    }

    const extraFromChunk = delta.extra_content || choice?.extra_content || rawJson?.choices?.[0]?.extra_content || rawJson?.extra_content;
    if (extraFromChunk) {
      streamExtraContent = extraFromChunk;
    }

    if (Array.isArray(delta.tool_calls) && delta.tool_calls.length) {
      absorbToolCalls(delta.tool_calls, extraFromChunk);
    }
  }

  function processPayloadLine(payload) {
    if (!payload || payload === '[DONE]') return;
    try {
      const json = JSON.parse(payload);
      if (Array.isArray(json.choices) && json.choices.length) {
        for (const choice of json.choices) {
          processDelta(choice?.delta || {}, json, choice);
        }
      } else if (json.delta) {
        processDelta(json.delta, json, null);
      }
    } catch {

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
      processPayloadLine(trimmed.slice(5).trim());
    }
  }

  buffer += decoder.decode();
  if (buffer) {
    const remainingLines = buffer.split('\n');
    for (const line of remainingLines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      processPayloadLine(trimmed.slice(5).trim());
    }
  }

  const toolCalls = [];
  for (const cur of callAcc.values()) {
    let args = {};
    try { args = JSON.parse(cur.arguments || '{}'); } catch { args = {}; }
    const tcItem = { id: cur.id || '', name: cur.name || '', arguments: args };
    if (cur.extra_content) {
      tcItem.extra_content = cur.extra_content;
    }
    toolCalls.push(tcItem);
  }

  return { text: full, reasoning: fullReasoning, toolCalls };
}
