#!/usr/bin/env node
/**
 * scripts/test-typography-presets.mjs
 * AstroLib Academic Typography Preset Registry 契约与完整性测试套件 (Phase 5)
 *
 * 验证目标：
 * 1. 注册表完整性 (4 套 Presets，不多不少)
 * 2. 彻底杜绝 international (零生产路径、零注册)
 * 3. scholarly 为默认 Preset，且配置符合 Core 教材标准
 * 4. 每套 Preset 的 schema 完整性 (category, designFamily, deterministic, adaptive, guaranteedFallback, metrics)
 * 5. 全面排查 Variable Font (StaticFontOnlyForPublishing 契约验证)
 * 6. getTypographyPreset / isTypographyPresetId 边界与异常回退行为验证
 */

import {
  PRESET_REGISTRY,
  PRESET_SCHOLARLY,
  PRESET_CLASSIC,
  PRESET_MATHEMATICAL,
  PRESET_LECTURE,
  DEFAULT_TYPOGRAPHY_PRESET,
  DEFAULT_TYPOGRAPHY_PRESET_ID,
  getTypographyPreset,
  isTypographyPresetId,
  listTypographyPresets,
  StaticFontOnlyForPublishing,
} from '../src/publishing/typography/index.ts';

console.log('================================================================');
console.log('📚 AstroLib Academic Typography Preset Registry 契约测试');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

// -----------------------------------------------------------------------------
// 1. 注册表完整性与 Preset 数量审计
// -----------------------------------------------------------------------------
console.log('--- [测试组 1] 注册表核心规格与唯一性审计 ---');

const registeredKeys = Object.keys(PRESET_REGISTRY);
assert(
  registeredKeys.length === 4,
  `注册表收敛为恰好 4 套官方学术预设 (实际注册数: ${registeredKeys.length})`
);

const expectedIds = ['scholarly', 'classic', 'mathematical', 'lecture'];
assert(
  expectedIds.every((id) => registeredKeys.includes(id)),
  `包含全部 4 套官方 ID: ${expectedIds.join(', ')}`
);

const presetList = listTypographyPresets();
assert(
  presetList.length === 4,
  `listTypographyPresets() 返回恰好 4 套预设 (实际数: ${presetList.length})`
);

assert(
  new Set(presetList.map((p) => p.id)).size === 4,
  '所有已注册预设的 ID 保持唯一，无重复'
);

// -----------------------------------------------------------------------------
// 2. 彻底剔除 international 验证 (零泄露)
// -----------------------------------------------------------------------------
console.log('\n--- [测试组 2] 彻底移除 international 验证 (无隐藏生产路径) ---');

assert(
  !('international' in PRESET_REGISTRY),
  'PRESET_REGISTRY 字典中彻底不存在 international'
);

assert(
  !presetList.some((p) => p.id === 'international'),
  'listTypographyPresets() 列表中彻底不包含 international'
);

assert(
  isTypographyPresetId('international') === false,
  'isTypographyPresetId("international") 守卫判定为 false'
);

// -----------------------------------------------------------------------------
// 3. 默认预设 (Default Preset) 规范验证
// -----------------------------------------------------------------------------
console.log('\n--- [测试组 3] 默认预设 (Default Preset) 规范验证 ---');

assert(
  DEFAULT_TYPOGRAPHY_PRESET_ID === 'scholarly',
  `DEFAULT_TYPOGRAPHY_PRESET_ID 为 "scholarly"`
);

assert(
  DEFAULT_TYPOGRAPHY_PRESET === PRESET_SCHOLARLY,
  'DEFAULT_TYPOGRAPHY_PRESET 引用为 PRESET_SCHOLARLY'
);

assert(
  DEFAULT_TYPOGRAPHY_PRESET.id === 'scholarly',
  '默认预设 ID 为 scholarly'
);

assert(
  DEFAULT_TYPOGRAPHY_PRESET.category === 'core',
  '默认预设归属于 core 核心通用学术分类'
);

// -----------------------------------------------------------------------------
// 4. Schema 结构完整度与分类审计
// -----------------------------------------------------------------------------
console.log('\n--- [测试组 4] Schema 完整性、学术分类与双态候选链审计 ---');

const corePresets = ['scholarly', 'classic', 'mathematical'];
const specializedPresets = ['lecture'];

for (const preset of presetList) {
  const pId = preset.id;

  // 分类检验
  if (corePresets.includes(pId)) {
    assert(
      preset.category === 'core',
      `预设 [${pId}] 正确归类为 category="core"`
    );
  } else if (specializedPresets.includes(pId)) {
    assert(
      preset.category === 'specialized',
      `预设 [${pId}] 正确归类为 category="specialized"`
    );
  }

  // 元数据字段非空
  assert(
    typeof preset.name === 'string' && preset.name.length > 0,
    `预设 [${pId}] name 字段有效 ("${preset.name}")`
  );
  assert(
    typeof preset.description === 'string' && preset.description.length > 0,
    `预设 [${pId}] description 字段有效`
  );
  assert(
    typeof preset.targetAudience === 'string' && preset.targetAudience.length > 0,
    `预设 [${pId}] targetAudience 字段有效`
  );

  // 字体规格审计
  const fontSpecs = [
    { role: 'chineseBody', spec: preset.chineseBody },
    { role: 'chineseHeading', spec: preset.chineseHeading },
    { role: 'latinText', spec: preset.latinText },
    { role: 'monospace', spec: preset.monospace },
    { role: 'kaiFont', spec: preset.kaiFont },
  ];

  for (const { role, spec } of fontSpecs) {
    assert(
      typeof spec.designFamily === 'string' && spec.designFamily.length > 0,
      `预设 [${pId}] 角色 ${role} 定义了明确的 designFamily: "${spec.designFamily}"`
    );
    assert(
      Array.isArray(spec.deterministicFamilies) && spec.deterministicFamilies.length > 0,
      `预设 [${pId}] 角色 ${role} 提供了确定性候选链 (${spec.deterministicFamilies.length} 个候选)`
    );
    assert(
      Array.isArray(spec.adaptiveFamilies) && spec.adaptiveFamilies.length > 0,
      `预设 [${pId}] 角色 ${role} 提供了自适应候选链 (${spec.adaptiveFamilies.length} 个候选)`
    );
  }

  // 数学公式规格
  assert(
    typeof preset.math.family === 'string' && preset.math.family.endsWith('.otf'),
    `预设 [${pId}] math.family 为合规的 OpenType 数学字体文件: "${preset.math.family}"`
  );

  // 极端缺字环境 TeX Live 确定性兜底 (Guaranteed Fallback)
  assert(
    typeof preset.guaranteedFallback.cjk === 'string' &&
      typeof preset.guaranteedFallback.cjkSans === 'string' &&
      typeof preset.guaranteedFallback.latin === 'string' &&
      typeof preset.guaranteedFallback.math === 'string',
    `预设 [${pId}] 具备完备的 guaranteedFallback (CJK=${preset.guaranteedFallback.cjk}, Math=${preset.guaranteedFallback.math})`
  );

  // 度量参数
  assert(
    typeof preset.metrics.baselineStretch === 'number' && preset.metrics.baselineStretch >= 1.1,
    `预设 [${pId}] baselineStretch 行高伸缩因子在合规学术区间 (${preset.metrics.baselineStretch})`
  );
  assert(
    typeof preset.metrics.parIndent === 'string' && preset.metrics.parIndent === '2em',
    `预设 [${pId}] 遵循中文学术首行缩进 2em`
  );
}

// -----------------------------------------------------------------------------
// 5. 严格杜绝 Variable Font (静态字体排版安全准则)
// -----------------------------------------------------------------------------
console.log('\n--- [测试组 5] 彻底排查 Variable Font (可变字体) 安全审查 ---');

assert(
  StaticFontOnlyForPublishing === true,
  'StaticFontOnlyForPublishing 常量明确声明为 true'
);

for (const preset of presetList) {
  const pId = preset.id;
  const allFamilies = [
    preset.chineseBody.designFamily,
    ...preset.chineseBody.deterministicFamilies,
    ...preset.chineseBody.adaptiveFamilies,
    preset.chineseHeading.designFamily,
    ...preset.chineseHeading.deterministicFamilies,
    ...preset.chineseHeading.adaptiveFamilies,
    preset.latinText.designFamily,
    ...preset.latinText.deterministicFamilies,
    ...preset.latinText.adaptiveFamilies,
    preset.math.family,
    ...(preset.math.fallbackFamilies || []),
    preset.guaranteedFallback.cjk,
    preset.guaranteedFallback.cjkSans,
    preset.guaranteedFallback.latin,
    preset.guaranteedFallback.math,
  ];

  const hasVariable = allFamilies.some((name) => /[-_]VF\b|Variable/i.test(name));
  assert(
    !hasVariable,
    `预设 [${pId}] 所有字族与候选链中完全剔除 Variable Font (零崩溃隐患)`
  );
}

// -----------------------------------------------------------------------------
// 6. getTypographyPreset / isTypographyPresetId 边界与异常测试
// -----------------------------------------------------------------------------
console.log('\n--- [测试组 6] API 检索、守卫与边界异常处理测试 ---');

// 正向获取
assert(getTypographyPreset('scholarly') === PRESET_SCHOLARLY, 'getTypographyPreset("scholarly") 返回 PRESET_SCHOLARLY');
assert(getTypographyPreset('classic') === PRESET_CLASSIC, 'getTypographyPreset("classic") 返回 PRESET_CLASSIC');
assert(getTypographyPreset('mathematical') === PRESET_MATHEMATICAL, 'getTypographyPreset("mathematical") 返回 PRESET_MATHEMATICAL');
assert(getTypographyPreset('lecture') === PRESET_LECTURE, 'getTypographyPreset("lecture") 返回 PRESET_LECTURE');

// 非法输入自动回退测试 (fallbackToDefault = true)
assert(
  getTypographyPreset('non_existent_preset') === DEFAULT_TYPOGRAPHY_PRESET,
  '未知 ID 自动回退至 DEFAULT_TYPOGRAPHY_PRESET'
);
assert(
  getTypographyPreset('international') === DEFAULT_TYPOGRAPHY_PRESET,
  '已移除的 "international" 安全回退至 DEFAULT_TYPOGRAPHY_PRESET'
);
assert(
  getTypographyPreset(null) === DEFAULT_TYPOGRAPHY_PRESET,
  'null 输入安全回退至 DEFAULT_TYPOGRAPHY_PRESET'
);
assert(
  getTypographyPreset(undefined) === DEFAULT_TYPOGRAPHY_PRESET,
  'undefined 输入安全回退至 DEFAULT_TYPOGRAPHY_PRESET'
);

// 严格报错模式测试 (fallbackToDefault = false)
let threwForUnknown = false;
try {
  getTypographyPreset('unknown_preset_xyz', false);
} catch (e) {
  threwForUnknown = true;
}
assert(threwForUnknown, '严格模式下 (fallbackToDefault=false) 未知 ID 抛出异常');

let threwForInternational = false;
try {
  getTypographyPreset('international', false);
} catch (e) {
  threwForInternational = true;
}
assert(threwForInternational, '严格模式下 (fallbackToDefault=false) "international" 显式抛出未知异常');

// 类型守卫全面测试
assert(isTypographyPresetId('scholarly') === true, 'isTypographyPresetId("scholarly") === true');
assert(isTypographyPresetId('classic') === true, 'isTypographyPresetId("classic") === true');
assert(isTypographyPresetId('mathematical') === true, 'isTypographyPresetId("mathematical") === true');
assert(isTypographyPresetId('lecture') === true, 'isTypographyPresetId("lecture") === true');
assert(isTypographyPresetId('international') === false, 'isTypographyPresetId("international") === false');
assert(isTypographyPresetId('') === false, 'isTypographyPresetId("") === false');
assert(isTypographyPresetId(123) === false, 'isTypographyPresetId(123) === false');
assert(isTypographyPresetId(null) === false, 'isTypographyPresetId(null) === false');
assert(isTypographyPresetId(undefined) === false, 'isTypographyPresetId(undefined) === false');

console.log('\n================================================================');
console.log(`🏁 测试完成: ${passedTests} / ${totalTests} 全部通过!`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
