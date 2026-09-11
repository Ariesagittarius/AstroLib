let _renderMath: any = null;
async function getMathRenderer() {
  if (!_renderMath) {
    const mod = await import('katex/dist/contrib/auto-render.mjs');
    _renderMath = mod.default || mod;
  }
  return _renderMath;
}

let _aiCoreModules: any = null;
async function getAiCoreModules() {
  if (!_aiCoreModules) {
    const [retrieverMod, llmMod, toolsMod] = await Promise.all([
      import('../retriever'),
      import('../llm'),
      import('../tools-client'),
    ]);
    _aiCoreModules = {
      createRetriever: retrieverMod.createRetriever,
      buildMessages: llmMod.buildMessages,
      buildContext: llmMod.buildContext,
      streamChat: llmMod.streamChat,
      buildToolDefs: toolsMod.buildToolDefs,
      runClientTool: toolsMod.runClientTool,
      toolsDesc: toolsMod.toolsDesc,
    };
  }
  return _aiCoreModules;
}

import {
  getAllAiModels,
  getActiveAiModelId,
  getAiProvider,
  getActiveAiProviderId,
  getAiApiKey,
  getAiEndpoint,
  getAiParams,
  getAiAnswerMode,
  getAiSourceOpen,
  getAiPanelDimensions,
  saveAiPanelDimensions,
  getAiAutoCollapsePreceding,
  saveAiAutoCollapsePreceding,
  onAiConfigChange,
} from '../ai-config';
import { parseAiError, renderErrorCardHtml } from '../error-handler';

const HISTORY_MAX = 12;
const THREADS_PREFIX = 'dsh-aiask-threads-';
const ACTIVE_PREFIX = 'dsh-aiask-active-';
const MAX_THREADS = 30;
const MAX_MSGS = 60;

function decorateFootnotes(html: string, decorate = true): string {
  if (!decorate || !html) return html || '';
  const protectedBlocks: string[] = [];

  let safe = html.replace(/(<(?:pre|code|a|p\s+class="md-math")[^>]*>[\s\S]*?<\/(?:pre|code|a|p)>|<[^>]+>)/gi, (m) => {
    protectedBlocks.push(m);
    return `___FN_PROT_${protectedBlocks.length - 1}___`;
  });
  safe = safe.replace(/\[(\d+)\]/g, (_m, n) => `<a class="cite-ref" href="#ai-cite-${n}">[${n}]</a>`);
  return safe.replace(/___FN_PROT_(\d+)___/g, (_m, i) => protectedBlocks[Number(i)] || '');
}

function cleanSingleLine(s: string): string {
  return (s || '').replace(/\s+/g, ' ').trim();
}

function toolSummary(name: string, out: any = {}): string {
  let summary = '执行完成';
  if (name === 'book_retrieve') {
    const n = out.count ?? (out.results || []).length;
    const titles = (out.results || []).slice(0, 2).map((r: any) => r.title).filter(Boolean).join('、');
    summary = `命中 ${n} 条${titles ? `：${titles}` : ''}`;
  } else if (name === 'book_chunk') {
    summary = out.found ? '已取片段全文' : '未找到片段';
  } else if (name === 'book_slice_search') {
    const n = out.count ?? (out.hits || []).length;
    const titles = (out.hits || []).slice(0, 2).map((r: any) => r.title).filter(Boolean).join('、');
    summary = `命中 ${n} 条${titles ? `：${titles}` : ''}`;
  } else if (name === 'book_chapter_outline') {
    if (out.found === false) {
      summary = '未找到匹配章节（可给章号或标题后重试）';
    } else if (out.chapter) {
      const secs = (out.chapter.sections || []).length;
      const cards = (out.chapter.sections || []).reduce((s: number, x: any) => s + (x.cards || []).length, 0);
      const t = out.chapter.title ? `：${out.chapter.title}` : '';
      summary = `章 ${out.chapter.number || ''}${t}（${secs} 小节 / ${cards} 卡片）`;
    } else {
      summary = `列出 ${(out.chapters || []).length} 章（${out.count ?? ''}）`;
    }
  } else if (name === 'book_read_section') {
    if (out.found === false) {
      summary = '未找到起始片段（可用 id/标题/编号）';
    } else {
      summary = `已读 ${out.count} 段${out.truncated ? '（部分截断）' : ''}`;
    }
  } else if (name === 'list_books') {
    summary = `列出 ${(out.books || []).length} 本书`;
  } else if (name === 'book_toc') {
    summary = `目录 ${(out.toc || []).length} 条`;
  }
  return cleanSingleLine(summary);
}

function capSnippet(s: string, n = 110): string {
  const t = (s || '').replace(/\s+/g, ' ').trim();
  if (t.length <= n) return t;
  const cut = t.slice(0, n);
  return `${cut.trimEnd()}…`;
}

function jsonHighlight(escaped: string): string {
  if (!escaped) return '';
  let s = esc(escaped);
  s = s.replace(/&quot;((?:[^&]|&(?!quot;))*?)&quot;/g, (m, _g, offset, whole) => {
    const isKey = /^\s*:/.test(whole.slice(offset + m.length));
    return `<span class="${isKey ? 'json-key' : 'json-str'}">${m}</span>`;
  });
  s = s.replace(/(\b-?\d+(?:\.\d+)?\b)/g, '<span class="json-num">$1</span>');
  s = s.replace(/\b(true|false)\b/g, '<span class="json-bool">$1</span>');
  s = s.replace(/\bnull\b/g, '<span class="json-null">null</span>');
  return s;
}

function capJsonText(v: any, cap = 1200): string {
  let s;
  try { s = JSON.stringify(v, null, 2); } catch { s = String(v); }
  if (s.length <= cap) return s;
  return `${s.slice(0, cap)}\n…`;
}

const SUGGESTIONS = [
  '夹逼定理是什么意思？',
  '什么情况下用麦克劳林展开？',
  '这道例题的解题步骤是什么？',
];

function getConfig(el: Element): any {
  try { return JSON.parse(el.getAttribute('data-config') || '{}'); } catch { return {}; }
}

function esc(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function safeLink(url: string): string {
  let u = (url || '').replace(/["'<>]/g, '').trim();
  if (!u) return '';
  u = u.replace(/&amp;/g, '&');
  if (/^javascript:/i.test(u) || /^data:/i.test(u) || /^vbscript:/i.test(u)) return '';

  u = u.replace(/[),.，。；;!?！？、]+$/, '').trim();
  if (!u) return '';

  const origin = typeof location !== 'undefined' ? location.origin : '';
  const mCol = u.match(/(?:https?:)?\/\/[^\/]*collections\/(.+)$/i) || u.match(/^\/?collections\/(.+)$/i);
  let pathAndHash = '';

  if (mCol) {
    pathAndHash = '/collections/' + mCol[1];
  } else if (/^https?:\/\//i.test(u)) {
    try {
      const parsed = new URL(u);
      if (origin && parsed.origin === origin) {
        pathAndHash = parsed.pathname + parsed.search + parsed.hash;
      } else {
        try { u = decodeURI(u); } catch {}
        return encodeURI(u);
      }
    } catch {
      try { u = decodeURI(u); } catch {}
      return encodeURI(u);
    }
  } else {
    const cleanU = u.replace(/^(\.\/)+/, '').replace(/^\/+/, '');
    const loc = typeof location !== 'undefined' ? location.pathname : '';
    const m = loc.match(/^(\/collections\/[^/]+\/[^/]+\/)/);
    const bookRoot = m ? m[1] : '/';
    pathAndHash = (bookRoot + cleanU).replace(/\/+/g, '/');
  }

  try { pathAndHash = decodeURI(pathAndHash); } catch {}

  const hashIdx = pathAndHash.indexOf('#');
  let pathPart = pathAndHash;
  let hashPart = '';
  if (hashIdx >= 0) {
    pathPart = pathAndHash.slice(0, hashIdx);
    hashPart = pathAndHash.slice(hashIdx + 1);
  }

  const encodedPath = pathPart.split('/').map((seg) => encodeURIComponent(seg)).join('/');
  const encodedHash = hashPart ? '#' + encodeURIComponent(hashPart) : '';

  return (origin || '') + encodedPath + encodedHash;
}

function makeAiBadgeLink(href: string, text: string, target: string, rel: string): string {
  const icon = `<span class="block-icon"><svg class="badge-svg" viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg></span>`;
  const arrow = `<span class="block-arrow"><svg class="badge-svg badge-arrow-svg" viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17l9.2-9.2M17 17V8H8"></path></svg></span>`;
  return `<a href="${href}" class="block-ref-badge interactive-badge ai-link-badge" target="${target}" ${rel}>${icon}<span class="block-text">${text}</span>${arrow}</a>`;
}

function renderInline(s: string, openNew = true): string {
  const target = openNew ? '_blank' : '_self';
  const rel = openNew ? 'rel="noopener"' : '';
  const placeholders: string[] = [];

  s = s.replace(/\[([^\]\n]+)\]\(\s*<?([^)\s>]+)>?(?:\s+["'][^"']*["'])?\s*\)/g, (_m, text, url) => {
    const href = safeLink(url);
    if (!href) return esc(`[${text}](${url})`);
    let innerText = text;
    innerText = innerText.replace(/`([^`]+)`/g, '<code>$1</code>');
    innerText = innerText.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    innerText = innerText.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
    innerText = innerText.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    const tag = makeAiBadgeLink(href, innerText, target, rel);
    placeholders.push(tag);
    return `___LINK_PLACEHOLDER_${placeholders.length - 1}___`;
  });

  s = s.replace(/(^|[^\w"'/=])((?:https?:)?\/\/[^\s<>"']*collections\/[^\s<>"']+|\/?collections\/[^\s<>"']+)/gi, (fullMatch, prefix, rawUrl) => {
    let cleanUrl = rawUrl.replace(/[),.，。；;!?！？、]+$/, '');
    const trailing = rawUrl.slice(cleanUrl.length);
    const href = safeLink(cleanUrl);
    if (!href) return fullMatch;
    const tag = makeAiBadgeLink(href, cleanUrl, target, rel);
    placeholders.push(tag);
    return `${prefix}___LINK_PLACEHOLDER_${placeholders.length - 1}___${trailing}`;
  });

  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  s = s.replace(/___LINK_PLACEHOLDER_(\d+)___/g, (_m, idx) => placeholders[Number(idx)]);

  return s;
}

function mdToHtml(md: string, openNew = true): string {
  const src = esc(md || '');
  const lines = src.split(/\r?\n/);
  const out: string[] = [];
  let i = 0;
  const inline = (t: string) => renderInline(t, openNew);
  const BLOCK_START = /^(#{1,6})\s|^\s*>\s|^\s*[-*+]\s|^\s*\d+[.)]\s|^\s*\$\$\s*$|^\s*\$\$.*|^\s*(?:```+|~~~+)/;

  while (i < lines.length) {
    const line = lines[i];

    const fence = line.match(/^\s*(```+|~~~+)\s*([\w-]*)?\s*$/);
    if (fence) {
      const marker = fence[1][0];
      const buf: string[] = [];
      i++;
      while (i < lines.length && !new RegExp(`^\\s*${marker}{3,}\\s*$`).test(lines[i])) { buf.push(lines[i]); i++; }
      if (i < lines.length) i++;
      out.push(`<pre><code>${buf.join('\n')}</code></pre>`);
      continue;
    }

    if (/^\s*\$\$/.test(line)) {
      const buf = [line.trim()];
      if (/^\s*\$\$.*\$\$\s*$/.test(line) && line.trim().length > 4) {
        out.push(`<p class="md-math">${buf[0]}</p>`);
        i++;
        continue;
      }
      i++;
      while (i < lines.length && !/\$\$\s*$/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      if (i < lines.length) {
        buf.push(lines[i].trim());
        i++;
      } else {
        if (!buf[buf.length - 1].endsWith('$$')) {
          buf[buf.length - 1] += ' $$';
        }
      }
      out.push(`<p class="md-math">${buf.join('\n')}</p>`);
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); i++; continue; }
    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { out.push('<hr/>'); i++; continue; }
    if (/^\s*>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
      out.push(`<blockquote>${buf.map(inline).join('<br/>')}</blockquote>`);
      continue;
    }
    const ulMatch = line.match(/^\s*[-*+]\s+(.*)$/);
    if (ulMatch) {
      const items: string[][] = [[ulMatch[1]]];
      i++;
      while (i < lines.length) {
        const cur = lines[i];
        const nextItemMatch = cur.match(/^\s*[-*+]\s+(.*)$/);
        if (nextItemMatch) {
          items.push([nextItemMatch[1]]);
          i++;
          continue;
        }
        if (/^\s*$/.test(cur)) {
          let k = i + 1;
          while (k < lines.length && /^\s*$/.test(lines[k])) k++;
          if (k < lines.length && /^\s*[-*+]\s+/.test(lines[k])) {
            i = k;
            continue;
          }
          break;
        }
        if (/^(#{1,6})\s|^\s*>\s|^\s*\d+[.)]\s|^\s*(?:```+|~~~+)|^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(cur)) {
          break;
        }
        items[items.length - 1].push(cur.trim());
        i++;
      }
      out.push(`<ul>${items.map((itemLines) => `<li>${itemLines.map(inline).join('<br/>')}</li>`).join('')}</ul>`);
      continue;
    }

    const olMatch = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
    if (olMatch) {
      const startNum = parseInt(olMatch[1], 10) || 1;
      const items: string[][] = [[olMatch[2]]];
      i++;
      while (i < lines.length) {
        const cur = lines[i];
        const nextItemMatch = cur.match(/^\s*\d+[.)]\s+(.*)$/);
        if (nextItemMatch) {
          items.push([nextItemMatch[1]]);
          i++;
          continue;
        }
        if (/^\s*$/.test(cur)) {
          let k = i + 1;
          while (k < lines.length && /^\s*$/.test(lines[k])) k++;
          if (k < lines.length && /^\s*\d+[.)]\s+/.test(lines[k])) {
            i = k;
            continue;
          }
          break;
        }
        if (/^(#{1,6})\s|^\s*>\s|^\s*[-*+]\s|^\s*(?:```+|~~~+)|^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(cur)) {
          break;
        }
        items[items.length - 1].push(cur.trim());
        i++;
      }
      const startAttr = startNum !== 1 ? ` start="${startNum}"` : '';
      out.push(`<ol${startAttr}>${items.map((itemLines) => `<li>${itemLines.map(inline).join('<br/>')}</li>`).join('')}</ol>`);
      continue;
    }
    if (!/^\s*$/.test(line)) {
      const buf = [line];
      i++;
      while (i < lines.length && !/^\s*$/.test(lines[i]) && !BLOCK_START.test(lines[i])) { buf.push(lines[i]); i++; }
      out.push(`<p>${buf.map(inline).join('<br/>')}</p>`);
      continue;
    }
    i++;
  }
  return out.join('\n');
}

export class AIAskElement extends HTMLElement {
  _indexCache = new Map<string, any>();
  _inited = false;
  _abort: AbortController | null = null;
  _busy = false;
  _streaming = false;
  _threads: any[] | null = null;
  _activeThread: any = null;
  _config: any = {};
  _bookTitle = '本书';
  _col = '';
  _book = '';
  _panel!: HTMLElement;
  _fab!: HTMLElement;
  _close!: HTMLElement;
  _settingsBtn!: HTMLElement;
  _collapseBtn!: HTMLElement;
  _isPrecedingCollapsed = true;
  _newBtn!: HTMLElement;
  _submit!: HTMLButtonElement;
  _sendIcon!: HTMLElement;
  _stopIcon!: HTMLElement;
  _input!: HTMLTextAreaElement;
  _status!: HTMLElement;
  _thread!: HTMLElement;
  _empty!: HTMLElement;
  _messages!: HTMLElement;
  _bookEl!: HTMLElement;
  _historyBtn!: HTMLElement;
  _history!: HTMLElement;
  _historyList!: HTMLElement;
  _historyEmpty!: HTMLElement;
  _historyNew!: HTMLElement;
  _historyClose!: HTMLElement;
  _onRoute!: () => void;
  _onDocClick!: (e: MouseEvent) => void;
  _onExternalQuery!: (e: CustomEvent) => void;
  _unsubAi: (() => void) | null = null;
  _katexConfig = {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false },
    ],
    throwOnError: false,
  };

  constructor() {
    super();
  }

  connectedCallback() {
    if (this._inited) return;
    this._inited = true;
    this._initDom();
    this._onRoute = () => this._route();
    this._onDocClick = (e: MouseEvent) => {
      if (this._historyBtn && this._historyBtn.contains(e.target as Node)) return;
      if (this._history && this._history.classList.contains('open') && !this._history.contains(e.target as Node)) {
        this._history.classList.remove('open');
        this._historyBtn && this._historyBtn.classList.remove('ask-settings-open');
      }
    };
    this._onExternalQuery = (e: CustomEvent) => {
      const { prompt, autoSubmit = true } = (e && e.detail) || {};
      if (!prompt) return;
      this._openWithQuestion(prompt, autoSubmit);
    };

    this._unsubAi = onAiConfigChange(() => {
      const dims = getAiPanelDimensions();
      if (this._panel && dims.width && dims.height) {
        this._panel.style.setProperty('--ask-panel-width', `${dims.width}px`);
        this._panel.style.setProperty('--ask-panel-height', `${dims.height}px`);
      }
      this._applySrcOpenToExisting();
      if (getAiAutoCollapsePreceding()) {
        this._collapsePreceding(true);
      }
    });

    window.addEventListener('astro:page-load', this._onRoute);
    window.addEventListener('aiask:query', this._onExternalQuery as EventListener);
    document.addEventListener('click', this._onDocClick);
    this._route();
  }

  disconnectedCallback() {
    window.removeEventListener('astro:page-load', this._onRoute);
    window.removeEventListener('aiask:query', this._onExternalQuery as EventListener);
    document.removeEventListener('click', this._onDocClick);
    if (this._unsubAi) this._unsubAi();
    if (this._abort) this._abort.abort();
  }

  _openWithQuestion(prompt: string, autoSubmit = true) {
    this._openPanel();
    this._startNewThread();
    if (this._input) {
      this._input.value = prompt;
      this._grow();
      if (autoSubmit) {
        setTimeout(() => this._ask(), 80);
      }
    }
  }

  _initDom() {
    const cfg = getConfig(this);
    this._config = cfg;
    this._bookTitle = this.getAttribute('data-book-title') || this.getAttribute('data-book') || '本书';

    this._panel = this.querySelector('.ask-panel') as HTMLElement;
    this._fab = this.querySelector('.ask-fab') as HTMLElement;
    this._close = this.querySelector('.ask-close') as HTMLElement;
    this._settingsBtn = this.querySelector('.ask-settings-btn') as HTMLElement;
    this._collapseBtn = this.querySelector('.ask-collapse-tools-btn') as HTMLElement;
    this._newBtn = this.querySelector('.ask-new-btn') as HTMLElement;
    this._submit = (this.querySelector('.ask-send-btn') || this.querySelector('.ask-send')) as HTMLButtonElement;
    this._sendIcon = this.querySelector('.ask-send-icon') as HTMLElement;
    this._stopIcon = this.querySelector('.ask-stop-icon') as HTMLElement;
    this._input = this.querySelector('.ask-input') as HTMLTextAreaElement;
    this._status = this.querySelector('.ask-status') as HTMLElement;
    this._thread = this.querySelector('.ask-thread') as HTMLElement;
    this._empty = this.querySelector('.ask-empty') as HTMLElement;
    this._messages = this.querySelector('.ask-messages') as HTMLElement;
    this._bookEl = this.querySelector('.ask-book') as HTMLElement;

    const dims = getAiPanelDimensions();
    if (this._panel) {
      if (dims.width) this._panel.style.setProperty('--ask-panel-width', `${dims.width}px`);
      if (dims.height) this._panel.style.setProperty('--ask-panel-height', `${dims.height}px`);
    }

    this._initResizeHandles();

    if (this._messages) {
      this._messages.addEventListener('click', (e: MouseEvent) => {

        const tabBtn = (e.target as HTMLElement).closest('.ask-tool-tab');
        if (tabBtn) {
          e.preventDefault();
          const panel = tabBtn.closest('.ask-tool-panel');
          if (!panel) return;
          const targetTab = tabBtn.getAttribute('data-tab');
          panel.querySelectorAll('.ask-tool-tab').forEach((b) => {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
          });
          tabBtn.classList.add('active');
          tabBtn.setAttribute('aria-selected', 'true');
          const paneResult = panel.querySelector('.ask-tool-pane-result') as HTMLElement;
          const paneArgs = panel.querySelector('.ask-tool-pane-args') as HTMLElement;
          if (targetTab === 'result') {
            if (paneResult) paneResult.style.display = '';
            if (paneArgs) paneArgs.style.display = 'none';
          } else {
            if (paneResult) paneResult.style.display = 'none';
            if (paneArgs) paneArgs.style.display = '';
          }
          return;
        }

        const copyBtn = (e.target as HTMLElement).closest('.ask-tool-copy-btn');
        if (copyBtn) {
          e.preventDefault();
          const panel = copyBtn.closest('.ask-tool-panel');
          if (!panel) return;
          const activePane = panel.querySelector<HTMLElement>('.ask-tool-pane:not([style*="display: none"]):not([style*="display:none"]) pre');
          const text = activePane ? activePane.textContent || '' : '';
          if (text) {
            navigator.clipboard.writeText(text).then(() => {
              const label = copyBtn.querySelector('.ask-tool-copy-text');
              if (label) {
                const orig = label.textContent;
                label.textContent = '已复制';
                setTimeout(() => { label.textContent = orig; }, 1500);
              }
            }).catch(() => {});
          }
          return;
        }

        const retryBtn = (e.target as HTMLElement).closest('.ask-error-retry-btn');
        if (retryBtn) {
          e.preventDefault();
          this._retryLast();
          return;
        }

        const settingsTrigger = (e.target as HTMLElement).closest('.ask-error-settings-btn');
        if (settingsTrigger) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('astrolib:open-settings', { detail: { section: 'ai' } }));
          return;
        }

        const copyErrBtn = (e.target as HTMLElement).closest('.ask-error-copy-btn');
        if (copyErrBtn) {
          e.preventDefault();
          const card = copyErrBtn.closest('.ask-error-card');
          const pre = card?.querySelector('.ask-error-raw-pre code');
          const text = pre ? pre.textContent || '' : '';
          if (text) {
            navigator.clipboard.writeText(text).then(() => {
              const label = copyErrBtn.querySelector('.ask-copy-label');
              if (label) {
                const orig = label.textContent;
                label.textContent = '已复制';
                setTimeout(() => { label.textContent = orig; }, 1500);
              }
            }).catch(() => {});
          }
          return;
        }

        const target = (e.target as HTMLElement).closest('a');
        if (!target || !target.href) return;
        const rawHref = target.getAttribute('href') || '';
        if (!rawHref || rawHref.startsWith('javascript:')) return;

        if (target.target === '_blank') return;

        try {
          const url = new URL(target.href, location.href);
          if (url.origin === location.origin) {
            const currentPath = location.pathname.replace(/\/$/, '');
            const targetPath = url.pathname.replace(/\/$/, '');
            const hash = url.hash ? decodeURIComponent(url.hash.slice(1)) : '';

            if (currentPath === targetPath && hash) {
              e.preventDefault();
              const el = document.getElementById(hash) || document.querySelector(`[id="${CSS.escape(hash)}"]`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              } else {
                location.hash = url.hash;
              }
            }
          }
        } catch {}
      });
    }

    this._historyBtn = this.querySelector('.ask-history-btn') as HTMLElement;
    this._history = this.querySelector('.ask-history') as HTMLElement;
    this._historyList = this.querySelector('.ask-history-list') as HTMLElement;
    this._historyEmpty = this.querySelector('.ask-history-empty') as HTMLElement;
    this._historyNew = this.querySelector('.ask-history-new') as HTMLElement;
    this._historyClose = this.querySelector('.ask-history-close') as HTMLElement;

    if (this._historyBtn) {
      this._historyBtn.addEventListener('click', (e) => { e.stopPropagation(); this._toggleHistory(); });
    }
    if (this._historyNew) {
      this._historyNew.addEventListener('click', () => this._startNewThread());
    }
    if (this._historyClose) {
      this._historyClose.addEventListener('click', () => this._closeHistory());
    }
    if (this._collapseBtn) {
      this._collapseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._togglePrecedingCollapse();
      });
    }
    if (this._newBtn) {
      this._newBtn.addEventListener('click', () => this._startNewThread());
    }

    this._setBookTitle(this._bookTitle);

    if (this._fab) {
      this._fab.addEventListener('click', () => {
        if (this._panel && this._panel.classList.contains('ask-open')) this._closePanel();
        else this._openPanel();
      });
    }
    if (this._close) this._close.addEventListener('click', () => this._closePanel());

    if (this._settingsBtn) {
      this._settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('astrolib:open-settings', { detail: { section: 'ai' } }));
      });
    }

    if (this._input) {
      this._input.addEventListener('input', () => this._grow());
      this._input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (this._streaming) {
            if (this._abort) this._abort.abort();
          } else {
            this._ask();
          }
        }
      });
    }
    if (this._submit) {
      this._submit.addEventListener('click', () => {
        if (this._streaming) {
          if (this._abort) this._abort.abort();
        } else {
          this._ask();
        }
      });
    }

    const sugg = this.querySelector('.ask-suggest');
    if (sugg) {
      sugg.innerHTML = '';
      for (const s of SUGGESTIONS) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'ask-suggest-chip';
        b.textContent = s;
        b.addEventListener('click', () => {
          if (this._input) {
            this._input.value = s;
            this._grow();
            this._ask();
          }
        });
        sugg.appendChild(b);
      }
    }
    this._grow();
  }

  _initResizeHandles() {
    if (!this._panel) return;
    const handles = this._panel.querySelectorAll<HTMLElement>('.ask-resize-handle');
    if (!handles.length) return;

    handles.forEach((handle) => {
      handle.addEventListener('pointerdown', (e: PointerEvent) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();

        const type = handle.dataset.handle ||
          (handle.classList.contains('ask-resize-w') ? 'w' :
           handle.classList.contains('ask-resize-n') ? 'n' : 'nw');

        try {
          handle.setPointerCapture(e.pointerId);
        } catch {}

        const startX = e.clientX;
        const startY = e.clientY;
        const rect = this._panel.getBoundingClientRect();
        const startWidth = rect.width;
        const startHeight = rect.height;

        this._panel.classList.add('ask-resizing');
        if (type === 'w') this._panel.classList.add('is-resizing-w');
        else if (type === 'n') this._panel.classList.add('is-resizing-n');
        else this._panel.classList.add('is-resizing-nw');
        document.body.style.userSelect = 'none';

        const onPointerMove = (moveEv: PointerEvent) => {
          if (type === 'w' || type === 'nw') {
            const deltaX = startX - moveEv.clientX;
            const newW = Math.max(380, Math.min(1000, Math.min(window.innerWidth - 24, Math.round(startWidth + deltaX))));
            this._panel.style.setProperty('--ask-panel-width', `${newW}px`);
          }
          if (type === 'n' || type === 'nw') {
            const deltaY = startY - moveEv.clientY;
            const newH = Math.max(420, Math.min(960, Math.min(window.innerHeight - 80, Math.round(startHeight + deltaY))));
            this._panel.style.setProperty('--ask-panel-height', `${newH}px`);
          }
        };

        const onPointerUp = (upEv: PointerEvent) => {
          try {
            handle.releasePointerCapture(upEv.pointerId);
          } catch {}
          this._panel.classList.remove('ask-resizing', 'is-resizing-w', 'is-resizing-n', 'is-resizing-nw');
          document.body.style.userSelect = '';
          window.removeEventListener('pointermove', onPointerMove);
          window.removeEventListener('pointerup', onPointerUp);
          window.removeEventListener('pointercancel', onPointerUp);

          const curRect = this._panel.getBoundingClientRect();
          const curW = Math.round(curRect.width);
          const curH = Math.round(curRect.height);
          saveAiPanelDimensions({ width: curW, height: curH, preset: 'custom' });
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);
      });
    });
  }

  _setBookTitle(t: string) {
    this._bookTitle = t || '本书';
    if (this._bookEl) this._bookEl.textContent = this._bookTitle;
  }

  _openPanel() {
    this._panel.classList.add('ask-open');
    requestAnimationFrame(() => {
      this._input && this._input.focus({ preventScroll: true });
    });
  }
  _closePanel() {
    this._panel.classList.remove('ask-open');
    this._history && this._history.classList.remove('open');
    this._historyBtn && this._historyBtn.classList.remove('ask-settings-open');
  }
  _toggleHistory() {
    const open = this._history.classList.toggle('open');
    this._historyBtn && this._historyBtn.classList.toggle('ask-settings-open', open);
    if (open) {
      this._renderHistoryList();
    }
  }
  _closeHistory() {
    this._history && this._history.classList.remove('open');
    this._historyBtn && this._historyBtn.classList.remove('ask-settings-open');
  }

  _route() {
    const m = location.pathname.match(/^\/collections\/([^/]+)\/([^/]+)\//);
    if (!m) {
      this.hidden = true;
      this._closePanel();
      return;
    }
    this.hidden = false;
    const changed = this._col !== m[1] || this._book !== m[2];
    this._col = m[1];
    this._book = m[2];
    if (changed) this._resetThread();
    const cached = this._indexCache.get(this._bookKey());
    if (cached && cached.meta && cached.meta.title) this._setBookTitle(cached.meta.title);
    else this._setBookTitle(this.getAttribute('data-book-title') || m[2]);
  }

  _resetThread() {
    if (this._abort) this._abort.abort();
    this._abort = null;
    this._busy = false;
    this._streaming = false;
    this._activeThread = null;
    this._threads = null;
    if (this._messages) this._messages.innerHTML = '';
    if (this._empty) this._empty.style.display = '';
    if (this._messages) this._messages.style.display = 'none';
    if (this._input) this._input.value = '';
    if (this._status) this._status.textContent = '';
    this._grow();
    this._updateSendState();
    this._restoreBookThread();
  }

  _bookKey() { return `${this._col}-${this._book}`; }

  _threadsKey() { return THREADS_PREFIX + this._bookKey(); }
  _activeKey() { return ACTIVE_PREFIX + this._bookKey(); }

  _loadThreads(): any[] {
    try {
      const a = JSON.parse(localStorage.getItem(this._threadsKey()) || '[]');
      return Array.isArray(a) ? a : [];
    } catch { return []; }
  }
  _saveThreads(threads: any[]) {
    try { localStorage.setItem(this._threadsKey(), JSON.stringify(threads.slice(-MAX_THREADS))); } catch {}
  }
  _saveActiveThreadId(id: string) {
    try { localStorage.setItem(this._activeKey(), id); } catch {}
  }
  _newThread() {
    return { id: `th-${Date.now()}`, title: '新会话', createdAt: Date.now(), updatedAt: Date.now(), messages: [] };
  }

  _restoreBookThread() {
    this._threads = this._loadThreads();
    let activeId = '';
    try { activeId = localStorage.getItem(this._activeKey()) || ''; } catch {}
    const t = this._threads.find((x) => x.id === activeId);
    if (t && t.messages && t.messages.length) {
      this._activeThread = t;
      this._renderThread(t);
    } else {
      this._activeThread = null;
      this._renderThread(null);
    }
  }

  _ensureActiveThread() {
    if (this._activeThread) return this._activeThread;
    const t = this._newThread();
    if (!this._threads) this._threads = this._loadThreads();
    this._threads.push(t);
    this._activeThread = t;
    this._saveActiveThread();
    return t;
  }

  _renderThread(t: any) {
    const msgs = (t && t.messages) || [];
    if (this._messages) this._messages.innerHTML = '';
    if (!msgs.length) {
      if (this._messages) this._messages.style.display = 'none';
      if (this._empty) this._empty.style.display = '';
      return;
    }
    this._hideEmpty();
    for (const m of msgs) {
      const body: any = { text: m.text };
      this._addMessage(m.role, body);
      if (m.role === 'assistant') {
        const segs = (m.segments && m.segments.length)
          ? m.segments
          : [
              ...(m.text ? [{ kind: 'reply', text: m.text }] : []),
              ...(m.tools || []).map((t: any) => ({ kind: 'tool', name: t.name, args: t.args, summary: t.summary, resultText: t.resultText })),
            ];
        const decorate = !!(m.sources && m.sources.length);
        for (const seg of segs) {
          if (seg.kind === 'reply') {
            if (!seg.text || !seg.text.trim()) continue;
            this._appendMdBlock(body.blocksEl, seg.text, decorate);
          } else if (seg.kind === 'tool') {
            body.blocksEl.insertAdjacentHTML('beforeend', this._toolBlocksHtml([seg], false));
          } else if (seg.kind === 'error') {
            body.blocksEl.insertAdjacentHTML('beforeend', seg.html || (seg.errorInfo ? renderErrorCardHtml(seg.errorInfo) : ''));
          }
        }
        if (m.sources && m.sources.length) this._renderSources(body.sourcesEl, m.sources.map((s: any) => ({ chunk: s })));
      }
    }
    if (getAiAutoCollapsePreceding()) {
      this._collapsePreceding(true);
    } else {
      this._isPrecedingCollapsed = false;
      this._updateCollapseBtnState();
    }
    this._scrollThread();
  }

  _retryLast() {
    if (this._streaming || this._busy) return;
    const t = this._activeThread;
    if (!t || !Array.isArray(t.messages) || !t.messages.length) return;

    let userIndex = -1;
    for (let i = t.messages.length - 1; i >= 0; i--) {
      if (t.messages[i].role === 'user') {
        userIndex = i;
        break;
      }
    }
    if (userIndex < 0) return;

    const lastUserMsg = t.messages[userIndex].text;
    if (!lastUserMsg) return;

    t.messages = t.messages.slice(0, userIndex);
    this._saveActiveThread();
    this._renderThread(t);

    if (this._input) {
      this._input.value = lastUserMsg;
      this._grow();
    }
    this._ask();
  }

  _appendToThread(q: string, text: string, sources: any[], tools: any[], segments: any[]) {
    const t = this._ensureActiveThread();
    t.messages.push({ role: 'user', text: q });
    if (text) t.messages.push({ role: 'assistant', text, sources, tools, segments: segments || undefined });
    if (!t.title || t.title === '新会话') t.title = (q || '').slice(0, 20) || '新会话';
    t.updatedAt = Date.now();
    this._saveActiveThread();
  }

  _saveActiveThread() {
    const t = this._activeThread;
    if (!t) return;
    if (t.messages.length > MAX_MSGS) t.messages = t.messages.slice(-MAX_MSGS);
    if (!this._threads) this._threads = this._loadThreads();
    const i = this._threads.findIndex((x) => x.id === t.id);
    if (i >= 0) this._threads[i] = t; else this._threads.push(t);
    this._threads = this._threads.slice(-MAX_THREADS);
    this._saveThreads(this._threads);
    this._saveActiveThreadId(t.id);
  }

  _historyFromThread(t: any): any[] {
    if (!t || !Array.isArray(t.messages)) return [];
    const out: any[] = [];
    for (const m of t.messages) {
      if (m.role === 'user' && m.text) out.push({ role: 'user', content: m.text });
      else if (m.role === 'assistant' && m.text) out.push({ role: 'assistant', content: m.text });
    }
    return out.slice(-HISTORY_MAX);
  }

  _fallbackSummary(toolLog: any[]): string {
    if (!toolLog || !toolLog.length) return '';
    const lines = [
      '我已检索了本书相关内容，以下是找到的关键资料（更多细节请见下方来源卡片，或点击卡片跳转原文）：',
      '',
    ];
    for (const t of toolLog) {
      const summary = t.summary || '';
      const que = (t.args && t.args.question) ? `（${String(t.args.question).slice(0, 60)}）` : '';
      if (summary) lines.push(`· ${summary}${que}`);
    }
    lines.push('', '若仍不满意，你可以换一种问法，或直接点击上方/下方的来源卡片查看对应原文。');
    return lines.join('\n');
  }

  _relTime(ts: number): string {
    if (!ts) return '';
    const d = Date.now() - ts;
    const m = Math.floor(d / 60000);
    if (m < 1) return '刚刚';
    if (m < 60) return `${m} 分钟前`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} 小时前`;
    const day = Math.floor(h / 24);
    if (day < 7) return `${day} 天前`;
    const dt = new Date(ts);
    return `${dt.getMonth() + 1}/${dt.getDate()}`;
  }

  _renderHistoryList() {
    if (!this._historyList) return;
    const threads = (this._threads || this._loadThreads()).slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    this._historyList.innerHTML = '';
    if (this._historyEmpty) this._historyEmpty.style.display = threads.length ? 'none' : '';
    for (const t of threads) {
      const item = document.createElement('md-list-item');
      item.className = 'ask-history-item';
      if (this._activeThread && this._activeThread.id === t.id) {
        item.classList.add('ask-history-item-active');
      }
      item.dataset.id = t.id;
      item.type = 'button';

      const icon = document.createElement('svg');
      icon.slot = 'start';
      icon.setAttribute('viewBox', '0 0 24 24');
      icon.setAttribute('width', '20');
      icon.setAttribute('height', '20');
      icon.setAttribute('fill', 'none');
      icon.setAttribute('stroke', 'currentColor');
      icon.setAttribute('stroke-width', '2');
      icon.setAttribute('stroke-linecap', 'round');
      icon.setAttribute('stroke-linejoin', 'round');
      icon.innerHTML = '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>';

      const headline = document.createElement('div');
      headline.slot = 'headline';
      headline.className = 'ask-history-headline';
      headline.textContent = (t.title || '新会话').slice(0, 32);

      const supporting = document.createElement('div');
      supporting.slot = 'supporting-text';
      supporting.className = 'ask-history-meta';
      supporting.textContent = `${this._relTime(t.updatedAt)} · ${(t.messages || []).length} 条对话`;

      const delBtn = document.createElement('button');
      delBtn.slot = 'end';
      delBtn.type = 'button';
      delBtn.className = 'ask-history-del-btn';
      delBtn.title = '删除会话';
      delBtn.setAttribute('aria-label', '删除会话');
      delBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>`;

      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._deleteThread(t.id);
      });

      item.appendChild(icon);
      item.appendChild(headline);
      item.appendChild(supporting);
      item.appendChild(delBtn);

      item.addEventListener('click', (e) => {
        if (delBtn.contains(e.target as Node)) return;
        this._loadThreadById(t.id);
      });

      this._historyList.appendChild(item);
    }
  }

  _loadThreadById(id: string) {
    const t = (this._threads || this._loadThreads()).find((x) => x.id === id);
    if (!t) return;
    if (this._abort) this._abort.abort();
    this._busy = false;
    this._streaming = false;
    this._activeThread = t;
    this._saveActiveThreadId(id);
    this._renderThread(t);
    this._closeHistory();
    this._updateSendState();
  }

  _deleteThread(id: string) {
    if (this._abort) this._abort.abort();
    this._busy = false;
    this._streaming = false;
    if (!this._threads) this._threads = this._loadThreads();
    this._threads = this._threads.filter((x) => x.id !== id);
    this._saveThreads(this._threads);
    if (this._activeThread && this._activeThread.id === id) {
      this._activeThread = null;
      try { localStorage.removeItem(this._activeKey()); } catch {}
      this._renderThread(null);
    }
    this._renderHistoryList();
    this._updateSendState();
  }

  _startNewThread() {
    if (this._abort) this._abort.abort();
    this._busy = false;
    this._streaming = false;
    this._activeThread = this._newThread();
    if (!this._threads) this._threads = this._loadThreads();
    this._threads.push(this._activeThread);
    this._threads = this._threads.slice(-MAX_THREADS);
    this._saveThreads(this._threads);
    this._saveActiveThreadId(this._activeThread.id);
    this._renderThread(this._activeThread);
    if (this._input) { this._input.value = ''; this._grow(); }
    this._closeHistory();
    this._updateSendState();
  }

  async _getIndex() {
    const key = this._bookKey();
    if (this._indexCache.has(key)) return this._indexCache.get(key);
    const url = `/ai-index/${key}.json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`索引加载失败（${res.status}）—— 请先构建 ${url}`);
    const idx = await res.json();
    this._indexCache.set(key, idx);
    if (idx.meta && idx.meta.title) this._setBookTitle(idx.meta.title);
    return idx;
  }

  _allModels(): any[] {
    return getAllAiModels();
  }

  _selectedModel(): any {
    const id = getActiveAiModelId();
    const endpoint = getAiEndpoint(id);
    const all = getAllAiModels();
    const found = all.find((m) => m.id === id);
    const provider = getAiProvider();
    return {
      id,
      model: id,
      label: found ? found.label : id,
      endpoint,
      provider: found ? found.provider : provider.id,
      providerLabel: provider.label,
    };
  }

  _currentKey(): string {
    return getAiApiKey(getActiveAiModelId());
  }

  _params(): any {
    return getAiParams();
  }

  _answerMode(): string {
    return getAiAnswerMode();
  }

  _hideEmpty() {
    if (this._empty) this._empty.style.display = 'none';
    if (this._messages) this._messages.style.display = '';
  }

  _addMessage(role: string, body: any): HTMLElement {
    const msg = document.createElement('div');
    msg.className = 'ask-msg ' + (role === 'user' ? 'ask-msg-user' : 'ask-msg-ai');
    if (role === 'user') {
      const t = document.createElement('div');
      t.className = 'ask-msg-text ai-md';
      t.innerHTML = mdToHtml(body.text, this._sourceOpenNew());
      msg.appendChild(t);
      this._typeMath(t);
    } else {
      const blocks = document.createElement('div');
      blocks.className = 'ask-blocks';
      const sources = document.createElement('div');
      sources.className = 'ask-sources';
      sources.style.display = 'none';
      msg.appendChild(blocks);
      msg.appendChild(sources);
      body.blocksEl = blocks;
      body.sourcesEl = sources;
    }
    if (this._messages) this._messages.appendChild(msg);
    this._scrollThread();
    return msg;
  }

  _appendMdBlock(blocksEl: HTMLElement, text: string, decorate = true): HTMLElement | null {
    if (!blocksEl) return null;
    const d = document.createElement('div');
    d.className = 'ai-md ask-ai-reply';
    d.innerHTML = decorateFootnotes(mdToHtml(text, this._sourceOpenNew()), decorate);
    blocksEl.appendChild(d);
    this._typeMath(d);
    return d;
  }

  _scrollThread() {
    if (this._thread) this._thread.scrollTop = this._thread.scrollHeight;
  }

  _grow() {
    const t = this._input;
    if (!t) return;
    t.style.height = 'auto';
    const h = Math.min(t.scrollHeight, 128);
    t.style.height = `${h}px`;
    t.style.overflowY = t.scrollHeight > 128 ? 'auto' : 'hidden';
    this._updateSendState();
  }

  _updateSendState() {
    if (!this._submit) return;
    if (this._streaming) {
      this._submit.disabled = false;
      if (this._sendIcon) this._sendIcon.hidden = true;
      if (this._stopIcon) this._stopIcon.hidden = false;
      this._submit.title = '停止生成';
      this._submit.setAttribute('aria-label', '停止生成');
      return;
    }

    if (this._sendIcon) this._sendIcon.hidden = false;
    if (this._stopIcon) this._stopIcon.hidden = true;
    this._submit.title = '发送 (Enter)';
    this._submit.setAttribute('aria-label', '发送');

    const val = this._input ? this._input.value.trim() : '';
    this._submit.disabled = this._busy || !val;
  }

  _renderSources(el: HTMLElement, hits: any[]) {
    el.innerHTML = '';
    if (!hits.length) { el.style.display = 'none'; return; }
    el.style.display = '';
    const openNew = this._sourceOpenNew();
    const label = document.createElement('div');
    label.className = 'ask-sources-label';
    label.textContent = '来源（点击可跳转原文）';
    el.appendChild(label);
    hits.forEach((h: any, i: number) => {
      const a = document.createElement('a');
      a.className = 'ask-source';
      a.id = `ai-cite-${i + 1}`;
      a.href = safeLink(h.chunk.url);
      a.target = openNew ? '_blank' : '_self';
      a.rel = openNew ? 'noopener' : '';
      const head = document.createElement('div');
      head.className = 'ask-source-head';
      const type = document.createElement('span');
      type.className = 'ask-source-type';
      type.textContent = `${i + 1}·${h.chunk.type || '正文'}`;
      const t = document.createElement('span');
      t.className = 'ask-source-title';
      t.textContent = h.chunk.title || `${h.chunk.type || '正文'}（第 ${i + 1} 条）`;
      head.appendChild(type);
      head.appendChild(t);
      a.appendChild(head);
      if (h.chunk.text) {
        const snip = document.createElement('div');
        snip.className = 'ask-source-snip';
        snip.textContent = capSnippet(h.chunk.text);
        a.appendChild(snip);
      }
      el.appendChild(a);
    });
  }

  _sourceOpenNew(): boolean {
    return getAiSourceOpen() !== 'same';
  }

  _applySrcOpenToExisting() {
    const openNew = this._sourceOpenNew();
    const links = this.querySelectorAll('.ask-messages a');
    for (const a of Array.from(links)) {
      (a as HTMLAnchorElement).target = openNew ? '_blank' : '_self';
      if (openNew) {
        (a as HTMLAnchorElement).setAttribute('rel', 'noopener');
      } else {
        (a as HTMLAnchorElement).removeAttribute('rel');
      }
    }
  }

  _typeMath(el: HTMLElement) {
    if (!el) return;
    getMathRenderer().then((renderer) => {
      try { renderer(el, this._katexConfig); }
      catch (e) {}
    }).catch(() => {});
  }

  _jsonHtml(v: any, cap = 1400): string {
    let s;
    if (typeof v === 'string') {
      s = v;
    } else {
      try { s = JSON.stringify(v, null, 2); } catch { s = String(v); }
    }
    if (s.length > cap) s = `${s.slice(0, cap)}\n…`;
    return jsonHighlight(s);
  }

  _collapseTools(container: HTMLElement) {
    if (!container) return;
    const tools = container.querySelectorAll<HTMLDetailsElement>('details.ask-tool[open]');
    for (const t of Array.from(tools)) {
      t.removeAttribute('open');
    }
  }

  _collapsePreceding(forceCollapse?: boolean) {
    if (!this._messages) return;
    const aiMsgs = Array.from(this._messages.querySelectorAll<HTMLElement>('.ask-msg-ai'));
    if (aiMsgs.length === 0) return;

    const shouldCollapse = forceCollapse !== undefined ? forceCollapse : !this._isPrecedingCollapsed;
    this._isPrecedingCollapsed = shouldCollapse;

    if (aiMsgs.length === 1) {
      if (forceCollapse === undefined) {
        const tools = aiMsgs[0].querySelectorAll<HTMLDetailsElement>('details.ask-tool, details.ask-think');
        for (const t of Array.from(tools)) {
          if (shouldCollapse) t.removeAttribute('open');
          else t.setAttribute('open', '');
        }
      }
    } else {
      const preceding = aiMsgs.slice(0, -1);
      for (const msg of preceding) {
        const tools = msg.querySelectorAll<HTMLDetailsElement>('details.ask-tool, details.ask-think');
        for (const t of Array.from(tools)) {
          if (shouldCollapse) {
            t.removeAttribute('open');
          } else {
            t.setAttribute('open', '');
          }
        }
      }
      if (!shouldCollapse && forceCollapse === undefined) {
        const lastTools = aiMsgs[aiMsgs.length - 1].querySelectorAll<HTMLDetailsElement>('details.ask-tool, details.ask-think');
        for (const t of Array.from(lastTools)) {
          t.setAttribute('open', '');
        }
      }
    }

    this._updateCollapseBtnState();
  }

  _togglePrecedingCollapse() {
    this._collapsePreceding(!this._isPrecedingCollapsed);
  }

  _updateCollapseBtnState() {
    if (!this._collapseBtn) return;
    const iconLess = this._collapseBtn.querySelector<HTMLElement>('.icon-unfold-less');
    const iconMore = this._collapseBtn.querySelector<HTMLElement>('.icon-unfold-more');
    if (this._isPrecedingCollapsed) {
      if (iconLess) iconLess.style.display = 'none';
      if (iconMore) iconMore.style.display = '';
      this._collapseBtn.title = '展开所有过程';
      this._collapseBtn.setAttribute('aria-label', '展开所有过程');
    } else {
      if (iconLess) iconLess.style.display = '';
      if (iconMore) iconMore.style.display = 'none';
      this._collapseBtn.title = '折叠前序过程';
      this._collapseBtn.setAttribute('aria-label', '折叠前序过程');
    }
  }

  _toolBlocksHtml(toolLog: any[], isOpen = false): string {
    if (!toolLog || !toolLog.length) return '';
    const items = toolLog.map((t: any) => {
      const raw = t.resultRaw !== undefined ? t.resultRaw : t.resultText;
      const cleanSummary = (t.summary || '').replace(/\s+/g, ' ').trim();
      let countBadge = '';
      if (raw && Array.isArray(raw.results)) countBadge = ` (${raw.results.length})`;
      else if (raw && Array.isArray(raw.hits)) countBadge = ` (${raw.hits.length})`;
      else if (Array.isArray(raw)) countBadge = ` (${raw.length})`;

      return `
        <details class="ask-tool" ${isOpen ? 'open' : ''}>
          <summary class="ask-tool-summary" title="${esc(cleanSummary)}">
            <svg class="ask-tool-chevron" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
            <span class="ask-tool-badge">Tool</span>
            <span class="ask-tool-name">${esc(t.name)}</span>
            <span class="ask-tool-sum">${esc(cleanSummary)}</span>
          </summary>
          <div class="ask-tool-panel">
            <div class="ask-tool-panel-header">
              <div class="ask-tool-tabs" role="tablist" aria-label="工具数据切换">
                <button type="button" class="ask-tool-tab active" data-tab="result" role="tab" aria-selected="true">
                  <span class="ask-tool-tab-label">返回结果</span><span class="ask-tool-tab-count">${countBadge}</span>
                </button>
                <button type="button" class="ask-tool-tab" data-tab="args" role="tab" aria-selected="false">
                  <span class="ask-tool-tab-label">调用参数</span>
                </button>
              </div>
              <button type="button" class="ask-tool-copy-btn" title="复制当前数据" aria-label="复制当前数据">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span class="ask-tool-copy-text">复制</span>
              </button>
            </div>
            <div class="ask-tool-pane ask-tool-pane-result" role="tabpanel">
              <pre>${this._jsonHtml(raw)}</pre>
            </div>
            <div class="ask-tool-pane ask-tool-pane-args" role="tabpanel" style="display:none;">
              <pre>${this._jsonHtml(t.args)}</pre>
            </div>
          </div>
        </details>`;
    }).join('');
    return `<div class="ask-tool-block">${items}</div>`;
  }

  async _ask() {
    if (!this._input) return;
    const q = this._input.value.trim();
    if (!q || this._busy) return;

    this._hideEmpty();
    this._addMessage('user', { text: q });
    this._input.value = '';
    this._grow();
    this._busy = true;
    this._updateSendState();
    try { (window as any).__astrolibTrack?.('ai_ask', { book: this._bookKey() }); } catch {}

    const status = this._status;
    const mode = this._answerMode();
    const discussion = mode === 'discussion';

    const aiMsg = this._addMessage('ai', {});
    const blocksEl = aiMsg.querySelector('.ask-blocks') as HTMLElement;
    const sourcesEl = aiMsg.querySelector('.ask-sources') as HTMLElement;
    if (discussion) sourcesEl.style.display = 'none';
    this._scrollThread();

    status.textContent = discussion ? '深度讨论中：AI 正在基于理解作答，需要时按需检索本书…' : '正在检索本书知识库…';

    const params = this._params();
    try {
      let idx = null;
      let hits: any[] = [];
      const ai = await getAiCoreModules();
      if (!discussion) {
        idx = await this._getIndex();
        const retriever = ai.createRetriever(idx.chunks);
        hits = retriever.search(q, { topK: params.topK });
        if (!hits.length) {
          this._appendMdBlock(blocksEl, '没有在本书中找到相关内容。');
          status.textContent = '没有在本书中找到相关内容。';
          this._busy = false;
          this._updateSendState();
          this._scrollThread();
          return;
        }
        status.textContent = `命中 ${hits.length} 个片段，正在生成回答…`;
      } else {
        status.textContent = '深度讨论中：AI 正在基于理解作答，需要时按需检索本书…';
      }

      const apiKey = this._currentKey();
      const modelDef = this._selectedModel();
      if (apiKey && modelDef && modelDef.endpoint) {
        const res = await this._generateAnswer(blocksEl, { mode, idx, hits, question: q });
        const text = res.text || '';
        const sources = discussion ? [] : hits.map((h: any) => ({
          type: h.chunk.type, title: h.chunk.title, url: h.chunk.url, text: h.chunk.text,
        }));
        const tools = (res.tools || []).map((t: any) => ({
          name: t.name, args: t.args, summary: t.summary, resultText: t.resultText,
        }));
        if (!discussion && hits.length) this._renderSources(sourcesEl, hits);
        this._appendToThread(q, text, sources, tools, res.segments);
        status.textContent = '完成。';
      } else {
        this._appendMdBlock(blocksEl, discussion
          ? '未配置 API Key（或模型/端点缺失），无法生成深度讨论回答。可在设置中配置 Key、选择模型后继续。'
          : '未配置 API Key（或模型/端点缺失），已仅展示检索来源（点击可跳转原文）。可在设置中配置 Key、选择模型后生成答案。', false);
        if (!discussion && hits.length) this._renderSources(sourcesEl, hits);
        status.textContent = '';
      }
    } catch (e: any) {
      const provider = getAiProvider();
      const modelDef = this._selectedModel();
      const errInfo = parseAiError(e, {
        providerId: provider.id,
        providerLabel: provider.label,
        modelId: modelDef.model || modelDef.id,
        modelLabel: modelDef.label || modelDef.id,
        endpoint: modelDef.endpoint,
      });
      status.textContent = `出错了：${errInfo.title}`;
      const d = document.createElement('div');
      d.className = 'ask-error-container';
      d.innerHTML = renderErrorCardHtml(errInfo);
      blocksEl.appendChild(d);
      console.error('[ai-ask]', e);
    } finally {
      this._busy = false;
      this._updateSendState();
      this._scrollThread();
    }
  }

  async _generateAnswer(blocksEl: HTMLElement, opts: any): Promise<any> {
    if (this._abort) this._abort.abort();
    this._abort = new AbortController();
    const cfg = getConfig(this);
    const params = this._params();
    const apiKey = this._currentKey();
    const modelDef = this._selectedModel();
    const { mode = 'retrieve', idx = null, hits = [], question } = opts || {};
    const discussion = mode === 'discussion';
    const ai = await getAiCoreModules();
    const toolDefs = ai.buildToolDefs();
    const context = discussion ? '' : ai.buildContext(hits.map((h: any) => h.chunk), params.maxContextChars);
    const messages = ai.buildMessages({
      question,
      context,
      bookTitle: (idx && idx.meta && idx.meta.title) || this._bookTitle,
      history: this._historyFromThread(this._activeThread),
      toolsDesc: ai.toolsDesc(),
      discussion,
    });
    const toolCtx = { index: discussion ? null : idx, bookList: (cfg.bookList || []), col: this._col, book: this._book };
    const endpoint = modelDef.endpoint;
    const model = modelDef.model;

    let full = '';
    let lastText = '';
    const toolLog: any[] = [];
    const segments: any[] = [];
    const replyEls: HTMLElement[] = [];

    let curText = '';
    let curTextEl: HTMLElement | null = null;
    let scheduled = false;

    const addReplyEl = () => {
      const d = document.createElement('div');
      d.className = 'ai-md ask-ai-reply';
      blocksEl.appendChild(d);
      replyEls.push(d);
      return d;
    };
    const renderCur = () => {
      if (!curTextEl) return;
      curTextEl.innerHTML = decorateFootnotes(mdToHtml(curText, this._sourceOpenNew()), !discussion)
        + (this._streaming ? '<span class="ask-caret"></span>' : '');
      this._typeMath(curTextEl);
      this._scrollThread();
      scheduled = false;
    };
    const scheduleRender = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(renderCur); } };
    const flushReply = () => {
      if (curText && curText.trim()) {
        segments.push({ kind: 'reply', text: curText });
        if (curTextEl) { const c = curTextEl.querySelector('.ask-caret'); if (c) c.remove(); }
      }
      curText = '';
      curTextEl = null;
    };

    const maxTurns = 6;
    let usedTools = false;
    try {
      this._streaming = true;
      this._updateSendState();
      for (let turn = 0; turn < maxTurns; turn++) {
        curText = '';
        curTextEl = null;
        const res = await ai.streamChat({
          endpoint, apiKey, model, messages,
          tools: toolDefs, toolChoice: 'auto',
          signal: this._abort.signal,
          onDelta: (d: string) => {
            if (usedTools) {
              this._collapseTools(blocksEl);
            }
            curText += d;
            full += d;
            if (!curTextEl) curTextEl = addReplyEl();
            scheduleRender();
          },
        });
        lastText = res.text || '';
        if (res.toolCalls && res.toolCalls.length) {
          usedTools = true;
          messages.push({
            role: 'assistant',
            content: res.text || null,
            tool_calls: res.toolCalls.map((tc: any) => ({
              id: tc.id, type: 'function',
              function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
            })),
          });
          flushReply();
          for (const tc of res.toolCalls) {
            let out: any, summary: string;
            try {
              if (!toolCtx.index && tc.name !== 'list_books') toolCtx.index = await this._getIndex();
              out = await ai.runClientTool(tc.name, tc.arguments, toolCtx);
              summary = toolSummary(tc.name, out);
            } catch (e: any) {
              out = { error: e.message || String(e) };
              summary = '执行失败';
            }
            const t = { name: tc.name, args: tc.arguments || {}, summary, resultRaw: out, resultText: capJsonText(out) };
            toolLog.push(t);
            segments.push({ kind: 'tool', name: t.name, args: t.args, summary: t.summary, resultText: t.resultText });
            blocksEl.insertAdjacentHTML('beforeend', this._toolBlocksHtml([t], true));
            messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(out) });
          }
          continue;
        }
        break;
      }
      flushReply();
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        const provider = getAiProvider();
        const errInfo = parseAiError(e, {
          providerId: provider.id,
          providerLabel: provider.label,
          modelId: modelDef.model || modelDef.id,
          modelLabel: modelDef.label || modelDef.id,
          endpoint,
        });

        const errorCardHtml = renderErrorCardHtml(errInfo);
        if (curText && curText.trim()) segments.push({ kind: 'reply', text: curText });
        segments.push({ kind: 'error', errorInfo: errInfo, html: errorCardHtml });
        full += (full && full.trim() ? '\n\n' : '') + `[${errInfo.title}] ${errInfo.message}`;

        const d = addReplyEl();
        d.innerHTML = errorCardHtml;
      }
    } finally {
      this._collapseTools(blocksEl);
      if (getAiAutoCollapsePreceding()) {
        this._collapsePreceding(true);
      }
      this._streaming = false;
      this._updateSendState();
      for (const el of replyEls) { const c = el.querySelector('.ask-caret'); if (c) c.remove(); }
      if (usedTools && toolLog.length && !lastText.trim()) {
        const fb = this._fallbackSummary(toolLog);
        if (fb) {
          full = (full && full.trim()) ? `${full.trim()}\n\n${fb}` : fb;
          segments.push({ kind: 'reply', text: fb });
          const d = addReplyEl();
          d.innerHTML = decorateFootnotes(mdToHtml(fb, this._sourceOpenNew()), !discussion);
          this._typeMath(d);
        }
      }
      this._scrollThread();
      this._abort = null;
    }
    return { text: full, tools: toolLog, segments };
  }
}

if (!customElements.get('ai-ask')) {
  customElements.define('ai-ask', AIAskElement);
}
