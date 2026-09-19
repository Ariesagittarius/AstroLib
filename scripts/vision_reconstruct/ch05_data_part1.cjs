// scripts/vision_reconstruct/ch05_data_part1.cjs

const ch05QuestionsPart1 = [
  {
    id: "LAG-TB-CH05-Q01",
    source_type: "textbook",
    source: {
      paper_id: 2005,
      raw_title: "《线性代数与几何》第5章 线性方程组 课后习题",
      clean_title: "《线性代数与几何》第5章 线性方程组 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 5 章 · 习题五 第 1 题",
      page_start: 130,
      page_end: 130
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
        chapter: 5,
        chapter_title: "第5章 线性方程组",
        section: "5.1",
        section_title: "齐次线性方程组",
        section_slug: "5.1_齐次线性方程组",
        knowledge_points: ["齐次线性方程组求解", "基础解系", "通解"]
      }
    },
    content: {
      stem: "解下列齐次线性方程组：\n\n(1) $\\begin{cases} 2x_1 - 4x_2 + 5x_3 + 3x_4 = 0, \\\\ 3x_1 - 6x_2 + 4x_3 + 2x_4 = 0, \\\\ 4x_1 - 8x_2 + 17x_3 + 11x_4 = 0; \\end{cases}$\n\n(2) $\\begin{cases} 2x_1 - 4x_2 + 17x_3 - 6x_4 = 0, \\\\ x_1 + x_2 - 2x_3 + 3x_4 = 0, \\\\ 3x_1 + x_2 + x_3 + 5x_4 = 0, \\\\ 3x_1 - x_2 + 8x_3 + x_4 = 0; \\end{cases}$\n\n(3) $\\begin{cases} 2x_1 + x_2 - x_3 - x_4 + x_5 = 0, \\\\ x_1 - x_2 + x_3 + x_4 - 2x_5 = 0, \\\\ 3x_1 + 3x_2 - 3x_3 - 3x_4 + 4x_5 = 0, \\\\ 4x_1 + 5x_2 - 5x_3 - 5x_4 + 7x_5 = 0; \\end{cases}$\n\n(4) $\\begin{cases} x_1 + x_2 + x_3 + x_4 + x_5 = 0, \\\\ 2x_1 + 3x_2 + x_3 + x_4 - 3x_5 = 0, \\\\ x_1 + 2x_3 + 2x_4 + 6x_5 = 0, \\\\ 4x_1 + 5x_2 + 3x_3 + 4x_4 - x_5 = 0. \\end{cases}$",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "$\\begin{cases} 2x_1 - 4x_2 + 5x_3 + 3x_4 = 0, \\\\ 3x_1 - 6x_2 + 4x_3 + 2x_4 = 0, \\\\ 4x_1 - 8x_2 + 17x_3 + 11x_4 = 0 \\end{cases}$",
          answer: "$\\boldsymbol{x} = k_1(2, 1, 0, 0)^\\mathrm{T} + k_2(2, 0, -5, 7)^\\mathrm{T}$"
        },
        {
          sub_id: "(2)",
          stem: "$\\begin{cases} 2x_1 - 4x_2 + 17x_3 - 6x_4 = 0, \\\\ x_1 + x_2 - 2x_3 + 3x_4 = 0, \\\\ 3x_1 + x_2 + x_3 + 5x_4 = 0, \\\\ 3x_1 - x_2 + 8x_3 + x_4 = 0 \\end{cases}$",
          answer: "$\\boldsymbol{x} = k_1(-3, 7, 2, 0)^\\mathrm{T} + k_2(-1, -2, 0, 1)^\\mathrm{T}$"
        },
        {
          sub_id: "(3)",
          stem: "$\\begin{cases} 2x_1 + x_2 - x_3 - x_4 + x_5 = 0, \\\\ x_1 - x_2 + x_3 + x_4 - 2x_5 = 0, \\\\ 3x_1 + 3x_2 - 3x_3 - 3x_4 + 4x_5 = 0, \\\\ 4x_1 + 5x_2 - 5x_3 - 5x_4 + 7x_5 = 0 \\end{cases}$",
          answer: "$\\boldsymbol{x} = k_1(0, 1, 1, 0, 0)^\\mathrm{T} + k_2(0, 1, 0, 1, 0)^\\mathrm{T} + k_3(1, -5, 0, 0, 3)^\\mathrm{T}$"
        },
        {
          sub_id: "(4)",
          stem: "$\\begin{cases} x_1 + x_2 + x_3 + x_4 + x_5 = 0, \\\\ 2x_1 + 3x_2 + x_3 + x_4 - 3x_5 = 0, \\\\ x_1 + 2x_3 + 2x_4 + 6x_5 = 0, \\\\ 4x_1 + 5x_2 + 3x_3 + 4x_4 - x_5 = 0 \\end{cases}$",
          answer: "$\\boldsymbol{x} = k_1(-2, 1, 1, 0, 0)^\\mathrm{T} + k_2(-6, 5, 0, 0, 1)^\\mathrm{T}$"
        }
      ]
    },
    solution: {
      answer: "(1) $\\boldsymbol{x} = k_1(2, 1, 0, 0)^\\mathrm{T} + k_2(2, 0, -5, 7)^\\mathrm{T}$；\n(2) $\\boldsymbol{x} = k_1(-3, 7, 2, 0)^\\mathrm{T} + k_2(-1, -2, 0, 1)^\\mathrm{T}$；\n(3) $\\boldsymbol{x} = k_1(0, 1, 1, 0, 0)^\\mathrm{T} + k_2(0, 1, 0, 1, 0)^\\mathrm{T} + k_3(1, -5, 0, 0, 3)^\\mathrm{T}$；\n(4) $\\boldsymbol{x} = k_1(-2, 1, 1, 0, 0)^\\mathrm{T} + k_2(-6, 5, 0, 0, 1)^\\mathrm{T}$（其中 $k_1, k_2, k_3$ 为任意实数）。",
      hints: "对系数矩阵施行初等行变换化为行最简形矩阵，确定自由未知量，令自由未知量分别取标准单位向量求出基础解系，进而写出齐次线性方程组的通解。",
      steps: "(1) 对系数矩阵施行初等行变换：\n$$\\begin{pmatrix} 2 & -4 & 5 & 3 \\\\ 3 & -6 & 4 & 2 \\\\ 4 & -8 & 17 & 11 \\end{pmatrix} \\to \\begin{pmatrix} 1 & -2 & 0 & -2/7 \\\\ 0 & 0 & 1 & 5/7 \\\\ 0 & 0 & 0 & 0 \\end{pmatrix}$$\n自由未知量为 $x_2, x_4$，可得基础解系 $\\boldsymbol{\\xi}_1 = (2, 1, 0, 0)^\\mathrm{T}, \\boldsymbol{\\xi}_2 = (2, 0, -5, 7)^\\mathrm{T}$，通解为 $\\boldsymbol{x} = k_1(2, 1, 0, 0)^\\mathrm{T} + k_2(2, 0, -5, 7)^\\mathrm{T}$；\n\n(2) 对系数矩阵初等行变换得行最简形：\n$$\\begin{pmatrix} 1 & 0 & 3/2 & 1 \\\\ 0 & 1 & -7/2 & 2 \\\\ 0 & 0 & 0 & 0 \\\\ 0 & 0 & 0 & 0 \\end{pmatrix}$$\n自由未知量为 $x_3, x_4$，基础解系为 $\\boldsymbol{\\xi}_1 = (-3, 7, 2, 0)^\\mathrm{T}, \\boldsymbol{\\xi}_2 = (-1, -2, 0, 1)^\\mathrm{T}$，通解为 $\\boldsymbol{x} = k_1(-3, 7, 2, 0)^\\mathrm{T} + k_2(-1, -2, 0, 1)^\\mathrm{T}$；\n\n(3) 对系数矩阵初等行变换得：\n$$\\begin{pmatrix} 1 & 0 & 0 & 0 & -1/3 \\\\ 0 & 1 & -1 & -1 & 5/3 \\\\ 0 & 0 & 0 & 0 & 0 \\\\ 0 & 0 & 0 & 0 & 0 \\end{pmatrix}$$\n自由未知量为 $x_3, x_4, x_5$，基础解系为 $\\boldsymbol{\\xi}_1 = (0, 1, 1, 0, 0)^\\mathrm{T}, \\boldsymbol{\\xi}_2 = (0, 1, 0, 1, 0)^\\mathrm{T}, \\boldsymbol{\\xi}_3 = (1, -5, 0, 0, 3)^\\mathrm{T}$，通解为 $\\boldsymbol{x} = k_1(0, 1, 1, 0, 0)^\\mathrm{T} + k_2(0, 1, 0, 1, 0)^\\mathrm{T} + k_3(1, -5, 0, 0, 3)^\\mathrm{T}$；\n\n(4) 对系数矩阵初等行变换得行最简形：\n$$\\begin{pmatrix} 1 & 0 & 2 & 0 & 6 \\\\ 0 & 1 & -1 & 0 & -5 \\\\ 0 & 0 & 0 & 1 & 0 \\\\ 0 & 0 & 0 & 0 & 0 \\end{pmatrix}$$\n自由未知量为 $x_3, x_5$（此时 $x_4 = 0$），基础解系为 $\\boldsymbol{\\xi}_1 = (-2, 1, 1, 0, 0)^\\mathrm{T}, \\boldsymbol{\\xi}_2 = (-6, 5, 0, 0, 1)^\\mathrm{T}$，通解为 $\\boldsymbol{x} = k_1(-2, 1, 1, 0, 0)^\\mathrm{T} + k_2(-6, 5, 0, 0, 1)^\\mathrm{T}$。"
    }
  },
  {
    id: "LAG-TB-CH05-Q02",
    source_type: "textbook",
    source: {
      paper_id: 2005,
      raw_title: "《线性代数与几何》第5章 线性方程组 课后习题",
      clean_title: "《线性代数与几何》第5章 线性方程组 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 5 章 · 习题五 第 2 题",
      page_start: 130,
      page_end: 131
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
        chapter: 5,
        chapter_title: "第5章 线性方程组",
        section: "5.2",
        section_title: "非齐次线性方程组",
        section_slug: "5.2_非齐次线性方程组",
        knowledge_points: ["非齐次线性方程组求解", "特解", "导出组基础解系", "通解"]
      }
    },
    content: {
      stem: "解下列非齐次线性方程组：\n\n(1) $\\begin{cases} x_1 + 3x_3 + x_4 = 2, \\\\ x_1 - 3x_2 + x_4 = -1, \\\\ 2x_1 + x_2 + 7x_3 + 2x_4 = 5, \\\\ 4x_1 + 2x_2 + 14x_3 = 6; \\end{cases}$\n\n(2) $\\begin{cases} x_1 - x_2 + 3x_3 - x_4 = 1, \\\\ 2x_1 - x_2 - x_3 + 4x_4 = 2, \\\\ 3x_1 - 2x_2 + 2x_3 + 3x_4 = 3, \\\\ x_1 - 4x_3 + 5x_4 = -1; \\end{cases}$\n\n(3) $\\begin{cases} x_1 + 2x_2 + 3x_3 - x_4 = 1, \\\\ 3x_1 + 2x_2 + x_3 - x_4 = 1, \\\\ 2x_1 + 2x_2 + 2x_3 - x_4 = 1, \\\\ 2x_1 + 3x_2 + x_3 + x_4 = 1, \\\\ 5x_1 + 5x_2 + 2x_3 = 2; \\end{cases}$\n\n(4) $\\begin{cases} x_1 + x_2 + x_3 + x_4 + x_5 = 7, \\\\ 3x_1 + 2x_2 + x_3 + x_4 - 3x_5 = -2, \\\\ x_2 + 2x_3 + 2x_4 + 6x_5 = 23, \\\\ 5x_1 + 4x_2 + 3x_3 + 3x_4 - x_5 = 12. \\end{cases}$",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "$\\begin{cases} x_1 + 3x_3 + x_4 = 2, \\\\ x_1 - 3x_2 + x_4 = -1, \\\\ 2x_1 + x_2 + 7x_3 + 2x_4 = 5, \\\\ 4x_1 + 2x_2 + 14x_3 = 6 \\end{cases}$",
          answer: "$\\boldsymbol{x} = k(-3, -1, 1, 0)^\\mathrm{T} + (1, 1, 0, 1)^\\mathrm{T}$"
        },
        {
          sub_id: "(2)",
          stem: "$\\begin{cases} x_1 - x_2 + 3x_3 - x_4 = 1, \\\\ 2x_1 - x_2 - x_3 + 4x_4 = 2, \\\\ 3x_1 - 2x_2 + 2x_3 + 3x_4 = 3, \\\\ x_1 - 4x_3 + 5x_4 = -1 \\end{cases}$",
          answer: "无解"
        },
        {
          sub_id: "(3)",
          stem: "$\\begin{cases} x_1 + 2x_2 + 3x_3 - x_4 = 1, \\\\ 3x_1 + 2x_2 + x_3 - x_4 = 1, \\\\ 2x_1 + 2x_2 + 2x_3 - x_4 = 1, \\\\ 2x_1 + 3x_2 + x_3 + x_4 = 1, \\\\ 5x_1 + 5x_2 + 2x_3 = 2 \\end{cases}$",
          answer: "$\\boldsymbol{x} = k(5, -7, 5, 6)^\\mathrm{T} + \\left(\\frac{1}{6}, \\frac{1}{6}, \\frac{1}{6}, 0\\right)^\\mathrm{T}$"
        },
        {
          sub_id: "(4)",
          stem: "$\\begin{cases} x_1 + x_2 + x_3 + x_4 + x_5 = 7, \\\\ 3x_1 + 2x_2 + x_3 + x_4 - 3x_5 = -2, \\\\ x_2 + 2x_3 + 2x_4 + 6x_5 = 23, \\\\ 5x_1 + 4x_2 + 3x_3 + 3x_4 - x_5 = 12 \\end{cases}$",
          answer: "$\\boldsymbol{x} = k_1(1, -2, 1, 0, 0)^\\mathrm{T} + k_2(1, -2, 0, 1, 0)^\\mathrm{T} + k_3(5, -6, 0, 0, 1)^\\mathrm{T} + (-16, 23, 0, 0, 0)^\\mathrm{T}$"
        }
      ]
    },
    solution: {
      answer: "(1) $\\boldsymbol{x} = k(-3, -1, 1, 0)^\\mathrm{T} + (1, 1, 0, 1)^\\mathrm{T}$（$k$ 为任意实数）；\n(2) 无解；\n(3) $\\boldsymbol{x} = k(5, -7, 5, 6)^\\mathrm{T} + \\left(\\frac{1}{6}, \\frac{1}{6}, \\frac{1}{6}, 0\\right)^\\mathrm{T}$（$k$ 为任意实数）；\n(4) $\\boldsymbol{x} = k_1(1, -2, 1, 0, 0)^\\mathrm{T} + k_2(1, -2, 0, 1, 0)^\\mathrm{T} + k_3(5, -6, 0, 0, 1)^\\mathrm{T} + (-16, 23, 0, 0, 0)^\\mathrm{T}$（$k_1, k_2, k_3$ 为任意实数）。",
      hints: "对增广矩阵施行初等行变换化为行最简形矩阵，比较系数矩阵的秩与增广矩阵的秩判断是否有解；有解时求出导出组基础解系和一个特解，写出通解。",
      steps: "(1) 对增广矩阵施行初等行变换得：\n$$\\begin{pmatrix} 1 & 0 & 3 & 0 & 1 \\\\ 0 & 1 & 1 & 0 & 1 \\\\ 0 & 0 & 0 & 1 & 1 \\\\ 0 & 0 & 0 & 0 & 0 \\end{pmatrix}$$\n自由未知量为 $x_3$，特解为 $(1, 1, 0, 1)^\\mathrm{T}$，导出组基础解系为 $(-3, -1, 1, 0)^\\mathrm{T}$，故通解为 $\\boldsymbol{x} = k(-3, -1, 1, 0)^\\mathrm{T} + (1, 1, 0, 1)^\\mathrm{T}$；\n\n(2) 对增广矩阵施行初等行变换，出现形如 $(0, 0, 0, 0 \\mid 1)$ 的行，系数矩阵的秩为 $2$，增广矩阵的秩为 $3$，故方程组无解；\n\n(3) 增广矩阵化为行最简形得：\n$$\\begin{pmatrix} 1 & 0 & 0 & -5/6 & 1/6 \\\\ 0 & 1 & 0 & 7/6 & 1/6 \\\\ 0 & 0 & 1 & -5/6 & 1/6 \\\\ 0 & 0 & 0 & 0 & 0 \\\\ 0 & 0 & 0 & 0 & 0 \\end{pmatrix}$$\n令自由未知量 $x_4 = 6k$，通解为 $\\boldsymbol{x} = k(5, -7, 5, 6)^\\mathrm{T} + \\left(\\frac{1}{6}, \\frac{1}{6}, \\frac{1}{6}, 0\\right)^\\mathrm{T}$；\n\n(4) 增广矩阵化为行最简形得：\n$$\\begin{pmatrix} 1 & 0 & -1 & -1 & -5 & -16 \\\\ 0 & 1 & 2 & 2 & 6 & 23 \\\\ 0 & 0 & 0 & 0 & 0 & 0 \\\\ 0 & 0 & 0 & 0 & 0 & 0 \\end{pmatrix}$$\n自由未知量为 $x_3, x_4, x_5$，特解为 $(-16, 23, 0, 0, 0)^\\mathrm{T}$，通解为 $\\boldsymbol{x} = k_1(1, -2, 1, 0, 0)^\\mathrm{T} + k_2(1, -2, 0, 1, 0)^\\mathrm{T} + k_3(5, -6, 0, 0, 1)^\\mathrm{T} + (-16, 23, 0, 0, 0)^\\mathrm{T}$。"
    }
  },
  {
    id: "LAG-TB-CH05-Q03",
    source_type: "textbook",
    source: {
      paper_id: 2005,
      raw_title: "《线性代数与几何》第5章 线性方程组 课后习题",
      clean_title: "《线性代数与几何》第5章 线性方程组 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 5 章 · 习题五 第 3 题",
      page_start: 131,
      page_end: 131
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 3,
      paper_q_num: 3,
      type: "calc",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 5,
        chapter_title: "第5章 线性方程组",
        section: "5.2",
        section_title: "非齐次线性方程组",
        section_slug: "5.2_非齐次线性方程组",
        knowledge_points: ["含参线性方程组", "解的判定", "克拉默法则"]
      }
    },
    content: {
      stem: "设方程组\n$$\\begin{cases} x_1 + x_3 = 2, \\\\ x_1 + 2x_2 - x_3 = 0, \\\\ 2x_1 + x_2 - ax_3 = b. \\end{cases}$$\n(1) 确定当 $a, b$ 分别为何值时，方程组无解？有唯一解？有无穷多个解？\n(2) 在有解时求出方程组的解。",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "确定当 $a, b$ 分别为何值时，方程组无解？有唯一解？有无穷多个解？",
          answer: "当 $a = -1$ 且 $b \\neq 3$ 时，方程组无解；当 $a \\neq -1$ 时，方程组有唯一解；当 $a = -1$ 且 $b = 3$ 时，方程组有无穷多个解。"
        },
        {
          sub_id: "(2)",
          stem: "在有解时求出方程组的解。",
          answer: "当 $a \\neq -1$ 时，方程组的唯一解为 $x_1 = \\frac{2a+b-1}{a+1}, x_2 = \\frac{2-a-b}{a+1}, x_3 = \\frac{3-b}{a+1}$；当 $a = -1$ 且 $b = 3$ 时，解为 $x_1 = 2-c, x_2 = -1+c, x_3 = c$（$c$ 为任意实数）。"
        }
      ]
    },
    solution: {
      answer: "(1) 当 $a = -1$ 且 $b \\neq 3$ 时，方程组无解；当 $a \\neq -1$ 时，方程组有唯一解；当 $a = -1$ 且 $b = 3$ 时，方程组有无穷多个解。\n(2) 当 $a \\neq -1$ 时，方程组的唯一解为\n$$x_1 = \\frac{2a+b-1}{a+1}, \\quad x_2 = \\frac{2-a-b}{a+1}, \\quad x_3 = \\frac{3-b}{a+1};$$\n当 $a = -1$ 且 $b = 3$ 时，解为\n$$x_1 = 2-c, \\quad x_2 = -1+c, \\quad x_3 = c \\quad (c \\text{ 为任意实数})。$$",
      hints: "考察系数行列式 $|\\boldsymbol{A}|$ 与增广矩阵初等行变换后的阶梯形，分析秩的变化对解的情况的影响。",
      steps: "系数行列式为：\n$$|\\boldsymbol{A}| = \\begin{vmatrix} 1 & 0 & 1 \\\\ 1 & 2 & -1 \\\\ 2 & 1 & -a \\end{vmatrix} = -2(a+1)$$\n(1) 当 $a \\neq -1$ 时，$|\\boldsymbol{A}| \\neq 0$，系数矩阵满秩 $r(\\boldsymbol{A}) = r(\\bar{\\boldsymbol{A}}) = 3$，方程组有唯一解。\n当 $a = -1$ 时，增广矩阵初等行变换：\n$$\\begin{pmatrix} 1 & 0 & 1 & 2 \\\\ 1 & 2 & -1 & 0 \\\\ 2 & 1 & 1 & b \\end{pmatrix} \\to \\begin{pmatrix} 1 & 0 & 1 & 2 \\\\ 0 & 1 & -1 & -1 \\\\ 0 & 0 & 0 & b-3 \\end{pmatrix}$$\n若 $b \\neq 3$，则 $r(\\boldsymbol{A}) = 2 < r(\\bar{\\boldsymbol{A}}) = 3$，方程组无解；\n若 $b = 3$，则 $r(\\boldsymbol{A}) = r(\\bar{\\boldsymbol{A}}) = 2 < 3$，方程组有无穷多个解。\n(2) 当 $a \\neq -1$ 时，由克拉默法则算得唯一解为：\n$$x_1 = \\frac{2a+b-1}{a+1}, \\quad x_2 = \\frac{2-a-b}{a+1}, \\quad x_3 = \\frac{3-b}{a+1};$$\n当 $a = -1, b = 3$ 时，同解方程组为 $x_1 + x_3 = 2, x_2 - x_3 = -1$，设自由未知量 $x_3 = c$，则 $x_1 = 2-c, x_2 = -1+c$（$c$ 为任意实数）。"
    }
  },
  {
    id: "LAG-TB-CH05-Q04",
    source_type: "textbook",
    source: {
      paper_id: 2005,
      raw_title: "《线性代数与几何》第5章 线性方程组 课后习题",
      clean_title: "《线性代数与几何》第5章 线性方程组 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 5 章 · 习题五 第 4 题",
      page_start: 131,
      page_end: 131
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
        chapter: 5,
        chapter_title: "第5章 线性方程组",
        section: "5.2",
        section_title: "非齐次线性方程组",
        section_slug: "5.2_非齐次线性方程组",
        knowledge_points: ["含参非齐次方程组", "解的判定", "通解"]
      }
    },
    content: {
      stem: "非齐次线性方程组\n$$\\begin{cases} -2x_1 + x_2 + x_3 = -2, \\\\ x_1 - 2x_2 + x_3 = \\lambda, \\\\ x_1 + x_2 - 2x_3 = \\lambda^2, \\end{cases}$$\n当 $\\lambda$ 取何值时有解？并求出它的解。"
    },
    solution: {
      answer: "当 $\\lambda = 1$ 时有解，解为 $\\begin{pmatrix} x_1 \\\\ x_2 \\\\ x_3 \\end{pmatrix} = k \\begin{pmatrix} 1 \\\\ 1 \\\\ 1 \\end{pmatrix} + \\begin{pmatrix} 1 \\\\ 0 \\\\ 0 \\end{pmatrix}$；\n当 $\\lambda = -2$ 时有解，解为 $\\begin{pmatrix} x_1 \\\\ x_2 \\\\ x_3 \\end{pmatrix} = k \\begin{pmatrix} 1 \\\\ 1 \\\\ 1 \\end{pmatrix} + \\begin{pmatrix} 2 \\\\ 2 \\\\ 0 \\end{pmatrix}$（$k$ 为任意实数）。其余 $\\lambda$ 值无解。",
      hints: "观察系数矩阵各行之和为零（秩至多为 2），方程组有解必须各方程等号右端之和也为零，从而定出 $\\lambda$。",
      steps: "三式相加左端为零，即 $0 = -2 + \\lambda + \\lambda^2 = (\\lambda+2)(\\lambda-1)$，故仅当 $\\lambda = 1$ 或 $\\lambda = -2$ 时方程组可能有解。\n(1) 当 $\\lambda = 1$ 时，增广矩阵初等行变换得：\n$$\\begin{pmatrix} 1 & 0 & -1 & 1 \\\\ 0 & 1 & -1 & 0 \\\\ 0 & 0 & 0 & 0 \\end{pmatrix}$$\n取 $x_3 = k$ 为自由未知量，得解为 $\\begin{pmatrix} x_1 \\\\ x_2 \\\\ x_3 \\end{pmatrix} = k \\begin{pmatrix} 1 \\\\ 1 \\\\ 1 \\end{pmatrix} + \\begin{pmatrix} 1 \\\\ 0 \\\\ 0 \\end{pmatrix}$；\n(2) 当 $\\lambda = -2$ 时，增广矩阵初等行变换得：\n$$\\begin{pmatrix} 1 & 0 & -1 & 2 \\\\ 0 & 1 & -1 & 2 \\\\ 0 & 0 & 0 & 0 \\end{pmatrix}$$\n取 $x_3 = k$ 为自由未知量，得解为 $\\begin{pmatrix} x_1 \\\\ x_2 \\\\ x_3 \\end{pmatrix} = k \\begin{pmatrix} 1 \\\\ 1 \\\\ 1 \\end{pmatrix} + \\begin{pmatrix} 2 \\\\ 2 \\\\ 0 \\end{pmatrix}$（$k$ 为任意实数）。"
    }
  },
  {
    id: "LAG-TB-CH05-Q05",
    source_type: "textbook",
    source: {
      paper_id: 2005,
      raw_title: "《线性代数与几何》第5章 线性方程组 课后习题",
      clean_title: "《线性代数与几何》第5章 线性方程组 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 5 章 · 习题五 第 5 题",
      page_start: 131,
      page_end: 131
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 5,
      paper_q_num: 5,
      type: "calc",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 5,
        chapter_title: "第5章 线性方程组",
        section: "5.2",
        section_title: "非齐次线性方程组",
        section_slug: "5.2_非齐次线性方程组",
        knowledge_points: ["含参非齐次方程组", "解的判定", "特征多项式"]
      }
    },
    content: {
      stem: "设\n$$\\begin{cases} (2-\\lambda)x_1 + 2x_2 - 2x_3 = 1, \\\\ 2x_1 + (5-\\lambda)x_2 - 4x_3 = 2, \\\\ -2x_1 - 4x_2 + (5-\\lambda)x_3 = -\\lambda - 1, \\end{cases}$$\n问 $\\lambda$ 取何值时，此方程组有唯一解？无解？有无穷多个解？并在有解时求出它的全部解。"
    },
    solution: {
      answer: "当 $\\lambda \\neq 1$ 且 $\\lambda \\neq 10$ 时有唯一解；当 $\\lambda = 10$ 时无解；当 $\\lambda = 1$ 时有无穷多个解，全部解为\n$$\\begin{pmatrix} x_1 \\\\ x_2 \\\\ x_3 \\end{pmatrix} = k_1 \\begin{pmatrix} -2 \\\\ 1 \\\\ 0 \\end{pmatrix} + k_2 \\begin{pmatrix} 2 \\\\ 0 \\\\ 1 \\end{pmatrix} + \\begin{pmatrix} 1 \\\\ 0 \\\\ 0 \\end{pmatrix} \\quad (k_1, k_2 \\text{ 为任意实数})。$$",
      hints: "计算系数行列式 $|\\boldsymbol{A}| = -(\\lambda-1)^2(\\lambda-10)$，分 $|\\boldsymbol{A}| \\neq 0$ 和 $|\\boldsymbol{A}| = 0$ 讨论增广矩阵的秩。",
      steps: "系数行列式为：\n$$|\\boldsymbol{A}| = \\begin{vmatrix} 2-\\lambda & 2 & -2 \\\\ 2 & 5-\\lambda & -4 \\\\ -2 & -4 & 5-\\lambda \\end{vmatrix} = -(\\lambda-1)^2(\\lambda-10)$$\n(1) 当 $\\lambda \\neq 1$ 且 $\\lambda \\neq 10$ 时，$|\\boldsymbol{A}| \\neq 0$，方程组有唯一解；\n(2) 当 $\\lambda = 10$ 时，增广矩阵初等行变换后出现矛盾方程，故 $r(\\boldsymbol{A}) = 2 < r(\\bar{\\boldsymbol{A}}) = 3$，方程组无解；\n(3) 当 $\\lambda = 1$ 时，增广矩阵为：\n$$\\begin{pmatrix} 1 & 2 & -2 & 1 \\\\ 2 & 4 & -4 & 2 \\\\ -2 & -4 & 4 & -2 \\end{pmatrix} \\to \\begin{pmatrix} 1 & 2 & -2 & 1 \\\\ 0 & 0 & 0 & 0 \\\\ 0 & 0 & 0 & 0 \\end{pmatrix}$$\n$r(\\boldsymbol{A}) = r(\\bar{\\boldsymbol{A}}) = 1 < 3$，方程组有无穷多个解，同解方程为 $x_1 + 2x_2 - 2x_3 = 1$。取自由未知量 $x_2 = k_1, x_3 = k_2$，得全部解为 $\\begin{pmatrix} x_1 \\\\ x_2 \\\\ x_3 \\end{pmatrix} = k_1 \\begin{pmatrix} -2 \\\\ 1 \\\\ 0 \\end{pmatrix} + k_2 \\begin{pmatrix} 2 \\\\ 0 \\\\ 1 \\end{pmatrix} + \\begin{pmatrix} 1 \\\\ 0 \\\\ 0 \\end{pmatrix}$。"
    }
  },
  {
    id: "LAG-TB-CH05-Q06",
    source_type: "textbook",
    source: {
      paper_id: 2005,
      raw_title: "《线性代数与几何》第5章 线性方程组 课后习题",
      clean_title: "《线性代数与几何》第5章 线性方程组 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 5 章 · 习题五 第 6 题",
      page_start: 131,
      page_end: 131
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 6,
      paper_q_num: 6,
      type: "calc",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 5,
        chapter_title: "第5章 线性方程组",
        section: "5.2",
        section_title: "非齐次线性方程组",
        section_slug: "5.2_非齐次线性方程组",
        knowledge_points: ["含参非齐次方程组", "解的判定", "一般解"]
      }
    },
    content: {
      stem: "$a, b$ 取何值时，方程组\n$$\\begin{cases} x_1 + x_2 + x_3 + x_4 = 0, \\\\ x_2 + 2x_3 + 2x_4 = 1, \\\\ -x_2 + (a-3)x_3 - 2x_4 = b, \\\\ 3x_1 + 2x_2 + x_3 + ax_4 = -1 \\end{cases}$$\n有唯一解？无解？有无穷多个解？并在有无穷多个解时求出一般解。"
    },
    solution: {
      answer: "(1) $a \\neq 1$ 时有唯一解；\n(2) $a = 1, b \\neq -1$ 时无解；\n(3) $a = 1, b = -1$ 时有无穷多个解，一般解为\n$$\\boldsymbol{x} = k_1(1, -2, 1, 0)^\\mathrm{T} + k_2(1, -2, 0, 1)^\\mathrm{T} + (-1, 1, 0, 0)^\\mathrm{T} \\quad (k_1, k_2 \\text{ 为任意实数})。$$",
      hints: "对增广矩阵作初等行变换化为阶梯形，考察主元位置及含参数式 $(a-1)x_3$ 与 $b+1$ 的关系。",
      steps: "对增广矩阵施行初等行变换：\n$$\\begin{pmatrix} 1 & 1 & 1 & 1 & 0 \\\\ 0 & 1 & 2 & 2 & 1 \\\\ 0 & -1 & a-3 & -2 & b \\\\ 3 & 2 & 1 & a & -1 \\end{pmatrix} \\to \\begin{pmatrix} 1 & 1 & 1 & 1 & 0 \\\\ 0 & 1 & 2 & 2 & 1 \\\\ 0 & 0 & a-1 & 0 & b+1 \\\\ 0 & 0 & 0 & a-1 & 0 \\end{pmatrix}$$\n(1) 当 $a \\neq 1$ 时，$r(\\boldsymbol{A}) = r(\\bar{\\boldsymbol{A}}) = 4$，方程组有唯一解；\n(2) 当 $a = 1, b \\neq -1$ 时，第 3 行变为 $(0, 0, 0, 0 \\mid b+1)$（其中 $b+1 \\neq 0$），$r(\\boldsymbol{A}) = 2 < r(\\bar{\\boldsymbol{A}}) = 3$，方程组无解；\n(3) 当 $a = 1, b = -1$ 时，$r(\\boldsymbol{A}) = r(\\bar{\\boldsymbol{A}}) = 2 < 4$，方程组有无穷多个解。同解方程组为：\n$$\\begin{cases} x_1 + x_2 + x_3 + x_4 = 0 \\\\ x_2 + 2x_3 + 2x_4 = 1 \\end{cases}$$\n解得 $x_1 = -1 + x_3 + x_4, x_2 = 1 - 2x_3 - 2x_4$。取自由未知量 $x_3 = k_1, x_4 = k_2$，得一般解为 $\\boldsymbol{x} = k_1(1, -2, 1, 0)^\\mathrm{T} + k_2(1, -2, 0, 1)^\\mathrm{T} + (-1, 1, 0, 0)^\\mathrm{T}$。"
    }
  },
  {
    id: "LAG-TB-CH05-Q07",
    source_type: "textbook",
    source: {
      paper_id: 2005,
      raw_title: "《线性代数与几何》第5章 线性方程组 课后习题",
      clean_title: "《线性代数与几何》第5章 线性方程组 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 5 章 · 习题五 第 7 题",
      page_start: 131,
      page_end: 131
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 7,
      paper_q_num: 7,
      type: "calc",
      difficulty: 1,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 5,
        chapter_title: "第5章 线性方程组",
        section: "5.1",
        section_title: "齐次线性方程组",
        section_slug: "5.1_齐次线性方程组",
        knowledge_points: ["矩阵方程AB=O", "齐次线性方程组基础解系", "矩阵的秩"]
      }
    },
    content: {
      stem: "设 $\\boldsymbol{A} = \\begin{pmatrix} 1 & 1 & 2 \\\\ 2 & 2 & 4 \\\\ 3 & 3 & 6 \\end{pmatrix}$，求作一个秩为 $2$ 的方阵 $\\boldsymbol{B}$，使 $\\boldsymbol{A}\\boldsymbol{B} = \\boldsymbol{O}$。"
    },
    solution: {
      answer: "$\\boldsymbol{B} = \\begin{pmatrix} 1 & 2 & 0 \\\\ 1 & 0 & 0 \\\\ -1 & -1 & 0 \\end{pmatrix}$（答案不唯一）。",
      hints: "$\\boldsymbol{A}\\boldsymbol{B} = \\boldsymbol{O}$ 等价于 $\\boldsymbol{B}$ 的每个列向量都是齐次方程组 $\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{0}$ 的解。求出 $\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{0}$ 的基础解系作为 $\\boldsymbol{B}$ 的列。",
      steps: "$\\boldsymbol{A}\\boldsymbol{B} = \\boldsymbol{O}$ 说明 $\\boldsymbol{B}$ 的列向量均为齐次线性方程组 $\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{0}$ 的解。\n方程组 $\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{0}$ 等价于单个方程 $x_1 + x_2 + 2x_3 = 0$。\n其基础解系含有 $3 - r(\\boldsymbol{A}) = 3 - 1 = 2$ 个向量，例如取：\n$$\\boldsymbol{\\xi}_1 = (1, 1, -1)^\\mathrm{T}, \\quad \\boldsymbol{\\xi}_2 = (2, 0, -1)^\\mathrm{T}$$\n令 $\\boldsymbol{B} = (\\boldsymbol{\\xi}_1, \\boldsymbol{\\xi}_2, \\boldsymbol{0})$，即\n$$\\boldsymbol{B} = \\begin{pmatrix} 1 & 2 & 0 \\\\ 1 & 0 & 0 \\\\ -1 & -1 & 0 \\end{pmatrix}$$\n易见 $r(\\boldsymbol{B}) = 2$，且满足 $\\boldsymbol{A}\\boldsymbol{B} = \\boldsymbol{O}$。"
    }
  },
  {
    id: "LAG-TB-CH05-Q08",
    source_type: "textbook",
    source: {
      paper_id: 2005,
      raw_title: "《线性代数与几何》第5章 线性方程组 课后习题",
      clean_title: "《线性代数与几何》第5章 线性方程组 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 5 章 · 习题五 第 8 题",
      page_start: 131,
      page_end: 132
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
        chapter: 5,
        chapter_title: "第5章 线性方程组",
        section: "5.2",
        section_title: "非齐次线性方程组",
        section_slug: "5.2_非齐次线性方程组",
        knowledge_points: ["向量线性表出", "含参线性方程组", "唯一表示"]
      }
    },
    content: {
      stem: "设 $\\boldsymbol{\\alpha}_1 = (1, 0, 2, 3)^\\mathrm{T}, \\boldsymbol{\\alpha}_2 = (1, 1, 3, 5)^\\mathrm{T}, \\boldsymbol{\\alpha}_3 = (1, -1, a+2, 1)^\\mathrm{T}, \\boldsymbol{\\alpha}_4 = (1, 2, 4, a+8)^\\mathrm{T}, \\boldsymbol{\\beta} = (1, 1, b+3, 5)^\\mathrm{T}$。\n(1) $a, b$ 为何值时，$\\boldsymbol{\\beta}$ 不能由 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3, \\boldsymbol{\\alpha}_4$ 线性表出；\n(2) $a, b$ 为何值时，$\\boldsymbol{\\beta}$ 可以由 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3, \\boldsymbol{\\alpha}_4$ 线性表出，且表示法唯一，写出表示式。",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "$a, b$ 为何值时，$\\boldsymbol{\\beta}$ 不能由 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3, \\boldsymbol{\\alpha}_4$ 线性表出？",
          answer: "$a = -1, b \\neq 0$ 时，$\\boldsymbol{\\beta}$ 不能表为 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3, \\boldsymbol{\\alpha}_4$ 的线性组合。"
        },
        {
          sub_id: "(2)",
          stem: "$a, b$ 为何值时，$\\boldsymbol{\\beta}$ 可以由 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3, \\boldsymbol{\\alpha}_4$ 线性表出，且表示法唯一，写出表示式。",
          answer: "$a \\neq -1$ 时，表示法唯一，$\\boldsymbol{\\beta} = \\frac{-2b}{a+1} \\boldsymbol{\\alpha}_1 + \\frac{a+b+1}{a+1} \\boldsymbol{\\alpha}_2 + \\frac{b}{a+1} \\boldsymbol{\\alpha}_3$。"
        }
      ]
    },
    solution: {
      answer: "(1) $a = -1, b \\neq 0$ 时，$\\boldsymbol{\\beta}$ 不能由 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3, \\boldsymbol{\\alpha}_4$ 线性表出；\n(2) $a \\neq -1$ 时，$\\boldsymbol{\\beta}$ 可以由 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3, \\boldsymbol{\\alpha}_4$ 线性表出且表示法唯一，表示式为：\n$$\\boldsymbol{\\beta} = \\frac{-2b}{a+1}\\boldsymbol{\\alpha}_1 + \\frac{a+b+1}{a+1}\\boldsymbol{\\alpha}_2 + \\frac{b}{a+1}\\boldsymbol{\\alpha}_3。$$",
      hints: "设 $x_1 \\boldsymbol{\\alpha}_1 + x_2 \\boldsymbol{\\alpha}_2 + x_3 \\boldsymbol{\\alpha}_3 + x_4 \\boldsymbol{\\alpha}_4 = \\boldsymbol{\\beta}$，将其化为增广矩阵作初等行变换，讨论系数矩阵与增广矩阵的秩。",
      steps: "设 $x_1 \\boldsymbol{\\alpha}_1 + x_2 \\boldsymbol{\\alpha}_2 + x_3 \\boldsymbol{\\alpha}_3 + x_4 \\boldsymbol{\\alpha}_4 = \\boldsymbol{\\beta}$，增广矩阵施行初等行变换：\n$$\\begin{pmatrix} 1 & 1 & 1 & 1 & 1 \\\\ 0 & 1 & -1 & 2 & 1 \\\\ 2 & 3 & a+2 & 4 & b+3 \\\\ 3 & 5 & 1 & a+8 & 5 \\end{pmatrix} \\to \\begin{pmatrix} 1 & 1 & 1 & 1 & 1 \\\\ 0 & 1 & -1 & 2 & 1 \\\\ 0 & 0 & a+1 & 0 & b \\\\ 0 & 0 & 0 & a+1 & 0 \\end{pmatrix}$$\n(1) 当 $a = -1, b \\neq 0$ 时，第 3 行出现 $(0, 0, 0, 0 \\mid b)$，系数矩阵的秩为 $2$，增广矩阵的秩为 $3$，方程组无解，即 $\\boldsymbol{\\beta}$ 不能线性表出；\n(2) 当 $a \\neq -1$ 时，系数矩阵的秩为 $4$，列向量线性无关，方程组有唯一解。\n由第 4 行得 $x_4 = 0$；由第 3 行得 $x_3 = \\frac{b}{a+1}$；代入第 2 行得 $x_2 = 1 + x_3 = \\frac{a+b+1}{a+1}$；代入第 1 行得 $x_1 = 1 - x_2 - x_3 = \\frac{-2b}{a+1}$。\n故表示式唯一，为 $\\boldsymbol{\\beta} = \\frac{-2b}{a+1} \\boldsymbol{\\alpha}_1 + \\frac{a+b+1}{a+1} \\boldsymbol{\\alpha}_2 + \\frac{b}{a+1} \\boldsymbol{\\alpha}_3$。"
    }
  },
  {
    id: "LAG-TB-CH05-Q09",
    source_type: "textbook",
    source: {
      paper_id: 2005,
      raw_title: "《线性代数与几何》第5章 线性方程组 课后习题",
      clean_title: "《线性代数与几何》第5章 线性方程组 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 5 章 · 习题五 第 9 题",
      page_start: 132,
      page_end: 132
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 9,
      paper_q_num: 9,
      type: "proof",
      difficulty: 2,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 5,
        chapter_title: "第5章 线性方程组",
        section: "5.1",
        section_title: "齐次线性方程组",
        section_slug: "5.1_齐次线性方程组",
        knowledge_points: ["齐次线性方程组非零解", "矩阵方程AB=O", "行列式等于零"]
      }
    },
    content: {
      stem: "$\\boldsymbol{A}$ 为 $n$ 阶矩阵，证明存在 $n$ 阶非零矩阵 $\\boldsymbol{B}$，使 $\\boldsymbol{A}\\boldsymbol{B} = \\boldsymbol{O}$ 的充分必要条件是 $|\\boldsymbol{A}| = 0$。"
    },
    solution: {
      answer: "证明略。",
      hints: "将矩阵乘积 $\\boldsymbol{A}\\boldsymbol{B} = \\boldsymbol{O}$ 按列分块，转化为齐次线性方程组 $\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{0}$ 是否有非零解的充要条件。",
      steps: "必要性：若存在 $n$ 阶非零矩阵 $\\boldsymbol{B}$ 使 $\\boldsymbol{A}\\boldsymbol{B} = \\boldsymbol{O}$。用反证法，假设 $|\\boldsymbol{A}| \\neq 0$，则 $\\boldsymbol{A}$ 可逆，在 $\\boldsymbol{A}\\boldsymbol{B} = \\boldsymbol{O}$ 两端左乘 $\\boldsymbol{A}^{-1}$ 可得 $\\boldsymbol{B} = \\boldsymbol{O}$，与 $\\boldsymbol{B}$ 是非零矩阵矛盾。故必有 $|\\boldsymbol{A}| = 0$。\n\n充分性：若 $|\\boldsymbol{A}| = 0$，则齐次线性方程组 $\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{0}$ 存在非零解 $\\boldsymbol{x}_0 \\neq \\boldsymbol{0}$。构造 $n$ 阶矩阵 $\\boldsymbol{B} = (\\boldsymbol{x}_0, \\boldsymbol{0}, \\cdots, \\boldsymbol{0})$，由于第一列 $\\boldsymbol{x}_0 \\neq \\boldsymbol{0}$，故 $\\boldsymbol{B} \\neq \\boldsymbol{O}$。且 $\\boldsymbol{A}\\boldsymbol{B} = (\\boldsymbol{A}\\boldsymbol{x}_0, \\boldsymbol{0}, \\cdots, \\boldsymbol{0}) = \\boldsymbol{O}$。故存在 $n$ 阶非零矩阵 $\\boldsymbol{B}$ 使 $\\boldsymbol{A}\\boldsymbol{B} = \\boldsymbol{O}$。"
    }
  },
  {
    id: "LAG-TB-CH05-Q10",
    source_type: "textbook",
    source: {
      paper_id: 2005,
      raw_title: "《线性代数与几何》第5章 线性方程组 课后习题",
      clean_title: "《线性代数与几何》第5章 线性方程组 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 5 章 · 习题五 第 10 题",
      page_start: 132,
      page_end: 132
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 10,
      paper_q_num: 10,
      type: "calc",
      difficulty: 2,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 5,
        chapter_title: "第5章 线性方程组",
        section: "5.1",
        section_title: "齐次线性方程组",
        section_slug: "5.1_齐次线性方程组",
        knowledge_points: ["已知基础解系求齐次线性方程组", "方程组的反问题"]
      }
    },
    content: {
      stem: "求一个齐次线性方程组，使它的基础解系为\n$$\\boldsymbol{\\xi}_1 = (0, 1, 2, 3)^\\mathrm{T}, \\quad \\boldsymbol{\\xi}_2 = (3, 2, 1, 0)^\\mathrm{T}。$$"
    },
    solution: {
      answer: "$\\begin{cases} x_1 - 2x_2 + x_3 = 0, \\\\ 2x_1 - 3x_2 + x_4 = 0 \\end{cases}$（答案不唯一）。",
      hints: "设所求方程为 $\\sum a_i x_i = 0$，将 $\\boldsymbol{\\xi}_1, \\boldsymbol{\\xi}_2$ 代入建立关于系数矩阵行向量的齐次线性方程组，求其基础解系作为所求方程组的系数行向量。",
      steps: "设所求方程组为 $\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{0}$。因未知量个数为 $n = 4$，基础解系含 $2$ 个解向量，故系数矩阵的秩应为 $r(\\boldsymbol{A}) = 4 - 2 = 2$。\n方程组的行向量 $\\boldsymbol{a} = (a_1, a_2, a_3, a_4)$ 必与 $\\boldsymbol{\\xi}_1, \\boldsymbol{\\xi}_2$ 正交，即满足：\n$$\\begin{cases} \\boldsymbol{a} \\boldsymbol{\\xi}_1 = a_2 + 2a_3 + 3a_4 = 0 \\\\ \\boldsymbol{a} \\boldsymbol{\\xi}_2 = 3a_1 + 2a_2 + a_3 = 0 \\end{cases}$$\n该关于 $(a_1, a_2, a_3, a_4)$ 的方程组矩阵化简：\n$$\\begin{pmatrix} 3 & 2 & 1 & 0 \\\\ 0 & 1 & 2 & 3 \\end{pmatrix} \\to \\begin{pmatrix} 1 & 0 & -1 & -2 \\\\ 0 & 1 & 2 & 3 \\end{pmatrix}$$\n取自由未知量为 $a_3, a_4$：\n当 $a_3 = 1, a_4 = 0$ 时，得 $\\boldsymbol{a}^{(1)} = (1, -2, 1, 0)$，对应方程 $x_1 - 2x_2 + x_3 = 0$；\n当 $a_3 = 0, a_4 = 1$ 时，得 $\\boldsymbol{a}^{(2)} = (2, -3, 0, 1)$，对应方程 $2x_1 - 3x_2 + x_4 = 0$。\n故所求齐次线性方程组可取为：\n$$\\begin{cases} x_1 - 2x_2 + x_3 = 0 \\\\ 2x_1 - 3x_2 + x_4 = 0 \\end{cases}$$"
    }
  }
];

module.exports = { ch05QuestionsPart1 };
