import pymupdf
import re

pdf_path = "task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
doc = pymupdf.open(pdf_path)

with open('scripts/vision_reconstruct/ch10_figures_scan.txt', 'w', encoding='utf-8') as out:
    for pno in range(374, 400): # Phys 375 to 400
        page = doc[pno]
        text = page.get_text()
        phys = pno + 1
        book = phys - 15
        blocks = page.get_text("blocks")
        for b in blocks:
            btext = b[4].strip()
            m = re.search(r'图\s*10\s*[\.．]\s*\d+\s*[\.．]?\s*\d*', btext)
            if m:
                out.write(f"Phys {phys} (Book {book}): {m.group(0)} | bbox=({b[0]:.1f}, {b[1]:.1f}, {b[2]:.1f}, {b[3]:.1f})\n  Full: {btext}\n")

print("Ch10 figure scan complete.")
