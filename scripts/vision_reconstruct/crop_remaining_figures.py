import fitz
import re
import os

pdf_path = r"task\通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
output_dir = r"src\content\docs\collections\telecom\communication_principles\images"
os.makedirs(output_dir, exist_ok=True)

doc = fitz.open(pdf_path)

figure_specs = [

    {"id": "fig_11_2_1", "phys": 403, "crop": [40, 50, 385, 520]},

    {"id": "fig_11_2_2", "phys": 404, "crop": [40, 50, 385, 240]},
    {"id": "fig_11_2_3", "phys": 404, "crop": [40, 345, 385, 455]},

    {"id": "fig_11_2_4", "phys": 405, "crop": [40, 375, 385, 505]},

    {"id": "fig_11_3_1", "phys": 406, "crop": [40, 275, 385, 515]},

    {"id": "fig_11_4_1", "phys": 407, "crop": [40, 160, 385, 260]},
    {"id": "fig_11_4_2", "phys": 407, "crop": [40, 290, 385, 435]},

    {"id": "fig_11_4_3", "phys": 408, "crop": [40, 80, 385, 195]},
    {"id": "fig_11_4_4", "phys": 408, "crop": [40, 275, 385, 455]},

    {"id": "fig_11_5_1", "phys": 409, "crop": [40, 60, 385, 295]},

    {"id": "fig_11_6_1", "phys": 411, "crop": [40, 60, 385, 440]},

    {"id": "fig_12_1_1", "phys": 412, "crop": [40, 180, 385, 335]},

    {"id": "fig_12_3_1", "phys": 418, "crop": [40, 175, 385, 495]},

    {"id": "fig_12_3_2", "phys": 419, "crop": [40, 120, 385, 435]},

    {"id": "fig_12_4_1", "phys": 421, "crop": [40, 265, 385, 450]},

    {"id": "fig_12_4_2", "phys": 422, "crop": [40, 120, 385, 395]},

    {"id": "fig_13_2_1", "phys": 425, "crop": [40, 210, 385, 445]},

    {"id": "fig_13_3_1", "phys": 426, "crop": [40, 95, 385, 305]},

    {"id": "fig_13_4_1", "phys": 430, "crop": [40, 140, 385, 435]},

    {"id": "fig_13_4_2", "phys": 432, "crop": [40, 115, 385, 235]},

    {"id": "fig_13_5_1", "phys": 433, "crop": [40, 140, 385, 360]},
]

zoom = 200 / 72
matrix = fitz.Matrix(zoom, zoom)

for spec in figure_specs:
    phys_p = spec["phys"]
    page = doc[phys_p - 1]
    crop_rect = fitz.Rect(spec["crop"])

    pix = page.get_pixmap(matrix=matrix, clip=crop_rect)
    out_path = os.path.join(output_dir, f"{spec['id']}.png")
    pix.save(out_path)
    print(f"Saved {spec['id']}.png (Phys {phys_p}, size: {pix.width}x{pix.height})")

print("All 21 figures cropped and saved successfully!")
