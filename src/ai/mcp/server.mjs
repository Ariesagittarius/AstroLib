/**
 * src/ai/mcp/server.mjs
 * -----------------------------------------------------------------------------
 * MCP Server 适配层：把 tools.mjs 的工具表暴露为 MCP 的 tools/list、tools/call。
 *
 * 用途：让 AI 智能体环境（如支持 MCP 的客户端/工具宿主）能调用书内检索工具，
 * 在“没有明确检索渠道”时做切片/模糊查找。也可在本地/CI 直接用 handle() 走 JSON-RPC。
 *
 * 依赖：仅依赖 ./tools.mjs（其内部复用 collections.config.js / sidebar / indexer /
 * retriever / cleanSlug —— 全为现成轮子，不重复造）。
 *
 * 注：MCP 标准走 stdio/SSE。这里提供与 MCP 相同语义的 handler（tools/list、tools/call），
 * 由宿主选择如何传输；如需 stdio 实例，可在此把手柄接入标准输入输出循环。
 * =============================================================================
 */
import { TOOLS, execute } from './tools.mjs';

/** MCP tools/list 返回的工具元数据（不含 run 实现，安全可序列化） */
export function listTools() {
  return TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));
}

/**
 * 处理一帧 JSON-RPC（MCP 风格）。
 * @param {{ id?:any, method?:string, params?:object }} request
 * @returns {{ id?:any, result?:object, error?:{code:number,message:string} }}
 */
export async function handle(request) {
  const { id, method, params } = request || {};

  if (method === 'tools/list') {
    return { id, result: { tools: listTools() } };
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params || {};
    if (!name) return { id, error: { code: -32602, message: 'Missing tool name' } };
    try {
      const content = await execute(name, args || {});
      const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
      return { id, result: { content: [{ type: 'text', text }] } };
    } catch (e) {
      return { id, error: { code: -32000, message: e.message || String(e) } };
    }
  }

  return { id, error: { code: -32601, message: `method not found: ${method}` } };
}
