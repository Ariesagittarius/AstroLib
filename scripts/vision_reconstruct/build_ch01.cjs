// scripts/vision_reconstruct/build_ch01.js
const fs = require('fs');
const path = require('path');
const katex = require('katex');

const ch01Questions = [
  {
    id: "LAG-TB-CH01-Q01",
    source_type: "textbook",
    source: {
      paper_id: 2001,
      raw_title: "《线性代数与几何》第1章 行列式 课后习题",
      clean_title: "《线性代数与几何》第1章 行列式 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 1 章 · 习题一 第 1 题",
      page_start: 37,
      page_end: 37
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 1,
      paper_q_num: 1,
      type: "calc",
      difficulty: 1,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 1,
        chapter_title: "第1章 行列式",
        section: "1.1",
        section_title: "二三阶行列式",
        section_slug: "1.1_二三阶行列式",
        knowledge_points: ["对角线法则", "三阶行列式计算"]
      }
    },
    content: {
      stem: "利用对角线法则计算下列三阶行列式：\n\n(1) $\\begin{vmatrix} 10 & 8 & 2 \\\\ 15 & 12 & 3 \\\\ 20 & 32 & 12 \\end{vmatrix}$；\n\n(2) $\\begin{vmatrix} a & b & c \\\\ b & c & a \\\\ c & a & b \\end{vmatrix}$；\n\n(3) $\\begin{vmatrix} a & b & a+b \\\\ b & a+b & a \\\\ a+b & a & b \\end{vmatrix}$；\n\n(4) $\\begin{vmatrix} 1+a & b & c \\\\ a & 1+b & c \\\\ a & b & 1+c \\end{vmatrix}$。",
      sub_questions: [
        { sub_id: "(1)", stem: "$\\begin{vmatrix} 10 & 8 & 2 \\\\ 15 & 12 & 3 \\\\ 20 & 32 & 12 \\end{vmatrix}$", answer: "$0$" },
        { sub_id: "(2)", stem: "$\\begin{vmatrix} a & b & c \\\\ b & c & a \\\\ c & a & b \\end{vmatrix}$", answer: "$3abc - a^3 - b^3 - c^3$" },
        { sub_id: "(3)", stem: "$\\begin{vmatrix} a & b & a+b \\\\ b & a+b & a \\\\ a+b & a & b \\end{vmatrix}$", answer: "$-2(a^3 + b^3)$" },
        { sub_id: "(4)", stem: "$\\begin{vmatrix} 1+a & b & c \\\\ a & 1+b & c \\\\ a & b & 1+c \\end{vmatrix}$", answer: "$1 + a + b + c$" }
      ]
    },
    solution: {
      answer: "(1) $0$； (2) $3abc-a^3-b^3-c^3$； (3) $-2(a^3+b^3)$； (4) $1+a+b+c$。",
      hints: "直接按照三阶行列式对角线法则展开：主对角线三项之和减去副对角线三项之和。",
      steps: "(1) 第 1 列是第 3 列的 5 倍，按对角线法则算得值为 $0$；\n(2) 展开得 $abc+bca+cab - (c^3+a^3+b^3) = 3abc - a^3 - b^3 - c^3$；\n(3) 展开化简得 $-2(a^3+b^3)$；\n(4) 展开后各项合并同类项化简得 $1+a+b+c$。"
    }
  },
  {
    id: "LAG-TB-CH01-Q02",
    source_type: "textbook",
    source: {
      paper_id: 2001,
      raw_title: "《线性代数与几何》第1章 行列式 课后习题",
      clean_title: "《线性代数与几何》第1章 行列式 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 1 章 · 习题一 第 2 题",
      page_start: 37,
      page_end: 37
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 2,
      paper_q_num: 2,
      type: "calc",
      difficulty: 1,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 1,
        chapter_title: "第1章 行列式",
        section: "1.1",
        section_title: "二三阶行列式",
        section_slug: "1.1_二三阶行列式",
        knowledge_points: ["行列式解方程组", "克拉默法则初步"]
      }
    },
    content: {
      stem: "用行列式解下列方程组：\n\n(1) $\\begin{cases} x_1 \\cos\\theta - x_2 \\sin\\theta = a, \\\\ x_1 \\sin\\theta + x_2 \\cos\\theta = b; \\end{cases}$\n\n(2) $\\begin{cases} x+y-z=a, \\\\ -x+y+z=b, \\\\ x-y+z=c; \\end{cases}$\n\n(3) $\\begin{cases} x+y+z=10, \\\\ 3x+2y+z=14, \\\\ 2x+3y-z=1; \\end{cases}$\n\n(4) $\\begin{cases} 2x_1-3x_2+2x_3=-3, \\\\ x_1+4x_2-3x_3=6, \\\\ 3x_1-x_2-x_3=1. \\end{cases}$",
      sub_questions: [
        { sub_id: "(1)", stem: "$\\begin{cases} x_1 \\cos\\theta - x_2 \\sin\\theta = a, \\\\ x_1 \\sin\\theta + x_2 \\cos\\theta = b; \\end{cases}$", answer: "$x_1 = a\\cos\\theta + b\\sin\\theta, x_2 = b\\cos\\theta - a\\sin\\theta$" },
        { sub_id: "(2)", stem: "$\\begin{cases} x+y-z=a, \\\\ -x+y+z=b, \\\\ x-y+z=c; \\end{cases}$", answer: "$x = \\frac{a+c}{2}, y = \\frac{a+b}{2}, z = \\frac{b+c}{2}$" },
        { sub_id: "(3)", stem: "$\\begin{cases} x+y+z=10, \\\\ 3x+2y+z=14, \\\\ 2x+3y-z=1; \\end{cases}$", answer: "$x=1, y=2, z=7$" },
        { sub_id: "(4)", stem: "$\\begin{cases} 2x_1-3x_2+2x_3=-3, \\\\ x_1+4x_2-3x_3=6, \\\\ 3x_1-x_2-x_3=1. \\end{cases}$", answer: "$x_1 = \\frac{1}{2}, x_2 = 1, x_3 = -\\frac{1}{2}$" }
      ]
    },
    solution: {
      answer: "(1) $x_1 = a\\cos\\theta + b\\sin\\theta, x_2 = b\\cos\\theta - a\\sin\\theta$；\n(2) $x = \\frac{a+c}{2}, y = \\frac{a+b}{2}, z = \\frac{b+c}{2}$；\n(3) $x=1, y=2, z=7$；\n(4) $x_1 = \\frac{1}{2}, x_2 = 1, x_3 = -\\frac{1}{2}$。",
      hints: "计算方程组系数行列式 $D$ 及各变量对应的行列式 $D_i$，利用克拉默法则 $x_i = \\frac{D_i}{D}$ 求解。",
      steps: "(1) $D = \\begin{vmatrix} \\cos\\theta & -\\sin\\theta \\\\ \\sin\\theta & \\cos\\theta \\end{vmatrix} = \\cos^2\\theta + \\sin^2\\theta = 1$。$D_1 = a\\cos\\theta + b\\sin\\theta, D_2 = b\\cos\\theta - a\\sin\\theta$；\n(2) $D = 4, D_1 = 2(a+c), D_2 = 2(a+b), D_3 = 2(b+c)$；\n(3) $D = -5, D_x = -5, D_y = -10, D_z = -35$；\n(4) $D = 36, D_1 = 18, D_2 = 36, D_3 = -18$。"
    }
  },
  {
    id: "LAG-TB-CH01-Q03",
    source_type: "textbook",
    source: {
      paper_id: 2001,
      raw_title: "《线性代数与几何》第1章 行列式 课后习题",
      clean_title: "《线性代数与几何》第1章 行列式 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 1 章 · 习题一 第 3 题",
      page_start: 37,
      page_end: 37
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 3,
      paper_q_num: 3,
      type: "calc",
      difficulty: 1,
      score: 5
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 1,
        chapter_title: "第1章 行列式",
        section: "1.2",
        section_title: "全排列及其逆序数",
        section_slug: "1.2_全排列及其逆序数",
        knowledge_points: ["逆序数", "奇排列与偶排列"]
      }
    },
    content: {
      stem: "求以下排列的逆序数，并确定排列的奇偶性：\n\n(1) $351426$；\n\n(2) $7135246$；\n\n(3) $215479683$；\n\n(4) $1 3 5 \\cdots (2n-1)(2n)(2n-2) \\cdots 6 4 2$。",
      sub_questions: [
        { sub_id: "(1)", stem: "$351426$", answer: "$6$，偶排列" },
        { sub_id: "(2)", stem: "$7135246$", answer: "$9$，奇排列" },
        { sub_id: "(3)", stem: "$215479683$", answer: "$11$，奇排列" },
        { sub_id: "(4)", stem: "$1 3 5 \\cdots (2n-1)(2n)(2n-2) \\cdots 6 4 2$", answer: "$n(n-1)$，偶排列" }
      ]
    },
    solution: {
      answer: "(1) $6$，偶排列；\n(2) $9$，奇排列；\n(3) $11$，奇排列；\n(4) $n(n-1)$，偶排列。",
      hints: "逆序数 $\\tau(p_1 p_2 \\cdots p_n)$ 为排列中所有前大后小的数对总数。逆序数为偶数即为偶排列，奇数即为奇排列。",
      steps: "(1) $\\tau(351426) = 2+3+0+1+0+0 = 6$ (偶)；\n(2) $\\tau(7135246) = 6+0+1+2+0+0+0 = 9$ (奇)；\n(3) $\\tau(215479683) = 1+0+2+1+2+3+1+1+0 = 11$ (奇)；\n(4) 后半部分偶数递减序列共 $n$ 个数，倒序排列贡献的逆序数为 $\\frac{n(n-1)}{2}$，结合前奇后偶关系总逆序数为 $n(n-1)$ (因 $n(n-1)$ 恒为偶数，故为偶排列)。"
    }
  },
  {
    id: "LAG-TB-CH01-Q04",
    source_type: "textbook",
    source: {
      paper_id: 2001,
      raw_title: "《线性代数与几何》第1章 行列式 课后习题",
      clean_title: "《线性代数与几何》第1章 行列式 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 1 章 · 习题一 第 4 题",
      page_start: 37,
      page_end: 37
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 4,
      paper_q_num: 4,
      type: "calc",
      difficulty: 1,
      score: 5
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 1,
        chapter_title: "第1章 行列式",
        section: "1.3",
        section_title: "n阶行列式的概念",
        section_slug: "1.3_n阶行列式的概念",
        knowledge_points: ["行列式展开项", "项的符号判定"]
      }
    },
    content: {
      stem: "确定下列五阶行列式的项所带的符号：\n\n(1) $a_{12} a_{23} a_{31} a_{45} a_{54}$；\n\n(2) $a_{24} a_{32} a_{15} a_{43} a_{51}$；\n\n(3) $a_{15} a_{23} a_{32} a_{44} a_{51}$。",
      sub_questions: [
        { sub_id: "(1)", stem: "$a_{12} a_{23} a_{31} a_{45} a_{54}$", answer: "负号" },
        { sub_id: "(2)", stem: "$a_{24} a_{32} a_{15} a_{43} a_{51}$", answer: "负号" },
        { sub_id: "(3)", stem: "$a_{15} a_{23} a_{32} a_{44} a_{51}$", answer: "正号" }
      ]
    },
    solution: {
      answer: "(1) 负号； (2) 负号； (3) 正号。",
      hints: "当行指标按自然顺序 $1, 2, \\cdots, n$ 排列时，项的符号由列标排列的逆序数奇偶性 $(-1)^{\\tau}$ 确定。",
      steps: "(1) 行标已自然有序，列标排列为 $23154$，逆序数 $\\tau(23154) = 1+1+0+1+0 = 3$ (奇数)，带负号；\n(2) 行标与列标双排列逆序数总和为奇数，带负号；\n(3) 行标 $12345$，列标 $53241$，$\\tau(53241) = 4+2+1+1+0 = 8$ (偶数)，带正号。"
    }
  },
  {
    id: "LAG-TB-CH01-Q05",
    source_type: "textbook",
    source: {
      paper_id: 2001,
      raw_title: "《线性代数与几何》第1章 行列式 课后习题",
      clean_title: "《线性代数与几何》第1章 行列式 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 1 章 · 习题一 第 5 题",
      page_start: 38,
      page_end: 38
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 5,
      paper_q_num: 5,
      type: "calc",
      difficulty: 2,
      score: 5
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 1,
        chapter_title: "第1章 行列式",
        section: "1.3",
        section_title: "n阶行列式的概念",
        section_slug: "1.3_n阶行列式的概念",
        knowledge_points: ["行列式定义", "多项式项的系数"]
      }
    },
    content: {
      stem: "用行列式定义确定下列行列式中项 $x^3, x^4$ 的系数：\n\n(1) $\\begin{vmatrix} x-1 & 4 & 3 & 1 \\\\ 2 & x-2 & 3 & 1 \\\\ 7 & 9 & x & 0 \\\\ 5 & 3 & 1 & x-1 \\end{vmatrix}$；\n\n(2) $\\begin{vmatrix} x & 1 & 1 & 2 \\\\ 1 & x & 1 & -1 \\\\ 3 & 2 & x & 1 \\\\ 1 & 1 & 2x & 1 \\end{vmatrix}$。",
      sub_questions: [
        { sub_id: "(1)", stem: "$\\begin{vmatrix} x-1 & 4 & 3 & 1 \\\\ 2 & x-2 & 3 & 1 \\\\ 7 & 9 & x & 0 \\\\ 5 & 3 & 1 & x-1 \\end{vmatrix}$", answer: "$x^3$ 的系数为 $-4$，$x^4$ 的系数为 $1$" },
        { sub_id: "(2)", stem: "$\\begin{vmatrix} x & 1 & 1 & 2 \\\\ 1 & x & 1 & -1 \\\\ 3 & 2 & x & 1 \\\\ 1 & 1 & 2x & 1 \\end{vmatrix}$", answer: "$x^3$ 的系数为 $-1$，$x^4$ 的系数为 $0$" }
      ]
    },
    solution: {
      answer: "(1) $x^3$ 的系数为 $-4$，$x^4$ 的系数为 $1$；\n(2) $x^3$ 的系数为 $-1$，$x^4$ 的系数为 $0$。",
      hints: "根据行列式定义，只有主对角线上含 4 个 $x$。含 4 个 $x$ 的乘积项必为主对角线项；含 3 个 $x$ 的项由于选取 3 个对角元素后第 4 个元素必在对角线上，因此也仅来源于主对角线展开。",
      steps: "(1) 仅主对角线乘积项 $(x-1)(x-2)x(x-1) = x^4 - 4x^3 + 5x^2 - 2x$ 产生 $x^4$ 与 $x^3$。因此 $x^4$ 系数为 $1$，$x^3$ 系数为 $-4$；\n(2) 分析所有展开项可知不含 $x^4$（最高次为 3），$x^4$ 系数为 $0$；$x^3$ 项仅由对角线 $x \\cdot x \\cdot x \\cdot 1$ 展开得 $-1$（结合符号）。"
    }
  },
  {
    id: "LAG-TB-CH01-Q06",
    source_type: "textbook",
    source: {
      paper_id: 2001,
      raw_title: "《线性代数与几何》第1章 行列式 课后习题",
      clean_title: "《线性代数与几何》第1章 行列式 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 1 章 · 习题一 第 6 题",
      page_start: 38,
      page_end: 38
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 6,
      paper_q_num: 6,
      type: "calc",
      difficulty: 1,
      score: 5
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 1,
        chapter_title: "第1章 行列式",
        section: "1.3",
        section_title: "n阶行列式的概念",
        section_slug: "1.3_n阶行列式的概念",
        knowledge_points: ["行列式定义", "展开项"]
      }
    },
    content: {
      stem: "写出四阶行列式中含有因子 $a_{11} a_{23}$ 的项。"
    },
    solution: {
      answer: "$-a_{11} a_{23} a_{32} a_{44}$ 和 $a_{11} a_{23} a_{34} a_{42}$。",
      hints: "在四阶行列式中选定行标 $1, 2$，对应的列标为 $1, 3$。剩下的行标 $3, 4$ 只能选取列标 $2, 4$。",
      steps: "剩下的两个元素组合为 $a_{32} a_{44}$ 或 $a_{34} a_{42}$。\n对于 $a_{11} a_{23} a_{32} a_{44}$，列标排列为 $1324$，逆序数为 $1$，符号为负，即 $-a_{11} a_{23} a_{32} a_{44}$；\n对于 $a_{11} a_{23} a_{34} a_{42}$，列标排列为 $1342$，逆序数为 $2$，符号为正，即 $a_{11} a_{23} a_{34} a_{42}$。"
    }
  },
  {
    id: "LAG-TB-CH01-Q07",
    source_type: "textbook",
    source: {
      paper_id: 2001,
      raw_title: "《线性代数与几何》第1章 行列式 课后习题",
      clean_title: "《线性代数与几何》第1章 行列式 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 1 章 · 习题一 第 7 题",
      page_start: 38,
      page_end: 38
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 7,
      paper_q_num: 7,
      type: "calc",
      difficulty: 2,
      score: 10
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 1,
        chapter_title: "第1章 行列式",
        section: "1.4",
        section_title: "行列式的性质",
        section_slug: "1.4_行列式的性质",
        knowledge_points: ["数值行列式化简", "初等行变换"]
      }
    },
    content: {
      stem: "计算下列各行列式：\n\n(1) $\\begin{vmatrix} -2 & 3 & 1 \\\\ 503 & 201 & 298 \\\\ 5 & 2 & 3 \\end{vmatrix}$；\n\n(2) $\\begin{vmatrix} 4 & 1 & 2 & 4 \\\\ 1 & 2 & 0 & 2 \\\\ 10 & 5 & 2 & 0 \\\\ 0 & 1 & 1 & 7 \\end{vmatrix}$；\n\n(3) $\\begin{vmatrix} 2 & 1 & 4 & 1 \\\\ 3 & -1 & 2 & 1 \\\\ 1 & 2 & 3 & 2 \\\\ 5 & 0 & 6 & 2 \\end{vmatrix}$；\n\n(4) $\\begin{vmatrix} 1 & 2 & 3 & 4 \\\\ 1 & 0 & 1 & 2 \\\\ 3 & -1 & -1 & 0 \\\\ 1 & 2 & 0 & -5 \\end{vmatrix}$；\n\n(5) $\\begin{vmatrix} 1 & 2 & 3 & 4 \\\\ 2 & 3 & 4 & 1 \\\\ 3 & 4 & 1 & 2 \\\\ 4 & 1 & 2 & 3 \\end{vmatrix}$。",
      sub_questions: [
        { sub_id: "(1)", stem: "$\\begin{vmatrix} -2 & 3 & 1 \\\\ 503 & 201 & 298 \\\\ 5 & 2 & 3 \\end{vmatrix}$", answer: "$-70$" },
        { sub_id: "(2)", stem: "$\\begin{vmatrix} 4 & 1 & 2 & 4 \\\\ 1 & 2 & 0 & 2 \\\\ 10 & 5 & 2 & 0 \\\\ 0 & 1 & 1 & 7 \\end{vmatrix}$", answer: "$0$" },
        { sub_id: "(3)", stem: "$\\begin{vmatrix} 2 & 1 & 4 & 1 \\\\ 3 & -1 & 2 & 1 \\\\ 1 & 2 & 3 & 2 \\\\ 5 & 0 & 6 & 2 \\end{vmatrix}$", answer: "$0$" },
        { sub_id: "(4)", stem: "$\\begin{vmatrix} 1 & 2 & 3 & 4 \\\\ 1 & 0 & 1 & 2 \\\\ 3 & -1 & -1 & 0 \\\\ 1 & 2 & 0 & -5 \\end{vmatrix}$", answer: "$-24$" },
        { sub_id: "(5)", stem: "$\\begin{vmatrix} 1 & 2 & 3 & 4 \\\\ 2 & 3 & 4 & 1 \\\\ 3 & 4 & 1 & 2 \\\\ 4 & 1 & 2 & 3 \\end{vmatrix}$", answer: "$160$" }
      ]
    },
    solution: {
      answer: "(1) $-70$； (2) $0$； (3) $0$； (4) $-24$； (5) $160$。",
      hints: "利用行列式性质，通过初等行（列）变换将某一行（列）化出尽量多的 $0$ 元素，再按该行（列）展开或化为三角形行列式。",
      steps: "(1) 将第 2 行减去第 1 行与第 3 行的线性组合化简得 $-70$；\n(2) 观察各行关系，第 1 行与第 2 行线性组合后发现两行成比例，值为 $0$；\n(3) 第 1 行加第 2 行等于第 4 行，两行相同故值为 $0$；\n(4) 做初等行变换消元后化为上三角形式，求得值为 $-24$；\n(5) 各行加到第 1 行提出公因子 $10$，消元化简得 $10 \\times 16 = 160$。"
    }
  },
  {
    id: "LAG-TB-CH01-Q08",
    source_type: "textbook",
    source: {
      paper_id: 2001,
      raw_title: "《线性代数与几何》第1章 行列式 课后习题",
      clean_title: "《线性代数与几何》第1章 行列式 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 1 章 · 习题一 第 8 题",
      page_start: 38,
      page_end: 38
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 8,
      paper_q_num: 8,
      type: "calc",
      difficulty: 2,
      score: 10
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 1,
        chapter_title: "第1章 行列式",
        section: "1.4",
        section_title: "行列式的性质",
        section_slug: "1.4_行列式的性质",
        knowledge_points: ["符号行列式计算", "初等变换与提公因式"]
      }
    },
    content: {
      stem: "计算下列各行列式：\n\n(1) $\\begin{vmatrix} -ab & ac & ae \\\\ bd & -cd & de \\\\ bf & cf & -ef \\end{vmatrix}$；\n\n(2) $\\begin{vmatrix} 2(x+y) & 2(x+y) & 2(x+y) \\\\ x & x+y & y \\\\ x+y & y & x \\end{vmatrix}$；\n\n(3) $\\begin{vmatrix} x & a & a & a \\\\ a & x & a & a \\\\ a & a & x & a \\\\ a & a & a & x \\end{vmatrix}$；\n\n(4) $\\begin{vmatrix} a & 1 & 0 & 0 \\\\ -1 & b & 1 & 0 \\\\ 0 & -1 & c & 1 \\\\ 0 & 0 & -1 & d \\end{vmatrix}$；\n\n(5) $\\begin{vmatrix} 1+x & 1 & 1 & 1 \\\\ 1 & 1-x & 1 & 1 \\\\ 1 & 1 & 1+y & 1 \\\\ 1 & 1 & 1 & 1-y \\end{vmatrix}$；\n\n(6) $\\begin{vmatrix} a & 0 & a & 0 & a \\\\ b & 0 & c & 0 & d \\\\ b^2 & 0 & c^2 & 0 & d^2 \\\\ 0 & ab & 0 & bc & 0 \\\\ 0 & cd & 0 & ad & 0 \\end{vmatrix}$。",
      sub_questions: [
        { sub_id: "(1)", stem: "$\\begin{vmatrix} -ab & ac & ae \\\\ bd & -cd & de \\\\ bf & cf & -ef \\end{vmatrix}$", answer: "$4abcdef$" },
        { sub_id: "(2)", stem: "$\\begin{vmatrix} 2(x+y) & 2(x+y) & 2(x+y) \\\\ x & x+y & y \\\\ x+y & y & x \\end{vmatrix}$", answer: "$-2(x^3+y^3)$" },
        { sub_id: "(3)", stem: "$\\begin{vmatrix} x & a & a & a \\\\ a & x & a & a \\\\ a & a & x & a \\\\ a & a & a & x \\end{vmatrix}$", answer: "$(x+3a)(x-a)^3$" },
        { sub_id: "(4)", stem: "$\\begin{vmatrix} a & 1 & 0 & 0 \\\\ -1 & b & 1 & 0 \\\\ 0 & -1 & c & 1 \\\\ 0 & 0 & -1 & d \\end{vmatrix}$", answer: "$abcd+ab+cd+ad+1$" },
        { sub_id: "(5)", stem: "$\\begin{vmatrix} 1+x & 1 & 1 & 1 \\\\ 1 & 1-x & 1 & 1 \\\\ 1 & 1 & 1+y & 1 \\\\ 1 & 1 & 1 & 1-y \\end{vmatrix}$", answer: "$x^2 y^2$" },
        { sub_id: "(6)", stem: "$\\begin{vmatrix} a & 0 & a & 0 & a \\\\ b & 0 & c & 0 & d \\\\ b^2 & 0 & c^2 & 0 & d^2 \\\\ 0 & ab & 0 & bc & 0 \\\\ 0 & cd & 0 & ad & 0 \\end{vmatrix}$", answer: "$abd(d-b)(d-c)(c-b)(c^2-a^2)$" }
      ]
    },
    solution: {
      answer: "(1) $4abcdef$；\n(2) $-2(x^3+y^3)$；\n(3) $(x+3a)(x-a)^3$；\n(4) $abcd+ab+cd+ad+1$；\n(5) $x^2 y^2$；\n(6) $abd(d-b)(d-c)(c-b)(c^2-a^2)$。",
      hints: "(1) 各行分别提公因式 $a, d, f$，各列提 $b, c, e$；(2) 提出第 1 行公因式 $2(x+y)$；(3) 各列加到第 1 列后消元；(4) 按第 1 行或第 4 列展开递推；(5) 各行减去第一行；(6) 交换行列分块展开。",
      steps: "(1) 提取公因子 $abcdef$ 后内部行列式为 $\\begin{vmatrix} -1 & 1 & 1 \\\\ 1 & -1 & 1 \\\\ 1 & 1 & -1 \\end{vmatrix} = 4$，故结果为 $4abcdef$；\n(2) 提 $2(x+y)$ 后化简求得 $-2(x^3+y^3)$；\n(3) 准对角对称阵，结果为 $(x+3a)(x-a)^3$；\n(4) 展开得 $abcd+ab+cd+ad+1$；\n(5) 每行减去第一行，得到只有对角线和边界的稀疏形式，算得 $x^2 y^2$；\n(6) 通过行互换与列互换分离出范德蒙德结构与二阶子式，展开得到 $abd(d-b)(d-c)(c-b)(c^2-a^2)$。"
    }
  },
  {
    id: "LAG-TB-CH01-Q09",
    source_type: "textbook",
    source: {
      paper_id: 2001,
      raw_title: "《线性代数与几何》第1章 行列式 课后习题",
      clean_title: "《线性代数与几何》第1章 行列式 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 1 章 · 习题一 第 9 题",
      page_start: 38,
      page_end: 38
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 9,
      paper_q_num: 9,
      type: "calc",
      difficulty: 2,
      score: 5
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 1,
        chapter_title: "第1章 行列式",
        section: "1.4",
        section_title: "行列式的性质",
        section_slug: "1.4_行列式的性质",
        knowledge_points: ["行列式方程求解"]
      }
    },
    content: {
      stem: "解方程：\n\n$$\\begin{vmatrix} 0 & 1 & x & 1 \\\\ 1 & 0 & 1 & x \\\\ x & 1 & 0 & 1 \\\\ 1 & x & 1 & 0 \\end{vmatrix} = 0$$"
    },
    solution: {
      answer: "$x_1 = x_2 = 0, x_3 = -2, x_4 = 2$。",
      hints: "将所有列加到第一列，提取公因式 $(x+2)$，再做初等行变换展开求出行列式的多项式因式分解形式。",
      steps: "所有列加到第一列得公因子 $x+2$，提出后做行初等变换消元，可求得行列式化简为 $x^2(x-2)(x+2) = 0$，由此解得根为 $x_1 = x_2 = 0, x_3 = -2, x_4 = 2$。"
    }
  },
  {
    id: "LAG-TB-CH01-Q10",
    source_type: "textbook",
    source: {
      paper_id: 2001,
      raw_title: "《线性代数与几何》第1章 行列式 课后习题",
      clean_title: "《线性代数与几何》第1章 行列式 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 1 章 · 习题一 第 10 题",
      page_start: 38,
      page_end: 39
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 10,
      paper_q_num: 10,
      type: "proof",
      difficulty: 2,
      score: 10
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 1,
        chapter_title: "第1章 行列式",
        section: "1.4",
        section_title: "行列式的性质",
        section_slug: "1.4_行列式的性质",
        knowledge_points: ["行列式恒等式证明", "范德蒙德技巧"]
      }
    },
    content: {
      stem: "证明：\n\n(1) $\\begin{vmatrix} a^2 & ab & b^2 \\\\ 2a & a+b & 2b \\\\ 1 & 1 & 1 \\end{vmatrix} = (a-b)^3$；\n\n(2) $\\begin{vmatrix} ax+by & ay+bz & az+bx \\\\ ay+bz & az+bx & ax+by \\\\ az+bx & ax+by & ay+bz \\end{vmatrix} = (a^3+b^3) \\begin{vmatrix} x & y & z \\\\ y & z & x \\\\ z & x & y \\end{vmatrix}$；\n\n(3) $\\begin{vmatrix} a^2 & (a+1)^2 & (a+2)^2 & (a+3)^2 \\\\ b^2 & (b+1)^2 & (b+2)^2 & (b+3)^2 \\\\ c^2 & (c+1)^2 & (c+2)^2 & (c+3)^2 \\\\ d^2 & (d+1)^2 & (d+2)^2 & (d+3)^2 \\end{vmatrix} = 0$；\n\n(4) $\\begin{vmatrix} 1 & 1 & 1 & 1 \\\\ a & b & c & d \\\\ a^2 & b^2 & c^2 & d^2 \\\\ a^4 & b^4 & c^4 & d^4 \\end{vmatrix} = (a-b)(a-c)(a-d)(b-c)(b-d)(c-d)(a+b+c+d)$。",
      sub_questions: [
        { sub_id: "(1)", stem: "$\\begin{vmatrix} a^2 & ab & b^2 \\\\ 2a & a+b & 2b \\\\ 1 & 1 & 1 \\end{vmatrix} = (a-b)^3$" },
        { sub_id: "(2)", stem: "$\\begin{vmatrix} ax+by & ay+bz & az+bx \\\\ ay+bz & az+bx & ax+by \\\\ az+bx & ax+by & ay+bz \\end{vmatrix} = (a^3+b^3) \\begin{vmatrix} x & y & z \\\\ y & z & x \\\\ z & x & y \\end{vmatrix}$" },
        { sub_id: "(3)", stem: "$\\begin{vmatrix} a^2 & (a+1)^2 & (a+2)^2 & (a+3)^2 \\\\ b^2 & (b+1)^2 & (b+2)^2 & (b+3)^2 \\\\ c^2 & (c+1)^2 & (c+2)^2 & (c+3)^2 \\\\ d^2 & (d+1)^2 & (d+2)^2 & (d+3)^2 \\end{vmatrix} = 0$" },
        { sub_id: "(4)", stem: "$\\begin{vmatrix} 1 & 1 & 1 & 1 \\\\ a & b & c & d \\\\ a^2 & b^2 & c^2 & d^2 \\\\ a^4 & b^4 & c^4 & d^4 \\end{vmatrix} = (a-b)(a-c)(a-d)(b-c)(b-d)(c-d)(a+b+c+d)$" }
      ]
    },
    solution: {
      answer: "证明略。",
      hints: "(1) 列变换提公因式 $(a-b)$；(2) 拆项定理或矩阵乘积；(3) 列初等变换做差消除二次项；(4) 构造五阶范德蒙德行列式展开比较 $x^3$ 项系数。",
      steps: "(1) 各列依次减去后一列，提出公因式 $(a-b)$，化简得 $(a-b)^3$；\n(2) 将行列式按列拆项，利用排列交错求和化简，可提取公因子 $(a^3+b^3)$；\n(3) 依次做后列减前列，消去平方项得一次差分，再做二次差分后出现成比例常数列，故行列式恒为 $0$；\n(4) 补上 $x^3$ 行构成五阶范德蒙德行列式，按第 4 行展开后比较多项式同次项系数即得结果。"
    }
  },
  {
    id: "LAG-TB-CH01-Q11",
    source_type: "textbook",
    source: {
      paper_id: 2001,
      raw_title: "《线性代数与几何》第1章 行列式 课后习题",
      clean_title: "《线性代数与几何》第1章 行列式 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 1 章 · 习题一 第 11 题",
      page_start: 39,
      page_end: 40
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 11,
      paper_q_num: 11,
      type: "calc",
      difficulty: 3,
      score: 12
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 1,
        chapter_title: "第1章 行列式",
        section: "1.5",
        section_title: "行列式的展开定理",
        section_slug: "1.5_行列式的展开定理",
        knowledge_points: ["n阶行列式求值", "爪型与递推法", "范德蒙德行列式"]
      }
    },
    content: {
      stem: "计算下列行列式：\n\n(1) $D_n = \\begin{vmatrix} x & y & & \\\\ & x & y & \\\\ & & \\ddots & \\ddots \\\\ & & & x & y \\\\ y & 0 & \\cdots & 0 & x \\end{vmatrix}$；\n\n(2) $D_n = \\begin{vmatrix} 1 & 2 & 2 & \\cdots & 2 \\\\ 2 & 2 & 2 & \\cdots & 2 \\\\ 2 & 2 & 3 & \\cdots & 2 \\\\ \\vdots & \\vdots & \\vdots & & \\vdots \\\\ 2 & 2 & 2 & \\cdots & n \\end{vmatrix}$；\n\n(3) $D_n = \\begin{vmatrix} x_1-m & x_2 & \\cdots & x_n \\\\ x_1 & x_2-m & \\cdots & x_n \\\\ \\vdots & \\vdots & & \\vdots \\\\ x_1 & x_2 & \\cdots & x_n-m \\end{vmatrix}$；\n\n(4) $D_n = \\begin{vmatrix} \\lambda+a_1 & a_2 & a_3 & \\cdots & a_n \\\\ a_1 & \\lambda+a_2 & a_3 & \\cdots & a_n \\\\ a_1 & a_2 & \\lambda+a_3 & \\cdots & a_n \\\\ \\vdots & \\vdots & \\vdots & & \\vdots \\\\ a_1 & a_2 & a_3 & \\cdots & \\lambda+a_n \\end{vmatrix}$；\n\n(5) $D_{2n} = \\begin{vmatrix} a_n & & & & & b_n \\\\ & \\ddots & & & \\iddots & \\\\ & & a_1 & b_1 & & \\\\ & & c_1 & d_1 & & \\\\ & \\iddots & & & \\ddots & \\\\ c_n & & & & & d_n \\end{vmatrix}$；\n\n(6) $D_n = \\det(a_{ij})$，其中 $a_{ij} = |i-j|$；\n\n(7) $D_n = \\begin{vmatrix} 1+a_1 & 1 & \\cdots & 1 \\\\ 1 & 1+a_2 & \\cdots & 1 \\\\ \\vdots & \\vdots & & \\vdots \\\\ 1 & 1 & \\cdots & 1+a_n \\end{vmatrix}$，其中 $a_1 a_2 \\cdots a_n \\neq 0$；\n\n(8) $D_{n+1} = \\begin{vmatrix} a^n & (a-1)^n & \\cdots & (a-n)^n \\\\ a^{n-1} & (a-1)^{n-1} & \\cdots & (a-n)^{n-1} \\\\ \\vdots & \\vdots & & \\vdots \\\\ a & a-1 & \\cdots & a-n \\\\ 1 & 1 & \\cdots & 1 \\end{vmatrix}$；\n\n(9) $\\begin{vmatrix} a & -1 & 0 & \\cdots & 0 \\\\ ax & a & -1 & \\cdots & 0 \\\\ ax^2 & ax & a & \\cdots & 0 \\\\ \\vdots & \\vdots & \\vdots & & \\vdots \\\\ ax^n & ax^{n-1} & ax^{n-2} & \\cdots & a \\end{vmatrix}$。\n\n提示：利用范德蒙德行列式的结果。",
      sub_questions: [
        { sub_id: "(1)", stem: "$D_n$（循环移位结构）", answer: "$x^n + (-1)^{n+1} y^n$" },
        { sub_id: "(2)", stem: "$D_n$（常数元素与主对角阶梯）", answer: "$-2(n-2)!$" },
        { sub_id: "(3)", stem: "$D_n$（爪型行和加法）", answer: "$(-m)^n + (-m)^{n-1} \\sum_{i=1}^n x_i$" },
        { sub_id: "(4)", stem: "$D_n$（各列加到第一列）", answer: "$\\lambda^{n-1}(\\lambda + \\sum_{i=1}^n a_i)$" },
        { sub_id: "(5)", stem: "$D_{2n}$（对称交叉块状行列式）", answer: "$\\prod_{i=1}^n (a_i d_i - b_i c_i)$" },
        { sub_id: "(6)", stem: "$D_n = \\det(|i-j|)$", answer: "$(-1)^{n-1}(n-1) 2^{n-2}$" },
        { sub_id: "(7)", stem: "$D_n$（主对角加参爪型）", answer: "$a_1 a_2 \\cdots a_n (1 + \\sum_{i=1}^n \\frac{1}{a_i})$" },
        { sub_id: "(8)", stem: "$D_{n+1}$（差分范德蒙德型）", answer: "$\\prod_{1 \\le i < j \\le n+1} (j-i)$" },
        { sub_id: "(9)", stem: "展开降阶型行列式", answer: "$a(a+x)^n$" }
      ]
    },
    solution: {
      answer: "(1) $x^n + (-1)^{n+1} y^n$；\n(2) $-2(n-2)!$；\n(3) $(-m)^n + (-m)^{n-1} \\sum_{i=1}^n x_i$；\n(4) $\\lambda^{n-1}(\\lambda + \\sum_{i=1}^n a_i)$；\n(5) $\\prod_{i=1}^n (a_i d_i - b_i c_i)$；\n(6) $(-1)^{n-1}(n-1) 2^{n-2}$；\n(7) $a_1 a_2 \\cdots a_n (1 + \\sum_{i=1}^n \\frac{1}{a_i})$；\n(8) $\\prod_{1 \\le i < j \\le n+1} (j-i)$；\n(9) $a(a+x)^n$。",
      hints: "分别选用爪型消元法、拆项加法、按行展开建立一阶线性递推关系式，或化为范德蒙德行列式求解。",
      steps: "(1) 按最后一行或第一列展开得 $x^n + (-1)^{n+1} y^n$；\n(2) 每一行减去前一行消元化简得 $-2(n-2)!$；\n(3) 拆项法或各列加到第一列得 $(-m)^n + (-m)^{n-1} \\sum x_i$；\n(4) 加边法或各行减去第一行得 $\\lambda^{n-1}(\\lambda + \\sum a_i)$；\n(5) 交换行与列将内外交错元素配对，化为分块上三角得 $\\prod (a_i d_i - b_i c_i)$；\n(6) 逐行做差消去绝对值项，展开化简得 $(-1)^{n-1}(n-1) 2^{n-2}$；\n(7) 爪型行列式标准加边法，提出公因式后得 $a_1 \\cdots a_n (1 + \\sum \\frac{1}{a_i})$；\n(8) 颠倒行序后直接套用 Vandermonde 行列式公式得 $\\prod_{1 \\le i < j \\le n+1} (j-i)$；\n(9) 按第一行展开建立递推式 $D_n = a D_{n-1} + a x (a+x)^{n-1}$，解递推得 $a(a+x)^n$。"
    }
  },
  {
    id: "LAG-TB-CH01-Q12",
    source_type: "textbook",
    source: {
      paper_id: 2001,
      raw_title: "《线性代数与几何》第1章 行列式 课后习题",
      clean_title: "《线性代数与几何》第1章 行列式 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 1 章 · 习题一 第 12 题",
      page_start: 40,
      page_end: 40
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 12,
      paper_q_num: 12,
      type: "calc",
      difficulty: 2,
      score: 5
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 1,
        chapter_title: "第1章 行列式",
        section: "1.6",
        section_title: "克拉默法则",
        section_slug: "1.6_克拉默法则",
        knowledge_points: ["范德蒙德行列式", "方程的根"]
      }
    },
    content: {
      stem: "解方程：\n\n$$\\begin{vmatrix} 1 & 1 & \\cdots & 1 \\\\ x & a_1 & \\cdots & a_{n-1} \\\\ x^2 & a_1^2 & \\cdots & a_{n-1}^2 \\\\ \\vdots & \\vdots & & \\vdots \\\\ x^{n-1} & a_1^{n-1} & \\cdots & a_{n-1}^{n-1} \\end{vmatrix} = 0$$ \n\n（其中 $a_1, a_2, \\cdots, a_{n-1}$ 是两两不同的数）。"
    },
    solution: {
      answer: "$x_1 = a_1, x_2 = a_2, \\cdots, x_{n-1} = a_{n-1}$。",
      hints: "将方程左边视为关于未知数 $x$ 的多项式，由范德蒙德行列式性质易得其因式分解形式。",
      steps: "方程左端是 $n$ 阶范德蒙德行列式，其值为 $\\prod_{1 \\le j < i \\le n-1} (a_i - a_j) \\cdot \\prod_{i=1}^{n-1} (a_i - x) = 0$。因为 $a_1, \\cdots, a_{n-1}$ 两两不同，前一部分乘积不为零，故必有 $\\prod_{i=1}^{n-1} (a_i - x) = 0$，解得根为 $x_1 = a_1, x_2 = a_2, \\cdots, x_{n-1} = a_{n-1}$。"
    }
  },
  {
    id: "LAG-TB-CH01-Q13",
    source_type: "textbook",
    source: {
      paper_id: 2001,
      raw_title: "《线性代数与几何》第1章 行列式 课后习题",
      clean_title: "《线性代数与几何》第1章 行列式 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 1 章 · 习题一 第 13 题",
      page_start: 40,
      page_end: 40
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 13,
      paper_q_num: 13,
      type: "calc",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 1,
        chapter_title: "第1章 行列式",
        section: "1.6",
        section_title: "克拉默法则",
        section_slug: "1.6_克拉默法则",
        knowledge_points: ["克拉默法则", "线性方程组解法"]
      }
    },
    content: {
      stem: "利用克拉默法则解下列线性方程组：\n\n(1) $\\begin{cases} 3x_1+2x_2-x_3=1, \\\\ 2x_1-3x_2+x_3=10, \\\\ x_1+4x_2-2x_3=-8; \\end{cases}$\n\n(2) $\\begin{cases} x_1+4x_2-7x_3+6x_4=0, \\\\ 2x_2+x_3+x_4=-8, \\\\ x_2+x_3+3x_4=-2, \\\\ x_1+x_3-x_4=1; \\end{cases}$\n\n(3) $\\begin{cases} x_1-x_2+3x_3+2x_4=2, \\\\ x_1+2x_2+6x_4=13, \\\\ x_2-2x_3+3x_4=8, \\\\ 4x_1-3x_2+5x_3+x_4=1. \\end{cases}$",
      sub_questions: [
        { sub_id: "(1)", stem: "$\\begin{cases} 3x_1+2x_2-x_3=1, \\\\ 2x_1-3x_2+x_3=10, \\\\ x_1+4x_2-2x_3=-8; \\end{cases}$", answer: "$x_1=2, x_2=-1, x_3=3$" },
        { sub_id: "(2)", stem: "$\\begin{cases} x_1+4x_2-7x_3+6x_4=0, \\\\ 2x_2+x_3+x_4=-8, \\\\ x_2+x_3+3x_4=-2, \\\\ x_1+x_3-x_4=1; \\end{cases}$", answer: "$x_1=3, x_2=-4, x_3=-1, x_4=1$" },
        { sub_id: "(3)", stem: "$\\begin{cases} x_1-x_2+3x_3+2x_4=2, \\\\ x_1+2x_2+6x_4=13, \\\\ x_2-2x_3+3x_4=8, \\\\ 4x_1-3x_2+5x_3+x_4=1. \\end{cases}$", answer: "$x_1=1, x_2=0, x_3=-1, x_4=2$" }
      ]
    },
    solution: {
      answer: "(1) $x_1=2, x_2=-1, x_3=3$；\n(2) $x_1=3, x_2=-4, x_3=-1, x_4=1$；\n(3) $x_1=1, x_2=0, x_3=-1, x_4=2$。",
      hints: "计算系数行列式 $D$ 与各变量行列式 $D_j$，通过 $x_j = D_j / D$ 求解。",
      steps: "(1) $D = -5, D_1 = -10, D_2 = 5, D_3 = -15 \\implies x_1=2, x_2=-1, x_3=3$；\n(2) $D = -10, D_1 = -30, D_2 = 40, D_3 = 10, D_4 = -10 \\implies x_1=3, x_2=-4, x_3=-1, x_4=1$；\n(3) $D = 23, D_1 = 23, D_2 = 0, D_3 = -23, D_4 = 46 \\implies x_1=1, x_2=0, x_3=-1, x_4=2$。"
    }
  },
  {
    id: "LAG-TB-CH01-Q14",
    source_type: "textbook",
    source: {
      paper_id: 2001,
      raw_title: "《线性代数与几何》第1章 行列式 课后习题",
      clean_title: "《线性代数与几何》第1章 行列式 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 1 章 · 习题一 第 14 题",
      page_start: 40,
      page_end: 40
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 14,
      paper_q_num: 14,
      type: "calc",
      difficulty: 2,
      score: 5
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 1,
        chapter_title: "第1章 行列式",
        section: "1.6",
        section_title: "克拉默法则",
        section_slug: "1.6_克拉默法则",
        knowledge_points: ["齐次线性方程组非零解", "系数行列式等于零"]
      }
    },
    content: {
      stem: "问 $\\lambda, \\mu$ 取何值时，齐次线性方程组\n\n$$\\begin{cases} \\lambda x_1 + x_2 + x_3 = 0, \\\\ x_1 + \\mu x_2 + x_3 = 0, \\\\ x_1 + 2\\mu x_2 + x_3 = 0 \\end{cases}$$\n\n有非零解？"
    },
    solution: {
      answer: "$\\lambda = 1$ 或 $\\mu = 0$。",
      hints: "齐次线性方程组有非零解的充要条件是其系数行列式 $D = 0$。",
      steps: "计算系数行列式：\n$$D = \\begin{vmatrix} \\lambda & 1 & 1 \\\\ 1 & \\mu & 1 \\\\ 1 & 2\\mu & 1 \\end{vmatrix}$$\n第 3 行减去第 2 行得 $\\begin{vmatrix} \\lambda & 1 & 1 \\\\ 1 & \\mu & 1 \\\\ 0 & \\mu & 0 \\end{vmatrix} = -\\mu (\\lambda - 1) = \\mu(1-\\lambda)$。\n令 $D = 0$，解得 $\\lambda = 1$ 或 $\\mu = 0$。"
    }
  },
  {
    id: "LAG-TB-CH01-Q15",
    source_type: "textbook",
    source: {
      paper_id: 2001,
      raw_title: "《线性代数与几何》第1章 行列式 课后习题",
      clean_title: "《线性代数与几何》第1章 行列式 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 1 章 · 习题一 第 15 题",
      page_start: 40,
      page_end: 40
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 15,
      paper_q_num: 15,
      type: "calc",
      difficulty: 2,
      score: 5
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 1,
        chapter_title: "第1章 行列式",
        section: "1.6",
        section_title: "克拉默法则",
        section_slug: "1.6_克拉默法则",
        knowledge_points: ["齐次线性方程组非零解", "特征多项式初步"]
      }
    },
    content: {
      stem: "问 $\\lambda$ 取何值时，齐次线性方程组\n\n$$\\begin{cases} (1-\\lambda)x_1 - 2x_2 + 4x_3 = 0, \\\\ 2x_1 + (3-\\lambda)x_2 + x_3 = 0, \\\\ x_1 + x_2 + (1-\\lambda)x_3 = 0 \\end{cases}$$\n\n有非零解？"
    },
    solution: {
      answer: "$\\lambda = 0, 2$ 或 $3$。",
      hints: "令系数行列式 $D = 0$ 解关于 $\\lambda$ 的三次代数方程。",
      steps: "计算系数行列式：\n$$D = \\begin{vmatrix} 1-\\lambda & -2 & 4 \\\\ 2 & 3-\\lambda & 1 \\\\ 1 & 1 & 1-\\lambda \\end{vmatrix}$$\n展开并因式分解得 $-\\lambda(\\lambda-2)(\\lambda-3) = 0$。\n解得 $\\lambda = 0, 2$ 或 $3$。"
    }
  },
  {
    id: "LAG-TB-CH01-Q16",
    source_type: "textbook",
    source: {
      paper_id: 2001,
      raw_title: "《线性代数与几何》第1章 行列式 课后习题",
      clean_title: "《线性代数与几何》第1章 行列式 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 1 章 · 习题一 第 16 题",
      page_start: 40,
      page_end: 40
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 16,
      paper_q_num: 16,
      type: "calc",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 1,
        chapter_title: "第1章 行列式",
        section: "1.6",
        section_title: "克拉默法则",
        section_slug: "1.6_克拉默法则",
        knowledge_points: ["多项式曲线拟合", "线性方程组应用"]
      }
    },
    content: {
      stem: "设平面上立方曲线 $y = a_1 x^3 + a_2 x^2 + a_3 x + a_4$ 通过点 $(1, 0), (2, -2), (3, 2), (4, 18)$，求系数 $a_1, a_2, a_3, a_4$。"
    },
    solution: {
      answer: "$a_1 = 1, a_2 = -3, a_3 = 0, a_4 = 2$。",
      hints: "将四个点的坐标分别代入曲线方程，建立关于 $a_1, a_2, a_3, a_4$ 的四元一次线性方程组，利用克拉默法则或消元法求解。",
      steps: "代入四点得到四元一次线性方程组：\n$$\\begin{cases} a_1 + a_2 + a_3 + a_4 = 0 \\\\ 8a_1 + 4a_2 + 2a_3 + a_4 = -2 \\\\ 27a_1 + 9a_2 + 3a_3 + a_4 = 2 \\\\ 64a_1 + 16a_2 + 4a_3 + a_4 = 18 \\end{cases}$$\n解该方程组解得：$a_1 = 1, a_2 = -3, a_3 = 0, a_4 = 2$。"
    }
  },
  {
    id: "LAG-TB-CH01-Q17",
    source_type: "textbook",
    source: {
      paper_id: 2001,
      raw_title: "《线性代数与几何》第1章 行列式 课后习题",
      clean_title: "《线性代数与几何》第1章 行列式 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 1 章 · 习题一 第 17 题",
      page_start: 40,
      page_end: 40
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 17,
      paper_q_num: 17,
      type: "proof",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 1,
        chapter_title: "第1章 行列式",
        section: "1.4",
        section_title: "行列式的性质",
        section_slug: "1.4_行列式的性质",
        knowledge_points: ["反对称行列式", "转置保值性"]
      }
    },
    content: {
      stem: "证明：奇数阶反对称行列式等于零（行列式 $D = \\det(a_{ij})$ 中元素满足条件 $a_{ij} = -a_{ji}$ 时，称为反对称行列式）。"
    },
    solution: {
      answer: "证明略。",
      hints: "利用行列式性质 $|A^T| = |A|$ 以及提取每行公因子 $-1$。",
      steps: "设 $D$ 为 $n$ 阶反对称行列式，由 $a_{ij} = -a_{ji}$ 知 $A^T = -A$。\n由转置行列式性质得：\n$$D = \\det(A) = \\det(A^T) = \\det(-A) = (-1)^n \\det(A) = (-1)^n D$$\n当 $n$ 为奇数时，$(-1)^n = -1$，故 $D = -D$，即 $2D = 0$，从而 $D = 0$。"
    }
  },
  {
    id: "LAG-TB-CH01-Q18",
    source_type: "textbook",
    source: {
      paper_id: 2001,
      raw_title: "《线性代数与几何》第1章 行列式 课后习题",
      clean_title: "《线性代数与几何》第1章 行列式 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 1 章 · 习题一 第 18 题",
      page_start: 40,
      page_end: 41
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 18,
      paper_q_num: 18,
      type: "proof",
      difficulty: 3,
      score: 10
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 1,
        chapter_title: "第1章 行列式",
        section: "1.5",
        section_title: "行列式的展开定理",
        section_slug: "1.5_行列式的展开定理",
        knowledge_points: ["数学归纳法", "三对角行列式递推"]
      }
    },
    content: {
      stem: "用数学归纳法证明：\n\n(1) $D_n = \\begin{vmatrix} \\cos\\theta & 1 & & \\\\ 1 & 2\\cos\\theta & 1 & \\\\ & 1 & 2\\cos\\theta & 1 \\\\ & & \\ddots & \\ddots & \\ddots \\\\ & & & 1 & 2\\cos\\theta \\end{vmatrix} = \\cos n\\theta$；\n\n(2) $D_n = \\begin{vmatrix} \\alpha+\\beta & \\alpha\\beta & & \\\\ 1 & \\alpha+\\beta & \\alpha\\beta & \\\\ & 1 & \\alpha+\\beta & \\alpha\\beta \\\\ & & \\ddots & \\ddots & \\ddots \\\\ & & & 1 & \\alpha+\\beta \\end{vmatrix} = \\frac{\\alpha^{n+1} - \\beta^{n+1}}{\\alpha - \\beta} \\quad (\\alpha \\neq \\beta)$。",
      sub_questions: [
        { sub_id: "(1)", stem: "$D_n = \\begin{vmatrix} \\cos\\theta & 1 & & \\\\ 1 & 2\\cos\\theta & 1 & \\\\ & 1 & 2\\cos\\theta & 1 \\\\ & & \\ddots & \\ddots & \\ddots \\\\ & & & 1 & 2\\cos\\theta \\end{vmatrix} = \\cos n\\theta$" },
        { sub_id: "(2)", stem: "$D_n = \\begin{vmatrix} \\alpha+\\beta & \\alpha\\beta & & \\\\ 1 & \\alpha+\\beta & \\alpha\\beta & \\\\ & 1 & \\alpha+\\beta & \\alpha\\beta \\\\ & & \\ddots & \\ddots & \\ddots \\\\ & & & 1 & \\alpha+\\beta \\end{vmatrix} = \\frac{\\alpha^{n+1} - \\beta^{n+1}}{\\alpha - \\beta} \\quad (\\alpha \\neq \\beta)$" }
      ]
    },
    solution: {
      answer: "证明略。",
      hints: "按第一行或第一列展开，建立二阶常系数线性递推关系式，结合三角函数积化和差公式或等比数列求和完成归纳步骤。",
      steps: "(1) 当 $n=1$ 时 $D_1 = \\cos\\theta$；$n=2$ 时 $D_2 = 2\\cos^2\\theta - 1 = \\cos 2\\theta$。按第 $n$ 行展开得二阶递推关系 $D_n = 2\\cos\\theta D_{n-1} - D_{n-2}$。由积化和差 $2\\cos\\theta \\cos((n-1)\\theta) - \\cos((n-2)\\theta) = \\cos(n\\theta)$，由归纳假设得证；\n(2) 按第一列展开得递推关系式 $D_n - \\beta D_{n-1} = \\alpha(D_{n-1} - \\beta D_{n-2})$，结合归纳法可直接推得 $D_n = \\sum_{k=0}^n \\alpha^{n-k} \\beta^k = \\frac{\\alpha^{n+1} - \\beta^{n+1}}{\\alpha - \\beta}$。"
    }
  },
  {
    id: "LAG-TB-CH01-Q19",
    source_type: "textbook",
    source: {
      paper_id: 2001,
      raw_title: "《线性代数与几何》第1章 行列式 课后习题",
      clean_title: "《线性代数与几何》第1章 行列式 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 1 章 · 习题一 第 19 题",
      page_start: 41,
      page_end: 41
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 19,
      paper_q_num: 19,
      type: "proof",
      difficulty: 3,
      score: 10
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 1,
        chapter_title: "第1章 行列式",
        section: "1.6",
        section_title: "克拉默法则",
        section_slug: "1.6_克拉默法则",
        knowledge_points: ["多项式插值", "克拉默法则应用", "范德蒙德行列式"]
      }
    },
    content: {
      stem: "一个函数 $\\varphi(x)$ 在 $[0, 1]$ 区间中 $n+1$ 个不同点 $t_1, t_2, \\cdots, t_{n+1}$ 上，给定不全为零的函数值 $\\varphi(t_1), \\varphi(t_2), \\cdots, \\varphi(t_{n+1})$，是否可以找到唯一的一个次数不超过 $n$ 次的多项式\n\n$$f(t) = a_0 + a_1 t + a_2 t^2 + \\cdots + a_n t^n$$\n\n使 $f(t_i) = \\varphi(t_i), i=1, 2, \\cdots, n+1$？"
    },
    solution: {
      answer: "略。",
      hints: "将条件转化为关于待定系数 $a_0, a_1, \\cdots, a_n$ 的线性方程组，并考察其系数行列式。",
      steps: "可以。由条件 $f(t_i) = \\varphi(t_i)$ 可建立关于待定未知数 $a_0, a_1, \\cdots, a_n$ 的 $n+1$ 元非齐次线性方程组：\n$$\\begin{cases} a_0 + a_1 t_1 + a_2 t_1^2 + \\cdots + a_n t_1^n = \\varphi(t_1) \\\\ a_0 + a_1 t_2 + a_2 t_2^2 + \\cdots + a_n t_2^n = \\varphi(t_2) \\\\ \\vdots \\\\ a_0 + a_1 t_{n+1} + a_2 t_{n+1}^2 + \\cdots + a_n t_{n+1}^n = \\varphi(t_{n+1}) \\end{cases}$$\n该方程组的系数行列式为 $n+1$ 阶范德蒙德行列式的转置行列式：\n$$D = \\prod_{1 \\le j < i \\le n+1} (t_i - t_j)$$\n由于 $t_1, t_2, \\cdots, t_{n+1}$ 是两两不同的点，故 $D \\neq 0$。\n由克拉默法则，该线性方程组存在唯一解 $(a_0, a_1, \\cdots, a_n)$。\n因此可以找到唯一的一个次数不超过 $n$ 次的多项式满足题设条件。"
    }
  }
];

// KaTeX 校验
let errCount = 0;
function testMath(str, qid, field) {
  if (!str) return;
  const matches = str.match(/\\$\\$([\\s\\S]+?)\\$\\$|\\$([^\\$]+?)\\$/g) || [];
  for (const m of matches) {
    const raw = m.startsWith('$$') ? m.slice(2, -2).trim() : m.slice(1, -1).trim();
    try {
      katex.renderToString(raw, { output: 'html', throwOnError: true, strict: false });
    } catch (e) {
      console.error(`[KaTeX Error] ${qid} in ${field}: ${raw} -> ${e.message}`);
      errCount++;
    }
  }
}

for (const q of ch01Questions) {
  testMath(q.content.stem, q.id, 'content.stem');
  testMath(q.solution.answer, q.id, 'solution.answer');
  testMath(q.solution.hints, q.id, 'solution.hints');
  testMath(q.solution.steps, q.id, 'solution.steps');
  if (q.content.sub_questions) {
    for (const sub of q.content.sub_questions) {
      testMath(sub.stem, q.id, 'sub_questions.stem');
      testMath(sub.answer, q.id, 'sub_questions.answer');
    }
  }
}

console.log(`Ch01 Total questions: ${ch01Questions.length}, KaTeX errors: ${errCount}`);
if (errCount === 0) {
  const outFile = path.join(__dirname, '../../src/data/exercises/raw_lag/ch01.json');
  fs.writeFileSync(outFile, JSON.stringify(ch01Questions, null, 2), 'utf-8');
  console.log(`Saved Chapter 1 to ${outFile}`);
} else {
  process.exit(1);
}
