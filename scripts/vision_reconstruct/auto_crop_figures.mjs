import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const LAG_PAGES = path.join(ROOT, 'test/data/lag_pages');
const OUT_DIR = path.join(ROOT, 'src/content/docs/collections/math/linear_algebra_geometry/images');

export const REFINED_MAP = {

  'fig_3_1.png': { page: 'phys_82.jpg', rect: { left: 180, top: 1180, width: 280, height: 105 } },

  'fig_3_2.png': { page: 'phys_83.jpg', rect: { left: 310, top: 780, width: 175, height: 170 } },
  'fig_3_3.png': { page: 'phys_83.jpg', rect: { left: 635, top: 780, width: 215, height: 170 } },

  'fig_3_4.png': { page: 'phys_84.jpg', rect: { left: 210, top: 260, width: 180, height: 135 } },
  'fig_3_5.png': { page: 'phys_84.jpg', rect: { left: 470, top: 260, width: 205, height: 135 } },
  'fig_3_6.png': { page: 'phys_84.jpg', rect: { left: 745, top: 260, width: 195, height: 135 } },

  'fig_3_7.png': { page: 'phys_85.jpg', rect: { left: 280, top: 610, width: 210, height: 155 } },
  'fig_3_8.png': { page: 'phys_85.jpg', rect: { left: 585, top: 610, width: 245, height: 155 } },
  'fig_3_9.png': { page: 'phys_85.jpg', rect: { left: 730, top: 1190, width: 230, height: 115 } },

  'fig_3_10.png': { page: 'phys_86.jpg', rect: { left: 145, top: 1060, width: 335, height: 265 } },

  'fig_3_11.png': { page: 'phys_87.jpg', rect: { left: 445, top: 1165, width: 250, height: 230 } },

  'fig_3_12.png': { page: 'phys_89.jpg', rect: { left: 720, top: 180, width: 255, height: 185 } },
  'fig_3_13.png': { page: 'phys_89.jpg', rect: { left: 705, top: 760, width: 265, height: 175 } },

  'fig_3_14.png': { page: 'phys_90.jpg', rect: { left: 180, top: 200, width: 245, height: 160 } },

  'fig_3_15.png': { page: 'phys_91.jpg', rect: { left: 440, top: 240, width: 240, height: 165 } },
  'fig_3_16.png': { page: 'phys_91.jpg', rect: { left: 230, top: 750, width: 245, height: 165 } },
  'fig_3_17.png': { page: 'phys_91.jpg', rect: { left: 620, top: 750, width: 255, height: 165 } },

  'fig_3_18.png': { page: 'phys_93.jpg', rect: { left: 680, top: 1040, width: 290, height: 170 } },

  'fig_3_19.png': { page: 'phys_95.jpg', rect: { left: 680, top: 665, width: 285, height: 205 } },

  'fig_3_20.png': { page: 'phys_97.jpg', rect: { left: 415, top: 1060, width: 300, height: 235 } },

  'fig_3_21.png': { page: 'phys_100.jpg', rect: { left: 180, top: 725, width: 275, height: 175 } },

  'fig_3_22.png': { page: 'phys_101.jpg', rect: { left: 625, top: 250, width: 345, height: 180 } },
  'fig_3_23.png': { page: 'phys_101.jpg', rect: { left: 700, top: 1190, width: 260, height: 165 } }
};

async function run() {
  for (const [filename, info] of Object.entries(REFINED_MAP)) {
    const src = path.join(LAG_PAGES, info.page);
    const dst = path.join(OUT_DIR, filename);
    await sharp(src)
      .extract(info.rect)
      .toFile(dst);
    console.log(`[Re-cropped] ${filename}`);
  }
}

run();
