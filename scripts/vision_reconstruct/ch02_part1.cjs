// scripts/vision_reconstruct/ch02_part1.cjs
module.exports = [
  {
    id: "LAG-TB-CH02-Q01",
    source_type: "textbook",
    source: {
      paper_id: 2002,
      raw_title: "《线性代数与几何》第2章 矩阵 课后习题",
      clean_title: "《线性代数与几何》第2章 矩阵 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 1 题",
      page_start: 66,
      page_end: 66
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 1,
      paper_q_num: 1,
      type: "calc",
      difficulty: 1,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 2,
        chapter_title: "第2章 矩阵",
        section: "2.2",
        section_title: "矩阵的运算",
        section_slug: "2.2_矩阵的运算",
        knowledge_points: ["矩阵数乘", "矩阵加法", "矩阵线性运算"]
      }
    },
    content: {
      stem: "已知矩阵 $A = \\begin{bmatrix} 2 & 0 & -3 \\\\ 5 & -1 & 6 \\end{bmatrix}, B = \\begin{bmatrix} 1 & 0 & 4 \\\\ 2 & -1 & -2 \\end{bmatrix}$，求 $2A, A+B, 2A-3B$。",
      sub_questions: [
        { sub_id: "(1)", stem: "求 $2A$", answer: "$2A = \\begin{bmatrix} 4 & 0 & -6 \\\\ 10 & -2 & 12 \\end{bmatrix}$" },
        { sub_id: "(2)", stem: "求 $A+B$", answer: "$A+B = \\begin{bmatrix} 3 & 0 & 1 \\\\ 7 & -2 & 4 \\end{bmatrix}$" },
        { sub_id: "(3)", stem: "求 $2A-3B$", answer: "$2A-3B = \\begin{bmatrix} 1 & 0 & -18 \\\\ 4 & 1 & 18 \\end{bmatrix}$" }
      ]
    },
    solution: {
      answer: "$2A = \\begin{bmatrix} 4 & 0 & -6 \\\\ 10 & -2 & 12 \\end{bmatrix}, A+B = \\begin{bmatrix} 3 & 0 & 1 \\\\ 7 & -2 & 4 \\end{bmatrix}, 2A-3B = \\begin{bmatrix} 1 & 0 & -18 \\\\ 4 & 1 & 18 \\end{bmatrix}$。",
      hints: "直接按照矩阵的数乘与加减法法则逐项计算对应位置的元素。",
      steps: "直接按矩阵的数乘与加减法运算法则计算各对应元素：\n\n$$2A = 2 \\begin{bmatrix} 2 & 0 & -3 \\\\ 5 & -1 & 6 \\end{bmatrix} = \\begin{bmatrix} 4 & 0 & -6 \\\\ 10 & -2 & 12 \\end{bmatrix}$$\n\n$$A+B = \\begin{bmatrix} 2+1 & 0+0 & -3+4 \\\\ 5+2 & -1-1 & 6-2 \\end{bmatrix} = \\begin{bmatrix} 3 & 0 & 1 \\\\ 7 & -2 & 4 \\end{bmatrix}$$\n\n$$2A-3B = \\begin{bmatrix} 4 & 0 & -6 \\\\ 10 & -2 & 12 \\end{bmatrix} - \\begin{bmatrix} 3 & 0 & 12 \\\\ 6 & -3 & -6 \\end{bmatrix} = \\begin{bmatrix} 1 & 0 & -18 \\\\ 4 & 1 & 18 \\end{bmatrix}$$"
    }
  },
  {
    id: "LAG-TB-CH02-Q02",
    source_type: "textbook",
    source: {
      paper_id: 2002,
      raw_title: "《线性代数与几何》第2章 矩阵 课后习题",
      clean_title: "《线性代数与几何》第2章 矩阵 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 2 题",
      page_start: 66,
      page_end: 66
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 2,
      paper_q_num: 2,
      type: "calc",
      difficulty: 1,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 2,
        chapter_title: "第2章 矩阵",
        section: "2.2",
        section_title: "矩阵的运算",
        section_slug: "2.2_矩阵的运算",
        knowledge_points: ["矩阵乘法", "矩阵乘法的非交换性", "零因子"]
      }
    },
    content: {
      stem: "设 $A = \\begin{bmatrix} 2 & 1 \\\\ -4 & -2 \\end{bmatrix}, B = \\begin{bmatrix} 3 & -1 \\\\ -6 & 2 \\end{bmatrix}$，求 $AB, BA$ 及 $A^2$。",
      sub_questions: [
        { sub_id: "(1)", stem: "求 $AB$", answer: "$AB = \\begin{bmatrix} 0 & 0 \\\\ 0 & 0 \\end{bmatrix}$" },
        { sub_id: "(2)", stem: "求 $BA$", answer: "$BA = \\begin{bmatrix} 10 & 5 \\\\ -20 & -10 \\end{bmatrix}$" },
        { sub_id: "(3)", stem: "求 $A^2$", answer: "$A^2 = \\begin{bmatrix} 0 & 0 \\\\ 0 & 0 \\end{bmatrix}$" }
      ]
    },
    solution: {
      answer: "$AB = \\begin{bmatrix} 0 & 0 \\\\ 0 & 0 \\end{bmatrix}, BA = \\begin{bmatrix} 10 & 5 \\\\ -20 & -10 \\end{bmatrix}, A^2 = \\begin{bmatrix} 0 & 0 \\\\ 0 & 0 \\end{bmatrix}$。",
      hints: "按矩阵乘法定义（行乘列求和）计算。注意矩阵乘法一般不满足交换律，且非零矩阵相乘结果可以为零矩阵。",
      steps: "计算各乘积：\n\n$$AB = \\begin{bmatrix} 2\\times 3 + 1\\times(-6) & 2\\times(-1) + 1\\times 2 \\\\ (-4)\\times 3 + (-2)\\times(-6) & (-4)\\times(-1) + (-2)\\times 2 \\end{bmatrix} = \\begin{bmatrix} 0 & 0 \\\\ 0 & 0 \\end{bmatrix}$$\n\n$$BA = \\begin{bmatrix} 3\\times 2 + (-1)\\times(-4) & 3\\times 1 + (-1)\\times(-2) \\\\ (-6)\\times 2 + 2\\times(-4) & (-6)\\times 1 + 2\\times(-2) \\end{bmatrix} = \\begin{bmatrix} 10 & 5 \\\\ -20 & -10 \\end{bmatrix}$$\n\n$$A^2 = \\begin{bmatrix} 2 & 1 \\\\ -4 & -2 \\end{bmatrix} \\begin{bmatrix} 2 & 1 \\\\ -4 & -2 \\end{bmatrix} = \\begin{bmatrix} 0 & 0 \\\\ 0 & 0 \\end{bmatrix}$$\n\n由本题可知 $AB \\neq BA$ 且 $A \\neq \\mathbf{0}$ 但 $A^2 = \\mathbf{0}$。"
    }
  },
  {
    id: "LAG-TB-CH02-Q03",
    source_type: "textbook",
    source: {
      paper_id: 2002,
      raw_title: "《线性代数与几何》第2章 矩阵 课后习题",
      clean_title: "《线性代数与几何》第2章 矩阵 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 3 题",
      page_start: 66,
      page_end: 66
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 3,
      paper_q_num: 3,
      type: "calc",
      difficulty: 1,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 2,
        chapter_title: "第2章 矩阵",
        section: "2.2",
        section_title: "矩阵的运算",
        section_slug: "2.2_矩阵的运算",
        knowledge_points: ["矩阵乘法", "矩阵多项式", "矩阵的幂"]
      }
    },
    content: {
      stem: "已知矩阵 $A = \\begin{bmatrix} 1 & 3 \\\\ 2 & -1 \\end{bmatrix}, B = \\begin{bmatrix} 3 & 0 \\\\ 1 & 2 \\end{bmatrix}$，求 $AB$ 及 $A^3+2A^2+A-E$。",
      sub_questions: [
        { sub_id: "(1)", stem: "求 $AB$", answer: "$AB = \\begin{bmatrix} 6 & 6 \\\\ 5 & -2 \\end{bmatrix}$" },
        { sub_id: "(2)", stem: "求 $A^3+2A^2+A-E$", answer: "$A^3+2A^2+A-E = \\begin{bmatrix} 21 & 24 \\\\ 16 & 5 \\end{bmatrix}$" }
      ]
    },
    solution: {
      answer: "$AB = \\begin{bmatrix} 6 & 6 \\\\ 5 & -2 \\end{bmatrix}, A^3+2A^2+A-E = \\begin{bmatrix} 21 & 24 \\\\ 16 & 5 \\end{bmatrix}$。",
      hints: "先计算 $A^2$，观察是否可化简为标量矩阵以简化 $A^3$ 的计算。",
      steps: "计算 $AB$：\n\n$$AB = \\begin{bmatrix} 1\\times 3 + 3\\times 1 & 1\\times 0 + 3\\times 2 \\\\ 2\\times 3 + (-1)\\times 1 & 2\\times 0 + (-1)\\times 2 \\end{bmatrix} = \\begin{bmatrix} 6 & 6 \\\\ 5 & -2 \\end{bmatrix}$$\n\n计算 $A^2$：\n\n$$A^2 = \\begin{bmatrix} 1 & 3 \\\\ 2 & -1 \\end{bmatrix} \\begin{bmatrix} 1 & 3 \\\\ 2 & -1 \\end{bmatrix} = \\begin{bmatrix} 7 & 0 \\\\ 0 & 7 \\end{bmatrix} = 7E$$\n\n则 $A^3 = A^2 A = 7A$。\n代入矩阵多项式可得：\n\n$$A^3+2A^2+A-E = 7A + 2(7E) + A - E = 8A + 13E = 8\\begin{bmatrix} 1 & 3 \\\\ 2 & -1 \\end{bmatrix} + 13\\begin{bmatrix} 1 & 0 \\\\ 0 & 1 \\end{bmatrix} = \\begin{bmatrix} 21 & 24 \\\\ 16 & 5 \\end{bmatrix}$$"
    }
  },
  {
    id: "LAG-TB-CH02-Q04",
    source_type: "textbook",
    source: {
      paper_id: 2002,
      raw_title: "《线性代数与几何》第2章 矩阵 课后习题",
      clean_title: "《线性代数与几何》第2章 矩阵 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 4 题",
      page_start: 67,
      page_end: 67
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 4,
      paper_q_num: 4,
      type: "calc",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 2,
        chapter_title: "第2章 矩阵",
        section: "2.2",
        section_title: "矩阵的运算",
        section_slug: "2.2_矩阵的运算",
        knowledge_points: ["矩阵乘法", "转置矩阵", "矩阵线性运算"]
      }
    },
    content: {
      stem: "设 $A = \\begin{bmatrix} 1 & 1 & 1 \\\\ 1 & 1 & -1 \\\\ 1 & -1 & 1 \\end{bmatrix}, B = \\begin{bmatrix} 1 & 2 & 3 \\\\ -1 & -2 & 4 \\\\ 0 & 5 & 1 \\end{bmatrix}$，求 $3AB-2A$ 及 $A^{\\mathrm{T}}B$。",
      sub_questions: [
        { sub_id: "(1)", stem: "求 $3AB-2A$", answer: "$3AB-2A = \\begin{bmatrix} -2 & 13 & 22 \\\\ -2 & -17 & 20 \\\\ 4 & 29 & -2 \\end{bmatrix}$" },
        { sub_id: "(2)", stem: "求 $A^{\\mathrm{T}}B$", answer: "$A^{\\mathrm{T}}B = \\begin{bmatrix} 0 & 5 & 8 \\\\ 0 & -5 & 6 \\\\ 2 & 9 & 0 \\end{bmatrix}$" }
      ]
    },
    solution: {
      answer: "$3AB-2A = \\begin{bmatrix} -2 & 13 & 22 \\\\ -2 & -17 & 20 \\\\ 4 & 29 & -2 \\end{bmatrix}, A^{\\mathrm{T}}B = \\begin{bmatrix} 0 & 5 & 8 \\\\ 0 & -5 & 6 \\\\ 2 & 9 & 0 \\end{bmatrix}$。",
      hints: "注意到矩阵 $A$ 为对称矩阵，即 $A^{\\mathrm{T}} = A$。",
      steps: "先计算乘积 $AB$：\n\n$$AB = \\begin{bmatrix} 1 & 1 & 1 \\\\ 1 & 1 & -1 \\\\ 1 & -1 & 1 \\end{bmatrix} \\begin{bmatrix} 1 & 2 & 3 \\\\ -1 & -2 & 4 \\\\ 0 & 5 & 1 \\end{bmatrix} = \\begin{bmatrix} 0 & 5 & 8 \\\\ 0 & -5 & 6 \\\\ 2 & 9 & 0 \\end{bmatrix}$$\n\n因 $A^{\\mathrm{T}} = A$，故：\n\n$$A^{\\mathrm{T}}B = AB = \\begin{bmatrix} 0 & 5 & 8 \\\\ 0 & -5 & 6 \\\\ 2 & 9 & 0 \\end{bmatrix}$$\n\n进而：\n\n$$3AB-2A = 3\\begin{bmatrix} 0 & 5 & 8 \\\\ 0 & -5 & 6 \\\\ 2 & 9 & 0 \\end{bmatrix} - 2\\begin{bmatrix} 1 & 1 & 1 \\\\ 1 & 1 & -1 \\\\ 1 & -1 & 1 \\end{bmatrix} = \\begin{bmatrix} -2 & 13 & 22 \\\\ -2 & -17 & 20 \\\\ 4 & 29 & -2 \\end{bmatrix}$$"
    }
  },
  {
    id: "LAG-TB-CH02-Q05",
    source_type: "textbook",
    source: {
      paper_id: 2002,
      raw_title: "《线性代数与几何》第2章 矩阵 课后习题",
      clean_title: "《线性代数与几何》第2章 矩阵 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 5 题",
      page_start: 67,
      page_end: 67
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 5,
      paper_q_num: 5,
      type: "calc",
      difficulty: 1,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 2,
        chapter_title: "第2章 矩阵",
        section: "2.2",
        section_title: "矩阵的运算",
        section_slug: "2.2_矩阵的运算",
        knowledge_points: ["转置矩阵性质", "矩阵乘法"]
      }
    },
    content: {
      stem: "设 $A = \\begin{bmatrix} 5 & -2 & 1 \\\\ 3 & 4 & -1 \\end{bmatrix}, B = \\begin{bmatrix} -3 & 2 & 0 \\\\ -2 & 0 & 1 \\end{bmatrix}$，求 $AB^{\\mathrm{T}}$ 及 $BA^{\\mathrm{T}}$。",
      sub_questions: [
        { sub_id: "(1)", stem: "求 $AB^{\\mathrm{T}}$", answer: "$AB^{\\mathrm{T}} = \\begin{bmatrix} -19 & -9 \\\\ -1 & -7 \\end{bmatrix}$" },
        { sub_id: "(2)", stem: "求 $BA^{\\mathrm{T}}$", answer: "$BA^{\\mathrm{T}} = \\begin{bmatrix} -19 & -1 \\\\ -9 & -7 \\end{bmatrix}$" }
      ]
    },
    solution: {
      answer: "$AB^{\\mathrm{T}} = \\begin{bmatrix} -19 & -9 \\\\ -1 & -7 \\end{bmatrix}, BA^{\\mathrm{T}} = \\begin{bmatrix} -19 & -1 \\\\ -9 & -7 \\end{bmatrix}$。",
      hints: "利用转置公式 $BA^{\\mathrm{T}} = (AB^{\\mathrm{T}})^{\\mathrm{T}}$ 简化计算。",
      steps: "写出 $B^{\\mathrm{T}} = \\begin{bmatrix} -3 & -2 \\\\ 2 & 0 \\\\ 0 & 1 \\end{bmatrix}$，计算乘积：\n\n$$AB^{\\mathrm{T}} = \\begin{bmatrix} 5 & -2 & 1 \\\\ 3 & 4 & -1 \\end{bmatrix} \\begin{bmatrix} -3 & -2 \\\\ 2 & 0 \\\\ 0 & 1 \\end{bmatrix} = \\begin{bmatrix} 5(-3)+(-2)(2)+1(0) & 5(-2)+(-2)(0)+1(1) \\\\ 3(-3)+4(2)+(-1)(0) & 3(-2)+4(0)+(-1)(1) \\end{bmatrix} = \\begin{bmatrix} -19 & -9 \\\\ -1 & -7 \\end{bmatrix}$$\n\n由转置性质 $(AB^{\\mathrm{T}})^{\\mathrm{T}} = (B^{\\mathrm{T}})^{\\mathrm{T}} A^{\\mathrm{T}} = BA^{\\mathrm{T}}$，直接得：\n\n$$BA^{\\mathrm{T}} = \\begin{bmatrix} -19 & -9 \\\\ -1 & -7 \\end{bmatrix}^{\\mathrm{T}} = \\begin{bmatrix} -19 & -1 \\\\ -9 & -7 \\end{bmatrix}$$"
    }
  },
  {
    id: "LAG-TB-CH02-Q06",
    source_type: "textbook",
    source: {
      paper_id: 2002,
      raw_title: "《线性代数与几何》第2章 矩阵 课后习题",
      clean_title: "《线性代数与几何》第2章 矩阵 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 6 题",
      page_start: 67,
      page_end: 67
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 6,
      paper_q_num: 6,
      type: "calc",
      difficulty: 2,
      score: 10
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 2,
        chapter_title: "第2章 矩阵",
        section: "2.2",
        section_title: "矩阵的运算",
        section_slug: "2.2_矩阵的运算",
        knowledge_points: ["矩阵乘法", "行向量与列向量相乘", "二次型矩阵形式", "初等矩阵乘积"]
      }
    },
    content: {
      stem: "计算下列矩阵的乘积：\n\n(1) $\\begin{bmatrix} a \\\\ b \\\\ c \\end{bmatrix} \\begin{bmatrix} a & b & c \\end{bmatrix}$；\n\n(2) $\\begin{bmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ k & 0 & 1 \\end{bmatrix} \\begin{bmatrix} a_{11} & a_{12} \\\\ a_{21} & a_{22} \\\\ a_{31} & a_{32} \\end{bmatrix}$；\n\n(3) $\\begin{bmatrix} 4 & 3 & 1 \\\\ 1 & -2 & 3 \\\\ 5 & 7 & 0 \\end{bmatrix} \\begin{bmatrix} 7 \\\\ 2 \\\\ 1 \\end{bmatrix}$；\n\n(4) $\\begin{bmatrix} 1 & 2 & 3 \\end{bmatrix} \\begin{bmatrix} 3 \\\\ 2 \\\\ 1 \\end{bmatrix}$；\n\n(5) $\\begin{bmatrix} 2 \\\\ 1 \\\\ 3 \\end{bmatrix} \\begin{bmatrix} -1 & 2 \\end{bmatrix}$；\n\n(6) $\\begin{bmatrix} 2 & 1 & 4 & 0 \\\\ 1 & -1 & 3 & 4 \\end{bmatrix} \\begin{bmatrix} 1 & 3 & 1 \\\\ 0 & -1 & 2 \\\\ 1 & -3 & 1 \\\\ 4 & 0 & -2 \\end{bmatrix}$；\n\n(7) $\\begin{bmatrix} x_1 & x_2 & x_3 \\end{bmatrix} \\begin{bmatrix} a_{11} & a_{12} & a_{13} \\\\ a_{21} & a_{22} & a_{23} \\\\ a_{31} & a_{32} & a_{33} \\end{bmatrix} \\begin{bmatrix} x_1 \\\\ x_2 \\\\ x_3 \\end{bmatrix}$；\n\n(8) $\\begin{bmatrix} 1 & 2 & 1 & 0 \\\\ 0 & 1 & 0 & 1 \\\\ 0 & 0 & 2 & 1 \\\\ 0 & 0 & 0 & 3 \\end{bmatrix} \\begin{bmatrix} 1 & 0 & 3 & 1 \\\\ 0 & 1 & 2 & -1 \\\\ 0 & 0 & 1 & 0 \\\\ 0 & 0 & 0 & 1 \\end{bmatrix}$。",
      sub_questions: [
        { sub_id: "(1)", stem: "$\\begin{bmatrix} a \\\\ b \\\\ c \\end{bmatrix} \\begin{bmatrix} a & b & c \\end{bmatrix}$", answer: "$\\begin{bmatrix} a^2 & ab & ac \\\\ ba & b^2 & bc \\\\ ca & cb & c^2 \\end{bmatrix}$" },
        { sub_id: "(2)", stem: "$\\begin{bmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ k & 0 & 1 \\end{bmatrix} \\begin{bmatrix} a_{11} & a_{12} \\\\ a_{21} & a_{22} \\\\ a_{31} & a_{32} \\end{bmatrix}$", answer: "$\\begin{bmatrix} a_{11} & a_{12} \\\\ a_{21} & a_{22} \\\\ ka_{11}+a_{31} & ka_{12}+a_{32} \\end{bmatrix}$" },
        { sub_id: "(3)", stem: "$\\begin{bmatrix} 4 & 3 & 1 \\\\ 1 & -2 & 3 \\\\ 5 & 7 & 0 \\end{bmatrix} \\begin{bmatrix} 7 \\\\ 2 \\\\ 1 \\end{bmatrix}$", answer: "$\\begin{bmatrix} 35 \\\\ 6 \\\\ 49 \\end{bmatrix}$" },
        { sub_id: "(4)", stem: "$\\begin{bmatrix} 1 & 2 & 3 \\end{bmatrix} \\begin{bmatrix} 3 \\\\ 2 \\\\ 1 \\end{bmatrix}$", answer: "$10$" },
        { sub_id: "(5)", stem: "$\\begin{bmatrix} 2 \\\\ 1 \\\\ 3 \\end{bmatrix} \\begin{bmatrix} -1 & 2 \\end{bmatrix}$", answer: "$\\begin{bmatrix} -2 & 4 \\\\ -1 & 2 \\\\ -3 & 6 \\end{bmatrix}$" },
        { sub_id: "(6)", stem: "$\\begin{bmatrix} 2 & 1 & 4 & 0 \\\\ 1 & -1 & 3 & 4 \\end{bmatrix} \\begin{bmatrix} 1 & 3 & 1 \\\\ 0 & -1 & 2 \\\\ 1 & -3 & 1 \\\\ 4 & 0 & -2 \\end{bmatrix}$", answer: "$\\begin{bmatrix} 6 & -7 & 8 \\\\ 20 & -5 & -6 \\end{bmatrix}$" },
        { sub_id: "(7)", stem: "$\\begin{bmatrix} x_1 & x_2 & x_3 \\end{bmatrix} \\begin{bmatrix} a_{11} & a_{12} & a_{13} \\\\ a_{21} & a_{22} & a_{23} \\\\ a_{31} & a_{32} & a_{33} \\end{bmatrix} \\begin{bmatrix} x_1 \\\\ x_2 \\\\ x_3 \\end{bmatrix}$", answer: "$a_{11}x_1^2 + a_{22}x_2^2 + a_{33}x_3^2 + (a_{12}+a_{21})x_1x_2 + (a_{13}+a_{31})x_1x_3 + (a_{23}+a_{32})x_2x_3$" },
        { sub_id: "(8)", stem: "$\\begin{bmatrix} 1 & 2 & 1 & 0 \\\\ 0 & 1 & 0 & 1 \\\\ 0 & 0 & 2 & 1 \\\\ 0 & 0 & 0 & 3 \\end{bmatrix} \\begin{bmatrix} 1 & 0 & 3 & 1 \\\\ 0 & 1 & 2 & -1 \\\\ 0 & 0 & 1 & 0 \\\\ 0 & 0 & 0 & 1 \\end{bmatrix}$", answer: "$\\begin{bmatrix} 1 & 2 & 8 & -1 \\\\ 0 & 1 & 2 & 0 \\\\ 0 & 0 & 2 & 1 \\\\ 0 & 0 & 0 & 3 \\end{bmatrix}$" }
      ]
    },
    solution: {
      answer: "(1) $\\begin{bmatrix} a^2 & ab & ac \\\\ ba & b^2 & bc \\\\ ca & cb & c^2 \\end{bmatrix}$； (2) $\\begin{bmatrix} a_{11} & a_{12} \\\\ a_{21} & a_{22} \\\\ ka_{11}+a_{31} & ka_{12}+a_{32} \\end{bmatrix}$； (3) $\\begin{bmatrix} 35 \\\\ 6 \\\\ 49 \\end{bmatrix}$； (4) $10$； (5) $\\begin{bmatrix} -2 & 4 \\\\ -1 & 2 \\\\ -3 & 6 \\end{bmatrix}$； (6) $\\begin{bmatrix} 6 & -7 & 8 \\\\ 20 & -5 & -6 \\end{bmatrix}$； (7) $a_{11}x_1^2 + a_{22}x_2^2 + a_{33}x_3^2 + (a_{12}+a_{21})x_1x_2 + (a_{13}+a_{31})x_1x_3 + (a_{23}+a_{32})x_2x_3$； (8) $\\begin{bmatrix} 1 & 2 & 8 & -1 \\\\ 0 & 1 & 2 & 0 \\\\ 0 & 0 & 2 & 1 \\\\ 0 & 0 & 0 & 3 \\end{bmatrix}$。",
      hints: "严格遵循矩阵乘法的维度匹配与行乘列相加法则。注意左乘初等矩阵相当于对右矩阵做初等行变换。",
      steps: "(1) $3\\times 1$ 与 $1\\times 3$ 矩阵相乘，结果为 $3\\times 3$ 矩阵：$\\begin{bmatrix} a^2 & ab & ac \\\\ ba & b^2 & bc \\\\ ca & cb & c^2 \\end{bmatrix}$；\n(2) 左乘初等倍加矩阵，将第 1 行的 $k$ 倍加到第 3 行，得 $\\begin{bmatrix} a_{11} & a_{12} \\\\ a_{21} & a_{22} \\\\ ka_{11}+a_{31} & ka_{12}+a_{32} \\end{bmatrix}$；\n(3) 计算得 $\\begin{bmatrix} 4(7)+3(2)+1(1) \\\\ 1(7)-2(2)+3(1) \\\\ 5(7)+7(2)+0(1) \\end{bmatrix} = \\begin{bmatrix} 35 \\\\ 6 \\\\ 49 \\end{bmatrix}$；\n(4) 内积：$1\\times 3 + 2\\times 2 + 3\\times 1 = 10$；\n(5) 外积：$\\begin{bmatrix} 2(-1) & 2(2) \\\\ 1(-1) & 1(2) \\\\ 3(-1) & 3(2) \\end{bmatrix} = \\begin{bmatrix} -2 & 4 \\\\ -1 & 2 \\\\ -3 & 6 \\end{bmatrix}$；\n(6) 直接按行乘列计算各元素得 $\\begin{bmatrix} 6 & -7 & 8 \\\\ 20 & -5 & -6 \\end{bmatrix}$；\n(7) 展开二次型形式得 $\\sum_{i=1}^3 \\sum_{j=1}^3 a_{ij} x_i x_j = a_{11}x_1^2 + a_{22}x_2^2 + a_{33}x_3^2 + (a_{12}+a_{21})x_1x_2 + (a_{13}+a_{31})x_1x_3 + (a_{23}+a_{32})x_2x_3$；\n(8) 上三角矩阵相乘，结果仍为上三角矩阵，计算对应元素得 $\\begin{bmatrix} 1 & 2 & 8 & -1 \\\\ 0 & 1 & 2 & 0 \\\\ 0 & 0 & 2 & 1 \\\\ 0 & 0 & 0 & 3 \\end{bmatrix}$。"
    }
  },
  {
    id: "LAG-TB-CH02-Q07",
    source_type: "textbook",
    source: {
      paper_id: 2002,
      raw_title: "《线性代数与几何》第2章 矩阵 课后习题",
      clean_title: "《线性代数与几何》第2章 矩阵 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 7 题",
      page_start: 67,
      page_end: 67
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 7,
      paper_q_num: 7,
      type: "calc_proof",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 2,
        chapter_title: "第2章 矩阵",
        section: "2.2",
        section_title: "矩阵的运算",
        section_slug: "2.2_矩阵的运算",
        knowledge_points: ["可交换矩阵", "对角矩阵"]
      }
    },
    content: {
      stem: "(1) 已知 $A = \\begin{bmatrix} 0 & 1 & 0 \\\\ 0 & 0 & 1 \\\\ 0 & 0 & 0 \\end{bmatrix}$，试求与 $A$ 可交换的所有矩阵；\n\n(2) 证明与对角线上元素相异的对角矩阵可交换的矩阵必是对角矩阵。",
      sub_questions: [
        { sub_id: "(1)", stem: "求与 $A$ 可交换的所有矩阵", answer: "$\\begin{bmatrix} a & b & c \\\\ 0 & a & b \\\\ 0 & 0 & a \\end{bmatrix}$（其中 $a, b, c$ 为任意常数）" },
        { sub_id: "(2)", stem: "证明与对角线上元素相异的对角矩阵可交换的矩阵必是对角矩阵", answer: "详见证明步骤" }
      ]
    },
    solution: {
      answer: "(1) $\\begin{bmatrix} a & b & c \\\\ 0 & a & b \\\\ 0 & 0 & a \\end{bmatrix}$（其中 $a, b, c$ 为任意常数）； (2) 证明略（见步骤）。",
      hints: "对于 (1) 设待求矩阵为一般矩阵 $B=(b_{ij})$ 并比较 $AB$ 与 $BA$；对于 (2) 比较对角矩阵与一般矩阵相乘的对应元素 $(\\lambda_i - \\lambda_j)b_{ij} = 0$。",
      steps: "(1) 设 $B = \\begin{bmatrix} b_{11} & b_{12} & b_{13} \\\\ b_{21} & b_{22} & b_{23} \\\\ b_{31} & b_{32} & b_{33} \\end{bmatrix}$。计算可得：\n\n$$AB = \\begin{bmatrix} b_{21} & b_{22} & b_{23} \\\\ b_{31} & b_{32} & b_{33} \\\\ 0 & 0 & 0 \\end{bmatrix}, \\quad BA = \\begin{bmatrix} 0 & b_{11} & b_{12} \\\\ 0 & b_{21} & b_{22} \\\\ 0 & b_{31} & b_{32} \\end{bmatrix}$$\n\n由 $AB = BA$ 比较对应元素：\n$b_{21} = 0, b_{31} = 0, b_{32} = 0$；\n$b_{11} = b_{22} = b_{33}$；\n$b_{12} = b_{23}$。\n记 $b_{11} = a, b_{12} = b, b_{13} = c$，则 $B = \\begin{bmatrix} a & b & c \\\\ 0 & a & b \\\\ 0 & 0 & a \\end{bmatrix}$，其中 $a,b,c$ 为任意常数。\n\n(2) 设 $\\Lambda = \\operatorname{diag}(\\lambda_1, \\lambda_2, \\cdots, \\lambda_n)$，且 $\\lambda_i \\neq \\lambda_j (i \\neq j)$。设矩阵 $B = (b_{ij})$ 满足 $\\Lambda B = B \\Lambda$。\n计算 $\\Lambda B$ 的第 $i$ 行第 $j$ 列元素为 $\\lambda_i b_{ij}$，而 $B \\Lambda$ 的第 $i$ 行第 $j$ 列元素为 $b_{ij} \\lambda_j$。\n因此 $\\lambda_i b_{ij} = b_{ij} \\lambda_j$，即 $(\\lambda_i - \\lambda_j) b_{ij} = 0$。\n当 $i \\neq j$ 时，由于 $\\lambda_i \\neq \\lambda_j$，必有 $b_{ij} = 0$。\n所以 $B$ 的非对角元素全为零，即 $B$ 必是对角矩阵。"
    }
  },
  {
    id: "LAG-TB-CH02-Q08",
    source_type: "textbook",
    source: {
      paper_id: 2002,
      raw_title: "《线性代数与几何》第2章 矩阵 课后习题",
      clean_title: "《线性代数与几何》第2章 矩阵 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 8 题",
      page_start: 67,
      page_end: 67
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 8,
      paper_q_num: 8,
      type: "proof",
      difficulty: 1,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 2,
        chapter_title: "第2章 矩阵",
        section: "2.2",
        section_title: "矩阵的运算",
        section_slug: "2.2_矩阵的运算",
        knowledge_points: ["矩阵乘法非交换性", "乘法公式在矩阵中的适用条件"]
      }
    },
    content: {
      stem: "设 $A = \\begin{bmatrix} 1 & 2 \\\\ 1 & 3 \\end{bmatrix}, B = \\begin{bmatrix} 1 & 0 \\\\ 1 & 2 \\end{bmatrix}$，问：\n\n(1) $AB = BA$ 吗？\n\n(2) $(A+B)^2 = A^2 + 2AB + B^2$ 吗？\n\n(3) $(A+B)(A-B) = A^2 - B^2$ 吗？",
      sub_questions: [
        { sub_id: "(1)", stem: "$AB = BA$ 吗？", answer: "不相等（$AB \\neq BA$）" },
        { sub_id: "(2)", stem: "$(A+B)^2 = A^2 + 2AB + B^2$ 吗？", answer: "不成立" },
        { sub_id: "(3)", stem: "$(A+B)(A-B) = A^2 - B^2$ 吗？", answer: "不成立" }
      ]
    },
    solution: {
      answer: "(1) 不相等； (2) 不成立； (3) 不成立。",
      hints: "直接计算 $AB$ 与 $BA$；注意乘法公式 $(A+B)^2$ 与 $(A+B)(A-B)$ 成立的充要条件均为 $AB = BA$。",
      steps: "(1) 计算乘积：\n\n$$AB = \\begin{bmatrix} 1 & 2 \\\\ 1 & 3 \\end{bmatrix} \\begin{bmatrix} 1 & 0 \\\\ 1 & 2 \\end{bmatrix} = \\begin{bmatrix} 3 & 4 \\\\ 4 & 6 \\end{bmatrix}, \\quad BA = \\begin{bmatrix} 1 & 0 \\\\ 1 & 2 \\end{bmatrix} \\begin{bmatrix} 1 & 2 \\\\ 1 & 3 \\end{bmatrix} = \\begin{bmatrix} 1 & 2 \\\\ 3 & 8 \\end{bmatrix}$$\n\n显然 $AB \\neq BA$。\n\n(2) 展开 $(A+B)^2 = (A+B)(A+B) = A^2 + AB + BA + B^2$。因 $AB \\neq BA$，故 $AB+BA \\neq 2AB$，从而 $(A+B)^2 \\neq A^2 + 2AB + B^2$。\n\n(3) 展开 $(A+B)(A-B) = A^2 - AB + BA - B^2$。因 $AB \\neq BA$，$-AB+BA \\neq \\mathbf{0}$，从而 $(A+B)(A-B) \\neq A^2 - B^2$。"
    }
  },
  {
    id: "LAG-TB-CH02-Q09",
    source_type: "textbook",
    source: {
      paper_id: 2002,
      raw_title: "《线性代数与几何》第2章 矩阵 课后习题",
      clean_title: "《线性代数与几何》第2章 矩阵 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 9 题",
      page_start: 67,
      page_end: 67
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 9,
      paper_q_num: 9,
      type: "proof",
      difficulty: 1,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 2,
        chapter_title: "第2章 矩阵",
        section: "2.2",
        section_title: "矩阵的运算",
        section_slug: "2.2_矩阵的运算",
        knowledge_points: ["矩阵代数性质", "零因子", "幂等矩阵", "消去律失效"]
      }
    },
    content: {
      stem: "举反例说明下列命题是错误的：\n\n(1) 若 $A^2 = \\mathbf{0}$，则 $A = \\mathbf{0}$；\n\n(2) 若 $A^2 = A$，则 $A = \\mathbf{0}$ 或 $A = E$；\n\n(3) 若 $AX = AY$，且 $A \\neq \\mathbf{0}$，则 $X = Y$。",
      sub_questions: [
        { sub_id: "(1)", stem: "举反例：若 $A^2 = \\mathbf{0}$，则 $A = \\mathbf{0}$", answer: "取 $A = \\begin{bmatrix} 1 & 1 \\\\ -1 & -1 \\end{bmatrix} \\neq \\mathbf{0}$，而 $A^2 = \\mathbf{0}$" },
        { sub_id: "(2)", stem: "举反例：若 $A^2 = A$，则 $A = \\mathbf{0}$ 或 $A = E$", answer: "取 $A = \\begin{bmatrix} 1 & 0 \\\\ 0 & 0 \\end{bmatrix}$，有 $A \\neq \\mathbf{0}, A \\neq E$，而 $A^2 = A$" },
        { sub_id: "(3)", stem: "举反例：若 $AX = AY$，且 $A \\neq \\mathbf{0}$，则 $X = Y$", answer: "取 $A = \\begin{bmatrix} 1 & 0 \\\\ 0 & 0 \\end{bmatrix}, X = \\begin{bmatrix} 1 & 0 \\\\ 0 & 0 \\end{bmatrix}, Y = \\begin{bmatrix} 1 & 0 \\\\ 0 & 1 \\end{bmatrix}$，有 $X \\neq Y$ 但 $AX = AY$" }
      ]
    },
    solution: {
      answer: "(1) 取 $A = \\begin{bmatrix} 1 & 1 \\\\ -1 & -1 \\end{bmatrix} \\neq \\mathbf{0}$，而 $A^2 = \\mathbf{0}$；\n(2) 取 $A = \\begin{bmatrix} 1 & 0 \\\\ 0 & 0 \\end{bmatrix}$，有 $A \\neq \\mathbf{0}, A \\neq E$，而 $A^2 = A$；\n(3) 取 $A = \\begin{bmatrix} 1 & 0 \\\\ 0 & 0 \\end{bmatrix}, X = \\begin{bmatrix} 1 & 0 \\\\ 0 & 0 \\end{bmatrix}, Y = \\begin{bmatrix} 1 & 0 \\\\ 0 & 1 \\end{bmatrix}$，有 $X \\neq Y$，但 $AX = AY$。",
      hints: "利用二阶特殊矩阵构造反例：幂零矩阵、投影对角矩阵以及不可逆矩阵的零空间。",
      steps: "(1) 取非零矩阵 $A = \\begin{bmatrix} 1 & 1 \\\\ -1 & -1 \\end{bmatrix}$，计算可得 $A^2 = \\begin{bmatrix} 0 & 0 \\\\ 0 & 0 \\end{bmatrix} = \\mathbf{0}$，说明由 $A^2 = \\mathbf{0}$ 不能推出 $A = \\mathbf{0}$；\n(2) 取对角矩阵 $A = \\begin{bmatrix} 1 & 0 \\\\ 0 & 0 \\end{bmatrix}$，显然 $A \\neq \\mathbf{0}$ 且 $A \\neq E$，但 $A^2 = A$，命题错误；\n(3) 取 $A = \\begin{bmatrix} 1 & 0 \\\\ 0 & 0 \\end{bmatrix} \\neq \\mathbf{0}$，及 $X = \\begin{bmatrix} 1 & 0 \\\\ 0 & 0 \\end{bmatrix}, Y = \\begin{bmatrix} 1 & 0 \\\\ 0 & 1 \\end{bmatrix}$。此时 $X \\neq Y$，但计算得 $AX = \\begin{bmatrix} 1 & 0 \\\\ 0 & 0 \\end{bmatrix}, AY = \\begin{bmatrix} 1 & 0 \\\\ 0 & 0 \\end{bmatrix}$，即 $AX = AY$。因此消去律不成立。"
    }
  },
  {
    id: "LAG-TB-CH02-Q10",
    source_type: "textbook",
    source: {
      paper_id: 2002,
      raw_title: "《线性代数与几何》第2章 矩阵 课后习题",
      clean_title: "《线性代数与几何》第2章 矩阵 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 10 题",
      page_start: 67,
      page_end: 67
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 10,
      paper_q_num: 10,
      type: "proof",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 2,
        chapter_title: "第2章 矩阵",
        section: "2.2",
        section_title: "矩阵的运算",
        section_slug: "2.2_矩阵的运算",
        knowledge_points: ["数学归纳法", "矩阵的高次幂", "若尔当块的幂"]
      }
    },
    content: {
      stem: "用数学归纳法证明：\n\n若 $A = \\begin{bmatrix} \\lambda & 1 & 0 \\\\ 0 & \\lambda & 1 \\\\ 0 & 0 & \\lambda \\end{bmatrix}$，则 $A^n = \\begin{bmatrix} \\lambda^n & n\\lambda^{n-1} & \\frac{n(n-1)}{2}\\lambda^{n-2} \\\\ 0 & \\lambda^n & n\\lambda^{n-1} \\\\ 0 & 0 & \\lambda^n \\end{bmatrix}$。",
      sub_questions: []
    },
    solution: {
      answer: "证明略（见步骤）。",
      hints: "当 $n=1$ 时验证等式成立；假设 $n=k$ 成立，计算 $A^{k+1} = A^k A$ 并利用组合数关系化简第 1 行第 3 列元素。",
      steps: "采用数学归纳法：\n\n1. 当 $n=1$ 时：\n$$\\begin{bmatrix} \\lambda^1 & 1\\cdot\\lambda^0 & \\frac{1(0)}{2}\\lambda^{-1} \\\\ 0 & \\lambda^1 & 1\\cdot\\lambda^0 \\\\ 0 & 0 & \\lambda^1 \\end{bmatrix} = \\begin{bmatrix} \\lambda & 1 & 0 \\\\ 0 & \\lambda & 1 \\\\ 0 & 0 & \\lambda \\end{bmatrix} = A$$\n等式成立。\n\n2. 假设当 $n=k$ 时结论成立，即：\n$$A^k = \\begin{bmatrix} \\lambda^k & k\\lambda^{k-1} & \\frac{k(k-1)}{2}\\lambda^{k-2} \\\\ 0 & \\lambda^k & k\\lambda^{k-1} \\\\ 0 & 0 & \\lambda^k \\end{bmatrix}$$\n\n则当 $n=k+1$ 时：\n$$A^{k+1} = A^k A = \\begin{bmatrix} \\lambda^k & k\\lambda^{k-1} & \\frac{k(k-1)}{2}\\lambda^{k-2} \\\\ 0 & \\lambda^k & k\\lambda^{k-1} \\\\ 0 & 0 & \\lambda^k \\end{bmatrix} \\begin{bmatrix} \\lambda & 1 & 0 \\\\ 0 & \\lambda & 1 \\\\ 0 & 0 & \\lambda \\end{bmatrix}$$\n计算各元素：\n- 第 1 行第 1 列：$\\lambda^k \\cdot \\lambda = \\lambda^{k+1}$；\n- 第 1 行第 2 列：$\\lambda^k \\cdot 1 + k\\lambda^{k-1}\\cdot \\lambda = (k+1)\\lambda^k$；\n- 第 1 行第 3 列：$k\\lambda^{k-1}\\cdot 1 + \\frac{k(k-1)}{2}\\lambda^{k-2}\\cdot \\lambda = \\left(k + \\frac{k(k-1)}{2}\\right)\\lambda^{k-1} = \\frac{k^2+k}{2}\\lambda^{k-1} = \\frac{(k+1)k}{2}\\lambda^{k-1}$；\n- 第 2 行各元素同理得 $0, \\lambda^{k+1}, (k+1)\\lambda^k$；\n- 第 3 行各元素为 $0, 0, \\lambda^{k+1}$。\n\n即：\n$$A^{k+1} = \\begin{bmatrix} \\lambda^{k+1} & (k+1)\\lambda^k & \\frac{(k+1)k}{2}\\lambda^{k-1} \\\\ 0 & \\lambda^{k+1} & (k+1)\\lambda^k \\\\ 0 & 0 & \\lambda^{k+1} \\end{bmatrix}$$\n结论对 $n=k+1$ 亦成立。\n\n由数学归纳法知，原式对所有正整数 $n$ 均成立。"
    }
  },
  {
    id: "LAG-TB-CH02-Q11",
    source_type: "textbook",
    source: {
      paper_id: 2002,
      raw_title: "《线性代数与几何》第2章 矩阵 课后习题",
      clean_title: "《线性代数与几何》第2章 矩阵 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 11 题",
      page_start: 67,
      page_end: 68
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 11,
      paper_q_num: 11,
      type: "calc",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 2,
        chapter_title: "第2章 矩阵",
        section: "2.2",
        section_title: "矩阵的运算",
        section_slug: "2.2_矩阵的运算",
        knowledge_points: ["矩阵的幂", "秩1矩阵的幂", "矩阵平方式"]
      }
    },
    content: {
      stem: "求矩阵的幂：\n\n(1) 已知 $A = \\begin{bmatrix} 1 & 1 & 1 \\\\ 2 & 2 & 2 \\\\ 3 & 3 & 3 \\end{bmatrix}$，求 $A^n$ ($n$ 是正整数)；\n\n(2) 已知 $A = \\begin{bmatrix} 1 & -1 & -1 & -1 \\\\ -1 & 1 & -1 & -1 \\\\ -1 & -1 & 1 & -1 \\\\ -1 & -1 & -1 & 1 \\end{bmatrix}$，求 $A^n$ ($n$ 是正整数)。",
      sub_questions: [
        { sub_id: "(1)", stem: "求 $A^n$", answer: "$A^n = 6^{n-1} \\begin{bmatrix} 1 & 1 & 1 \\\\ 2 & 2 & 2 \\\\ 3 & 3 & 3 \\end{bmatrix}$" },
        { sub_id: "(2)", stem: "求 $A^n$", answer: "当 $n$ 为偶数时，$A^n = 2^n E$；当 $n$ 为奇数时，$A^n = 2^{n-1} A$" }
      ]
    },
    solution: {
      answer: "(1) $A^n = 6^{n-1} \\begin{bmatrix} 1 & 1 & 1 \\\\ 2 & 2 & 2 \\\\ 3 & 3 & 3 \\end{bmatrix}$； (2) 当 $n$ 为偶数时，$A^n = 2^n E$；当 $n$ 为奇数时，$A^n = 2^{n-1} A$。",
      hints: "(1) 注意 $A$ 为秩 1 矩阵，可写成列向量乘行向量形式；(2) 先算 $A^2$ 寻找周期或标量阵关系。",
      steps: "(1) 将 $A$ 分解为列向量与行向量的乘积：\n$$A = \\begin{bmatrix} 1 \\\\ 2 \\\\ 3 \\end{bmatrix} \\begin{bmatrix} 1 & 1 & 1 \\end{bmatrix}$$\n则：\n$$A^2 = \\begin{bmatrix} 1 \\\\ 2 \\\\ 3 \\end{bmatrix} \\left( \\begin{bmatrix} 1 & 1 & 1 \\end{bmatrix} \\begin{bmatrix} 1 \\\\ 2 \\\\ 3 \\end{bmatrix} \\right) \\begin{bmatrix} 1 & 1 & 1 \\end{bmatrix} = 6 A$$\n由此递推可得：\n$$A^n = 6^{n-1} A = 6^{n-1} \\begin{bmatrix} 1 & 1 & 1 \\\\ 2 & 2 & 2 \\\\ 3 & 3 & 3 \\end{bmatrix}$$\n\n(2) 直接计算 $A^2$：\n对角线上各元素为 $1^2 + (-1)^2 + (-1)^2 + (-1)^2 = 4$；\n非对角元素为 $1(-1) + (-1)(1) + (-1)(-1) + (-1)(-1) = -1 - 1 + 1 + 1 = 0$。\n故：\n$$A^2 = 4E = 2^2 E$$\n因此：\n- 当 $n$ 为偶数时，设 $n=2k$，则 $A^n = (A^2)^k = (4E)^k = 4^k E = 2^{2k} E = 2^n E$；\n- 当 $n$ 为奇数时，设 $n=2k+1$，则 $A^n = A^{2k} A = 2^{2k} E A = 2^{n-1} A$。"
    }
  },
  {
    id: "LAG-TB-CH02-Q12",
    source_type: "textbook",
    source: {
      paper_id: 2002,
      raw_title: "《线性代数与几何》第2章 矩阵 课后习题",
      clean_title: "《线性代数与几何》第2章 矩阵 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 12 题",
      page_start: 68,
      page_end: 68
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 12,
      paper_q_num: 12,
      type: "calc_proof",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 2,
        chapter_title: "第2章 矩阵",
        section: "2.2",
        section_title: "矩阵的运算",
        section_slug: "2.2_矩阵的运算",
        knowledge_points: ["矩阵的幂", "递推关系", "数学归纳法"]
      }
    },
    content: {
      stem: "设 $A = \\begin{bmatrix} 1 & 0 & 0 \\\\ 1 & 0 & 1 \\\\ 0 & 1 & 0 \\end{bmatrix}$，\n\n(1) 证明：$A^n = A^{n-2} + A^2 - E$ ($n \\ge 3$)；\n\n(2) 求 $A^{100}$。",
      sub_questions: [
        { sub_id: "(1)", stem: "证明：$A^n = A^{n-2} + A^2 - E$ ($n \\ge 3$)", answer: "证明略（见步骤）" },
        { sub_id: "(2)", stem: "求 $A^{100}$", answer: "$\\begin{bmatrix} 1 & 0 & 0 \\\\ 50 & 1 & 0 \\\\ 50 & 0 & 1 \\end{bmatrix}$" }
      ]
    },
    solution: {
      answer: "(1) 证明略； (2) $\\begin{bmatrix} 1 & 0 & 0 \\\\ 50 & 1 & 0 \\\\ 50 & 0 & 1 \\end{bmatrix}$。",
      hints: "(1) 先验证 $n=3$，再利用 $A(A^2-E) = A^2-E$ 进行归纳；(2) 累加递推式求出 $A^{2m} = E + m(A^2-E)$。",
      steps: "(1) 计算 $A^2$ 与 $A^3$：\n$$A^2 = \\begin{bmatrix} 1 & 0 & 0 \\\\ 1 & 0 & 1 \\\\ 0 & 1 & 0 \\end{bmatrix} \\begin{bmatrix} 1 & 0 & 0 \\\\ 1 & 0 & 1 \\\\ 0 & 1 & 0 \\end{bmatrix} = \\begin{bmatrix} 1 & 0 & 0 \\\\ 1 & 1 & 0 \\\\ 1 & 0 & 1 \\end{bmatrix}$$\n$$A^3 = A^2 A = \\begin{bmatrix} 1 & 0 & 0 \\\\ 1 & 1 & 0 \\\\ 1 & 0 & 1 \\end{bmatrix} \\begin{bmatrix} 1 & 0 & 0 \\\\ 1 & 0 & 1 \\\\ 0 & 1 & 0 \\end{bmatrix} = \\begin{bmatrix} 1 & 0 & 0 \\\\ 2 & 0 & 1 \\\\ 1 & 1 & 0 \\end{bmatrix}$$\n计算 $A^3 - A$：\n$$A^3 - A = \\begin{bmatrix} 0 & 0 & 0 \\\\ 1 & 0 & 0 \\\\ 1 & 0 & 0 \\end{bmatrix} = A^2 - E$$\n故当 $n=3$ 时等式 $A^3 = A + A^2 - E$ 成立。\n又注意 $A(A^2 - E) = \\begin{bmatrix} 1 & 0 & 0 \\\\ 1 & 0 & 1 \\\\ 0 & 1 & 0 \\end{bmatrix} \\begin{bmatrix} 0 & 0 & 0 \\\\ 1 & 0 & 0 \\\\ 1 & 0 & 0 \\end{bmatrix} = \\begin{bmatrix} 0 & 0 & 0 \\\\ 1 & 0 & 0 \\\\ 1 & 0 & 0 \\end{bmatrix} = A^2 - E$。\n对任意 $n \\ge 3$：\n$$A^n - A^{n-2} = A^{n-3}(A^3 - A) = A^{n-3}(A^2 - E) = A^2 - E$$\n即 $A^n = A^{n-2} + A^2 - E$ 成立。\n\n(2) 对偶数幂 $n=2m$：\n$$A^{2m} - A^{2(m-1)} = A^2 - E$$\n累加得：\n$$A^{2m} = A^2 + (m-1)(A^2 - E) = E + m(A^2 - E)$$\n取 $m=50$，则：\n$$A^{100} = E + 50(A^2 - E) = \\begin{bmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & 1 \\end{bmatrix} + 50\\begin{bmatrix} 0 & 0 & 0 \\\\ 1 & 0 & 0 \\\\ 1 & 0 & 0 \\end{bmatrix} = \\begin{bmatrix} 1 & 0 & 0 \\\\ 50 & 1 & 0 \\\\ 50 & 0 & 1 \\end{bmatrix}$$"
    }
  },
  {
    id: "LAG-TB-CH02-Q13",
    source_type: "textbook",
    source: {
      paper_id: 2002,
      raw_title: "《线性代数与几何》第2章 矩阵 课后习题",
      clean_title: "《线性代数与几何》第2章 矩阵 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 13 题",
      page_start: 68,
      page_end: 68
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 13,
      paper_q_num: 13,
      type: "proof",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 2,
        chapter_title: "第2章 矩阵",
        section: "2.2",
        section_title: "矩阵的运算",
        section_slug: "2.2_矩阵的运算",
        knowledge_points: ["对称矩阵", "反对称矩阵", "矩阵转置性质"]
      }
    },
    content: {
      stem: "$A$ 为 $n$ 阶对称矩阵，$B$ 为 $n$ 阶反对称矩阵，证明：\n\n(1) $B^2$ 为对称矩阵；\n\n(2) $AB - BA$ 为对称矩阵，$AB + BA$ 为反对称矩阵。",
      sub_questions: [
        { sub_id: "(1)", stem: "证明 $B^2$ 为对称矩阵", answer: "详见证明步骤" },
        { sub_id: "(2)", stem: "证明 $AB - BA$ 为对称矩阵，$AB + BA$ 为反对称矩阵", answer: "详见证明步骤" }
      ]
    },
    solution: {
      answer: "证明略（见步骤）。",
      hints: "利用定义验证转置：对称矩阵满足 $M^{\\mathrm{T}} = M$，反对称矩阵满足 $M^{\\mathrm{T}} = -M$。已知 $A^{\\mathrm{T}} = A, B^{\\mathrm{T}} = -B$。",
      steps: "已知 $A^{\\mathrm{T}} = A$，$B^{\\mathrm{T}} = -B$。\n\n(1) 对 $B^2$ 取转置：\n$$(B^2)^{\\mathrm{T}} = (B \\cdot B)^{\\mathrm{T}} = B^{\\mathrm{T}} B^{\\mathrm{T}} = (-B)(-B) = B^2$$\n故 $B^2$ 为对称矩阵。\n\n(2) 对 $AB - BA$ 取转置：\n$$(AB - BA)^{\\mathrm{T}} = (AB)^{\\mathrm{T}} - (BA)^{\\mathrm{T}} = B^{\\mathrm{T}} A^{\\mathrm{T}} - A^{\\mathrm{T}} B^{\\mathrm{T}} = (-B)A - A(-B) = -BA + AB = AB - BA$$\n故 $AB - BA$ 为对称矩阵。\n\n对 $AB + BA$ 取转置：\n$$(AB + BA)^{\\mathrm{T}} = (AB)^{\\mathrm{T}} + (BA)^{\\mathrm{T}} = B^{\\mathrm{T}} A^{\\mathrm{T}} + A^{\\mathrm{T}} B^{\\mathrm{T}} = (-B)A + A(-B) = -(BA + AB) = -(AB + BA)$$\n故 $AB + BA$ 为反对称矩阵。"
    }
  },
  {
    id: "LAG-TB-CH02-Q14",
    source_type: "textbook",
    source: {
      paper_id: 2002,
      raw_title: "《线性代数与几何》第2章 矩阵 课后习题",
      clean_title: "《线性代数与几何》第2章 矩阵 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 14 题",
      page_start: 68,
      page_end: 68
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 14,
      paper_q_num: 14,
      type: "calc",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 2,
        chapter_title: "第2章 矩阵",
        section: "2.3",
        section_title: "逆矩阵",
        section_slug: "2.3_逆矩阵",
        knowledge_points: ["逆矩阵的计算", "初等行变换法", "伴随矩阵法"]
      }
    },
    content: {
      stem: "求下列矩阵的逆矩阵：\n\n(1) $\\begin{bmatrix} 1 & 2 & -3 \\\\ 0 & 1 & 2 \\\\ 0 & 0 & 1 \\end{bmatrix}$；\n\n(2) $\\begin{bmatrix} 1 & 0 & 4 \\\\ 2 & 2 & 7 \\\\ 0 & 1 & -2 \\end{bmatrix}$；\n\n(3) $\\begin{bmatrix} -11 & 2 & 2 \\\\ -4 & 0 & 1 \\\\ 6 & -1 & -1 \\end{bmatrix}$；\n\n(4) $\\begin{bmatrix} 1 & 1 & 1 & 1 \\\\ 1 & 1 & -1 & -1 \\\\ 1 & -1 & 1 & -1 \\\\ 1 & -1 & -1 & 1 \\end{bmatrix}$。",
      sub_questions: [
        { sub_id: "(1)", stem: "$\\begin{bmatrix} 1 & 2 & -3 \\\\ 0 & 1 & 2 \\\\ 0 & 0 & 1 \\end{bmatrix}^{-1}$", answer: "$\\begin{bmatrix} 1 & -2 & 7 \\\\ 0 & 1 & -2 \\\\ 0 & 0 & 1 \\end{bmatrix}$" },
        { sub_id: "(2)", stem: "$\\begin{bmatrix} 1 & 0 & 4 \\\\ 2 & 2 & 7 \\\\ 0 & 1 & -2 \\end{bmatrix}^{-1}$", answer: "$-\\frac{1}{3} \\begin{bmatrix} -11 & 4 & -8 \\\\ 4 & -2 & 1 \\\\ 2 & -1 & 2 \\end{bmatrix}$" },
        { sub_id: "(3)", stem: "$\\begin{bmatrix} -11 & 2 & 2 \\\\ -4 & 0 & 1 \\\\ 6 & -1 & -1 \\end{bmatrix}^{-1}$", answer: "$\\begin{bmatrix} 1 & 0 & 2 \\\\ 2 & -1 & 3 \\\\ 4 & 1 & 8 \\end{bmatrix}$" },
        { sub_id: "(4)", stem: "$\\begin{bmatrix} 1 & 1 & 1 & 1 \\\\ 1 & 1 & -1 & -1 \\\\ 1 & -1 & 1 & -1 \\\\ 1 & -1 & -1 & 1 \\end{bmatrix}^{-1}$", answer: "$\\frac{1}{4} \\begin{bmatrix} 1 & 1 & 1 & 1 \\\\ 1 & 1 & -1 & -1 \\\\ 1 & -1 & 1 & -1 \\\\ 1 & -1 & -1 & 1 \\end{bmatrix}$" }
      ]
    },
    solution: {
      answer: "(1) $\\begin{bmatrix} 1 & -2 & 7 \\\\ 0 & 1 & -2 \\\\ 0 & 0 & 1 \\end{bmatrix}$； (2) $-\\frac{1}{3} \\begin{bmatrix} -11 & 4 & -8 \\\\ 4 & -2 & 1 \\\\ 2 & -1 & 2 \\end{bmatrix}$； (3) $\\begin{bmatrix} 1 & 0 & 2 \\\\ 2 & -1 & 3 \\\\ 4 & 1 & 8 \\end{bmatrix}$； (4) $\\frac{1}{4} \\begin{bmatrix} 1 & 1 & 1 & 1 \\\\ 1 & 1 & -1 & -1 \\\\ 1 & -1 & 1 & -1 \\\\ 1 & -1 & -1 & 1 \\end{bmatrix}$。",
      hints: "使用伴随矩阵法 $A^{-1} = \\frac{1}{|A|}A^*$ 或初等行变换法 $(A|E) \\to (E|A^{-1})$。对于 (4) 可先检验 $A^2$。",
      steps: "(1) 对上三角阵可用初等行变换消去副对角线以上元素，或求伴随矩阵得：\n$$A^{-1} = \\begin{bmatrix} 1 & -2 & 7 \\\\ 0 & 1 & -2 \\\\ 0 & 0 & 1 \\end{bmatrix}$$\n\n(2) 计算行列式 $|A| = 1(-4-7) + 4(2-0) = -11+8 = -3 \\neq 0$。计算伴随矩阵各代数余子式得：\n$$A^{-1} = -\\frac{1}{3} \\begin{bmatrix} -11 & 4 & -8 \\\\ 4 & -2 & 1 \\\\ 2 & -1 & 2 \\end{bmatrix}$$\n\n(3) 计算行列式 $|A| = 1 \\neq 0$。由 $(A|E) \\to (E|A^{-1})$ 得：\n$$A^{-1} = \\begin{bmatrix} 1 & 0 & 2 \\\\ 2 & -1 & 3 \\\\ 4 & 1 & 8 \\end{bmatrix}$$\n\n(4) 矩阵各行两两正交且模方均为 4，计算知 $A^2 = 4E$。两边同除以 4 得 $A \\left(\\frac{1}{4}A\\right) = E$。故：\n$$A^{-1} = \\frac{1}{4}A = \\frac{1}{4} \\begin{bmatrix} 1 & 1 & 1 & 1 \\\\ 1 & 1 & -1 & -1 \\\\ 1 & -1 & 1 & -1 \\\\ 1 & -1 & -1 & 1 \\end{bmatrix}$$"
    }
  }
];
