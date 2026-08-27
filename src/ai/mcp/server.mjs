import { TOOLS, execute } from './tools.mjs';

export function listTools() {
  return TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));
}

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
