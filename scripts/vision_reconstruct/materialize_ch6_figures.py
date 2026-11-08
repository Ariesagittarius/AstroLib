import os
import pymupdf

PDF_PATH = "task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
OUT_DIR = "src/content/docs/collections/telecom/communication_principles/images"
os.makedirs(OUT_DIR, exist_ok=True)

FIGURE_BOXES_6_2 = {

    "fig_6_2_1.png": (179, [100, 420, 460, 525]),

    "fig_6_2_2.png": (180, [100, 160, 460, 250]),

    "fig_6_2_3.png": (180, [60, 405, 480, 608]),

    "fig_6_2_4.png": (181, [100, 85, 460, 215]),

    "fig_6_2_5.png": (181, [60, 250, 480, 550]),

    "fig_6_2_6.png": (182, [100, 195, 460, 318]),

    "fig_6_2_7.png": (183, [120, 80, 440, 175]),

    "fig_6_2_8.png": (183, [60, 230, 480, 412]),

    "fig_6_2_9.png": (184, [80, 185, 470, 240]),

    "fig_6_2_10.png": (185, [100, 80, 460, 295]),

    "fig_6_2_11.png": (185, [250, 365, 480, 450]),

    "fig_6_2_12.png": (185, [100, 520, 460, 625]),

    "fig_6_2_13.png": (186, [120, 435, 440, 556]),

    "fig_6_2_14.png": (187, [80, 275, 460, 542]),

    "fig_6_2_15.png": (188, [90, 210, 460, 472]),

    "fig_6_2_16.png": (188, [100, 580, 460, 656]),

    "fig_6_2_17.png": (189, [60, 205, 480, 432]),

    "fig_6_2_18.png": (190, [100, 85, 460, 213]),

    "fig_6_2_19.png": (190, [60, 230, 480, 335]),

    "fig_6_2_20.png": (190, [80, 540, 470, 625]),

    "fig_6_2_21.png": (191, [60, 330, 480, 488]),
}

doc = pymupdf.open(PDF_PATH)
for fname, (page_idx, rect) in FIGURE_BOXES_6_2.items():
    out_file = os.path.join(OUT_DIR, fname)
    page = doc[page_idx]
    r = pymupdf.Rect(rect[0], rect[1], rect[2], rect[3])
    pix = page.get_pixmap(dpi=200, clip=r)
    pix.save(out_file)

doc.close()
print(f"Successfully cropped {len(FIGURE_BOXES_6_2)} figures for Section 6.2!")
