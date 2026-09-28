import os
import pymupdf

PDF_PATH = "task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
OUT_DIR = "src/content/docs/collections/telecom/communication_principles/images"
os.makedirs(OUT_DIR, exist_ok=True)

# Page indices are 0-indexed (page_num - 1)
# Bounding boxes [x0, y0, x1, y1] on 595.28 x 841.89 points
FIGURE_BOXES_6_2 = {
    # 6.2.1 OOK 信号的产生框图 (phys_180, page 179)
    "fig_6_2_1.png": (179, [100, 420, 460, 525]),
    # 6.2.2 OOK 信号波形图 (phys_181, page 180)
    "fig_6_2_2.png": (180, [100, 160, 460, 250]),
    # 6.2.3 单极性不归零码及 OOK 信号的双边功率谱密度 (phys_181, page 180)
    "fig_6_2_3.png": (180, [60, 405, 480, 608]),
    # 6.2.4 利用带通型匹配滤波器进行解调的最佳接收 (phys_182, page 181)
    "fig_6_2_4.png": (181, [100, 85, 460, 215]),
    # 6.2.5 带通型匹配滤波器的 h(t) 及 |H(f)| 图 (phys_182, page 181)
    "fig_6_2_5.png": (181, [60, 250, 480, 550]),
    # 6.2.6 发送 s1(t) 时带通匹配滤波器的输出波形图 (phys_183, page 182)
    "fig_6_2_6.png": (182, [100, 195, 460, 318]),
    # 6.2.7 利用相关解调器的最佳接收 (phys_184, page 183)
    "fig_6_2_7.png": (183, [120, 80, 440, 175]),
    # 6.2.8 解调至基带后进行检测 (phys_184, page 183)
    "fig_6_2_8.png": (183, [60, 230, 480, 412]),
    # 6.2.9 OOK 信号的非相干解调 (phys_185, page 184)
    "fig_6_2_9.png": (184, [80, 185, 470, 240]),
    # 6.2.10 不同数字调制方式的平均误比特率 Pb 与 Eb/N0 关系曲线 (phys_186, page 185)
    "fig_6_2_10.png": (185, [100, 80, 460, 295]),
    # 6.2.11 相位不连续 2FSK 信号的产生 (phys_186, page 185)
    "fig_6_2_11.png": (185, [250, 365, 480, 450]),
    # 6.2.12 利用 VCO 作调频器产生连续相位 2FSK 信号 (phys_186, page 185)
    "fig_6_2_12.png": (185, [100, 520, 460, 625]),
    # 6.2.13 2FSK 两信号的相关系数 rho12 与 2Delta f 的关系 (phys_187, page 186)
    "fig_6_2_13.png": (186, [120, 435, 440, 556]),
    # 6.2.14 2FSK 相干解调框图 (phys_188, page 187)
    "fig_6_2_14.png": (187, [80, 275, 460, 542]),
    # 6.2.15 2FSK 非相干解调 (phys_189, page 188)
    "fig_6_2_15.png": (188, [90, 210, 460, 472]),
    # 6.2.16 2PSK 信号产生框图 (phys_189, page 188)
    "fig_6_2_16.png": (188, [100, 580, 460, 656]),
    # 6.2.17 2PSK 信号功率谱密度图 (phys_190, page 189)
    "fig_6_2_17.png": (189, [60, 205, 480, 432]),
    # 6.2.18 加性白高斯噪声信道条件下 2PSK 的最佳接收 (phys_191, page 190)
    "fig_6_2_18.png": (190, [100, 85, 460, 213]),
    # 6.2.19 理想限带及 AWGN 信道下 2PSK 的最佳频带传输系统 (phys_191, page 190)
    "fig_6_2_19.png": (190, [60, 230, 480, 335]),
    # 6.2.20 DPSK 信号的产生 (phys_191, page 190)
    "fig_6_2_20.png": (190, [80, 540, 470, 625]),
    # 6.2.21 DPSK 解调的两种方案 (phys_192, page 191)
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
