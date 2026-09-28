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
  let s = code;

  // 1. 自动将流程图文本中的 <col> 或 <book> 等标签转换为 HTML 实体 &lt;col&gt;，
  // 防止 Mermaid / DOMPurify 将其误认为 HTML 元素导致语法解析报错。
  s = s
    .replace(/<([a-zA-Z0-9_-]+)>/g, '&lt;$1&gt;')
    .replace(/([a-zA-Z0-9_.]+)\s*>\s*([0-9.]+)/g, '$1 &gt; $2');

  // 2. 自动给未加双引号且含有小括号/特殊字符的边标签补充双引号
  // 例如：-->|带通信号 x(t)| 自动转为 -->|"带通信号 x(t)"|
  s = s.replace(/(-->|---\||--\s*\|)([^"|\n]+)\|/g, (match, prefix, label) => {
    if (/[()_{}\\^$]/.test(label)) {
      return `${prefix}"${label.trim()}"|`;
    }
    return match;
  });

  // 3. 自动将单美元数学公式 $formula$ 提升为 Mermaid 官方标准的双美元 $$formula$$
  // 确保 KaTeX 引擎能够正常识别与转译，消除 Markdown 斜体与截断冲突
  s = s.replace(/(?<!\$)\$(?!\$)([^\$\n]+?)(?<!\$)\$(?!\$)/g, '$$$$$1$$$$');

  // 4. 自动将双引号字符串节点内的换行转义符 \n（非 LaTeX 宏命令，如 \nu, \nabla, \neq）转化为 Mermaid 换行标签 <br/>
  // 例如："平方器\n$$(\cdot)^2$$" 自动转为 "平方器<br/>$$(\cdot)^2$$"
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
  // 移除 Mermaid 在解析失败时注入到 body 末尾的临时或错误 DOM
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

    // 优雅降级展示：以安静克制的原生代码框呈现，不撑爆布局，绝不在网页底部注入大面积红色报错
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
