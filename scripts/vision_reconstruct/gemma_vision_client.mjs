import fs from 'node:fs';

const DEFAULT_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const MODEL = 'gemma-4-26b-a4b-it';

/**
 * High-res Multimodal Vision Streaming Client for Google Gemma 4
 * @param {string} prompt - Task instructions and prompt
 * @param {string[]} imagePaths - Local file paths of page images (JPEG/PNG)
 * @param {object} [options]
 * @param {string} [options.apiKey] - Google API key (defaults to env or key)
 * @param {number} [options.retries=3] - Maximum retry attempts on 503/network error
 * @param {number} [options.temperature=0.1] - Sampling temperature
 * @param {number} [options.maxOutputTokens=16384] - Max token quota
 * @returns {Promise<{text: string, thought: string, durationMs: number}>}
 */
export async function streamGemmaVision(prompt, imagePaths, options = {}) {
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY || DEFAULT_API_KEY;
  const retries = options.retries ?? 10;
  const temperature = options.temperature ?? 0.1;
  const maxOutputTokens = options.maxOutputTokens ?? 32768;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?key=${apiKey}&alt=sse`;

  // Ensure Thinking Token Guardrail is present to prevent thinking budget depletion
  const guardrail = '【核心指令】：思考过程请保持极简（不超过 100 字简要大纲），把全部输出配额用于生成完整的 MDX 正文！';
  const effectivePrompt = prompt.includes('思考过程请保持极简') ? prompt : `${guardrail}\n\n${prompt}`;

  const parts = [{ text: effectivePrompt }];

  for (const imgPath of imagePaths) {
    if (!fs.existsSync(imgPath)) {
      throw new Error(`图片文件不存在: ${imgPath}`);
    }
    const b64 = fs.readFileSync(imgPath).toString('base64');
    parts.push({
      inlineData: { mimeType: 'image/jpeg', data: b64 }
    });
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[GemmaVision] 请求开始 (尝试 ${attempt}/${retries}, 图片 ${imagePaths.length} 张)...`);
      const startTime = Date.now();

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: {
            maxOutputTokens,
            temperature
          }
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText.slice(0, 300)}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullThought = '';
      let fullText = '';
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop(); // 保留最后一个不完整的行

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.slice(6);
          if (jsonStr === '[DONE]') continue;

          try {
            const data = JSON.parse(jsonStr);
            const cand = data.candidates?.[0];
            if (cand?.content?.parts) {
              for (const part of cand.content.parts) {
                if (part.thought) {
                  fullThought += part.text;
                } else if (part.text) {
                  fullText += part.text;
                }
              }
            }
            chunkCount++;
            if (chunkCount % 20 === 0) {
              process.stdout.write(`[GemmaVision] 分片: ${chunkCount}, 正文: ${fullText.length} 字, 思考: ${fullThought.length} 字\r`);
            }
          } catch {
            // 忽略分片拼接时的单行 JSON 解析残缺
          }
        }
      }

      const durationMs = Date.now() - startTime;
      console.log(`\n[GemmaVision] 完成! 耗时 ${(durationMs / 1000).toFixed(1)}s, 正文 ${fullText.length} 字符, 思考 ${fullThought.length} 字符`);

      return {
        text: fullText,
        thought: fullThought,
        durationMs
      };
    } catch (err) {
      console.warn(`\n[GemmaVision] 尝试 ${attempt}/${retries} 发生异常: ${err.message}`);
      if (attempt === retries) {
        throw err;
      }
      const backoffMs = Math.min(45000, attempt * 8000);
      console.log(`[GemmaVision] 等待 ${(backoffMs / 1000).toFixed(1)}s 后发起退避重试...`);
      await new Promise(r => setTimeout(r, backoffMs));
    }
  }

  throw new Error(`[GemmaVision] 在重试 ${retries} 次后依然失败。`);
}
