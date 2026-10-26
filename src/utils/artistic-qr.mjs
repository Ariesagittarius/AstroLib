import QRCode from 'qrcode';

export function resolveAcademicCornerSymbols(title = '') {
  if (/线性代数|矩阵|行列式|特征值|向量空间|基底|坐标/i.test(title)) {
    return {
      tl: 'A',
      tr: 'det',
      bl: 'λ',
      tlSub: 'n×n',
      trSub: '|A|',
      blSub: 'v≠0',
      label: '线性代数'
    };
  }
  if (/量子|波动|光学|波长|物理|力学|电磁|麦克斯韦/i.test(title)) {
    return {
      tl: 'ħ',
      tr: 'ψ',
      bl: '∇',
      tlSub: 'h/2π',
      trSub: 'r,t',
      blSub: '×B',
      label: '现代物理与场论'
    };
  }
  if (/偏导|多元|微分|极值|方向导数|切平面/i.test(title)) {
    return {
      tl: '∂',
      tr: '∇',
      bl: 'd',
      tlSub: '∂x',
      trSub: 'grad',
      blSub: 'df',
      label: '多元微积分'
    };
  }

  return {
    tl: '∫',
    tr: '∑',
    bl: '∇',
    tlSub: 'dx',
    trSub: 'n=1',
    blSub: 'dω',
    label: '经典数理三位一体'
  };
}

export function resolveAcademicSymbol(title = '') {
  const s = resolveAcademicCornerSymbols(title);
  return s.tl;
}

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

  if (moduleStyle === 'lattice') {

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

  function renderCorner(r, c, corner) {
    const ox = (c + margin) * scale;
    const oy = (r + margin) * scale;
    const elements = [];

    elements.push(`<rect x="${ox}" y="${oy}" width="${scale * 7}" height="${scale * 7}" rx="2.5" fill="${darkColor}"/>`);
    elements.push(`<rect x="${ox + scale}" y="${oy + scale}" width="${scale * 5}" height="${scale * 5}" rx="1.5" fill="${lightColor}"/>`);
    elements.push(`<rect x="${ox + scale * 2}" y="${oy + scale * 2}" width="${scale * 3}" height="${scale * 3}" rx="1.5" fill="${darkColor}"/>`);

    if (corner === 'TL') {

      const axisLen = scale * 1.5;

      elements.push(`<line x1="${ox}" y1="${oy - scale * 0.45}" x2="${ox + scale * 7 + axisLen}" y2="${oy - scale * 0.45}" stroke="${hairlineColor}" stroke-width="0.8"/>`);
      elements.push(`<polygon points="${ox + scale * 7 + axisLen},${oy - scale * 0.45} ${ox + scale * 7 + axisLen - 4},${oy - scale * 0.45 - 2} ${ox + scale * 7 + axisLen - 4},${oy - scale * 0.45 + 2}" fill="${hairlineColor}"/>`);
      elements.push(`<text x="${ox + scale * 7 + axisLen + 5}" y="${oy - scale * 0.35}" font-family="'Times New Roman', STIX Two Math, serif" font-style="italic" font-size="${scale * 0.72}" fill="${mathInk}" dominant-baseline="central">x</text>`);

      elements.push(`<line x1="${ox - scale * 0.45}" y1="${oy}" x2="${ox - scale * 0.45}" y2="${oy + scale * 7 + axisLen}" stroke="${hairlineColor}" stroke-width="0.8"/>`);
      elements.push(`<polygon points="${ox - scale * 0.45},${oy + scale * 7 + axisLen} ${ox - scale * 0.45 - 2},${oy + scale * 7 + axisLen - 4} ${ox - scale * 0.45 + 2},${oy + scale * 7 + axisLen - 4}" fill="${hairlineColor}"/>`);
      elements.push(`<text x="${ox - scale * 0.45}" y="${oy + scale * 7 + axisLen + 9}" font-family="'Times New Roman', STIX Two Math, serif" font-style="italic" font-size="${scale * 0.72}" fill="${mathInk}" text-anchor="middle">y</text>`);

      for (let i = 0; i <= 7; i += 2) {
        elements.push(`<line x1="${ox + scale * i}" y1="${oy - scale * 0.45}" x2="${ox + scale * i}" y2="${oy - scale * 0.2}" stroke="${hairlineColor}" stroke-width="0.75"/>`);
        elements.push(`<line x1="${ox - scale * 0.45}" y1="${oy + scale * i}" x2="${ox - scale * 0.2}" y2="${oy + scale * i}" stroke="${hairlineColor}" stroke-width="0.75"/>`);
      }

      elements.push(`<text x="${ox - scale * 0.7}" y="${oy - scale * 0.7}" font-family="'Times New Roman', STIX Two Math, serif" font-style="italic" font-size="${scale * 0.85}" fill="${mathInk}" text-anchor="middle" dominant-baseline="central">O</text>`);

      const symX = ox - scale * 1.5;
      const symY = oy + scale * 3.5;
      const isIntegral = symbols.tl === '∫';
      const fontSize = isIntegral ? scale * 2.7 : scale * 2.1;
      elements.push(`<text x="${symX}" y="${symY}" font-family="'Times New Roman', STIX Two Math, KaTeX_Main, serif" font-style="${isIntegral ? 'italic' : 'normal'}" font-weight="${isIntegral ? 'normal' : '600'}" font-size="${fontSize}" fill="${darkColor}" text-anchor="middle" dominant-baseline="central">${symbols.tl}</text>`);
      if (symbols.tlSub) {
        elements.push(`<text x="${symX + (isIntegral ? scale * 0.45 : scale * 0.2)}" y="${oy + scale * 5.7}" font-family="'Times New Roman', STIX Two Math, serif" font-style="italic" font-size="${scale * 0.6}" fill="${mathInk}">${symbols.tlSub}</text>`);
      }
    } else if (corner === 'TR') {

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

  const brX = (size - 7 + margin) * scale;
  const brY = (size - 7 + margin) * scale;
  const arcCornerX = brX + scale * 7 + scale * 0.45;
  const arcCornerY = brY + scale * 7 + scale * 0.45;
  paths.push(`
    <path d="M${arcCornerX - scale * 1.8} ${arcCornerY} L${arcCornerX} ${arcCornerY} L${arcCornerX} ${arcCornerY - scale * 1.8}" fill="none" stroke="${hairlineColor}" stroke-width="0.9"/>
    <circle cx="${arcCornerX}" cy="${arcCornerY}" r="${scale * 1.3}" fill="none" stroke="${hairlineColor}" stroke-width="0.75" stroke-dasharray="2,2"/>
    <text x="${arcCornerX + 5}" y="${arcCornerY - scale * 0.6}" font-family="'Times New Roman', STIX Two Math, serif" font-style="italic" font-size="${scale * 0.6}" fill="${mathInk}">r,θ</text>
  `);

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
