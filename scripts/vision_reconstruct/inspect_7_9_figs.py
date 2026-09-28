import sys
import io
import pymupdf
import re

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

doc = pymupdf.open("task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf")

for p in range(271, 288):
    phys_p = p + 1
    page = doc[p]
    blocks = page.get_text("blocks")
    for b in blocks:
        t = b[4].strip()
        lines = t.splitlines()
        for l in lines:
            if re.search(r"7\s*[\.．]\s*9", l):
                print(f"P{phys_p} (doc {p}): [{b[0]:.1f}, {b[1]:.1f}, {b[2]:.1f}, {b[3]:.1f}] -> {l.strip()}")

doc.close()
