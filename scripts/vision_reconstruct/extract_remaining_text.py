import fitz
import os

pdf_path = r"task\通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
doc = fitz.open(pdf_path)

output_file = r"scripts\vision_reconstruct\ch11_12_13_text.txt"
os.makedirs(os.path.dirname(output_file), exist_ok=True)

with open(output_file, "w", encoding="utf-8") as f:
    for phys_p in range(401, len(doc) + 1):
        page_idx = phys_p - 1
        book_p = phys_p - 15
        page = doc[page_idx]
        text = page.get_text()
        f.write(f"\n\n=== PHYS {phys_p} (BOOK {book_p}) ===\n")
        f.write(text)

print(f"Extracted pages 401 to {len(doc)} to {output_file}")
