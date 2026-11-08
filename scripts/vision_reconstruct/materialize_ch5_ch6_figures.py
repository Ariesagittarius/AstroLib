"""
自动化教材插图资产实体化工具 (第五章、第六章专用)
Materialize figures for Chapters 5 and 6
"""

import os
import sys
import shutil
import pymupdf

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
IMAGES_DIR = os.path.join(ROOT_DIR, 'src/content/docs/collections/math/engineering_analysis_rebuild/images')
SRC_IMAGES_DIR = os.path.join(ROOT_DIR, 'src/content/docs/collections/math/engineering_analysis/images')

HASH_MAP = {

    'fig_5_9.png': '576df95bac565b2dadac852d026485ab538170009cea36aba4d60c91bd4bc936.jpg',

    'fig_5_12.png': '4ff65a136ff7b0636979263135cfb3c891561c9387f9ecca4c4b6b4d2132aaef.jpg',
    'fig_5_14.png': 'e015b73748b34cee79306d7e131311420e4f2c9e1a4dc5a956fef2114002a1a7.jpg',
    'fig_5_16.png': 'aa6270bde3e59b30e4a46c4505d53fea54a95d052c6e4b6718ecec415676ecdd.jpg',

    'fig_5_25.png': 'bd116fd6c3bb46fa0cee94c582445732283ce2f621deb6d1b0340efa9103f124.jpg',

    'fig_6_16.png': 'a16a0d5a1ea0df9aac49fd979deac84d29227081c737754c47456d8f19d98f59.jpg',
    'fig_6_17.png': 'a3e153553542514689162141e315880b6b09b73f589e7713a4c67ef19f12b4fc.jpg',
    'fig_6_24.png': '4774cd508133f30f12af65cce5fc09788a6364fb27f4adf82ba25d0f942cf71e.jpg',
    'fig_6_25.png': 'aa9e3e43ab765cb7704677b2294d9c3d1c345e527f73dabe1fc1ea41458d6c44.jpg',

    'fig_6_28.png': 'd70f94e554d2b44a903eb7bde16e9cf9b860cfcad2476f1672a09d8735cc43e6.jpg',
    'fig_6_34.png': '8cbaf8fd942c56b301c22ea77d521abd466f2d73af4a4ed20be881cf25cd5528.jpg',

    'fig_6_48.png': '0ccd90944309e41c1fcfee127199eb2e51b29d1710ac78543fb3944a3bf814a1.jpg',
}

def materialize_fig_5_5():
    """Build composite figure 5.5 with subfigures (a), (b), (c)"""
    a_path = os.path.join(SRC_IMAGES_DIR, '89c970de3be42008a9675affbb2c345d9dd16d70fdb515718612c6db8165dd23.jpg')
    b_path = os.path.join(SRC_IMAGES_DIR, '37a9e082f4c0816dd6401ff674c415a648813e4f9427a86538757171c302694d.jpg')
    c_path = os.path.join(SRC_IMAGES_DIR, 'bb15a69e0a08d47aa28ef0f17261ca3511e38af5350221ffd441f88abdb2c230.jpg')

    doc = pymupdf.open()
    page = doc.new_page(width=620, height=270)
    page.insert_image(pymupdf.Rect(10, 10, 195, 220), filename=a_path)
    page.insert_text(pymupdf.Point(95, 245), '(a)', fontsize=16)

    page.insert_image(pymupdf.Rect(215, 10, 405, 220), filename=b_path)
    page.insert_text(pymupdf.Point(300, 245), '(b)', fontsize=16)

    page.insert_image(pymupdf.Rect(425, 10, 610, 220), filename=c_path)
    page.insert_text(pymupdf.Point(510, 245), '(c)', fontsize=16)

    out_path = os.path.join(IMAGES_DIR, 'fig_5_5.png')
    pix = page.get_pixmap(dpi=150)
    pix.save(out_path)
    print(f"  [OK] 成功合成复合插图 -> fig_5_5.png ({os.path.getsize(out_path)} 字节)")

def main():
    os.makedirs(IMAGES_DIR, exist_ok=True)
    print("\n📦 [Materialize] 开始实体化第五章、第六章缺失插图资产...")

    materialize_fig_5_5()

    for target_name, hash_name in HASH_MAP.items():
        src_path = os.path.join(SRC_IMAGES_DIR, hash_name)
        dst_path = os.path.join(IMAGES_DIR, target_name)
        if not os.path.exists(src_path):
            src_path = os.path.join(IMAGES_DIR, hash_name)

        if os.path.exists(src_path):
            shutil.copyfile(src_path, dst_path)
            print(f"  [OK] 成功映射 {hash_name[:12]}... -> {target_name}")
        else:
            print(f"  [WARN] 未找到源散列图片: {hash_name}")

    print("🎉 第五章、第六章插图资产全部实体化完成！\n")

if __name__ == '__main__':
    main()
