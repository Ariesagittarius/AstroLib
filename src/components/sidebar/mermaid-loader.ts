let mermaidLoadingPromise: Promise<any> | null = null;
let intersectionObserver: IntersectionObserver | null = null;
let isThemeListenerBound = false;
let currentTheme: 'dark' | 'light' = 'light';
let renderCounter = 0;

function sanitizeMermaidCode(code: string): string {
  let s = code;

  s = s
    .replace(/<([a-zA-Z0-9_-]+)>/g, '&lt;$1&gt;')
    .replace(/([a-zA-Z0-9_.]+)\s*>\s*([0-9.]+)/g, '$1 &gt; $2');

  s = s.replace(/(-->|---\||--\s*\|)([^"|\n]+)\|/g, (match, prefix, label) => {
    if (/[()_{}\\^$]/.test(label)) {
      return `${prefix}"${label.trim()}"|`;
    }
    return match;
  });

  s = s.replace(/(?<!\$)\$(?!\$)([^\$\n]+?)(?<!\$)\$(?!\$)/g, '$$$$$1$$$$');

  s = s.replace(/"([^"]*?)"/g, (_match, inner) => {
    const replaced = inner.replace(/\\n(?![a-zA-Z])/g, '<br/>');
    return `"${replaced}"`;
  });

  return s;
}

const MERMAID_STABILIZATION_CSS = `
  foreignObject { overflow: visible !important; }
  foreignObject p { margin: 0 !important; padding: 0 !important; line-height: normal !important; text-indent: 0 !important; display: inline-block !important; }
  foreignObject > div { vertical-align: middle !important; text-align: center !important; line-height: 1.35 !important; }
  .nodeLabel { display: inline-block !important; text-align: center !important; line-height: 1.35 !important; }
  .nodeLabel .katex { line-height: normal !important; font-size: 1em !important; vertical-align: middle !important; display: inline-flex !important; align-items: center !important; }
  .nodeLabel .katex math { display: inline !important; }
  .edgeLabel { line-height: normal !important; }
  .edgeLabel p { margin: 0 !important; padding: 0 4px !important; text-indent: 0 !important; line-height: normal !important; }
`;

function cleanMermaidArtifacts(renderId: string): void {
  if (typeof document === 'undefined') return;

  const errorElements = document.querySelectorAll(
    `#${renderId}, #d${renderId}, [id^="mermaid-syntax-error"], .mermaid-syntax-error`
  );
  errorElements.forEach((el) => {
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });
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
        legacyMathML: true,
        themeCSS: MERMAID_STABILIZATION_CSS,
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
    legacyMathML: true,
    themeCSS: MERMAID_STABILIZATION_CSS,
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
    cleanMermaidArtifacts(renderId);

    container.innerHTML = `
      <div class="mermaid-fallback-box" style="margin: 1rem 0; padding: 1rem; border-radius: 8px; background: var(--sl-color-bg-nav, rgba(0,0,0,0.03)); border: 1px dashed var(--sl-color-hairline, rgba(0,0,0,0.15));">
        <div style="font-size: 0.75rem; color: var(--sl-color-gray-3); margin-bottom: 0.5rem;">[Mermaid 流程图解析提示]</div>
        <pre style="margin: 0; overflow-x: auto; font-size: 0.85rem; line-height: 1.4;"><code>${sanitizedCode.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
      </div>
    `.trim();
    container.classList.add('mermaid-container');
    container.dataset.mermaidRendered = 'true';
    container.dataset.renderedTheme = isDark ? 'dark' : 'light';
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

    const idle = (typeof window !== 'undefined' && window.requestIdleCallback) || ((fn: Function) => setTimeout(fn, 120));
    idle(() => {
      jobs.forEach(({ container, rawCode }) => {
        renderSingleDiagram(container, rawCode, isDark);
      });
    });
  }
}

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

if (typeof document !== 'undefined') {
  document.addEventListener('astrolib:page-unload', () => {
    if (intersectionObserver) {
      intersectionObserver.disconnect();
      intersectionObserver = null;
    }
  });
}
