// 端到端验证：source / apply / undo + M3 新端点（cards / preview-block / apply-batch）
// 所有写盘测试自带 undo 恢复，结束后文件与原始一致。
const BASE = 'http://localhost:4321';
const FILE = 'src/content/docs/collections/math/math_analysis/2.1_数列极限的基本概念.mdx';
const enc = encodeURIComponent;
const fs = await import('node:fs');
const SRC = 'src/content/docs/collections/math/math_analysis/2.1_数列极限的基本概念.mdx';
const original = fs.readFileSync(SRC, 'utf8');

let fail = 0;
function check(name, cond, extra = '') {
  if (cond) console.log(`  ✓ ${name}`);
  else { fail++; console.log(`  ✗ ${name} ${extra}`); }
}

async function post(path, body) {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).then((x) => x.json());
}

async function undoAll() {
  // 反复撤销直到无可撤销（batch 和单条都要清掉）
  for (let i = 0; i < 10; i++) {
    const r = await post('/__edit__/undo', { file: FILE });
    if (!r.ok) break;
  }
}

async function main() {
  // 1) health
  let r = await fetch(`${BASE}/__edit__/health`).then((x) => x.json());
  check('health ok', r.ok === true, JSON.stringify(r));

  // 2) source：第 14 行（注入的 data-src-line）
  r = await fetch(`${BASE}/__edit__/source?file=${enc(FILE)}&line=14`).then((x) => x.json());
  check('source line=14 命中 h2', r.ok && r.kind === 'heading', JSON.stringify(r));
  const line16 = 16, line20 = 20;
  r = await fetch(`${BASE}/__edit__/source?file=${enc(FILE)}&line=${line16}`).then((x) => x.json());
  check('source line=16 命中段落', r.ok && r.kind === 'paragraph', JSON.stringify(r));
  const anchorA = r.text || '';
  r = await fetch(`${BASE}/__edit__/source?file=${enc(FILE)}&line=${line20}`).then((x) => x.json());
  check('source line=20 命中段落', r.ok && r.kind === 'paragraph', JSON.stringify(r));
  const anchorB = r.text || '';

  // 3) cards：卡片列表（含 line/kind/title/text）
  r = await fetch(`${BASE}/__edit__/cards?file=${enc(FILE)}`).then((x) => x.json());
  check('cards ok 且非空', r.ok && Array.isArray(r.cards) && r.cards.length > 0, JSON.stringify(r).slice(0, 160));
  const card = r.cards?.[0];
  check('卡片含 line/kind/text', !!card && typeof card.line === 'number' && typeof card.text === 'string', JSON.stringify(card && { line: card.line, kind: card.kind }));

  // 4) preview-block：replace-block 段落 → 返回真实 HTML 片段（含 data-src 注入）
  r = await post('/__edit__/preview-block', { file: FILE, op: 'replace-block', payload: { line: line16, newText: '这是预览测试文本。' } });
  check('preview-block ok 且返回 html', r.ok && typeof r.html === 'string' && r.html.includes('<p'), JSON.stringify(r).slice(0, 200));
  check('preview html 带 data-src-line', r.html.includes('data-src-line'), r.html?.slice(0, 120));

  // 5) preview-block：edit-formula 段落 → 公式即时编译
  r = await post('/__edit__/preview-block', { file: FILE, op: 'edit-formula', payload: { line: line20, oldLatex: '\\lim_{n\\to \\infty}a_n = a,', newLatex: '\\lim_{n\\to \\infty}a_n = a^\\ast,' } });
  check('preview edit-formula ok', r.ok, JSON.stringify(r).slice(0, 160));
  check('preview 含 katex', r.html && r.html.includes('katex'), (r.html || '').slice(0, 80));

  // 6) preview-block：含组件（卡片源码保留 JSX）→ html 为 null（降级标记式）
  r = await post('/__edit__/preview-block', {
    file: FILE,
    op: 'replace-block',
    payload: { line: card.line, newText: '<Block title="测试">\n\n测试内容\n\n</Block>' },
  });
  check('preview 含组件返回 html=null', r.ok && r.html === null, JSON.stringify(r).slice(0, 120));

  // 7) apply-batch：两条 replace-block 一次写盘
  r = await post('/__edit__/apply-batch', {
    file: FILE,
    ops: [
      { op: 'replace-block', payload: { line: line16, newText: 'E2E批量A：修改段落一。' }, anchorText: anchorA },
      { op: 'replace-block', payload: { line: line20, newText: 'E2E批量B：修改段落二。' }, anchorText: anchorB },
    ],
  });
  check('apply-batch ok', r.ok && r.savedCount === 2, JSON.stringify(r));
  let cur = fs.readFileSync(SRC, 'utf8');
  check('两处均已写盘', cur.includes('E2E批量A') && cur.includes('E2E批量B'), '');

  // 8) apply-batch 锚点重定位：先 delete 第 16 行块（行号前移），再按旧行号 20 改段落二
  r = await post('/__edit__/apply-batch', {
    file: FILE,
    ops: [
      { op: 'delete', payload: { line: line16 }, anchorText: 'E2E批量A：修改段落一。' },
      { op: 'replace-block', payload: { line: line20, newText: 'E2E锚点：行号已变仍定位成功。' }, anchorText: 'E2E批量B：修改段落二。' },
    ],
  });
  check('apply-batch 锚点重定位 ok', r.ok, JSON.stringify(r));
  cur = fs.readFileSync(SRC, 'utf8');
  check('段落二已被锚点重定位修改', cur.includes('E2E锚点'), '');

  // 9) undo 全部恢复
  await undoAll();
  const restored = fs.readFileSync(SRC, 'utf8');
  check('文件已恢复原始', restored === original, '内容不一致！');

  console.log(fail ? `\n结果: ${fail} 项失败` : '\n结果: 全部通过');
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error('FAIL', e); process.exit(1); });
