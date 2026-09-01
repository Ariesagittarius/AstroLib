/**
 * ============================================================================
 * 全书章节内联关系图谱客户端引擎 (Relation Graph Client Engine)
 * ============================================================================
 * 
 * 职责：
 *   1. 动态加载与缓存 Apache ECharts 5 运行时；
 *   2. Portal 脱离父级 Stacking Context，直接提升至 body 根层级（z-index: 999999）；
 *   3. 响应四种视图切换（拓扑网络、环形依存、思维导图、关联清单）；
 *   4. 响应四种缩放视角与层级过滤（全书明细、按篇章聚合、聚焦当前章、仅看连通节点）；
 *   5. 提供左下角悬浮操控台（放大、缩小、居中复位、物理引力开关）；
 *   6. 用户偏好持久化（支持隐藏/显示右侧侧边栏入口按钮与 Alt+G 快捷键）。
 * ============================================================================
 */

declare global {
  interface Window {
    echarts?: any;
    __BRG_CACHED_DATA__?: Record<string, any>;
    openBookRelationGraph?: () => void;
  }
}

let echartsInstance: any = null;
let currentGraphData: any = null;
let currentViewMode: 'force' | 'circular' | 'mindmap' | 'matrix' = 'force';
let currentScopeMode: 'all' | 'group' | 'focus' | 'connected' = 'all';
let isPhysicsEnabled = true;
let isScriptLoading = false;

const PREF_KEY_SHOW_BTN = 'astro-show-relation-graph-btn';

/** 动态安全加载 ECharts 5 */
async function ensureECharts(): Promise<any> {
  if (window.echarts) return window.echarts;
  if (isScriptLoading) {
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (window.echarts) {
          clearInterval(check);
          resolve(window.echarts);
        }
      }, 50);
    });
  }

  isScriptLoading = true;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js';
    script.async = true;
    script.onload = () => {
      isScriptLoading = false;
      resolve(window.echarts);
    };
    script.onerror = () => {
      const fallbackScript = document.createElement('script');
      fallbackScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/echarts/5.5.0/echarts.min.js';
      fallbackScript.onload = () => {
        isScriptLoading = false;
        resolve(window.echarts);
      };
      fallbackScript.onerror = () => {
        isScriptLoading = false;
        reject(new Error('ECharts 脚本加载失败'));
      };
      document.head.appendChild(fallbackScript);
    };
    document.head.appendChild(script);
  });
}

/** 判断当前是否暗黑模式 */
function isDarkMode(): boolean {
  return document.documentElement.getAttribute('data-theme') === 'dark' ||
    document.documentElement.classList.contains('dark');
}

/** 获取主题对应的配色字典 */
function getThemeColors() {
  const isDark = isDarkMode();
  return {
    isDark,
    textColor: isDark ? '#dfdfd6' : '#3c3c43',
    subTextColor: isDark ? '#98989f' : '#67676c',
    bgColor: isDark ? '#1b1b1f' : '#ffffff',
    borderColor: isDark ? '#2e2e32' : '#e2e2e3',
    edgeColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.22)',
    accentColor: isDark ? '#a8b1ff' : '#3451b2',
  };
}

/** 应用层级与范围过滤数据 */
function getScopedData() {
  if (!currentGraphData) return null;

  if (currentScopeMode === 'group') {
    // 按篇章/大章聚合
    return {
      nodes: currentGraphData.groupData?.nodes || [],
      links: currentGraphData.groupData?.links || [],
      categories: currentGraphData.groupData?.categories || currentGraphData.categories,
      treeData: currentGraphData.treeData,
      matrix: currentGraphData.matrix,
    };
  }

  let nodes = currentGraphData.nodes || [];
  let links = currentGraphData.links || [];

  if (currentScopeMode === 'focus') {
    // 聚焦当前章及其直接出入链邻居
    const currentPath = window.location.pathname.replace(/\/$/, '');
    let activeNode = nodes.find((n: any) => n.url.replace(/\/$/, '') === currentPath);
    if (!activeNode && nodes.length > 0) activeNode = nodes[0];

    if (activeNode) {
      const activeId = activeNode.id;
      const neighborIds = new Set<string>([activeId]);
      links.forEach((l: any) => {
        if (l.source === activeId) neighborIds.add(l.target);
        if (l.target === activeId) neighborIds.add(l.source);
      });

      nodes = nodes.filter((n: any) => neighborIds.has(n.id));
      links = links.filter((l: any) => neighborIds.has(l.source) && neighborIds.has(l.target));
    }
  } else if (currentScopeMode === 'connected') {
    // 仅看有引用的节点
    nodes = nodes.filter((n: any) => n.inDegree > 0 || n.outDegree > 0);
    const validIds = new Set(nodes.map((n: any) => n.id));
    links = links.filter((l: any) => validIds.has(l.source) && validIds.has(l.target));
  }

  return {
    nodes,
    links,
    categories: currentGraphData.categories,
    treeData: currentGraphData.treeData,
    matrix: currentGraphData.matrix,
  };
}

/** 渲染 ECharts 图表选项 */
function renderChartOption(data: any, viewMode: 'force' | 'circular' | 'mindmap') {
  if (!echartsInstance || !data) return;

  const theme = getThemeColors();
  const { nodes, links, categories, treeData } = data;

  if (viewMode === 'force') {
    echartsInstance.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: theme.isDark ? '#202127' : '#ffffff',
        borderColor: theme.borderColor,
        textStyle: { color: theme.textColor, fontSize: 12 },
        formatter: (params: any) => {
          if (params.dataType === 'node') {
            const n = params.data;
            if (n.isGroupNode) {
              return `
                <div style="font-weight: 600; margin-bottom: 4px; color:${theme.accentColor};">📦 ${n.groupName}</div>
                <div><b>包含章节数：</b>${n.chapterCount} 章</div>
                <div><b>包含知识模块：</b>${n.cardCount} 个</div>
                <div><b>与其他篇章相互引用：</b>${n.inDegree + n.outDegree} 次</div>
                <div style="font-size: 10px; color:${theme.subTextColor}; margin-top: 4px;">点击在下方搜索过滤该篇章</div>
              `;
            }
            return `
              <div style="font-weight: 600; margin-bottom: 4px; color:${theme.accentColor};">${n.name}</div>
              <div><b>分组：</b>${n.groupName}</div>
              <div><b>知识模块数：</b>${n.cardCount}</div>
              <div><b>被外部引用：</b>${n.inDegree} 次</div>
              <div><b>引用外部章节：</b>${n.outDegree} 次</div>
              <div style="font-size: 10px; color:${theme.subTextColor}; margin-top: 4px;">点击查看详细出入链，双击跳转</div>
            `;
          } else if (params.dataType === 'edge') {
            const l = params.data;
            return `
              <div style="font-weight: 600; color:${theme.accentColor};">${l.sourceTitle} → ${l.targetTitle}</div>
              <div><b>引用频次：</b>${l.value} 次</div>
              ${l.refs && l.refs.length > 0 ? `<div style="font-size: 11px; margin-top: 2px;"><b>引用模块：</b>${l.refs.join('、')}</div>` : ''}
            `;
          }
          return '';
        },
      },
      legend: [{
        data: categories.map((c: any) => c.name),
        textStyle: { color: theme.textColor, fontSize: 11 },
        top: 12,
        left: 16,
        type: 'scroll',
      }],
      series: [{
        type: 'graph',
        layout: 'force',
        data: nodes,
        links: links,
        categories: categories,
        roam: true,
        draggable: true,
        focusNodeAdjacency: true,
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [0, 8],
        edgeLabel: { show: false },
        force: {
          repulsion: isPhysicsEnabled ? (nodes.length > 60 ? 180 : 280) : 0,
          gravity: 0.08,
          edgeLength: [60, 200],
          friction: 0.65,
        },
        label: {
          show: true,
          position: 'right',
          formatter: '{b}',
          fontSize: nodes.length > 80 ? 10 : 11,
          color: theme.textColor,
        },
        lineStyle: {
          color: 'source',
          curveness: 0.22,
          opacity: 0.65,
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 4,
            opacity: 1,
          },
          label: {
            fontWeight: 'bold',
          },
        },
      }],
    }, true);
  } else if (viewMode === 'circular') {
    echartsInstance.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: theme.isDark ? '#202127' : '#ffffff',
        borderColor: theme.borderColor,
        textStyle: { color: theme.textColor, fontSize: 12 },
      },
      legend: [{
        data: categories.map((c: any) => c.name),
        textStyle: { color: theme.textColor, fontSize: 11 },
        top: 12,
        left: 16,
        type: 'scroll',
      }],
      series: [{
        type: 'graph',
        layout: 'circular',
        circular: {
          rotateLabel: true,
        },
        data: nodes,
        links: links,
        categories: categories,
        roam: true,
        focusNodeAdjacency: true,
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [0, 8],
        label: {
          show: true,
          position: 'right',
          formatter: '{b}',
          fontSize: 10,
          color: theme.textColor,
        },
        lineStyle: {
          color: 'source',
          curveness: 0.32,
          opacity: 0.6,
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 3.5,
            opacity: 1,
          },
        },
      }],
    }, true);
  } else if (viewMode === 'mindmap') {
    echartsInstance.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: theme.isDark ? '#202127' : '#ffffff',
        borderColor: theme.borderColor,
        textStyle: { color: theme.textColor, fontSize: 12 },
        formatter: (params: any) => {
          const d = params.data;
          return `<b>${d.name}</b>${d.value ? `<br/>${d.value}` : ''}`;
        },
      },
      series: [{
        type: 'tree',
        data: [treeData],
        top: '6%',
        left: '14%',
        bottom: '6%',
        right: '24%',
        symbolSize: 8,
        initialTreeDepth: 2,
        orient: 'LR',
        label: {
          position: 'left',
          verticalAlign: 'middle',
          align: 'right',
          fontSize: 11,
          color: theme.textColor,
        },
        leaves: {
          label: {
            position: 'right',
            verticalAlign: 'middle',
            align: 'left',
            color: theme.subTextColor,
          },
        },
        expandAndCollapse: true,
        animationDuration: 350,
      }],
    }, true);
  }
}

function resolveUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('/')) return url;
  const m = window.location.pathname.match(/^(\/collections\/[^/]+\/[^/]+\/)/);
  return (m ? m[1] : '') + url;
}

/** 填充矩阵列表视图 */
function renderMatrixView(matrixData: any[]) {
  const tbody = document.getElementById('brg-matrix-tbody');
  if (!tbody) return;

  tbody.innerHTML = matrixData.map((item) => {
    const outCross = item.outReferences ? item.outReferences.filter((r: any) => r.isCrossChapter) : [];
    const topOutRefs = outCross.slice(0, 3).map((r: any) => `<span class="brg-stat-tag">${r.refText}</span>`).join(' ');

    return `
      <tr>
        <td>
          <a class="brg-matrix-chap-link" data-chap-id="${item.id}" href="${resolveUrl(item.url)}">${item.title}</a>
        </td>
        <td><span class="brg-stat-tag">${item.groupName}</span></td>
        <td><b>${item.cardCount}</b></td>
        <td><span style="color:#059669; font-weight:700;">${item.inDegree}</span> 次</td>
        <td><span style="color:#d97706; font-weight:700;">${item.outDegree}</span> 次</td>
        <td>${topOutRefs || '<span style="color:#929295; font-size:11px;">无跨章引用</span>'}</td>
      </tr>
    `;
  }).join('');
}

/** 渲染选中章节详情 */
function renderChapterDetails(chapterData: any) {
  const defaultView = document.querySelector('.brg-default-view') as HTMLElement;
  const detailView = document.querySelector('.brg-node-detail-view') as HTMLElement;
  if (!defaultView || !detailView) return;

  defaultView.style.display = 'none';
  detailView.style.display = 'block';

  const groupBadge = document.getElementById('brg-node-group-badge');
  const titleEl = document.getElementById('brg-node-title');
  const cardCountEl = document.getElementById('brg-node-card-count');
  const inDegreeEl = document.getElementById('brg-node-in-degree');
  const outDegreeEl = document.getElementById('brg-node-out-degree');
  const jumpBtn = document.getElementById('brg-node-jump-btn') as HTMLAnchorElement;
  const outRefsList = document.getElementById('brg-node-out-refs');
  const inRefsList = document.getElementById('brg-node-in-refs');
  const localCardsEl = document.getElementById('brg-node-local-cards');

  if (groupBadge) groupBadge.textContent = chapterData.groupName;
  if (titleEl) titleEl.textContent = chapterData.name || chapterData.title;
  if (cardCountEl) cardCountEl.textContent = String(chapterData.cardCount || 0);
  if (inDegreeEl) inDegreeEl.textContent = String(chapterData.inDegree || 0);
  if (outDegreeEl) outDegreeEl.textContent = String(chapterData.outDegree || 0);
  if (jumpBtn) {
    if (chapterData.url) {
      jumpBtn.href = resolveUrl(chapterData.url);
      jumpBtn.style.display = 'flex';
    } else {
      jumpBtn.style.display = 'none';
    }
  }

  // 渲染出链
  if (outRefsList) {
    const outCross = (chapterData.outReferences || []).filter((r: any) => r.isCrossChapter);
    if (outCross.length === 0) {
      outRefsList.innerHTML = '<li class="brg-ref-item" style="color:#929295; font-style:italic;">本章未引用外部章节模块</li>';
    } else {
      outRefsList.innerHTML = outCross.map((r: any) => `
        <li class="brg-ref-item">
          <span><b>${r.refText}</b> (${r.targetChapterTitle})</span>
          <a class="brg-ref-link" href="${resolveUrl(r.targetUrl)}">跳转 →</a>
        </li>
      `).join('');
    }
  }

  // 渲染入链
  if (inRefsList) {
    const inRefs = chapterData.inReferences || [];
    if (inRefs.length === 0) {
      inRefsList.innerHTML = '<li class="brg-ref-item" style="color:#929295; font-style:italic;">暂无其他章节引用本章</li>';
    } else {
      inRefsList.innerHTML = inRefs.map((r: any) => `
        <li class="brg-ref-item">
          <span>${r.sourceTitle}</span>
          <span class="brg-ref-tag">${r.refText}</span>
        </li>
      `).join('');
    }
  }

  // 渲染本章内部卡片
  if (localCardsEl) {
    const cards = chapterData.cards || [];
    if (cards.length === 0) {
      localCardsEl.innerHTML = '<span style="color:#929295; font-size:11px;">无独立卡片定义</span>';
    } else {
      localCardsEl.innerHTML = cards.map((c: any) => `
        <a class="brg-local-card-chip" href="${resolveUrl(chapterData.url)}#${c.anchor || ''}">
          ${c.title}
        </a>
      `).join('');
    }
  }
}

/** 渲染全局概览与核心枢纽榜 */
function renderDefaultOverview(data: any) {
  const defaultView = document.querySelector('.brg-default-view') as HTMLElement;
  const detailView = document.querySelector('.brg-node-detail-view') as HTMLElement;
  if (defaultView) defaultView.style.display = 'block';
  if (detailView) detailView.style.display = 'none';

  const hubsList = document.getElementById('brg-hubs-list');
  if (hubsList && data.topHubs) {
    hubsList.innerHTML = data.topHubs.map((hub: any) => `
      <li class="brg-hub-item" data-hub-name="${hub.name}">
        <span class="brg-hub-name">${hub.name}</span>
        <span class="brg-hub-badge">${hub.inDegree} 次被引</span>
      </li>
    `).join('');

    hubsList.querySelectorAll('.brg-hub-item').forEach((item) => {
      item.addEventListener('click', () => {
        const name = item.getAttribute('data-hub-name');
        const node = data.nodes.find((n: any) => n.name === name);
        if (node) {
          const matrixItem = data.matrix.find((m: any) => m.id === node.id);
          renderChapterDetails({ ...node, ...matrixItem });
        }
      });
    });
  }
}

/** 应用侧边栏按钮显示偏好设置 */
export function applyButtonVisibilityPref() {
  const isShow = localStorage.getItem(PREF_KEY_SHOW_BTN) !== 'false';
  const prefCheckbox = document.getElementById('brg-pref-show-sidebar-btn') as HTMLInputElement;
  if (prefCheckbox) prefCheckbox.checked = isShow;

  document.querySelectorAll('.relation-graph-trigger').forEach((btn) => {
    (btn as HTMLElement).style.display = isShow ? '' : 'none';
  });
}

let activeThemeObserver: MutationObserver | null = null;
let isRelationGraphGlobalBound = false;

/** 初始化关系图谱客户端控制器 */
export function initRelationGraphClient() {
  const root = document.getElementById('book-relation-graph-root');
  if (!root) return;

  // 1. Portal 提升至 document.body 直属层级（彻底避免父容器 stacking context / clipping 遮挡）
  if (root.parentElement !== document.body) {
    document.body.appendChild(root);
  }

  const colSlug = root.getAttribute('data-col') || '';
  const bookSlug = root.getAttribute('data-book') || '';
  const cacheKey = `${colSlug}-${bookSlug}`;

  // 应用用户按钮偏好
  applyButtonVisibilityPref();

  const prefCheckbox = document.getElementById('brg-pref-show-sidebar-btn') as HTMLInputElement;
  if (prefCheckbox && !prefCheckbox.dataset.bound) {
    prefCheckbox.dataset.bound = 'true';
    prefCheckbox.addEventListener('change', () => {
      const newShow = prefCheckbox.checked;
      localStorage.setItem(PREF_KEY_SHOW_BTN, newShow ? 'true' : 'false');
      applyButtonVisibilityPref();
    });
  }

  // 2. 模态窗开关与全局快捷键绑定
  function openModal() {
    root?.classList.add('open');
    loadAndRenderData();
  }

  function closeModal() {
    root?.classList.remove('open');
  }

  window.openBookRelationGraph = openModal;

  // 绑定所有触发按钮
  document.querySelectorAll('[data-open-relation-graph], .relation-graph-trigger').forEach((btn) => {
    if ((btn as HTMLElement).dataset.bound) return;
    (btn as HTMLElement).dataset.bound = 'true';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  });

  if (!isRelationGraphGlobalBound) {
    isRelationGraphGlobalBound = true;

    // 快捷键 Alt+G 开启 / Esc 关闭
    window.addEventListener('keydown', (e) => {
      const modalRoot = document.getElementById('book-relation-graph-root');
      if (!modalRoot) return;
      if ((e.altKey && e.code === 'KeyG') || (e.key === 'g' && e.altKey)) {
        e.preventDefault();
        if (modalRoot.classList.contains('open')) {
          modalRoot.classList.remove('open');
        } else {
          modalRoot.classList.add('open');
          loadAndRenderData();
        }
      } else if (e.key === 'Escape' && modalRoot.classList.contains('open')) {
        modalRoot.classList.remove('open');
      }
    });

    window.addEventListener('resize', () => {
      echartsInstance?.resize();
    });
  }

  const closeBtn = document.getElementById('brg-btn-close');
  if (closeBtn && !closeBtn.dataset.bound) {
    closeBtn.dataset.bound = 'true';
    closeBtn.addEventListener('click', closeModal);
  }

  const backdrop = root.querySelector('.brg-backdrop') as HTMLElement;
  if (backdrop && !backdrop.dataset.bound) {
    backdrop.dataset.bound = 'true';
    backdrop.addEventListener('click', closeModal);
  }

  // 全屏切换
  const fullscreenBtn = document.getElementById('brg-btn-fullscreen');
  if (fullscreenBtn && !fullscreenBtn.dataset.bound) {
    fullscreenBtn.dataset.bound = 'true';
    fullscreenBtn.addEventListener('click', () => {
      const modal = root.querySelector('.brg-modal');
      modal?.classList.toggle('fullscreen');
      setTimeout(() => echartsInstance?.resize(), 200);
    });
  }

  // 视角与层级过滤选择器
  const scopeSelect = document.getElementById('brg-scope-select') as HTMLSelectElement;
  scopeSelect?.addEventListener('change', () => {
    currentScopeMode = scopeSelect.value as any;
    if (currentGraphData && echartsInstance) {
      renderChartOption(getScopedData(), currentViewMode === 'matrix' ? 'force' : currentViewMode);
      echartsInstance.resize();
    }
  });

  let currentZoomLevel = 1;

  function zoomChart(factor: number) {
    if (!echartsInstance) return;

    const container = document.getElementById('brg-echarts-container');
    const width = container ? container.clientWidth / 2 : 400;
    const height = container ? container.clientHeight / 2 : 300;

    // 1. 优先触发 ECharts 官方 graphRoam 事件（必须包含 seriesIndex: 0 与中心原点 originX/Y）
    try {
      echartsInstance.dispatchAction({
        type: 'graphRoam',
        seriesIndex: 0,
        zoom: factor,
        originX: width,
        originY: height,
      });
    } catch (e) {
      // ignore
    }

    // 2. 补强更新 option series[0].zoom，确保在所有视图（如 Tree 思维导图与 Graph）中 100% 精准响应
    currentZoomLevel *= factor;
    try {
      echartsInstance.setOption({
        series: [{
          seriesIndex: 0,
          zoom: currentZoomLevel,
        }]
      });
    } catch (e) {
      // ignore
    }
  }

  // 左下角浮动操控台（放大 / 缩小 / 复位 / 物理开关）
  document.getElementById('brg-zoom-in')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    zoomChart(1.3);
  });

  document.getElementById('brg-zoom-out')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    zoomChart(0.75);
  });

  document.getElementById('brg-zoom-reset')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    currentZoomLevel = 1;
    if (echartsInstance && currentGraphData) {
      renderChartOption(getScopedData(), currentViewMode === 'matrix' ? 'force' : currentViewMode);
      try {
        echartsInstance.dispatchAction({
          type: 'graphRoam',
          seriesIndex: 0,
          zoom: 1,
        });
      } catch (err) {}
    }
  });

  const physicsBtn = document.getElementById('brg-toggle-physics');
  physicsBtn?.addEventListener('click', () => {
    isPhysicsEnabled = !isPhysicsEnabled;
    physicsBtn.classList.toggle('active', isPhysicsEnabled);
    if (echartsInstance && currentGraphData) {
      renderChartOption(getScopedData(), currentViewMode === 'matrix' ? 'force' : currentViewMode);
    }
  });

  // 视图切换 Tab
  const tabs = root.querySelectorAll('.brg-tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const view = tab.getAttribute('data-view') as any;
      currentViewMode = view;

      const canvasWrap = document.getElementById('brg-echarts-container');
      const matrixWrap = document.getElementById('brg-matrix-container');
      const toolbar = document.getElementById('brg-canvas-toolbar');

      if (view === 'matrix') {
        if (canvasWrap) canvasWrap.style.display = 'none';
        if (matrixWrap) matrixWrap.style.display = 'block';
        if (toolbar) toolbar.style.display = 'none';
        if (currentGraphData) renderMatrixView(getScopedData()?.matrix || currentGraphData.matrix);
      } else {
        if (canvasWrap) canvasWrap.style.display = 'block';
        if (matrixWrap) matrixWrap.style.display = 'none';
        if (toolbar) toolbar.style.display = 'flex';
        if (currentGraphData) {
          renderChartOption(getScopedData(), view);
          echartsInstance?.resize();
        }
      }
    });
  });

  // 搜索过滤
  const searchInput = document.getElementById('brg-search-input') as HTMLInputElement;
  const searchClear = document.getElementById('brg-search-clear') as HTMLButtonElement;

  function doSearch(kw: string) {
    const cleanKw = kw.trim().toLowerCase();
    if (searchClear) searchClear.style.display = cleanKw ? 'block' : 'none';

    const scopedData = getScopedData();
    if (!scopedData) return;

    if (currentViewMode === 'matrix') {
      const filtered = scopedData.matrix.filter((m: any) =>
        m.title.toLowerCase().includes(cleanKw) ||
        m.groupName.toLowerCase().includes(cleanKw) ||
        (m.outReferences && m.outReferences.some((r: any) => r.refText.toLowerCase().includes(cleanKw)))
      );
      renderMatrixView(filtered);
    } else if (echartsInstance) {
      if (!cleanKw) {
        renderChartOption(scopedData, currentViewMode);
        return;
      }
      echartsInstance.dispatchAction({ type: 'downplay' });
      scopedData.nodes.forEach((n: any) => {
        if (n.name.toLowerCase().includes(cleanKw) || n.groupName?.toLowerCase().includes(cleanKw)) {
          echartsInstance.dispatchAction({
            type: 'highlight',
            name: n.name,
          });
        }
      });
    }
  }

  if (searchInput && !searchInput.dataset.bound) {
    searchInput.dataset.bound = 'true';
    searchInput.addEventListener('input', (e: any) => doSearch(e.target.value));
  }
  if (searchClear && !searchClear.dataset.bound) {
    searchClear.dataset.bound = 'true';
    searchClear.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      doSearch('');
    });
  }

  // 主题变化监听（单例维护，断开旧观察者）
  if (activeThemeObserver) {
    activeThemeObserver.disconnect();
    activeThemeObserver = null;
  }
  activeThemeObserver = new MutationObserver(() => {
    if (echartsInstance && currentGraphData && currentViewMode !== 'matrix') {
      renderChartOption(getScopedData(), currentViewMode);
    }
  });
  activeThemeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });

  // 3. 加载与渲染数据
  async function loadAndRenderData() {
    const loadingMask = document.getElementById('brg-loading-mask');
    loadingMask?.classList.remove('hidden');

    try {
      if (!window.__BRG_CACHED_DATA__) window.__BRG_CACHED_DATA__ = {};

      if (!window.__BRG_CACHED_DATA__[cacheKey]) {
        let fetchedData = null;
        try {
          const res = await fetch(`/__relation_graph__/data?col=${colSlug}&book=${bookSlug}`);
          if (res.ok) fetchedData = await res.json();
        } catch {
          // dev endpoint not active
        }

        if (!fetchedData) {
          const res = await fetch(`/relation-graphs/${colSlug}-${bookSlug}.json`);
          if (res.ok) fetchedData = await res.json();
        }

        if (!fetchedData) throw new Error('无法获取书籍关系图谱数据');
        window.__BRG_CACHED_DATA__[cacheKey] = fetchedData;
      }

      currentGraphData = window.__BRG_CACHED_DATA__[cacheKey];

      // 填充统计指标
      const statChapters = document.getElementById('brg-stat-chapters');
      const statCrossRefs = document.getElementById('brg-stat-cross-refs');
      const statLinks = document.getElementById('brg-stat-links');

      if (statChapters) statChapters.textContent = `${currentGraphData.stats.totalChapters} 章节`;
      if (statCrossRefs) statCrossRefs.textContent = `${currentGraphData.stats.totalCrossReferences} 跨章引用`;
      if (statLinks) statLinks.textContent = `${currentGraphData.stats.totalLinks} 关联边`;

      // 渲染概览
      renderDefaultOverview(currentGraphData);

      // 加载 ECharts 并挂载实例
      const echartsLib = await ensureECharts();
      const container = document.getElementById('brg-echarts-container');
      if (container && !echartsInstance) {
        echartsInstance = echartsLib.init(container);

        echartsInstance.on('click', (params: any) => {
          if (params.dataType === 'node') {
            const n = params.data;
            if (n.isGroupNode) {
              if (searchInput) {
                searchInput.value = n.groupName;
                doSearch(n.groupName);
              }
              return;
            }
            const matrixItem = currentGraphData.matrix.find((m: any) => m.id === n.id);
            renderChapterDetails({ ...n, ...matrixItem });
          }
        });

        echartsInstance.on('dblclick', (params: any) => {
          if (params.dataType === 'node' && params.data.url) {
            window.location.href = resolveUrl(params.data.url);
          }
        });
      }

      renderChartOption(getScopedData(), currentViewMode === 'matrix' ? 'force' : currentViewMode);
      setTimeout(() => echartsInstance?.resize(), 50);

    } catch (err) {
      console.error('[relation-graph] 加载失败:', err);
    } finally {
      loadingMask?.classList.add('hidden');
    }
  }
}
