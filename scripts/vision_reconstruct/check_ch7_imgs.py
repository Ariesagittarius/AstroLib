import pymupdf

doc = pymupdf.open("task/通信原理(第5版) -- 杨鸿文 -- 5, 2024 -- 北京：北京邮电大学出版社 9787563574919 .pdf")

for p in range(253, 297):
    phys_p = p + 1
    page = doc[p]
    imgs = page.get_images()
    if imgs:
        print(f"P{phys_p} (doc {p}): {len(imgs)} images")
        for img in imgs:
            xref = img[0]
            base_image = doc.extract_image(xref)
            print(f"   xref {xref}: {base_image['width']}x{base_image['height']}, ext: {base_image['ext']}")

doc.close()
