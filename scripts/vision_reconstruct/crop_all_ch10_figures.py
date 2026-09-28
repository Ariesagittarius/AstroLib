import pymupdf
import os

pdf_path = "task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
doc = pymupdf.open(pdf_path)
out_dir = "src/content/docs/collections/telecom/communication_principles/images"
os.makedirs(out_dir, exist_ok=True)

# pno is 0-indexed (Phys page - 1)
figures_info = [
    # 10.2
    # Phys 376 (pno 375):
    # 图 10.2.1 m 序列产生电路逻辑框图 (caption at y=303.8, y ~ 200..318)
    (375, (100, 195, 420, 318), "fig_10_2_1.png"),
    # 图 10.2.2 状态变化图表 (caption at y=559.1, left column x ~ 50..220, y ~ 360..572)
    (375, (50, 360, 220, 572), "fig_10_2_2.png"),
    # 图 10.2.3 非全0初始状态转移图 (caption at y=559.1, mid column x ~ 220..350, y ~ 420..572)
    (375, (220, 420, 350, 572), "fig_10_2_3.png"),
    # 图 10.2.4 全0初始状态转移图 (caption at y=559.2, right column x ~ 350..470, y ~ 420..572)
    (375, (350, 420, 470, 572), "fig_10_2_4.png"),
    # Phys 377 (pno 376):
    # 图 10.2.5 线性反馈移位寄存器序列发生器逻辑框图 (caption at y=186.3, y ~ 75..200)
    (376, (60, 75, 465, 200), "fig_10_2_5.png"),
    # Phys 378 (pno 377):
    # 图 10.2.6 7位m序列码波形 (caption at y=666.9, y ~ 570..680)
    (377, (60, 570, 465, 680), "fig_10_2_6.png"),
    # Phys 379 (pno 378):
    # 图 10.2.7 双极性m序列码波形的归一化周期性自相关函数 (caption at y=661.9, y ~ 455..675)
    (378, (60, 455, 465, 675), "fig_10_2_7.png"),
    # Phys 380 (pno 379):
    # 图 10.2.8 Gold 码发生器框图 (caption at y=164.3, y ~ 75..178)
    (379, (60, 75, 465, 178), "fig_10_2_8.png"),

    # 10.3
    # Phys 381 (pno 380):
    # 图 10.3.1 并行相关检测原理图 (caption at y=200.9, y ~ 75..215)
    (380, (60, 75, 465, 215), "fig_10_3_1.png"),
    # 图 10.3.2 串行相关检测原理图 (caption at y=371.7, y ~ 285..385)
    (380, (60, 285, 465, 385), "fig_10_3_2.png"),
    # Phys 382 (pno 381):
    # 图 10.3.3 m序列的周期性自相关函数 (caption at y=175.6, y ~ 75..190)
    (381, (60, 75, 465, 190), "fig_10_3_3.png"),
    # 图 10.3.4 双极性7位m序列码波形及其匹配滤波器单位冲激响应波形 (caption at y=322.9, y ~ 225..335)
    (381, (60, 225, 465, 335), "fig_10_3_4.png"),
    # 图 10.3.5 双极性7位m序列码波形匹配滤波器 (caption at y=533.4, y ~ 360..546)
    (381, (60, 360, 465, 546), "fig_10_3_5.png"),
    # Phys 383 (pno 382):
    # 图 10.3.6 细同步误差检测电路 (caption at y=222.4, y ~ 125..236)
    (382, (60, 125, 465, 236), "fig_10_3_6.png"),
    # 图 10.3.7 检测误差特性 (caption at y=345.6, y ~ 240..358)
    (382, (60, 240, 465, 358), "fig_10_3_7.png"),
    # 图 10.3.8 伪码延时锁定电路 (caption around y=540, y ~ 385..560)
    (382, (60, 385, 465, 560), "fig_10_3_8.png"),
    # Phys 384 (pno 383):
    # 图 10.3.9 单码片检测电路 (caption at y=238.5, left half x ~ 50..260, y ~ 100..252)
    (383, (50, 100, 260, 252), "fig_10_3_9.png"),
    # 图 10.3.10 单码片检测特性 (caption at y=238.5, right half x ~ 260..470, y ~ 100..252)
    (383, (260, 100, 470, 252), "fig_10_3_10.png"),
    # 图 10.3.11 伪码跟踪环路框图 (caption at y=486.0, y ~ 390..498)
    (383, (60, 390, 465, 498), "fig_10_3_11.png"),

    # 10.4
    # Phys 385 (pno 384):
    # 图 10.4.1 4阶沃尔什函数及沃尔什序列 (caption at y=316.9, y ~ 120..330)
    (384, (60, 120, 465, 330), "fig_10_4_1.png"),
    # Phys 386 (pno 385):
    # 图 10.4.2 沃尔什函数集 (caption at y=202.7, y ~ 75..215)
    (385, (60, 75, 465, 215), "fig_10_4_2.png"),
    # 图 10.4.3 码片波形 (caption at y=373.3, y ~ 275..385)
    (385, (60, 275, 465, 385), "fig_10_4_3.png"),

    # 10.5
    # Phys 387 (pno 386):
    # 图 10.5.1 产生DS-BPSK信号的原理框图 (caption at y=565.0, y ~ 465..578)
    (386, (60, 465, 465, 578), "fig_10_5_1.png"),
    # Phys 388 (pno 387):
    # 图 10.5.2 DS-BPSK解扩解调框图 (caption at y=413.5, y ~ 285..426)
    (387, (60, 285, 465, 426), "fig_10_5_2.png"),
    # Phys 389 (pno 388):
    # 图 10.5.3 伪码直扩信号功率谱密度示意图 (caption at y=617.7, y ~ 505..630)
    (388, (60, 505, 465, 630), "fig_10_5_3.png"),

    # 10.6
    # Phys 393 (pno 392):
    # 图 10.6.1 用8阶沃尔什码构成的归一化正交基函数 (caption at y=496.1, y ~ 225..510)
    (392, (60, 225, 465, 510), "fig_10_6_1.png"),

    # 10.7
    # Phys 394 (pno 393):
    # 图 10.7.1 相关接收机 (caption at y=420.7, y ~ 350..435)
    (393, (60, 350, 465, 435), "fig_10_7_1.png"),

    # 10.8
    # Phys 396 (pno 395):
    # 图 10.8.1 多径分集接收机框图(Rake接收机) (caption at y=391.6, y ~ 150..405)
    (395, (60, 150, 465, 405), "fig_10_8_1.png"),

    # 10.9
    # Phys 397 (pno 396):
    # 图 10.9.1 误码测试系统框图 (caption at y=180.7, y ~ 75..195)
    (396, (60, 75, 465, 195), "fig_10_9_1.png"),
    # 图 10.9.2 扰码与解扰通信系统框图 (caption at y=434.3, y ~ 355..448)
    (396, (60, 355, 465, 448), "fig_10_9_2.png"),
    # 图 10.9.3 自同步扰码器和解扰器框图 (caption at y=680.9, y ~ 515..695)
    (396, (60, 515, 465, 695), "fig_10_9_3.png"),
    # Phys 398 (pno 397):
    # 图 10.9.4 数字加密系统框图 (caption at y=540.3, y ~ 420..555)
    (397, (60, 420, 465, 555), "fig_10_9_4.png"),
    # Phys 399 (pno 398):
    # 图 10.9.5 传输时延测量示意图 (caption at y=316.8, y ~ 100..330)
    (398, (60, 100, 465, 330), "fig_10_9_5.png"),
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

print("All Chapter 10 figures materialized successfully!")
