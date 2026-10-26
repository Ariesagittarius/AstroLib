import pymupdf
import re

doc = pymupdf.open("task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf")

for p in range(232, 248):
    phys_p = p + 1
    page = doc[p]
    blocks = page.get_text("blocks")
    for b in blocks:
        text = b[4].strip()

        for line in text.splitlines():
            line_clean = line.strip()
            if "6.5." in line_clean:
                print(f"Page {p} (phys_{phys_p}): [{b[0]:.1f}, {b[1]:.1f}, {b[2]:.1f}, {b[3]:.1f}] -> {line_clean}")

doc.close()
