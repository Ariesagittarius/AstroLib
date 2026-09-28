import os
import pymupdf

PDF_PATH = "task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
OUT_DIR = "src/content/docs/collections/telecom/communication_principles/images"
os.makedirs(OUT_DIR, exist_ok=True)

doc = pymupdf.open(PDF_PATH)
zoom = 2.0
mat = pymupdf.Matrix(zoom, zoom)

# 图 7.3.1 二进制熵函数曲线
# Page 258 (phys_259), bbox roughly [50, 480, 230, 610]
page = doc[258]
rect = pymupdf.Rect(50, 480, 240, 615)
pix = page.get_pixmap(matrix=mat, clip=rect)
pix.save(os.path.join(OUT_DIR, "fig_7_3_1.png"))
print("fig_7_3_1.png saved:", pix.width, pix.height)

doc.close()
