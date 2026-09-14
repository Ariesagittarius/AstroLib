import fs from 'node:fs';

async function main() {
  console.log('===========================================================');
  console.log('🔍 开始全站正文提示框架与扶正工程验收验证');
  console.log('===========================================================\n');

  const tests = [
    {
      name: '《数学分析》（MinerU 书目）- 01_内容简介',
      url: 'http://127.0.0.1:4321/collections/math/math_analysis/01_内容简介/',
      expectNotice: true,
      expectTitle: '内容简介'
    },
    {
      name: '《线性代数》（MinerU 书目）- 00_内容简介',
      url: 'http://127.0.0.1:4321/collections/math/linear_algebra/00_内容简介/',
      expectNotice: true,
      expectTitle: '内容简介'
    },
    {
      name: '《大学物理学》（MinerU 书目）- 00_内容简介',
      url: 'http://127.0.0.1:4321/collections/science/university_physics/00_内容简介/',
      expectNotice: true,
      expectTitle: '内容简介'
    },
    {
      name: '《工科数学分析基础》（视觉重建扶正书目）- 00_内容说明',
      url: 'http://127.0.0.1:4321/collections/math/engineering_analysis/00_内容说明/',
      expectNotice: false,
      expectTitle: '工科数学分析基础 导读'
    },
    {
      name: '《工科数学分析基础》（视觉重建扶正书目）- 1.1 集合映射与函数',
      url: 'http://127.0.0.1:4321/collections/math/engineering_analysis/11_集合映射与函数/',
      expectNotice: false,
      expectTitle: '集合 映射与函数'
    },
    {
      name: '项目开发文档（非书籍页面）- /dev/',
      url: 'http://127.0.0.1:4321/dev/',
      expectNotice: false
    }
  ];

  let passed = 0;
  for (const t of tests) {
    try {
      const res = await fetch(encodeURI(t.url));
      const html = await res.text();

      const hasNoticeBox = html.includes('data-notice-id=');
      const hasWikiNotice = html.includes('astrolib-notice-wiki') && hasNoticeBox;
      const hasTitle = t.expectTitle ? html.includes(t.expectTitle) : true;
      const statusOk = res.status === 200;

      const noticeOk = (hasNoticeBox === t.expectNotice);

      console.log(`[${t.name}]`);
      console.log(`  HTTP 状态: ${res.status} ${statusOk ? '✓' : '❌'}`);
      console.log(`  提示卡片渲染: ${hasNoticeBox} (期望: ${t.expectNotice}) ${noticeOk ? '✓' : '❌'}`);
      if (t.expectNotice) {
        console.log(`  Wiki 风格渲染: ${hasWikiNotice ? '✓' : '❌'}`);
        const hasWarning = html.includes('本书正文由 MinerU OCR 算法与模型自动化提取转换');
        console.log(`  OCR 提示文本完整: ${hasWarning ? '✓' : '❌'}`);
      }
      if (t.expectTitle) {
        console.log(`  页面标题匹配: ${hasTitle ? '✓' : '❌'}`);
      }

      if (statusOk && noticeOk && hasTitle) {
        passed++;
        console.log('  ==> 测试通过 ✓\n');
      } else {
        console.log('  ==> 测试未通过 ❌\n');
      }
    } catch (err) {
      console.error(`  请求错误: ${err.message}\n`);
    }
  }

  console.log(`\n验收总结: ${passed} / ${tests.length} 项测试通过！`);
}

main();
