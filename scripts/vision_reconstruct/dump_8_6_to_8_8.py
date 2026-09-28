import fitz

pdf_path = "task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
doc = fitz.open(pdf_path)

with open("scripts/vision_reconstruct/ch8_6_8_utf8.txt", "w", encoding="utf-8") as f:
    for pno in range(305, 315):
        page = doc[pno]
        text = page.get_text()
        f.write(f"--- PHYS PAGE {pno+1} (BOOK PAGE {pno+1-15}) ---\n")
        f.write(text + "\n")
