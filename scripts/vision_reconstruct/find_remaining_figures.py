import fitz
import re
import json

doc = fitz.open(r"task\通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf")

figures = []

for page_idx in range(400, len(doc)):
    phys_p = page_idx + 1
    book_p = phys_p - 15
    page = doc[page_idx]

    blocks = page.get_text("blocks")
    for b in blocks:
        text = b[4].strip()

        m = re.search(r"图\s*(1[123]\s*[\.．]\s*\d+\s*[\.．]\s*\d+)\s*([^\n]*)", text)
        if m:
            fig_no = m.group(1).replace(" ", "").replace("．", ".")
            fig_title = m.group(2).strip()
            figures.append({
                "phys_page": phys_p,
                "book_page": book_p,
                "fig_no": fig_no,
                "title": fig_title,
                "bbox": b[:4],
                "raw_text": text
            })

with open("scripts/vision_reconstruct/remaining_figures.json", "w", encoding="utf-8") as f:
    json.dump(figures, f, ensure_ascii=False, indent=2)

print(f"Found {len(figures)} figures in chapters 11-13:")
for fig in figures:
    print(f"Phys {fig['phys_page']}: 图 {fig['fig_no']} {fig['title']}")
