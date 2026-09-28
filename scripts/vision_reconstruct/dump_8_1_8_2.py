import sys
import io
import pymupdf

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

doc = pymupdf.open("task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf")

p = 299
print(f"=== PAGE {p} (phys_{p+1}, book {p+1-15}) ===")
for b in doc[p].get_text("blocks"):
    print(f"[{b[0]:.1f}, {b[1]:.1f}, {b[2]:.1f}, {b[3]:.1f}]")
    print(b[4])

doc.close()
