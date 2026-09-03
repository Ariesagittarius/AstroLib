#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const singleFileArg = args.find((_, i, arr) => arr[i - 1] === '--file');
const bookSlugArg = args.find((_, i, arr) => arr[i - 1] === '--book');
const isJsonOutput = args.includes('--json');
const isVerbose = args.includes('--verbose');

function getMdxFiles(targetPath) {
  if (!fs.existsSync(targetPath)) return [];
  const stat = fs.statSync(targetPath);
  if (!stat.isDirectory()) {
    return targetPath.endsWith('.mdx') ? [targetPath] : [];
  }
  const files = [];
  for (const entry of fs.readdirSync(targetPath, { withFileTypes: true })) {
    const full = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'images' && entry.name !== '.git' && entry.name !== 'node_modules') {
        files.push(...getMdxFiles(full));
      }
    } else if (entry.name.endsWith('.mdx')) {
      files.push(full);
    }
  }
  return files;
}

function isImageLine(line) {
  const trimmed = line.trim();
  return /!\[.*?\]\((images\/[^)]+)\)/.test(trimmed) || /<img\b[^>]*src=["'](images\/[^"']+)["']/.test(trimmed);
}

function extractImagePaths(text) {
  const images = [];
  const mdRegex = /!\[.*?\]\((images\/[^)]+)\)/g;
  let match;
  while ((match = mdRegex.exec(text)) !== null) {
    images.push(match[1]);
  }
  const htmlRegex = /<img\b[^>]*src=["'](images\/[^"']+)["']/g;
  while ((match = htmlRegex.exec(text)) !== null) {
    images.push(match[1]);
  }
  return images;
}

function isCaptionCandidate(line) {
  const trimmed = line.trim();

  if (/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/.test(trimmed)) {
    return true;
  }

  if (/^(?:如图|由图|在图|根据图|设图|从图|按图)/.test(trimmed)) {
    return false;
  }

  if (/^(?:图|Figure|附图)\s*[\d\.\-－]+/.test(trimmed)) {
    if (trimmed.length > 75) return false;

    if (/[。？！?!]$/.test(trimmed) && trimmed.length > 35) return false;
    return true;
  }

  if (/^\(?\$?[a-zA-Z0-9]\$?\)?[ \t\S]*(?:图|Figure)\s*[\d\.\-－]+/.test(trimmed)) {
    return trimmed.length <= 75;
  }
  return false;
}

function isSubfigureLabel(line) {
  const trimmed = line.trim();
  return /^\(?\$?[a-dA-D1-4]\$?\)?[ \t\u3000]/.test(trimmed) && trimmed.length < 50;
}

function isSentenceBroken(prevLine, nextLine) {
  if (!prevLine || !nextLine) return false;
  const p = prevLine.trim();
  const n = nextLine.trim();

  const prevHanging = /([，,、:：有且为是与和及或]|当|若|使|设|在|由|得到|记作|可得|恒有|此时)$/.test(p);

  const dollarCount = (p.match(/\$/g) || []).length;
  const unclosedDollar = dollarCount % 2 !== 0;

  const nextStartsSentence = /^(则|即|故|恒有|由此|其中|式中|\$\$|\$|[a-z0-9\(\[\{])/.test(n);

  return prevHanging || unclosedDollar || (nextStartsSentence && !/^[#<]/.test(n));
}

export function analyzeMdxFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const relPath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');

  const imageOccurrences = [];
  const captionOccurrences = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isImageLine(line)) {
      const imgPaths = extractImagePaths(line);
      for (const imgPath of imgPaths) {
        imageOccurrences.push({
          lineIdx: i,
          lineNum: i + 1,
          rawLine: line,
          imgPath,
        });
      }
    }
    if (isCaptionCandidate(line)) {
      captionOccurrences.push({
        lineIdx: i,
        lineNum: i + 1,
        rawLine: line,
        text: line.trim(),
      });
    }
  }

  const anomalies = [];
  const pairedImageIndices = new Set();
  const pairedCaptionIndices = new Set();

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<figure')) {
      let figEnd = i;
      while (figEnd < lines.length && !lines[figEnd].includes('</figure>')) {
        figEnd++;
      }
      for (let j = 0; j < imageOccurrences.length; j++) {
        if (imageOccurrences[j].lineIdx >= i && imageOccurrences[j].lineIdx <= figEnd) {
          pairedImageIndices.add(j);
        }
      }
      for (let k = 0; k < captionOccurrences.length; k++) {
        if (captionOccurrences[k].lineIdx >= i && captionOccurrences[k].lineIdx <= figEnd) {
          pairedCaptionIndices.add(k);
        }
      }
    }
  }

  for (let imgIdx = 0; imgIdx < imageOccurrences.length; imgIdx++) {
    if (pairedImageIndices.has(imgIdx)) continue;
    const img = imageOccurrences[imgIdx];

    let nearestCap = null;
    let nearestCapDist = Infinity;

    for (let capIdx = 0; capIdx < captionOccurrences.length; capIdx++) {
      const cap = captionOccurrences[capIdx];
      if (cap.lineIdx > img.lineIdx && cap.lineIdx - img.lineIdx <= 15) {
        const dist = cap.lineIdx - img.lineIdx;
        if (dist < nearestCapDist) {
          nearestCapDist = dist;
          nearestCap = { cap, capIdx };
        }
      }
    }

    if (nearestCap) {
      let hasInterveningContent = false;
      const textBetween = [];

      for (let j = img.lineIdx + 1; j < nearestCap.cap.lineIdx; j++) {
        const betweenLine = lines[j].trim();
        if (betweenLine.length === 0) continue;
        if (isImageLine(betweenLine) || isSubfigureLabel(betweenLine)) continue;

        hasInterveningContent = true;
        textBetween.push({ lineNum: j + 1, text: betweenLine });
      }

      if (!hasInterveningContent) {
        pairedImageIndices.add(imgIdx);
        pairedCaptionIndices.add(nearestCap.capIdx);
      } else {
        pairedImageIndices.add(imgIdx);
        pairedCaptionIndices.add(nearestCap.capIdx);

        const startLine = Math.max(0, img.lineIdx - 3);
        const endLine = Math.min(lines.length - 1, nearestCap.cap.lineIdx + 4);
        const contextLines = lines.slice(startLine, endLine + 1);

        anomalies.push({
          type: 'SEPARATED_PAIR',
          title: `图文错位（相隔 ${nearestCapDist} 行）`,
          imageLine: img.lineNum,
          imgPath: img.imgPath,
          captionLine: nearestCap.cap.lineNum,
          captionText: nearestCap.cap.text,
          startLine: startLine + 1,
          endLine: endLine + 1,
          textBetweenCount: textBetween.length,
          sampleIntervening: textBetween[0]?.text.slice(0, 60),
          contextSnippet: contextLines.join('\n'),
        });
      }
    } else {
      let isCluster = false;
      if (imgIdx + 1 < imageOccurrences.length && imageOccurrences[imgIdx + 1].lineIdx - img.lineIdx <= 3) {
        isCluster = true;
      }
      if (imgIdx > 0 && img.lineIdx - imageOccurrences[imgIdx - 1].lineIdx <= 3) {
        isCluster = true;
      }

      if (!isCluster) {
        const startLine = Math.max(0, img.lineIdx - 2);
        const endLine = Math.min(lines.length - 1, img.lineIdx + 3);
        anomalies.push({
          type: 'UNBOUND_IMAGE',
          title: '未绑定图注的图片',
          imageLine: img.lineNum,
          imgPath: img.imgPath,
          captionLine: null,
          captionText: null,
          startLine: startLine + 1,
          endLine: endLine + 1,
          contextSnippet: lines.slice(startLine, endLine + 1).join('\n'),
        });
      }
    }
  }

  for (let capIdx = 0; capIdx < captionOccurrences.length; capIdx++) {
    if (pairedCaptionIndices.has(capIdx)) continue;
    const cap = captionOccurrences[capIdx];

    const prevLine = cap.lineIdx > 0 ? lines[cap.lineIdx - 1] : '';
    const nextLine = cap.lineIdx + 1 < lines.length ? lines[cap.lineIdx + 1] : '';
    const sentenceBroken = isSentenceBroken(prevLine, nextLine);

    const startLine = Math.max(0, cap.lineIdx - 4);
    const endLine = Math.min(lines.length - 1, cap.lineIdx + 4);

    anomalies.push({
      type: 'ORPHAN_CAPTION',
      title: sentenceBroken ? '孤立图注（腰斩正文断句）' : '孤立图注（上方无直接关联图片）',
      imageLine: null,
      imgPath: null,
      captionLine: cap.lineNum,
      captionText: cap.text,
      isSentenceBroken: sentenceBroken,
      startLine: startLine + 1,
      endLine: endLine + 1,
      contextSnippet: lines.slice(startLine, endLine + 1).join('\n'),
    });
  }

  return {
    filePath,
    relPath,
    totalImages: imageOccurrences.length,
    totalCaptions: captionOccurrences.length,
    anomalies,
  };
}

async function main() {
  console.log('===============================================================');
  console.log('🔍 图像与图注智能初筛审计系统 (Zero False Negatives Heuristic)');
  console.log('===============================================================');

  let targetPath = 'src/content/docs/collections';
  if (singleFileArg) {
    targetPath = singleFileArg;
  } else if (bookSlugArg) {
    targetPath = `src/content/docs/collections/math/${bookSlugArg}`;
    if (!fs.existsSync(targetPath)) {
      targetPath = `src/content/docs/collections/science/${bookSlugArg}`;
    }
  }

  const files = getMdxFiles(targetPath);
  console.log(`扫描路径: ${targetPath}`);
  console.log(`发现 MDX 章节总数: ${files.length}\n`);

  let totalImagesScanned = 0;
  let totalCaptionsScanned = 0;
  let totalAnomalies = 0;
  let filesWithAnomaliesCount = 0;

  const anomalyTypeCounts = {
    SEPARATED_PAIR: 0,
    ORPHAN_CAPTION: 0,
    UNBOUND_IMAGE: 0,
  };

  const auditResults = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const res = analyzeMdxFile(file);

    totalImagesScanned += res.totalImages;
    totalCaptionsScanned += res.totalCaptions;

    if (res.anomalies.length > 0) {
      filesWithAnomaliesCount++;
      totalAnomalies += res.anomalies.length;
      auditResults.push(res);

      for (const a of res.anomalies) {
        anomalyTypeCounts[a.type] = (anomalyTypeCounts[a.type] || 0) + 1;
      }

      console.log(`⚠️ [${res.relPath}] 发现 ${res.anomalies.length} 处疑似排版瑕疵:`);
      for (const a of res.anomalies) {
        if (a.type === 'SEPARATED_PAIR') {
          console.log(`   🔸 [L${a.imageLine} -> L${a.captionLine}] ${a.title}: ${a.captionText} (中间夹杂 ${a.textBetweenCount} 行正文: "${a.sampleIntervening}...")`);
        } else if (a.type === 'ORPHAN_CAPTION') {
          console.log(`   🔹 [L${a.captionLine}] ${a.title}: "${a.captionText}"`);
        } else if (a.type === 'UNBOUND_IMAGE') {
          console.log(`   ◽ [L${a.imageLine}] ${a.title}: ${a.imgPath}`);
        }
      }

      if (isVerbose) {
        console.log('   --- 源码切片预览 ---');
        for (const a of res.anomalies) {
          console.log(`   [Lines ${a.startLine}-${a.endLine}]:\n${a.contextSnippet.split('\n').map(l => '     | ' + l).join('\n')}\n`);
        }
      }
      console.log('');
    }
  }

  console.log('======================== 审计汇总大盘 ========================');
  console.log(`扫描章节总数: ${files.length}`);
  console.log(`图像总引用数: ${totalImagesScanned}`);
  console.log(`图注总候选数: ${totalCaptionsScanned}`);
  console.log(`存在瑕疵章节: ${filesWithAnomaliesCount} (${((filesWithAnomaliesCount / Math.max(1, files.length)) * 100).toFixed(1)}%)`);
  console.log(`疑似异常总数: ${totalAnomalies}`);
  console.log(`  - 图文远距错位 (SEPARATED_PAIR): ${anomalyTypeCounts.SEPARATED_PAIR}`);
  console.log(`  - 孤立/断句图注 (ORPHAN_CAPTION): ${anomalyTypeCounts.ORPHAN_CAPTION}`);
  console.log(`  - 无注独立图片 (UNBOUND_IMAGE):  ${anomalyTypeCounts.UNBOUND_IMAGE}`);
  console.log('===============================================================');

  const taskDir = path.join(process.cwd(), 'task');
  if (!fs.existsSync(taskDir)) fs.mkdirSync(taskDir, { recursive: true });
  const reportPath = path.join(taskDir, 'figure_audit_report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    summary: {
      totalFiles: files.length,
      totalImages: totalImagesScanned,
      totalCaptions: totalCaptionsScanned,
      filesWithAnomalies: filesWithAnomaliesCount,
      totalAnomalies,
      anomalyTypeCounts,
    },
    auditResults,
  }, null, 2), 'utf8');
  console.log(`📄 完整审计数据集已写入: ${reportPath}`);
}

import { fileURLToPath } from 'node:url';

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch(err => {
    console.error('Fatal error in figure screening:', err);
    process.exit(1);
  });
}
