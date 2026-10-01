import os
import pymupdf

PDF_PATH = "task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
OUT_DIR = "src/content/docs/collections/telecom/communication_principles/images"
os.makedirs(OUT_DIR, exist_ok=True)

FIGURE_BOXES_7_9 = {

    "fig_7_9_1.png": (271, [50, 530, 480, 700]),

    "fig_7_9_2.png": (272, [80, 180, 460, 260]),

    "fig_7_9_3.png": (272, [80, 360, 460, 450]),

    "fig_7_9_4.png": (273, [50, 45, 480, 460]),

    "fig_7_9_5.png": (275, [80, 110, 460, 250]),

    "fig_7_9_6.png": (276, [60, 380, 480, 560]),

    "fig_7_9_7.png": (277, [80, 190, 460, 355]),

    "fig_7_9_8.png": (278, [80, 75, 460, 175]),

    "fig_7_9_9.png": (278, [80, 255, 460, 380]),

    "fig_7_9_10.png": (280, [60, 440, 480, 635]),

    "fig_7_9_11.png": (281, [80, 100, 460, 255]),

    "fig_7_9_12.png": (281, [80, 370, 460, 595]),

    "fig_7_9_13.png": (282, [60, 75, 480, 365]),

    "fig_7_9_14.png": (283, [80, 145, 460, 325]),

    "fig_7_9_15.png": (283, [80, 350, 460, 555]),

    "fig_7_9_16.png": (284, [60, 600, 480, 705]),

    "fig_7_9_17.png": (286, [80, 415, 460, 600]),
}

doc = pymupdf.open(PDF_PATH)
zoom = 2.0
mat = pymupdf.Matrix(zoom, zoom)

for fig_name, (page_num, bbox) in FIGURE_BOXES_7_9.items():
    page = doc[page_num]
    rect = pymupdf.Rect(*bbox)
    pix = page.get_pixmap(matrix=mat, clip=rect)
    out_path = os.path.join(OUT_DIR, fig_name)
    pix.save(out_path)
    print(f"Extracted {fig_name} from page {page_num} -> {out_path} ({pix.width}x{pix.height})")

doc.close()
print("All Section 7.9 figures extracted successfully!")
