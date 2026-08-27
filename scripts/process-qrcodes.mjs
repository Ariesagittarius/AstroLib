#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import jsQR from 'jsqr';

const targetDirArg = process.argv[2] || 'src/content/docs/collections/math/engineering_analysis';
const targetDir = path.resolve(process.cwd(), targetDirArg);

if (!fs.existsSync(targetDir)) {
  console.error(`[process-qrcodes] 目标目录不存在: ${targetDir}`);
  process.exit(1);
}

const imagesDir = path.join(targetDir, 'images');

async function decodeQRCode(imgPath) {
  try {
    const { data, info } = await sharp(imgPath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const code = jsQR(new Uint8ClampedArray(data), info.width, info.height);
    if (code && code.data) {
      return code.data.trim();
    }
  } catch (err) {

  }
  return null;
}

async function main() {
  console.log(`== 1. 扫描与检测图片目录: ${imagesDir} ==`);
  const qrImageMap = new Map();

  if (fs.existsSync(imagesDir)) {
    const files = fs.readdirSync(imagesDir);
    let checkedCount = 0;

    for (const file of files) {
      if (/\.(png|jpe?g|webp)$/i.test(file)) {
        checkedCount++;
        const imgPath = path.join(imagesDir, file);
        const url = await decodeQRCode(imgPath);
        if (url) {
          qrImageMap.set(file, url);
        }
      }
    }
    console.log(`检查了 ${checkedCount} 张图片，成功检测并提取出 ${qrImageMap.size} 个二维码。`);
  }

  console.log(`\n== 2. 扫描与改写 MDX 文件 ==`);
  const mdxFiles = fs.readdirSync(targetDir).filter((f) => f.endsWith('.mdx'));
  let updatedMdxCount = 0;
  let totalReplacements = 0;
  const convertedImageFiles = new Set();

  for (const mdxFile of mdxFiles) {
    const filePath = path.join(targetDir, mdxFile);
    let content = fs.readFileSync(filePath, 'utf-8');

    for (const [imgName, url] of qrImageMap.entries()) {
      const reg = new RegExp(`!\\[.*?\\]\\(images\\/${imgName.replace(/\./g, '\\.')}\\)`, 'g');
      if (reg.test(content)) {
        content = content.replace(reg, `<QRCodeVideo url="${url}" />`);
        convertedImageFiles.add(imgName);
      }
    }

    const lines = content.split(/\r?\n/);
    const toRemoveIndices = new Set();
    const qrVideoUpdates = new Map();

    const qrVideoIndices = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('<QRCodeVideo')) {
        qrVideoIndices.push(i);
      }
    }

    const qrTextMatches = [];
    for (let i = 0; i < lines.length; i++) {
      const lineTrim = lines[i].trim();
      const m = lineTrim.match(/^二维码\s*(\d+(?:\.\d+)*)?\s*(.*)$/);
      if (m) {
        qrTextMatches.push({
          lineIndex: i,
          id: m[1] || '',
          title: (m[2] || '').trim(),
        });
      }
    }

    for (const qrText of qrTextMatches) {
      let closestVideoIndex = -1;
      let minDistance = 999;

      for (const vIdx of qrVideoIndices) {
        const dist = Math.abs(vIdx - qrText.lineIndex);
        if (dist < minDistance && dist < 12) {

          minDistance = dist;
          closestVideoIndex = vIdx;
        }
      }

      if (closestVideoIndex !== -1) {
        let title = qrText.title;
        let id = qrText.id;
        toRemoveIndices.add(qrText.lineIndex);

        if (!title && qrText.lineIndex + 1 < lines.length) {
          const nextLine = lines[qrText.lineIndex + 1].trim();
          if (
            nextLine &&
            !nextLine.startsWith('#') &&
            !nextLine.startsWith('<') &&
            !nextLine.startsWith('$') &&
            !nextLine.startsWith('!')
          ) {
            title = nextLine;
            toRemoveIndices.add(qrText.lineIndex + 1);
          }
        }

        const videoLine = lines[closestVideoIndex];
        const urlMatch = videoLine.match(/url="([^"]+)"/);
        const url = urlMatch ? urlMatch[1] : '';

        const propId = id ? ` id="${id}"` : '';
        const propTitle = title ? ` title="${title.replace(/"/g, '&quot;')}"` : '';

        qrVideoUpdates.set(closestVideoIndex, `<QRCodeVideo${propId}${propTitle} url="${url}" />`);
      }
    }

    let modified = false;
    const newLines = [];

    for (let i = 0; i < lines.length; i++) {
      if (toRemoveIndices.has(i)) {
        modified = true;
        continue;
      }
      if (qrVideoUpdates.has(i)) {
        newLines.push(qrVideoUpdates.get(i));
        modified = true;
        totalReplacements++;
      } else {
        newLines.push(lines[i]);
      }
    }

    if (modified || content.includes('<QRCodeVideo')) {
      let finalContent = newLines.join('\n');

      if (!finalContent.includes("import QRCodeVideo from '@/components/QRCodeVideo.astro'")) {
        const fmEndIndex = finalContent.indexOf('---', 3);
        if (fmEndIndex !== -1) {
          const insertPos = fmEndIndex + 3;
          finalContent =
            finalContent.slice(0, insertPos) +
            "\nimport QRCodeVideo from '@/components/QRCodeVideo.astro';" +
            finalContent.slice(insertPos);
        } else {
          finalContent = "import QRCodeVideo from '@/components/QRCodeVideo.astro';\n\n" + finalContent;
        }
      }

      fs.writeFileSync(filePath, finalContent, 'utf-8');
      updatedMdxCount++;
      console.log(`  [Updated MDX] ${mdxFile}`);
    }
  }

  console.log(`\n== 3. 清理已被替换的纯二维码图片 ==`);
  let deletedImgCount = 0;
  for (const imgName of convertedImageFiles) {
    const imgPath = path.join(imagesDir, imgName);
    if (fs.existsSync(imgPath)) {
      fs.unlinkSync(imgPath);
      deletedImgCount++;
    }
  }

  console.log(`\n== 处理完成 ==`);
  console.log(`· 更新 MDX 文件: ${updatedMdxCount} 个`);
  console.log(`· 清理纯二维码图片: ${deletedImgCount} 张`);
}

main().catch((err) => {
  console.error('[process-qrcodes] 执行报错:', err);
  process.exit(1);
});
