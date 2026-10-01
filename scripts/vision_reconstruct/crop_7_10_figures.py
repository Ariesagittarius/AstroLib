import os
import pymupdf

PDF_PATH = "task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
OUT_DIR = "src/content/docs/collections/telecom/communication_principles/images"
os.makedirs(OUT_DIR, exist_ok=True)

FIGURE_BOXES_7_10 = {

    "fig_7_10_1.png": (287, [80, 380, 460, 495]),

    "fig_7_10_2.png": (287, [80, 520, 460, 665]),

    "fig_7_10_3.png": (289, [80, 380, 460, 490]),

    "fig_7_10_4.png": (291, [80, 90, 460, 205]),

    "fig_7_10_5.png": (291, [80, 500, 460, 610]),
}

doc = pymupdf.open(PDF_PATH)
zoom = 2.0
mat = pymupdf.Matrix(zoom, zoom)

for fig_name, (page_num, bbox) in FIGURE_BOXES_7_10.items():
    page = doc[page_num]
    rect = pymupdf.Rect(*bbox)
    pix = page.get_pixmap(matrix=mat, clip=rect)
    out_path = os.path.join(OUT_DIR, fig_name)
    pix.save(out_path)
    print(f"Extracted {fig_name} from page {page_num} -> {out_path} ({pix.width}x{pix.height})")

doc.close()
print("All Section 7.10 figures extracted successfully!")
