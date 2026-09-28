import pymupdf
import os

pdf_path = "task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
doc = pymupdf.open(pdf_path)
out_dir = "src/content/docs/collections/telecom/communication_principles/images"
os.makedirs(out_dir, exist_ok=True)

# Define exact bboxes for each figure
# (pno 0-indexed, (x0, y0, x1, y1), filename)
# Note: Page size is typically 595 x 842 pt
# Let's inspect page drawing rects or use safe margins around captions
# Let's check caption positions from ch9_captions_detailed.txt

figures_info = [
    # 9.1
    # Phys 317 (pno 316): caption at y=350.9 (图 9.1.1 重复编码). Drawing is above it (y approx 140 to 365)
    (316, fitz_rect := (80, 140, 440, 368), "fig_9_1_1.png"),
    # Phys 319 (pno 318): caption at y=210.6 (图 9.1.2 码纠错能力的几何解释). Drawing is above it (y approx 110 to 225)
    (318, (120, 105, 400, 226), "fig_9_1_2.png"),
    
    # 9.2
    # Phys 328 (pno 327):
    # 图 9.2.1 线性分组(7,3)系统码编码器 (caption at y=393.5, left column x ~ 50..250, y ~ 220..410)
    (327, (45, 220, 255, 410), "fig_9_2_1.png"),
    # 图 9.2.2 线性分组(7,4)系统码编码器 (caption at y=393.9, right column x ~ 260..470, y ~ 220..410)
    (327, (260, 220, 475, 410), "fig_9_2_2.png"),
    # 图 9.2.3 二元信道的模型 (caption at y=610.6, y ~ 480..625)
    (327, (120, 480, 400, 625), "fig_9_2_3.png"),
    # Phys 330 (pno 329):
    # 图 9.2.4 (7,4)线性分组码译码电路 (caption at y=294.1, y ~ 80..305)
    (329, (60, 75, 460, 305), "fig_9_2_4.png"),
    
    # 9.3
    # Phys 332 (pno 331):
    # 图 9.3.1 (7,3)循环码及(7,4)循环码的码字循环关系 (caption at y=597.8, y ~ 370..610)
    (331, (55, 370, 465, 610), "fig_9_3_1.png"),
    # Phys 340 (pno 339):
    # 图 9.3.2 (7,4)循环系统汉明码编码电路 (caption at y=199.6, y ~ 75..215)
    (339, (55, 75, 465, 215), "fig_9_3_2.png"),
    # Phys 341 (pno 340):
    # 图 9.3.3 CRC 编码器 (caption at y=195.7, y ~ 75..210)
    (340, (55, 75, 465, 210), "fig_9_3_3.png"),
    # 图 9.3.4 CRC 译码器 (caption at y=332.7, y ~ 225..348)
    (340, (55, 225, 465, 348), "fig_9_3_4.png"),
    
    # 9.4
    # Phys 347 (pno 346):
    # 图 9.4.1 (15,9) RS 码编码器示意图 (caption at y=278.0, y ~ 90..290)
    (346, (60, 90, 460, 292), "fig_9_4_1.png"),
    
    # 9.5
    # Phys 347 (pno 346):
    # 图 9.5.1 卷积编码器 (caption at y=588.6, y ~ 440..602)
    (346, (60, 440, 460, 602), "fig_9_5_1.png"),
    # Phys 348 (pno 347):
    # 图 9.5.2 (2,1,4) 卷积码编码器 (caption at y=349.3, y ~ 245..365)
    (347, (60, 245, 460, 365), "fig_9_5_2.png"),
    # Phys 350 (pno 349):
    # 图 9.5.3 (2,1,3) 卷积码编码器 (caption at y=279.5, y ~ 185..295)
    (349, (60, 185, 460, 295), "fig_9_5_3.png"),
    # Phys 352 (pno 351):
    # 图 9.5.4 (2,1,3) 卷积码状态图 (caption at y=164.7, y ~ 65..178)
    (351, (80, 65, 440, 178), "fig_9_5_4.png"),
    # 图 9.5.5 (2,1,3) 卷积码树图表示 (caption at y=422.6, y ~ 230..435)
    (351, (60, 230, 460, 435), "fig_9_5_5.png"),
    # Phys 353 (pno 352):
    # 图 9.5.6 (2,1,3) 卷积码网格图表示法 (caption at y=372.9, y ~ 170..385)
    (352, (60, 170, 460, 385), "fig_9_5_6.png"),
    # Phys 356 (pno 355):
    # 图 9.5.7 L=5, (2,1,3) 卷积码距离图 (caption at y=675.7, y ~ 545..688)
    (355, (60, 545, 460, 688), "fig_9_5_7.png"),
    # Phys 357 (pno 356):
    # 图 9.5.8 L=5, (2,1,3) 卷积码幸存路径图 (caption at y=207.0, y ~ 75..220)
    (356, (60, 75, 460, 220), "fig_9_5_8.png"),
    # Phys 358 (pno 357):
    # 图 9.5.9 维特比算法译码过程 (caption at y=670.8, y ~ 75..685)
    (357, (50, 75, 470, 685), "fig_9_5_9.png"),
    
    # 9.6
    # Phys 359 (pno 358):
    # 图 9.6.1 交织原理框图 (caption at y=331.6, y ~ 260..345)
    (358, (80, 260, 440, 345), "fig_9_6_1.png"),
    # 图 9.6.2 分组交织实现方框图 (caption at y=521.9, y ~ 360..535)
    (358, (60, 360, 460, 535), "fig_9_6_2.png"),
    
    # 9.7
    # Phys 360 (pno 359):
    # 图 9.7.1 标准级联码系统 (caption at y=611.6, y ~ 490..625)
    (359, (60, 490, 460, 625), "fig_9_7_1.png"),
    # Phys 362 (pno 361):
    # 图 9.7.2 级联码性能曲线 (caption around y=240, y ~ 40..255)
    (361, (50, 35, 470, 255), "fig_9_7_2.png"),
    
    # 9.8
    # Phys 362 (pno 361):
    # 图 9.8.1 Turbo 码编码器框图 (caption at y=575.2, y ~ 485..590)
    (361, (60, 485, 460, 590), "fig_9_8_1.png"),
    # Phys 363 (pno 362):
    # 图 9.8.2 Turbo 码译码器框图 (caption at y=330.8, y ~ 170..345)
    (362, (60, 170, 460, 345), "fig_9_8_2.png"),
    
    # 9.9
    # Phys 364 (pno 363):
    # 图 9.9.1 MASK、MPSK、MQAM 信号星座图 (caption at y=527.8, y ~ 75..542)
    (363, (50, 75, 470, 542), "fig_9_9_1.png"),
    # Phys 365 (pno 364):
    # 图 9.9.2 二/四进制调制的欧氏距离图 (caption at y=473.4, left half x ~ 45..260, y ~ 350..490)
    (364, (45, 350, 260, 490), "fig_9_9_2.png"),
    # 图 9.9.3 8PSK 信号星座图 (caption at y=473.4, right half x ~ 260..475, y ~ 350..490)
    (364, (260, 350, 475, 490), "fig_9_9_3.png"),
    # Phys 366 (pno 365):
    # 图 9.9.4 8PSK 信号子集划分图 (caption at y=505.9, y ~ 290..520)
    (365, (60, 290, 460, 520), "fig_9_9_4.png"),
    # Phys 367 (pno 366):
    # 图 9.9.5 TCM 的一般结构 (caption at y=475.2, y ~ 360..490)
    (366, (60, 360, 460, 490), "fig_9_9_5.png"),
    # Phys 368 (pno 367):
    # 图 9.9.6 四状态网格编码最优码与 8PSK 信号映射图 (caption at y=331.0, y ~ 225..345)
    (367, (60, 225, 460, 345), "fig_9_9_6.png"),
    
    # 9.10
    # Phys 369 (pno 368):
    # 图 9.10.1 Tanner 图 (caption at y=567.3, y ~ 360..582)
    (368, (80, 360, 440, 582), "fig_9_10_1.png"),
]

zoom = 200 / 72  # 200 DPI
mat = pymupdf.Matrix(zoom, zoom)

for pno, bbox, filename in figures_info:
    page = doc[pno]
    rect = pymupdf.Rect(*bbox)
    pix = page.get_pixmap(matrix=mat, clip=rect)
    save_path = os.path.join(out_dir, filename)
    pix.save(save_path)
    print(f"Saved {filename} from phys page {pno+1}")

print("All Chapter 9 figures materialized successfully!")
