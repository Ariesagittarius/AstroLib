import sys
import io
import pymupdf
import re

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

doc = pymupdf.open("task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf")

for p in range(253, 297):
    phys_p = p + 1
    page = doc[p]
    blocks = page.get_text("blocks")
    for b in blocks:
        text = b[4].strip()
        lines = text.splitlines()
        for l in lines:
            l_str = l.strip()
            # If line mentions 图 7 or 图7
            if re.search(r"图\s*7", l_str):
                print(f"P{phys_p} (doc {p}): [{b[0]:.1f}, {b[1]:.1f}, {b[2]:.1f}, {b[3]:.1f}] -> {l_str}")

doc.close()
