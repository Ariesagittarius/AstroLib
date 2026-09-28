import os
import pymupdf

PDF_PATH = "task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
OUT_DIR = "src/content/docs/collections/telecom/communication_principles/images"
os.makedirs(OUT_DIR, exist_ok=True)

FIGURE_BOXES_CH8 = {
    # 图 8.2.1 广义信道与狭义信道划分
    "fig_8_2_1.png": (299, [50, 640, 480, 715]),
    # 图 8.4.1 调制信道（连续信道）模型
    "fig_8_4_1.png": (302, [80, 400, 460, 515]),
    # 图 8.4.2 连续信道时变线性滤波模型
    "fig_8_4_2.png": (302, [80, 530, 460, 650]),
    # 图 8.4.3 离散编码信道模型
    "fig_8_4_3.png": (303, [80, 200, 460, 335]),
    # 图 8.4.4 二进制对称信道 (BSC) 转移图
    "fig_8_4_4.png": (303, [80, 500, 460, 655]),
    # 图 8.6.1 功率时延谱与频差相关函数
    "fig_8_6_1.png": (307, [80, 520, 460, 690]),
    # 图 8.6.2 多普勒功率谱及时差相关函数
    "fig_8_6_2.png": (309, [80, 50, 460, 215]),
    # 图 8.6.3 Jakes 模型的自相关函数与多普勒功率谱
    "fig_8_6_3.png": (309, [80, 440, 460, 625]),
}

doc = pymupdf.open(PDF_PATH)
zoom = 2.0
mat = pymupdf.Matrix(zoom, zoom)

for fig_name, (page_num, bbox) in FIGURE_BOXES_CH8.items():
    page = doc[page_num]
    rect = pymupdf.Rect(*bbox)
    pix = page.get_pixmap(matrix=mat, clip=rect)
    out_path = os.path.join(OUT_DIR, fig_name)
    pix.save(out_path)
    print(f"Extracted {fig_name} from page {page_num} -> {out_path} ({pix.width}x{pix.height})")

doc.close()
print("All Chapter 8 figures extracted successfully!")
