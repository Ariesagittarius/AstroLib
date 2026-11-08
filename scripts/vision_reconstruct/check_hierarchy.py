"""
检查第五章、第六章的标题层级、习题触发器与例题标题规范
"""

import os
import sys
import re

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
REBUILD_DIR = os.path.join(ROOT_DIR, 'src/content/docs/collections/math/engineering_analysis_rebuild')

FILES = [
    '5.1_n维Euclid空间Rn中点集的初步知识.mdx',
    '5.2_多元函数的极限与连续性.mdx',
    '5.3_多元数量值函数的导数与微分.mdx',
    '5.4_多元函数的Taylor公式与极值问题.mdx',
    '5.5_多元向量值函数的导数与微分.mdx',
    '5.6_多元函数微分学在几何上的简单应用.mdx',
    '5.7_空间曲线的曲率与挠率.mdx',
    '6.1_多元数量值函数积分的概念与性质.mdx',
    '6.2_二重积分的计算.mdx',
    '6.3_三重积分的计算.mdx',
]

for fname in FILES:
    fpath = os.path.join(REBUILD_DIR, fname)
    with open(fpath, 'r', encoding='utf-8') as f:
        text = f.read()

    h1s = re.findall(r'^#[^#\r\n]+$', text, flags=re.MULTILINE)

    has_trigger = '<ExerciseTrigger' in text

    long_ex = []
    for m in re.finditer(r'<Example\s+title="([^"]+)"', text):
        title = m.group(1)
        if len(title) > 80:
            long_ex.append((m.start(), title))

    print(f"[{fname}]")
    print(f"  - 正文 H1 标题: {h1s}")
    print(f"  - 包含习题触发器: {has_trigger}")
    print(f"  - 过长例题标题数: {len(long_ex)}")
    for _, t in long_ex[:3]:
        print(f"      * {t[:60]}...")
