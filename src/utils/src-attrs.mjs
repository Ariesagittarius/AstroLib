/**
 * src-attrs：把注入插件写入组件 props 的 data-src-* 透传到卡片根元素。
 * 各卡片 .astro 模板在根元素上展开 `{...srcAttrs(Astro.props)}` 即可。
 * 生产构建不注入这些 props（插件仅 dev 启用），此处恒返回空对象，零开销。
 */
export function srcAttrs(props = {}) {
  const out = {};
  for (const key of ['data-src-file', 'data-src-line', 'data-src-kind']) {
    const v = props[key];
    if (v != null && v !== '') out[key] = v;
  }
  return out;
}
