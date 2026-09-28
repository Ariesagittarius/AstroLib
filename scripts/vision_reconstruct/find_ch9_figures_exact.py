import pymupdf
import re

pdf_path = "task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
doc = pymupdf.open(pdf_path)

with open('scripts/vision_reconstruct/ch9_captions_detailed.txt', 'w', encoding='utf-8') as out:
    for pno in range(315, 372): # Phys 316 to 372 (up to end of 9.10, before exercises)
        page = doc[pno]
        phys = pno + 1
        book = phys - 15
        blocks = page.get_text("blocks")
        for b in blocks:
            text = b[4].strip()
            # check if block looks like a figure caption
            # e.g. 图 9.x.x 或 图9.x.x
            m = re.search(r'图\s*9\s*[\.．]\s*\d+\s*[\.．]\s*\d+', text)
            if m:
                out.write(f"Phys {phys} (Book {book}): {m.group(0)} | bbox=({b[0]:.1f}, {b[1]:.1f}, {b[2]:.1f}, {b[3]:.1f})\n  Full caption: {text}\n")

print("Captions detailed complete.")
