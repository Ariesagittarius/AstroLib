import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const PUBLIC_DIR = path.resolve('public');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');

if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

async function generateIcons() {
  const src = path.join(PUBLIC_DIR, 'favicon.png');
  if (!fs.existsSync(src)) {
    console.error('未找到 public/favicon.png');
    return;
  }

  await sharp(src).resize(192, 192).png().toFile(path.join(ICONS_DIR, 'icon-192.png'));
  console.log('✓ 生成 public/icons/icon-192.png');

  await sharp(src).resize(512, 512).png().toFile(path.join(ICONS_DIR, 'icon-512.png'));
  console.log('✓ 生成 public/icons/icon-512.png');

  const innerSize = 410;
  const resizedInner = await sharp(src)
    .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 253, g: 252, b: 255, alpha: 1 }
    }
  })
    .composite([{ input: resizedInner, gravity: 'center' }])
    .png()
    .toFile(path.join(ICONS_DIR, 'icon-maskable-512.png'));
  console.log('✓ 生成 public/icons/icon-maskable-512.png');
}

async function main() {
  console.log('--- 开始生成 AstroLib PWA 图标资产 ---');
  await generateIcons();
  console.log('--- AstroLib PWA 图标资产生成完毕 ---');
}

main().catch(console.error);
