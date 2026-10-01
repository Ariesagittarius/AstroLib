import os
import pymupdf

PDF_PATH = "task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
OUT_DIR = "src/content/docs/collections/telecom/communication_principles/images"
os.makedirs(OUT_DIR, exist_ok=True)

FIGURE_BOXES_6_3 = {

    "fig_6_3_1.png": (193, [120, 95, 480, 345]),

    "fig_6_3_2.png": (193, [100, 410, 480, 545]),

    "fig_6_3_3.png": (193, [80, 680, 480, 920]),

    "fig_6_3_4.png": (195, [100, 95, 480, 530]),

    "fig_6_3_5.png": (196, [120, 100, 460, 435]),

    "fig_6_3_6.png": (197, [80, 125, 480, 305]),

    "fig_6_3_7.png": (197, [80, 435, 480, 780]),

    "fig_6_3_8.png": (198, [120, 530, 440, 920]),

    "fig_6_3_9.png": (199, [100, 570, 480, 835]),

    "fig_6_3_10.png": (200, [140, 95, 440, 460]),
}

doc = pymupdf.open(PDF_PATH)
for fname, (page_idx, rect) in FIGURE_BOXES_6_3.items():
    out_file = os.path.join(OUT_DIR, fname)
    page = doc[page_idx]
    r = pymupdf.Rect(rect[0], rect[1], rect[2], rect[3])
    pix = page.get_pixmap(dpi=200, clip=r)
    pix.save(out_file)

doc.close()
print(f"Successfully cropped {len(FIGURE_BOXES_6_3)} figures for Section 6.3!")
