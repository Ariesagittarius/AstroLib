import os
import pymupdf

PDF_PATH = "task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
OUT_DIR = "src/content/docs/collections/telecom/communication_principles/images"
os.makedirs(OUT_DIR, exist_ok=True)

doc = pymupdf.open(PDF_PATH)
zoom = 2.0
mat = pymupdf.Matrix(zoom, zoom)

# 图 7.5.1 信源编码原理图
# Doc page 262 (phys_263), bbox [100, 330, 460, 405]
page = doc[262]
rect = pymupdf.Rect(80, 330, 460, 405)
pix = page.get_pixmap(matrix=mat, clip=rect)
pix.save(os.path.join(OUT_DIR, "fig_7_5_1.png"))
print("fig_7_5_1.png saved:", pix.width, pix.height)

# 图 7.5.2 典型和非典型序列集
# Doc page 263 (phys_264), bbox [260, 160, 460, 325]
page = doc[263]
rect = pymupdf.Rect(260, 160, 460, 325)
pix = page.get_pixmap(matrix=mat, clip=rect)
pix.save(os.path.join(OUT_DIR, "fig_7_5_2.png"))
print("fig_7_5_2.png saved:", pix.width, pix.height)

doc.close()
