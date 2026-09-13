import { streamGeminiVision } from './gemini_vision_client.mjs';

async function main() {
  console.log('--- 探测下册附录物理页码 ---');
  const pages = [335, 336, 337, 338, 339, 340, 341, 342];
  for (const p of pages) {
    const res = await streamGeminiVision(
      '说明本页的页眉与大标题内容（如第几节、附录名称或习题答案）：',
      [`test/data/probe_pages/xiace_phys_${p}.jpg`]
    );
    console.log(`下册物理第 ${p} 页: ${res.text.trim().replace(/\n/g, ' ')}`);
  }
}

main().catch(console.error);
