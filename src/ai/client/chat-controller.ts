import { createRetriever } from '../retriever';
import { buildMessages, buildContext, streamChat } from '../llm';
import { buildToolDefs, runClientTool, toolsDesc } from '../tools-client';
import renderMathInElement from 'katex/dist/contrib/auto-render.mjs';
import {
  getAllAiModels,
  getActiveAiModelId,
  saveAiActiveModel,
  getAiApiKey,
  saveAiApiKey,
  getAiEndpoint,
  saveAiEndpoint,
  addCustomAiModel,
  getAiParams,
  saveAiParams,
  onAiConfigChange,
} from '../ai-config';

const SRC_OPEN_STORE = 'dsh-aiask-src-open';
const MODE_STORE = 'dsh-aiask-mode';
const HISTORY_MAX = 12;
const THREADS_PREFIX = 'dsh-aiask-threads-';
const ACTIVE_PREFIX = 'dsh-aiask-active-';
const MAX_THREADS = 30;
const MAX_MSGS = 60;

function lsGet(k: string, d: string): string { try { return localStorage.getItem(k) ?? d; } catch { return d; } }
function lsGetJson(k: string, d: any): any { try { return JSON.parse(localStorage.getItem(k) || '') ?? d; } catch { return d; } }
function lsSet(k: string, v: string): void { try { localStorage.setItem(k, v); } catch {} }

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

function toolSummary(name: string, out: any = {}): string {
  if (name === 'book_retrieve') {
    const n = out.count ?? (out.results || []).length;
    const titles = (out.results || []).slice(0, 2).map((r: any) => r.title).filter(Boolean).join('、');
    return `命中 ${n} 条${titles ? `：${titles}` : ''}`;
  }
  if (name === 'book_chunk') return out.found ? '已取片段全文' : '未找到片段';
  if (name === 'book_slice_search') {
    const n = out.count ?? (out.hits || []).length;
    const titles = (out.hits || []).slice(0, 2).map((r: any) => r.title).filter(Boolean).join('、');
    return `命中 ${n} 条${titles ? `：${titles}` : ''}`;
  }
  if (name === 'book_chapter_outline') {
    if (out.found === false) return '未找到匹配章节（可给章号或标题后重试）';
    if (out.chapter) {
      const secs = (out.chapter.sections || []).length;
      const cards = (out.chapter.sections || []).reduce((s: number, x: any) => s + (x.cards || []).length, 0);
      const t = out.chapter.title ? `：${out.chapter.title}` : '';
      return `章 ${out.chapter.number || ''}${t}（${secs} 小节 / ${cards} 卡片）`;
    }
    return `列出 ${(out.chapters || []).length} 章（${out.count ?? ''}）`;
  }
  if (name === 'book_read_section') {
    if (out.found === false) return '未找到起始片段（可用 id/标题/编号）';
    return `已读 ${out.count} 段${out.truncated ? '（部分截断）' : ''}`;
  }
  if (name === 'list_books') return `列出 ${(out.books || []).length} 本书`;
  if (name === 'book_toc') return `目录 ${(out.toc || []).length} 条`;
  return '执行完成';
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
    const tag = `<a href="${href}" target="${target}" ${rel}>${innerText}</a>`;
    placeholders.push(tag);
    return `___LINK_PLACEHOLDER_${placeholders.length - 1}___`;
  });

  s = s.replace(/(^|[^\w"'/=])((?:https?:)?\/\/[^\s<>"']*collections\/[^\s<>"']+|\/?collections\/[^\s<>"']+)/gi, (fullMatch, prefix, rawUrl) => {
    let cleanUrl = rawUrl.replace(/[),.，。；;!?！？、]+$/, '');
    const trailing = rawUrl.slice(cleanUrl.length);
    const href = safeLink(cleanUrl);
    if (!href) return fullMatch;
    const tag = `<a href="${href}" target="${target}" ${rel}>${cleanUrl}</a>`;
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
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) { items.push(inline(lines[i].replace(/^\s*[-*+]\s+/, ''))); i++; }
      out.push(`<ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul>`);
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) { items.push(inline(lines[i].replace(/^\s*\d+[.)]\s+/, ''))); i++; }
      out.push(`<ol>${items.map((x) => `<li>${x}</li>`).join('')}</ol>`);
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
  _tabsList: HTMLElement | null = null;
  _tabAdd: HTMLElement | null = null;
  _config: any = {};
  _bookTitle = '本书';
  _col = '';
  _book = '';
  _panel!: HTMLElement;
  _fab!: HTMLElement;
  _close!: HTMLElement;
  _settingsBtn!: HTMLElement;
  _settings!: HTMLElement;
  _submit!: HTMLButtonElement;
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
  _onRoute!: () => void;
  _onDocClick!: (e: MouseEvent) => void;
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
      if (this._settingsBtn && this._settingsBtn.contains(e.target as Node)) return;
      if (this._historyBtn && this._historyBtn.contains(e.target as Node)) return;
      if (this._settings && this._settings.classList.contains('open') && !this._settings.contains(e.target as Node)) {
        this._settings.classList.remove('open');
        this._settingsBtn && this._settingsBtn.classList.remove('ask-settings-open');
      }
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
      this._rebuildModelOptions();
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
    this._settings = this.querySelector('.ask-settings') as HTMLElement;
    this._submit = this.querySelector('.ask-send') as HTMLButtonElement;
    this._input = this.querySelector('.ask-input') as HTMLTextAreaElement;
    this._status = this.querySelector('.ask-status') as HTMLElement;
    this._thread = this.querySelector('.ask-thread') as HTMLElement;
    this._empty = this.querySelector('.ask-empty') as HTMLElement;
    this._messages = this.querySelector('.ask-messages') as HTMLElement;
    this._bookEl = this.querySelector('.ask-book') as HTMLElement;

    const modelSelect = this.querySelector('.ask-model') as HTMLSelectElement | null;
    const keyInput = this.querySelector('.ask-key') as HTMLInputElement;
    const epInput = this.querySelector('.ask-endpoint') as HTMLInputElement;
    const topkInput = this.querySelector('.ask-topk') as HTMLInputElement;
    const maxctxInput = this.querySelector('.ask-maxctx') as HTMLInputElement;
    const maxtokInput = this.querySelector('.ask-maxtok') as HTMLInputElement;

    const refreshKeyForModel = () => {
      const activeId = getActiveAiModelId();
      if (modelSelect) modelSelect.value = activeId;
      if (keyInput) keyInput.value = getAiApiKey(activeId);
      if (epInput) epInput.value = getAiEndpoint(activeId);
    };

    if (modelSelect) {
      this._rebuildModelOptions(getActiveAiModelId());
      modelSelect.addEventListener('change', () => {
        saveAiActiveModel(modelSelect.value);
        refreshKeyForModel();
      });
    }

    const currentParams = getAiParams();
    if (topkInput) topkInput.value = String(currentParams.topK);
    if (maxctxInput) maxctxInput.value = String(currentParams.maxContextChars);
    if (maxtokInput) maxtokInput.value = String(currentParams.maxTokens);

    if (keyInput) {
      keyInput.addEventListener('input', () => {
        const id = getActiveAiModelId();
        saveAiApiKey(id, keyInput.value.trim(), true);
      });
    }
    if (epInput) {
      epInput.addEventListener('change', () => {
        const id = getActiveAiModelId();
        saveAiEndpoint(id, epInput.value.trim());
      });
    }
    if (topkInput) topkInput.addEventListener('change', () => saveAiParams({ topK: Number(topkInput.value) || 8 }));
    if (maxctxInput) maxctxInput.addEventListener('change', () => saveAiParams({ maxContextChars: Number(maxctxInput.value) || 6000 }));
    if (maxtokInput) maxtokInput.addEventListener('change', () => saveAiParams({ maxTokens: Number(maxtokInput.value) || 4096 }));

    const modeSelect = this.querySelector('.ask-mode') as HTMLSelectElement | null;
    if (modeSelect) {
      modeSelect.value = lsGet(MODE_STORE, 'retrieve') === 'discussion' ? 'discussion' : 'retrieve';
      modeSelect.addEventListener('change', () => lsSet(MODE_STORE, modeSelect.value));
    }

    const customToggle = this.querySelector('.ask-custom-toggle');
    const customForm = this.querySelector('.ask-custom-form') as HTMLElement | null;
    const customAdd = this.querySelector('.ask-custom-add');
    if (customToggle && customForm) customToggle.addEventListener('click', () => { customForm.hidden = !customForm.hidden; });
    if (customAdd) customAdd.addEventListener('click', () => this._addCustomModel());

    const srcOpenSelect = this.querySelector('.ask-src-open') as HTMLSelectElement | null;
    if (srcOpenSelect) {
      srcOpenSelect.value = localStorage.getItem(SRC_OPEN_STORE) || 'new';
      srcOpenSelect.addEventListener('change', () => {
        localStorage.setItem(SRC_OPEN_STORE, srcOpenSelect.value);
        this._applySrcOpenToExisting();
      });
    }

    if (this._messages) {
      this._messages.addEventListener('click', (e: MouseEvent) => {
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
    if (this._historyBtn) {
      this._historyBtn.addEventListener('click', (e) => { e.stopPropagation(); this._toggleHistory(); });
    }
    if (this._historyNew) {
      this._historyNew.addEventListener('click', () => this._startNewThread());
    }

    this._tabsList = this.querySelector('.ask-tabs-list');
    this._tabAdd = this.querySelector('.ask-tab-add');
    if (this._tabAdd) {
      this._tabAdd.addEventListener('click', () => this._startNewThread());
    }

    this._setBookTitle(this._bookTitle);

    if (this._fab) {
      this._fab.addEventListener('click', () => {
        if (this._panel && this._panel.classList.contains('ask-open')) this._closePanel();
        else this._openPanel();
      });
    }
    if (this._close) this._close.addEventListener('click', () => this._closePanel());
    if (this._settingsBtn) this._settingsBtn.addEventListener('click', (e) => { e.stopPropagation(); this._toggleSettings(); });
    if (this._input) {
      this._input.addEventListener('input', () => this._grow());
      this._input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this._ask(); }
      });
    }
    if (this._submit) this._submit.addEventListener('click', () => this._ask());

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

  _setBookTitle(t: string) {
    this._bookTitle = t || '本书';
    if (this._bookEl) this._bookEl.textContent = this._bookTitle;
  }

  _openPanel() {
    this._panel.classList.add('ask-open');
    this._input && this._input.focus();
  }
  _closePanel() {
    this._panel.classList.remove('ask-open');
    this._settings && this._settings.classList.remove('open');
    this._settingsBtn && this._settingsBtn.classList.remove('ask-settings-open');
    this._history && this._history.classList.remove('open');
    this._historyBtn && this._historyBtn.classList.remove('ask-settings-open');
  }
  _toggleSettings() {
    const open = this._settings.classList.toggle('open');
    this._settingsBtn.classList.toggle('ask-settings-open', open);
    if (open && this._history) { this._history.classList.remove('open'); }
  }
  _toggleHistory() {
    const open = this._history.classList.toggle('open');
    this._historyBtn.classList.toggle('ask-settings-open', open);
    if (open) {
      if (this._settings) this._settings.classList.remove('open');
      if (this._settingsBtn) this._settingsBtn.classList.remove('ask-settings-open');
      this._renderHistoryList();
    }
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
    this._renderTabs();
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
      this._renderTabs();
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
            body.blocksEl.insertAdjacentHTML('beforeend', this._toolBlocksHtml([seg]));
          }
        }
        if (m.sources && m.sources.length) this._renderSources(body.sourcesEl, m.sources.map((s: any) => ({ chunk: s })));
      }
    }
    this._scrollThread();
    this._renderTabs();
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
    this._renderTabs();
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
      const item = document.createElement('div');
      item.className = 'ask-history-item';
      item.dataset.id = t.id;
      const load = document.createElement('button');
      load.type = 'button';
      load.className = 'ask-history-load';
      load.innerHTML = `<span class="h-title">${esc((t.title || '新会话').slice(0, 30))}</span><span class="h-time">${esc(this._relTime(t.updatedAt))} · ${(t.messages || []).length} 条</span>`;
      load.addEventListener('click', () => this._loadThreadById(t.id));
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'ask-history-del';
      del.textContent = '×';
      del.title = '删除该会话';
      del.addEventListener('click', (e) => { e.stopPropagation(); this._deleteThread(t.id); });
      item.appendChild(load);
      item.appendChild(del);
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
    this._renderTabs();
    if (this._history) this._history.classList.remove('open');
    if (this._historyBtn) this._historyBtn.classList.remove('ask-settings-open');
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
    this._renderTabs();
    this._renderHistoryList();
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
    this._renderTabs();
    if (this._input) { this._input.value = ''; this._grow(); }
    if (this._history) this._history.classList.remove('open');
    if (this._historyBtn) this._historyBtn.classList.remove('ask-settings-open');
  }

  _renderTabs() {
    if (!this._tabsList) return;
    const threads = (this._threads || []).slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    this._tabsList.innerHTML = '';
    let activeTabEl: HTMLElement | null = null;
    for (const t of threads) {
      const isActive = !!(this._activeThread && this._activeThread.id === t.id);
      const tab = document.createElement('div');
      tab.className = 'ask-tab' + (isActive ? ' ask-tab-active' : '');
      tab.dataset.id = t.id;
      if (isActive) activeTabEl = tab;
      const title = document.createElement('span');
      title.className = 'ask-tab-title';
      title.textContent = (t.title || '新会话').slice(0, 18);
      title.title = (t.messages && t.messages.length) ? `${t.title || '新会话'}（${t.messages.length} 条）` : (t.title || '新会话');
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'ask-tab-close';
      close.textContent = '×';
      close.title = '关闭该会话';
      close.addEventListener('click', (e) => { e.stopPropagation(); this._deleteThread(t.id); });
      tab.appendChild(title);
      tab.appendChild(close);
      tab.addEventListener('click', (e) => {
        if (close.contains(e.target as Node)) return;
        if (this._activeThread && this._activeThread.id === t.id) return;
        this._loadThreadById(t.id);
      });
      this._tabsList.appendChild(tab);
    }
    if (activeTabEl) {
      try { (activeTabEl as HTMLElement).scrollIntoView({ inline: 'nearest', behavior: 'smooth' }); } catch {}
    }
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
    return { id, model: id, endpoint };
  }

  _currentKey(): string {
    return getAiApiKey(getActiveAiModelId());
  }

  _params(): any {
    return getAiParams();
  }

  _answerMode(): string {
    return lsGet(MODE_STORE, 'retrieve') === 'discussion' ? 'discussion' : 'retrieve';
  }

  _addCustomModel() {
    const idRaw = this.querySelector('.ask-custom-id') as HTMLInputElement | null;
    const labelEl = this.querySelector('.ask-custom-label') as HTMLInputElement | null;
    const epEl = this.querySelector('.ask-custom-ep') as HTMLInputElement | null;
    const id = idRaw && idRaw.value.trim();
    if (!id) { idRaw && idRaw.focus(); return; }
    const ep = epEl && epEl.value.trim();
    if (!ep) { epEl && epEl.focus(); return; }
    addCustomAiModel({ id, label: (labelEl && labelEl.value.trim()) || id, endpoint: ep });
    this._rebuildModelOptions(id);
    if (idRaw) idRaw.value = '';
    if (labelEl) labelEl.value = '';
    if (epEl) epEl.value = '';
    const form = this.querySelector('.ask-custom-form') as HTMLElement | null;
    if (form) form.hidden = true;
  }

  _rebuildModelOptions(selectId?: string) {
    const sel = this.querySelector('.ask-model') as HTMLSelectElement | null;
    if (!sel) return;
    const models = getAllAiModels();
    const activeId = selectId || getActiveAiModelId();
    sel.innerHTML = models.map((m: any) => `<option value="${m.id}" ${m.id === activeId ? 'selected' : ''}>${m.label || m.id}${m.isCustom ? ' (自定义)' : ''}</option>`).join('');
    sel.value = activeId;
    const keyInput = this.querySelector('.ask-key') as HTMLInputElement | null;
    const epInput = this.querySelector('.ask-endpoint') as HTMLInputElement | null;
    if (keyInput) keyInput.value = getAiApiKey(activeId);
    if (epInput) epInput.value = getAiEndpoint(activeId);
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
      t.className = 'ask-msg-text';
      t.textContent = body.text;
      msg.appendChild(t);
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
    t.style.height = Math.min(t.scrollHeight, 140) + 'px';
    this._updateSendState();
  }

  _updateSendState() {
    if (!this._input || !this._submit) return;
    const val = this._input.value.trim();
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
    try { return (localStorage.getItem(SRC_OPEN_STORE) || 'new') !== 'same'; }
    catch { return true; }
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
    try { renderMathInElement(el, this._katexConfig); }
    catch (e) {}
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

  _toolBlocksHtml(toolLog: any[]): string {
    if (!toolLog || !toolLog.length) return '';
    const items = toolLog.map((t: any) => {
      const raw = t.resultRaw !== undefined ? t.resultRaw : t.resultText;
      return `
        <details class="ask-tool" open>
          <summary><span class="ask-tool-icon">🔧</span> 调用 <code>${esc(t.name)}</code> <span class="ask-tool-sum">${esc(t.summary || '')}</span></summary>
          <details class="ask-tool-raw">
            <summary>查看参数与原始结果</summary>
            <div class="ask-tool-args"><pre>${this._jsonHtml(t.args)}</pre></div>
            <div class="ask-tool-out"><pre>${this._jsonHtml(raw)}</pre></div>
          </details>
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
      if (!discussion) {
        idx = await this._getIndex();
        const retriever = createRetriever(idx.chunks);
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
      status.textContent = `出错了：${e.message}`;
      this._appendMdBlock(blocksEl, `出错了：${e.message}`, false);
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
    const toolDefs = buildToolDefs();
    const context = discussion ? '' : buildContext(hits.map((h: any) => h.chunk), params.maxContextChars);
    const messages = buildMessages({
      question,
      context,
      bookTitle: (idx && idx.meta && idx.meta.title) || this._bookTitle,
      history: this._historyFromThread(this._activeThread),
      toolsDesc: toolsDesc(),
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
      for (let turn = 0; turn < maxTurns; turn++) {
        curText = '';
        curTextEl = null;
        const res = await streamChat({
          endpoint, apiKey, model, messages,
          tools: toolDefs, toolChoice: 'auto', maxTokens: params.maxAnswerTokens,
          signal: this._abort.signal,
          onDelta: (d: string) => {
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
              out = await runClientTool(tc.name, tc.arguments, toolCtx);
              summary = toolSummary(tc.name, out);
            } catch (e: any) {
              out = { error: e.message || String(e) };
              summary = '执行失败';
            }
            const t = { name: tc.name, args: tc.arguments || {}, summary, resultRaw: out, resultText: capJsonText(out) };
            toolLog.push(t);
            segments.push({ kind: 'tool', name: t.name, args: t.args, summary: t.summary, resultText: t.resultText });
            blocksEl.insertAdjacentHTML('beforeend', this._toolBlocksHtml([t]));
            messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(out) });
          }
          continue;
        }
        break;
      }
      flushReply();
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        const errMsg = `[生成中断] ${e.message}`;
        if (curText && curText.trim()) segments.push({ kind: 'reply', text: curText });
        full += (full && full.trim() ? '\n\n' : '') + errMsg;
        segments.push({ kind: 'reply', text: errMsg });
        const d = addReplyEl();
        d.innerHTML = decorateFootnotes(mdToHtml(errMsg, this._sourceOpenNew()), !discussion);
        this._typeMath(d);
      }
    } finally {
      this._streaming = false;
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
