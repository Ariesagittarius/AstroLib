import pymupdf

pdf_path = "task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
doc = pymupdf.open(pdf_path)

with open('scripts/vision_reconstruct/book_toc_pages.txt', 'w', encoding='utf-8') as out:
    for pno in range(5, 16):
        page = doc[pno]
        text = page.get_text()
        out.write(f"=== PHYS {pno+1} ===\n")
        out.write(text + "\n")

print("TOC pages written.")
