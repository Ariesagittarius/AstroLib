import fitz
import re
import os

pdf_path = r"task\通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
output_dir = r"src\content\docs\collections\telecom\communication_principles\images"
os.makedirs(output_dir, exist_ok=True)

doc = fitz.open(pdf_path)

# Manual fine-tuning for pages where there are multiple figures or special layout
# Let's inspect each page's drawings and text blocks to define exact crop boxes.
# Page size is typically ~419 x 595 pt or similar.
figure_specs = [
    # Chapter 11
    # Phys 403: fig_11_2_1 occupies almost entire upper/middle part of page (three subfigures a, b, c)
    {"id": "fig_11_2_1", "phys": 403, "crop": [40, 50, 385, 520]},
    
    # Phys 404: two figures on page: fig_11_2_2 (top) and fig_11_2_3 (bottom)
    {"id": "fig_11_2_2", "phys": 404, "crop": [40, 50, 385, 240]},
    {"id": "fig_11_2_3", "phys": 404, "crop": [40, 345, 385, 455]},
    
    # Phys 405: fig_11_2_4 (bottom of page)
    {"id": "fig_11_2_4", "phys": 405, "crop": [40, 375, 385, 505]},
    
    # Phys 406: fig_11_3_1 (a & b)
    {"id": "fig_11_3_1", "phys": 406, "crop": [40, 275, 385, 515]},
    
    # Phys 407: fig_11_4_1 (upper) and fig_11_4_2 (middle/lower)
    {"id": "fig_11_4_1", "phys": 407, "crop": [40, 160, 385, 260]},
    {"id": "fig_11_4_2", "phys": 407, "crop": [40, 290, 385, 435]},
    
    # Phys 408: fig_11_4_3 (upper) and fig_11_4_4 (middle)
    {"id": "fig_11_4_3", "phys": 408, "crop": [40, 80, 385, 195]},
    {"id": "fig_11_4_4", "phys": 408, "crop": [40, 275, 385, 455]},
    
    # Phys 409: fig_11_5_1 (a & b)
    {"id": "fig_11_5_1", "phys": 409, "crop": [40, 60, 385, 295]},
    
    # Phys 411: fig_11_6_1 (a & b)
    {"id": "fig_11_6_1", "phys": 411, "crop": [40, 60, 385, 440]},

    # Chapter 12
    # Phys 412: fig_12_1_1
    {"id": "fig_12_1_1", "phys": 412, "crop": [40, 180, 385, 335]},
    
    # Phys 418: fig_12_3_1
    {"id": "fig_12_3_1", "phys": 418, "crop": [40, 175, 385, 495]},
    
    # Phys 419: fig_12_3_2
    {"id": "fig_12_3_2", "phys": 419, "crop": [40, 120, 385, 435]},
    
    # Phys 421: fig_12_4_1
    {"id": "fig_12_4_1", "phys": 421, "crop": [40, 265, 385, 450]},
    
    # Phys 422: fig_12_4_2
    {"id": "fig_12_4_2", "phys": 422, "crop": [40, 120, 385, 395]},

    # Chapter 13
    # Phys 425: fig_13_2_1
    {"id": "fig_13_2_1", "phys": 425, "crop": [40, 210, 385, 445]},
    
    # Phys 426: fig_13_3_1
    {"id": "fig_13_3_1", "phys": 426, "crop": [40, 95, 385, 305]},
    
    # Phys 430: fig_13_4_1
    {"id": "fig_13_4_1", "phys": 430, "crop": [40, 140, 385, 435]},
    
    # Phys 432: fig_13_4_2
    {"id": "fig_13_4_2", "phys": 432, "crop": [40, 115, 385, 235]},
    
    # Phys 433: fig_13_5_1
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
