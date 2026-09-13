import { streamGeminiVision } from './gemini_vision_client.mjs';

async function main() {
  console.log('--- 探测下册前 10 页 ---');
  for (let p = 1; p <= 10; p++) {
    const res = await streamGeminiVision(
      '用一句话说明这一页是什么内容（封面/扉页/版权页/前言/目录/第几章等），如果是目录，说明是第几页目录：',
      [`test/data/probe_pages/xiace_phys_${p}.jpg`]
    );
    console.log(`下册物理第 ${p} 页: ${res.text.trim()}`);
  }
}

main().catch(console.error);
