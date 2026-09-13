import { streamGeminiVision } from './gemini_vision_client.mjs';

async function main() {
  console.log('--- 正在分析上册前 21 页 ---');
  const shangceFront = Array.from({ length: 21 }, (_, i) => `test/data/probe_pages/shangce_phys_${i + 1}.jpg`);
  const res1 = await streamGeminiVision(
    '请逐页列出这批扫描页（shangce phys 1 到 21）每一页的内容是什么（如封面、版权页、第三版前言、第二版前言、目录、绪论、第1章第一节等），并指明书面印刷页码（如罗马数字或阿拉伯数字页码）：',
    shangceFront
  );
  console.log(res1.text);

  console.log('\n--- 正在分析上册后 56 页 (phys 335 ~ 390) ---');
  const shangceBackPages = [335, 336, 337, 338, 339, 340, 345, 350, 355, 360, 365, 370, 375, 380, 385, 390];
  const res2 = await streamGeminiVision(
    '请分析这批上册后部扫描页，列出：1. 都有哪些附录（附录1、附录2、附录3...标题分别是什么？）；2. 附录的大致物理页码起止；3. 附录之后还有什么（如习题答案与提示？起止物理页？）：',
    shangceBackPages.map(p => `test/data/probe_pages/shangce_phys_${p}.jpg`)
  );
  console.log(res2.text);

  console.log('\n--- 正在分析下册后部扫描页 (xiace phys 335 ~ 370) ---');
  const xiaceBackPages = [335, 338, 340, 345, 350, 355, 358, 360, 362, 365, 368, 370];
  const res3 = await streamGeminiVision(
    '请分析这批下册后部扫描页，列出：1. 都有哪些附录或后记内容（标题是什么？起止物理页？）；2. 是否有课后习题答案？：',
    xiaceBackPages.map(p => `test/data/probe_pages/xiace_phys_${p}.jpg`)
  );
  console.log(res3.text);
}

main().catch(console.error);
