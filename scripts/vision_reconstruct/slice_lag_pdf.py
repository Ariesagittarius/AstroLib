#!/usr/bin/env python3

import os
import sys
import argparse
import pymupdf

DEFAULT_PDF = "task/线性代数与几何.pdf"
DEFAULT_OUT = "test/data/lag_pages"

def slice_lag_pages(pdf_path=DEFAULT_PDF, start_phys=1, end_phys=239, output_dir=DEFAULT_OUT, dpi=150):
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF 文件未找到: {pdf_path}")

    os.makedirs(output_dir, exist_ok=True)
    doc = pymupdf.open(pdf_path)
    total_pages = len(doc)
    print(f"正在从 {pdf_path} 切割物理页 {start_phys} 至 {end_phys} (总页数: {total_pages}, DPI={dpi})...")

    rendered = []
    for p in range(start_phys, end_phys + 1):
        idx = p - 1
        if 0 <= idx < total_pages:
            out_file = os.path.join(output_dir, f"phys_{p}.jpg")
            if not os.path.exists(out_file) or os.path.getsize(out_file) == 0:
                page = doc[idx]
                pix = page.get_pixmap(dpi=dpi)
                pix.save(out_file)

                book_page = p - 10 if p >= 11 else f"前言/目录({p})"
                print(f"  [OK] 物理页 {p} (正本书页 {book_page}) -> {out_file}")
            rendered.append(out_file)
        else:
            print(f"  [WARN] 物理页 {p} 超出范围 (1..{total_pages})")

    doc.close()
    print(f"切片就绪! 共 {len(rendered)} 张物理原图。")
    return rendered

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="《线性代数与几何》页面切片工具")
    parser.add_argument("--pdf", default=DEFAULT_PDF, help="PDF文件路径")
    parser.add_argument("--start", type=int, default=1, help="起始物理页 (1-indexed)")
    parser.add_argument("--end", type=int, default=41, help="结束物理页 (1-indexed)")
    parser.add_argument("--out", default=DEFAULT_OUT, help="输出目录")
    parser.add_argument("--dpi", type=int, default=150, help="DPI分辨率")

    args = parser.parse_args()
    slice_lag_pages(args.pdf, args.start, args.end, args.out, args.dpi)
