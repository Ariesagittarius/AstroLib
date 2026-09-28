#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/vision_reconstruct/slice_communication_principles.py
《通信原理（第5版）》（杨鸿文主编，北京邮电大学出版社）专用高清物理切片与压缩工具

特性：
- 基于 PyMuPDF 高精渲染 (150 DPI)；
- 基于 Pillow 执行感官无损压缩 (JPEG Quality=85, optimize=True)；
- 支持多线程并行加速，跳过已存在文件；
- 输出元数据映射 (PHYSICAL_PAGE = BOOK_PAGE + 15)。
"""

import os
import sys
import argparse
import io
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
import pymupdf
from PIL import Image

DEFAULT_PDF = "task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf"
DEFAULT_OUT = "test/data/comm_pages"
OFFSET = 15  # 物理页与原书印刷页偏移常数

def process_page(pdf_path, p, output_dir, dpi=150, quality=85):
    """处理单个页面的渲染与优化压缩保存"""
    out_file = os.path.join(output_dir, f"phys_{p}.jpg")
    if os.path.exists(out_file) and os.path.getsize(out_file) > 10240:
        return p, out_file, os.path.getsize(out_file), False

    doc = pymupdf.open(pdf_path)
    page = doc[p - 1]
    pix = page.get_pixmap(dpi=dpi)
    png_data = pix.tobytes("png")
    doc.close()

    img = Image.open(io.BytesIO(png_data))
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    
    img.save(out_file, format="JPEG", quality=quality, optimize=True)
    return p, out_file, os.path.getsize(out_file), True

def slice_comm_pages(pdf_path=DEFAULT_PDF, start_phys=1, end_phys=439, output_dir=DEFAULT_OUT, dpi=150, quality=85, workers=8):
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF 文件未找到: {pdf_path}")

    os.makedirs(output_dir, exist_ok=True)
    doc = pymupdf.open(pdf_path)
    total_pages = len(doc)
    doc.close()

    start_phys = max(1, start_phys)
    end_phys = min(total_pages, end_phys)
    page_count = end_phys - start_phys + 1

    print(f"==================================================")
    print(f"正在启动《通信原理（第5版）》高清切片与无损压缩工场")
    print(f"源文件: {pdf_path}")
    print(f"物理页范围: {start_phys} -> {end_phys} (共 {page_count} 页)")
    print(f"目标目录: {output_dir}")
    print(f"渲染参数: DPI={dpi}, Quality={quality}, 线程数={workers}")
    print(f"==================================================")

    start_time = time.time()
    total_bytes = 0
    generated_count = 0
    skipped_count = 0

    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {
            executor.submit(process_page, pdf_path, p, output_dir, dpi, quality): p
            for p in range(start_phys, end_phys + 1)
        }

        for future in as_completed(futures):
            p = futures[future]
            try:
                page_num, file_path, size_bytes, was_generated = future.result()
                total_bytes += size_bytes
                if was_generated:
                    generated_count += 1
                else:
                    skipped_count += 1

                book_label = f"正本第 {page_num - OFFSET} 页" if page_num > OFFSET else f"前置页({page_num})"
                if generated_count % 20 == 0 or was_generated and generated_count <= 5 or page_num == end_phys:
                    print(f"  [{page_num}/{end_phys}] 物理页 {page_num:03d} ({book_label}) -> {size_bytes / 1024:.1f} KB")
            except Exception as e:
                print(f"  [ERROR] 处理物理页 {p} 失败: {e}", file=sys.stderr)

    elapsed = time.time() - start_time
    avg_size = (total_bytes / page_count / 1024) if page_count > 0 else 0
    print(f"==================================================")
    print(f"切片与压缩完成!")
    print(f"新生成: {generated_count} 页 | 复用: {skipped_count} 页 | 总计: {page_count} 页")
    print(f"总数据量: {total_bytes / 1024 / 1024:.2f} MB (单页平均 {avg_size:.1f} KB)")
    print(f"耗时: {elapsed:.2f} 秒 (平均速度: {page_count / elapsed:.1f} 页/秒)")
    print(f"==================================================")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="《通信原理》页面高清切片与无损压缩工具")
    parser.add_argument("--pdf", default=DEFAULT_PDF, help="PDF文件路径")
    parser.add_argument("--start", type=int, default=1, help="起始物理页 (1-indexed)")
    parser.add_argument("--end", type=int, default=439, help="结束物理页 (1-indexed)")
    parser.add_argument("--out", default=DEFAULT_OUT, help="输出目录")
    parser.add_argument("--dpi", type=int, default=150, help="DPI分辨率 (默认 150)")
    parser.add_argument("--quality", type=int, default=85, help="JPEG压缩质量 (默认 85)")
    parser.add_argument("--workers", type=int, default=8, help="线程并发数 (默认 8)")

    args = parser.parse_args()
    slice_comm_pages(args.pdf, args.start, args.end, args.out, args.dpi, args.quality, args.workers)
