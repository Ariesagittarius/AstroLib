import { streamGeminiVision } from './gemini_vision_client.mjs';

async function main() {
  console.log('--- 查看下册目录第 5 页 (toc_p5.jpg) ---');
  const res = await streamGeminiVision(
    '请逐字完整抄录图片中的所有目录条目和页码（从图片开头一直到最底部）：',
    ['test/data/toc_p5.jpg']
  );
  console.log(res.text);
}

main().catch(console.error);
