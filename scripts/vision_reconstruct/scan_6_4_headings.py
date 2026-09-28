import pymupdf
import re

doc = pymupdf.open("task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf")

heading_re = re.compile(r"^(6\s*[\.．]\s*4(\s*[\.．]\s*\d+)*\s*.*)")

for p in range(200, 233):
    text = doc[p].get_text()
    for line in text.splitlines():
        line = line.strip()
        m = heading_re.match(line)
        if m:
            print(f"P{p+1} (book {p+1-15}): {line}")

doc.close()
