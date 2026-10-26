"""
materialize_ch4_figures.py
Extract and crop all figures in Chapter 4 from the PDF at 200 DPI.
"""
import os
import pymupdf

PDF_PATH = "task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
OUT_DIR = "src/content/docs/collections/telecom/communication_principles/images"
os.makedirs(OUT_DIR, exist_ok=True)

FIGURE_BOXES = {

    "fig_4_1_1.png": (103, [120, 460, 475, 535]),
    "fig_4_1_2.png": (104, [85, 130, 480, 238]),
    "fig_4_1_3.png": (104, [110, 495, 465, 550]),
    "fig_4_1_4.png": (105, [75, 450, 485, 595]),
    "fig_4_1_5.png": (106, [140, 160, 440, 255]),
    "fig_4_1_6.png": (106, [130, 375, 420, 450]),

    "fig_4_2_1.png": (107, [180, 345, 395, 406]),
    "fig_4_2_2.png": (108, [50, 105, 475, 238]),
    "fig_4_2_3.png": (108, [75, 295, 465, 558]),
    "fig_4_2_4.png": (109, [140, 260, 420, 325]),
    "fig_4_2_5.png": (110, [75, 400, 465, 628]),
    "fig_4_2_6.png": (111, [75, 105, 475, 195]),
    "fig_4_2_7.png": (111, [75, 360, 465, 535]),
    "fig_4_2_8.png": (111, [150, 635, 400, 670]),
    "fig_4_2_9.png": (113, [75, 180, 475, 335]),
    "fig_4_2_10.png": (113, [85, 365, 450, 465]),
    "fig_4_2_11.png": (115, [60, 115, 480, 328]),
    "fig_4_2_12.png": (116, [75, 110, 475, 208]),
    "fig_4_2_13.png": (116, [100, 235, 440, 372]),
    "fig_4_2_14.png": (117, [75, 105, 475, 245]),
    "fig_4_2_15.png": (117, [75, 450, 475, 533]),
    "fig_4_2_16.png": (118, [75, 135, 475, 332]),
    "fig_4_2_17.png": (118, [75, 450, 475, 558]),

    "fig_4_3_1.png": (119, [110, 310, 430, 528]),
    "fig_4_3_2.png": (120, [100, 180, 440, 320]),
    "fig_4_3_3.png": (121, [60, 125, 485, 382]),
    "fig_4_3_4.png": (122, [110, 520, 430, 648]),
    "fig_4_3_5.png": (123, [120, 300, 420, 448]),
    "fig_4_3_6.png": (123, [75, 535, 475, 658]),

    "fig_4_4_1.png": (126, [120, 105, 420, 142]),
    "fig_4_4_2.png": (126, [95, 270, 445, 350]),
    "fig_4_4_3.png": (127, [85, 240, 455, 320]),
    "fig_4_4_4.png": (127, [75, 395, 465, 478]),
    "fig_4_4_5.png": (128, [110, 400, 430, 565]),
    "fig_4_4_6.png": (129, [110, 120, 430, 205]),

    "fig_4_5_1.png": (130, [140, 130, 400, 230]),
    "fig_4_5_2.png": (130, [75, 350, 475, 540]),
    "fig_4_5_3.png": (131, [60, 105, 480, 196]),
    "fig_4_5_4.png": (131, [110, 235, 430, 318]),
    "fig_4_5_5.png": (132, [60, 105, 480, 412]),
}

doc = pymupdf.open(PDF_PATH)
for fname, (page_idx, rect) in FIGURE_BOXES.items():
    out_file = os.path.join(OUT_DIR, fname)
    page = doc[page_idx]
    r = pymupdf.Rect(rect[0], rect[1], rect[2], rect[3])
    pix = page.get_pixmap(dpi=200, clip=r)
    pix.save(out_file)

doc.close()
print("Cleanly cropped all Chapter 4 figures!")
