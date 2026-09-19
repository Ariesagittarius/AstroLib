// scripts/vision_reconstruct/ch05_data_part2.cjs

const ch05QuestionsPart2 = [
  {
    id: "LAG-TB-CH05-Q11",
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
      source_desc: "《线性代数与几何》第 5 章 · 习题五 第 11 题",
      page_start: 132,
      page_end: 132
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
        chapter: 5,
        chapter_title: "第5章 线性方程组",
        section: "5.2",
        section_title: "非齐次线性方程组",
        section_slug: "5.2_非齐次线性方程组",
        knowledge_points: ["非齐次线性方程组解的结构", "通解"]
      }
    },
    content: {
      stem: "设非齐次线性方程组 $\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{b}$，系数矩阵 $\\boldsymbol{A}$ 为 $5 \\times 3$ 矩阵，$r(\\boldsymbol{A}) = 2$。且 $\\boldsymbol{\\eta}_1, \\boldsymbol{\\eta}_2$ 是该方程组的两个解，有 $\\boldsymbol{\\eta}_1 + \\boldsymbol{\\eta}_2 = (1, 3, 0)^\\mathrm{T}, 2\\boldsymbol{\\eta}_1 + 3\\boldsymbol{\\eta}_2 = (2, 5, 1)^\\mathrm{T}$，求该方程组的通解。"
    },
    solution: {
      answer: "$\\boldsymbol{x} = k(1, 5, -2)^\\mathrm{T} + (0, -1, 1)^\\mathrm{T}$（$k$ 为任意实数）。",
      hints: "由题给条件解出特解 $\\boldsymbol{\\eta}_1$ 与 $\\boldsymbol{\\eta}_2$，两个非齐次解之差 $\\boldsymbol{\\eta}_1 - \\boldsymbol{\\eta}_2$ 即为对应齐次方程组的非零解，结合 $n - r(\\boldsymbol{A}) = 3 - 2 = 1$ 得到基础解系。",
      steps: "由 $\\begin{cases} \\boldsymbol{\\eta}_1 + \\boldsymbol{\\eta}_2 = (1, 3, 0)^\\mathrm{T} \\\\ 2\\boldsymbol{\\eta}_1 + 3\\boldsymbol{\\eta}_2 = (2, 5, 1)^\\mathrm{T} \\end{cases}$，解得：\n$$\\boldsymbol{\\eta}_2 = (2, 5, 1)^\\mathrm{T} - 2(1, 3, 0)^\\mathrm{T} = (0, -1, 1)^\\mathrm{T}$$\n$$\\boldsymbol{\\eta}_1 = (1, 3, 0)^\\mathrm{T} - \\boldsymbol{\\eta}_2 = (1, 4, -1)^\\mathrm{T}$$\n$\\boldsymbol{\\eta}_2 = (0, -1, 1)^\\mathrm{T}$ 是非齐次方程组的一个特解。\n对应齐次线性方程组的未知数个数为 $n = 3$，而 $r(\\boldsymbol{A}) = 2$，故齐次方程组基础解系包含 $3 - 2 = 1$ 个线性无关解。\n非齐次方程组两个特解之差即为齐次方程组的解：\n$$\\boldsymbol{\\xi} = \\boldsymbol{\\eta}_1 - \\boldsymbol{\\eta}_2 = (1, 4, -1)^\\mathrm{T} - (0, -1, 1)^\\mathrm{T} = (1, 5, -2)^\\mathrm{T} \\neq \\boldsymbol{0}$$\n故 $\\boldsymbol{\\xi}$ 构成齐次方程组的基础解系。\n所以方程组的通解为 $\\boldsymbol{x} = k(1, 5, -2)^\\mathrm{T} + (0, -1, 1)^\\mathrm{T}$（$k$ 为任意实数）。"
    }
  },
  {
    id: "LAG-TB-CH05-Q12",
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
      source_desc: "《线性代数与几何》第 5 章 · 习题五 第 12 题",
      page_start: 132,
      page_end: 132
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 12,
      paper_q_num: 12,
      type: "judge",
      difficulty: 2,
      score: 10
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 5,
        chapter_title: "第5章 线性方程组",
        section: "5.2",
        section_title: "非齐次线性方程组",
        section_slug: "5.2_非齐次线性方程组",
        knowledge_points: ["解的存在性与唯一性", "解集与解空间", "矩阵的秩与同解方程组"]
      }
    },
    content: {
      stem: "判断下列命题的正误，试说明判断理由。\n\n(1) 若齐次线性方程组 $\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{0}$ 有无穷多个解，则非齐次线性方程组 $\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{b}$ 有解；\n\n(2) 非齐次线性方程组 $\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{b}$ 的解集构成一个解空间；\n\n(3) 设 $\\boldsymbol{A}$ 为 $m \\times n$ 矩阵，$r(\\boldsymbol{A}) = m$，则非齐次线性方程组 $\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{b}$ 有解；\n\n(4) 设 $\\boldsymbol{A}$ 为 $m \\times n$ 矩阵，齐次线性方程组 $\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{0}$ 仅有零解的充分必要条件是 $\\boldsymbol{A}$ 的 $n$ 个列向量线性无关；\n\n(5) $\\boldsymbol{A}, \\boldsymbol{B}$ 为 $n$ 阶方阵，齐次线性方程组 $\\boldsymbol{A}\\boldsymbol{B}\\boldsymbol{x} = \\boldsymbol{0}$ 与 $\\boldsymbol{B}\\boldsymbol{x} = \\boldsymbol{0}$ 同解，则 $r(\\boldsymbol{A}\\boldsymbol{B}) = r(\\boldsymbol{B})$。",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "若齐次线性方程组 $\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{0}$ 有无穷多个解，则非齐次线性方程组 $\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{b}$ 有解。",
          answer: "错误"
        },
        {
          sub_id: "(2)",
          stem: "非齐次线性方程组 $\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{b}$ 的解集构成一个解空间。",
          answer: "错误"
        },
        {
          sub_id: "(3)",
          stem: "设 $\\boldsymbol{A}$ 为 $m \\times n$ 矩阵，$r(\\boldsymbol{A}) = m$，则非齐次线性方程组 $\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{b}$ 有解。",
          answer: "正确"
        },
        {
          sub_id: "(4)",
          stem: "设 $\\boldsymbol{A}$ 为 $m \\times n$ 矩阵，齐次线性方程组 $\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{0}$ 仅有零解的充分必要条件是 $\\boldsymbol{A}$ 的 $n$ 个列向量线性无关。",
          answer: "正确"
        },
        {
          sub_id: "(5)",
          stem: "$\\boldsymbol{A}, \\boldsymbol{B}$ 为 $n$ 阶方阵，齐次线性方程组 $\\boldsymbol{A}\\boldsymbol{B}\\boldsymbol{x} = \\boldsymbol{0}$ 与 $\\boldsymbol{B}\\boldsymbol{x} = \\boldsymbol{0}$ 同解，则 $r(\\boldsymbol{A}\\boldsymbol{B}) = r(\\boldsymbol{B})$。",
          answer: "正确"
        }
      ]
    },
    solution: {
      answer: "正确的为 (3)(4)(5)，错误的为 (1)(2)。",
      hints: "利用线性方程组有解判别定理、向量空间封闭性定义、齐次线性方程组解空间维数定理逐项进行辨析。",
      steps: "(1) 错误。齐次方程组有无穷多解仅说明 $r(\\boldsymbol{A}) < n$，但若 $r(\\boldsymbol{A}) < r(\\boldsymbol{A}, \\boldsymbol{b})$，非齐次方程组依然无解；\n\n(2) 错误。若 $\\boldsymbol{x}_1, \\boldsymbol{x}_2$ 为 $\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{b}$ 的解，则 $\\boldsymbol{A}(\\boldsymbol{x}_1 + \\boldsymbol{x}_2) = 2\\boldsymbol{b} \\neq \\boldsymbol{b}$（当 $\\boldsymbol{b} \\neq \\boldsymbol{0}$ 时），且零向量不是解，解集对加法和数乘不封闭，不构成向量空间；\n\n(3) 正确。增广矩阵 $(\\boldsymbol{A}, \\boldsymbol{b})$ 的行数为 $m$，故 $m = r(\\boldsymbol{A}) \\le r(\\boldsymbol{A}, \\boldsymbol{b}) \\le m$，必有 $r(\\boldsymbol{A}) = r(\\boldsymbol{A}, \\boldsymbol{b}) = m$，方程组恒有解；\n\n(4) 正确。记 $\\boldsymbol{A} = (\\boldsymbol{\\alpha}_1, \\cdots, \\boldsymbol{\\alpha}_n)$，$\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{0}$ 即 $x_1\\boldsymbol{\\alpha}_1 + \\cdots + x_n\\boldsymbol{\\alpha}_n = \\boldsymbol{0}$。仅有零解即表明除全为零外无其他组合为零，等价于列向量组线性无关；\n\n(5) 正确。两齐次方程组同解，则它们的解空间相同，维数相等，即 $n - r(\\boldsymbol{A}\\boldsymbol{B}) = n - r(\\boldsymbol{B})$，从而 $r(\\boldsymbol{A}\\boldsymbol{B}) = r(\\boldsymbol{B})$。"
    }
  },
  {
    id: "LAG-TB-CH05-Q13",
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
      source_desc: "《线性代数与几何》第 5 章 · 习题五 第 13 题",
      page_start: 132,
      page_end: 132
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 13,
      paper_q_num: 13,
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
        knowledge_points: ["Sylvester秩不等式", "齐次线性方程组解空间维数", "AB=O"]
      }
    },
    content: {
      stem: "设 $\\boldsymbol{A}, \\boldsymbol{B}$ 都是 $n$ 阶方阵，且 $\\boldsymbol{A}\\boldsymbol{B} = \\boldsymbol{O}$，证明 $r(\\boldsymbol{A}) + r(\\boldsymbol{B}) \\le n$。"
    },
    solution: {
      answer: "证明略。",
      hints: "将 $\\boldsymbol{B}$ 按列分块 $\\boldsymbol{B} = (\\boldsymbol{\\beta}_1, \\boldsymbol{\\beta}_2, \\cdots, \\boldsymbol{\\beta}_n)$，利用 $\\boldsymbol{A}\\boldsymbol{\\beta}_j = \\boldsymbol{0}$ 说明 $\\boldsymbol{B}$ 的列向量全部属于齐次方程组 $\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{0}$ 的解空间。",
      steps: "记 $\\boldsymbol{B} = (\\boldsymbol{\\beta}_1, \\boldsymbol{\\beta}_2, \\cdots, \\boldsymbol{\\beta}_n)$。由 $\\boldsymbol{A}\\boldsymbol{B} = \\boldsymbol{O}$ 得：\n$$\\boldsymbol{A}\\boldsymbol{\\beta}_j = \\boldsymbol{0}, \\quad j = 1, 2, \\cdots, n$$\n这说明 $\\boldsymbol{B}$ 的每个列向量 $\\boldsymbol{\\beta}_j$ 都是齐次线性方程组 $\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{0}$ 的解。\n因此，由 $\\boldsymbol{B}$ 的列向量生成的向量空间 $L(\\boldsymbol{\\beta}_1, \\cdots, \\boldsymbol{\\beta}_n)$ 是 $\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{0}$ 的解空间 $S$ 的子空间。\n所以：\n$$\\dim L(\\boldsymbol{\\beta}_1, \\cdots, \\boldsymbol{\\beta}_n) \\le \\dim S$$\n而 $\\dim L(\\boldsymbol{\\beta}_1, \\cdots, \\boldsymbol{\\beta}_n) = r(\\boldsymbol{B})$，$\\dim S = n - r(\\boldsymbol{A})$。\n故 $r(\\boldsymbol{B}) \\le n - r(\\boldsymbol{A})$，即 $r(\\boldsymbol{A}) + r(\\boldsymbol{B}) \\le n$。"
    }
  },
  {
    id: "LAG-TB-CH05-Q14",
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
      source_desc: "《线性代数与几何》第 5 章 · 习题五 第 14 题",
      page_start: 132,
      page_end: 132
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
        chapter: 5,
        chapter_title: "第5章 线性方程组",
        section: "5.1",
        section_title: "齐次线性方程组",
        section_slug: "5.1_齐次线性方程组",
        knowledge_points: ["幂等矩阵", "矩阵秩的性质", "空间直和分解"]
      }
    },
    content: {
      stem: "若 $n$ 阶方阵 $\\boldsymbol{A}$ 满足 $\\boldsymbol{A}^2 = \\boldsymbol{A}$，证明 $r(\\boldsymbol{A}) + r(\\boldsymbol{A} - \\boldsymbol{E}) = n$。"
    },
    solution: {
      answer: "证明略。",
      hints: "由 $\\boldsymbol{A}^2 = \\boldsymbol{A}$ 得 $\\boldsymbol{A}(\\boldsymbol{E} - \\boldsymbol{A}) = \\boldsymbol{O}$，利用第 13 题的不等式及恒等式 $\\boldsymbol{E} = \\boldsymbol{A} + (\\boldsymbol{E} - \\boldsymbol{A})$ 两面夹逼。",
      steps: "一方面，由 $\\boldsymbol{A}^2 = \\boldsymbol{A}$ 可得 $\\boldsymbol{A}(\\boldsymbol{A} - \\boldsymbol{E}) = \\boldsymbol{A}^2 - \\boldsymbol{A} = \\boldsymbol{O}$。\n根据第 13 题结论，两个矩阵相乘为零矩阵，则它们的秩之和不大于矩阵阶数，即：\n$$r(\\boldsymbol{A}) + r(\\boldsymbol{A} - \\boldsymbol{E}) \\le n$$\n另一方面，注意到矩阵恒等式 $\\boldsymbol{E} = \\boldsymbol{A} - (\\boldsymbol{A} - \\boldsymbol{E})$，由矩阵和的秩性质得：\n$$n = r(\\boldsymbol{E}) = r(\\boldsymbol{A} - (\\boldsymbol{A} - \\boldsymbol{E})) \\le r(\\boldsymbol{A}) + r(-(\\boldsymbol{A} - \\boldsymbol{E})) = r(\\boldsymbol{A}) + r(\\boldsymbol{A} - \\boldsymbol{E})$$\n即 $r(\\boldsymbol{A}) + r(\\boldsymbol{A} - \\boldsymbol{E}) \\ge n$。\n综合两方面不等式，必有 $r(\\boldsymbol{A}) + r(\\boldsymbol{A} - \\boldsymbol{E}) = n$。"
    }
  },
  {
    id: "LAG-TB-CH05-Q15",
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
      source_desc: "《线性代数与几何》第 5 章 · 习题五 第 15 题",
      page_start: 132,
      page_end: 132
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 15,
      paper_q_num: 15,
      type: "proof",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 5,
        chapter_title: "第5章 线性方程组",
        section: "5.1",
        section_title: "齐次线性方程组",
        section_slug: "5.1_齐次线性方程组",
        knowledge_points: ["伴随矩阵的秩", "矩阵方程", "解空间维数"]
      }
    },
    content: {
      stem: "设 $\\boldsymbol{A}$ 为 $n$ 阶方阵，$\\boldsymbol{A}^*$ 为 $\\boldsymbol{A}$ 的伴随矩阵，证明：\n$$r(\\boldsymbol{A}^*) = \\begin{cases} n, & r(\\boldsymbol{A}) = n, \\\\ 1, & r(\\boldsymbol{A}) = n - 1, \\\\ 0, & r(\\boldsymbol{A}) < n - 1. \\end{cases}$$"
    },
    solution: {
      answer: "证明略。",
      hints: "利用伴随矩阵基本公式 $\\boldsymbol{A}\\boldsymbol{A}^* = |\\boldsymbol{A}|\\boldsymbol{E}$，分三种情况讨论 $|\\boldsymbol{A}|$ 以及 $n-1$ 阶子式是否全为零。",
      steps: "(1) 当 $r(\\boldsymbol{A}) = n$ 时，$|\\boldsymbol{A}| \\neq 0$。由 $\\boldsymbol{A}\\boldsymbol{A}^* = |\\boldsymbol{A}|\\boldsymbol{E}$ 两边取行列式得 $|\\boldsymbol{A}| |\\boldsymbol{A}^*| = |\\boldsymbol{A}|^n$，因 $|\\boldsymbol{A}| \\neq 0$，故 $|\\boldsymbol{A}^*| = |\\boldsymbol{A}|^{n-1} \\neq 0$，所以 $r(\\boldsymbol{A}^*) = n$；\n\n(2) 当 $r(\\boldsymbol{A}) = n - 1$ 时，一方面 $|\\boldsymbol{A}| = 0$，故 $\\boldsymbol{A}\\boldsymbol{A}^* = \\boldsymbol{O}$。由第 13 题结论：\n$$r(\\boldsymbol{A}) + r(\\boldsymbol{A}^*) \\le n \\implies r(\\boldsymbol{A}^*) \\le n - r(\\boldsymbol{A}) = 1$$\n另一方面，因为 $r(\\boldsymbol{A}) = n - 1$，所以 $\\boldsymbol{A}$ 至少有一个 $n - 1$ 阶代数余子式不为零，即 $\\boldsymbol{A}^* \\neq \\boldsymbol{O}$，故 $r(\\boldsymbol{A}^*) \\ge 1$。综合得 $r(\\boldsymbol{A}^*) = 1$；\n\n(3) 当 $r(\\boldsymbol{A}) < n - 1$ 时，$\\boldsymbol{A}$ 的所有 $n - 1$ 阶子式全为零，因此 $\\boldsymbol{A}$ 的每个代数余子式全为零，即 $\\boldsymbol{A}^* = \\boldsymbol{O}$，故 $r(\\boldsymbol{A}^*) = 0$。"
    }
  },
  {
    id: "LAG-TB-CH05-Q16",
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
      source_desc: "《线性代数与几何》第 5 章 · 习题五 第 16 题",
      page_start: 132,
      page_end: 132
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 16,
      paper_q_num: 16,
      type: "proof",
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
        knowledge_points: ["非齐次特解与齐次基础解系", "线性无关证明", "解的结构"]
      }
    },
    content: {
      stem: "设 $\\boldsymbol{\\eta}^*$ 是非齐次线性方程组 $\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{b}$ 的一个解，$\\boldsymbol{\\xi}_1, \\boldsymbol{\\xi}_2, \\cdots, \\boldsymbol{\\xi}_{n-r}$ 是对应的齐次线性方程组的一个基础解系。证明：\n\n(1) $\\boldsymbol{\\eta}^*, \\boldsymbol{\\xi}_1, \\boldsymbol{\\xi}_2, \\cdots, \\boldsymbol{\\xi}_{n-r}$ 线性无关；\n\n(2) $\\boldsymbol{\\eta}^*, \\boldsymbol{\\eta}^* + \\boldsymbol{\\xi}_1, \\boldsymbol{\\eta}^* + \\boldsymbol{\\xi}_2, \\cdots, \\boldsymbol{\\eta}^* + \\boldsymbol{\\xi}_{n-r}$ 线性无关。",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "证明 $\\boldsymbol{\\eta}^*, \\boldsymbol{\\xi}_1, \\boldsymbol{\\xi}_2, \\cdots, \\boldsymbol{\\xi}_{n-r}$ 线性无关。",
          answer: "证明略。"
        },
        {
          sub_id: "(2)",
          stem: "证明 $\\boldsymbol{\\eta}^*, \\boldsymbol{\\eta}^* + \\boldsymbol{\\xi}_1, \\boldsymbol{\\eta}^* + \\boldsymbol{\\xi}_2, \\cdots, \\boldsymbol{\\eta}^* + \\boldsymbol{\\xi}_{n-r}$ 线性无关。",
          answer: "证明略。"
        }
      ]
    },
    solution: {
      answer: "证明略。",
      hints: "利用线性无关定义设组合为零，两端左乘矩阵 $\\boldsymbol{A}$，利用 $\\boldsymbol{A}\\boldsymbol{\\xi}_i = \\boldsymbol{0}$ 及 $\\boldsymbol{A}\\boldsymbol{\\eta}^* = \\boldsymbol{b} \\neq \\boldsymbol{0}$ 导出组合系数为零。",
      steps: "(1) 设 $k_0 \\boldsymbol{\\eta}^* + k_1 \\boldsymbol{\\xi}_1 + k_2 \\boldsymbol{\\xi}_2 + \\cdots + k_{n-r} \\boldsymbol{\\xi}_{n-r} = \\boldsymbol{0}$。\n两边左乘矩阵 $\\boldsymbol{A}$，因为 $\\boldsymbol{A}\\boldsymbol{\\xi}_i = \\boldsymbol{0} \\ (i=1, 2, \\cdots, n-r)$，$\\boldsymbol{A}\\boldsymbol{\\eta}^* = \\boldsymbol{b}$，得：\n$$k_0 \\boldsymbol{b} = \\boldsymbol{0}$$\n因为方程组是非齐次的，$\\boldsymbol{b} \\neq \\boldsymbol{0}$，所以必有 $k_0 = 0$。\n代回原式得 $k_1 \\boldsymbol{\\xi}_1 + k_2 \\boldsymbol{\\xi}_2 + \\cdots + k_{n-r} \\boldsymbol{\\xi}_{n-r} = \\boldsymbol{0}$。\n又因为 $\\boldsymbol{\\xi}_1, \\boldsymbol{\\xi}_2, \\cdots, \\boldsymbol{\\xi}_{n-r}$ 构成基础解系，线性无关，所以 $k_1 = k_2 = \\cdots = k_{n-r} = 0$。\n因此 $\\boldsymbol{\\eta}^*, \\boldsymbol{\\xi}_1, \\boldsymbol{\\xi}_2, \\cdots, \\boldsymbol{\\xi}_{n-r}$ 线性无关。\n\n(2) 记向量组 $\\mathrm{I}$ 为 $\\boldsymbol{\\eta}^*, \\boldsymbol{\\xi}_1, \\cdots, \\boldsymbol{\\xi}_{n-r}$，向量组 $\\mathrm{II}$ 为 $\\boldsymbol{\\eta}^*, \\boldsymbol{\\eta}^* + \\boldsymbol{\\xi}_1, \\cdots, \\boldsymbol{\\eta}^* + \\boldsymbol{\\xi}_{n-r}$。\n由线性表示关系有：\n$$\\begin{pmatrix} \\boldsymbol{\\eta}^*, & \\boldsymbol{\\eta}^* + \\boldsymbol{\\xi}_1, & \\cdots, & \\boldsymbol{\\eta}^* + \\boldsymbol{\\xi}_{n-r} \\end{pmatrix} = \\begin{pmatrix} \\boldsymbol{\\eta}^*, & \\boldsymbol{\\xi}_1, & \\cdots, & \\boldsymbol{\\xi}_{n-r} \\end{pmatrix} \\begin{pmatrix} 1 & 1 & \\cdots & 1 \\\\ 0 & 1 & \\cdots & 0 \\\\ \\vdots & \\vdots & \\ddots & \\vdots \\\\ 0 & 0 & \\cdots & 1 \\end{pmatrix}$$\n变换矩阵为上三角矩阵，主对角线元素全为 $1$，其行列式为 $1 \\neq 0$，可逆。\n由于向量组 $\\mathrm{I}$ 线性无关，故经过可逆线性变换得到的向量组 $\\mathrm{II}$ 也线性无关。"
    }
  },
  {
    id: "LAG-TB-CH05-Q17",
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
      source_desc: "《线性代数与几何》第 5 章 · 习题五 第 17 题",
      page_start: 132,
      page_end: 132
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
        chapter: 5,
        chapter_title: "第5章 线性方程组",
        section: "5.2",
        section_title: "非齐次线性方程组",
        section_slug: "5.2_非齐次线性方程组",
        knowledge_points: ["仿射组合", "非齐次线性方程组通解结构", "线性无关解"]
      }
    },
    content: {
      stem: "设非齐次线性方程组 $\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{b}$ 的系数矩阵的秩为 $r$，$\\boldsymbol{\\eta}_1, \\boldsymbol{\\eta}_2, \\cdots, \\boldsymbol{\\eta}_{n-r+1}$ 是它的 $n-r+1$ 个线性无关解（由题 16 知确有 $n-r+1$ 个线性无关解）。试证它的任一解可表示为\n$$\\boldsymbol{x} = k_1 \\boldsymbol{\\eta}_1 + k_2 \\boldsymbol{\\eta}_2 + \\cdots + k_{n-r+1} \\boldsymbol{\\eta}_{n-r+1} \\quad (\\text{其中 } k_1 + k_2 + \\cdots + k_{n-r+1} = 1)。$$"
    },
    solution: {
      answer: "证明略。",
      hints: "取 $\\boldsymbol{\\eta}_1$ 为基准特解，证明 $\\boldsymbol{\\eta}_2 - \\boldsymbol{\\eta}_1, \\cdots, \\boldsymbol{\\eta}_{n-r+1} - \\boldsymbol{\\eta}_1$ 构成对应齐次方程组的基础解系，将任一解表示为特解与导出组通解之和，再整理系数使得总和为 1。",
      steps: "任取非齐次方程组的一个解 $\\boldsymbol{x}$，令 $\\boldsymbol{\\xi}_i = \\boldsymbol{\\eta}_{i+1} - \\boldsymbol{\\eta}_1 \\ (i = 1, 2, \\cdots, n-r)$。\n易知 $\\boldsymbol{A}\\boldsymbol{\\xi}_i = \\boldsymbol{A}\\boldsymbol{\\eta}_{i+1} - \\boldsymbol{A}\\boldsymbol{\\eta}_1 = \\boldsymbol{b} - \\boldsymbol{b} = \\boldsymbol{0}$，且由 $\\boldsymbol{\\eta}_1, \\cdots, \\boldsymbol{\\eta}_{n-r+1}$ 线性无关可证明 $\\boldsymbol{\\xi}_1, \\cdots, \\boldsymbol{\\xi}_{n-r}$ 线性无关。\n因为齐次方程组的基础解系恰含 $n-r$ 个线性无关向量，所以 $\\boldsymbol{\\xi}_1, \\cdots, \\boldsymbol{\\xi}_{n-r}$ 构成 $\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{0}$ 的基础解系。\n任一解 $\\boldsymbol{x}$ 与特解 $\\boldsymbol{\\eta}_1$ 之差 $\\boldsymbol{x} - \\boldsymbol{\\eta}_1$ 是齐次方程组的解，故存在常数 $c_1, c_2, \\cdots, c_{n-r}$ 使得：\n$$\\boldsymbol{x} - \\boldsymbol{\\eta}_1 = c_1 \\boldsymbol{\\xi}_1 + c_2 \\boldsymbol{\\xi}_2 + \\cdots + c_{n-r} \\boldsymbol{\\xi}_{n-r} = \\sum_{i=1}^{n-r} c_i (\\boldsymbol{\\eta}_{i+1} - \\boldsymbol{\\eta}_1)$$\n移项整理得：\n$$\\boldsymbol{x} = \\left(1 - \\sum_{i=1}^{n-r} c_i\\right) \\boldsymbol{\\eta}_1 + c_1 \\boldsymbol{\\eta}_2 + c_2 \\boldsymbol{\\eta}_3 + \\cdots + c_{n-r} \\boldsymbol{\\eta}_{n-r+1}$$\n记 $k_1 = 1 - \\sum_{i=1}^{n-r} c_i$，$k_{i+1} = c_i \\ (i=1, 2, \\cdots, n-r)$，则：\n$$k_1 + k_2 + \\cdots + k_{n-r+1} = \\left(1 - \\sum_{i=1}^{n-r} c_i\\right) + \\sum_{i=1}^{n-r} c_i = 1$$\n且 $\\boldsymbol{x} = k_1 \\boldsymbol{\\eta}_1 + k_2 \\boldsymbol{\\eta}_2 + \\cdots + k_{n-r+1} \\boldsymbol{\\eta}_{n-r+1}$。得证。"
    }
  },
  {
    id: "LAG-TB-CH05-Q18",
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
      source_desc: "《线性代数与几何》第 5 章 · 习题五 第 18 题",
      page_start: 132,
      page_end: 132
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 18,
      paper_q_num: 18,
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
        knowledge_points: ["行和为零的矩阵", "齐次方程组通解", "全1向量"]
      }
    },
    content: {
      stem: "设 $n$ 阶矩阵 $\\boldsymbol{A}$ 各行元素之和均为零，且 $r(\\boldsymbol{A}) = n-1$，求齐次线性方程组 $\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{0}$ 的全部解。"
    },
    solution: {
      answer: "全部解为 $\\boldsymbol{x} = c(1, 1, \\cdots, 1)^\\mathrm{T}$（$c$ 为任意常数）。",
      hints: "各行元素之和为零意味着矩阵与全 1 向量相乘为零向量，结合基础解系所含向量个数 $n - r(\\boldsymbol{A}) = 1$ 写出全部解。",
      steps: "设 $\\boldsymbol{\\xi} = (1, 1, \\cdots, 1)^\\mathrm{T}$。因 $\\boldsymbol{A}$ 各行元素之和均为零，根据矩阵乘法定义有：\n$$\\boldsymbol{A}\\boldsymbol{\\xi} = \\begin{pmatrix} \\sum_{j=1}^n a_{1j} \\\\ \\sum_{j=1}^n a_{2j} \\\\ \\vdots \\\\ \\sum_{j=1}^n a_{nj} \\end{pmatrix} = \\begin{pmatrix} 0 \\\\ 0 \\\\ \\vdots \\\\ 0 \\end{pmatrix} = \\boldsymbol{0}$$\n又因为 $\\boldsymbol{\\xi} \\neq \\boldsymbol{0}$，所以 $\\boldsymbol{\\xi}$ 是齐次线性方程组 $\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{0}$ 的非零解。\n又已知 $r(\\boldsymbol{A}) = n-1$，齐次线性方程组基础解系中包含的向量个数为 $n - r(\\boldsymbol{A}) = n - (n-1) = 1$。\n因此 $\\boldsymbol{\\xi} = (1, 1, \\cdots, 1)^\\mathrm{T}$ 构成 $\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{0}$ 的一个基础解系。\n故该方程组的全部解为 $\\boldsymbol{x} = c(1, 1, \\cdots, 1)^\\mathrm{T}$（$c$ 为任意常数）。"
    }
  },
  {
    id: "LAG-TB-CH05-Q19",
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
      source_desc: "《线性代数与几何》第 5 章 · 习题五 第 19 题",
      page_start: 132,
      page_end: 132
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 19,
      paper_q_num: 19,
      type: "calc",
      difficulty: 1,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 5,
        chapter_title: "第5章 线性方程组",
        section: "5.2",
        section_title: "非齐次线性方程组",
        section_slug: "5.2_非齐次线性方程组",
        knowledge_points: ["非齐次线性方程组解的结构", "全部解", "特解之差"]
      }
    },
    content: {
      stem: "设 $\\boldsymbol{A}$ 为 $4 \\times 3$ 矩阵，且线性方程组 $\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{b}$ 满足 $r(\\boldsymbol{A}) = r(\\boldsymbol{A}, \\boldsymbol{b}) = 2$，并且已知 $\\boldsymbol{\\gamma}_1 = (-1, 1, 0)^\\mathrm{T}, \\boldsymbol{\\gamma}_2 = (1, 0, 1)^\\mathrm{T}$ 为该方程组的两个解，试求该方程组的全部解。"
    },
    solution: {
      answer: "全部解可表示为 $\\boldsymbol{x} = \\boldsymbol{\\gamma}_1 + c(\\boldsymbol{\\gamma}_1 - \\boldsymbol{\\gamma}_2) = (-1, 1, 0)^\\mathrm{T} + c(-2, 1, -1)^\\mathrm{T}$（$c$ 为任意实数）。",
      hints: "已知两个不同特解，它们的差即为对应导出齐次方程组的一个非零解。利用未知数个数 $n=3$ 与秩 $r(\\boldsymbol{A})=2$ 确定基础解系仅含一个向量。",
      steps: "因为未知数个数 $n = 3$，且 $r(\\boldsymbol{A}) = 2$，所以对应齐次方程组 $\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{0}$ 的基础解系仅包含 $n - r(\\boldsymbol{A}) = 3 - 2 = 1$ 个解向量。\n已知 $\\boldsymbol{\\gamma}_1, \\boldsymbol{\\gamma}_2$ 是 $\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{b}$ 的两个解，则：\n$$\\boldsymbol{\\xi} = \\boldsymbol{\\gamma}_1 - \\boldsymbol{\\gamma}_2 = (-1, 1, 0)^\\mathrm{T} - (1, 0, 1)^\\mathrm{T} = (-2, 1, -1)^\\mathrm{T} \\neq \\boldsymbol{0}$$\n满足 $\\boldsymbol{A}\\boldsymbol{\\xi} = \\boldsymbol{A}\\boldsymbol{\\gamma}_1 - \\boldsymbol{A}\\boldsymbol{\\gamma}_2 = \\boldsymbol{b} - \\boldsymbol{b} = \\boldsymbol{0}$，即 $\\boldsymbol{\\xi}$ 是齐次方程组的一个非零解，从而构成基础解系。\n选取 $\\boldsymbol{\\gamma}_1$ 作为非齐次特解，可得全部解为：\n$$\\boldsymbol{x} = \\boldsymbol{\\gamma}_1 + c(\\boldsymbol{\\gamma}_1 - \\boldsymbol{\\gamma}_2) = (-1, 1, 0)^\\mathrm{T} + c(-2, 1, -1)^\\mathrm{T} \\quad (c \\text{ 为任意实数})。$$"
    }
  },
  {
    id: "LAG-TB-CH05-Q20",
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
      source_desc: "《线性代数与几何》第 5 章 · 习题五 第 20 题",
      page_start: 132,
      page_end: 132
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 20,
      paper_q_num: 20,
      type: "calc",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 5,
        chapter_title: "第5章 线性方程组",
        section: "5.1",
        section_title: "齐次线性方程组",
        section_slug: "5.1_齐次线性方程组",
        knowledge_points: ["齐次线性方程组基础解系", "公共解", "解空间的交"]
      }
    },
    content: {
      stem: "设四元齐次线性方程组 (I) 为\n$$\\begin{cases} x_1 + x_2 = 0, \\\\ x_2 - x_4 = 0. \\end{cases}$$\n又已知某个齐次线性方程组 (II) 的全部解为 $c_1(0, 1, 1, 0)^\\mathrm{T} + c_2(-1, 2, 2, 1)^\\mathrm{T}$（$c_1, c_2$ 为任意常数），\n(1) 求线性方程组 (I) 的基础解系；\n(2) 问线性方程组 (I) 与 (II) 是否有非零的公共解？若有，求出所有非零公共解；若没有，说明理由。",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "求线性方程组 (I) 的基础解系。",
          answer: "基础解系为 $(0, 0, 1, 0)^\\mathrm{T}, (-1, 1, 0, 1)^\\mathrm{T}$。"
        },
        {
          sub_id: "(2)",
          stem: "问线性方程组 (I) 与 (II) 是否有非零的公共解？若有，求出所有非零公共解；若没有，说明理由。",
          answer: "有非零公共解，所有非零公共解为 $c(-1, 1, 1, 1)^\\mathrm{T}$（$c$ 为任意非零实数）。"
        }
      ]
    },
    solution: {
      answer: "(1) 方程组 (I) 的基础解系为 $(0, 0, 1, 0)^\\mathrm{T}, (-1, 1, 0, 1)^\\mathrm{T}$；\n(2) 有非零公共解，所有非零公共解为 $c(-1, 1, 1, 1)^\\mathrm{T}$（$c$ 为任意非零实数）。",
      hints: "(1) 将 (I) 的同解方程中选定自由未知量求出基础解系；(2) 将 (II) 的通解形式代入 (I) 的方程组建立关于待定系数的方程，解出参数之间的关系。",
      steps: "(1) 方程组 (I) 的系数矩阵为 $\\begin{pmatrix} 1 & 1 & 0 & 0 \\\\ 0 & 1 & 0 & -1 \\end{pmatrix}$，秩为 $2$。选取 $x_3, x_4$ 为自由未知量，则 $x_2 = x_4, x_1 = -x_2 = -x_4$。\n令 $x_3 = 1, x_4 = 0$，得 $\\boldsymbol{\\xi}_1 = (0, 0, 1, 0)^\\mathrm{T}$；\n令 $x_3 = 0, x_4 = 1$，得 $\\boldsymbol{\\xi}_2 = (-1, 1, 0, 1)^\\mathrm{T}$。\n故方程组 (I) 的基础解系为 $(0, 0, 1, 0)^\\mathrm{T}, (-1, 1, 0, 1)^\\mathrm{T}$。\n\n(2) (II) 的全部解可表示为：\n$$\\boldsymbol{x} = c_1(0, 1, 1, 0)^\\mathrm{T} + c_2(-1, 2, 2, 1)^\\mathrm{T} = (-c_2, c_1 + 2c_2, c_1 + 2c_2, c_2)^\\mathrm{T}$$\n将其代入方程组 (I) 得：\n$$\\begin{cases} x_1 + x_2 = -c_2 + (c_1 + 2c_2) = c_1 + c_2 = 0 \\\\ x_2 - x_4 = (c_1 + 2c_2) - c_2 = c_1 + c_2 = 0 \\end{cases}$$\n解得 $c_1 = -c_2$。\n当 $c_1 = -c_2 \\neq 0$ 时，代入 (II) 的解式得：\n$$\\boldsymbol{x} = -c_2(0, 1, 1, 0)^\\mathrm{T} + c_2(-1, 2, 2, 1)^\\mathrm{T} = c_2(-1, 1, 1, 1)^\\mathrm{T}$$\n此向量即为 (I) 与 (II) 的非零公共解。因此方程组 (I) 与 (II) 的所有非零公共解为 $c(-1, 1, 1, 1)^\\mathrm{T}$（$c$ 为任意非零实数）。"
    }
  }
];

module.exports = { ch05QuestionsPart2 };
