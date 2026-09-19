import os
import sys
import argparse
import fitz

def slice_pages(pdf_path, start_phys_page, end_phys_page, output_dir, dpi=150):
    """
    Slices a range of physical pages (1-indexed, inclusive) into JPEG images.
    """
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF 文件未找到: {pdf_path}")

    os.makedirs(output_dir, exist_ok=True)
    doc = fitz.open(pdf_path)
    rendered_files = []

    print(f"正在从 {pdf_path} 切割物理页 {start_phys_page} 至 {end_phys_page} (DPI={dpi})...")

    for p in range(start_phys_page, end_phys_page + 1):
        idx = p - 1
        if 0 <= idx < len(doc):
            page = doc[idx]
            pix = page.get_pixmap(dpi=dpi)
            out_file = os.path.join(output_dir, f"phys_{p}.jpg")
            pix.save(out_file)
            rendered_files.append(out_file)
            print(f"  [OK] 物理页 {p} (书页约 {max(1, p - 17)}) -> {out_file}")
        else:
            print(f"  [WARN] 物理页 {p} 超出有效范围 (1..{len(doc)})")

    doc.close()
    print(f"切片完成! 共生成 {len(rendered_files)} 张高清页面原图。")
    return rendered_files

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="PDF 教材高清物理页面切片器")
    parser.add_argument("--pdf", default="test/data/工科数学分析基础 上册.pdf", help="源 PDF 路径")
    parser.add_argument("--start", type=int, required=True, help="起始物理页码 (1-indexed)")
    parser.add_argument("--end", type=int, required=True, help="结束物理页码 (1-indexed)")
    parser.add_argument("--out", default="test/data/slices", help="切图输出目录")
    parser.add_argument("--dpi", type=int, default=150, help="输出图像分辨率")

    args = parser.parse_args()
    slice_pages(args.pdf, args.start, args.end, args.out, dpi=args.dpi)
