"""
组装补全完整的 5.4 节 MDX
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
F54_PATH = os.path.join(ROOT_DIR, 'src/content/docs/collections/math/engineering_analysis_rebuild/5.4_多元函数的Taylor公式与极值问题.mdx')
BATCH_55_PATH = os.path.join(ROOT_DIR, 'test/output/5.5_batch_74_83.mdx')

with open(F54_PATH, 'r', encoding='utf-8') as f:
    orig_54 = f.read()

orig_54 = re.sub(r'###\s*第四节[^\n]*\n+', '', orig_54)

idx_ex44 = orig_54.find('例 4.4')
if idx_ex44 == -1:
    raise ValueError("未在 5.4 中找到 例 4.4")
cut_pos = orig_54.find('</Example>', idx_ex44) + len('</Example>')
base_54 = orig_54[:cut_pos].strip()

with open(BATCH_55_PATH, 'r', encoding='utf-8') as f:
    batch_lines = f.readlines()

lagrange_lines = batch_lines[:183]
lagrange_raw = ''.join(lagrange_lines).strip()

lagrange_fixed = lagrange_raw
lagrange_fixed = re.sub(r'L_x = 2z \+ y \+ \\lambda yz = 0,\s*\\tag\{1\}', r'L_x = 2z + y + \\lambda yz = 0, & \\text{①}', lagrange_fixed)
lagrange_fixed = re.sub(r'L_y = 2z \+ x \+ \\lambda xz = 0,\s*\\tag\{2\}', r'L_y = 2z + x + \\lambda xz = 0, & \\text{②}', lagrange_fixed)
lagrange_fixed = re.sub(r'L_z = 2x \+ 2y \+ \\lambda xy = 0,\s*\\tag\{3\}', r'L_z = 2x + 2y + \\lambda xy = 0, & \\text{③}', lagrange_fixed)
lagrange_fixed = re.sub(r'L_\\lambda = xyz - V = 0\.\s*\\tag\{4\}', r'L_\\lambda = xyz - V = 0, & \\text{④}', lagrange_fixed)

lagrange_fixed = re.sub(r'\(y - x\)\(1 \+ \\lambda z\) = 0,\s*\\tag\{5\}', r'(y - x)(1 + \\lambda z) = 0, \\tag{4.27}', lagrange_fixed)
lagrange_fixed = re.sub(r'\(2z - y\)\(2 \+ \\lambda x\) = 0,\s*\\tag\{6\}', r'(2z - y)(2 + \\lambda x) = 0, \\tag{4.28}', lagrange_fixed)
lagrange_fixed = re.sub(r'x = y = 2z,\s*\\tag\{7\}', r'x = y = 2z, \\tag{4.29}', lagrange_fixed)

lagrange_fixed = re.sub(r'(?<!\$)\$(?!\$)([^$\r\n]*?\\tag\{[^{}]+\}[^$\r\n]*?)\$(?!\$)', r'\n\n$$\n\1\n$$\n\n', lagrange_fixed)

middle_content = """

<Solution title="解">
由

$$
\\begin{cases} f_x = 2x(1 + 2y) = 0, \\\\ f_y = 2(x^2 + y) = 0, \\end{cases}
$$

可求出函数 $f$ 在 $D$ 内有三个驻点：$M_1(0,0), M_2\\left(\\frac{1}{\\sqrt{2}}, -\\frac{1}{2}\\right), M_3\\left(-\\frac{1}{\\sqrt{2}}, -\\frac{1}{2}\\right)$，且有 $f(M_1) = 0, f(M_2) = f(M_3) = \\frac{1}{4}$。

在 $D$ 的边界 $x^2 + y^2 = 1$ 上，函数 $f$ 成为变量 $y$ 的一元函数：

$$
\\bar{f} = 1 + 2(1 - y^2)y = 1 + 2y - 2y^3, \\quad -1 \\le y \\le 1.
$$

由 $\\frac{\\mathrm{d}\\bar{f}}{\\mathrm{d}y} = 2 - 6y^2 = 0$ 得 $y = \\pm\\frac{1}{\\sqrt{3}}$，比较 $\\bar{f}(-1) = \\bar{f}(1) = 1$ 与 $\\bar{f}\\left(\\frac{1}{\\sqrt{3}}\\right) = 1 + \\frac{4\\sqrt{3}}{9}$、$\\bar{f}\\left(-\\frac{1}{\\sqrt{3}}\\right) = 1 - \\frac{4\\sqrt{3}}{9}$ 可知，$f$ 在 $D$ 的边界上的最小值是 $1 - \\frac{4\\sqrt{3}}{9}$，最大值是 $1 + \\frac{4\\sqrt{3}}{9}$。

把 $f$ 在 $D$ 内驻点处函数值与它在 $D$ 的边界上的最大值、最小值进行比较，即得

$$
\\min_{(x, y) \\in D} f(x, y) = 0, \\quad \\max_{(x, y) \\in D} f(x, y) = 1 + \\frac{4\\sqrt{3}}{9}.
$$
</Solution>

<Example title="例 4.5 在周长为 $2p$ 的所有三角形中，以等边三角形的面积最大">
证明：在周长为 $2p$ 的所有三角形中，以等边三角形的面积最大。
</Example>

<Solution title="证明">
设三角形三边长分别为 $x, y, z$，则由 Heron 面积公式可得目标函数为

$$
S^2 = p(p - x)(p - y)(p - z). \\tag{4.10}
$$

由题设条件可知 $x + y + z = 2p$，即 $z = 2p - x - y$，代入 (4.10) 式可将目标函数化为

$$
S^2 = f(x, y) = p(p - x)(p - y)(x + y - p).
$$

于是问题就成为求上列目标函数 $f$ 在区域

$$
D = \\{(x, y) \\mid 0 < x < p, \\quad p - x < y < p \\}
$$

上的最大值。

<figure class="vp-figure">
  ![](./images/fig_5_19.png)
  <figcaption>图 5.19 区域 D 示意图</figcaption>
</figure>

由方程组

$$
\\begin{cases} f_x = p(p - y)(2p - 2x - y) = 0, \\\\ f_y = p(p - x)(2p - x - 2y) = 0, \\end{cases}
$$

可求出 $f$ 在 $D$ 内有唯一驻点 $M\\left(\\frac{2p}{3}, \\frac{2p}{3}\\right)$。因为 $f$ 在有界闭区域 $\\overline{D}$ 上连续，故 $f$ 在 $\\overline{D}$ 上有最大值。显然 $f$ 在 $\\overline{D}$ 的边界上的值恒为 0，而 $f$ 在 $D$ 内部的值大于零，故 $f$ 在 $\\overline{D}$ 的最大值必在 $D$ 的内部取到。

由于在 $D$ 内 $f$ 的偏导数存在，且驻点唯一，因而最大值必在驻点 $M$ 处取到。$f(M)$ 为 $f$ 在 $\\overline{D}$ 上的最大值，当然也是 $f$ 在 $D$ 内的最大值，即有

$$
\\max_{(x, y) \\in D} f(x, y) = f\\left(\\frac{2p}{3}, \\frac{2p}{3}\\right) = \\frac{p^4}{27},
$$

这时 $x = y = z = \\frac{2p}{3}$，即面积最大的三角形为等边三角形。
</Solution>

### 3. 最小二乘法

最小二乘法是测量工作和科学实验中常用的一种数据处理方法。例如，根据观测或实验得到自变量 $x$ 和因变量 $y$ 之间的一组数据 $(x_1, y_1), (x_2, y_2), \\dots, (x_n, y_n)$，要求寻找一个适当类型的函数 $y = f(x)$，使得该函数在各点处的值与观测值的偏差

$$
r_i = f(x_i) - y_i \\quad (i = 1, \\dots, n)
$$

的平方和 $\\sum_{i=1}^{n} r_i^2$ 达到最小。这种根据偏差平方和为最小的条件来确定参数的方法就叫做最小二乘法。

<Example title="例 4.6 人口增长函数的最佳拟合曲线">
根据 1971 年到 1982 年我国内地总人口数的统计数据，利用最小二乘法建立我国人口增长的最佳拟合曲线，并预测 1990 年时我国总人口数。
</Example>

<Solution title="解">
采用指数函数 $N = \\mathrm{e}^{a + bt}$ 对数据进行拟合。两边取对数得 $\\ln N = a + bt$，按照最小二乘法，问题归结为选择参数 $a$ 和 $b$，使得偏差平方和

$$
Q(a, b) \\stackrel{\\mathrm{def}}{=} \\sum_{i=1}^{12} (a + bt_i - \\ln N_i)^2 \\tag{4.11}
$$

为最小。利用极值的必要条件 $\\frac{\\partial Q}{\\partial a} = 0, \\frac{\\partial Q}{\\partial b} = 0$，整理得

$$
\\begin{cases} 12 a + \\left(\\sum_{i=1}^{12} t_i\\right) b = \\sum_{i=1}^{12} \\ln N_i, \\\\ \\left(\\sum_{i=1}^{12} t_i\\right) a + \\left(\\sum_{i=1}^{12} t_i^2\\right) b = \\sum_{i=1}^{12} (\\ln N_i) t_i. \\end{cases}
$$

解此方程组可得函数 $Q(a, b)$ 的唯一驻点：

$$
\\bar{a} = -28.01872, \\quad \\bar{b} = 0.01531.
$$

因此，所求人口增长问题的最佳拟合曲线是

$$
N(t) = \\mathrm{e}^{-28.01872 + 0.01531 t}. \\tag{4.12}
$$

由此函数预测 1990 年时我国内地总人口数为 $N(1990) = 11.53993\\text{ 亿}$。

<figure class="vp-figure">
  ![](./images/fig_5_20.png)
  <figcaption>图 5.20 人口增长的最佳拟合曲线图</figcaption>
</figure>
</Solution>

### 4. 最优化的产出水平

设某工厂生产两种产品，总成本为 $C = C(q_1, q_2)$，总收益为 $R = R(q_1, q_2)$。利润函数为 $L = R(q_1, q_2) - C(q_1, q_2)$。求最大利润的必要条件为边际收益与边际成本相等：

$$
\\frac{\\partial R}{\\partial q_1} = \\frac{\\partial C}{\\partial q_1}, \\quad \\frac{\\partial R}{\\partial q_2} = \\frac{\\partial C}{\\partial q_2}. \\tag{4.14}
$$

<Example title="例 4.7 两种产品的利润最大化产量决策">
某工厂生产两种产品，总成本函数为 $C = q_1^2 + 2q_1q_2 + q_2^2 + 5$，需求函数分别为 $q_1 = 2600 - p_1, q_2 = 1000 - \\frac{1}{4}p_2$。为使工厂获得最大利润，试确定两种产品的产量。
</Example>

<Solution title="解">
由需求函数得反需求函数 $p_1 = 2600 - q_1, p_2 = 4000 - 4q_2$，总收益函数为

$$
R = p_1 q_1 + p_2 q_2 = 2600 q_1 + 4000 q_2 - q_1^2 - 4 q_2^2.
$$

根据边际收益等于边际成本条件，整理得方程组

$$
\\begin{cases} 2q_1 + q_2 = 1300, \\\\ q_1 + 5q_2 = 2000. \\end{cases}
$$

解之得 $q_1 = 500, q_2 = 300$。此时最大利润为 $L = 1\\,249\\,995\\text{ 元}$。
</Solution>

## 4.3 有约束极值与 Lagrange 乘数法

无约束极值问题中，目标函数各个自变量是独立变化的。但大量实际极值问题的自变量常附带有限制条件，这类附有约束条件的极值问题，称为**有约束极值（或条件极值）**问题。

例如，求函数 $z = x^2 + y^2$ 在约束条件 $x + y - 1 = 0$ 下的有约束极小值。容易算出该极小值等于 $\\frac{1}{2}$，且在点 $\\left(\\frac{1}{2}, \\frac{1}{2}\\right)$ 处取得。

<figure class="vp-figure">
  ![](./images/fig_5_21.png)
  <figcaption>图 5.21 曲面与平面交线上的极小值</figcaption>
</figure>

<figure class="vp-figure">
  ![](./images/fig_5_22.png)
  <figcaption>图 5.22 等值线与约束直线的切点</figcaption>
</figure>

有约束极值的一般形式是在条件组 $\\varphi_k(x_1, \\dots, x_n) = 0$ ($k = 1, \\dots, m, m < n$) 的限制下，求目标函数 $u = f(x_1, \\dots, x_n)$ 的极值。

"""

final_54 = base_54 + "\n" + middle_content + "\n" + lagrange_fixed + '\n\n<ExerciseTrigger chapter={5} section="5.4" title="5.4 多元函数的Taylor公式与极值问题 课后真题与自测练习" />\n'

with open(F54_PATH, 'w', encoding='utf-8') as f:
    f.write(final_54)

print("5.4 assembly completed successfully!")
