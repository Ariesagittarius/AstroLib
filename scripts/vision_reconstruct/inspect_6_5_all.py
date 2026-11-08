import sys
import io
import pymupdf
import re

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

doc = pymupdf.open("task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf")

for p in range(232, 248):
    phys_p = p + 1
    page = doc[p]
    print(f"=== PAGE {p} (phys_{phys_p}, book {p+1-15}) ===")
    for b in page.get_text("blocks"):
        txt = b[4].strip().replace("\n", " ")
        if len(txt) > 0:

            print(f"  [{b[0]:.1f}, {b[1]:.1f}, {b[2]:.1f}, {b[3]:.1f}] {txt[:100]}")

doc.close()
