import os
import pymupdf

PDF_PATH = "task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
OUT_DIR = "src/content/docs/collections/telecom/communication_principles/images"
os.makedirs(OUT_DIR, exist_ok=True)

FIGURE_BOXES_6_5 = {

    "fig_6_5_1.png": (233, [100, 130, 480, 205]),

    "fig_6_5_2.png": (233, [100, 310, 480, 395]),

    "fig_6_5_3.png": (234, [100, 235, 480, 325]),

    "fig_6_5_4.png": (235, [80, 380, 480, 640]),

    "fig_6_5_5.png": (236, [80, 230, 480, 495]),

    "fig_6_5_6.png": (238, [80, 80, 480, 360]),

    "fig_6_5_7.png": (239, [100, 120, 480, 315]),

    "fig_6_5_8.png": (239, [100, 340, 480, 470]),

    "fig_6_5_9.png": (239, [100, 590, 480, 705]),

    "fig_6_5_10.png": (241, [100, 210, 480, 355]),

    "fig_6_5_11.png": (241, [80, 530, 480, 665]),

    "fig_6_5_12.png": (242, [100, 260, 480, 420]),

    "fig_6_5_13.png": (242, [100, 535, 480, 675]),

    "fig_6_5_14.png": (243, [100, 100, 480, 320]),

    "fig_6_5_15.png": (244, [80, 90, 480, 280]),

    "fig_6_5_17.png": (244, [100, 370, 480, 475]),

    "fig_6_5_18.png": (245, [80, 360, 480, 655]),

    "fig_6_5_19.png": (246, [80, 440, 480, 565]),

    "fig_6_5_20.png": (247, [80, 100, 480, 245]),

    "fig_6_5_21.png": (247, [80, 410, 480, 550]),
}

doc = pymupdf.open(PDF_PATH)
zoom = 2.0
mat = pymupdf.Matrix(zoom, zoom)

for fig_name, (page_num, bbox) in FIGURE_BOXES_6_5.items():
    page = doc[page_num]
    rect = pymupdf.Rect(*bbox)
    pix = page.get_pixmap(matrix=mat, clip=rect)
    out_path = os.path.join(OUT_DIR, fig_name)
    pix.save(out_path)
    print(f"Extracted {fig_name} from page {page_num} (phys_{page_num+1}) -> {out_path} ({pix.width}x{pix.height})")

doc.close()
print("All Section 6.5 figures extracted successfully!")
