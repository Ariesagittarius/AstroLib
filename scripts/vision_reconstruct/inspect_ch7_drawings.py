import sys
import io
import pymupdf

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

doc = pymupdf.open("task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf")

for p in range(253, 297):
    phys_p = p + 1
    page = doc[p]
    drawings = page.get_drawings()
    images = page.get_images()
    # Check if there are significant drawings or images
    if len(drawings) > 10 or len(images) > 0:
        # compute bounding box of drawings
        d_rects = [pymupdf.Rect(d["rect"]) for d in drawings if d["rect"].width > 20 and d["rect"].height > 10]
        union_rect = None
        for r in d_rects:
            if union_rect is None:
                union_rect = pymupdf.Rect(r)
            else:
                union_rect |= r
        
        # Also find text blocks near this area
        blocks = page.get_text("blocks")
        caption_cand = []
        for b in blocks:
            # if block is short or contains 图
            if "图" in b[4] or "7." in b[4] or len(b[4].strip()) < 40:
                caption_cand.append(f"[{b[1]:.0f}-{b[3]:.0f}] {b[4].strip().replace(chr(10), ' ')}")
        
        print(f"P{phys_p} (doc {p}, book {phys_p-15}): drawings={len(drawings)}, bbox={union_rect}")
        for c in caption_cand[:3]:
            print(f"   text: {c}")

doc.close()
