"""
知识点图谱与多教材分章映射分类器 (Curriculum Classifier)
支持《工科数学分析》《线性代数》《概率论与数理统计》《新高考数学》等多本教材的精准知识点对齐。
"""

import re
from typing import Dict, List, Tuple, Optional
from .models import BookChapterMapping, QuestionItem

ENGINEERING_ANALYSIS_CURRICULUM = {
    1: {
        "title": "第1章 极限与连续",
        "volume": "upper",
        "sections": {
            "1.1": {"title": "集合映射与函数", "slug": "1.1_集合映射与函数", "keywords": ["集合", "映射", "定义域", "值域", "复合函数", "反函数", "奇偶性", "周期性", "有界性"]},
            "1.2": {"title": "数列的极限", "slug": "1.2_数列的极限", "keywords": ["数列", "数列极限", "收敛", "单调有界", "夹逼准则", "子数列", "柯西审敛", "a_n"]},
            "1.3": {"title": "函数的极限", "slug": "1.3_函数的极限", "keywords": ["函数极限", "重要极限", "左右极限", "lim", "趋于无穷", "x\\to", "x ->"]},
            "1.4": {"title": "无穷小量与无穷大量", "slug": "1.4_无穷小量与无穷大量", "keywords": ["无穷小", "无穷大", "等价无穷小", "同阶无穷小", "高阶无穷小", "低阶无穷小", "阶数"]},
            "1.5": {"title": "连续函数", "slug": "1.5_连续函数", "keywords": ["连续", "间断点", "第一类间断点", "第二类间断点", "可去间断点", "跳跃间断点", "无穷间断点", "零点定理", "介值定理", "最大值最小值定理"]}
        }
    },
    2: {
        "title": "第2章 一元函数微分学",
        "volume": "upper",
        "sections": {
            "2.1": {"title": "导数的概念", "slug": "2.1_导数的概念", "keywords": ["导数定义", "导数", "左导数", "右导数", "可导", "切线斜率", "可微与连续", "f'(x_0)", "f'(0)"]},
            "2.2": {"title": "求导的基本法则", "slug": "2.2_求导的基本法则", "keywords": ["求导", "复合函数求导", "链式法则", "隐函数", "参数方程", "切线方程", "法线方程", "高阶导数", "f^{(n)}", "莱布尼茨公式", "dy/dx", "d^2y/dx^2", "d2y"]},
            "2.3": {"title": "微分", "slug": "2.3_微分", "keywords": ["微分", "全微分", "一阶微分形式不变性", "dy", "dx", "线性近似"]},
            "2.4": {"title": "微分中值定理及其应用", "slug": "2.4_微分中值定理及其应用", "keywords": ["罗尔定理", "拉格朗日中值定理", "柯西中值定理", "中值定理", "洛必达", "L'Hospital", "LHôpital", "未定式"]},
            "2.5": {"title": "Taylor定理及其应用", "slug": "2.5_Taylor定理及其应用", "keywords": ["泰勒", "Taylor", "麦克劳林", "Maclaurin", "泰勒公式", "佩亚诺余项", "拉格朗日余项", "展开式"]},
            "2.6": {"title": "函数性态的研究", "slug": "2.6_函数性态的研究", "keywords": ["极值", "单调性", "单调增加", "单调减少", "凹凸性", "拐点", "渐近线", "水平渐近线", "铅直渐近线", "斜渐近线", "最大值", "最小值", "不等式证明"]}
        }
    },
    3: {
        "title": "第3章 一元函数积分学",
        "volume": "upper",
        "sections": {
            "3.1": {"title": "定积分的概念存在条件与性质", "slug": "3.1_定积分的概念存在条件与性质", "keywords": ["定积分", "积分性质", "可积", "黎曼和", "积分中值定理", "定积分定义"]},
            "3.2": {"title": "微积分基本公式与基本定理", "slug": "3.2_微积分基本公式与基本定理", "keywords": ["变上限积分", "变限积分", "牛顿-莱布尼茨", "微积分基本定理", "原函数"]},
            "3.3": {"title": "两种基本积分法", "slug": "3.3_两种基本积分法", "keywords": ["换元积分", "换元法", "分部积分", "不定积分", "有理函数积分", "三角有理式", "积分计算", "\\int"]},
            "3.4": {"title": "定积分的应用", "slug": "3.4_定积分的应用", "keywords": ["平面图形面积", "旋转体体积", "弧长", "侧面积", "微元法", "质心", "功", "引力", "水压力"]},
            "3.5": {"title": "反常积分", "slug": "3.5_反常积分", "keywords": ["反常积分", "广义积分", "瑕积分", "无穷限积分", "收敛", "发散", "比较审敛法", "绝对收敛", "条件收敛", "Gamma", "\\Gamma"]}
        }
    },
    4: {
        "title": "第4章 常微分方程",
        "volume": "upper",
        "sections": {
            "4.1": {"title": "几类简单的微分方程", "slug": "4.1_几类简单的微分方程", "keywords": ["微分方程", "可分离变量", "一阶线性微分方程", "齐次方程", "伯努利方程", "全微分方程", "积分因子", "通解", "特解", "初值问题"]},
            "4.2": {"title": "高阶线性微分方程", "slug": "4.2_高阶线性微分方程", "keywords": ["二阶常系数", "特征方程", "特征根", "非齐次线性微分方程", "待定系数法", "欧拉方程", "常系数线性微分方程", "y'' +", "y'' -"]},
            "4.3": {"title": "线性微分方程组", "slug": "4.3_线性微分方程组", "keywords": ["微分方程组", "方程组", "特征向量", "消元法"]}
        }
    },
    5: {
        "title": "第5章 多元函数微分学",
        "volume": "lower",
        "sections": {
            "5.1": {"title": "n维Euclid空间点集初步", "slug": "5.1_n维Euclid空间mathbfR^n中点集的初步知识", "keywords": ["点集", "内点", "边界点", "聚点", "开集", "闭集", "连通区域", "距离", "R^n", "欧几里得空间"]},
            "5.2": {"title": "多元函数的极限与连续性", "slug": "5.2_多元函数的极限与连续性", "keywords": ["二元函数", "重极限", "累次极限", "多元连续", "二次极限", "全增量"]},
            "5.3": {"title": "多元函数的导数与微分", "slug": "5.3_多元数量值函数的导数与微分", "keywords": ["偏导数", "全微分", "连续偏导", "复合函数偏导", "隐函数偏导", "雅可比", "\\partial", "dz", "混合偏导", "z = f(x, y)"]},
            "5.4": {"title": "多元函数的Taylor公式与极值问题", "slug": "5.4_多元函数的Taylor公式与极值问题", "keywords": ["多元极值", "极值点", "拉格朗日乘数法", "条件极值", "黑森矩阵", "Hessian", "驻点", "最大值最小值"]},
            "5.5": {"title": "多元向量值函数的导数与微分", "slug": "5.5_多元向量值函数的导数与微分", "keywords": ["向量值函数", "导矩阵", "Jacobi", "雅可比矩阵"]},
            "5.6": {"title": "多元函数微分学在几何上的应用", "slug": "5.6_多元函数微分学在几何上的简单应用", "keywords": ["切平面", "法线", "空间曲线切线", "法平面", "梯度", "方向导数", "\\nabla", "grad"]},
            "5.7": {"title": "空间曲线的曲率与挠率", "slug": "5.7_空间曲线的曲率与挠率", "keywords": ["曲率", "挠率", "Frenet", "主法向量", "副法向量", "弧长参数"]}
        }
    },
    6: {
        "title": "第6章 多元函数积分学",
        "volume": "lower",
        "sections": {
            "6.1": {"title": "多元函数积分的概念与性质", "slug": "6.1_多元数量值函数积分的概念与性质", "keywords": ["重积分性质", "重积分定义", "积分中值定理", "对称性"]},
            "6.2": {"title": "二重积分的计算", "slug": "6.2_二重积分的计算", "keywords": ["二重积分", "极坐标", "交换积分次序", "累次积分", "\\iint", "dxdy", "r dr d\\theta"]},
            "6.3": {"title": "三重积分的计算", "slug": "6.3_三重积分的计算", "keywords": ["三重积分", "柱面坐标", "球面坐标", "投影法", "截面法", "\\iiint", "dxdydz"]},
            "6.4": {"title": "含参变量的积分与反常重积分", "slug": "6.4_含参变量的积分与反常重积分", "keywords": ["含参变量积分", "含参积分", "反常重积分", "一致收敛", "积分号下求导", "积分号下求积"]},
            "6.5": {"title": "重积分的应用", "slug": "6.5_重积分的应用", "keywords": ["曲面面积", "空间体积", "转动惯量", "引力", "质量", "质心坐标"]},
            "6.6": {"title": "第一型线积分与面积分", "slug": "6.6_第一型线积分与面积分", "keywords": ["第一型曲线积分", "第一型曲面积分", "对弧长的曲线积分", "对面积的曲面积分", "\\int_L", "\\iint_\\Sigma", "ds", "dS"]},
            "6.7": {"title": "第二型线积分与面积分", "slug": "6.7_第二型线积分与面积分", "keywords": ["第二型曲线积分", "第二型曲面积分", "对坐标的曲线积分", "对坐标的曲面积分", "P dx + Q dy", "定向曲面", "dydz + dzdx + dxdy"]},
            "6.8": {"title": "各种积分的联系及其在场论中的应用", "slug": "6.8_各种积分的联系及其在场论中的应用", "keywords": ["格林公式", "Green", "高斯公式", "Gauss", "斯托克斯公式", "Stokes", "曲线积分与路径无关", "通量", "散度", "环量", "旋度", "保守场", "势函数", "div", "rot", "curl"]}
        }
    },
    7: {
        "title": "第7章 无穷级数",
        "volume": "lower",
        "sections": {
            "7.1": {"title": "常数项级数", "slug": "7.1_常数项级数", "keywords": ["常数项级数", "级数收敛", "正项级数", "比值审敛法", "根值审敛法", "比较审敛法", "交错级数", "莱布尼茨审敛法", "绝对收敛", "条件收敛", "\\sum_{n=1}^\\infty"]},
            "7.2": {"title": "函数项级数", "slug": "7.2_函数项级数", "keywords": ["函数项级数", "一致收敛", "收敛域", "和函数", "魏尔斯特拉斯", "M判别法", "逐项求导", "逐项求积"]},
            "7.3": {"title": "幂级数", "slug": "7.3_幂级数", "keywords": ["幂级数", "收敛半径", "收敛区间", "和函数", "阿贝尔定理", "麦克劳林展开", "幂级数求和", "\\sum a_n x^n"]},
            "7.4": {"title": "Fourier级数", "slug": "7.4_Fourier级数", "keywords": ["傅里叶级数", "Fourier", "傅氏级数", "狄利克雷收敛定理", "正弦级数", "余弦级数", "半幅延拓", "周期延拓", "Fourier系数"]}
        }
    }
}

LINEAR_ALGEBRA_CURRICULUM = {
    1: {"title": "第1章 线性方程组与矩阵", "slug": "1.1_线性方程组", "keywords": ["线性方程组", "行化简", "阶梯形", "增广矩阵", "主元", "自由变量", "相容性"]},
    2: {"title": "第2章 矩阵代数", "slug": "2.1_矩阵运算", "keywords": ["矩阵乘法", "逆矩阵", "分块矩阵", "初等矩阵", "可逆矩阵定理", "LU分解"]},
    3: {"title": "第3章 行列式", "slug": "3.1_行列式介绍", "keywords": ["行列式", "余子式", "代数余子式", "克拉默法则", "伴随矩阵", "det"]},
    4: {"title": "第4章 向量空间", "slug": "4.1_向量空间与子空间", "keywords": ["向量空间", "子空间", "零空间", "列空间", "基", "维数", "秩", "线性无关", "线性相关"]},
    5: {"title": "第5章 特征值与特征向量", "slug": "5.1_特征向量与特征值", "keywords": ["特征值", "特征向量", "特征多项式", "相似矩阵", "对角化", "特征方程"]},
    6: {"title": "第6章 正交性与最小二乘", "slug": "6.1_内积长度和正交性", "keywords": ["内积", "正交", "正交补", "正交投影", "格拉姆-施密特", "施密特正交化", "QR分解", "最小二乘"]},
    7: {"title": "第7章 对称矩阵与二次型", "slug": "7.1_对称矩阵的对角化", "keywords": ["对称矩阵", "正交对角化", "二次型", "正定", "负定", "奇异值分解", "SVD"]}
}

PROBABILITY_STATISTICS_CURRICULUM = {
    1: {"title": "第1章 随机事件与概率", "slug": "1.1_随机事件及其运算", "keywords": ["随机事件", "样本空间", "古典概型", "条件概率", "乘法公式", "全概率公式", "贝叶斯公式", "独立性"]},
    2: {"title": "第2章 随机变量及其分布", "slug": "2.1_随机变量及其分布", "keywords": ["随机变量", "分布律", "概率密度", "分布函数", "0-1分布", "二项分布", "泊松分布", "均匀分布", "指数分布", "正态分布"]},
    3: {"title": "第3章 多维随机变量及其分布", "slug": "3.1_二维随机变量", "keywords": ["二维随机变量", "联合分布", "边缘分布", "条件分布", "独立随机变量", "二维正态分布"]},
    4: {"title": "第4章 随机变量的数字特征", "slug": "4.1_数学期望", "keywords": ["数学期望", "方差", "标准差", "协方差", "相关系数", "矩", "协方差矩阵"]},
    5: {"title": "第5章 极限定理", "slug": "5.1_大数定律", "keywords": ["切比雪夫不等式", "大数定律", "伯努利大数定律", "中心极限定理", "辛钦大数定律", "德莫佛-拉普拉斯定理"]},
    6: {"title": "第6章 统计量与抽样分布", "slug": "6.1_总体与样本", "keywords": ["总体", "样本", "统计量", "卡方分布", "t分布", "F分布", "分位数"]},
    7: {"title": "第7章 参数估计与假设检验", "slug": "7.1_点估计", "keywords": ["点估计", "矩估计", "最大似然估计", "无偏性", "有效性", "区间估计", "置信区间", "假设检验", "显著性水平", "拒绝域"]}
}

LINEAR_ALGEBRA_GEOMETRY_CURRICULUM = {
    1: {
        "title": "第1章 行列式",
        "sections": {
            "1.1": {"title": "二三阶行列式", "slug": "1.1_二三阶行列式", "keywords": ["二阶行列式", "三阶行列式", "对角线法则", "交叉相乘"]},
            "1.2": {"title": "全排列及其逆序数", "slug": "1.2_全排列及其逆序数", "keywords": ["全排列", "逆序数", "奇排列", "偶排列", "对换", "N(P)", "\\tau"]},
            "1.3": {"title": "n阶行列式的概念", "slug": "1.3_n阶行列式的概念", "keywords": ["n阶行列式", "项数", "一般项", "定义式", "主对角线", "次对角线"]},
            "1.4": {"title": "行列式的性质", "slug": "1.4_行列式的性质", "keywords": ["行列式性质", "按行化简", "初等变换求行列式", "三角化", "范德蒙", "爪型行列式", "行和相等", "计算行列式", "计算下列行列式", "vmatrix", "\\det", "det(A)", "行列式的值"]},
            "1.5": {"title": "行列式的展开定理", "slug": "1.5_行列式的展开定理", "keywords": ["代数余子式", "余子式", "展开定理", "按行展开", "按列展开", "A_{11}", "A_{ij}", "M_{ij}", "A_{1", "A_{2", "A_{3", "A_{4"]},
            "1.6": {"title": "克拉默法则", "slug": "1.6_克拉默法则", "keywords": ["克拉默", "克莱姆", "Cramer", "D_j/D", "D_1", "D_2", "克拉默定理"]}
        }
    },
    2: {
        "title": "第2章 矩阵",
        "sections": {
            "2.1": {"title": "矩阵的概念", "slug": "2.1_矩阵的概念", "keywords": ["矩阵定义", "同型矩阵", "单位矩阵", "数量矩阵", "对角矩阵", "零矩阵"]},
            "2.2": {"title": "矩阵的运算", "slug": "2.2_矩阵的运算", "keywords": ["伴随矩阵", "A^*", "矩阵乘法", "矩阵乘积", "矩阵幂", "A^k", "A^n", "A^2", "A^3", "矩阵转置", "A^T", "对称矩阵", "反对称矩阵", "方阵的幂", "AB=BA", "矩阵多项式", "方阵"]},
            "2.3": {"title": "逆矩阵", "slug": "2.3_逆矩阵", "keywords": ["逆矩阵", "可逆", "不可逆", "A^{-1}", "奇异矩阵", "非奇异", "求逆", "矩阵方程", "AX=B", "XA=B", "求矩阵 $B$", "求矩阵 $A$"]},
            "2.4": {"title": "矩阵的秩与初等变换", "slug": "2.4_矩阵的秩与初等变换", "keywords": ["矩阵的秩", "行阶梯形", "行最简形", "最高阶非零子式", "初等行变换", "r(A)", "R(A)", "rank", "满秩", "降秩"]},
            "2.5": {"title": "初等矩阵", "slug": "2.5_初等矩阵", "keywords": ["初等矩阵", "初等方阵", "初等矩阵的逆", "表示为初等矩阵之积", "初等变换"]},
            "2.6": {"title": "矩阵的分块法", "slug": "2.6_矩阵的分块法", "keywords": ["分块矩阵", "按行分块", "按列分块", "分块对角矩阵", "准对角矩阵", "分块求逆", "分块乘法"]}
        }
    },
    3: {
        "title": "第3章 向量代数与空间解析几何",
        "sections": {
            "3.1": {"title": "向量及其线性运算", "slug": "3.1_向量及其线性运算", "keywords": ["向量模", "方向余弦", "几何向量", "三角形法则", "平行四边形法则", "单位向量"]},
            "3.2": {"title": "向量的数量积向量积混合积", "slug": "3.2_向量的数量积向量积混合积", "keywords": ["数量积", "点积", "向量积", "叉积", "混合积", "两向量垂直", "两向量平行", "法向量", "三角形面积", "平行六面体体积", "垂直于向量"]},
            "3.3": {"title": "平面及其方程", "slug": "3.3_平面及其方程", "keywords": ["平面方程", "点法式", "截距式", "两平面夹角", "点到平面距离", "垂直于平面", "平行于平面", "平面 $\\pi$"]},
            "3.4": {"title": "空间直线的方程", "slug": "3.4_空间直线的方程", "keywords": ["空间直线", "直线方程", "对称式方程", "参数方程", "一般式方程", "方向向量", "线面夹角", "线面交点", "两直线共面", "异面直线", "直线 $L$"]}
        }
    },
    4: {
        "title": "第4章 线性相关性与向量组的秩",
        "sections": {
            "4.1": {"title": "n维向量的概念及其线性运算", "slug": "4.1_n维向量的概念及其线性运算", "keywords": ["n维向量", "列向量", "行向量", "向量的线性运算", "向量加法", "数乘向量"]},
            "4.2": {"title": "向量组的线性相关性", "slug": "4.2_向量组的线性相关性", "keywords": ["线性相关", "线性无关", "线性表出", "线性表示", "唯一线性表出", "不能线性表出", "不全为零"]},
            "4.3": {"title": "线性相关性的判别定理", "slug": "4.3_线性相关性的判别定理", "keywords": ["相关性判别", "部分相关则整体相关", "整体无关则部分无关", "正交向量组线性无关"]},
            "4.4": {"title": "向量组的秩", "slug": "4.4_向量组的秩", "keywords": ["极大线性无关组", "极大无关组", "向量组的秩", "等价向量组", "扩充为基", "向量组等价", "求极大无关组"]},
            "4.5": {"title": "向量空间", "slug": "4.5_向量空间", "keywords": ["向量空间", "生成子空间", "子空间", "基与维数", "基底", "生成空间", "span", "子空间的维数", "生成的空间的维数", "生成的空间"]}
        }
    },
    5: {
        "title": "第5章 线性方程组",
        "sections": {
            "5.1": {"title": "齐次线性方程组", "slug": "5.1_齐次线性方程组", "keywords": ["齐次线性方程组", "基础解系", "解空间", "Ax=0", "只有零解", "非零解", "n-r(A)", "解空间的维数", "齐次方程"]},
            "5.2": {"title": "非齐次线性方程组", "slug": "5.2_非齐次线性方程组", "keywords": ["非齐次线性方程组", "Ax=b", "通解", "特解", "无解", "有唯一解", "有无穷多解", "相容性定理", "增广矩阵", "方程组的通解", "线性方程组"]}
        }
    },
    6: {
        "title": "第6章 特征值与特征向量",
        "sections": {
            "6.1": {"title": "特征值与特征向量", "slug": "6.1_特征值与特征向量", "keywords": ["特征值", "特征向量", "特征多项式", "特征方程", "|\\lambda E - A|", "|\\lambda I - A|", "迹", "tr(A)", "特征值之和", "特征值之积", "矩阵的迹"]},
            "6.2": {"title": "方阵的相似化简", "slug": "6.2_方阵的相似化简", "keywords": ["相似对角化", "相似于对角阵", "相似于", "可对角化", "相似矩阵", "相似变换", "P^{-1}AP", "几何重数", "代数重数", "有n个线性无关的特征向量", "相似"]}
        }
    },
    7: {
        "title": "第7章 实二次型",
        "sections": {
            "7.1": {"title": "标准正交基", "slug": "7.1_标准正交基", "keywords": ["标准正交基", "正交规范基", "施密特正交化", "Schmidt", "正交化方法", "正交向量组", "正交规范", "正交化"]},
            "7.2": {"title": "实对称矩阵的对角化", "slug": "7.2_实对称矩阵的对角化", "keywords": ["实对称矩阵", "正交相似", "正交相似对角化", "正交对角化", "正交矩阵 $P$", "正交矩阵P", "求正交矩阵", "正交变换化为对角"]},
            "7.3": {"title": "实二次型及其标准形", "slug": "7.3_实二次型及其标准形", "keywords": ["实二次型", "二次型", "标准形", "二次型的矩阵", "正交变换化二次型", "配方法", "惯性指数", "正惯性指数", "负惯性指数", "秩与惯性指数"]},
            "7.4": {"title": "实二次型的规范形", "slug": "7.4_实二次型的规范形", "keywords": ["规范形", "矩阵合同", "合同于", "惯性定理", "合同"]},
            "7.5": {"title": "正定二次型与正定矩阵", "slug": "7.5_正定二次型与正定矩阵", "keywords": ["正定", "负定", "半正定", "正定二次型", "正定矩阵", "顺序主子式", "赫尔维茨定理", "正定充要条件", "特征值全大于零"]}
        }
    },
    8: {
        "title": "第8章 空间曲面与曲线",
        "sections": {
            "8.1": {"title": "空间曲面及其方程", "slug": "8.1_空间曲面及其方程", "keywords": ["空间曲面", "曲面方程", "球面方程", "柱面", "旋转曲面", "母线", "准线", "绕坐标轴旋转", "绕 y 轴旋转", "绕 x 轴旋转", "绕 z 轴旋转"]},
            "8.2": {"title": "二次曲面及其分类", "slug": "8.2_二次曲面及其分类", "keywords": ["二次曲面", "椭球面", "单叶双曲面", "双叶双曲面", "椭圆抛物面", "双曲抛物面", "马鞍面", "锥面", "圆锥面"]},
            "8.3": {"title": "空间曲线及其方程", "slug": "8.3_空间曲线及其方程", "keywords": ["空间曲线", "投影曲线", "投影柱面", "曲线在面上的投影", "曲线方程"]}
        }
    },
    9: {
        "title": "第9章 线性空间与线性变换",
        "sections": {
            "9.1": {"title": "线性空间的概念与基本性质", "slug": "9.1_线性空间的概念与基本性质", "keywords": ["线性空间", "加法封闭", "数乘封闭", "八条公理", "全体 $m \\times n$ 实矩阵", "全体实矩阵", "全体次数小于", "多项式集合", "矩阵的集合"]},
            "9.2": {"title": "线性空间的基与坐标", "slug": "9.2_线性空间的基与坐标", "keywords": ["基与坐标", "向量在基下的坐标"]},
            "9.3": {"title": "基变换与坐标变换", "slug": "9.3_基变换与坐标变换", "keywords": ["基变换", "过渡矩阵", "坐标变换公式"]},
            "9.4": {"title": "线性变换的概念与基本性质", "slug": "9.4_线性变换的概念与基本性质", "keywords": ["线性变换", "核与像", "值域与核", "零度与秩", "零空间"]},
            "9.5": {"title": "线性变换的矩阵表示", "slug": "9.5_线性变换的矩阵表示", "keywords": ["线性变换在基下的矩阵", "变换矩阵", "矩阵表示"]},
            "9.6": {"title": "欧氏空间", "slug": "9.6_欧氏空间", "keywords": ["欧氏空间", "内积空间", "柯西-施瓦茨不等式"]},
            "9.7": {"title": "线性空间的同构", "slug": "9.7_线性空间的同构", "keywords": ["线性空间的同构", "线性同构", "同构映射"]}
        }
    }
}

class CurriculumClassifier:
    """智能知识点与教材章节映射分类器"""

    def __init__(self):
        self.ea_curriculum = ENGINEERING_ANALYSIS_CURRICULUM
        self.la_curriculum = LINEAR_ALGEBRA_CURRICULUM
        self.lag_curriculum = LINEAR_ALGEBRA_GEOMETRY_CURRICULUM
        self.ps_curriculum = PROBABILITY_STATISTICS_CURRICULUM

    def classify_question(self, question: QuestionItem, target_course: str = "auto") -> Optional[BookChapterMapping]:
        """根据试卷大类及题目语义，分配至目标教材与章节。"""
        if target_course == "linear_algebra_geometry":
            return self._classify_linear_algebra_geometry(question)

        cat = question.source.get("category", "")

        if any(x in cat for x in ["分析上", "分析下", "工数"]):
            return self._classify_engineering_analysis(question)
        elif any(x in cat for x in ["线代", "高代", "矩阵论"]):
            return self._classify_linear_algebra_geometry(question)
        elif any(x in cat for x in ["概统", "概随", "研概随"]):
            return self._classify_probability(question)

        return self._classify_engineering_analysis(question)

    def _classify_engineering_analysis(self, question: QuestionItem) -> BookChapterMapping:
        """映射至《工科数学分析基础》"""
        paper_cat = question.source.get("category", "")
        stem = question.content.stem
        options_text = " ".join([opt.text for opt in question.content.options])
        solution_text = question.solution.answer + " " + question.solution.hints
        full_text = f"{stem} {options_text} {solution_text}".lower()

        target_chapters = [1, 2, 3, 4] if "分析上" in paper_cat else [5, 6, 7] if "分析下" in paper_cat else [1, 2, 3, 4, 5, 6, 7]

        best_match = None
        best_score = 0.0

        for ch_id in target_chapters:
            ch_data = self.ea_curriculum.get(ch_id)
            if not ch_data:
                continue

            for sec_id, sec_data in ch_data["sections"].items():
                matched_kws = []
                score = 0.0
                for kw in sec_data["keywords"]:
                    kw_lower = kw.lower()
                    if kw_lower in full_text:
                        matched_kws.append(kw)
                        score += 3.0 if len(kw) >= 3 else 1.5

                if sec_id == "1.5" and ("间断点" in full_text or "连续点" in full_text):
                    score += 5.0
                elif sec_id == "2.4" and ("罗尔" in full_text or "拉格朗日" in full_text or "中值定理" in full_text):
                    score += 6.0
                elif sec_id == "2.2" and ("切线方程" in full_text or "参数方程" in full_text or "高阶导数" in full_text):
                    score += 4.0
                elif sec_id == "3.3" and ("换元" in full_text or "分部积分" in full_text or "求积分" in full_text):
                    score += 4.0
                elif sec_id == "3.5" and ("反常积分" in full_text or "广义积分" in full_text or "瑕积分" in full_text):
                    score += 6.0
                elif sec_id == "4.1" and ("微分方程" in full_text and ("一阶" in full_text or "通解" in full_text)):
                    score += 5.0
                elif sec_id == "4.2" and ("微分方程" in full_text and ("二阶" in full_text or "特征方程" in full_text)):
                    score += 6.0
                elif sec_id == "6.2" and ("二重积分" in full_text or "极坐标" in full_text):
                    score += 5.0
                elif sec_id == "6.8" and ("格林公式" in full_text or "高斯公式" in full_text or "散度" in full_text or "旋度" in full_text or "路径无关" in full_text):
                    score += 6.0
                elif sec_id == "7.3" and ("收敛半径" in full_text or "收敛区间" in full_text or "幂级数" in full_text):
                    score += 6.0
                elif sec_id == "7.1" and ("常数项级数" in full_text or "级数收敛" in full_text or "莱布尼茨审敛" in full_text):
                    score += 5.0

                if score > best_score:
                    best_score = score
                    best_match = (ch_id, sec_id, score, matched_kws)

        if not best_match or best_score < 1.0:
            if "分析上期中" in paper_cat:
                ch_id, sec_id = 2, "2.1"
            elif "分析上期末" in paper_cat:
                ch_id, sec_id = 3, "3.3"
            elif "分析下期中" in paper_cat:
                ch_id, sec_id = 5, "5.3"
            elif "分析下期末" in paper_cat:
                ch_id, sec_id = 6, "6.2"
            else:
                ch_id, sec_id = 1, "1.3"
            matched_kws = ["综合训练"]
        else:
            ch_id, sec_id, _, matched_kws = best_match

        ch_info = self.ea_curriculum[ch_id]
        sec_info = ch_info["sections"][sec_id]

        cognitive_level = "apply"
        if question.meta.type == "choice":
            cognitive_level = "understand" if ("概念" in full_text or "充要条件" in full_text) else "apply"
        elif question.meta.type == "proof" or "证明" in full_text:
            cognitive_level = "analyze"

        difficulty = 2
        if question.meta.type in ["choice", "blank"]:
            difficulty = 1 if ("定义域" in full_text or "求极限" in full_text) else 2
        elif question.meta.type in ["proof", "comprehensive"] or "附加题" in question.meta.section_type:
            difficulty = 4 if "附加题" in question.meta.section_type else 3

        question.meta.difficulty = difficulty

        return BookChapterMapping(
            volume=ch_info["volume"],
            chapter=ch_id,
            chapter_title=ch_info["title"],
            section=sec_id,
            section_title=sec_info["title"],
            section_slug=sec_info["slug"],
            knowledge_points=matched_kws if matched_kws else [sec_info["title"]],
            cognitive_level=cognitive_level
        )

    def _classify_linear_algebra_geometry(self, question: QuestionItem) -> BookChapterMapping:
        """映射至《线性代数与几何（第2版）》（北京邮电大学出版社）"""
        stem = question.content.stem
        sec_type = question.meta.section_type or ""
        options_text = " ".join([opt.text for opt in question.content.options])
        solution_text = question.solution.answer + " " + question.solution.hints
        full_text = f"{sec_type} {stem} {options_text} {solution_text}".lower()

        best_match = None
        best_score = 0.0
        matched_kws = []

        for ch_id, ch_info in self.lag_curriculum.items():
            for sec_id, sec_info in ch_info["sections"].items():
                score = 0.0
                cur_kws = []
                for kw in sec_info["keywords"]:
                    if kw.lower() in full_text:
                        cur_kws.append(kw)
                        score += 2.0 + len(kw) * 0.4

                if sec_id == "8.1" and ("绕" in full_text and "旋转" in full_text):
                    score += 10.0
                elif sec_id == "8.2" and ("二次曲面" in full_text or "锥面" in full_text or "柱面" in full_text):
                    score += 10.0
                elif sec_id == "8.3" and ("空间曲线" in full_text or "投影曲线" in full_text):
                    score += 10.0
                elif sec_id.startswith("3.") and ("直线" in full_text or "平面" in full_text or "点到平面" in full_text):
                    score += 8.0
                elif sec_id == "9.1" and ("集合" in full_text and ("加法" in full_text or "数乘" in full_text or "实矩阵" in full_text or "多项式" in full_text)):
                    score += 12.0
                elif sec_id == "7.5" and ("正定" in full_text or "顺序主子式" in full_text):
                    score += 8.0
                elif sec_id == "7.2" and (("实对称" in full_text and "对角" in full_text) or ("正交矩阵" in full_text and "p" in full_text)):
                    score += 8.0
                elif sec_id == "7.1" and ("施密特" in full_text or "正交规范基" in full_text or "标准正交基" in full_text):
                    score += 10.0
                elif sec_id == "6.2" and ("相似对角化" in full_text or "相似于对角阵" in full_text or "可对角化" in full_text):
                    score += 8.0
                elif sec_id == "6.1" and ("特征值" in full_text or "特征向量" in full_text):
                    score += 7.0
                elif sec_id == "5.1" and ("基础解系" in full_text or "ax=0" in full_text or "齐次" in full_text):
                    score += 8.0
                elif sec_id == "5.2" and ("ax=b" in full_text or ("通解" in full_text and "方程" in full_text) or "非齐次" in full_text):
                    score += 8.0
                elif sec_id == "4.5" and (("生成" in full_text and "空间" in full_text) or ("维数" in full_text and "生成" in full_text)):
                    score += 10.0
                elif sec_id == "4.4" and ("极大无关组" in full_text or "极大线性无关组" in full_text):
                    score += 10.0
                elif sec_id == "4.2" and ("线性相关" in full_text or "线性无关" in full_text or "线性表出" in full_text):
                    score += 7.0
                elif sec_id == "2.4" and ("r(a)" in full_text or "矩阵的秩" in full_text or "初等行变换" in full_text):
                    score += 6.0
                elif sec_id == "2.3" and ("逆矩阵" in full_text or "可逆" in full_text or "a^{-1}" in full_text):
                    score += 6.0
                elif sec_id == "2.2" and ("伴随矩阵" in full_text or "a^*" in full_text or "矩阵乘" in full_text or "a^t" in full_text):
                    score += 5.0
                elif sec_id == "1.5" and ("代数余子式" in full_text or "余子式" in full_text):
                    score += 8.0
                elif sec_id == "1.4" and ("行列式" in full_text or "vmatrix" in full_text):
                    score += 5.0

                if score > best_score:
                    best_score = score
                    best_match = (ch_id, sec_id)
                    matched_kws = cur_kws

        if not best_match or best_score < 1.0:
            ch_id, sec_id = 2, "2.2"
            matched_kws = ["矩阵运算与性质"]
        else:
            ch_id, sec_id = best_match

        ch_info = self.lag_curriculum[ch_id]
        sec_info = ch_info["sections"][sec_id]

        cognitive_level = "apply"
        if question.meta.type == "choice":
            cognitive_level = "understand" if ("概念" in full_text or "充要条件" in full_text) else "apply"
        elif question.meta.type == "proof" or "证明" in full_text:
            cognitive_level = "analyze"

        difficulty = 2
        if question.meta.type in ["choice", "blank"]:
            difficulty = 1 if ("计算" in full_text or "求行列式" in full_text) else 2
        elif question.meta.type in ["proof", "comprehensive"] or "附加题" in sec_type:
            difficulty = 4 if "附加题" in sec_type else 3

        question.meta.difficulty = difficulty

        return BookChapterMapping(
            volume="single",
            chapter=ch_id,
            chapter_title=ch_info["title"],
            section=sec_id,
            section_title=sec_info["title"],
            section_slug=sec_info["slug"],
            knowledge_points=matched_kws if matched_kws else [sec_info["title"]],
            cognitive_level=cognitive_level
        )

    def _classify_linear_algebra(self, question: QuestionItem) -> BookChapterMapping:
        """映射至《线性代数及其应用》"""
        stem = question.content.stem.lower()
        best_ch = 1
        best_score = 0
        matched_kws = []

        for ch_id, ch_data in self.la_curriculum.items():
            score = 0
            for kw in ch_data["keywords"]:
                if kw.lower() in stem:
                    score += 2.0
                    matched_kws.append(kw)
            if score > best_score:
                best_score = score
                best_ch = ch_id

        ch_data = self.la_curriculum[best_ch]
        return BookChapterMapping(
            volume="single",
            chapter=best_ch,
            chapter_title=ch_data["title"],
            section=f"{best_ch}.1",
            section_title=ch_data["title"],
            section_slug=ch_data["slug"],
            knowledge_points=matched_kws if matched_kws else ["线性代数核心考点"],
            cognitive_level="apply"
        )

    def _classify_probability(self, question: QuestionItem) -> BookChapterMapping:
        """映射至《概率论与数理统计教程》"""
        stem = question.content.stem.lower()
        best_ch = 1
        best_score = 0
        matched_kws = []

        for ch_id, ch_data in self.ps_curriculum.items():
            score = 0
            for kw in ch_data["keywords"]:
                if kw.lower() in stem:
                    score += 2.0
                    matched_kws.append(kw)
            if score > best_score:
                best_score = score
                best_ch = ch_id

        ch_data = self.ps_curriculum[best_ch]
        return BookChapterMapping(
            volume="single",
            chapter=best_ch,
            chapter_title=ch_data["title"],
            section=f"{best_ch}.1",
            section_title=ch_data["title"],
            section_slug=ch_data["slug"],
            knowledge_points=matched_kws if matched_kws else ["概率论核心考点"],
            cognitive_level="apply"
        )
