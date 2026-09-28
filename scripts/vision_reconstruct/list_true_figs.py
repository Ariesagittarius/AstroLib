import json
import re

with open('scripts/vision_reconstruct/remaining_figures.json', encoding='utf-8') as f:
    figs = json.load(f)

true_figs = {}
for fig in figs:
    text = fig['raw_text']
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    for i, line in enumerate(lines):
        m = re.match(r'^图\s*(1[123]\s*[\.．]\s*\d+\s*[\.．]\s*\d+)\s*(.*)', line)
        if m:
            no = m.group(1).replace(' ', '').replace('．', '.')
            cap = m.group(2).strip()
            if not cap and i + 1 < len(lines):
                cap = lines[i+1]
            if no not in true_figs:
                true_figs[no] = {
                    'phys_page': fig['phys_page'],
                    'fig_no': no,
                    'title': cap,
                    'block_bbox': fig['bbox'],
                    'full_block': text
                }

with open("scripts/vision_reconstruct/true_figures_list.txt", "w", encoding="utf-8") as out:
    out.write(f"Total true unique figures: {len(true_figs)}\n")
    for k in sorted(true_figs.keys(), key=lambda x: [int(p) for p in x.split('.')]):
        v = true_figs[k]
        out.write(f"Phys {v['phys_page']}: 图 {v['fig_no']} -> {v['title']}\n")

print(f"Saved true figures list ({len(true_figs)} figures)")
