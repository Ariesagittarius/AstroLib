import os
import sys
import shutil

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
SRC_DIR = os.path.join(ROOT_DIR, 'src/content/docs/collections/math/engineering_analysis/images')
DST_DIR = os.path.join(ROOT_DIR, 'src/content/docs/collections/math/engineering_analysis_rebuild/images')
os.makedirs(DST_DIR, exist_ok=True)

all_src = os.listdir(SRC_DIR)

def find_file(prefix):
    for f in all_src:
        if f.startswith(prefix):
            return f
    return None

MAPPINGS = {
    # 1.1 节
    'fig_1_1.png': 'c237676a8c42',
    'fig_1_2.png': 'f2482ee5d737',
    'fig_1_3.png': '4a611497ede1',
    'fig_1_4.png': 'c3e9f341c955',
    'fig_1_5.png': '92f49f55275f',
    'fig_1_6.png': '576880e090a9',
    'fig_1_7.png': '0d621a6dbcf2',
    'fig_1_8.png': 'c2fa012a84dc',
    'fig_1_9.png': '558f764be7e7',
    'fig_1_10.png': 'dc09d673ea73',
    'fig_1_11.png': 'ba0c093d523a',
    
    # 1.2 节
    'fig_1_12.png': 'b0cd161e1e1c',
    'fig_1_13.png': '4bcd16a80029',
    'fig_1_14.png': '17cd81a5e57b',
    'fig_1_15.png': '1e18c1870244',

    # 1.3 节
    'fig_1_16.png': '041d3898f37b',
    'fig_1_17.png': '6c4f868386e9',
    'fig_1_18.png': 'd3db3eaa3ac3',
    'fig_1_19.png': 'c6077fc0a80d',

    # 1.4 节
    'fig_1_20.png': '7021d3a90b89',
    'fig_1_21.png': '96b4a4df8386',

    # 1.5 节
    'fig_1_22.png': '4aa7f46ab47c',
    'fig_1_23.png': '4aa7f46ab47c',
    'fig_1_24.png': '816a70a3fd2f',
    'fig_1_25.png': '8e3c932bc44c',
    'fig_1_26.png': '83d5e3e1574c',
}

print("📦 [Materialize Ch1] 正在实体化第一章插图资产...")
count = 0
for target, prefix in MAPPINGS.items():
    match = find_file(prefix)
    if match:
        src = os.path.join(SRC_DIR, match)
        dst = os.path.join(DST_DIR, target)
        shutil.copyfile(src, dst)
        print(f"  [OK] {match[:12]}... -> {target}")
        count += 1
    else:
        print(f"  [WARN] 未找到前缀匹配: {prefix} (目标: {target})")

print(f"🎉 第一章插图实体化完成! 成功拷贝 {count} 张配图。\n")
