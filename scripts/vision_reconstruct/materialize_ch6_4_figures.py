import os
import pymupdf

PDF_PATH = "task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
OUT_DIR = "src/content/docs/collections/telecom/communication_principles/images"
os.makedirs(OUT_DIR, exist_ok=True)

FIGURE_BOXES_6_4 = {

    "fig_6_4_1.png": (204, [100, 100, 480, 260]),

    "fig_6_4_2.png": (205, [140, 240, 440, 380]),

    "fig_6_4_3.png": (206, [140, 90, 440, 190]),

    "fig_6_4_4.png": (208, [120, 290, 460, 435]),

    "fig_6_4_5.png": (209, [140, 90, 440, 210]),

    "fig_6_4_6.png": (211, [120, 95, 460, 220]),

    "fig_6_4_7.png": (211, [120, 245, 460, 360]),

    "fig_6_4_8.png": (212, [140, 85, 440, 195]),

    "fig_6_4_9.png": (212, [80, 450, 480, 680]),

    "fig_6_4_10.png": (213, [100, 580, 480, 665]),

    "fig_6_4_11.png": (214, [120, 180, 460, 255]),

    "fig_6_4_12.png": (215, [120, 85, 460, 180]),

    "fig_6_4_13.png": (215, [100, 595, 480, 680]),

    "fig_6_4_14.png": (217, [120, 85, 440, 330]),

    "fig_6_4_15.png": (218, [80, 510, 480, 675]),

    "fig_6_4_16.png": (219, [120, 95, 460, 230]),

    "fig_6_4_17.png": (219, [100, 290, 480, 685]),

    "fig_6_4_18.png": (220, [100, 210, 480, 380]),

    "fig_6_4_19.png": (220, [120, 490, 460, 620]),

    "fig_6_4_20.png": (221, [120, 140, 440, 220]),

    "fig_6_4_21.png": (222, [100, 320, 440, 620]),

    "fig_6_4_22.png": (224, [140, 85, 440, 280]),

    "fig_6_4_23.png": (224, [100, 450, 480, 650]),

    "fig_6_4_24.png": (225, [140, 130, 440, 385]),

    "fig_6_4_25.png": (226, [100, 100, 460, 305]),

    "fig_6_4_26.png": (226, [120, 340, 460, 465]),

    "fig_6_4_27.png": (227, [120, 100, 440, 400]),

    "fig_6_4_28.png": (229, [140, 85, 440, 215]),

    "fig_6_4_29.png": (229, [120, 550, 440, 700]),

    "fig_6_4_30.png": (230, [120, 115, 460, 215]),

    "fig_6_4_31.png": (230, [100, 315, 480, 535]),

    "fig_6_4_32.png": (231, [120, 95, 460, 240]),

    "fig_6_4_33.png": (231, [120, 360, 460, 510]),

    "fig_6_4_34.png": (232, [120, 180, 440, 580]),
}

doc = pymupdf.open(PDF_PATH)
for fname, (page_idx, rect) in FIGURE_BOXES_6_4.items():
    out_file = os.path.join(OUT_DIR, fname)
    page = doc[page_idx]
    r = pymupdf.Rect(rect[0], rect[1], rect[2], rect[3])
    pix = page.get_pixmap(dpi=200, clip=r)
    pix.save(out_file)

doc.close()
print(f"Successfully cropped {len(FIGURE_BOXES_6_4)} figures for Section 6.4!")
