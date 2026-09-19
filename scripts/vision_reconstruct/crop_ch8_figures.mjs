import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const LAG_PAGES = path.join(ROOT, 'test/data/lag_pages');
const OUT_DIR = path.join(ROOT, 'src/content/docs/collections/math/linear_algebra_geometry/images');

export const FINAL_CH8_FIGURES = {
  'fig_8_1.png': { page: 'phys_185.jpg', rect: { left: 306, top: 1223, width: 213, height: 243 } },
  'fig_8_2.png': { page: 'phys_185.jpg', rect: { left: 677, top: 1256, width: 172, height: 211 } },
  'fig_8_3.png': { page: 'phys_186.jpg', rect: { left: 237, top: 808, width: 249, height: 208 } },
  'fig_8_4.png': { page: 'phys_186.jpg', rect: { left: 644, top: 776, width: 300, height: 246 } },
  'fig_8_5.png': { page: 'phys_187.jpg', rect: { left: 216, top: 372, width: 273, height: 217 } },
  'fig_8_6.png': { page: 'phys_187.jpg', rect: { left: 666, top: 420, width: 163, height: 169 } },
  'fig_8_7.png': { page: 'phys_189.jpg', rect: { left: 309, top: 1230, width: 208, height: 200 } },
  'fig_8_8.png': { page: 'phys_189.jpg', rect: { left: 687, top: 1235, width: 152, height: 195 } },
  'fig_8_9.png': { page: 'phys_190.jpg', rect: { left: 272, top: 1232, width: 247, height: 237 } },
  'fig_8_10.png': { page: 'phys_190.jpg', rect: { left: 686, top: 1289, width: 153, height: 180 } },
  'fig_8_11.png': { page: 'phys_191.jpg', rect: { left: 306, top: 1052, width: 170, height: 194 } },
  'fig_8_12.png': { page: 'phys_191.jpg', rect: { left: 635, top: 1054, width: 174, height: 192 } },
  'fig_8_13.png': { page: 'phys_193.jpg', rect: { left: 321, top: 332, width: 188, height: 174 } },
  'fig_8_14.png': { page: 'phys_193.jpg', rect: { left: 667, top: 305, width: 142, height: 201 } },
  'fig_8_15.png': { page: 'phys_194.jpg', rect: { left: 202, top: 778, width: 187, height: 181 } }
};

async function run() {
  for (const [filename, info] of Object.entries(FINAL_CH8_FIGURES)) {
    const src = path.join(LAG_PAGES, info.page);
    const dst = path.join(OUT_DIR, filename);
    await sharp(src)
      .extract(info.rect)
      .png({ quality: 100 })
      .toFile(dst);
    console.log(`[Extracted Final] ${filename}`);
  }
}

run();
