// M1 验证：在副本文件上测试 locateBlock + applyOp 全部操作（每用例独立，避免行号漂移）
import fs from 'node:fs';
import { parseFile } from '../src/utils/mdx-editor/parse.mjs';
import { locateBlock } from '../src/utils/mdx-editor/locate-block.mjs';
import { applyOp, validateMdx } from '../src/utils/mdx-editor/apply-op.mjs';

const SRC = 'src/content/docs/collections/math/math_analysis/2.1_数列极限的基本概念.mdx';
const TMP = 'scripts/_tmp_test.mdx';
const original = fs.readFileSync(SRC, 'utf8');
fs.writeFileSync(TMP, original, 'utf8');

let pass = 0, fail = 0;
function check(name, cond, extra = '') {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name} ${extra}`); }
}
const fresh = () => fs.readFileSync(TMP, 'utf8'); // 每次重读原始副本
// 全文行号 → body 行号（locateBlock 与注入插件均用 body 空间）
const B = (content, fullLine) => fullLine - parseFile(content).offset;
// 全文行号（取自真实文件）：
//   16 顶层段落 | 20 含 lim 公式段落 | 48-50 行间公式 | 207 <Block> | 209 卡片内段落
const CARD = 207, CARD_PARA = 209, TOP_PARA = 16, LIM_LINE = 20, FORMULA = 49;

try {
  console.log('\n[1] locateBlock');
  let content = fresh();
  let loc = locateBlock(content, B(content, CARD));
  check('命中卡片 block', loc && loc.kind === 'block', JSON.stringify(loc && { kind: loc.kind, s: loc.startLine, e: loc.endLine }));
  check('卡片行区间', loc && loc.startLine === B(content, CARD) && loc.endLine > B(content, CARD), `${loc?.startLine}-${loc?.endLine}`);

  loc = locateBlock(content, B(content, CARD_PARA));
  check('命中卡片内段落', loc && loc.kind === 'paragraph', JSON.stringify(loc && { kind: loc.kind }));
  check('段落有 parentCard', loc && loc.parentCard && loc.parentCard.kind === 'block', JSON.stringify(loc?.parentCard));

  loc = locateBlock(content, B(content, FORMULA));
  check('命中行间公式', loc && loc.kind === 'formula', JSON.stringify(loc && { kind: loc.kind }));

  loc = locateBlock(content, B(content, TOP_PARA));
  check('命中顶层段落', loc && loc.kind === 'paragraph' && !loc.parentCard, JSON.stringify(loc && { kind: loc.kind }));

  console.log('\n[2] edit-formula（行内公式替换，第 20 行含 \\lim 公式，公式内容带尾逗号）');
  content = fresh();
  let r = await applyOp(content, 'edit-formula', {
    line: B(content, LIM_LINE),
    oldLatex: '\\lim_{n\\to \\infty}a_n = a,',
    newLatex: '\\lim_{n\\to \\infty}a_n = a^\\ast,',
  });
  check('edit-formula 成功', r.ok, r.message);
  if (r.ok) {
    content = r.content;
    loc = locateBlock(content, B(content, LIM_LINE));
    check('公式已替换', loc && loc.text.includes('a^\\ast'), loc?.text);
    check('reparse 校验通过', (await validateMdx(content)) === null);
  }

  console.log('\n[3] edit-formula（行间公式整块替换）');
  content = fresh();
  r = await applyOp(content, 'edit-formula', {
    line: B(content, FORMULA),
    oldLatex: 'a _ {n _ {1}}, a _ {n _ {2}}, \\dots , a _ {n _ {k}}, \\dots ,',
    newLatex: 'a _ {n _ {1}}, a _ {n _ {2}}, \\dots , a _ {n _ {k}}, \\dots',
  });
  check('公式块替换成功', r.ok, r.message);
  if (r.ok) {
    content = r.content;
    loc = locateBlock(content, B(content, FORMULA));
    check('公式内容已更新', loc && loc.text.includes('\\dots'), loc?.text);
  }

  console.log('\n[4] replace-block（修改顶层段落文本）');
  content = fresh();
  r = await applyOp(content, 'replace-block', { line: B(content, TOP_PARA), newText: '这是修改后的正文段落。' });
  check('replace 成功', r.ok, r.message);
  if (r.ok) {
    content = r.content;
    loc = locateBlock(content, B(content, TOP_PARA));
    check('替换后段落文本正确', loc && loc.text.includes('修改后的正文段落'), loc?.text);
  }

  console.log('\n[5] wrap（顶层段落 → Example 卡片）');
  content = fresh();
  r = await applyOp(content, 'wrap', { line: B(content, TOP_PARA), cardType: 'example', title: '例 0.1' });
  check('wrap 成功', r.ok, r.message);
  if (r.ok) {
    content = r.content;
    loc = locateBlock(content, B(content, TOP_PARA));
    check('已包成 Example 卡片', loc && loc.kind === 'example', JSON.stringify(loc && { kind: loc.kind }));
    check('标题正确', loc && loc.text.includes('例 0.1'), loc?.text);
    loc = locateBlock(content, B(content, TOP_PARA) + 2);
    check('卡片内段落可定位', loc && loc.kind === 'paragraph' && loc.parentCard, JSON.stringify(loc && { kind: loc.kind, pc: loc.parentCard?.kind }));
  }

  console.log('\n[6] unwrap（练习题卡片 → 正文，标题转为 h2）');
  content = fresh();
  const cLine = B(content, CARD);
  r = await applyOp(content, 'unwrap', { line: cLine });
  check('unwrap 成功', r.ok, r.message);
  if (r.ok) {
    content = r.content;
    loc = locateBlock(content, cLine);
    check('卡片标题已转为 h2', loc && loc.kind === 'heading' && !loc.parentCard, JSON.stringify(loc && { kind: loc.kind, text: loc.text.slice(0, 30) }));
    check('h2 内容为原卡片标题', loc && loc.text.includes('练习题'), loc?.text.slice(0, 40));
    loc = locateBlock(content, cLine + 2);
    check('标题后紧跟原卡片内容', loc && loc.kind === 'paragraph' && loc.text.includes('按极限定义证明'), JSON.stringify(loc && { kind: loc.kind }));
    check('reparse 校验通过', (await validateMdx(content)) === null);
  }

  console.log('\n[7] extract（卡片内段落移出到卡片之后）');
  content = fresh();
  const pLine = B(content, CARD_PARA);
  r = await applyOp(content, 'extract', { line: pLine });
  check('extract 成功', r.ok, r.message);
  if (r.ok) {
    content = r.content;
    // 段落应出现在卡片闭标签之后（作为正文）
    const closeIdx = content.indexOf('</Block>');
    check('段落已移到卡片之后', closeIdx !== -1 && content.indexOf('按极限定义证明', closeIdx) !== -1, '');
    const cardAfter = locateBlock(content, B(content, CARD));
    check('卡片仍在', cardAfter && cardAfter.kind === 'block', JSON.stringify(cardAfter && { kind: cardAfter.kind }));
    check('reparse 校验通过', (await validateMdx(content)) === null);
  }

  console.log('\n[8] move-block（段落与卡片互换位置）');
  content = fresh();
  r = await applyOp(content, 'move-block', { line: B(content, TOP_PARA), targetLine: B(content, CARD), position: 'after' });
  check('move 成功', r.ok, r.message);
  if (r.ok) {
    content = r.content;
    // 原卡片位置之后应出现被移动的段落（卡片区域行数可能变化，按文本查找）
    check('被移动段落存在', content.includes('成立不等式'), '');
    check('reparse 校验通过', (await validateMdx(content)) === null);
  }

  console.log('\n[9] delete（删除顶层段落）');
  content = fresh();
  r = await applyOp(content, 'delete', { line: B(content, TOP_PARA) });
  check('delete 成功', r.ok, r.message);
  if (r.ok) {
    content = r.content;
    check('内容已删除', !content.includes('成立不等式'), '');
    check('reparse 校验通过', (await validateMdx(content)) === null);
  }

  console.log('\n[10] 校验：非法内容被拒绝');
  content = fresh();
  const anyBlock = locateBlock(content, B(content, CARD));
  r = await applyOp(content, 'replace-block', { line: anyBlock.startLine, newText: '<Example title="未闭合' });
  check('非法替换被拒绝', !r.ok, r.message);

  console.log('\n[11] 校验：多本书采样解析');
  for (const f of [
    'src/content/docs/collections/math/math_senior/06_第1章 三角函数.mdx',
    'src/content/docs/collections/science/university_physics/1.1_参考系坐标系物理模型.mdx',
    'src/content/docs/collections/math/engineering_analysis/1.1_函数.mdx',
  ].filter((p) => fs.existsSync(p))) {
    const c = fs.readFileSync(f, 'utf8');
    const v = await validateMdx(c);
    check(`原始内容可解析: ${f.split('/').pop()}`, v === null, v?.slice(0, 120));
  }

  console.log('\n[12] insert-into-card（顶层段落 → 插入卡片末尾）');
  content = fresh();
  r = await applyOp(content, 'insert-into-card', { line: B(content, TOP_PARA), targetLine: B(content, CARD) });
  check('insert 成功', r.ok, r.message);
  if (r.ok) {
    content = r.content;
    // 段落文本应出现在 </Block> 之前（卡片 children 内）
    const closeIdx = content.indexOf('</Block>');
    check('段落已进入卡片', closeIdx !== -1 && content.indexOf('成立不等式', 0) !== -1 && content.indexOf('成立不等式') < closeIdx, '');
    // 正文中不应再有该段落（已从原位置移除）
    const afterClose = content.indexOf('</Block>') + '</Block>'.length;
    check('正文中已移除该段落', content.slice(afterClose).includes('成立不等式') === false, '');
    check('reparse 校验通过', (await validateMdx(content)) === null);
  }

  console.log('\n[13] insert-into-card（非法场景）');
  content = fresh();
  r = await applyOp(content, 'insert-into-card', { line: B(content, CARD), targetLine: B(content, CARD) });
  check('源块是卡片 → 拒绝', !r.ok, r.message);
  r = await applyOp(content, 'insert-into-card', { line: B(content, TOP_PARA), targetLine: B(content, TOP_PARA) });
  check('目标不是卡片 → 拒绝', !r.ok, r.message);
  r = await applyOp(content, 'insert-into-card', { line: B(content, CARD_PARA), targetLine: B(content, CARD) });
  check('源块已在卡片内 → 拒绝', !r.ok, r.message);

  console.log('\n[14] insert-into-card（卡片在段落之前：先 wrap 再造场景）');
  content = fresh();
  r = await applyOp(content, 'wrap', { line: B(content, TOP_PARA), cardType: 'example', title: '例 0.1' });
  check('前置 wrap 成功', r.ok, r.message);
  if (r.ok) {
    // wrap 后行号变化：重新定位"含 \\lim 的段落"（原 LIM_LINE 内容）与新建卡片
    const cardLoc = locateBlock(r.content, B(r.content, TOP_PARA));
    check('wrap 后卡片可定位', cardLoc && cardLoc.kind === 'example', JSON.stringify(cardLoc && { kind: cardLoc.kind }));
    // 遍历找含 \lim 的顶层段落
    let paraLine = null;
    const { mdast, offset: off2 } = parseFile(r.content);
    (function find(node) {
      if (paraLine) return;
      if (node.type === 'paragraph' && node.position) {
        const txt = node.children.map((c) => c.value || '').join('');
        if (txt.includes('\\lim')) { paraLine = node.position.start.line; return; }
      }
      for (const c of node.children || []) find(c);
    })(mdast);
    check('找到含 \\lim 的段落', paraLine != null, String(paraLine));
    if (paraLine != null) {
      r = await applyOp(r.content, 'insert-into-card', { line: paraLine, targetLine: cardLoc.startLine });
      check('卡片在后插入成功', r.ok, r.message);
      if (r.ok) {
        const closeIdx = r.content.indexOf('</Example>');
        check('段落已进入卡片', closeIdx !== -1 && r.content.indexOf('\\lim', 0) < closeIdx, '');
        check('reparse 校验通过', (await validateMdx(r.content)) === null);
      }
    }
  }

  console.log(`\n结果: ${pass} 通过 / ${fail} 失败`);
} finally {
  fs.unlinkSync(TMP);
}
process.exit(fail ? 1 : 0);
