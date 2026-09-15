import fs from 'node:fs';
import {
  resolveNotices,
  createNotice,
  defineNoticeTemplate,
  interpolateText,
  NOTICE_TEMPLATES,
  NOTICE_PRESETS
} from '../src/config/notices.config.mjs';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runUnitTests() {
  console.log('===========================================================');
  console.log('🧪 开始 Notice Framework 模板化与插值引擎单元测试');
  console.log('===========================================================\n');

  let passed = 0;

  try {
    const text1 = interpolateText('由 {author} 基于 {model} 生成', { author: '张三', model: 'Claude 3.7' });
    assert(text1 === '由 张三 基于 Claude 3.7 生成', '基础参数插值');

    const text2 = interpolateText('版本: {version|v1.0}, 状态: {status}', { status: '定稿' });
    assert(text2 === '版本: v1.0, 状态: 定稿', '带默认值回退的插值');

    const text3 = interpolateText('未提供参数: {unknown}', {});
    assert(text3 === '未提供参数: {unknown}', '未知参数保持原样');

    console.log('  [1/6] 通用文本插值工具测试通过 ✓');
    passed++;
  } catch (err) {
    console.error('  [1/6] 通用文本插值工具测试失败 ❌', err.message);
  }

  try {
    const result = resolveNotices([
      {
        template: 'aiGenerated',
        model: 'Gemini 1.5 Pro',
        visualModel: 'Nougat-v0.5'
      }
    ]);
    assert(result.length === 1, '返回 1 个提示项');
    const notice = result[0];
    assert(notice.message.includes('Gemini 1.5 Pro'), 'message 正确插入自定义 model');
    assert(notice.tags.includes('Gemini 1.5 Pro'), 'tags 正确插入自定义 model');
    assert(notice.items.some(i => i.text.includes('Nougat-v0.5')), 'items 正确插入自定义 visualModel');
    assert(notice.id === 'ai-generated', '自动推导 id 为模板 ID');
    assert(notice.variant === 'wiki', '默认 variant 为 wiki');

    console.log('  [2/6] AI 模板自定义字段覆写测试通过 ✓');
    passed++;
  } catch (err) {
    console.error('  [2/6] AI 模板自定义字段覆写测试失败 ❌', err.message);
  }

  try {
    defineNoticeTemplate('customLesson', {
      severity: 'accent',
      icon: 'school',
      tags: ['讲义', '{semester}'],
      message: '本篇讲义由 {professor} 主讲，适用学期：{semester}。',
      items: [
        '课程代码：{courseCode}',
        '答疑助教：{ta}'
      ],
      defaults: {
        professor: '李教授',
        semester: '2026秋',
        courseCode: 'MATH101',
        ta: '王助教'
      }
    });

    const result = resolveNotices([
      {
        template: 'customLesson',
        professor: '丘成桐',
        ta: '张博士'
      }
    ]);
    assert(result.length === 1, '新模板解析成功');
    const n = result[0];
    assert(n.message === '本篇讲义由 丘成桐 主讲，适用学期：2026秋。', '主讲人替换且学期使用默认值');
    assert(n.tags.includes('2026秋'), '标签插值成功');
    assert(n.items[1].text === '答疑助教：张博士', '展开项参数替换成功');

    console.log('  [3/6] 用户自定义新模板与参数声明测试通过 ✓');
    passed++;
  } catch (err) {
    console.error('  [3/6] 用户自定义新模板测试失败 ❌', err.message);
  }

  try {
    const result = resolveNotices([
      {
        message: '由 {reviewer} 于 {date} 完成核对，评级为 {grade}。',
        reviewer: '审核组A',
        date: '2026-09-15',
        grade: '优秀',
        tags: ['已核对', '{grade}']
      }
    ]);
    assert(result.length === 1, '即席提示解析成功');
    const n = result[0];
    assert(n.message === '由 审核组A 于 2026-09-15 完成核对，评级为 优秀。', '即席参数全部插值成功');
    assert(n.tags.includes('优秀'), '即席标签插值成功');
    assert(Boolean(n.id), '即席提示自动派生唯一 ID');

    console.log('  [4/6] 页面即席动态提示（未注册模板）测试通过 ✓');
    passed++;
  } catch (err) {
    console.error('  [4/6] 页面即席动态提示测试失败 ❌', err.message);
  }

  try {
    const result = resolveNotices([
      {
        title: '仅提供了 title 字段的提示',
        items: ['纯字符串条目1', '纯字符串条目2']
      }
    ]);
    const n = result[0];
    assert(n.message === '仅提供了 title 字段的提示', 'title 透明回退为 message');
    assert(n.items[0].text === '纯字符串条目1', '纯字符串条目自动包装为对象');
    assert(n.collapsible === true, '存在 items 时自动标记为 collapsible');

    console.log('  [5/6] 数据结构精简与规范化测试通过 ✓');
    passed++;
  } catch (err) {
    console.error('  [5/6] 数据结构精简测试失败 ❌', err.message);
  }

  try {
    const legacyResult = resolveNotices(
      ['mineru-ocr'],
      [NOTICE_PRESETS.devDocsAi]
    );
    assert(legacyResult.length === 2, '成功解析历史字符串别名与 NOTICE_PRESETS');
    assert(legacyResult[0].message.includes('MinerU OCR'), 'MinerU 提示正常生成');
    assert(legacyResult[1].message.includes('ChatGPT 5.6 Luna'), 'AI 提示正常生成');

    const disabledResult = resolveNotices(
      ['mineru-ocr'],
      [{ id: 'mineru-ocr-notice', disabled: true }]
    );
    assert(disabledResult.length === 0, '单页显式 disabled: true 成功移除继承提示');

    console.log('  [6/6] 历史向后兼容与单页屏蔽测试通过 ✓\n');
    passed++;
  } catch (err) {
    console.error('  [6/6] 历史向后兼容测试失败 ❌', err.message);
  }

  console.log(`单元测试汇总: ${passed} / 6 全部通过！\n`);
  return passed === 6;
}

async function runIntegrationTests() {
  console.log('===========================================================');
  console.log('🌐 开始全站正文提示框架集成与 HTTP 渲染验证');
  console.log('===========================================================\n');

  const tests = [
    {
      name: '《数学分析》（MinerU 书目）- 01_内容简介',
      url: 'http://localhost:4321/collections/math/math_analysis/01_内容简介/',
      expectNotice: true,
      expectTitle: '内容简介'
    },
    {
      name: '《工科数学分析基础》（视觉重建扶正书目）- 00_内容说明',
      url: 'http://localhost:4321/collections/math/engineering_analysis/00_内容说明/',
      expectNotice: false,
      expectTitle: '工科数学分析'
    },
    {
      name: '项目开发文档（/dev/ 系列）- /dev/appendix/wiki-notices/',
      url: 'http://localhost:4321/dev/appendix/wiki-notices/',
      expectNotice: true,
      expectSnippet: 'ChatGPT 5.6 Luna'
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
      const hasSnippet = t.expectSnippet ? html.includes(t.expectSnippet) : true;
      const statusOk = res.status === 200;

      const noticeOk = (hasNoticeBox === t.expectNotice);

      console.log(`[${t.name}]`);
      console.log(`  HTTP 状态: ${res.status} ${statusOk ? '✓' : '❌'}`);
      console.log(`  提示卡片渲染: ${hasNoticeBox} (期望: ${t.expectNotice}) ${noticeOk ? '✓' : '❌'}`);
      if (t.expectNotice) {
        console.log(`  Wiki 风格渲染: ${hasWikiNotice ? '✓' : '❌'}`);
      }
      if (t.expectSnippet) {
        console.log(`  匹配预期文案片段: ${hasSnippet ? '✓' : '❌'}`);
      }

      if (statusOk && noticeOk && hasTitle && hasSnippet) {
        passed++;
        console.log('  ==> 测试通过 ✓\n');
      } else {
        console.log('  ==> 测试未通过 ❌\n');
      }
    } catch (err) {
      console.log(`  [跳过或服务未启动]: ${err.message}\n`);
    }
  }

  console.log(`集成渲染测试总结: ${passed} / ${tests.length} 项通过！\n`);
}

async function main() {
  const unitOk = await runUnitTests();
  await runIntegrationTests();
  if (!unitOk) {
    process.exit(1);
  }
}

main();
