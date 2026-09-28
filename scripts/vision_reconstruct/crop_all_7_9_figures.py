import os
import pymupdf

PDF_PATH = "task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
OUT_DIR = "src/content/docs/collections/telecom/communication_principles/images"
os.makedirs(OUT_DIR, exist_ok=True)

# Precision bounding boxes for Section 7.9 figures
FIGURE_BOXES_7_9 = {
    # 图 7.9.1 模拟信号数字化全过程 (a~e)
    "fig_7_9_1.png": (271, [50, 530, 480, 700]),
    # 图 7.9.2 采样原理框图
    "fig_7_9_2.png": (272, [80, 180, 460, 260]),
    # 图 7.9.3 采样冲激脉冲序列
    "fig_7_9_3.png": (272, [80, 360, 460, 450]),
    # 图 7.9.4 时域与频域采样与重构全过程
    "fig_7_9_4.png": (273, [50, 45, 480, 460]),
    # 图 7.9.5 采样频率不足导致的频谱混叠
    "fig_7_9_5.png": (275, [80, 110, 460, 250]),
    # 图 7.9.6 带通信号采样频谱搬移
    "fig_7_9_6.png": (276, [60, 380, 480, 560]),
    # 图 7.9.7 带通采样最小频率与中心频率关系
    "fig_7_9_7.png": (277, [80, 190, 460, 355]),
    # 图 7.9.8 标量量化器模型与输入输出映射
    "fig_7_9_8.png": (278, [80, 75, 460, 175]),
    # 图 7.9.9 均匀量化阶梯与锯齿波量化误差
    "fig_7_9_9.png": (278, [80, 255, 460, 380]),
    # 图 7.9.10 均匀量化与对数压扩信噪比对比
    "fig_7_9_10.png": (280, [60, 440, 480, 635]),
    # 图 7.9.11 压缩器与扩张器构成的压扩系统
    "fig_7_9_11.png": (281, [80, 100, 460, 255]),
    # 图 7.9.12 A 律与 μ 律对数压缩特性曲线
    "fig_7_9_12.png": (281, [80, 370, 460, 595]),
    # 图 7.9.13 A 律 13 折线正极性特性曲线
    "fig_7_9_13.png": (282, [60, 75, 480, 365]),
    # 图 7.9.14 时分复用（TDM）原理
    "fig_7_9_14.png": (283, [80, 145, 460, 325]),
    # 图 7.9.15 PCM 30/32 路一次群帧结构
    "fig_7_9_15.png": (283, [80, 350, 460, 555]),
    # 图 7.9.16 二维空间矢量量化网格与胞腔
    "fig_7_9_16.png": (284, [60, 600, 480, 705]),
    # 图 7.9.17 矢量量化系统原理框图
    "fig_7_9_17.png": (286, [80, 415, 460, 600]),
}

doc = pymupdf.open(PDF_PATH)
zoom = 2.0
mat = pymupdf.Matrix(zoom, zoom)

for fig_name, (page_num, bbox) in FIGURE_BOXES_7_9.items():
    page = doc[page_num]
    rect = pymupdf.Rect(*bbox)
    pix = page.get_pixmap(matrix=mat, clip=rect)
    out_path = os.path.join(OUT_DIR, fig_name)
    pix.save(out_path)
    print(f"Extracted {fig_name} from page {page_num} -> {out_path} ({pix.width}x{pix.height})")

doc.close()
print("All Section 7.9 figures extracted successfully!")
