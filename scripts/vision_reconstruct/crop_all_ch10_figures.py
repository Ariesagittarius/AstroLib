import pymupdf
import os

pdf_path = "task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
doc = pymupdf.open(pdf_path)
out_dir = "src/content/docs/collections/telecom/communication_principles/images"
os.makedirs(out_dir, exist_ok=True)

figures_info = [

    (375, (100, 195, 420, 318), "fig_10_2_1.png"),

    (375, (50, 360, 220, 572), "fig_10_2_2.png"),

    (375, (220, 420, 350, 572), "fig_10_2_3.png"),

    (375, (350, 420, 470, 572), "fig_10_2_4.png"),

    (376, (60, 75, 465, 200), "fig_10_2_5.png"),

    (377, (60, 570, 465, 680), "fig_10_2_6.png"),

    (378, (60, 455, 465, 675), "fig_10_2_7.png"),

    (379, (60, 75, 465, 178), "fig_10_2_8.png"),

    (380, (60, 75, 465, 215), "fig_10_3_1.png"),

    (380, (60, 285, 465, 385), "fig_10_3_2.png"),

    (381, (60, 75, 465, 190), "fig_10_3_3.png"),

    (381, (60, 225, 465, 335), "fig_10_3_4.png"),

    (381, (60, 360, 465, 546), "fig_10_3_5.png"),

    (382, (60, 125, 465, 236), "fig_10_3_6.png"),

    (382, (60, 240, 465, 358), "fig_10_3_7.png"),

    (382, (60, 385, 465, 560), "fig_10_3_8.png"),

    (383, (50, 100, 260, 252), "fig_10_3_9.png"),

    (383, (260, 100, 470, 252), "fig_10_3_10.png"),

    (383, (60, 390, 465, 498), "fig_10_3_11.png"),

    (384, (60, 120, 465, 330), "fig_10_4_1.png"),

    (385, (60, 75, 465, 215), "fig_10_4_2.png"),

    (385, (60, 275, 465, 385), "fig_10_4_3.png"),

    (386, (60, 465, 465, 578), "fig_10_5_1.png"),

    (387, (60, 285, 465, 426), "fig_10_5_2.png"),

    (388, (60, 505, 465, 630), "fig_10_5_3.png"),

    (392, (60, 225, 465, 510), "fig_10_6_1.png"),

    (393, (60, 350, 465, 435), "fig_10_7_1.png"),

    (395, (60, 150, 465, 405), "fig_10_8_1.png"),

    (396, (60, 75, 465, 195), "fig_10_9_1.png"),

    (396, (60, 355, 465, 448), "fig_10_9_2.png"),

    (396, (60, 515, 465, 695), "fig_10_9_3.png"),

    (397, (60, 420, 465, 555), "fig_10_9_4.png"),

    (398, (60, 100, 465, 330), "fig_10_9_5.png"),
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

print("All Chapter 10 figures materialized successfully!")
