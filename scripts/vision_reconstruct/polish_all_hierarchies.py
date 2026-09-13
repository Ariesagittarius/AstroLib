"""
统一精修第五章与第六章全部 10 篇文档的大纲层级、例题标题与 AST 卡片包裹
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

def polish_5_1():
    fpath = os.path.join(REBUILD_DIR, '5.1_n维Euclid空间Rn中点集的初步知识.mdx')
    with open(fpath, 'r', encoding='utf-8') as f:
        text = f.read()
    # 移除正文多余的重复大标题 "# 第一节 ..."
    text = re.sub(r'#\s*第一节[^\n]*\n+由于多元函数的定义域是[^\n]*\n+', '', text)
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(text)
    print("  [OK] 5.1 大纲层级优化完成")

def polish_5_2():
    fpath = os.path.join(REBUILD_DIR, '5.2_多元函数的极限与连续性.mdx')
    with open(fpath, 'r', encoding='utf-8') as f:
        text = f.read()
    # 优化例 2.5
    old_ex25 = '<Example title="例 2.5 用定义证明 $\\lim_{(x, y) \\to (0, 0)} \\frac{x^2y}{x^2 + y^2} = 0$">\n</Example>'
    new_ex25 = '<Example title="例 2.5 用定义证明二重极限">\n用定义证明 $\\lim_{(x, y) \\to (0, 0)} \\frac{x^2y}{x^2 + y^2} = 0$。\n</Example>'
    text = text.replace(old_ex25, new_ex25)

    # 优化例 2.6
    old_ex26 = '<Example title="例 2.6 设 $f(x, y) = \\frac{xy}{x^2 + y^2}$, 讨论二重极限 $\\lim_{(x, y) \\to (0, 0)} f(x, y)$ 是否存在">\n</Example>'
    new_ex26 = '<Example title="例 2.6 二重极限存在性的讨论">\n设 $f(x, y) = \\frac{xy}{x^2 + y^2}$，讨论二重极限 $\\lim_{(x, y) \\to (0, 0)} f(x, y)$ 是否存在。\n</Example>'
    text = text.replace(old_ex26, new_ex26)

    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(text)
    print("  [OK] 5.2 例题标题分流优化完成")

def polish_5_3():
    fpath = os.path.join(REBUILD_DIR, '5.3_多元数量值函数的导数与微分.mdx')
    with open(fpath, 'r', encoding='utf-8') as f:
        text = f.read()
    # 优化例 3.1
    text = re.sub(
        r'<Example title="例 3\.1 求 \$z=\\arctan \\frac\{y\}\{x\}\$ 的[^\"]+">',
        r'<Example title="例 3.1 偏导数的计算与求值">',
        text
    )
    # 优化例 3.4
    text = re.sub(
        r'<Example title="例 3\.4 求三元函数 \$u\(x,y,z\)=\\sqrt\[z\]\{\\frac\{y\}\{x\}\}\$ 对各个自变量的偏导数及[^\"]+">',
        r'<Example title="例 3.4 三元函数偏导数的计算与求值">',
        text
    )
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(text)
    print("  [OK] 5.3 例题标题分流优化完成")

def polish_5_5():
    fpath = os.path.join(REBUILD_DIR, '5.5_多元向量值函数的导数与微分.mdx')
    with open(fpath, 'r', encoding='utf-8') as f:
        text = f.read()
    # 优化例 5.1
    old_target = '<Example title="例 5.1 设有向量值函数 $\\boldsymbol{f}(x) = \\begin{bmatrix} \\sin 2x \\\\ \\ln(x + \\sqrt{1 + x^2}) \\\\ \\arctan x^2 \\end{bmatrix}$，试求 $\\boldsymbol{f}\'(x), \\boldsymbol{f}\'\'(x)$ 及 $\\boldsymbol{f}\'\'(0)$。">'
    new_target = '<Example title="例 5.1 一元向量值函数导数与二阶导数的计算">\n设有向量值函数 $\\boldsymbol{f}(x) = \\begin{bmatrix} \\sin 2x \\\\ \\ln(x + \\sqrt{1 + x^2}) \\\\ \\arctan x^2 \\end{bmatrix}$，试求 $\\boldsymbol{f}\'(x), \\boldsymbol{f}\'\'(x)$ 及 $\\boldsymbol{f}\'\'(0)$。'
    text = text.replace(old_target, new_target)
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(text)
    print("  [OK] 5.5 例题标题分流优化完成")

def polish_5_7():
    fpath = os.path.join(REBUILD_DIR, '5.7_空间曲线的曲率与挠率.mdx')
    with open(fpath, 'r', encoding='utf-8') as f:
        text = f.read()
    # 优化例 7.1 并包裹 Solution
    old_target = '<Example title="例 7.1 求螺旋线 $\\boldsymbol{r}=(\\text{a}\\cos t, \\text{a}\\sin t, kt)$ 的 Frenet 标架、密切平面以及从切平面的方程">\n\n解 由于'
    new_target = '<Example title="例 7.1 螺旋线的 Frenet 标架与相关平面方程">\n求螺旋线 $\\boldsymbol{r}=(a\\cos t, a\\sin t, kt)$ 的 Frenet 标架、密切平面以及从切平面的方程。\n</Example>\n\n<Solution title="解">\n由于'
    text = text.replace(old_target, new_target)

    # 替换原本在末尾误包裹的 </Example> 为 </Solution>
    text = text.replace('-\\cos t(x - \\text{a}\\cos t) - \\sin t(y - \\text{a}\\sin t) = 0.\n\n$$\n\n</Example>',
                        '-\\cos t(x - \\text{a}\\cos t) - \\sin t(y - \\text{a}\\sin t) = 0.\n\n$$\n\n</Solution>')
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(text)
    print("  [OK] 5.7 例 7.1 卡片闭合与标题分流优化完成")

def polish_6_1():
    fpath = os.path.join(REBUILD_DIR, '6.1_多元数量值函数积分的概念与性质.mdx')
    with open(fpath, 'r', encoding='utf-8') as f:
        text = f.read()
    # 移除正文一级大标题
    text = re.sub(r'#\s*第六章\s*多元函数积分学及其应用\n+', '', text)
    text = re.sub(r'##\s*第一节\s*多元数量值函数积分的概念与性质\n+', '', text)
    # 提升大纲层级
    text = re.sub(r'###\s*(1\.[1-3])', r'## \1', text)
    text = re.sub(r'####\s*(\d+\.)', r'### \1', text)
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(text)
    print("  [OK] 6.1 大纲层级规范化完成")

def polish_6_2():
    fpath = os.path.join(REBUILD_DIR, '6.2_二重积分的计算.mdx')
    with open(fpath, 'r', encoding='utf-8') as f:
        text = f.read()

    # 规范例 2.8 题干与完整解法包裹
    pattern_ex28 = re.compile(
        r'<Example title="例 2\.8 计算由不等式[^\"]+">\s*'
        r'解：这两个不等式表示位于球面与柱面内公共部分的立体[^\n]*\s*'
        r'</Example>\s*'
        r'(<figure[\s\S]*?</figure>)\s*'
        r'(<SideNote[\s\S]*?</SideNote>)\s*'
        r'立体是以球面',
        re.DOTALL
    )

    def repl_func(m):
        fig_content = m.group(1)
        sidenote_content = m.group(2)
        return (
            '<Example title="例 2.8 柱面与球面相交立体的体积计算">\n'
            '计算由不等式 $x^2 + y^2 + z^2 \\leqslant 4a^2$ 与 $x^2 + y^2 \\leqslant 2ay$ 所确定的立体的体积。\n'
            '</Example>\n\n'
            + fig_content + '\n\n'
            + sidenote_content + '\n\n'
            '<Solution title="解">\n'
            '这两个不等式表示位于球面与柱面内公共部分的立体，其图形在 $xOy$ 平面上方的部分如图 6.17 所示。由对称性可知，所求立体的体积是它在第一卦限中那部分体积的四倍。第一卦限内的这个立体是以球面'
        )

    text = pattern_ex28.sub(repl_func, text)

    # 闭合例 2.8 的 Solution (在例 2.9 之前)
    text = text.replace(
        '&= \\frac{16}{9}a^3(3\\pi-4).\n\\end{aligned}\n\n$$\n\n<Example title="例 2.9',
        '&= \\frac{16}{9}a^3(3\\pi-4).\n\\end{aligned}\n\n$$\n\n</Solution>\n\n<Example title="例 2.9'
    )

    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(text)
    print("  [OK] 6.2 例 2.8 题干卡片与完整 Solution 闭合优化完成")

def main():
    print("\n🎨 开始逐篇执行大纲层级与 AST 卡片排版精修...")
    polish_5_1()
    polish_5_2()
    polish_5_3()
    polish_5_5()
    polish_5_7()
    polish_6_1()
    polish_6_2()
    print("🎉 全量精修完成！\n")

if __name__ == '__main__':
    main()
