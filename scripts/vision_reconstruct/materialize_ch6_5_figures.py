import os
import pymupdf

PDF_PATH = "task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
OUT_DIR = "src/content/docs/collections/telecom/communication_principles/images"
os.makedirs(OUT_DIR, exist_ok=True)

# Bounding boxes [x0, y0, x1, y1] for Section 6.5 figures
# Note: 0-indexed page in doc: page 233 = phys_234 (book p.219), etc.
FIGURE_BOXES_6_5 = {
    # 图 6.5.1 2FSK 信号频率间隔为 1/(2Tb)
    "fig_6_5_1.png": (233, [100, 130, 480, 205]),
    # 图 6.5.2 利用 h=0.5 的 VCO 产生 MSK 信号
    "fig_6_5_2.png": (233, [100, 310, 480, 395]),
    # 图 6.5.3 矩形脉冲 gT(t) 与 q(t) 波形图
    "fig_6_5_3.png": (234, [100, 235, 480, 325]),
    # 图 6.5.4 MSK 相位路径与相位网格图
    "fig_6_5_4.png": (235, [80, 380, 480, 640]),
    # 图 6.5.5 MSK 相位路径（含初始相位）
    "fig_6_5_5.png": (236, [80, 230, 480, 495]),
    # 图 6.5.6 MSK 信号产生方框图 (a) 正交调制法 (b) 差分编码法
    "fig_6_5_6.png": (238, [80, 80, 480, 360]),
    # 图 6.5.7 MSK 功率谱密度图
    "fig_6_5_7.png": (239, [100, 120, 480, 315]),
    # 图 6.5.8 MSK 最佳相干接收机框图
    "fig_6_5_8.png": (239, [100, 340, 480, 470]),
    # 图 6.5.9 GMSK 信号产生原理框图
    "fig_6_5_9.png": (239, [100, 590, 480, 705]),
    # 图 6.5.10 BTb=0.3 高斯滤波器的冲激响应 g(t)
    "fig_6_5_10.png": (241, [100, 210, 480, 355]),
    # 图 6.5.11 高斯滤波器相位响应 q(t)
    "fig_6_5_11.png": (241, [80, 530, 480, 665]),
    # 图 6.5.12 BTb=0.3 GMSK 信号的眼图
    "fig_6_5_12.png": (242, [100, 260, 480, 420]),
    # 图 6.5.13 BTb=0.3 GMSK 信号的相位路径
    "fig_6_5_13.png": (242, [100, 535, 480, 675]),
    # 图 6.5.14 GMSK 信号功率谱密度图
    "fig_6_5_14.png": (243, [100, 100, 480, 320]),
    # 图 6.5.15 洛朗分解主脉冲 c0(t) 与次脉冲 c1(t)
    "fig_6_5_15.png": (244, [80, 90, 480, 280]),
    # 图 6.5.16 c0(t) 与 MSK 脉冲比较 (若存在) 或预编码
    # Let's inspect page 244 carefully
    # 图 6.5.17 GMSK 差分预编码器
    "fig_6_5_17.png": (244, [100, 370, 480, 475]),
    # 图 6.5.18 基于 ROM 查找表的 GMSK 调制器
    "fig_6_5_18.png": (245, [80, 360, 480, 655]),
    # 图 6.5.19 GMSK 正交调制器方框图
    "fig_6_5_19.png": (246, [80, 440, 480, 565]),
    # 图 6.5.20 同相及正交支路波形与抽样
    "fig_6_5_20.png": (247, [80, 100, 480, 245]),
    # 图 6.5.21 GMSK 相干接收机框图与误码率
    "fig_6_5_21.png": (247, [80, 410, 480, 550]),
}

doc = pymupdf.open(PDF_PATH)
zoom = 2.0  # 200 DPI
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
