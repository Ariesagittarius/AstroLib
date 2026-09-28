import pymupdf

pdf_path = "task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
doc = pymupdf.open(pdf_path)

page = doc[361] # Phys 362, Book 347
with open("scripts/vision_reconstruct/p362_utf8.txt", "w", encoding="utf-8") as f:
    f.write(page.get_text())

print("p362 written")
