import { streamGeminiVision } from './gemini_vision_client.mjs';

async function checkBatch(pages, label) {
  console.log(`\n--- 正在检测 ${label} ---`);
  const res = await streamGeminiVision(
    '请逐页说明传入的图片内容：如封面、扉页、版权页、第三版前言、目录（写明第几页目录以及包含的章节）或正文（写明章名、节名）：',
    pages
  );
  console.log(res.text);
}

async function main() {
  await checkBatch([
    'test/data/probe_pages/xiace_phys_1.jpg',
    'test/data/probe_pages/xiace_phys_2.jpg',
    'test/data/probe_pages/xiace_phys_3.jpg'
  ], '下册物理 1~3 页');

  await checkBatch([
    'test/data/probe_pages/xiace_phys_4.jpg',
    'test/data/probe_pages/xiace_phys_5.jpg',
    'test/data/probe_pages/xiace_phys_6.jpg'
  ], '下册物理 4~6 页');

  await checkBatch([
    'test/data/probe_pages/xiace_phys_7.jpg',
    'test/data/probe_pages/xiace_phys_8.jpg',
    'test/data/probe_pages/xiace_phys_9.jpg'
  ], '下册物理 7~9 页');

  await checkBatch([
    'test/data/probe_pages/xiace_phys_10.jpg',
    'test/data/probe_pages/xiace_phys_11.jpg',
    'test/data/probe_pages/xiace_phys_12.jpg'
  ], '下册物理 10~12 页');
}

main().catch(console.error);
