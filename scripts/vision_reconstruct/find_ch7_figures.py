import pymupdf
import re

doc = pymupdf.open("task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf")

fig_regex = re.compile(r"图\s*7\s*[\.．]\s*(\d+)")

# Book page 239 is doc page 253 (phys_254) to book page 284 is doc page 298 (phys_299)
for p in range(253, 298):
    phys_p = p + 1
    page = doc[p]
    blocks = page.get_text("blocks")
    for b in blocks:
        text = b[4].strip()
        m = fig_regex.search(text)
        if m:
            fig_num = m.group(1)
            first_line = text.splitlines()[0]
            print(f"Page {p} (phys_{phys_p}): 图 7.{fig_num} | bbox: [{b[0]:.1f}, {b[1]:.1f}, {b[2]:.1f}, {b[3]:.1f}] | caption: {first_line}")

doc.close()
