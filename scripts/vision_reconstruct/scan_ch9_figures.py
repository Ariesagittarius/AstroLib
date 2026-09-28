import pymupdf
import re

pdf_path = "task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
doc = pymupdf.open(pdf_path)

with open('scripts/vision_reconstruct/ch9_figures_scan.txt', 'w', encoding='utf-8') as out:
    for pno in range(315, 375):
        page = doc[pno]
        text = page.get_text()
        phys = pno + 1
        book = phys - 15
        figs = re.findall(r'图\s*9[\.．\-\s]*\d+[\.．\-\s]*\d*', text)
        lines = [line.strip() for line in text.split('\n') if '图' in line and '9' in line]
        if figs or lines:
            out.write(f"Phys {phys} (Book {book}): figs={figs}, lines={lines}\n")

print("Ch9 figure scan complete.")
