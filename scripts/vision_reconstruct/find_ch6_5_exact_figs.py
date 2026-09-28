import pymupdf
import re

doc = pymupdf.open("task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf")

for p in range(232, 248):
    phys_p = p + 1
    page = doc[p]
    blocks = page.get_text("blocks")
    for b in blocks:
        text = b[4].strip()
        lines = text.splitlines()
        for idx, line in enumerate(lines):
            line_s = line.replace(" ", "")
            if re.search(r"图6\.5\.\d+", line_s):
                print(f"Page {p} (phys_{phys_p}): bbox [{b[0]:.1f}, {b[1]:.1f}, {b[2]:.1f}, {b[3]:.1f}]")
                print(f"   full block: {text}")

doc.close()
