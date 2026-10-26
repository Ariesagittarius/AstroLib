import sys
import io
import pymupdf

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

doc = pymupdf.open("task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf")

for p in range(253, 297):
    phys_p = p + 1
    page = doc[p]
    drawings = page.get_drawings()
    images = page.get_images()

    blocks = page.get_text("blocks")

    for b in blocks:
        t = b[4].strip()
        for line in t.splitlines():
            line_clean = line.strip()

            if any(term in line_clean for term in ["7.", "7-", "7 ·"]) and len(line_clean) < 50:
                if any(k in line_clean for k in ["图", "表", "例", "7.1", "7.2", "7.3", "7.4", "7.5", "7.6", "7.7", "7.8", "7.9", "7.10"]):
                    print(f"P{phys_p} (book {phys_p-15}): [{b[0]:.1f}, {b[1]:.1f}, {b[2]:.1f}, {b[3]:.1f}] -> {line_clean}")

doc.close()
