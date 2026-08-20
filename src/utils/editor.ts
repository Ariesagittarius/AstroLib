/**
 * 在线可视化精修工具 · 客户端逻辑（M2 前端编辑 UI + M3 草稿/批处理模式）
 *
 * 依赖 M1 注入层（src/utils/rehype-editor-annotate.mjs）在页面 HTML 上写入的
 * data-src-file / data-src-line / data-src-kind 属性，以及 dev server 的
 * /__edit__/* 写回端点（Vite 插件 dev-server-plugin.mjs，仅 dev 可用；本模块
 * 同样只在 dev 由 EditorMode.astro 引入，生产构建零输出）。
 *
 * 交互：
 *   - 进入：URL ?edit=1 或按 E 键（输入框聚焦时不触发）
 *   - hover 块 → 虚线高亮 + 类型徽标
 *   - 点击块 → 选中 + 浮动工具栏（上移/下移/移入卡片/移出卡片/转为正文/
 *     包成卡片/移动到行号/编辑公式/编辑源码/删除）
 *   - 点击公式（.katex[data-latex]）→ 弹窗编辑 LaTeX（edit-formula）
 *   - 顶部面板：当前文件、撤销、日志、保存、退出
 *   - SPA 导航（项目自定义 fetch+替换 main，见 SidebarOverride.astro）后自动重同步：
 *     监听 astro:page-load / popstate
 *
 * 草稿/批处理模式（M3，本版本核心改动）：
 *   - 每次操作【不直接写盘、不整页刷新】，只入草稿队列并在 DOM 上"模拟效果"：
 *     · 正文块（段落/标题/列表/公式等，不含卡片组件）：调 /__edit__/preview-block
 *       由服务端即时编译出真实渲染片段替换 DOM（公式等即时可见）；
 *     · 含卡片组件的块：DOM 上标记"已修改"（黄色高亮），保存后统一刷新看完整效果；
 *     · 结构操作（移动/移出/转正文/包卡片/删除/移入卡片）：直接做 DOM 结构模拟。
 *   - 同一块多次修改：覆盖旧草稿（只保留最新一次），撤销一步回到原始状态。
 *   - "保存并刷新"：把全部草稿一次性 POST /__edit__/apply-batch，服务端内存依次
 *     应用（全部校验通过）后一次性写盘，前端再抓取最新页面替换内容区（不整页刷新）。
 *   - 撤销：有草稿时撤销最后一条草稿（恢复 DOM）；无草稿时走服务端 undo。
 *   - 退出编辑模式 / SPA 切换页面时若有未保存草稿，弹窗确认丢弃。
 *
 * 协议约定（与 docs/精修工具交接.md 一致）：
 *   - 前端传的 line / targetLine 均为全文行号（data-src-line 即全文行号），
 *     端点负责换算为 body 行号；
 *   - edit-formula 的 oldLatex/newLatex 为【不含 $ 分隔符】的公式内容
 *     （data-latex 含分隔符，提交前由 stripDelimiters 剥离）；
 *   - 每个草稿操作携带 anchorText（源块源码文本）与可选 targetAnchorText
 *     （目标块源码文本），供服务端批量应用时做锚点重定位（前面的操作可能已
 *     改变行号，文本锚点保证定位准确）。
 */

type BlockInfo = {
  el: HTMLElement;
  file: string;
  line: number;
  kind: string;
  parentKind: string | null;
};

/** 单条草稿操作 */
type DraftOp = {
  key: string; // file#line：同块覆盖键
  op: string;
  payload: Record<string, unknown>;
  anchorText: string;
  targetAnchorText?: string;
  label: string;
  undo: () => void;
};

const CARD_KINDS = new Set([
  'example', 'variant', 'knowledge', 'note', 'solution',
  'block', 'method', 'guide', 'exercise', 'summary',
]);

const KIND_NAMES: Record<string, string> = {
  example: '例题', variant: '变式', knowledge: '知识点', note: '注释', solution: '解答',
  block: '模块', method: '方法', guide: '导读', exercise: '练习', summary: '总结',
  paragraph: '段落', heading: '标题', list: '列表', table: '表格', quote: '引用',
  code: '代码块', formula: '公式', hr: '分隔线',
};

/** “包成卡片”的候选类型（与 apply-op.mjs 的 COMPONENT_BY_KIND 对齐） */
const WRAP_TYPES: Array<{ value: string; label: string }> = [
  { value: 'example', label: '例题' },
  { value: 'variant', label: '变式' },
  { value: 'knowledge', label: '知识点' },
  { value: 'note', label: '注释' },
  { value: 'solution', label: '解答' },
  { value: 'block', label: '模块' },
  { value: 'method', label: '方法' },
  { value: 'guide', label: '导读' },
  { value: 'exercise', label: '练习' },
];

const OP_LABELS: Record<string, string> = {
  'replace-block': '编辑源码', 'edit-formula': '编辑公式', 'move-block': '移动',
  unwrap: '转为正文', extract: '移出卡片', wrap: '包成卡片', delete: '删除',
  'insert-into-card': '移入卡片',
};

/* ---------------- 状态 ---------------- */

let enabled = false;
let selected: BlockInfo | null = null;
let hovered: HTMLElement | null = null;
let currentFile = '';
let draftOps: DraftOp[] = [];

/* ---------------- UI 元素（懒创建） ---------------- */

let root: HTMLElement | null = null;
let badge: HTMLElement | null = null;
let toolbar: HTMLElement | null = null;
let panel: HTMLElement | null = null;
let modal: HTMLElement | null = null;
let toastBox: HTMLElement | null = null;

/* ---------------- 小工具 ---------------- */

const enc = encodeURIComponent;

function mainContent(): HTMLElement {
  return (
    document.querySelector('main .sl-markdown-content') ||
    document.querySelector('.main-pane') ||
    document.querySelector('main') ||
    document.body
  ) as HTMLElement;
}

/** 从任意元素向上找最近的“编辑块”（带 data-src-line 的元素） */
function blockFrom(target: Element | null): HTMLElement | null {
  if (!target) return null;
  return target.closest('[data-src-line]') as HTMLElement | null;
}

/** 页面 URL 兜底推导源文件路径（data-src-file 缺失时） */
function guessFileFromPath(): string {
  const p = location.pathname.replace(/\/+$/, '');
  return p ? 'src/content/docs' + p + '.mdx' : '';
}

function readBlock(el: HTMLElement): BlockInfo | null {
  const line = parseInt(el.getAttribute('data-src-line') || '', 10);
  if (!Number.isFinite(line) || line < 1) return null;
  const file = el.getAttribute('data-src-file') || currentFile || guessFileFromPath();
  const kind = el.getAttribute('data-src-kind') || 'paragraph';
  // 所属卡片：向上找最近的卡片 kind 祖先（块自身是卡片时不视为父卡片）
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

/** 同一父容器下的兄弟块（用于上移/下移） */
function siblingBlocks(el: HTMLElement): HTMLElement[] {
  const parent = el.parentElement;
  if (!parent) return [];
  return Array.from(parent.querySelectorAll(':scope > [data-src-line]')) as HTMLElement[];
}

/** 向上找最近的卡片元素 */
function cardElementOf(info: BlockInfo): HTMLElement | null {
  let p = info.el.parentElement;
  while (p) {
    const k = p.getAttribute('data-src-kind');
    if (k && CARD_KINDS.has(k)) return p;
    p = p.parentElement;
  }
  return null;
}

/** 按全文行号在当前页面找块元素 */
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

function btn(label: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.addEventListener('click', onClick);
  return b;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** HTML 片段 → 元素 */
function htmlToElement(html: string): HTMLElement {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.firstElementChild as HTMLElement) || document.createElement('div');
}

/* ---------------- UI 构建 ---------------- */

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
  if (!toolbar || !selected) return;
  toolbar.style.display = 'flex'; // 先显示才能测量真实宽度
  const r = selected.el.getBoundingClientRect();
  const w = toolbar.offsetWidth || 520;
  let left = r.left + r.width / 2 - w / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
  let top = r.top - 46;
  if (top < 8) top = r.bottom + 8;
  toolbar.style.left = left + 'px';
  toolbar.style.top = top + 'px';
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
    items.push({ label: '转为正文', title: '剥掉卡片外壳，内容直接作为正文', onClick: () => void doUnwrap(info) });
  } else if (!info.parentKind) {
    items.push({ label: '移入卡片', title: '把该块插入到某张卡片末尾（可用卡片行号定位）', onClick: () => void openInsertIntoCardModal(info) });
    items.push({ label: '包成卡片', title: '把该块包成卡片', onClick: () => openWrapModal(info) });
  } else {
    items.push({ label: '移出卡片', title: '把该块移到卡片之后（正文）', onClick: () => void doExtract(info) });
  }
  items.push({ label: '移动到行号', title: '把该块移到指定行号之前/之后', onClick: () => openMoveToLineModal(info) });
  items.push({ label: '公式', title: '编辑块内第一个公式', onClick: () => openFirstFormula(info) });
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

function clearSelection(): void {
  if (selected) selected.el.classList.remove('dsh-block-selected');
  selected = null;
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

/* ---------------- 弹窗 ---------------- */

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

/* ---------------- 顶部面板 ---------------- */

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

  const undoBtn = btn('撤销', () => void undo());
  undoBtn.title = draftOps.length ? '撤销最后一条草稿修改' : '撤销最近一次写回（按文件）';
  const logBtn = btn('日志', () => void openLog());
  const saveBtn = btn(draftOps.length ? `保存 (${draftOps.length})` : '保存', () => void saveDraft());
  saveBtn.className = 'dsh-panel-save' + (draftOps.length ? ' dsh-panel-save-dirty' : '');
  saveBtn.disabled = !draftOps.length;
  saveBtn.title = '把全部草稿修改一次性写入源文件并刷新页面';
  const exitBtn = btn('退出', () => setEnabled(false));
  exitBtn.title = '退出精修模式（E）';

  panel.append(title, fileSpan, undoBtn, logBtn, saveBtn, exitBtn);
}

function syncCurrentFile(): void {
  const el = mainContent().querySelector('[data-src-file]');
  currentFile = el ? el.getAttribute('data-src-file') || '' : guessFileFromPath();
}

/* ---------------- 模式开关 ---------------- */

function guardDraft(): boolean {
  if (!draftOps.length) return true;
  return window.confirm(`有 ${draftOps.length} 处未保存的修改，退出将丢弃。是否继续？`);
}

function setEnabled(on: boolean): void {
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
    toast(on ? '精修模式已开启：点击块编辑，E 键退出' : '精修模式已关闭');
  }
}

/* ---------------- 草稿核心（M3） ---------------- */

/** 取块的源码文本（锚点，基于源文件当前内容——草稿不写盘，锚点始终有效） */
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

/**
 * 草稿覆盖准备：同一块（file#line）已有旧草稿时，先撤销它（恢复 DOM），
 * 保证后续 DOM 模拟基于"旧草稿之前"的原始状态。必须在任何 DOM 操作之前调用。
 */
function prepareDraft(key: string): void {
  const oldIdx = draftOps.findIndex((d) => d.key === key);
  if (oldIdx !== -1) {
    draftOps[oldIdx].undo();
    draftOps.splice(oldIdx, 1);
    afterUndo();
  }
}

/** 入队草稿（调用方须先 prepareDraft 处理同块覆盖） */
function enqueueDraft(
  op: string,
  payload: Record<string, unknown>,
  opts: { key: string; anchorText: string; targetAnchorText?: string; label: string; undo: () => void },
): void {
  draftOps.push({ op, payload, anchorText: opts.anchorText, targetAnchorText: opts.targetAnchorText, label: opts.label, undo: opts.undo, key: opts.key });
  updatePanel();
}

/** 保存全部草稿：一次性写盘 + 刷新内容区（不整页刷新） */
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
    toast(`已保存 ${n} 处修改`);
    const ok2 = await refreshContent();
    if (!ok2) toast('内容已写盘，但页面自动更新失败，请手动刷新', true);
  } else {
    toast('保存失败：' + (r?.message || '未知错误'));
  }
}

/** 撤销：优先撤销最后一条草稿；否则走服务端 undo */
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

/** 标记式预览：给块加"已修改待保存"高亮（含组件的块无法即时重渲染） */
function markDirty(el: HTMLElement): () => void {
  el.classList.add('dsh-dirty');
  return () => el.classList.remove('dsh-dirty');
}

/**
 * 文本类操作（replace-block / edit-formula）：
 * 尽力预览——服务端即时编译出真实渲染片段替换 DOM；含组件的块降级为标记式。
 * 返回是否成功入队。
 */
async function doTextEdit(op: string, payload: Record<string, unknown>, info: BlockInfo, label: string): Promise<boolean> {
  prepareDraft(draftKey(info));
  // 旧草稿撤销后 DOM 元素已更换 → 按行号重新定位
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
    const parent = freshEl.parentElement;
    const ref = freshEl.nextSibling;
    freshEl.replaceWith(newNode);
    undo = () => {
      newNode.replaceWith(htmlToElement(freshEl.outerHTML));
      afterUndo();
    };
    // 重新选中新块，保持后续操作连续
    const newInfo = readBlock(newNode);
    if (newInfo) selectBlock(newInfo);
  } else {
    undo = markDirty(freshEl);
    toast('该块含卡片组件，预览受限：保存后统一刷新查看完整效果');
  }
  enqueueDraft(op, payload, { key: draftKey(freshInfo), anchorText, label, undo });
  return true;
}

/** 移动（上移/下移/移动到行号）：DOM 直接移动 */
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

/** 移出卡片：块移到卡片之后；卡片只剩该块时卡片删除、块转正文（与服务端语义一致） */
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
  const cardBody = cardEl.querySelector('.card-body, .fallback-content') || cardEl;
  const innerBlocks = Array.from(cardBody.querySelectorAll(':scope > [data-src-line]'));
  let cardSnapshot: string | null = null;
  if (innerBlocks.length <= 1) {
    cardSnapshot = cardEl.outerHTML;
    cardEl.replaceWith(freshEl); // 卡片删除，该块直接作为正文
  } else {
    cardEl.after(freshEl);
  }
  enqueueDraft('extract', { line: freshInfo.line }, {
    key: draftKey(freshInfo),
    anchorText,
    label: '移出卡片',
    undo: () => {
      if (cardSnapshot) {
        freshEl.replaceWith(htmlToElement(cardSnapshot)); // 恢复完整卡片（含该块）
      } else if (parent) {
        parent.insertBefore(freshEl, ref);
      }
      afterUndo();
    },
  });
  if (selected) positionToolbar();
}

/** 卡片 → 正文：卡片外壳替换为内容块，卡片标题转为 h2 标题（与服务端 opUnwrap 一致） */
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
  const cardBody = cardEl.querySelector('.card-body, .fallback-content') || cardEl;
  const blocks = Array.from(cardBody.children).filter((b) => b.hasAttribute('data-src-line')) as HTMLElement[];
  const moved = blocks.length ? blocks : (Array.from(cardBody.children) as HTMLElement[]);

  // 卡片标题 → h2（data-title 属性经浏览器解码，与反转义后的服务端行为一致）
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
      if (parent) parent.insertBefore(cardEl, ref); // cardEl 的 innerHTML 仍是完整快照
      afterUndo();
    },
  });
  // 卡片已脱离 DOM → 选中第一个内容块（优先 h2 标题），工具栏跟随
  const firstBlock = pieces.find((b) => b.hasAttribute('data-src-line'));
  if (firstBlock) {
    const bi = readBlock(firstBlock);
    if (bi) selectBlock(bi);
  } else {
    afterUndo();
  }
}

/** 包成卡片：DOM 用占位卡片外壳模拟（保存后刷新为真实卡片组件） */
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
    label: '包成卡片',
    undo: () => {
      wrapper.replaceWith(el);
      afterUndo();
    },
  });
  if (selected) positionToolbar();
}

/** 删除：移除节点，撤销时插回原位 */
async function doDelete(info: BlockInfo): Promise<void> {
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
  const parent = el.parentElement;
  const ref = el.nextSibling;
  el.remove();
  enqueueDraft('delete', { line: freshInfo.line }, {
    key: draftKey(freshInfo),
    anchorText,
    label: '删除',
    undo: () => {
      if (parent) parent.insertBefore(el, ref);
      afterUndo();
    },
  });
  afterUndo(); // 块已删除 → 清空选中与工具栏
}

/** 移入卡片：把正文块插入目标卡片末尾 */
async function doInsertIntoCard(info: BlockInfo, target: { line: number; text: string }): Promise<void> {
  prepareDraft(draftKey(info));
  const freshEl = findBlockByLine(info.line);
  if (!freshEl) {
    toast('无法定位块（草稿已变化）');
    return;
  }
  const freshInfo = readBlock(freshEl);
  if (!freshInfo) return;
  const anchorText = await getBlockText(freshInfo);
  const cardEl = findBlockByLine(target.line);
  if (!cardEl) {
    toast(`未找到第 ${target.line} 行的卡片`);
    return;
  }
  const parent = freshEl.parentElement;
  const ref = freshEl.nextSibling;
  const cardBody = cardEl.querySelector('.card-body, .fallback-content') || cardEl;
  cardBody.appendChild(freshEl);
  enqueueDraft('insert-into-card', { line: freshInfo.line, targetLine: target.line }, {
    key: draftKey(freshInfo),
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

/* ---------------- 即时刷新（保存/服务端撤销后使用，不整页刷新） ---------------- */

/**
 * 写盘成功后抓取最新页面 HTML 并替换内容区（main + 右侧大纲），
 * 不整页刷新（脚本/头部/侧栏保留、无白屏），DOM 与源码行号保持同步。
 * 与 SidebarOverride 的自定义 SPA 同一套替换逻辑。
 */
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

/* ---------------- 各编辑弹窗 ---------------- */

async function openSourceEditor(info: BlockInfo): Promise<void> {
  const r = await api(`/__edit__/source?file=${enc(info.file)}&line=${info.line}`);
  if (!r?.ok) {
    toast('读取源码失败：' + (r?.message || '未知错误'));
    return;
  }
  const textarea = modalTextarea(r.text || '');
  const hint = document.createElement('div');
  hint.className = 'dsh-modal-hint';
  hint.textContent = '保存后进入草稿队列，可在面板上继续修改其它块，最后统一"保存并刷新"';
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
    toast('该块内没有公式');
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
  hint.textContent = 'LaTeX 内容（不含 $ 分隔符）。保存后进入草稿队列，可继续修改其它块，最后统一"保存并刷新"';
  const wrap = document.createElement('div');
  wrap.appendChild(hint);
  wrap.appendChild(textarea);
  showModal({
    title: `编辑公式 · ${KIND_NAMES[info.kind] || info.kind} L${info.line}`,
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
  input.placeholder = '如：例题 3.1 / 知识点：极限定义';

  const field = (label: string, el: HTMLElement): HTMLDivElement => {
    const d = document.createElement('div');
    d.className = 'dsh-modal-field';
    const lab = document.createElement('span');
    lab.className = 'dsh-modal-label';
    lab.textContent = label;
    d.append(lab, el);
    return d;
  };
  const body = document.createElement('div');
  body.append(field('卡片类型', sel), field('标题', input));
  showModal({
    title: '包成卡片',
    body,
    onSave: async () => {
      await doWrap(info, sel.value, input.value.trim());
      hideModal();
    },
  });
}

/** 移入卡片：从当前文件卡片列表中选择目标（也可直接用行号定位） */
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
  hint.textContent = `选择目标卡片（共 ${cards.length} 张），该块将插入卡片末尾`;
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

  // 手动输入行号定位
  const manual = document.createElement('div');
  manual.className = 'dsh-modal-field dsh-modal-field-last';
  const lab = document.createElement('span');
  lab.className = 'dsh-modal-label';
  lab.textContent = '行号定位';
  const input = document.createElement('input');
  input.type = 'number';
  input.min = '1';
  input.className = 'dsh-modal-input';
  input.placeholder = '输入卡片行号，如 162';
  const go = btn('移入', async () => {
    const tl = parseInt(input.value, 10);
    if (!Number.isFinite(tl) || tl < 1) {
      toast('请输入有效的卡片行号');
      return;
    }
    const card = cards.find((c) => c.line === tl);
    if (!card) {
      toast(`第 ${tl} 行不是卡片（当前文件卡片行号见上方列表）`);
      return;
    }
    hideModal();
    await doInsertIntoCard(info, card);
  });
  go.className = 'dsh-modal-save';
  manual.append(lab, input, go);
  body.appendChild(manual);

  showModal({ title: '移入卡片', body, onSave: hideModal, saveLabel: '关闭' });
}

/** 移动到指定行号：输入目标行号 + 前/后 */
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

  const field = (label: string, el: HTMLElement): HTMLDivElement => {
    const d = document.createElement('div');
    d.className = 'dsh-modal-field';
    const lab = document.createElement('span');
    lab.className = 'dsh-modal-label';
    lab.textContent = label;
    d.append(lab, el);
    return d;
  };
  const body = document.createElement('div');
  body.append(field('目标行号', input), field('位置', sel));
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
        toast(`未找到第 ${tl} 行的块（仅支持当前文件内定位）`);
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
  body.textContent = `将删除“${KIND_NAMES[info.kind] || info.kind}”（L${info.line}）。删除后可用面板上的撤销按钮恢复。`;
  showModal({
    title: '删除该块？',
    body,
    saveLabel: '删除',
    onSave: async () => {
      await doDelete(info);
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

/* ---------------- 事件 ---------------- */

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
  if (root && root.contains(target)) return; // 编辑器 UI 自身

  const block = blockFrom(target);
  if (!block) return;
  e.preventDefault(); // 编辑模式下接管块点击，阻止默认导航

  // 公式优先：点击 .katex[data-latex] → 直接弹公式编辑
  const katex = target.closest('.katex[data-latex], .katex-display[data-latex]');
  const info = readBlock(block);
  if (!info) return;
  if (katex) {
    clearSelection();
    openFormulaEditor(katex, info);
    return;
  }
  selectBlock(info);
}

/* ---------------- 初始化 ---------------- */

export function initEditor(): void {
  const w = window as any;
  if (w.__dshEditorInstalled) return;
  w.__dshEditorInstalled = true;

  ensureRoot();

  // URL ?edit=1 自动进入
  if (new URL(location.href).searchParams.get('edit') === '1') {
    enabled = true;
    document.body.classList.add('dsh-edit-mode');
    syncCurrentFile();
    updatePanel();
  }

  document.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('mouseover', onMouseOver, true);
  document.addEventListener('mouseout', onMouseOut, true);
  document.addEventListener('click', onClick, true);

  // 滚动/缩放时工具栏跟随选中块
  const reposition = (): void => {
    if (enabled && selected) positionToolbar();
  };
  document.addEventListener('scroll', reposition, true);
  window.addEventListener('resize', reposition);

  // SPA 导航 / 后退前进：页面内容已切换，草稿 DOM 随之失效 → 丢弃草稿并重同步
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
