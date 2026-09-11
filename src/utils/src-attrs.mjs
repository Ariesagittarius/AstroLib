export function srcAttrs(props = {}) {
  const out = {};
  for (const key of ['data-src-file', 'data-src-line', 'data-src-kind']) {
    const v = props[key];
    if (v != null && v !== '') out[key] = v;
  }
  return out;
}
