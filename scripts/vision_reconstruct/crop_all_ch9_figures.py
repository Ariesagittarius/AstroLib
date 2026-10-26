import pymupdf
import os

pdf_path = "task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
doc = pymupdf.open(pdf_path)
out_dir = "src/content/docs/collections/telecom/communication_principles/images"
os.makedirs(out_dir, exist_ok=True)

figures_info = [

    (316, fitz_rect := (80, 140, 440, 368), "fig_9_1_1.png"),

    (318, (120, 105, 400, 226), "fig_9_1_2.png"),

    (327, (45, 220, 255, 410), "fig_9_2_1.png"),

    (327, (260, 220, 475, 410), "fig_9_2_2.png"),

    (327, (120, 480, 400, 625), "fig_9_2_3.png"),

    (329, (60, 75, 460, 305), "fig_9_2_4.png"),

    (331, (55, 370, 465, 610), "fig_9_3_1.png"),

    (339, (55, 75, 465, 215), "fig_9_3_2.png"),

    (340, (55, 75, 465, 210), "fig_9_3_3.png"),

    (340, (55, 225, 465, 348), "fig_9_3_4.png"),

    (346, (60, 90, 460, 292), "fig_9_4_1.png"),

    (346, (60, 440, 460, 602), "fig_9_5_1.png"),

    (347, (60, 245, 460, 365), "fig_9_5_2.png"),

    (349, (60, 185, 460, 295), "fig_9_5_3.png"),

    (351, (80, 65, 440, 178), "fig_9_5_4.png"),

    (351, (60, 230, 460, 435), "fig_9_5_5.png"),

    (352, (60, 170, 460, 385), "fig_9_5_6.png"),

    (355, (60, 545, 460, 688), "fig_9_5_7.png"),

    (356, (60, 75, 460, 220), "fig_9_5_8.png"),

    (357, (50, 75, 470, 685), "fig_9_5_9.png"),

    (358, (80, 260, 440, 345), "fig_9_6_1.png"),

    (358, (60, 360, 460, 535), "fig_9_6_2.png"),

    (359, (60, 490, 460, 625), "fig_9_7_1.png"),

    (361, (50, 35, 470, 255), "fig_9_7_2.png"),

    (361, (60, 485, 460, 590), "fig_9_8_1.png"),

    (362, (60, 170, 460, 345), "fig_9_8_2.png"),

    (363, (50, 75, 470, 542), "fig_9_9_1.png"),

    (364, (45, 350, 260, 490), "fig_9_9_2.png"),

    (364, (260, 350, 475, 490), "fig_9_9_3.png"),

    (365, (60, 290, 460, 520), "fig_9_9_4.png"),

    (366, (60, 360, 460, 490), "fig_9_9_5.png"),

    (367, (60, 225, 460, 345), "fig_9_9_6.png"),

    (368, (80, 360, 440, 582), "fig_9_10_1.png"),
]

zoom = 200 / 72
mat = pymupdf.Matrix(zoom, zoom)

for pno, bbox, filename in figures_info:
    page = doc[pno]
    rect = pymupdf.Rect(*bbox)
    pix = page.get_pixmap(matrix=mat, clip=rect)
    save_path = os.path.join(out_dir, filename)
    pix.save(save_path)
    print(f"Saved {filename} from phys page {pno+1}")

print("All Chapter 9 figures materialized successfully!")
