import pymupdf

pdf_path = "task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
doc = pymupdf.open(pdf_path)

with open("scripts/vision_reconstruct/ch10_full_text.txt", "w", encoding="utf-8") as f:
    for pno in range(374, 400):
        f.write(f"=== PHYS {pno+1} (BOOK {pno+1-15}) ===\n")
        f.write(doc[pno].get_text() + "\n")

print("ch10_full_text dumped.")
