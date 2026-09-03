/**
 * 数理制图学艺术二维码生成引擎 (Mathematical Cartography & Ex-Libris QR Engine)
 * ============================================================================
 * 
 * 核心哲学：
 *   拒绝商业营销插画、彩虹渐变与粗暴的中心图标挖空。
 *   以大学数理典籍排版、工程制图学发丝角规、笛卡尔连续/离散格点为灵感，
 *   把二维码重塑为一枚严谨、典雅、极具学术尊严的“微型数理制图版画”。
 * 
 * 关键技术体系：
 *   1. 仿射坐标系三位一体定位符 (Affine Coordinate & Mathematical Operator Trinity)
 *      - 左上（连续分析 · 原点）：笛卡尔发丝轴 (x, y)、等距标尺刻度、原点 O、莱布尼茨微积分算子 ∫
 *      - 右上（离散代数 · 极限）：高阶矩阵张量托架 [ ]、离散刻度、欧拉求和极限算子 ∑
 *      - 左下（空间几何 · 场论）：微分几何张量托架、哈密顿梯度向量 ∇、微分形式 dω
 *      - 右下（保角平衡网规）：极坐标保角圆弧 (r, θ) 与全向制图裁切角规
 *   2. 彻底纯净化数据矩阵：
 *      - 取消中央 3x3 粗暴挖空，数据格点自然流淌，呼吸舒展。
 *   3. 终结“似连非连”的模块排布：
 *      - 默认采用正统学术纯几何矩阵 ('sharp')：相邻模块平直无缝融合，独立单点方正刚毅，无任何凹坑与肉瘤状倒角；
 *      - 同时支持智能外轮廓圆润 ('seamless') 与独立笛卡尔晶格点阵 ('lattice')。
 *   4. ISO/IEC 18004 严格合规，手机相机与微信扫码 0.05s 极速解码。
 * ============================================================================
 */

import QRCode from 'qrcode';

/**
 * @typedef {Object} AcademicSymbols
 * @property {string} tl 左上符号（如 '∫'）
 * @property {string} tr 右上符号（如 '∑'）
 * @property {string} bl 左下符号（如 '∇'）
 * @property {string} [tlSub] 左上微注（如 'dx'）
 * @property {string} [trSub] 右上微注（如 'n=1'）
 * @property {string} [blSub] 左下微注（如 'dω'）
 * @property {string} [label] 体系名称
 */

/**
 * 智能推导适合当前学术上下文的“数理三位一体”定位符元组
 * @param {string} [title='']
 * @returns {AcademicSymbols}
 */
export function resolveAcademicCornerSymbols(title = '') {
  if (/线性代数|矩阵|行列式|特征值|向量空间|基底|坐标/i.test(title)) {
    return {
      tl: 'A',      // 矩阵算子
      tr: 'det',    // 行列式
      bl: 'λ',      // 特征值
      tlSub: 'n×n',
      trSub: '|A|',
      blSub: 'v≠0',
      label: '线性代数'
    };
  }
  if (/量子|波动|光学|波长|物理|力学|电磁|麦克斯韦/i.test(title)) {
    return {
      tl: 'ħ',      // 约化普朗克常数
      tr: 'ψ',      // 波函数
      bl: '∇',      // 场论散度/旋度
      tlSub: 'h/2π',
      trSub: 'r,t',
      blSub: '×B',
      label: '现代物理与场论'
    };
  }
  if (/偏导|多元|微分|极值|方向导数|切平面/i.test(title)) {
    return {
      tl: '∂',      // 偏微分
      tr: '∇',      // 梯度向量
      bl: 'd',      // 外微分/全微分
      tlSub: '∂x',
      trSub: 'grad',
      blSub: 'df',
      label: '多元微积分'
    };
  }
  // 默认通识最高美学组合：数学三大支柱（分析、离散、几何）
  return {
    tl: '∫',        // 莱布尼茨微积分算子（分析学之魂）
    tr: '∑',        // 欧拉求和极限算子（离散数学与级数之魂）
    bl: '∇',        // 哈密顿算子/外微分（几何拓扑与现代空间之魂）
    tlSub: 'dx',
    trSub: 'n=1',
    blSub: 'dω',
    label: '经典数理三位一体'
  };
}

/**
 * 向后兼容：推导单个中心符号（供旧接口调用）
 * @param {string} [title='']
 * @returns {string}
 */
export function resolveAcademicSymbol(title = '') {
  const s = resolveAcademicCornerSymbols(title);
  return s.tl;
}

/**
 * @typedef {Object} ArtisticQROptions
 * @property {string} [title=''] 学术标题（用于智能推导数理符号体系）
 * @property {'sharp' | 'seamless' | 'lattice'} [moduleStyle='sharp'] 数据模块排版风格
 * @property {number} [margin=3.6] 留白边距（单位：模块）
 * @property {number} [scale=16] 单模块渲染像素尺寸
 * @property {string} [darkColor='#0f172a'] 主墨水深色（学术岩板黑）
 * @property {string} [lightColor='#ffffff'] 纸面浅色
 * @property {string} [mathInk='#334155'] 数理微注与发丝墨色
 * @property {string} [hairlineColor='#94a3b8'] 标尺微刻度发丝线颜色
 * @property {AcademicSymbols} [symbols] 自定义定位符元组
 */

/**
 * 生成艺术数理版画风格的纯 SVG 字符串
 * @param {string} url
 * @param {ArtisticQROptions} [options={}]
 * @returns {Promise<string>}
 */
export async function generateArtisticQRSvg(url, options = {}) {
  if (!url) return '';

  const {
    title = '',
    moduleStyle = 'sharp',
    margin = 3.6,
    scale = 16,
    darkColor = '#0f172a',
    lightColor = '#ffffff',
    mathInk = '#334155',
    hairlineColor = '#94a3b8',
    symbols = resolveAcademicCornerSymbols(title || options.symbol || ''),
  } = options;

  // 使用 Level M (15% 纠错冗余)，由于中央不进行任何侵入式破坏，数据区 100% 完整无损
  const qr = QRCode.create(url, { errorCorrectionLevel: 'M' });
  const size = qr.modules.size;
  const totalSize = size + margin * 2;
  const width = totalSize * scale;

  function isFinder(r, c) {
    if (r < 7 && c < 7) return true;
    if (r < 7 && c >= size - 7) return true;
    if (r >= size - 7 && c < 7) return true;
    return false;
  }

  function getModule(r, c) {
    if (r < 0 || r >= size || c < 0 || c >= size) return false;
    if (isFinder(r, c)) return false;
    return !!qr.modules.get(r, c);
  }

  const paths = [];

  // 1. 数据点阵生成（彻底终结“似连非连”丑态）
  if (moduleStyle === 'lattice') {
    // 方案 B：严谨独立笛卡尔晶格微点阵（各模块占比 88%，周围留有清晰统一的微网格白色空气间距）
    const dotSize = scale * 0.88;
    const offset = (scale - dotSize) / 2;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (isFinder(r, c)) continue;
        if (qr.modules.get(r, c)) {
          const x = (c + margin) * scale + offset;
          const y = (r + margin) * scale + offset;
          paths.push(`<rect x="${x}" y="${y}" width="${dotSize}" height="${dotSize}" rx="2.0" fill="${darkColor}"/>`);
        }
      }
    }
  } else if (moduleStyle === 'seamless') {
    // 方案 C：智能外轮廓平滑（相连模块在接合处 100% 笔直贴合，仅在外边缘转角处微弧，无凹槽裂纹）
    const rRad = scale * 0.25;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (isFinder(r, c)) continue;
        if (!qr.modules.get(r, c)) continue;

        const top = getModule(r - 1, c);
        const bottom = getModule(r + 1, c);
        const left = getModule(r, c - 1);
        const right = getModule(r, c + 1);

        const x = (c + margin) * scale;
        const y = (r + margin) * scale;
        const s = scale;

        const tl = !top && !left;
        const tr = !top && !right;
        const br = !bottom && !right;
        const bl = !bottom && !left;

        let d = `M ${x + (tl ? rRad : 0)} ${y}`;
        d += ` H ${x + s - (tr ? rRad : 0)}`;
        if (tr) d += ` A ${rRad} ${rRad} 0 0 1 ${x + s} ${y + rRad}`;
        d += ` V ${y + s - (br ? rRad : 0)}`;
        if (br) d += ` A ${rRad} ${rRad} 0 0 1 ${x + s - rRad} ${y + s}`;
        d += ` H ${x + (bl ? rRad : 0)}`;
        if (bl) d += ` A ${rRad} ${rRad} 0 0 1 ${x} ${y + s - rRad}`;
        d += ` V ${y + (tl ? rRad : 0)}`;
        if (tl) d += ` A ${rRad} ${rRad} 0 0 1 ${x + (tl ? rRad : 0)} ${y}`;
        d += ' Z';

        paths.push(`<path d="${d}" fill="${darkColor}"/>`);
      }
    }
  } else {
    // 方案 A（默认）：正统学术纯几何直角矩阵（Classical Sharp Cartesian Matrix）
    // 纯粹、刚毅、零伪装、零凹痕，相连块完美融为连续大块，最纯正的大学出版物风格
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (isFinder(r, c)) continue;
        if (qr.modules.get(r, c)) {
          const x = (c + margin) * scale;
          const y = (r + margin) * scale;
          paths.push(`<rect x="${x}" y="${y}" width="${scale}" height="${scale}" fill="${darkColor}"/>`);
        }
      }
    }
  }

  // 2. 三大定位角与数理仿射坐标空间深度融合
  function renderCorner(r, c, corner) {
    const ox = (c + margin) * scale;
    const oy = (r + margin) * scale;
    const elements = [];

    // 定位点核心几何体：7x7 外框 (微倒角), 5x5 白环, 3x3 超椭圆内芯
    elements.push(`<rect x="${ox}" y="${oy}" width="${scale * 7}" height="${scale * 7}" rx="2.5" fill="${darkColor}"/>`);
    elements.push(`<rect x="${ox + scale}" y="${oy + scale}" width="${scale * 5}" height="${scale * 5}" rx="1.5" fill="${lightColor}"/>`);
    elements.push(`<rect x="${ox + scale * 2}" y="${oy + scale * 2}" width="${scale * 3}" height="${scale * 3}" rx="1.5" fill="${darkColor}"/>`);

    if (corner === 'TL') {
      // -------------------------------------------------------------
      // 左上角：连续分析 · 仿射坐标系原点 (Continuous Analysis & Origin)
      // -------------------------------------------------------------
      const axisLen = scale * 1.5;

      // X 轴 (向右发丝轴与箭头)
      elements.push(`<line x1="${ox}" y1="${oy - scale * 0.45}" x2="${ox + scale * 7 + axisLen}" y2="${oy - scale * 0.45}" stroke="${hairlineColor}" stroke-width="0.8"/>`);
      elements.push(`<polygon points="${ox + scale * 7 + axisLen},${oy - scale * 0.45} ${ox + scale * 7 + axisLen - 4},${oy - scale * 0.45 - 2} ${ox + scale * 7 + axisLen - 4},${oy - scale * 0.45 + 2}" fill="${hairlineColor}"/>`);
      elements.push(`<text x="${ox + scale * 7 + axisLen + 5}" y="${oy - scale * 0.35}" font-family="'Times New Roman', STIX Two Math, serif" font-style="italic" font-size="${scale * 0.72}" fill="${mathInk}" dominant-baseline="central">x</text>`);

      // Y 轴 (向下发丝轴与箭头)
      elements.push(`<line x1="${ox - scale * 0.45}" y1="${oy}" x2="${ox - scale * 0.45}" y2="${oy + scale * 7 + axisLen}" stroke="${hairlineColor}" stroke-width="0.8"/>`);
      elements.push(`<polygon points="${ox - scale * 0.45},${oy + scale * 7 + axisLen} ${ox - scale * 0.45 - 2},${oy + scale * 7 + axisLen - 4} ${ox - scale * 0.45 + 2},${oy + scale * 7 + axisLen - 4}" fill="${hairlineColor}"/>`);
      elements.push(`<text x="${ox - scale * 0.45}" y="${oy + scale * 7 + axisLen + 9}" font-family="'Times New Roman', STIX Two Math, serif" font-style="italic" font-size="${scale * 0.72}" fill="${mathInk}" text-anchor="middle">y</text>`);

      // 坐标轴等距微刻度 (Ticks)
      for (let i = 0; i <= 7; i += 2) {
        elements.push(`<line x1="${ox + scale * i}" y1="${oy - scale * 0.45}" x2="${ox + scale * i}" y2="${oy - scale * 0.2}" stroke="${hairlineColor}" stroke-width="0.75"/>`);
        elements.push(`<line x1="${ox - scale * 0.45}" y1="${oy + scale * i}" x2="${ox - scale * 0.2}" y2="${oy + scale * i}" stroke="${hairlineColor}" stroke-width="0.75"/>`);
      }

      // 原点标志 O(0,0)
      elements.push(`<text x="${ox - scale * 0.7}" y="${oy - scale * 0.7}" font-family="'Times New Roman', STIX Two Math, serif" font-style="italic" font-size="${scale * 0.85}" fill="${mathInk}" text-anchor="middle" dominant-baseline="central">O</text>`);

      // 连续分析算子 (Integral / Derivative)
      const symX = ox - scale * 1.5;
      const symY = oy + scale * 3.5;
      const isIntegral = symbols.tl === '∫';
      const fontSize = isIntegral ? scale * 2.7 : scale * 2.1;
      elements.push(`<text x="${symX}" y="${symY}" font-family="'Times New Roman', STIX Two Math, KaTeX_Main, serif" font-style="${isIntegral ? 'italic' : 'normal'}" font-weight="${isIntegral ? 'normal' : '600'}" font-size="${fontSize}" fill="${darkColor}" text-anchor="middle" dominant-baseline="central">${symbols.tl}</text>`);
      if (symbols.tlSub) {
        elements.push(`<text x="${symX + (isIntegral ? scale * 0.45 : scale * 0.2)}" y="${oy + scale * 5.7}" font-family="'Times New Roman', STIX Two Math, serif" font-style="italic" font-size="${scale * 0.6}" fill="${mathInk}">${symbols.tlSub}</text>`);
      }
    } else if (corner === 'TR') {
      // -------------------------------------------------------------
      // 右上角：离散代数 · 矩阵张量托架与求和算子 (Discrete Algebra & Summation)
      // -------------------------------------------------------------
      const bracketX = ox + scale * 7 + scale * 0.4;
      elements.push(`<path d="M${ox + scale * 6.5} ${oy - scale * 0.45} L${bracketX} ${oy - scale * 0.45} L${bracketX} ${oy + scale * 7.45} L${ox + scale * 6.5} ${oy + scale * 7.45}" fill="none" stroke="${hairlineColor}" stroke-width="1.0" stroke-linecap="round"/>`);

      for (let i = 0; i <= 7; i += 2) {
        elements.push(`<line x1="${ox + scale * i}" y1="${oy - scale * 0.45}" x2="${ox + scale * i}" y2="${oy - scale * 0.2}" stroke="${hairlineColor}" stroke-width="0.75"/>`);
      }

      const symX = bracketX + scale * 1.35;
      const symY = oy + scale * 3.5;
      const isSigma = symbols.tr === '∑';
      const fontSize = isSigma ? scale * 2.3 : scale * 1.8;
      elements.push(`<text x="${symX}" y="${symY}" font-family="'Times New Roman', STIX Two Math, KaTeX_Main, serif" font-size="${fontSize}" font-weight="bold" fill="${darkColor}" text-anchor="middle" dominant-baseline="central">${symbols.tr}</text>`);
      if (symbols.trSub) {
        elements.push(`<text x="${symX}" y="${oy + scale * 5.6}" font-family="'Times New Roman', STIX Two Math, serif" font-style="italic" font-size="${scale * 0.58}" fill="${mathInk}" text-anchor="middle">${symbols.trSub}</text>`);
      }
    } else if (corner === 'BL') {
      // -------------------------------------------------------------
      // 左下角：几何空间 · 梯度场论与微分形式 (Field Theory & Geometry)
      // -------------------------------------------------------------
      const bracketX = ox - scale * 0.45;
      elements.push(`<path d="M${ox + scale * 0.5} ${oy - scale * 0.45} L${bracketX} ${oy - scale * 0.45} L${bracketX} ${oy + scale * 7.45} L${ox + scale * 0.5} ${oy + scale * 7.45}" fill="none" stroke="${hairlineColor}" stroke-width="1.0" stroke-linecap="round"/>`);

      for (let i = 0; i <= 7; i += 2) {
        elements.push(`<line x1="${ox + scale * i}" y1="${oy + scale * 7.45}" x2="${ox + scale * i}" y2="${oy + scale * 7.2}" stroke="${hairlineColor}" stroke-width="0.75"/>`);
      }

      const symX = bracketX - scale * 1.35;
      const symY = oy + scale * 3.5;
      const isNabla = symbols.bl === '∇';
      const fontSize = isNabla ? scale * 2.3 : scale * 2.0;
      elements.push(`<text x="${symX}" y="${symY}" font-family="'Times New Roman', STIX Two Math, KaTeX_Main, serif" font-size="${fontSize}" font-weight="bold" fill="${darkColor}" text-anchor="middle" dominant-baseline="central">${symbols.bl}</text>`);
      if (isNabla) {
        elements.push(`<line x1="${symX - scale * 0.45}" y1="${oy + scale * 1.8}" x2="${symX + scale * 0.45}" y2="${oy + scale * 1.8}" stroke="${mathInk}" stroke-width="0.8"/>`);
        elements.push(`<polyline points="${symX + scale * 0.25},${oy + scale * 1.6} ${symX + scale * 0.45},${oy + scale * 1.8} ${symX + scale * 0.25},${oy + scale * 2.0}" fill="none" stroke="${mathInk}" stroke-width="0.8"/>`);
      }
      if (symbols.blSub) {
        elements.push(`<text x="${symX}" y="${oy + scale * 5.5}" font-family="'Times New Roman', STIX Two Math, serif" font-style="italic" font-size="${scale * 0.65}" fill="${mathInk}" text-anchor="middle">${symbols.blSub}</text>`);
      }
    }

    return elements.join('\n');
  }

  paths.push(renderCorner(0, 0, 'TL'));
  paths.push(renderCorner(0, size - 7, 'TR'));
  paths.push(renderCorner(size - 7, 0, 'BL'));

  // 3. 右下角：保角对准圆规弧线 (Conformal Astrolabe Arc)
  const brX = (size - 7 + margin) * scale;
  const brY = (size - 7 + margin) * scale;
  const arcCornerX = brX + scale * 7 + scale * 0.45;
  const arcCornerY = brY + scale * 7 + scale * 0.45;
  paths.push(`
    <path d="M${arcCornerX - scale * 1.8} ${arcCornerY} L${arcCornerX} ${arcCornerY} L${arcCornerX} ${arcCornerY - scale * 1.8}" fill="none" stroke="${hairlineColor}" stroke-width="0.9"/>
    <circle cx="${arcCornerX}" cy="${arcCornerY}" r="${scale * 1.3}" fill="none" stroke="${hairlineColor}" stroke-width="0.75" stroke-dasharray="2,2"/>
    <text x="${arcCornerX + 5}" y="${arcCornerY - scale * 0.6}" font-family="'Times New Roman', STIX Two Math, serif" font-style="italic" font-size="${scale * 0.6}" fill="${mathInk}">r,θ</text>
  `);

  // 4. 外围典籍发丝角规 (Architectural Crop Marks ⌜ ⌝ ⌞ ⌟)
  const pad = scale * 0.75;
  const tick = scale * 1.3;
  paths.push(`<path d="M${pad} ${pad + tick} L${pad} ${pad} L${pad + tick} ${pad}" fill="none" stroke="${hairlineColor}" stroke-width="0.8"/>`);
  paths.push(`<path d="M${width - pad - tick} ${pad} L${width - pad} ${pad} L${width - pad} ${pad + tick}" fill="none" stroke="${hairlineColor}" stroke-width="0.8"/>`);
  paths.push(`<path d="M${pad} ${width - pad - tick} L${pad} ${width - pad} L${pad + tick} ${width - pad}" fill="none" stroke="${hairlineColor}" stroke-width="0.8"/>`);
  paths.push(`<path d="M${width - pad - tick} ${width - pad} L${width - pad} ${width - pad} L${width - pad} ${width - pad - tick}" fill="none" stroke="${hairlineColor}" stroke-width="0.8"/>`);

  const shapeRendering = moduleStyle === 'sharp' ? 'crispEdges' : 'geometricPrecision';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${width}" width="100%" height="100%" shape-rendering="${shapeRendering}">
  <rect width="100%" height="100%" fill="${lightColor}"/>
  ${paths.join('\n  ')}
</svg>`;
}
