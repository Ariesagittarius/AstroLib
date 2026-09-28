import os
import pymupdf

PDF_PATH = "task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
OUT_DIR = "src/content/docs/collections/telecom/communication_principles/images"
os.makedirs(OUT_DIR, exist_ok=True)

doc = pymupdf.open(PDF_PATH)
zoom = 2.0
mat = pymupdf.Matrix(zoom, zoom)

# 图 7.7.1 数字通信系统模型
# Doc page 267 (phys_268), bbox [80, 110, 460, 245]
page = doc[267]
rect = pymupdf.Rect(80, 110, 460, 245)
pix = page.get_pixmap(matrix=mat, clip=rect)
pix.save(os.path.join(OUT_DIR, "fig_7_7_1.png"))
print("fig_7_7_1.png saved:", pix.width, pix.height)

# 图 7.7.2 离散与连续信源 R(D) 示意图
# Doc page 268 (phys_269), bbox [60, 510, 250, 625]
page = doc[268]
rect = pymupdf.Rect(60, 510, 250, 625)
pix = page.get_pixmap(matrix=mat, clip=rect)
pix.save(os.path.join(OUT_DIR, "fig_7_7_2.png"))
print("fig_7_7_2.png saved:", pix.width, pix.height)

# 图 7.7.3 理论与实际 R(D) 曲线
# Doc page 269 (phys_270), bbox [280, 350, 460, 505]
page = doc[269]
rect = pymupdf.Rect(280, 350, 460, 505)
pix = page.get_pixmap(matrix=mat, clip=rect)
pix.save(os.path.join(OUT_DIR, "fig_7_7_3.png"))
print("fig_7_7_3.png saved:", pix.width, pix.height)

doc.close()
