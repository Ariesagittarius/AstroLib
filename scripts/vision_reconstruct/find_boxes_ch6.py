import pymupdf
import re
import os

pdf_path = "task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
doc = pymupdf.open(pdf_path)

fig_regex = re.compile(r"图\s*6\s*[\.．]\s*2\s*[\.．]\s*(\d+)")

for p in range(179, 193):
    page = doc[p]
    phys_p = p + 1
    blocks = page.get_text("blocks")
    for b in blocks:
        text = b[4].strip()
        m = fig_regex.search(text)
        if m:
            fig_num = m.group(1)
            print(f"Page {p} (phys_{phys_p}): 图 6.2.{fig_num} caption bbox: [{b[0]:.1f}, {b[1]:.1f}, {b[2]:.1f}, {b[3]:.1f}]")

            drawings = page.get_drawings()

            print(f"   Caption: {text.splitlines()[0]}")

doc.close()
