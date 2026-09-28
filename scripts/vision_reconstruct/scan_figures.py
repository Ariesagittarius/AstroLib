import pymupdf
import re
import os

pdf_path = "task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
doc = pymupdf.open(pdf_path)

fig_pattern = re.compile(r"(图\s*6\s*[\.．]\s*\d+\s*[\.．]?\s*\d*[\s\S]*?\n)")

print("=== Scanning Chapter 6 Figures ===")
for p in range(178, 248):
    page = doc[p]
    blocks = page.get_text("blocks")
    for b in blocks:
        text = b[4].strip()
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        for line in lines:
            if re.match(r"^图\s*6\s*[\.．]", line):
                print(f"Phys {p+1} (Book {p+1-15}): {line} | bbox: [{b[0]:.1f}, {b[1]:.1f}, {b[2]:.1f}, {b[3]:.1f}]")

doc.close()
