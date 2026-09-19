/**
 * mermaid-loader.ts：客户端动态加载与视口交叉按需渲染 Mermaid 图表的工具
 * 
 * 性能优化：
 * 1. 视口按需交叉渲染 (IntersectionObserver with 240px rootMargin)：
 *    离屏图表不抢占首屏 CPU，当读者滚动临近时才异步转译，彻底消除正文首屏阻塞。
 * 2. 动态 import('mermaid') 单例缓存，仅在真正需要渲染时才拉取 chunk。
 * 3. 页面卸载 (astrolib:page-unload) 时断开观察器，避免 SPA 换页闭包与 DOM 泄漏。
 */

let mermaidLoadingPromise: Promise<any> | null = null;
let intersectionObserver: IntersectionObserver | null = null;
let isThemeListenerBound = false;
let currentTheme: 'dark' | 'light' = 'light';
let renderCounter = 0;

function sanitizeMermaidCode(code: string): string {
  // 自动将流程图文本中的 <col> 或 <book> 等标签转换为 HTML 实体 &lt;col&gt;，
  // 防止 Mermaid / DOMPurify 将其误认为 HTML 元素导致语法解析报错。
  return code
    .replace(/<([a-zA-Z0-9_-]+)>/g, '&lt;$1&gt;')
    .replace(/([a-zA-Z0-9_.]+)\s*>\s*([0-9.]+)/g, '$1 &gt; $2');
}

async function getMermaidInstance(isDark: boolean): Promise<any> {
  if (!mermaidLoadingPromise) {
    mermaidLoadingPromise = import('mermaid').then((m) => {
      const mermaid = m.default || m;
      mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? 'dark' : 'neutral',
        securityLevel: 'loose',
        fontFamily: 'var(--sl-font, inherit)',
      });
      return mermaid;
    });
  }
  const mermaid = await mermaidLoadingPromise;
  mermaid.initialize({
    startOnLoad: false,
    theme: isDark ? 'dark' : 'neutral',
    securityLevel: 'loose',
    fontFamily: 'var(--sl-font, inherit)',
  });
  return mermaid;
}

async function renderSingleDiagram(container: HTMLElement, rawCode: string, isDark: boolean): Promise<void> {
  if (!rawCode.trim()) return;
  const renderId = `mermaid-svg-${Date.now()}-${renderCounter++}`;
  const sanitizedCode = sanitizeMermaidCode(rawCode);

  try {
    const mermaid = await getMermaidInstance(isDark);
    const { svg } = await mermaid.render(renderId, sanitizedCode);
    container.innerHTML = `<div class="mermaid-render">${svg}</div>`;
    container.classList.add('mermaid-container');
    container.dataset.mermaidRendered = 'true';
    container.dataset.renderedTheme = isDark ? 'dark' : 'light';
  } catch (err) {
    console.error('[Mermaid Render Error]', err, sanitizedCode);
    try {
      const mermaid = await getMermaidInstance(isDark);
      const { svg: fallbackSvg } = await mermaid.render(`${renderId}-fb`, rawCode);
      container.innerHTML = `<div class="mermaid-render">${fallbackSvg}</div>`;
      container.classList.add('mermaid-container');
      container.dataset.mermaidRendered = 'true';
      container.dataset.renderedTheme = isDark ? 'dark' : 'light';
    } catch (err2) {
      console.error('[Mermaid Fallback Render Error]', err2);
    }
  }
}

export function initMermaid(): void {
  const targetElements = Array.from(
    document.querySelectorAll<HTMLElement>(
      '.mermaid-container, pre[data-language="mermaid"], code.language-mermaid, .mermaid'
    )
  );

  if (targetElements.length === 0) return;

  const isDark = document.documentElement.classList.contains('dark') || 
                 document.documentElement.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'dark' : 'light';
  currentTheme = newTheme;

  const processedContainers = new Set<HTMLElement>();
  const jobs: { container: HTMLElement; rawCode: string }[] = [];

  for (const el of targetElements) {
    const container = el.closest<HTMLElement>('.mermaid-container') ||
                      el.closest<HTMLElement>('.expressive-code') ||
                      el.closest<HTMLElement>('pre') ||
                      el;

    if (processedContainers.has(container)) continue;
    processedContainers.add(container);

    if (container.dataset.mermaidRendered === 'true' && container.dataset.renderedTheme === newTheme) {
      continue;
    }

    const encodedCode = container.getAttribute('data-mermaid-code');
    let rawCode = '';
    if (encodedCode) {
      try {
        rawCode = decodeURIComponent(encodedCode);
      } catch {
        rawCode = encodedCode;
      }
    } else {
      rawCode = el.textContent || container.textContent || '';
    }

    if (!rawCode.trim()) continue;
    jobs.push({ container, rawCode: rawCode.trim() });
  }

  if (jobs.length === 0) return;

  // 使用 IntersectionObserver 视口交叉按需渲染，预留 240px 视口裕量
  if (typeof IntersectionObserver !== 'undefined') {
    if (intersectionObserver) {
      intersectionObserver.disconnect();
    }

    intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const container = entry.target as HTMLElement;
            intersectionObserver?.unobserve(container);

            const job = jobs.find((j) => j.container === container);
            if (job) {
              renderSingleDiagram(job.container, job.rawCode, isDark);
            }
          }
        });
      },
      { rootMargin: '240px 0px' }
    );

    jobs.forEach(({ container }) => {
      intersectionObserver?.observe(container);
    });
  } else {
    // 降级支持：使用 requestIdleCallback 分批渲染
    const idle = (typeof window !== 'undefined' && window.requestIdleCallback) || ((fn: Function) => setTimeout(fn, 120));
    idle(() => {
      jobs.forEach(({ container, rawCode }) => {
        renderSingleDiagram(container, rawCode, isDark);
      });
    });
  }
}

/**
 * 监听主题变化，以便在亮暗模式切换时重新渲染
 */
export function setupMermaidThemeListener(): void {
  if (isThemeListenerBound) return;
  isThemeListenerBound = true;

  const observer = new MutationObserver(() => {
    const isDark = document.documentElement.classList.contains('dark') || 
                   document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'dark' : 'light';
    if (newTheme !== currentTheme) {
      currentTheme = newTheme;
      const containers = document.querySelectorAll('.mermaid-container[data-mermaid-rendered="true"]');
      if (containers.length > 0) {
        containers.forEach((c) => {
          (c as HTMLElement).dataset.mermaidRendered = 'false';
        });
        initMermaid();
      }
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'data-theme'],
  });
}

// 自动响应 SPA 页面卸载生命周期，断开视口观察器
if (typeof document !== 'undefined') {
  document.addEventListener('astrolib:page-unload', () => {
    if (intersectionObserver) {
      intersectionObserver.disconnect();
      intersectionObserver = null;
    }
  });
}
