import pymupdf
import re

doc = pymupdf.open("task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf")

# Section 6.5 is from page 218 to 238 (phys 233 to 253, doc indices 232 to 248)
fig_regex = re.compile(r"图\s*6\s*[\.．]\s*5\s*[\.．]\s*(\d+)")

print("=== Scanning 6.5 Headings & Figures ===")
for p in range(232, 248):
    text = doc[p].get_text()
    for line in text.splitlines():
        line = line.strip()
        if re.match(r"^6\.5(\.\d+)*", line):
            print(f"P{p+1} (book {p+1-15}): {line}")
        m = fig_regex.search(line)
        if m:
            print(f"   Fig 6.5.{m.group(1)} on P{p+1}: {line}")

doc.close()
