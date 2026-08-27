type BlockInfo = {
  el: HTMLElement;
  file: string;
  line: number;
  kind: string;
  parentKind: string | null;
};

type RangeSelection = {
  startLine: number;
  endLine: number;
  blocks: HTMLElement[];
};

type DraftOp = {
  key: string;
  op: string;
  payload: Record<string, unknown>;
  anchorText: string;
  targetAnchorText?: string;
  label: string;
  undo: () => void;
};

const CARD_KINDS = new Set([
  'example', 'variant', 'knowledge', 'note', 'solution',
  'block', 'method', 'guide', 'exercise', 'summary', 'analysis',
]);

const KIND_NAMES: Record<string, string> = {
  example: '例题', variant: '变式', knowledge: '知识点', note: '注释', solution: '解答',
  block: '模块', method: '方法', guide: '导读', exercise: '练习', summary: '总结', analysis: '思路分析',
  paragraph: '段落', heading: '标题', list: '列表', table: '表格', quote: '引用',
  code: '代码块', formula: '独立公式', hr: '分隔线',
};

const WRAP_TYPES: Array<{ value: string; label: string }> = [
  { value: 'example', label: '例题 (Example)' },
  { value: 'variant', label: '变式 (Variant)' },
  { value: 'knowledge', label: '知识点 (Knowledge)' },
  { value: 'note', label: '注释 (Note)' },
  { value: 'solution', label: '解答 (Solution)' },
  { value: 'analysis', label: '思路分析 (Analysis)' },
  { value: 'block', label: '通用模块 (Block)' },
  { value: 'method', label: '方法 (Method)' },
  { value: 'guide', label: '导读 (Guide)' },
  { value: 'exercise', label: '练习 (Exercise)' },
  { value: 'summary', label: '总结 (Summary)' },
];

let enabled = false;
let selected: BlockInfo | null = null;
let rangeSelected: RangeSelection | null = null;
let hovered: HTMLElement | null = null;
let currentFile = '';
let draftOps: DraftOp[] = [];
let allSolutionsExpanded = false;

let root: HTMLElement | null = null;
let badge: HTMLElement | null = null;
let toolbar: HTMLElement | null = null;
let panel: HTMLElement | null = null;
let modal: HTMLElement | null = null;
let toastBox: HTMLElement | null = null;

const enc = encodeURIComponent;

function mainContent(): HTMLElement {
  return (
    document.querySelector('main .sl-markdown-content') ||
    document.querySelector('.main-pane') ||
    document.querySelector('main') ||
    document.body
  ) as HTMLElement;
}

function blockFrom(target: Element | null): HTMLElement | null {
  if (!target) return null;
  return target.closest('[data-src-line]') as HTMLElement | null;
}

function guessFileFromPath(): string {
  const p = location.pathname.replace(/\/+$/, '');
  return p ? 'src/content/docs' + p + '.mdx' : '';
}

function readBlock(el: HTMLElement): BlockInfo | null {
  const line = parseInt(el.getAttribute('data-src-line') || '', 10);
  if (!Number.isFinite(line) || line < 1) return null;
  const file = el.getAttribute('data-src-file') || currentFile || guessFileFromPath();
  const kind = el.getAttribute('data-src-kind') || 'paragraph';

  let parentKind: string | null = null;
  let p: HTMLElement | null = el.parentElement;
  while (p) {
    const k = p.getAttribute('data-src-kind');
    if (k && k !== kind && CARD_KINDS.has(k)) {
      parentKind = k;
      break;
    }
    p = p.parentElement;
  }
  return { el, file, line, kind, parentKind };
}

function siblingBlocks(el: HTMLElement): HTMLElement[] {
  const parent = el.parentElement;
  if (!parent) return [];
  return Array.from(parent.querySelectorAll(':scope > [data-src-line]')) as HTMLElement[];
}

function cardElementOf(info: BlockInfo): HTMLElement | null {
  let p = info.el.parentElement;
  while (p) {
    const k = p.getAttribute('data-src-kind');
    if (k && CARD_KINDS.has(k)) return p;
    p = p.parentElement;
  }
  return null;
}

function findBlockByLine(line: number): HTMLElement | null {
  return mainContent().querySelector(`[data-src-line="${line}"]`) as HTMLElement | null;
}

function stripDelimiters(latex: string): string {
  let m = latex.match(/^\$\$\r?\n?([\s\S]*?)\r?\n?\$\$$/);
  if (m) return m[1];
  m = latex.match(/^\$([\s\S]*)\$$/);
  if (m) return m[1];
  return latex;
}

async function api(path: string, init?: RequestInit): Promise<any> {
  try {
    const res = await fetch(path, init);
    return await res.json();
  } catch (err) {
    return { ok: false, message: '请求失败：' + String(err) };
  }
}

function btn(label: string, onClick?: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  if (onClick) b.addEventListener('click', onClick);
  return b;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function htmlToElement(html: string): HTMLElement {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.firstElementChild as HTMLElement) || document.createElement('div');
}

function ensureRoot(): HTMLElement {
  if (root) return root;
  root = document.createElement('div');
  root.id = 'dsh-editor-root';
  document.body.appendChild(root);

  badge = document.createElement('div');
  badge.className = 'dsh-badge';
  badge.style.display = 'none';
  root.appendChild(badge);

  toolbar = document.createElement('div');
  toolbar.className = 'dsh-toolbar';
  toolbar.style.display = 'none';
  root.appendChild(toolbar);

  panel = document.createElement('div');
  panel.className = 'dsh-panel';
  panel.style.display = 'none';
  root.appendChild(panel);

  modal = document.createElement('div');
  modal.className = 'dsh-modal';
  modal.style.display = 'none';
  root.appendChild(modal);

  toastBox = document.createElement('div');
  toastBox.className = 'dsh-toast-box';
  root.appendChild(toastBox);
  return root;
}

function showBadge(block: HTMLElement): void {
  if (!badge) return;
  const info = readBlock(block);
  const r = block.getBoundingClientRect();
  badge.textContent = `${info ? KIND_NAMES[info.kind] || info.kind : ''} · L${info ? info.line : ''}`;
  badge.style.display = 'block';
  const bw = badge.offsetWidth;
  let left = r.left + r.width / 2 - bw / 2;
  left = Math.max(4, Math.min(left, window.innerWidth - bw - 4));
  badge.style.left = left + 'px';
  badge.style.top = Math.max(4, r.top - 26) + 'px';
}

function hideBadge(): void {
  if (badge) badge.style.display = 'none';
}

function positionToolbar(): void {
  if (!toolbar) return;
  const targetEl = rangeSelected ? rangeSelected.blocks[0] : selected ? selected.el : null;
  if (!targetEl) return;
  toolbar.style.display = 'flex';
  const r = targetEl.getBoundingClientRect();
  const w = toolbar.offsetWidth || 560;
  let left = r.left + r.width / 2 - w / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
  let top = r.top - 48;
  if (top < 8) top = r.bottom + 8;
  toolbar.style.left = left + 'px';
  toolbar.style.top = top + 'px';
}

function clearSelection(): void {
  if (selected) selected.el.classList.remove('dsh-block-selected');
  if (rangeSelected) {
    for (const b of rangeSelected.blocks) b.classList.remove('dsh-block-selected');
  }
  selected = null;
  rangeSelected = null;
  if (toolbar) toolbar.style.display = 'none';
}

function selectBlock(info: BlockInfo): void {
  clearSelection();
  selected = info;
  info.el.classList.add('dsh-block-selected');
  currentFile = info.file;
  renderToolbar(info);
  updatePanel();
}

function selectRange(startInfo: BlockInfo, endInfo: BlockInfo): void {
  clearSelection();
  const minLine = Math.min(startInfo.line, endInfo.line);
  const maxLine = Math.max(startInfo.line, endInfo.line);
  const allBlocks = Array.from(mainContent().querySelectorAll('[data-src-line]')) as HTMLElement[];
  const inRange = allBlocks.filter((b) => {
    const l = parseInt(b.getAttribute('data-src-line') || '', 10);
    return Number.isFinite(l) && l >= minLine && l <= maxLine;
  });

  if (!inRange.length) {
    selectBlock(endInfo);
    return;
  }

  rangeSelected = {
    startLine: minLine,
    endLine: maxLine,
    blocks: inRange,
  };
  currentFile = startInfo.file;

  for (const b of inRange) {
    b.classList.add('dsh-block-selected');
  }
  renderRangeToolbar(rangeSelected);
  updatePanel();
}

function renderToolbar(info: BlockInfo): void {
  if (!toolbar) return;
  const isCard = CARD_KINDS.has(info.kind);
  const siblings = siblingBlocks(info.el);
  const idx = siblings.indexOf(info.el);

  const items: Array<{ label: string; title: string; onClick?: () => void; disabled?: boolean }> = [
    { label: '↑', title: '上移（同层相邻块）', disabled: idx <= 0, onClick: () => void doMove(info, readBlock(siblings[idx - 1])!, 'before') },
    { label: '↓', title: '下移（同层相邻块）', disabled: idx === -1 || idx >= siblings.length - 1, onClick: () => void doMove(info, readBlock(siblings[idx + 1])!, 'after') },
  ];

  if (isCard) {
    items.push({ label: '改标题', title: '修改卡片标题', onClick: () => openEditTitleModal(info) });
    items.push({ label: '换类型', title: '一键更换卡片类型（如 Note ↔ Example）', onClick: () => openChangeTypeModal(info) });
    items.push({ label: '转为正文', title: '剥掉卡片外壳，内容直接作为正文', onClick: () => void doUnwrap(info) });
  } else if (!info.parentKind) {
    items.push({ label: '移入卡片', title: '把该块插入到某张卡片末尾', onClick: () => void openInsertIntoCardModal(info) });
    items.push({ label: '包成卡片', title: '把该块包成卡片', onClick: () => openWrapModal(info) });
    if (idx < siblings.length - 1) {
      items.push({ label: '向下合并', title: '与下一个相邻块合并为单段落', onClick: () => void doMergeWithNeighbor(info, readBlock(siblings[idx + 1])) });
    }
  } else {
    items.push({ label: '移出卡片', title: '把该块移到卡片之后（正文）', onClick: () => void doExtract(info) });
    if (idx < siblings.length - 1) {
      items.push({ label: '向下合并', title: '与卡片内下一个相邻块合并为单段落', onClick: () => void doMergeWithNeighbor(info, readBlock(siblings[idx + 1])) });
    }
  }

  items.push({ label: '移动到行号', title: '把该块移到指定行号之前/之后', onClick: () => openMoveToLineModal(info) });

  const hasKatex = !!info.el.querySelector('.katex[data-latex], .katex-display[data-latex]');
  if (hasKatex || info.kind === 'formula') {
    items.push({ label: '编辑公式', title: '编辑公式 LaTeX 源码', onClick: () => openFirstFormula(info) });
  }

  items.push({ label: '编辑源码', title: '直接修改该块的 MDX 源码', onClick: () => void openSourceEditor(info) });
  items.push({ label: '删除', title: '删除该块', onClick: () => confirmDelete(info) });

  toolbar.innerHTML = '';
  const infoSpan = document.createElement('span');
  infoSpan.className = 'dsh-toolbar-info';
  infoSpan.textContent = `${KIND_NAMES[info.kind] || info.kind} · L${info.line}`;
  toolbar.appendChild(infoSpan);

  for (const it of items) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = it.label;
    b.title = it.title;
    b.disabled = !!it.disabled;
    if (!b.disabled && it.onClick) b.addEventListener('click', it.onClick);
    toolbar.appendChild(b);
  }
  positionToolbar();
}

function renderRangeToolbar(range: RangeSelection): void {
  if (!toolbar) return;
  toolbar.innerHTML = '';

  const infoSpan = document.createElement('span');
  infoSpan.className = 'dsh-toolbar-info';
  infoSpan.textContent = `选中 L${range.startLine}-L${range.endLine}（共 ${range.blocks.length} 块）`;
  toolbar.appendChild(infoSpan);

  const items = [
    { label: '📦 合并包成卡片', title: '将选中的所有连续块整体包裹为指定卡片（题干+公式+图片等）', onClick: () => openWrapRangeModal(range) },
    { label: '📥 批量移入卡片', title: '将选中的所有块整体移入某张卡片末尾', onClick: () => void openInsertRangeModal(range) },
    { label: '🔗 合并为一段', title: '将选中的连续文字块合并为一个段落', onClick: () => void doMergeBlocks(range.startLine, range.endLine) },
    { label: '🗑 批量删除', title: '删除选中的所有块', onClick: () => confirmDeleteRange(range.startLine, range.endLine) },
    { label: '✕ 取消选择', title: '清除当前选区', onClick: clearSelection },
  ];

  for (const it of items) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = it.label;
    b.title = it.title;
    if (it.onClick) b.addEventListener('click', it.onClick);
    toolbar.appendChild(b);
  }
  positionToolbar();
}

function modalTextarea(value: string): HTMLTextAreaElement {
  const ta = document.createElement('textarea');
  ta.className = 'dsh-modal-textarea';
  ta.value = value;
  ta.spellcheck = false;
  return ta;
}

function showModal(opts: { title: string; body: HTMLElement; onSave: () => void; saveLabel?: string }): void {
  ensureRoot();
  if (!modal) return;
  modal.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'dsh-modal-box';

  const head = document.createElement('div');
  head.className = 'dsh-modal-head';
  head.textContent = opts.title;
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'dsh-modal-close';
  close.textContent = '×';
  close.title = '关闭';
  close.addEventListener('click', hideModal);
  head.appendChild(close);

  const bodyWrap = document.createElement('div');
  bodyWrap.className = 'dsh-modal-body';
  bodyWrap.appendChild(opts.body);

  const foot = document.createElement('div');
  foot.className = 'dsh-modal-foot';
  const cancel = btn('取消', hideModal);
  const save = btn(opts.saveLabel || '保存');
  save.className = 'dsh-modal-save';
  save.addEventListener('click', () => {
    try {
      opts.onSave();
    } catch (err) {
      toast('保存失败：' + String(err));
    }
  });
  foot.append(cancel, save);

  box.append(head, bodyWrap, foot);
  modal.appendChild(box);
  modal.style.display = 'flex';
  const first = opts.body.querySelector('textarea, input, select');
  if (first) (first as HTMLElement).focus();
}

function hideModal(): void {
  if (modal) modal.style.display = 'none';
}

function modalVisible(): boolean {
  return !!modal && modal.style.display !== 'none';
}

function toast(msg: string, clickable = false): void {
  ensureRoot();
  if (!toastBox) return;
  const t = document.createElement('div');
  t.className = 'dsh-toast' + (clickable ? ' dsh-toast-click' : '');
  t.textContent = msg;
  if (clickable) t.addEventListener('click', () => location.reload());
  toastBox.appendChild(t);
  window.setTimeout(() => {
    t.classList.add('dsh-toast-out');
    window.setTimeout(() => t.remove(), 300);
  }, clickable ? 6000 : 2600);
}

function toggleAllSolutions(): void {
  allSolutionsExpanded = !allSolutionsExpanded;
  const allDetails = mainContent().querySelectorAll('details.solution-details');
  allDetails.forEach((d) => {
    (d as HTMLDetailsElement).open = allSolutionsExpanded;
  });
  toast(allSolutionsExpanded ? '已展开页面全部解答/折叠块' : '已收起页面全部解答/折叠块');
  updatePanel();
}

function updatePanel(): void {
  if (!panel) return;
  if (!enabled) {
    panel.style.display = 'none';
    return;
  }
  panel.style.display = 'flex';
  panel.innerHTML = '';
  const file = selected?.file || currentFile;

  const title = document.createElement('span');
  title.className = 'dsh-panel-title';
  title.textContent = draftOps.length ? `精修模式 · 未保存 ${draftOps.length}` : '精修模式';
  if (draftOps.length) title.classList.add('dsh-panel-title-dirty');

  const fileSpan = document.createElement('span');
  fileSpan.className = 'dsh-panel-file';
  fileSpan.textContent = file || '（未定位到文件）';
  fileSpan.title = file;

  const toggleDetailsBtn = btn(allSolutionsExpanded ? '收起全部折叠' : '展开全部折叠', toggleAllSolutions);
  toggleDetailsBtn.title = '一键展开/收起当前页面全部 <Solution> 解答折叠框，方便直接点选编辑内部公式与段落';

  const undoBtn = btn('撤销', () => void undo());
  undoBtn.title = draftOps.length ? '撤销最后一条草稿修改' : '撤销最近一次写回（按文件）';

  const logBtn = btn('日志', () => void openLog());

  const saveBtn = btn(draftOps.length ? `保存并刷新 (${draftOps.length})` : '保存并刷新', () => void saveDraft());
  saveBtn.className = 'dsh-panel-save' + (draftOps.length ? ' dsh-panel-save-dirty' : '');
  saveBtn.disabled = !draftOps.length;
  saveBtn.title = '把全部草稿修改一次性写入源文件并刷新页面（快捷无缝更新）';

  const exitBtn = btn('退出', () => setEnabled(false));
  exitBtn.title = '退出精修模式（快捷键 E）';

  panel.append(title, fileSpan, toggleDetailsBtn, undoBtn, logBtn, saveBtn, exitBtn);
}

function syncCurrentFile(): void {
  const el = mainContent().querySelector('[data-src-file]');
  currentFile = el ? el.getAttribute('data-src-file') || '' : guessFileFromPath();
}

function guardDraft(): boolean {
  if (!draftOps.length) return true;
  return window.confirm(`有 ${draftOps.length} 处未保存的修改，退出将丢弃。是否继续？`);
}

function setEnabled(on: boolean): void {
  if (on && (window as any).__dshFeatureEditorAllowed === false) {
    toast('精修工具已在「功能开关」中禁用');
    return;
  }
  if (!on && !guardDraft()) return;
  enabled = on;
  document.body.classList.toggle('dsh-edit-mode', on);
  if (!on) {
    draftOps = [];
    clearSelection();
    hideBadge();
  } else {
    syncCurrentFile();
  }
  updatePanel();
  const url = new URL(location.href);
  if (on) url.searchParams.set('edit', '1');
  else url.searchParams.delete('edit');
  history.replaceState(null, '', url);
  if (on && !mainContent().querySelector('[data-src-line]')) {
    toast('当前页面没有可编辑块（仅内容页支持精修）');
  } else {
    toast(on ? '精修模式已开启：支持单选/Shift+多选，按 E 键退出' : '精修模式已关闭');
  }
}

async function getBlockText(info: BlockInfo): Promise<string> {
  const r = await api(`/__edit__/source?file=${enc(info.file)}&line=${info.line}`);
  return r?.ok && typeof r.text === 'string' ? r.text : '';
}

function afterUndo(): void {
  clearSelection();
  hideBadge();
  updatePanel();
}

const draftKey = (info: BlockInfo): string => `${info.file}#${info.line}`;

function prepareDraft(key: string): void {
  const oldIdx = draftOps.findIndex((d) => d.key === key);
  if (oldIdx !== -1) {
    draftOps[oldIdx].undo();
    draftOps.splice(oldIdx, 1);
    afterUndo();
  }
}

function enqueueDraft(
  op: string,
  payload: Record<string, unknown>,
  opts: { key: string; anchorText?: string; targetAnchorText?: string; label: string; undo: () => void },
): void {
  draftOps.push({
    op,
    payload,
    anchorText: opts.anchorText || '',
    targetAnchorText: opts.targetAnchorText,
    label: opts.label,
    undo: opts.undo,
    key: opts.key,
  });
  updatePanel();
}

async function saveDraft(): Promise<void> {
  if (!draftOps.length) {
    toast('没有待保存的修改');
    return;
  }
  const file = selected?.file || currentFile;
  if (!file) {
    toast('未定位到文件，无法保存');
    return;
  }
  const ops = draftOps.map((d) => ({
    op: d.op,
    payload: d.payload,
    anchorText: d.anchorText,
    ...(d.targetAnchorText !== undefined ? { targetAnchorText: d.targetAnchorText } : {}),
  }));
  const r = await api('/__edit__/apply-batch', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ file, ops }),
  });
  if (r?.ok) {
    const n = r.savedCount ?? ops.length;
    draftOps = [];
    updatePanel();
    toast(`已成功保存 ${n} 处修改`);
    const ok2 = await refreshContent();
    if (!ok2) toast('修改已写盘，但页面热替换失败，请手动刷新', true);
  } else {
    toast('保存失败：' + (r?.message || '未知错误'));
  }
}

async function undo(): Promise<void> {
  if (draftOps.length) {
    const d = draftOps.pop()!;
    d.undo();
    afterUndo();
    toast('已撤销：' + d.label);
    updatePanel();
    return;
  }
  const file = selected?.file || currentFile;
  if (!file) {
    toast('没有可撤销的文件');
    return;
  }
  const r = await api('/__edit__/undo', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ file }),
  });
  if (r?.ok) {
    toast(r.message || '已撤销');
    const ok2 = await refreshContent();
    if (!ok2) toast('已撤销，但页面自动更新失败，请手动刷新', true);
  } else {
    toast(r?.message || '撤销失败');
  }
}

function markDirty(el: HTMLElement): () => void {
  el.classList.add('dsh-dirty');
  return () => el.classList.remove('dsh-dirty');
}

async function doTextEdit(op: string, payload: Record<string, unknown>, info: BlockInfo, label: string): Promise<boolean> {
  prepareDraft(draftKey(info));
  const freshEl = findBlockByLine(info.line);
  if (!freshEl) {
    toast('无法定位块（草稿已变化）');
    return false;
  }
  const freshInfo = readBlock(freshEl);
  if (!freshInfo) return false;

  const anchorText = await getBlockText(freshInfo);
  const r = await api('/__edit__/preview-block', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ file: freshInfo.file, op, payload }),
  });
  if (!r?.ok) {
    toast('操作失败：' + (r?.message || '未知错误'));
    return false;
  }
  let undo: () => void;
  if (r.html) {
    const newNode = htmlToElement(r.html);
    freshEl.replaceWith(newNode);
    undo = () => {
      newNode.replaceWith(htmlToElement(freshEl.outerHTML));
      afterUndo();
    };
    const newInfo = readBlock(newNode);
    if (newInfo) selectBlock(newInfo);
  } else {
    undo = markDirty(freshEl);
  }
  enqueueDraft(op, payload, { key: draftKey(freshInfo), anchorText, label, undo });
  return true;
}

async function doMove(info: BlockInfo, targetInfo: BlockInfo | null, position: 'before' | 'after'): Promise<void> {
  if (!targetInfo) return;
  if (targetInfo.line === info.line) return;
  prepareDraft(draftKey(info));
  const freshEl = findBlockByLine(info.line);
  if (!freshEl) {
    toast('无法定位块（草稿已变化）');
    return;
  }
  const freshInfo = readBlock(freshEl);
  if (!freshInfo) return;
  const targetEl = findBlockByLine(targetInfo.line);
  if (!targetEl) {
    toast('无法定位目标块');
    return;
  }
  const targetFresh = readBlock(targetEl);
  if (!targetFresh) return;
  if (targetFresh.line === freshInfo.line) return;

  const anchorText = await getBlockText(freshInfo);
  const targetAnchorText = await getBlockText(targetFresh);
  const parent = freshEl.parentElement;
  const ref = freshEl.nextSibling;
  if (position === 'before') targetEl.before(freshEl);
  else targetEl.after(freshEl);

  enqueueDraft('move-block', { line: freshInfo.line, targetLine: targetFresh.line, position }, {
    key: draftKey(freshInfo),
    anchorText,
    targetAnchorText,
    label: `移动至 L${targetFresh.line}${position === 'before' ? ' 之前' : ' 之后'}`,
    undo: () => {
      if (parent) parent.insertBefore(freshEl, ref);
      afterUndo();
    },
  });
  if (selected) positionToolbar();
}

async function doExtract(info: BlockInfo): Promise<void> {
  prepareDraft(draftKey(info));
  const freshEl = findBlockByLine(info.line);
  if (!freshEl) {
    toast('无法定位块（草稿已变化）');
    return;
  }
  const freshInfo = readBlock(freshEl);
  if (!freshInfo) return;
  const anchorText = await getBlockText(freshInfo);
  const cardEl = cardElementOf(freshInfo);
  if (!cardEl) {
    toast('无法定位所属卡片');
    return;
  }
  const parent = freshEl.parentElement;
  const ref = freshEl.nextSibling;
  const cardBody = cardEl.querySelector('.card-body, .fallback-content, .solution-content, .analysis-content') || cardEl;
  const innerBlocks = Array.from(cardBody.querySelectorAll(':scope > [data-src-line]'));
  let cardSnapshot: string | null = null;
  if (innerBlocks.length <= 1) {
    cardSnapshot = cardEl.outerHTML;
    cardEl.replaceWith(freshEl);
  } else {
    cardEl.after(freshEl);
  }
  enqueueDraft('extract', { line: freshInfo.line }, {
    key: draftKey(freshInfo),
    anchorText,
    label: '移出卡片',
    undo: () => {
      if (cardSnapshot) {
        freshEl.replaceWith(htmlToElement(cardSnapshot));
      } else if (parent) {
        parent.insertBefore(freshEl, ref);
      }
      afterUndo();
    },
  });
  if (selected) positionToolbar();
}

async function doUnwrap(info: BlockInfo): Promise<void> {
  prepareDraft(draftKey(info));
  const freshEl = findBlockByLine(info.line);
  if (!freshEl) {
    toast('无法定位卡片（草稿已变化）');
    return;
  }
  const freshInfo = readBlock(freshEl);
  if (!freshInfo) return;
  const cardEl = freshEl;
  const anchorText = await getBlockText(freshInfo);
  const parent = cardEl.parentElement;
  const ref = cardEl.nextSibling;
  const cardBody = cardEl.querySelector('.card-body, .fallback-content, .solution-content, .analysis-content') || cardEl;
  const blocks = Array.from(cardBody.children).filter((b) => b.hasAttribute('data-src-line')) as HTMLElement[];
  const moved = blocks.length ? blocks : (Array.from(cardBody.children) as HTMLElement[]);

  const title = (cardEl.getAttribute('data-title') || '').trim();
  const pieces: HTMLElement[] = [];
  if (title) {
    const h2 = document.createElement('h2');
    h2.setAttribute('data-src-file', freshInfo.file);
    h2.setAttribute('data-src-line', String(freshInfo.line));
    h2.setAttribute('data-src-kind', 'heading');
    h2.textContent = title;
    pieces.push(h2);
  }
  pieces.push(...moved);
  cardEl.replaceWith(...pieces);

  enqueueDraft('unwrap', { line: freshInfo.line }, {
    key: draftKey(freshInfo),
    anchorText,
    label: '转为正文',
    undo: () => {
      pieces.forEach((b) => b.remove());
      if (parent) parent.insertBefore(cardEl, ref);
      afterUndo();
    },
  });
  const firstBlock = pieces.find((b) => b.hasAttribute('data-src-line'));
  if (firstBlock) {
    const bi = readBlock(firstBlock);
    if (bi) selectBlock(bi);
  } else {
    afterUndo();
  }
}

async function doWrap(info: BlockInfo, cardType: string, title: string): Promise<void> {
  prepareDraft(draftKey(info));
  const freshEl = findBlockByLine(info.line);
  if (!freshEl) {
    toast('无法定位块（草稿已变化）');
    return;
  }
  const freshInfo = readBlock(freshEl);
  if (!freshInfo) return;
  const anchorText = await getBlockText(freshInfo);
  const el = freshEl;
  const wrapper = document.createElement('div');
  wrapper.className = 'dsh-preview-card';
  wrapper.setAttribute('data-src-line', String(freshInfo.line));
  wrapper.setAttribute('data-src-kind', cardType);
  wrapper.setAttribute('data-title', title);
  const head = document.createElement('div');
  head.className = 'dsh-preview-card-title';
  head.textContent = title || KIND_NAMES[cardType] || cardType;
  const bodyWrap = document.createElement('div');
  bodyWrap.className = 'dsh-preview-card-body';
  el.replaceWith(wrapper);
  wrapper.append(head, bodyWrap);
  bodyWrap.appendChild(el);

  enqueueDraft('wrap', { line: freshInfo.line, cardType, title }, {
    key: draftKey(freshInfo),
    anchorText,
    label: `包成卡片（${KIND_NAMES[cardType] || cardType}）`,
    undo: () => {
      wrapper.replaceWith(el);
      afterUndo();
    },
  });
  if (selected) positionToolbar();
}

async function doWrapRange(range: RangeSelection, cardType: string, title: string): Promise<void> {
  const s = range.startLine;
  const e = range.endLine;
  const key = `${currentFile}#range-${s}-${e}`;
  prepareDraft(key);

  const wrapper = document.createElement('div');
  wrapper.className = 'dsh-preview-card';
  wrapper.setAttribute('data-src-line', String(s));
  wrapper.setAttribute('data-src-kind', cardType);
  wrapper.setAttribute('data-title', title);
  const head = document.createElement('div');
  head.className = 'dsh-preview-card-title';
  head.textContent = title || KIND_NAMES[cardType] || cardType;
  const bodyWrap = document.createElement('div');
  bodyWrap.className = 'dsh-preview-card-body';

  const firstBlock = range.blocks[0];
  firstBlock.before(wrapper);
  wrapper.append(head, bodyWrap);
  for (const b of range.blocks) {
    bodyWrap.appendChild(b);
  }

  enqueueDraft('wrap-range', { startLine: s, endLine: e, cardType, title }, {
    key,
    label: `多块包成卡片（L${s}-L${e} · ${KIND_NAMES[cardType] || cardType}）`,
    undo: () => {
      for (const b of range.blocks) {
        wrapper.before(b);
      }
      wrapper.remove();
      afterUndo();
    },
  });
  clearSelection();
  toast(`已将 ${range.blocks.length} 块包入卡片`);
}

async function doChangeCardType(info: BlockInfo, newType: string): Promise<void> {
  prepareDraft(draftKey(info));
  const cardEl = findBlockByLine(info.line);
  if (!cardEl) return;
  const oldKind = cardEl.getAttribute('data-src-kind') || '';
  cardEl.setAttribute('data-src-kind', newType);
  cardEl.classList.add('dsh-dirty');

  enqueueDraft('change-card-type', { line: info.line, cardType: newType }, {
    key: draftKey(info),
    label: `卡片类型变更为 ${KIND_NAMES[newType] || newType}`,
    undo: () => {
      cardEl.setAttribute('data-src-kind', oldKind);
      cardEl.classList.remove('dsh-dirty');
      afterUndo();
    },
  });
  renderToolbar(readBlock(cardEl)!);
  toast(`卡片类型已变更为「${KIND_NAMES[newType] || newType}」`);
}

async function doUpdateCardTitle(info: BlockInfo, newTitle: string): Promise<void> {
  prepareDraft(draftKey(info));
  const cardEl = findBlockByLine(info.line);
  if (!cardEl) return;
  const oldTitle = cardEl.getAttribute('data-title') || '';
  cardEl.setAttribute('data-title', newTitle);
  const header = cardEl.querySelector('.card-header, summary, .dsh-preview-card-title, .analysis-header');
  if (header) header.textContent = newTitle || KIND_NAMES[info.kind] || info.kind;
  cardEl.classList.add('dsh-dirty');

  enqueueDraft('update-title', { line: info.line, title: newTitle }, {
    key: draftKey(info),
    label: `修改卡片标题为“${newTitle}”`,
    undo: () => {
      cardEl.setAttribute('data-title', oldTitle);
      if (header) header.textContent = oldTitle;
      cardEl.classList.remove('dsh-dirty');
      afterUndo();
    },
  });
  toast('卡片标题已更新');
}

async function doMergeBlocks(startLine: number, endLine: number): Promise<void> {
  const s = Math.min(startLine, endLine);
  const e = Math.max(startLine, endLine);
  const key = `${currentFile}#merge-${s}-${e}`;
  prepareDraft(key);

  const blockS = findBlockByLine(s);
  const blockE = findBlockByLine(e);
  if (!blockS || !blockE) {
    toast('无法定位合并范围');
    return;
  }
  const allIn = Array.from(mainContent().querySelectorAll('[data-src-line]')).filter((b) => {
    const l = parseInt(b.getAttribute('data-src-line') || '', 10);
    return Number.isFinite(l) && l >= s && l <= e;
  }) as HTMLElement[];

  const combinedText = allIn.map((b) => b.innerText.trim()).filter(Boolean).join(' ');
  const p = document.createElement('p');
  p.setAttribute('data-src-line', String(s));
  p.setAttribute('data-src-file', currentFile);
  p.setAttribute('data-src-kind', 'paragraph');
  p.textContent = combinedText;
  p.classList.add('dsh-dirty');

  blockS.before(p);
  allIn.forEach((b) => b.remove());

  enqueueDraft('merge-blocks', { startLine: s, endLine: e }, {
    key,
    label: `合并段落 L${s}-L${e}`,
    undo: () => {
      allIn.forEach((b) => p.before(b));
      p.remove();
      afterUndo();
    },
  });
  clearSelection();
  toast('已合并为单一段落');
}

async function doMergeWithNeighbor(info: BlockInfo, neighborInfo: BlockInfo | null): Promise<void> {
  if (!neighborInfo) {
    toast('没有可合并的相邻块');
    return;
  }
  await doMergeBlocks(info.line, neighborInfo.line);
}

async function doDelete(info: BlockInfo): Promise<void> {
  prepareDraft(draftKey(info));
  const freshEl = findBlockByLine(info.line);
  if (!freshEl) return;
  const parent = freshEl.parentElement;
  const ref = freshEl.nextSibling;
  freshEl.remove();

  enqueueDraft('delete', { line: info.line }, {
    key: draftKey(info),
    label: `删除 L${info.line}`,
    undo: () => {
      if (parent) parent.insertBefore(freshEl, ref);
      afterUndo();
    },
  });
  afterUndo();
}

async function doDeleteRange(startLine: number, endLine: number): Promise<void> {
  const s = Math.min(startLine, endLine);
  const e = Math.max(startLine, endLine);
  const key = `${currentFile}#delete-range-${s}-${e}`;
  prepareDraft(key);

  const inRange = Array.from(mainContent().querySelectorAll('[data-src-line]')).filter((b) => {
    const l = parseInt(b.getAttribute('data-src-line') || '', 10);
    return Number.isFinite(l) && l >= s && l <= e;
  }) as HTMLElement[];

  const snapshots = inRange.map((b) => ({ el: b, parent: b.parentElement, ref: b.nextSibling }));
  inRange.forEach((b) => b.remove());

  enqueueDraft('delete-range', { startLine: s, endLine: e }, {
    key,
    label: `批量删除 L${s}-L${e}`,
    undo: () => {
      for (const s of snapshots) {
        if (s.parent) s.parent.insertBefore(s.el, s.ref);
      }
      afterUndo();
    },
  });
  clearSelection();
  toast('已删除选中区域');
}

async function doInsertIntoCard(info: BlockInfo, target: { line: number; text: string }): Promise<void> {
  prepareDraft(draftKey(info));
  const freshEl = findBlockByLine(info.line);
  if (!freshEl) return;
  const anchorText = await getBlockText(info);
  const cardEl = findBlockByLine(target.line);
  if (!cardEl) {
    toast(`未找到第 ${target.line} 行的卡片`);
    return;
  }
  const parent = freshEl.parentElement;
  const ref = freshEl.nextSibling;
  const cardBody = cardEl.querySelector('.card-body, .fallback-content, .solution-content, .analysis-content') || cardEl;
  cardBody.appendChild(freshEl);

  enqueueDraft('insert-into-card', { line: info.line, targetLine: target.line }, {
    key: draftKey(info),
    anchorText,
    targetAnchorText: target.text,
    label: `移入卡片 L${target.line}`,
    undo: () => {
      if (parent) parent.insertBefore(freshEl, ref);
      afterUndo();
    },
  });
  if (selected) positionToolbar();
}

async function doInsertRangeIntoCard(range: RangeSelection, target: { line: number; text: string }): Promise<void> {
  const s = range.startLine;
  const e = range.endLine;
  const key = `${currentFile}#insert-range-${s}-${e}`;
  prepareDraft(key);

  const cardEl = findBlockByLine(target.line);
  if (!cardEl) return;
  const cardBody = cardEl.querySelector('.card-body, .fallback-content, .solution-content, .analysis-content') || cardEl;
  const snapshots = range.blocks.map((b) => ({ el: b, parent: b.parentElement, ref: b.nextSibling }));

  for (const b of range.blocks) {
    cardBody.appendChild(b);
  }

  enqueueDraft('insert-range-into-card', { startLine: s, endLine: e, targetLine: target.line }, {
    key,
    targetAnchorText: target.text,
    label: `多块移入卡片 L${target.line}`,
    undo: () => {
      for (const snap of snapshots) {
        if (snap.parent) snap.parent.insertBefore(snap.el, snap.ref);
      }
      afterUndo();
    },
  });
  clearSelection();
  toast(`已将 ${range.blocks.length} 块移入卡片 L${target.line}`);
}

async function refreshContent(): Promise<boolean> {
  try {
    const html = await (await fetch(location.href, { headers: { Accept: 'text/html' }, credentials: 'same-origin' })).text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const newMain = doc.querySelector('.main-pane');
    const currentMain = document.querySelector('.main-pane');
    if (!newMain || !currentMain) return false;
    newMain.querySelectorAll('script').forEach((s) => s.remove());
    const scrollY = window.scrollY;
    currentMain.replaceWith(newMain);
    const newRight = doc.querySelector('.right-sidebar-container');
    const currentRight = document.querySelector('.right-sidebar-container');
    if (newRight) {
      newRight.querySelectorAll('script').forEach((s) => s.remove());
      if (currentRight) currentRight.replaceWith(newRight);
      else newMain.parentElement?.prepend(newRight);
    } else if (currentRight) {
      currentRight.remove();
    }
    document.dispatchEvent(new CustomEvent('astro:page-load'));
    window.scrollTo(0, scrollY);
    return true;
  } catch {
    return false;
  }
}

async function openSourceEditor(info: BlockInfo): Promise<void> {
  const r = await api(`/__edit__/source?file=${enc(info.file)}&line=${info.line}`);
  if (!r?.ok) {
    toast('读取源码失败：' + (r?.message || '未知错误'));
    return;
  }
  const textarea = modalTextarea(r.text || '');
  const hint = document.createElement('div');
  hint.className = 'dsh-modal-hint';
  hint.textContent = '直接编辑 MDX 片段。保存后进入草稿，最后点击顶部「保存并刷新」完成写盘。';
  const wrap = document.createElement('div');
  wrap.appendChild(hint);
  wrap.appendChild(textarea);
  showModal({
    title: `编辑源码（${r.kind} · L${r.startLine}-${r.endLine}）`,
    body: wrap,
    onSave: async () => {
      const newText = textarea.value;
      if (!newText.trim()) {
        toast('内容不能为空');
        return;
      }
      const ok = await doTextEdit('replace-block', { line: info.line, newText }, info, '编辑源码');
      if (ok) hideModal();
    },
  });
}

function openFirstFormula(info: BlockInfo): void {
  const katex = info.el.querySelector('.katex[data-latex], .katex-display[data-latex]');
  if (!katex) {
    toast('该块内未检测到公式');
    return;
  }
  openFormulaEditor(katex, info);
}

function openFormulaEditor(katex: Element, info: BlockInfo): void {
  const latex = katex.getAttribute('data-latex') || '';
  const bodyLatex = stripDelimiters(latex);
  const textarea = modalTextarea(bodyLatex);
  const hint = document.createElement('div');
  hint.className = 'dsh-modal-hint';
  hint.textContent = 'LaTeX 源码（无需外层 $ 或 $$ 分隔符）。保存后即时预览公式效果。';
  const wrap = document.createElement('div');
  wrap.appendChild(hint);
  wrap.appendChild(textarea);
  showModal({
    title: `编辑 LaTeX 公式 · L${info.line}`,
    body: wrap,
    onSave: async () => {
      const newLatex = textarea.value.trim();
      if (!newLatex) {
        toast('公式内容不能为空');
        return;
      }
      const ok = await doTextEdit('edit-formula', { line: info.line, oldLatex: bodyLatex, newLatex }, info, '编辑公式');
      if (ok) hideModal();
    },
  });
}

function openEditTitleModal(info: BlockInfo): void {
  const oldTitle = info.el.getAttribute('data-title') || '';
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'dsh-modal-input';
  input.value = oldTitle;
  input.placeholder = '输入卡片标题，如：例 2.1 / 知识点：导数的几何意义';

  const body = document.createElement('div');
  const field = document.createElement('div');
  field.className = 'dsh-modal-field';
  const lab = document.createElement('span');
  lab.className = 'dsh-modal-label';
  lab.textContent = '卡片标题';
  field.append(lab, input);
  body.appendChild(field);

  showModal({
    title: `修改卡片标题（${KIND_NAMES[info.kind] || info.kind} L${info.line}）`,
    body,
    onSave: async () => {
      await doUpdateCardTitle(info, input.value.trim());
      hideModal();
    },
  });
}

function openChangeTypeModal(info: BlockInfo): void {
  const sel = document.createElement('select');
  sel.className = 'dsh-modal-select';
  for (const t of WRAP_TYPES) {
    const opt = document.createElement('option');
    opt.value = t.value;
    opt.textContent = t.label;
    if (t.value === info.kind) opt.selected = true;
    sel.appendChild(opt);
  }

  const body = document.createElement('div');
  const field = document.createElement('div');
  field.className = 'dsh-modal-field';
  const lab = document.createElement('span');
  lab.className = 'dsh-modal-label';
  lab.textContent = '新卡片类型';
  field.append(lab, sel);
  body.appendChild(field);

  showModal({
    title: `更换卡片类型（当前为 ${KIND_NAMES[info.kind] || info.kind}）`,
    body,
    onSave: async () => {
      await doChangeCardType(info, sel.value);
      hideModal();
    },
  });
}

function openWrapModal(info: BlockInfo): void {
  const sel = document.createElement('select');
  sel.className = 'dsh-modal-select';
  for (const t of WRAP_TYPES) {
    const opt = document.createElement('option');
    opt.value = t.value;
    opt.textContent = t.label;
    sel.appendChild(opt);
  }
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'dsh-modal-input';
  input.placeholder = '可选标题，如：例题 3.1 / 知识点：极限定义';

  const body = document.createElement('div');
  const f1 = document.createElement('div');
  f1.className = 'dsh-modal-field';
  f1.append(Object.assign(document.createElement('span'), { className: 'dsh-modal-label', textContent: '卡片类型' }), sel);
  const f2 = document.createElement('div');
  f2.className = 'dsh-modal-field';
  f2.append(Object.assign(document.createElement('span'), { className: 'dsh-modal-label', textContent: '卡片标题' }), input);
  body.append(f1, f2);

  showModal({
    title: `包成卡片（单块 L${info.line}）`,
    body,
    onSave: async () => {
      await doWrap(info, sel.value, input.value.trim());
      hideModal();
    },
  });
}

function openWrapRangeModal(range: RangeSelection): void {
  const sel = document.createElement('select');
  sel.className = 'dsh-modal-select';
  for (const t of WRAP_TYPES) {
    const opt = document.createElement('option');
    opt.value = t.value;
    opt.textContent = t.label;
    sel.appendChild(opt);
  }
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'dsh-modal-input';
  input.placeholder = '输入卡片标题，如：例 1.1 细棒的线密度问题';

  const body = document.createElement('div');
  const hint = document.createElement('div');
  hint.className = 'dsh-modal-hint';
  hint.textContent = `将连续选中的 ${range.blocks.length} 块（L${range.startLine}-L${range.endLine}，含题干、公式、配图等）一次性打包进一张卡片。`;

  const f1 = document.createElement('div');
  f1.className = 'dsh-modal-field';
  f1.append(Object.assign(document.createElement('span'), { className: 'dsh-modal-label', textContent: '卡片类型' }), sel);
  const f2 = document.createElement('div');
  f2.className = 'dsh-modal-field';
  f2.append(Object.assign(document.createElement('span'), { className: 'dsh-modal-label', textContent: '卡片标题' }), input);
  body.append(hint, f1, f2);

  showModal({
    title: `多块合并包成卡片（共 ${range.blocks.length} 块）`,
    body,
    onSave: async () => {
      await doWrapRange(range, sel.value, input.value.trim());
      hideModal();
    },
  });
}

async function openInsertIntoCardModal(info: BlockInfo): Promise<void> {
  const r = await api(`/__edit__/cards?file=${enc(info.file)}`);
  const cards: Array<{ line: number; kind: string; title: string; preview: string; text: string }> = r?.cards || [];
  if (!cards.length) {
    toast('当前文件没有可移入的卡片');
    return;
  }
  const body = document.createElement('div');
  const hint = document.createElement('div');
  hint.className = 'dsh-modal-hint';
  hint.textContent = `选择目标卡片（共 ${cards.length} 张），该块将插入到卡片末尾`;
  body.appendChild(hint);

  const list = document.createElement('div');
  list.className = 'dsh-card-pick';
  for (const c of cards) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'dsh-card-pick-item';
    const kindLabel = KIND_NAMES[c.kind] || c.kind;
    const titlePart = c.title ? ` · ${esc(c.title)}` : '';
    const previewPart = c.preview ? `<span class="dsh-card-pick-preview">${esc(c.preview)}</span>` : '';
    item.innerHTML = `<span class="dsh-card-pick-line">L${c.line}</span><strong>${esc(kindLabel)}</strong>${titlePart}${previewPart}`;
    item.addEventListener('click', async () => {
      hideModal();
      await doInsertIntoCard(info, c);
    });
    list.appendChild(item);
  }
  body.appendChild(list);

  showModal({ title: '移入卡片', body, onSave: hideModal, saveLabel: '关闭' });
}

async function openInsertRangeModal(range: RangeSelection): Promise<void> {
  const r = await api(`/__edit__/cards?file=${enc(currentFile)}`);
  const cards: Array<{ line: number; kind: string; title: string; preview: string; text: string }> = r?.cards || [];
  if (!cards.length) {
    toast('当前文件没有可移入的卡片');
    return;
  }
  const body = document.createElement('div');
  const hint = document.createElement('div');
  hint.className = 'dsh-modal-hint';
  hint.textContent = `选择目标卡片（共 ${cards.length} 张），选中的 ${range.blocks.length} 块将整体插入卡片末尾`;
  body.appendChild(hint);

  const list = document.createElement('div');
  list.className = 'dsh-card-pick';
  for (const c of cards) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'dsh-card-pick-item';
    const kindLabel = KIND_NAMES[c.kind] || c.kind;
    const titlePart = c.title ? ` · ${esc(c.title)}` : '';
    const previewPart = c.preview ? `<span class="dsh-card-pick-preview">${esc(c.preview)}</span>` : '';
    item.innerHTML = `<span class="dsh-card-pick-line">L${c.line}</span><strong>${esc(kindLabel)}</strong>${titlePart}${previewPart}`;
    item.addEventListener('click', async () => {
      hideModal();
      await doInsertRangeIntoCard(range, c);
    });
    list.appendChild(item);
  }
  body.appendChild(list);

  showModal({ title: `批量移入卡片（共 ${range.blocks.length} 块）`, body, onSave: hideModal, saveLabel: '关闭' });
}

function openMoveToLineModal(info: BlockInfo): void {
  const input = document.createElement('input');
  input.type = 'number';
  input.min = '1';
  input.className = 'dsh-modal-input';
  input.placeholder = '目标行号（全文行号，如 162）';

  const sel = document.createElement('select');
  sel.className = 'dsh-modal-select';
  const opts: Array<[string, string]> = [['after', '之后'], ['before', '之前']];
  for (const [v, l] of opts) {
    const o = document.createElement('option');
    o.value = v;
    o.textContent = `目标块${l}`;
    sel.appendChild(o);
  }

  const body = document.createElement('div');
  const f1 = document.createElement('div');
  f1.className = 'dsh-modal-field';
  f1.append(Object.assign(document.createElement('span'), { className: 'dsh-modal-label', textContent: '目标行号' }), input);
  const f2 = document.createElement('div');
  f2.className = 'dsh-modal-field';
  f2.append(Object.assign(document.createElement('span'), { className: 'dsh-modal-label', textContent: '放置位置' }), sel);
  body.append(f1, f2);

  showModal({
    title: `移动到指定行号（当前块 L${info.line}）`,
    body,
    onSave: async () => {
      const tl = parseInt(input.value, 10);
      const position = sel.value as 'before' | 'after';
      if (!Number.isFinite(tl) || tl < 1) {
        toast('请输入有效的目标行号');
        return;
      }
      if (tl === info.line) {
        toast('目标行号与当前块相同');
        return;
      }
      const targetEl = findBlockByLine(tl);
      if (!targetEl) {
        toast(`未找到第 ${tl} 行的块`);
        return;
      }
      const targetInfo = readBlock(targetEl);
      if (!targetInfo) return;
      await doMove(info, targetInfo, position);
      hideModal();
    },
  });
}

function confirmDelete(info: BlockInfo): void {
  const body = document.createElement('div');
  body.className = 'dsh-modal-hint';
  body.textContent = `将删除“${KIND_NAMES[info.kind] || info.kind}”（L${info.line}）。删除后可在面板上撤销。`;
  showModal({
    title: '确认删除该块？',
    body,
    saveLabel: '删除',
    onSave: async () => {
      await doDelete(info);
      hideModal();
    },
  });
}

function confirmDeleteRange(startLine: number, endLine: number): void {
  const body = document.createElement('div');
  body.className = 'dsh-modal-hint';
  body.textContent = `将批量删除 L${startLine}-L${endLine} 范围内的全部内容。删除后可在面板上撤销。`;
  showModal({
    title: '确认批量删除？',
    body,
    saveLabel: '批量删除',
    onSave: async () => {
      await doDeleteRange(startLine, endLine);
      hideModal();
    },
  });
}

async function openLog(): Promise<void> {
  const r = await api('/__edit__/log');
  const list = document.createElement('div');
  list.className = 'dsh-log-list';
  const entries: Array<{ file: string; op: string; time: number }> = r?.entries || [];
  if (!entries.length) {
    list.textContent = '（暂无操作记录）';
  } else {
    for (const e of entries) {
      const item = document.createElement('div');
      item.className = 'dsh-log-item';
      const t = new Date(e.time);
      item.textContent = `${t.toLocaleTimeString()} · ${e.op} · ${(e.file || '').split('/').pop()}`;
      list.appendChild(item);
    }
  }
  showModal({ title: `操作日志（${entries.length}）`, body: list, onSave: hideModal, saveLabel: '关闭' });
}

function onKeyDown(e: KeyboardEvent): void {
  const t = e.target as HTMLElement | null;
  const typing = !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
  if ((e.key === 'e' || e.key === 'E') && !typing) {
    setEnabled(!enabled);
    e.preventDefault();
    return;
  }
  if (e.key === 'Escape' && enabled) {
    if (modalVisible()) hideModal();
    else clearSelection();
  }
}

function onMouseOver(e: MouseEvent): void {
  if (!enabled) return;
  const target = e.target as Element | null;
  if (!target || !(target instanceof Element) || (root && root.contains(target))) return;
  if (hovered) hovered.classList.remove('dsh-block-hover');
  hovered = null;
  const block = blockFrom(target);
  if (block) {
    hovered = block;
    block.classList.add('dsh-block-hover');
    showBadge(block);
  } else {
    hideBadge();
  }
}

function onMouseOut(e: MouseEvent): void {
  const related = e.relatedTarget as Node | null;
  if (hovered && (!related || !hovered.contains(related))) {
    hovered.classList.remove('dsh-block-hover');
    hovered = null;
    hideBadge();
  }
}

function onClick(e: MouseEvent): void {
  if (!enabled) return;
  const target = e.target as Element | null;
  if (!target || !(target instanceof Element)) return;
  if (root && root.contains(target)) return;

  if (target.closest('summary')) {
    return;
  }

  const block = blockFrom(target);
  if (!block) return;

  const katex = target.closest('.katex[data-latex], .katex-display[data-latex]');
  const info = readBlock(block);
  if (!info) return;

  if (katex && !e.shiftKey) {
    e.preventDefault();
    clearSelection();
    openFormulaEditor(katex, info);
    return;
  }

  e.preventDefault();

  if (e.shiftKey && selected) {
    selectRange(selected, info);
    return;
  }

  selectBlock(info);
}

export function initEditor(): void {
  const w = window as any;
  if (w.__dshEditorInstalled) return;
  w.__dshEditorInstalled = true;

  ensureRoot();

  if (new URL(location.href).searchParams.get('edit') === '1' && (window as any).__dshFeatureEditorAllowed !== false) {
    enabled = true;
    document.body.classList.add('dsh-edit-mode');
    syncCurrentFile();
    updatePanel();
  }

  document.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('mouseover', onMouseOver, true);
  document.addEventListener('mouseout', onMouseOut, true);
  document.addEventListener('click', onClick, true);

  const reposition = (): void => {
    if (enabled && (selected || rangeSelected)) positionToolbar();
  };
  document.addEventListener('scroll', reposition, true);
  window.addEventListener('resize', reposition);

  const resync = (): void => {
    if (draftOps.length) toast('未保存的修改已丢弃（页面已切换）');
    draftOps = [];
    clearSelection();
    hideBadge();
    syncCurrentFile();
    if (enabled) updatePanel();
  };
  document.addEventListener('astro:page-load', resync);
  window.addEventListener('popstate', resync);
}
