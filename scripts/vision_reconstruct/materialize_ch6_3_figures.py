import os
import pymupdf

PDF_PATH = "task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
OUT_DIR = "src/content/docs/collections/telecom/communication_principles/images"
os.makedirs(OUT_DIR, exist_ok=True)

FIGURE_BOXES_6_3 = {
    # 6.3.1 QPSK 信号矢量图 (phys_194, page 179 - 0-indexed: 193)
    "fig_6_3_1.png": (193, [120, 95, 480, 345]),
    # 6.3.2 产生 QPSK 信号的正交调制原理图 (phys_194, page 179 - 0-indexed: 193)
    "fig_6_3_2.png": (193, [100, 410, 480, 545]),
    # 6.3.3 QPSK 串并变换及 I(t), Q(t) 波形图 (phys_194, page 179 - 0-indexed: 193)
    "fig_6_3_3.png": (193, [80, 680, 480, 920]),
    # 6.3.4 2PSK 及 QPSK 双边功率谱密度 (phys_196, page 181 - 0-indexed: 195)
    "fig_6_3_4.png": (195, [100, 95, 480, 530]),
    # 6.3.5 QPSK 信号的最佳接收框图 (phys_197, page 182 - 0-indexed: 196)
    "fig_6_3_5.png": (196, [120, 100, 460, 435]),
    # 6.3.6 理想限带及加性白高斯噪声信道条件下的 QPSK 系统 (phys_198, page 183 - 0-indexed: 197)
    "fig_6_3_6.png": (197, [80, 125, 480, 305]),
    # 6.3.7 DQPSK 信号的产生及相干解调框图 (phys_198, page 183 - 0-indexed: 197)
    "fig_6_3_7.png": (197, [80, 435, 480, 780]),
    # 6.3.8 2PSK, QPSK 及 DPSK, DQPSK 的误比特率 (phys_199, page 184 - 0-indexed: 198)
    "fig_6_3_8.png": (198, [120, 530, 440, 920]),
    # 6.3.9 QPSK 及 OQPSK 的基带波形以及包络 (phys_200, page 185 - 0-indexed: 199)
    "fig_6_3_9.png": (199, [100, 570, 480, 835]),
    # 6.3.10 OQPSK 系统 (phys_201, page 186 - 0-indexed: 200)
    "fig_6_3_10.png": (200, [140, 95, 440, 460]),
}

doc = pymupdf.open(PDF_PATH)
for fname, (page_idx, rect) in FIGURE_BOXES_6_3.items():
    out_file = os.path.join(OUT_DIR, fname)
    page = doc[page_idx]
    r = pymupdf.Rect(rect[0], rect[1], rect[2], rect[3])
    pix = page.get_pixmap(dpi=200, clip=r)
    pix.save(out_file)

doc.close()
print(f"Successfully cropped {len(FIGURE_BOXES_6_3)} figures for Section 6.3!")
