/**
 * src/ai/client/thread-store.ts
 * AI 学术问答多会话与历史记录持久化管理器
 */

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  sources?: any[];
  tools?: any[];
  segments?: any[];
}

export interface ChatThread {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export const HISTORY_MAX = 12;
export const THREADS_PREFIX = 'dsh-aiask-threads-';
export const ACTIVE_PREFIX = 'dsh-aiask-active-';
export const MAX_THREADS = 30;
export const MAX_MSGS = 60;

export class ThreadStore {
  private bookKey: string;

  constructor(bookKey: string) {
    this.bookKey = bookKey;
  }

  public setBookKey(bookKey: string) {
    this.bookKey = bookKey;
  }

  public getThreadsKey(): string {
    return THREADS_PREFIX + this.bookKey;
  }

  public getActiveKey(): string {
    return ACTIVE_PREFIX + this.bookKey;
  }

  public loadThreads(): ChatThread[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const a = JSON.parse(localStorage.getItem(this.getThreadsKey()) || '[]');
      return Array.isArray(a) ? a : [];
    } catch {
      return [];
    }
  }

  public saveThreads(threads: ChatThread[]) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.getThreadsKey(), JSON.stringify(threads.slice(-MAX_THREADS)));
    } catch {}
  }

  public getActiveThreadId(): string {
    if (typeof localStorage === 'undefined') return '';
    try {
      return localStorage.getItem(this.getActiveKey()) || '';
    } catch {
      return '';
    }
  }

  public saveActiveThreadId(id: string) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.getActiveKey(), id);
    } catch {}
  }

  public newThread(title = '新会话'): ChatThread {
    return {
      id: `th-${Date.now()}`,
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
  }

  public restoreBookThread(): { threads: ChatThread[]; activeThread: ChatThread | null } {
    const threads = this.loadThreads();
    const activeId = this.getActiveThreadId();
    const t = threads.find((x) => x.id === activeId);
    if (t && t.messages && t.messages.length) {
      return { threads, activeThread: t };
    }
    return { threads, activeThread: null };
  }

  public historyFromThread(t: ChatThread | null, max = HISTORY_MAX): Array<{ role: string; content: string }> {
    if (!t || !Array.isArray(t.messages)) return [];
    const out: Array<{ role: string; content: string }> = [];
    for (const m of t.messages) {
      if (m.role === 'user' && m.text) out.push({ role: 'user', content: m.text });
      else if (m.role === 'assistant' && m.text) out.push({ role: 'assistant', content: m.text });
    }
    return out.slice(-max);
  }

  public static formatRelativeTime(ts: number): string {
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
}
