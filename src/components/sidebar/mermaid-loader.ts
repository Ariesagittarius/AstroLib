/**
 * mermaid-loader.ts：客户端动态加载与渲染 Mermaid 图表的工具
 * 
 * 性能约束：只有当 DOM 中存在 .mermaid-container、pre[data-language="mermaid"] 或 .mermaid 节点时，
 * 才会动态 trigger `import('mermaid')` 并下载 chunk；对于无图表页面，0 开销。
 */

let isInitialized = false;
let currentTheme: 'dark' | 'light' = 'light';

function sanitizeMermaidCode(code: string): string {
  // 自动将流程图文本中的 <col> 或 <book> 等标签转换为 HTML 实体 &lt;col&gt;，
  // 防止 Mermaid / DOMPurify 将其误认为 HTML 元素导致语法解析报错。
  return code
    .replace(/<([a-zA-Z0-9_-]+)>/g, '&lt;$1&gt;')
    .replace(/([a-zA-Z0-9_.]+)\s*>\s*([0-9.]+)/g, '$1 &gt; $2');
}

export async function initMermaid() {
  const targetElements = Array.from(
    document.querySelectorAll<HTMLElement>(
      '.mermaid-container, pre[data-language="mermaid"], code.language-mermaid, .mermaid'
    )
  );

  if (targetElements.length === 0) return;

  const isDark = document.documentElement.classList.contains('dark') || 
                 document.documentElement.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'dark' : 'light';

  const processedContainers = new Set<HTMLElement>();
  const jobs: { container: HTMLElement; rawCode: string }[] = [];

  for (const el of targetElements) {
    const container = el.closest<HTMLElement>('.mermaid-container') ||
                      el.closest<HTMLElement>('.expressive-code') ||
                      el.closest<HTMLElement>('pre') ||
                      el;

    if (processedContainers.has(container)) continue;
    processedContainers.add(container);

    if (container.dataset.mermaidRendered === 'true' && currentTheme === newTheme) {
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

  try {
    const mermaidModule = await import('mermaid');
    const mermaid = mermaidModule.default || mermaidModule;

    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'neutral',
      securityLevel: 'loose',
      fontFamily: 'var(--sl-font, inherit)',
    });

    let counter = 0;
    for (const { container, rawCode } of jobs) {
      const renderId = `mermaid-svg-${Date.now()}-${counter++}`;
      const sanitizedCode = sanitizeMermaidCode(rawCode);
      try {
        const { svg } = await mermaid.render(renderId, sanitizedCode);
        container.innerHTML = `<div class="mermaid-render">${svg}</div>`;
        container.classList.add('mermaid-container');
        container.dataset.mermaidRendered = 'true';
      } catch (err) {
        console.error('[Mermaid Render Error]', err, sanitizedCode);
        try {
          const { svg: fallbackSvg } = await mermaid.render(`${renderId}-fb`, rawCode);
          container.innerHTML = `<div class="mermaid-render">${fallbackSvg}</div>`;
          container.classList.add('mermaid-container');
          container.dataset.mermaidRendered = 'true';
        } catch (err2) {
          console.error('[Mermaid Fallback Render Error]', err2);
        }
      }
    }

    currentTheme = newTheme;
  } catch (e) {
    console.error('[Mermaid Dynamic Load Error]', e);
  }
}

/**
 * 监听主题变化，以便在亮暗模式切换时重新渲染
 */
export function setupMermaidThemeListener() {
  if (isInitialized) return;
  isInitialized = true;

  const observer = new MutationObserver(() => {
    const containers = document.querySelectorAll('.mermaid-container[data-mermaid-rendered="true"]');
    if (containers.length > 0) {
      containers.forEach(c => {
        (c as HTMLElement).dataset.mermaidRendered = 'false';
      });
      initMermaid();
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'data-theme'],
  });
}
