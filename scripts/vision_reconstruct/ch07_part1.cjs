module.exports = [
  {
    id: "LAG-TB-CH07-Q01",
    source_type: "textbook",
    source: {
      paper_id: 2007,
      raw_title: "《线性代数与几何》第7章 二次型 课后习题",
      clean_title: "《线性代数与几何》第7章 二次型 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 1 题",
      page_start: 180,
      page_end: 180
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 1,
      paper_q_num: 1,
      type: "calc",
      difficulty: 1,
      score: 5
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.1",
        section_title: "标准正交基",
        section_slug: "7.1_标准正交基",
        knowledge_points: ["向量内积", "内积计算"]
      }
    },
    content: {
      stem: "计算 $(\\pmb{\\alpha}, \\pmb{\\beta})$：\n\n(1) $\\pmb{\\alpha} = (-1, 0, 3, -5), \\pmb{\\beta} = (4, -2, 0, 1)$；\n\n(2) $\\pmb{\\alpha} = (\\sqrt{3}, -1, 0, -4), \\pmb{\\beta} = (-\\sqrt{3}, 1, 5, -2)$。",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "$\\pmb{\\alpha} = (-1, 0, 3, -5), \\pmb{\\beta} = (4, -2, 0, 1)$",
          answer: "$-9$"
        },
        {
          sub_id: "(2)",
          stem: "$\\pmb{\\alpha} = (\\sqrt{3}, -1, 0, -4), \\pmb{\\beta} = (-\\sqrt{3}, 1, 5, -2)$",
          answer: "$4$"
        }
      ]
    },
    solution: {
      answer: "(1) $-9$；(2) $4$。",
      hints: "根据向量内积的定义 $(\\pmb{\\alpha}, \\pmb{\\beta}) = \\sum_{i=1}^n a_i b_i$ 进行对应分量乘积的求和计算。",
      steps: "(1) $(\\pmb{\\alpha}, \\pmb{\\beta}) = (-1) \\times 4 + 0 \\times (-2) + 3 \\times 0 + (-5) \\times 1 = -4 + 0 + 0 - 5 = -9$；\n\n(2) $(\\pmb{\\alpha}, \\pmb{\\beta}) = \\sqrt{3} \\times (-\\sqrt{3}) + (-1) \\times 1 + 0 \\times 5 + (-4) \\times (-2) = -3 - 1 + 0 + 8 = 4$。"
    }
  },
  {
    id: "LAG-TB-CH07-Q02",
    source_type: "textbook",
    source: {
      paper_id: 2007,
      raw_title: "《线性代数与几何》第7章 二次型 课后习题",
      clean_title: "《线性代数与几何》第7章 二次型 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 2 题",
      page_start: 180,
      page_end: 180
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 2,
      paper_q_num: 2,
      type: "calc",
      difficulty: 1,
      score: 5
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.1",
        section_title: "标准正交基",
        section_slug: "7.1_标准正交基",
        knowledge_points: ["向量内积性质", "内积的线性性质"]
      }
    },
    content: {
      stem: "设 $\\pmb{\\alpha} = (-1, 1, 2), \\pmb{\\beta} = (4, -2, -1)$，求 $\\left((\\pmb{\\alpha}, \\pmb{\\alpha})\\pmb{\\beta} - \\frac{1}{2}(\\pmb{\\alpha}, \\pmb{\\beta})\\pmb{\\alpha}, 6\\pmb{\\alpha}\\right)$。"
    },
    solution: {
      answer: "$-144$。",
      hints: "先利用内积的双线性性质展开，或先分别计算标量内积 $(\\pmb{\\alpha}, \\pmb{\\alpha})$ 与 $(\\pmb{\\alpha}, \\pmb{\\beta})$，再代入计算。",
      steps: "首先计算基本内积：\n$$(\\pmb{\\alpha}, \\pmb{\\alpha}) = (-1)^2 + 1^2 + 2^2 = 6$$\n$$(\\pmb{\\alpha}, \\pmb{\\beta}) = (-1) \\times 4 + 1 \\times (-2) + 2 \\times (-1) = -4 - 2 - 2 = -8$$\n由内积的性质，所求内积展开为：\n$$\\left((\\pmb{\\alpha}, \\pmb{\\alpha})\\pmb{\\beta} - \\frac{1}{2}(\\pmb{\\alpha}, \\pmb{\\beta})\\pmb{\\alpha}, 6\\pmb{\\alpha}\\right) = 6(\\pmb{\\alpha}, \\pmb{\\alpha})(\\pmb{\\beta}, \\pmb{\\alpha}) - 3(\\pmb{\\alpha}, \\pmb{\\beta})(\\pmb{\\alpha}, \\pmb{\\alpha})$$\n$$= 3(\\pmb{\\alpha}, \\pmb{\\alpha})(\\pmb{\\alpha}, \\pmb{\\beta}) = 3 \\times 6 \\times (-8) = -144$$。"
    }
  },
  {
    id: "LAG-TB-CH07-Q03",
    source_type: "textbook",
    source: {
      paper_id: 2007,
      raw_title: "《线性代数与几何》第7章 二次型 课后习题",
      clean_title: "《线性代数与几何》第7章 二次型 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 3 题",
      page_start: 180,
      page_end: 180
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
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.1",
        section_title: "标准正交基",
        section_slug: "7.1_标准正交基",
        knowledge_points: ["单位向量", "向量长度与范数"]
      }
    },
    content: {
      stem: "求参数 $k$，使得 $\\pmb{\\alpha} = \\left(\\frac{1}{3}k, \\frac{1}{2}k, k\\right)$ 是单位向量。"
    },
    solution: {
      answer: "$k = \\pm \\frac{6}{7}$。",
      hints: "单位向量的长度为 1，即满足 $\\|\\pmb{\\alpha}\\|^2 = (\\pmb{\\alpha}, \\pmb{\\alpha}) = 1$。",
      steps: "由单位向量的定义可知：\n$$\\|\\pmb{\\alpha}\\|^2 = \\left(\\frac{1}{3}k\\right)^2 + \\left(\\frac{1}{2}k\\right)^2 + k^2 = k^2 \\left(\\frac{1}{9} + \\frac{1}{4} + 1\\right) = k^2 \\left(\\frac{4+9+36}{36}\\right) = \\frac{49}{36}k^2 = 1$$\n解得 $k^2 = \\frac{36}{49}$，即 $k = \\pm \\frac{6}{7}$。"
    }
  },
  {
    id: "LAG-TB-CH07-Q04",
    source_type: "textbook",
    source: {
      paper_id: 2007,
      raw_title: "《线性代数与几何》第7章 二次型 课后习题",
      clean_title: "《线性代数与几何》第7章 二次型 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 4 题",
      page_start: 180,
      page_end: 180
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 4,
      paper_q_num: 4,
      type: "proof",
      difficulty: 1,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.1",
        section_title: "标准正交基",
        section_slug: "7.1_标准正交基",
        knowledge_points: ["平行四边形恒等式", "向量长度与内积"]
      }
    },
    content: {
      stem: "设 $\\pmb{\\alpha}$ 和 $\\pmb{\\beta}$ 是两个 $n$ 维向量，求证：\n\n$$\\|\\pmb{\\alpha} + \\pmb{\\beta}\\|^2 + \\|\\pmb{\\alpha} - \\pmb{\\beta}\\|^2 = 2\\|\\pmb{\\alpha}\\|^2 + 2\\|\\pmb{\\beta}\\|^2。$$"
    },
    solution: {
      answer: "证明略。",
      hints: "利用向量范数与内积的定义 $\\|\\pmb{x}\\|^2 = (\\pmb{x}, \\pmb{x})$ 展开求解。",
      steps: "根据向量范数的定义与内积的双线性性质：\n$$\\|\\pmb{\\alpha} + \\pmb{\\beta}\\|^2 = (\\pmb{\\alpha} + \\pmb{\\beta}, \\pmb{\\alpha} + \\pmb{\\beta}) = (\\pmb{\\alpha}, \\pmb{\\alpha}) + 2(\\pmb{\\alpha}, \\pmb{\\beta}) + (\\pmb{\\beta}, \\pmb{\\beta}) = \\|\\pmb{\\alpha}\\|^2 + 2(\\pmb{\\alpha}, \\pmb{\\beta}) + \\|\\pmb{\\beta}\\|^2$$\n$$\\|\\pmb{\\alpha} - \\pmb{\\beta}\\|^2 = (\\pmb{\\alpha} - \\pmb{\\beta}, \\pmb{\\alpha} - \\pmb{\\beta}) = (\\pmb{\\alpha}, \\pmb{\\alpha}) - 2(\\pmb{\\alpha}, \\pmb{\\beta}) + (\\pmb{\\beta}, \\pmb{\\beta}) = \\|\\pmb{\\alpha}\\|^2 - 2(\\pmb{\\alpha}, \\pmb{\\beta}) + \\|\\pmb{\\beta}\\|^2$$\n将上述两式左右两边分别相加，交叉项 $2(\\pmb{\\alpha}, \\pmb{\\beta})$ 与 $-2(\\pmb{\\alpha}, \\pmb{\\beta})$ 相互抵消，得：\n$$\\|\\pmb{\\alpha} + \\pmb{\\beta}\\|^2 + \\|\\pmb{\\alpha} - \\pmb{\\beta}\\|^2 = 2\\|\\pmb{\\alpha}\\|^2 + 2\\|\\pmb{\\beta}\\|^2$$\n命题得证（该结论在几何上即为平行四边形四条边的平方和等于两条对角线的平方和）。"
    }
  },
  {
    id: "LAG-TB-CH07-Q05",
    source_type: "textbook",
    source: {
      paper_id: 2007,
      raw_title: "《线性代数与几何》第7章 二次型 课后习题",
      clean_title: "《线性代数与几何》第7章 二次型 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 5 题",
      page_start: 180,
      page_end: 180
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
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.1",
        section_title: "标准正交基",
        section_slug: "7.1_标准正交基",
        knowledge_points: ["向量正交", "正交补空间", "齐次线性方程组"]
      }
    },
    content: {
      stem: "(1) 在 $\\mathbb{R}^3$ 中求出所有与 $\\pmb{\\alpha} = (1, -1, 0)$ 正交的向量；\n\n(2) 在 $\\mathbb{R}^3$ 中求出所有与 $\\pmb{\\alpha} = (1, -1, 1), \\pmb{\\beta} = (-1, 1, 1)$ 都正交的向量。",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "在 $\\mathbb{R}^3$ 中求出所有与 $\\pmb{\\alpha} = (1, -1, 0)$ 正交的向量",
          answer: "$k_1(1, 1, 0) + k_2(0, 0, 1)$，$k_1, k_2$ 为任意实数"
        },
        {
          sub_id: "(2)",
          stem: "在 $\\mathbb{R}^3$ 中求出所有与 $\\pmb{\\alpha} = (1, -1, 1), \\pmb{\\beta} = (-1, 1, 1)$ 都正交的向量",
          answer: "$k(1, 1, 0)$，$k$ 为任意实数"
        }
      ]
    },
    solution: {
      answer: "(1) $k_1(1, 1, 0) + k_2(0, 0, 1)$，$k_1, k_2$ 为任意实数；\n(2) $k(1, 1, 0)$，$k$ 为任意实数。",
      hints: "设所求向量为 $\\pmb{x} = (x_1, x_2, x_3)$，由内积为零建立齐次线性方程组求解基础解系。",
      steps: "设所求向量为 $\\pmb{x} = (x_1, x_2, x_3)$。\n\n(1) 由 $(\\pmb{\\alpha}, \\pmb{x}) = 0$，得方程 $x_1 - x_2 = 0$。自由未知量为 $x_2, x_3$，取基础解系 $\\pmb{\\xi}_1 = (1, 1, 0), \\pmb{\\xi}_2 = (0, 0, 1)$，故所有与 $\\pmb{\\alpha}$ 正交的向量为 $k_1(1, 1, 0) + k_2(0, 0, 1)$，其中 $k_1, k_2$ 为任意实数。\n\n(2) 由 $(\\pmb{\\alpha}, \\pmb{x}) = 0$ 和 $(\\pmb{\\beta}, \\pmb{x}) = 0$，得方程组：\n$$\\begin{cases} x_1 - x_2 + x_3 = 0 \\\\ -x_1 + x_2 + x_3 = 0 \\end{cases}$$\n两式相加得 $2x_3 = 0 \\implies x_3 = 0$，进而 $x_1 = x_2$。取基础解系 $\\pmb{\\xi} = (1, 1, 0)$，故所有与 $\\pmb{\\alpha}, \\pmb{\\beta}$ 都正交的向量为 $k(1, 1, 0)$，其中 $k$ 为任意实数。"
    }
  },
  {
    id: "LAG-TB-CH07-Q06",
    source_type: "textbook",
    source: {
      paper_id: 2007,
      raw_title: "《线性代数与几何》第7章 二次型 课后习题",
      clean_title: "《线性代数与几何》第7章 二次型 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 6 题",
      page_start: 180,
      page_end: 180
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 6,
      paper_q_num: 6,
      type: "calc",
      difficulty: 2,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.1",
        section_title: "标准正交基",
        section_slug: "7.1_标准正交基",
        knowledge_points: ["单位向量", "向量正交", "正交方程组求解"]
      }
    },
    content: {
      stem: "在 $\\mathbb{R}^4$ 中求一个单位向量 $\\pmb{\\beta}$，使它与以下三个向量都正交：\n\n$$\\pmb{\\alpha}_1 = (1, 1, -1, 1), \\quad \\pmb{\\alpha}_2 = (1, -1, -1, 1), \\quad \\pmb{\\alpha}_3 = (2, 1, 1, 3)。$$"
    },
    solution: {
      answer: "$\\pmb{\\beta} = \\pm \\frac{1}{\\sqrt{26}}(-4, 0, -1, 3)$。",
      hints: "设 $\\pmb{\\beta} = (x_1, x_2, x_3, x_4)$，列出齐次线性方程组求出非零解向量，再将其单位化。",
      steps: "设 $\\pmb{x} = (x_1, x_2, x_3, x_4)$ 与 $\\pmb{\\alpha}_1, \\pmb{\\alpha}_2, \\pmb{\\alpha}_3$ 都正交，则满足方程组：\n$$\\begin{cases} x_1 + x_2 - x_3 + x_4 = 0 \\\\ x_1 - x_2 - x_3 + x_4 = 0 \\\\ 2x_1 + x_2 + x_3 + 3x_4 = 0 \\end{cases}$$\n第 1 式减去第 2 式得 $2x_2 = 0 \\implies x_2 = 0$。\n代入第 1 式得 $x_3 = x_1 + x_4$。\n将 $x_2=0, x_3=x_1+x_4$ 代入第 3 式得 $2x_1 + (x_1 + x_4) + 3x_4 = 3x_1 + 4x_4 = 0$。\n取 $x_4 = 3$，则 $x_1 = -4, x_3 = -4 + 3 = -1, x_2 = 0$，得基础解系 $\\pmb{\\xi} = (-4, 0, -1, 3)$。\n计算其范数：$\\|\\pmb{\\xi}\\| = \\sqrt{(-4)^2 + 0^2 + (-1)^2 + 3^2} = \\sqrt{16 + 1 + 9} = \\sqrt{26}$。\n单位化即得 $\\pmb{\\beta} = \\pm \\frac{1}{\\sqrt{26}}(-4, 0, -1, 3)$。"
    }
  },
  {
    id: "LAG-TB-CH07-Q07",
    source_type: "textbook",
    source: {
      paper_id: 2007,
      raw_title: "《线性代数与几何》第7章 二次型 课后习题",
      clean_title: "《线性代数与几何》第7章 二次型 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 7 题",
      page_start: 180,
      page_end: 180
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 7,
      paper_q_num: 7,
      type: "calc",
      difficulty: 2,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.1",
        section_title: "标准正交基",
        section_slug: "7.1_标准正交基",
        knowledge_points: ["向量组线性相关性", "行列式判别法", "空间向量正交"]
      }
    },
    content: {
      stem: "已知在 $\\mathbb{R}^3$ 中有某个非零向量同时垂直于以下三个向量，求 $\\lambda$ 的值：\n\n$$\\pmb{\\alpha}_1 = (1, 0, 2), \\quad \\pmb{\\alpha}_2 = (-1, 1, -3), \\quad \\pmb{\\alpha}_3 = (2, -1, \\lambda)。$$"
    },
    solution: {
      answer: "$\\lambda = 5$。",
      hints: "若在 $\\mathbb{R}^3$ 中存在非零向量同时垂直于三个向量，则由其内积构成的齐次线性方程组有非零解，系数行列式必须为零。",
      steps: "设该非零向量为 $\\pmb{x} = (x_1, x_2, x_3)^\\mathrm{T}$，则满足齐次线性方程组：\n$$\\begin{cases} x_1 + 2x_3 = 0 \\\\ -x_1 + x_2 - 3x_3 = 0 \\\\ 2x_1 - x_2 + \\lambda x_3 = 0 \\end{cases}$$\n由于存在非零解 $\\pmb{x} \\neq \\pmb{0}$，故系数行列式必为零：\n$$D = \\begin{vmatrix} 1 & 0 & 2 \\\\ -1 & 1 & -3 \\\\ 2 & -1 & \\lambda \\end{vmatrix} = 1 \\cdot (\\lambda - 3) + 2(1 - 2) = \\lambda - 3 - 2 = \\lambda - 5 = 0$$\n解得 $\\lambda = 5$。"
    }
  },
  {
    id: "LAG-TB-CH07-Q08",
    source_type: "textbook",
    source: {
      paper_id: 2007,
      raw_title: "《线性代数与几何》第7章 二次型 课后习题",
      clean_title: "《线性代数与几何》第7章 二次型 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 8 题",
      page_start: 180,
      page_end: 180
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 8,
      paper_q_num: 8,
      type: "calc",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.1",
        section_title: "标准正交基",
        section_slug: "7.1_标准正交基",
        knowledge_points: ["施密特正交化", "向量单位化", "标准正交基"]
      }
    },
    content: {
      stem: "将下列向量组正交规范化：\n\n(1) $\\pmb{\\alpha}_1 = (1, 1)^\\mathrm{T}, \\pmb{\\alpha}_2 = (2, 0)^\\mathrm{T}$；\n\n(2) $\\pmb{\\alpha}_1 = (1, 1, 1)^\\mathrm{T}, \\pmb{\\alpha}_2 = (1, 2, 3)^\\mathrm{T}, \\pmb{\\alpha}_3 = (1, 4, 9)^\\mathrm{T}$；\n\n(3) $\\pmb{\\alpha}_1 = (0, 1, 1, 1)^\\mathrm{T}, \\pmb{\\alpha}_2 = (1, 0, 1, 1)^\\mathrm{T}, \\pmb{\\alpha}_3 = (1, 1, 0, 1)^\\mathrm{T}$。",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "$\\pmb{\\alpha}_1 = (1, 1)^\\mathrm{T}, \\pmb{\\alpha}_2 = (2, 0)^\\mathrm{T}$",
          answer: "$\\pmb{e}_1 = \\frac{1}{\\sqrt{2}}(1, 1)^\\mathrm{T}, \\pmb{e}_2 = \\frac{1}{\\sqrt{2}}(1, -1)^\\mathrm{T}$"
        },
        {
          sub_id: "(2)",
          stem: "$\\pmb{\\alpha}_1 = (1, 1, 1)^\\mathrm{T}, \\pmb{\\alpha}_2 = (1, 2, 3)^\\mathrm{T}, \\pmb{\\alpha}_3 = (1, 4, 9)^\\mathrm{T}$",
          answer: "$\\pmb{e}_1 = \\frac{1}{\\sqrt{3}}(1, 1, 1)^\\mathrm{T}, \\pmb{e}_2 = \\frac{1}{\\sqrt{2}}(-1, 0, 1)^\\mathrm{T}, \\pmb{e}_3 = \\frac{1}{\\sqrt{6}}(1, -2, 1)^\\mathrm{T}$"
        },
        {
          sub_id: "(3)",
          stem: "$\\pmb{\\alpha}_1 = (0, 1, 1, 1)^\\mathrm{T}, \\pmb{\\alpha}_2 = (1, 0, 1, 1)^\\mathrm{T}, \\pmb{\\alpha}_3 = (1, 1, 0, 1)^\\mathrm{T}$",
          answer: "$\\pmb{e}_1 = \\frac{1}{\\sqrt{3}}(0, 1, 1, 1)^\\mathrm{T}, \\pmb{e}_2 = \\frac{1}{\\sqrt{15}}(3, -2, 1, 1)^\\mathrm{T}, \\pmb{e}_3 = \\frac{1}{\\sqrt{35}}(3, 3, -4, 1)^\\mathrm{T}$"
        }
      ]
    },
    solution: {
      answer: "(1) $\\pmb{e}_1 = \\frac{1}{\\sqrt{2}}(1, 1)^\\mathrm{T}, \\pmb{e}_2 = \\frac{1}{\\sqrt{2}}(1, -1)^\\mathrm{T}$；\n(2) $\\pmb{e}_1 = \\frac{1}{\\sqrt{3}}(1, 1, 1)^\\mathrm{T}, \\pmb{e}_2 = \\frac{1}{\\sqrt{2}}(-1, 0, 1)^\\mathrm{T}, \\pmb{e}_3 = \\frac{1}{\\sqrt{6}}(1, -2, 1)^\\mathrm{T}$；\n(3) $\\pmb{e}_1 = \\frac{1}{\\sqrt{3}}(0, 1, 1, 1)^\\mathrm{T}, \\pmb{e}_2 = \\frac{1}{\\sqrt{15}}(3, -2, 1, 1)^\\mathrm{T}, \\pmb{e}_3 = \\frac{1}{\\sqrt{35}}(3, 3, -4, 1)^\\mathrm{T}$。",
      hints: "使用施密特（Gram-Schmidt）正交化方法依次构造两两正交的向量 $\\pmb{\\beta}_i$，再分别单位化得 $\\pmb{e}_i = \\frac{\\pmb{\\beta}_i}{\\|\\pmb{\\beta}_i\\|}$。",
      steps: "(1) 取 $\\pmb{\\beta}_1 = \\pmb{\\alpha}_1 = (1, 1)^\\mathrm{T}$。\n$$\\pmb{\\beta}_2 = \\pmb{\\alpha}_2 - \\frac{(\\pmb{\\alpha}_2, \\pmb{\\beta}_1)}{(\\pmb{\\beta}_1, \\pmb{\\beta}_1)}\\pmb{\\beta}_1 = (2, 0)^\\mathrm{T} - \\frac{2}{2}(1, 1)^\\mathrm{T} = (1, -1)^\\mathrm{T}$$\n单位化得 $\\pmb{e}_1 = \\frac{1}{\\sqrt{2}}(1, 1)^\\mathrm{T}, \\pmb{e}_2 = \\frac{1}{\\sqrt{2}}(1, -1)^\\mathrm{T}$。\n\n(2) 取 $\\pmb{\\beta}_1 = \\pmb{\\alpha}_1 = (1, 1, 1)^\\mathrm{T}$。\n$$\\pmb{\\beta}_2 = \\pmb{\\alpha}_2 - \\frac{(\\pmb{\\alpha}_2, \\pmb{\\beta}_1)}{(\\pmb{\\beta}_1, \\pmb{\\beta}_1)}\\pmb{\\beta}_1 = (1, 2, 3)^\\mathrm{T} - \\frac{6}{3}(1, 1, 1)^\\mathrm{T} = (-1, 0, 1)^\\mathrm{T}$$\n$$\\pmb{\\beta}_3 = \\pmb{\\alpha}_3 - \\frac{(\\pmb{\\alpha}_3, \\pmb{\\beta}_1)}{(\\pmb{\\beta}_1, \\pmb{\\beta}_1)}\\pmb{\\beta}_1 - \\frac{(\\pmb{\\alpha}_3, \\pmb{\\beta}_2)}{(\\pmb{\\beta}_2, \\pmb{\\beta}_2)}\\pmb{\\beta}_2 = (1, 4, 9)^\\mathrm{T} - \\frac{14}{3}(1, 1, 1)^\\mathrm{T} - \\frac{8}{2}(-1, 0, 1)^\\mathrm{T} = \\left(\\frac{1}{3}, -\\frac{2}{3}, \\frac{1}{3}\\right)^\\mathrm{T}$$\n可取同向向量 $(1, -2, 1)^\\mathrm{T}$。\n单位化得：$\\pmb{e}_1 = \\frac{1}{\\sqrt{3}}(1, 1, 1)^\\mathrm{T}, \\pmb{e}_2 = \\frac{1}{\\sqrt{2}}(-1, 0, 1)^\\mathrm{T}, \\pmb{e}_3 = \\frac{1}{\\sqrt{6}}(1, -2, 1)^\\mathrm{T}$。\n\n(3) 取 $\\pmb{\\beta}_1 = \\pmb{\\alpha}_1 = (0, 1, 1, 1)^\\mathrm{T}$。\n$$\\pmb{\\beta}_2 = \\pmb{\\alpha}_2 - \\frac{(\\pmb{\\alpha}_2, \\pmb{\\beta}_1)}{(\\pmb{\\beta}_1, \\pmb{\\beta}_1)}\\pmb{\\beta}_1 = (1, 0, 1, 1)^\\mathrm{T} - \\frac{2}{3}(0, 1, 1, 1)^\\mathrm{T} = \\left(1, -\\frac{2}{3}, \\frac{1}{3}, \\frac{1}{3}\\right)^\\mathrm{T}$$\n取同向倍数 $(3, -2, 1, 1)^\\mathrm{T}$。\n$$\\pmb{\\beta}_3 = \\pmb{\\alpha}_3 - \\frac{(\\pmb{\\alpha}_3, \\pmb{\\beta}_1)}{(\\pmb{\\beta}_1, \\pmb{\\beta}_1)}\\pmb{\\beta}_1 - \\frac{(\\pmb{\\alpha}_3, \\pmb{\\beta}_2)}{(\\pmb{\\beta}_2, \\pmb{\\beta}_2)}\\pmb{\\beta}_2$$\n代入计算化简得同向向量 $(3, 3, -4, 1)^\\mathrm{T}$。\n分别单位化即得：\n$\\pmb{e}_1 = \\frac{1}{\\sqrt{3}}(0, 1, 1, 1)^\\mathrm{T}, \\pmb{e}_2 = \\frac{1}{\\sqrt{15}}(3, -2, 1, 1)^\\mathrm{T}, \\pmb{e}_3 = \\frac{1}{\\sqrt{35}}(3, 3, -4, 1)^\\mathrm{T}$。"
    }
  },
  {
    id: "LAG-TB-CH07-Q09",
    source_type: "textbook",
    source: {
      paper_id: 2007,
      raw_title: "《线性代数与几何》第7章 二次型 课后习题",
      clean_title: "《线性代数与几何》第7章 二次型 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 9 题",
      page_start: 180,
      page_end: 180
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 9,
      paper_q_num: 9,
      type: "calc",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.1",
        section_title: "标准正交基",
        section_slug: "7.1_标准正交基",
        knowledge_points: ["正交矩阵构造", "单位正交向量组扩充"]
      }
    },
    content: {
      stem: "将下列正交矩阵 $\\pmb{O}$ 补充完整（构造下列正交矩阵 $\\pmb{O}$）：\n\n(1) $\\pmb{O}$ 的第 1 列为 $\\pmb{\\beta}_1 = \\left(\\frac{1}{3}, \\frac{2}{3}, -\\frac{2}{3}\\right)^\\mathrm{T}$；\n\n(2) $\\pmb{O}$ 的第 1、2 行分别为 $\\pmb{\\alpha}_1 = \\left(\\frac{1}{2}, \\frac{1}{2}, \\frac{1}{2}, \\frac{1}{2}\\right), \\pmb{\\alpha}_2 = \\left(\\frac{1}{2}, -\\frac{1}{2}, \\frac{1}{2}, -\\frac{1}{2}\\right)$。",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "$\\pmb{O}$ 的第 1 列为 $\\pmb{\\beta}_1 = \\left(\\frac{1}{3}, \\frac{2}{3}, -\\frac{2}{3}\\right)^\\mathrm{T}$",
          answer: "$\\pmb{O} = \\begin{pmatrix} \\frac{1}{3} & -\\frac{2}{\\sqrt{5}} & \\frac{2}{\\sqrt{45}} \\\\ \\frac{2}{3} & \\frac{1}{\\sqrt{5}} & \\frac{4}{\\sqrt{45}} \\\\ -\\frac{2}{3} & 0 & \\frac{5}{\\sqrt{45}} \\end{pmatrix}$（注：答案不唯一）"
        },
        {
          sub_id: "(2)",
          stem: "$\\pmb{O}$ 的第 1、2 行分别为 $\\pmb{\\alpha}_1 = \\left(\\frac{1}{2}, \\frac{1}{2}, \\frac{1}{2}, \\frac{1}{2}\\right), \\pmb{\\alpha}_2 = \\left(\\frac{1}{2}, -\\frac{1}{2}, \\frac{1}{2}, -\\frac{1}{2}\\right)$",
          answer: "$\\pmb{O} = \\frac{1}{2}\\begin{pmatrix} 1 & 1 & 1 & 1 \\\\ 1 & -1 & 1 & -1 \\\\ 1 & 0 & -1 & 0 \\\\ 0 & 1 & 0 & -1 \\end{pmatrix}$（注：答案不唯一）"
        }
      ]
    },
    solution: {
      answer: "(1) $\\pmb{O} = \\begin{pmatrix} \\frac{1}{3} & -\\frac{2}{\\sqrt{5}} & \\frac{2}{\\sqrt{45}} \\\\ \\frac{2}{3} & \\frac{1}{\\sqrt{5}} & \\frac{4}{\\sqrt{45}} \\\\ -\\frac{2}{3} & 0 & \\frac{5}{\\sqrt{45}} \\end{pmatrix}$（注：答案不唯一）；\n(2) $\\pmb{O} = \\frac{1}{2}\\begin{pmatrix} 1 & 1 & 1 & 1 \\\\ 1 & -1 & 1 & -1 \\\\ 1 & 0 & -1 & 0 \\\\ 0 & 1 & 0 & -1 \\end{pmatrix}$（注：答案不唯一）。",
      hints: "利用正交矩阵的各列（或各行）构成标准正交向量组的性质，解齐次线性方程组求出正交补空间的单位正交基。",
      steps: "(1) 设 $\\pmb{\\beta}_2 = (x_1, x_2, x_3)^\\mathrm{T}$ 与 $\\pmb{\\beta}_1$ 正交，即 $x_1 + 2x_2 - 2x_3 = 0$。取 $x_3=0, x_2=1$，得 $x_1=-2$，单位化得 $\\pmb{\\beta}_2 = \\left(-\\frac{2}{\\sqrt{5}}, \\frac{1}{\\sqrt{5}}, 0\\right)^\\mathrm{T}$。再求同时垂直于 $\\pmb{\\beta}_1, \\pmb{\\beta}_2$ 的单位向量 $\\pmb{\\beta}_3 = \\left(\\frac{2}{\\sqrt{45}}, \\frac{4}{\\sqrt{45}}, \\frac{5}{\\sqrt{45}}\\right)^\\mathrm{T}$，即组成正交矩阵 $\\pmb{O}$。\n\n(2) 验证 $\\pmb{\\alpha}_1, \\pmb{\\alpha}_2$ 为两两正交的单位行向量。求方程组 $\\pmb{\\alpha}_1 \\pmb{x} = 0, \\pmb{\\alpha}_2 \\pmb{x} = 0$ 的基础解系并施密特正交化单位化，即可构造出后两行，拼接得到正交矩阵 $\\pmb{O}$。"
    }
  },
  {
    id: "LAG-TB-CH07-Q10",
    source_type: "textbook",
    source: {
      paper_id: 2007,
      raw_title: "《线性代数与几何》第7章 二次型 课后习题",
      clean_title: "《线性代数与几何》第7章 二次型 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 10 题",
      page_start: 180,
      page_end: 181
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 10,
      paper_q_num: 10,
      type: "calc",
      difficulty: 1,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.1",
        section_title: "标准正交基",
        section_slug: "7.1_标准正交基",
        knowledge_points: ["正交矩阵判定", "正交矩阵的充要条件"]
      }
    },
    content: {
      stem: "判定以下方阵是否为正交矩阵：\n\n(1) $\\begin{pmatrix} 1 & -1 \\\\ 1 & 1 \\end{pmatrix}$；\n\n(2) $\\frac{1}{\\sqrt{2}}\\begin{pmatrix} 1 & 0 & 1 \\\\ -1 & 0 & 1 \\\\ 0 & \\sqrt{2} & 0 \\end{pmatrix}$；\n\n(3) $\\frac{1}{9}\\begin{pmatrix} 1 & -8 & -4 \\\\ -8 & 1 & -4 \\\\ -4 & -4 & 7 \\end{pmatrix}$；\n\n(4) $\\begin{pmatrix} \\frac{\\sqrt{2}}{2} & \\frac{\\sqrt{2}}{6} & \\frac{2}{3} \\\\ 0 & -\\frac{2\\sqrt{2}}{3} & \\frac{1}{3} \\\\ -\\frac{\\sqrt{2}}{2} & \\frac{\\sqrt{2}}{6} & \\frac{2}{3} \\end{pmatrix}$。",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "$\\begin{pmatrix} 1 & -1 \\\\ 1 & 1 \\end{pmatrix}$",
          answer: "不是"
        },
        {
          sub_id: "(2)",
          stem: "$\\frac{1}{\\sqrt{2}}\\begin{pmatrix} 1 & 0 & 1 \\\\ -1 & 0 & 1 \\\\ 0 & \\sqrt{2} & 0 \\end{pmatrix}$",
          answer: "是"
        },
        {
          sub_id: "(3)",
          stem: "$\\frac{1}{9}\\begin{pmatrix} 1 & -8 & -4 \\\\ -8 & 1 & -4 \\\\ -4 & -4 & 7 \\end{pmatrix}$",
          answer: "是"
        },
        {
          sub_id: "(4)",
          stem: "$\\begin{pmatrix} \\frac{\\sqrt{2}}{2} & \\frac{\\sqrt{2}}{6} & \\frac{2}{3} \\\\ 0 & -\\frac{2\\sqrt{2}}{3} & \\frac{1}{3} \\\\ -\\frac{\\sqrt{2}}{2} & \\frac{\\sqrt{2}}{6} & \\frac{2}{3} \\end{pmatrix}$",
          answer: "是"
        }
      ]
    },
    solution: {
      answer: "(1) 不是；(2) 是；(3) 是；(4) 是。",
      hints: "根据定义，方阵 $\\pmb{A}$ 为正交矩阵的充要条件是 $\\pmb{A}^\\mathrm{T}\\pmb{A} = \\pmb{E}$，即其各列（或各行）向量为相互正交的单位向量。",
      steps: "(1) 第 1 列向量的模长为 $\\sqrt{1^2+1^2} = \\sqrt{2} \\neq 1$，不是单位向量，故不是正交矩阵；\n\n(2) 各列向量长度均为 1 且两两正交，计算 $\\pmb{A}^\\mathrm{T}\\pmb{A} = \\pmb{E}$，故是正交矩阵；\n\n(3) 计算各列模长：$\\frac{1}{9}\\sqrt{1+64+16} = 1$，且任意两列的内积均为 0，满足 $\\pmb{A}^\\mathrm{T}\\pmb{A} = \\pmb{E}$，故是正交矩阵；\n\n(4) 容易验证三列向量长度均为 1 且两两正交，满足正交矩阵条件，故是正交矩阵。"
    }
  },
  {
    id: "LAG-TB-CH07-Q11",
    source_type: "textbook",
    source: {
      paper_id: 2007,
      raw_title: "《线性代数与几何》第7章 二次型 课后习题",
      clean_title: "《线性代数与几何》第7章 二次型 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 11 题",
      page_start: 181,
      page_end: 181
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 11,
      paper_q_num: 11,
      type: "proof",
      difficulty: 2,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.1",
        section_title: "标准正交基",
        section_slug: "7.1_标准正交基",
        knowledge_points: ["正交矩阵性质", "逆矩阵", "正交矩阵与矩阵代数"]
      }
    },
    content: {
      stem: "设 $\\pmb{A}$ 和 $\\pmb{B}$ 以及 $\\pmb{A} + \\pmb{B}$ 都是 $n$ 阶正交矩阵，证明 $(\\pmb{A} + \\pmb{B})^{-1} = \\pmb{A}^{-1} + \\pmb{B}^{-1}$。"
    },
    solution: {
      answer: "证明略。",
      hints: "利用正交矩阵满足 $\\pmb{P}^{-1} = \\pmb{P}^\\mathrm{T}$，将矩阵的逆运算转化为转置运算展开证明。",
      steps: "因为 $\\pmb{A}, \\pmb{B}$ 及 $\\pmb{A} + \\pmb{B}$ 均为正交矩阵，根据正交矩阵的性质，正交矩阵的逆等于其转置：\n$$(\\pmb{A} + \\pmb{B})^{-1} = (\\pmb{A} + \\pmb{B})^\\mathrm{T} = \\pmb{A}^\\mathrm{T} + \\pmb{B}^\\mathrm{T}$$\n又因为 $\\pmb{A}, \\pmb{B}$ 也是正交矩阵，分别有 $\\pmb{A}^\\mathrm{T} = \\pmb{A}^{-1}$ 与 $\\pmb{B}^\\mathrm{T} = \\pmb{B}^{-1}$。\n将它们代入上式，即可直接得到：\n$$(\\pmb{A} + \\pmb{B})^{-1} = \\pmb{A}^{-1} + \\pmb{B}^{-1}$$\n命题得证。"
    }
  },
  {
    id: "LAG-TB-CH07-Q12",
    source_type: "textbook",
    source: {
      paper_id: 2007,
      raw_title: "《线性代数与几何》第7章 二次型 课后习题",
      clean_title: "《线性代数与几何》第7章 二次型 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 12 题",
      page_start: 181,
      page_end: 181
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 12,
      paper_q_num: 12,
      type: "proof",
      difficulty: 2,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.1",
        section_title: "标准正交基",
        section_slug: "7.1_标准正交基",
        knowledge_points: ["向量内积性质", "正交性质", "正定性"]
      }
    },
    content: {
      stem: "试证：若 $n$ 维实向量 $\\pmb{p}$ 与任意 $n$ 维实向量都正交，则 $\\pmb{p}$ 必为零向量。"
    },
    solution: {
      answer: "证明略。",
      hints: "取自身与自身计算内积，利用实内积的正定性 $(\\pmb{p}, \\pmb{p}) = 0 \\iff \\pmb{p} = \\pmb{0}$。",
      steps: "已知对于任意 $n$ 维实向量 $\\pmb{x}$，都有 $(\\pmb{p}, \\pmb{x}) = 0$。\n特别地，取 $\\pmb{x} = \\pmb{p}$，则有：\n$$(\\pmb{p}, \\pmb{p}) = 0$$\n设 $\\pmb{p} = (p_1, p_2, \\cdots, p_n)^\\mathrm{T}$，根据实向量内积的定义：\n$$(\\pmb{p}, \\pmb{p}) = \\sum_{i=1}^n p_i^2 = 0$$\n由于实数的平方非负，所以必有 $p_1 = p_2 = \\cdots = p_n = 0$。\n即 $\\pmb{p} = \\pmb{0}$ 为零向量。命题得证。"
    }
  },
  {
    id: "LAG-TB-CH07-Q13",
    source_type: "textbook",
    source: {
      paper_id: 2007,
      raw_title: "《线性代数与几何》第7章 二次型 课后习题",
      clean_title: "《线性代数与几何》第7章 二次型 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 13 题",
      page_start: 181,
      page_end: 181
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 13,
      paper_q_num: 13,
      type: "calc",
      difficulty: 2,
      score: 10
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.2",
        section_title: "实对称矩阵的对角化",
        section_slug: "7.2_实对称矩阵的对角化",
        knowledge_points: ["实对称矩阵正交对角化", "正交矩阵", "特征值与特征向量"]
      }
    },
    content: {
      stem: "求正交矩阵 $\\pmb{O}$，使得 $\\pmb{O}^\\mathrm{T}\\pmb{A}\\pmb{O}$ 为对角矩阵：\n\n(1) $\\pmb{A} = \\begin{pmatrix} 2 & 0 & 0 \\\\ 0 & 3 & 2 \\\\ 0 & 2 & 3 \\end{pmatrix}$；\n\n(2) $\\pmb{A} = \\begin{pmatrix} 2 & -2 & 0 \\\\ -2 & 1 & -2 \\\\ 0 & -2 & 0 \\end{pmatrix}$；\n\n(3) $\\pmb{A} = \\begin{pmatrix} 1 & 2 & 4 \\\\ 2 & -2 & 2 \\\\ 4 & 2 & 1 \\end{pmatrix}$；\n\n(4) $\\pmb{A} = \\begin{pmatrix} 1 & -1 & 0 & 0 \\\\ -1 & 1 & 0 & 0 \\\\ 0 & 0 & 4 & 2 \\\\ 0 & 0 & 2 & 1 \\end{pmatrix}$。",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "$\\pmb{A} = \\begin{pmatrix} 2 & 0 & 0 \\\\ 0 & 3 & 2 \\\\ 0 & 2 & 3 \\end{pmatrix}$",
          answer: "$\\pmb{O} = \\frac{\\sqrt{2}}{2}\\begin{pmatrix} \\sqrt{2} & 0 & 0 \\\\ 0 & 1 & 1 \\\\ 0 & -1 & 1 \\end{pmatrix}, \\pmb{O}^\\mathrm{T}\\pmb{A}\\pmb{O} = \\begin{pmatrix} 2 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & 5 \\end{pmatrix}$"
        },
        {
          sub_id: "(2)",
          stem: "$\\pmb{A} = \\begin{pmatrix} 2 & -2 & 0 \\\\ -2 & 1 & -2 \\\\ 0 & -2 & 0 \\end{pmatrix}$",
          answer: "$\\pmb{O} = \\frac{1}{3}\\begin{pmatrix} 2 & 2 & 1 \\\\ -2 & 1 & 2 \\\\ 1 & -2 & 2 \\end{pmatrix}, \\pmb{O}^\\mathrm{T}\\pmb{A}\\pmb{O} = \\begin{pmatrix} 4 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & -2 \\end{pmatrix}$"
        },
        {
          sub_id: "(3)",
          stem: "$\\pmb{A} = \\begin{pmatrix} 1 & 2 & 4 \\\\ 2 & -2 & 2 \\\\ 4 & 2 & 1 \\end{pmatrix}$",
          answer: "$\\pmb{O} = \\begin{pmatrix} \\frac{\\sqrt{2}}{2} & \\frac{\\sqrt{2}}{6} & \\frac{2}{3} \\\\ 0 & -\\frac{2\\sqrt{2}}{3} & \\frac{1}{3} \\\\ -\\frac{\\sqrt{2}}{2} & \\frac{\\sqrt{2}}{6} & \\frac{2}{3} \\end{pmatrix}, \\pmb{O}^\\mathrm{T}\\pmb{A}\\pmb{O} = \\begin{pmatrix} -3 & 0 & 0 \\\\ 0 & -3 & 0 \\\\ 0 & 0 & 6 \\end{pmatrix}$"
        },
        {
          sub_id: "(4)",
          stem: "$\\pmb{A} = \\begin{pmatrix} 1 & -1 & 0 & 0 \\\\ -1 & 1 & 0 & 0 \\\\ 0 & 0 & 4 & 2 \\\\ 0 & 0 & 2 & 1 \\end{pmatrix}$",
          answer: "$\\pmb{O} = \\begin{pmatrix} \\frac{\\sqrt{2}}{2} & \\frac{\\sqrt{2}}{2} & 0 & 0 \\\\ \\frac{\\sqrt{2}}{2} & -\\frac{\\sqrt{2}}{2} & 0 & 0 \\\\ 0 & 0 & \\frac{\\sqrt{5}}{5} & \\frac{2\\sqrt{5}}{5} \\\\ 0 & 0 & -\\frac{2\\sqrt{5}}{5} & \\frac{\\sqrt{5}}{5} \\end{pmatrix}, \\pmb{O}^\\mathrm{T}\\pmb{A}\\pmb{O} = \\begin{pmatrix} 0 & 0 & 0 & 0 \\\\ 0 & 2 & 0 & 0 \\\\ 0 & 0 & 0 & 0 \\\\ 0 & 0 & 0 & 5 \\end{pmatrix}$"
        }
      ]
    },
    solution: {
      answer: "(1) $\\pmb{O} = \\frac{\\sqrt{2}}{2}\\begin{pmatrix} \\sqrt{2} & 0 & 0 \\\\ 0 & 1 & 1 \\\\ 0 & -1 & 1 \\end{pmatrix}, \\pmb{O}^\\mathrm{T}\\pmb{A}\\pmb{O} = \\begin{pmatrix} 2 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & 5 \\end{pmatrix}$；\n(2) $\\pmb{O} = \\frac{1}{3}\\begin{pmatrix} 2 & 2 & 1 \\\\ -2 & 1 & 2 \\\\ 1 & -2 & 2 \\end{pmatrix}, \\pmb{O}^\\mathrm{T}\\pmb{A}\\pmb{O} = \\begin{pmatrix} 4 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & -2 \\end{pmatrix}$；\n(3) $\\pmb{O} = \\begin{pmatrix} \\frac{\\sqrt{2}}{2} & \\frac{\\sqrt{2}}{6} & \\frac{2}{3} \\\\ 0 & -\\frac{2\\sqrt{2}}{3} & \\frac{1}{3} \\\\ -\\frac{\\sqrt{2}}{2} & \\frac{\\sqrt{2}}{6} & \\frac{2}{3} \\end{pmatrix}, \\pmb{O}^\\mathrm{T}\\pmb{A}\\pmb{O} = \\begin{pmatrix} -3 & 0 & 0 \\\\ 0 & -3 & 0 \\\\ 0 & 0 & 6 \\end{pmatrix}$；\n(4) $\\pmb{O} = \\begin{pmatrix} \\frac{\\sqrt{2}}{2} & \\frac{\\sqrt{2}}{2} & 0 & 0 \\\\ \\frac{\\sqrt{2}}{2} & -\\frac{\\sqrt{2}}{2} & 0 & 0 \\\\ 0 & 0 & \\frac{\\sqrt{5}}{5} & \\frac{2\\sqrt{5}}{5} \\\\ 0 & 0 & -\\frac{2\\sqrt{5}}{5} & \\frac{\\sqrt{5}}{5} \\end{pmatrix}, \\pmb{O}^\\mathrm{T}\\pmb{A}\\pmb{O} = \\begin{pmatrix} 0 & 0 & 0 & 0 \\\\ 0 & 2 & 0 & 0 \\\\ 0 & 0 & 0 & 0 \\\\ 0 & 0 & 0 & 5 \\end{pmatrix}$。",
      hints: "求实对称矩阵 $\\pmb{A}$ 的特征值，解方程组 $(\\lambda\\pmb{E}-\\pmb{A})\\pmb{x} = \\pmb{0}$ 得到特征向量，正交化并单位化后组成正交矩阵 $\\pmb{O}$。",
      steps: "(1) 特征多项式为 $|\\lambda\\pmb{E}-\\pmb{A}| = (\\lambda-2)[(\\lambda-3)^2-4] = (\\lambda-2)(\\lambda-1)(\\lambda-5)=0$，特征值为 $\\lambda_1=2, \\lambda_2=1, \\lambda_3=5$。对应正交单位特征向量分别为 $(1, 0, 0)^\\mathrm{T}, \\frac{1}{\\sqrt{2}}(0, 1, -1)^\\mathrm{T}, \\frac{1}{\\sqrt{2}}(0, 1, 1)^\\mathrm{T}$，组合得正交矩阵 $\\pmb{O}$。\n\n(2) 解特征方程得 $\\lambda_1=4, \\lambda_2=1, \\lambda_3=-2$，求出对应的相互正交特征向量单位化后作为列向量排成 $\\pmb{O}$。\n\n(3) 解得特征值为重根 $\\lambda_1=\\lambda_2=-3$ 与单根 $\\lambda_3=6$。对二重特征值求出特征子空间的两个正交单位向量，与 $\\lambda_3$ 的单位特征向量组合得 $\\pmb{O}$。\n\n(4) 该矩阵为对角分块矩阵，分别对左上角 $2 \\times 2$ 子块与右下角 $2 \\times 2$ 子块正交对角化后拼接即可。"
    }
  },
  {
    id: "LAG-TB-CH07-Q14",
    source_type: "textbook",
    source: {
      paper_id: 2007,
      raw_title: "《线性代数与几何》第7章 二次型 课后习题",
      clean_title: "《线性代数与几何》第7章 二次型 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 14 题",
      page_start: 181,
      page_end: 181
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 14,
      paper_q_num: 14,
      type: "proof",
      difficulty: 2,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.2",
        section_title: "实对称矩阵的对角化",
        section_slug: "7.2_实对称矩阵的对角化",
        knowledge_points: ["实对称矩阵性质", "矩阵相似对角化", "单位矩阵证明"]
      }
    },
    content: {
      stem: "设 $n$ 阶实对称矩阵 $\\pmb{A}$ 满足 $\\pmb{A}^3 = \\pmb{E}$，求证 $\\pmb{A}$ 是单位矩阵。"
    },
    solution: {
      answer: "证明略。",
      hints: "实对称矩阵必可正交对角化且特征值全为实数，结合实数域中 $\\lambda^3=1$ 只有实根 $\\lambda=1$ 进行证明。",
      steps: "因为 $\\pmb{A}$ 是实对称矩阵，所以存在正交矩阵 $\\pmb{P}$，使得：\n$$\\pmb{P}^{-1}\\pmb{A}\\pmb{P} = \\pmb{\\Lambda} = \\operatorname{diag}(\\lambda_1, \\lambda_2, \\cdots, \\lambda_n)$$\n其中 $\\lambda_i \\in \\mathbb{R}$ 为 $\\pmb{A}$ 的特征值。\n由 $\\pmb{A}^3 = \\pmb{E}$ 可知：\n$$\\pmb{\\Lambda}^3 = (\\pmb{P}^{-1}\\pmb{A}\\pmb{P})^3 = \\pmb{P}^{-1}\\pmb{A}^3\\pmb{P} = \\pmb{P}^{-1}\\pmb{E}\\pmb{P} = \\pmb{E}$$\n即对所有 $i=1, 2, \\cdots, n$，都有 $\\lambda_i^3 = 1$。\n由于实对称矩阵的特征值 $\\lambda_i$ 必须是实数，在实数域中方程 $\\lambda^3 = 1$ 的唯一实根为 $\\lambda = 1$。\n因此 $\\lambda_1 = \\lambda_2 = \\cdots = \\lambda_n = 1$，即 $\\pmb{\\Lambda} = \\pmb{E}$。\n从而：\n$$\\pmb{A} = \\pmb{P}\\pmb{\\Lambda}\\pmb{P}^{-1} = \\pmb{P}\\pmb{E}\\pmb{P}^{-1} = \\pmb{E}$$\n即 $\\pmb{A}$ 是单位矩阵。命题得证。"
    }
  },
  {
    id: "LAG-TB-CH07-Q15",
    source_type: "textbook",
    source: {
      paper_id: 2007,
      raw_title: "《线性代数与几何》第7章 二次型 课后习题",
      clean_title: "《线性代数与几何》第7章 二次型 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 15 题",
      page_start: 181,
      page_end: 181
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 15,
      paper_q_num: 15,
      type: "calc",
      difficulty: 2,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.2",
        section_title: "实对称矩阵的对角化",
        section_slug: "7.2_实对称矩阵的对角化",
        knowledge_points: ["实对称矩阵特征向量正交性", "正交向量求解"]
      }
    },
    content: {
      stem: "设三阶实对称矩阵 $\\pmb{A}$ 的特征值为 $\\lambda_1 = 1, \\lambda_2 = 2, \\lambda_3 = 3$。已知 $\\pmb{A}$ 的属于 $\\lambda_1$ 和 $\\lambda_2$ 的特征向量分别为 $\\pmb{p}_1 = (-1, -1, 1)^\\mathrm{T}, \\pmb{p}_2 = (1, -2, -1)^\\mathrm{T}$，求 $\\pmb{A}$ 的属于 $\\lambda_3$ 的特征向量。"
    },
    solution: {
      answer: "$k(1, 0, 1)^\\mathrm{T} \\quad (k \\neq 0)$。",
      hints: "实对称矩阵属于互不相同的特征值的特征向量相互正交。",
      steps: "设属于 $\\lambda_3 = 3$ 的特征向量为 $\\pmb{p}_3 = (x_1, x_2, x_3)^\\mathrm{T}$。\n因为实对称矩阵属于不同特征值的特征向量两两正交，故 $\\pmb{p}_3$ 必同时垂直于 $\\pmb{p}_1$ 与 $\\pmb{p}_2$，即满足：\n$$\\begin{cases} -x_1 - x_2 + x_3 = 0 \\\\ x_1 - 2x_2 - x_3 = 0 \\end{cases}$$\n两式相加得 $-3x_2 = 0 \\implies x_2 = 0$。\n代入第 1 式得 $x_3 = x_1$。\n因此属于 $\\lambda_3$ 的特征向量为 $\\pmb{p}_3 = k(1, 0, 1)^\\mathrm{T}$，其中 $k \\neq 0$ 为任意非零常数。"
    }
  }
];
