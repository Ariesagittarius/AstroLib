import fitz
import re

doc = fitz.open(r"task\通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf")

all_found = []

for page_idx in range(400, len(doc)):
    phys_p = page_idx + 1
    book_p = phys_p - 15
    page = doc[page_idx]
    text = page.get_text()

    pattern = r"图\s*\n?\s*(1[123]\s*[\.．]\s*\d+\s*[\.．]\s*\d+)\s*\n?\s*([^\n]*)"
    for m in re.finditer(pattern, text):
        fig_no = re.sub(r"\s+", "", m.group(1)).replace("．", ".")
        cap = m.group(2).strip()
        all_found.append((phys_p, book_p, fig_no, cap, m.group(0)))

with open("scripts/vision_reconstruct/true_figures_list.txt", "w", encoding="utf-8") as out:
    for phys_p, book_p, fig_no, cap, raw in all_found:
        out.write(f"Phys {phys_p} (Book {book_p}): 图 {fig_no} -> {cap}\n  RAW: {repr(raw)}\n")

print(f"Total found: {len(all_found)}")
