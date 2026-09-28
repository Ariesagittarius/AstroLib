import pymupdf
import re

doc = pymupdf.open("task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf")

lines_out = []
# 6.4 is from page 186 to 218 (phys 201 to 233, doc indices 200 to 232)
for p in range(200, 233):
    text = doc[p].get_text()
    for line in text.splitlines():
        line = line.strip()
        if re.match(r"^6\.4\.\d+", line):
            lines_out.append(f"P{p+1} (book {p+1-15}): {line}")

with open("scripts/vision_reconstruct/headings_6_4.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(lines_out))

doc.close()
print("Wrote headings_6_4.txt")
