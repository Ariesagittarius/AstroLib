"""
自动化教材插图资产实体化工具 (Materialize Figures)
将 OCR 散列 Hash 图片或 PDF 扫描页面中截取的几何插图，统一映射并实体化输出为：
  src/content/docs/collections/math/engineering_analysis_rebuild/images/fig_<chapter>_<num>.png
"""

import os
import sys
import shutil
import argparse
import pymupdf

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
IMAGES_DIR = os.path.join(ROOT_DIR, 'src/content/docs/collections/math/engineering_analysis_rebuild/images')
PDF_PATH = os.path.join(ROOT_DIR, 'test/data/工科数学分析基础 上册.pdf')

# Hash mappings for Chapter 3
CH3_HASH_MAP = {
    'fig_3_1.png': 'e7df89a4c03019955e9197d9786370041e96243d89166fbe482c6134766f7a3f.jpg',
    'fig_3_2.png': '870af19a1612d93a95c1e14fd27f774c9073f70feb339a6ee87f63bde2dcb74b.jpg',
    'fig_3_3.png': '26a1fc7aacd036478bd5045cf84bb9f652353a12473faba26fe92751b7ba8200.jpg',
    'fig_3_5.png': 'a7c15bd9bffdeb56e5273af93cdf2789ce72ec14a0e10e5caf4e431ac89a5c9f.jpg',
    'fig_3_6.png': '0d0bcedb28971f32000e8e0c4198c45cf1bc02574f99a735bb2edf18e8bb19b5.jpg',
    'fig_3_7.png': '6f8a4f4ba28f7c803c86387906f1dc53d6e09c2c36202672c092a01b5548cfb5.jpg',
    'fig_3_8.png': 'a06d2240b9a8f8e8b1cc391b71ecda05689ace59e1c3a5cc6edbb540b1d9b372.jpg',
    'fig_3_9.png': 'e5df8e5b14eef25655438d2f04d66ea26247f2f1427a1e58ed581eb5977d9f80.jpg',
    'fig_3_10.png': 'c3540f788c51a9e588677f018d4067c719f943e472fb7c973dacf7ea986c707b.jpg',
    'fig_3_11.png': '46a79e1de0c841196a737ae51675a287e484da63417335d3a037ae1f365c73ea.jpg',
    'fig_3_12.png': '6db586d4d6dbe6a3ef871fd822a6f68c80808420a45d20d72e0f2abb79cbbc16.jpg',
    'fig_3_13.png': 'b032c795c2bb477345d0e6f917d50432d2c0f484e101a846ab4aee896d033c7d.jpg',
    'fig_3_14.png': '3faa0506f8f241893ac394dcd9ff76a364644848ef762183d0bca890abcdcf3b.jpg',
    'fig_3_16.png': '3b1796ab7495cbc086861ee0868d12d0668e2db8c03c4eb29c3fa75c1d3550e7.jpg',
    'fig_3_17.png': 'c5e30bf8dfdf677e81d00b90d9db5db9804edc62672f52d829ade81b53416714.jpg',
    'fig_3_18.png': '45aa834f872832a86113bb3f97132426122f2095ac9edec922de0d9c6fa65e28.jpg',
    'fig_3_19.png': '9177c807a75c61bddbde99677bc4a0a05e62154aa37a459b9d9b762714ab61fd.jpg',
    'fig_3_20.png': '32336624f7a1ed4210ee91b18d3a5618ce1e72fb1dfd49eb07c4dad58c457a91.jpg',
    'fig_3_21.png': 'ad01708b8fcb59fdb149cdc13aa3bfbbf337635de165d425c7a50d0aa112ea23.jpg',
}

# Special crops directly from PDF pages (e.g. composite figures with subfigures (a)(b)(c))
CH3_CROPS = {
    # 图 3.4 (a)(b)(c) on Phys 194 (0-based index 193)
    'fig_3_4.png': {'page_idx': 193, 'rect': [25, 435, 480, 575], 'dpi': 200},
    # 图 3.15 (a)(b)(c)(d) on Phys 238 (0-based index 237)
    'fig_3_15.png': {'page_idx': 237, 'rect': [25, 140, 480, 435], 'dpi': 200},
}

def materialize_chapter_3(force=False):
    os.makedirs(IMAGES_DIR, exist_ok=True)
    doc = None
    if os.path.exists(PDF_PATH):
        doc = pymupdf.open(PDF_PATH)

    print("\n📦 [Materialize] 正在实体化第三章插图资产...")
    
    # 1. Process hash map
    for target_name, hash_name in CH3_HASH_MAP.items():
        dst_path = os.path.join(IMAGES_DIR, target_name)
        src_path = os.path.join(IMAGES_DIR, hash_name)
        if not force and os.path.exists(dst_path):
            print(f"  [OK] {target_name} 已存在，跳过。")
            continue
        if os.path.exists(src_path):
            shutil.copyfile(src_path, dst_path)
            print(f"  [Copy] 成功映射 {hash_name} -> {target_name}")
        else:
            print(f"  [Warn] 源散列图片缺失: {hash_name}")

    # 2. Process special crops from PDF
    if doc:
        for target_name, info in CH3_CROPS.items():
            dst_path = os.path.join(IMAGES_DIR, target_name)
            if not force and os.path.exists(dst_path):
                print(f"  [OK] {target_name} 已存在，跳过。")
                continue
            page = doc[info['page_idx']]
            clip = pymupdf.Rect(*info['rect'])
            pix = page.get_pixmap(dpi=info['dpi'], clip=clip)
            pix.save(dst_path)
            print(f"  [Crop] 成功从 PDF 第 {info['page_idx']+1} 页高保真裁切 -> {target_name}")

    print("🎉 第三章插图资产实体化就绪！\n")

# Hash mappings for Chapter 4
CH4_HASH_MAP = {
    'fig_4_1.png': 'ce4866dae0a139add30ba5dcf63af38e8cf004e58ac812ae8c4f1f2325d55aa0.jpg',
    'fig_4_3.png': '8c7bfff9a19d36f0bb490b2cd066ecd880ffce809d146c6cf09cd93ead3d770b.jpg',
    'fig_4_4.png': 'bb7a9a9d93b5e3001614264ddebf66c5042ee9e21d59369925c058cf592c0fd2.jpg',
    'fig_4_5.png': 'a61de49cec50c57b036a297cc98e9854c626a1caffb8e39c0ee483c8e0450334.jpg',
    'fig_4_6.png': '7c16a6dd42e42f504c6f44b5f9ce4987a2ecadd9091040a8f4c116dbceb0fd80.jpg',
    'fig_4_7.png': 'eaf09b86eceedf574c46ee9a533f86394c14949bd34607b28f1a4ff90c73f980.jpg',
    'fig_4_8.png': 'bbceb344d275a024c7eeefb0a7787b355175375b1310bffdbf6d1d084edb3572.jpg',
    'fig_4_9.png': '7a57912a2bbcd1d764f32c72761c4c31a7961b113f5d3dd879e7674728671cd6.jpg',
}

# Special crops directly from PDF pages for Chapter 4
CH4_CROPS = {
    # 图 4.2 (a)(b) on Phys 265 (0-based index 264)
    'fig_4_2.png': {'page_idx': 264, 'rect': [50, 480, 500, 750], 'dpi': 200},
}

def materialize_chapter_4(force=False):
    os.makedirs(IMAGES_DIR, exist_ok=True)
    doc = None
    if os.path.exists(PDF_PATH):
        doc = pymupdf.open(PDF_PATH)

    print("\n📦 [Materialize] 正在实体化第四章插图资产...")
    
    # 1. Process hash map
    for target_name, hash_name in CH4_HASH_MAP.items():
        dst_path = os.path.join(IMAGES_DIR, target_name)
        src_path = os.path.join(IMAGES_DIR, hash_name)
        if not force and os.path.exists(dst_path):
            print(f"  [OK] {target_name} 已存在，跳过。")
            continue
        if os.path.exists(src_path):
            shutil.copyfile(src_path, dst_path)
            print(f"  [Copy] 成功映射 {hash_name} -> {target_name}")
        else:
            print(f"  [Warn] 源散列图片缺失: {hash_name}")

    # 2. Process special crops from PDF
    if doc:
        for target_name, info in CH4_CROPS.items():
            dst_path = os.path.join(IMAGES_DIR, target_name)
            if not force and os.path.exists(dst_path):
                print(f"  [OK] {target_name} 已存在，跳过。")
                continue
            page = doc[info['page_idx']]
            clip = pymupdf.Rect(*info['rect'])
            pix = page.get_pixmap(dpi=info['dpi'], clip=clip)
            pix.save(dst_path)
            print(f"  [Crop] 成功从 PDF 第 {info['page_idx']+1} 页高保真裁切 -> {target_name}")

    # Also make aliases for fig_4_2_a and fig_4_2_b
    sub_a = os.path.join(IMAGES_DIR, '4e83c3f419ee464bcc7e8fef89422cd8eeb35bcf8490cedecbc27c6fe4fb6017.jpg')
    sub_b = os.path.join(IMAGES_DIR, 'a003045ddd8a2883011337dc5a84c66dd869694c2f8e4ed17b0a1115f5d0a707.jpg')
    if os.path.exists(sub_a):
        shutil.copyfile(sub_a, os.path.join(IMAGES_DIR, 'fig_4_2_a.png'))
    if os.path.exists(sub_b):
        shutil.copyfile(sub_b, os.path.join(IMAGES_DIR, 'fig_4_2_b.png'))

    print("🎉 第四章插图资产实体化就绪！\n")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Materialize chapter figures.')
    parser.add_argument('--chapter', type=int, default=3, help='Chapter number')
    parser.add_argument('--force', action='store_true', help='Force regenerate')
    args = parser.parse_args()

    if args.chapter == 3:
        materialize_chapter_3(force=args.force)
    elif args.chapter == 4:
        materialize_chapter_4(force=args.force)
    else:
        print(f"Chapter {args.chapter} materialization not configured yet.")
