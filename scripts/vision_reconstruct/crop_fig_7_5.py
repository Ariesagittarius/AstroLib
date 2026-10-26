import os
import pymupdf

PDF_PATH = "task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
OUT_DIR = "src/content/docs/collections/telecom/communication_principles/images"
os.makedirs(OUT_DIR, exist_ok=True)

doc = pymupdf.open(PDF_PATH)
zoom = 2.0
mat = pymupdf.Matrix(zoom, zoom)

page = doc[262]
rect = pymupdf.Rect(80, 330, 460, 405)
pix = page.get_pixmap(matrix=mat, clip=rect)
pix.save(os.path.join(OUT_DIR, "fig_7_5_1.png"))
print("fig_7_5_1.png saved:", pix.width, pix.height)

page = doc[263]
rect = pymupdf.Rect(260, 160, 460, 325)
pix = page.get_pixmap(matrix=mat, clip=rect)
pix.save(os.path.join(OUT_DIR, "fig_7_5_2.png"))
print("fig_7_5_2.png saved:", pix.width, pix.height)

doc.close()
