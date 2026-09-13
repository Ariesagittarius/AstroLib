import { streamGeminiVision } from './gemini_vision_client.mjs';

async function main() {
  console.log('--- 检测下册 335~340 页 (第七章结束后的内容) ---');
  const res = await streamGeminiVision(
    '请逐页说明这几页的内容：包括页眉、大标题，说明哪一页是“附录 部分曲面和空间立体的图形”，以及附录从哪一页开始到哪一页结束，后面是否是“部分习题答案与提示”：',
    [
      'test/data/probe_pages/xiace_phys_335.jpg',
      'test/data/probe_pages/xiace_phys_336.jpg',
      'test/data/probe_pages/xiace_phys_337.jpg',
      'test/data/probe_pages/xiace_phys_338.jpg'
    ]
  );
  console.log(res.text);
}

main().catch(console.error);
