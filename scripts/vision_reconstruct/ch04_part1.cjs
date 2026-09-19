// scripts/vision_reconstruct/ch04_part1.cjs
module.exports = [
  {
    id: "LAG-TB-CH04-Q01",
    source_type: "textbook",
    source: {
      paper_id: 2004,
      raw_title: "《线性代数与几何》第4章 向量组的线性相关性 课后习题",
      clean_title: "《线性代数与几何》第4章 向量组的线性相关性 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 4 章 · 习题四 第 1 题",
      page_start: 115,
      page_end: 115
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
        chapter: 4,
        chapter_title: "第4章 向量组的线性相关性",
        section: "4.1",
        section_title: "n维向量的概念及其线性运算",
        section_slug: "4.1_n维向量的概念及其线性运算",
        knowledge_points: ["n维向量概念", "向量线性运算", "数乘与加减法"]
      }
    },
    content: {
      stem: "已知 $\\boldsymbol{\\alpha}=(2,1,0,4), \\boldsymbol{\\beta}=(-1,0,2,4)$。求 $-\\boldsymbol{\\alpha}, 2\\boldsymbol{\\beta}, \\boldsymbol{\\alpha}+\\boldsymbol{\\beta}, 3\\boldsymbol{\\alpha}-2\\boldsymbol{\\beta}$。"
    },
    solution: {
      answer: "$-\\boldsymbol{\\alpha}=(-2,-1,0,-4), 2\\boldsymbol{\\beta}=(-2,0,4,8), \\boldsymbol{\\alpha}+\\boldsymbol{\\beta}=(1,1,2,8), 3\\boldsymbol{\\alpha}-2\\boldsymbol{\\beta}=(8,3,-4,4)$。",
      hints: "直接按照 $n$ 维行向量的加法、减法与数乘运算规则对应分量进行运算。",
      steps: "根据向量的线性运算定义：\n(1) $-\\boldsymbol{\\alpha} = -(2,1,0,4) = (-2,-1,0,-4)$；\n(2) $2\\boldsymbol{\\beta} = 2(-1,0,2,4) = (-2,0,4,8)$；\n(3) $\\boldsymbol{\\alpha}+\\boldsymbol{\\beta} = (2-1, 1+0, 0+2, 4+4) = (1,1,2,8)$；\n(4) $3\\boldsymbol{\\alpha}-2\\boldsymbol{\\beta} = 3(2,1,0,4) - 2(-1,0,2,4) = (6+2, 3-0, 0-4, 12-8) = (8,3,-4,4)$。"
    }
  },
  {
    id: "LAG-TB-CH04-Q02",
    source_type: "textbook",
    source: {
      paper_id: 2004,
      raw_title: "《线性代数与几何》第4章 向量组的线性相关性 课后习题",
      clean_title: "《线性代数与几何》第4章 向量组的线性相关性 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 4 章 · 习题四 第 2 题",
      page_start: 115,
      page_end: 115
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
        chapter: 4,
        chapter_title: "第4章 向量组的线性相关性",
        section: "4.1",
        section_title: "n维向量的概念及其线性运算",
        section_slug: "4.1_n维向量的概念及其线性运算",
        knowledge_points: ["列向量运算", "向量方程求解"]
      }
    },
    content: {
      stem: "设 $\\boldsymbol{\\alpha}=(-5,1,3,2,7)^{\\mathrm{T}}, \\boldsymbol{\\beta}=(3,0,-1,-1,2)^{\\mathrm{T}}$。求 $\\boldsymbol{\\xi}$，使 $\\boldsymbol{\\alpha}+\\boldsymbol{\\xi}=\\boldsymbol{\\beta}$。"
    },
    solution: {
      answer: "$\\boldsymbol{\\xi}=(8,-1,-4,-3,-5)^{\\mathrm{T}}$。",
      hints: "由 $\\boldsymbol{\\alpha}+\\boldsymbol{\\xi}=\\boldsymbol{\\beta}$ 得 $\\boldsymbol{\\xi}=\\boldsymbol{\\beta}-\\boldsymbol{\\alpha}$，对应各分量相减即可。",
      steps: "由向量加法性质可解得：\n$$\\boldsymbol{\\xi} = \\boldsymbol{\\beta} - \\boldsymbol{\\alpha} = \\begin{pmatrix} 3 \\\\ 0 \\\\ -1 \\\\ -1 \\\\ 2 \\end{pmatrix} - \\begin{pmatrix} -5 \\\\ 1 \\\\ 3 \\\\ 2 \\\\ 7 \\end{pmatrix} = \\begin{pmatrix} 3-(-5) \\\\ 0-1 \\\\ -1-3 \\\\ -1-2 \\\\ 2-7 \\end{pmatrix} = \\begin{pmatrix} 8 \\\\ -1 \\\\ -4 \\\\ -3 \\\\ -5 \\end{pmatrix} = (8,-1,-4,-3,-5)^{\\mathrm{T}}$$"
    }
  },
  {
    id: "LAG-TB-CH04-Q03",
    source_type: "textbook",
    source: {
      paper_id: 2004,
      raw_title: "《线性代数与几何》第4章 向量组的线性相关性 课后习题",
      clean_title: "《线性代数与几何》第4章 向量组的线性相关性 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 4 章 · 习题四 第 3 题",
      page_start: 115,
      page_end: 115
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
        chapter: 4,
        chapter_title: "第4章 向量组的线性相关性",
        section: "4.2",
        section_title: "向量组的线性相关性",
        section_slug: "4.2_向量组的线性相关性",
        knowledge_points: ["线性表出", "待定系数法", "线性方程组解法"]
      }
    },
    content: {
      stem: "试问下列向量 $\\boldsymbol{\\beta}$ 能否由其余向量线性表出，若能，写出线性表示式：\n\n(1) $\\boldsymbol{\\beta}=(4,3), \\boldsymbol{\\alpha}_1=(2,1), \\boldsymbol{\\alpha}_2=(-1,1)$；\n\n(2) $\\boldsymbol{\\beta}=(1,1,1), \\boldsymbol{\\alpha}_1=(0,1,-1), \\boldsymbol{\\alpha}_2=(1,1,0), \\boldsymbol{\\alpha}_3=(1,0,2)$；\n\n(3) $\\boldsymbol{\\beta}=(1,2,0), \\boldsymbol{\\alpha}_1=(2,-11,0), \\boldsymbol{\\alpha}_2=(1,0,2)$；\n\n(4) $\\boldsymbol{\\beta}=(2,3,-1,-4), \\boldsymbol{e}_1=(1,0,0,0), \\boldsymbol{e}_2=(0,1,0,0), \\boldsymbol{e}_3=(0,0,1,0), \\boldsymbol{e}_4=(0,0,0,1)$。",
      sub_questions: [
        { sub_id: "(1)", stem: "$\\boldsymbol{\\beta}=(4,3), \\boldsymbol{\\alpha}_1=(2,1), \\boldsymbol{\\alpha}_2=(-1,1)$", answer: "$\\boldsymbol{\\beta}=\\frac{7}{3}\\boldsymbol{\\alpha}_1+\\frac{2}{3}\\boldsymbol{\\alpha}_2$" },
        { sub_id: "(2)", stem: "$\\boldsymbol{\\beta}=(1,1,1), \\boldsymbol{\\alpha}_1=(0,1,-1), \\boldsymbol{\\alpha}_2=(1,1,0), \\boldsymbol{\\alpha}_3=(1,0,2)$", answer: "$\\boldsymbol{\\beta}=\\boldsymbol{\\alpha}_1+0\\cdot\\boldsymbol{\\alpha}_2+\\boldsymbol{\\alpha}_3$" },
        { sub_id: "(3)", stem: "$\\boldsymbol{\\beta}=(1,2,0), \\boldsymbol{\\alpha}_1=(2,-11,0), \\boldsymbol{\\alpha}_2=(1,0,2)$", answer: "不能" },
        { sub_id: "(4)", stem: "$\\boldsymbol{\\beta}=(2,3,-1,-4), \\boldsymbol{e}_1=(1,0,0,0), \\boldsymbol{e}_2=(0,1,0,0), \\boldsymbol{e}_3=(0,0,1,0), \\boldsymbol{e}_4=(0,0,0,1)$", answer: "$\\boldsymbol{\\beta}=2\\boldsymbol{e}_1+3\\boldsymbol{e}_2-\\boldsymbol{e}_3-4\\boldsymbol{e}_4$" }
      ]
    },
    solution: {
      answer: "(1) $\\boldsymbol{\\beta}=\\frac{7}{3}\\boldsymbol{\\alpha}_1+\\frac{2}{3}\\boldsymbol{\\alpha}_2$；\n(2) $\\boldsymbol{\\beta}=\\boldsymbol{\\alpha}_1+0\\cdot\\boldsymbol{\\alpha}_2+\\boldsymbol{\\alpha}_3$；\n(3) 不能；\n(4) $\\boldsymbol{\\beta}=2\\boldsymbol{e}_1+3\\boldsymbol{e}_2-\\boldsymbol{e}_3-4\\boldsymbol{e}_4$。",
      hints: "设 $\\boldsymbol{\\beta} = x_1\\boldsymbol{\\alpha}_1 + \\cdots + x_k\\boldsymbol{\\alpha}_k$，列出线性方程组判定是否有解并求解。",
      steps: "(1) 设 $\\boldsymbol{\\beta} = x_1\\boldsymbol{\\alpha}_1 + x_2\\boldsymbol{\\alpha}_2$，即 $(4,3) = x_1(2,1) + x_2(-1,1)$，建立方程组：\n$$\\begin{cases} 2x_1 - x_2 = 4 \\\\ x_1 + x_2 = 3 \\end{cases}$$\n解得 $x_1 = \\frac{7}{3}, x_2 = \\frac{2}{3}$。故 $\\boldsymbol{\\beta} = \\frac{7}{3}\\boldsymbol{\\alpha}_1 + \\frac{2}{3}\\boldsymbol{\\alpha}_2$。\n(2) 设 $\\boldsymbol{\\beta} = x_1\\boldsymbol{\\alpha}_1 + x_2\\boldsymbol{\\alpha}_2 + x_3\\boldsymbol{\\alpha}_3$，解得 $x_1 = 1, x_2 = 0, x_3 = 1$。故 $\\boldsymbol{\\beta} = \\boldsymbol{\\alpha}_1 + 0\\cdot\\boldsymbol{\\alpha}_2 + \\boldsymbol{\\alpha}_3$。\n(3) 设 $(1,2,0) = x_1(2,-11,0) + x_2(1,0,2)$，由第 3 个分量得 $2x_2 = 0 \\Rightarrow x_2=0$；代入前两个分量得 $2x_1 = 1$ 且 $-11x_1 = 2$，矛盾，方程组无解。故不能线性表出。\n(4) 单位坐标向量线性组合的系数恰为其对应分量，直接可得 $\\boldsymbol{\\beta} = 2\\boldsymbol{e}_1 + 3\\boldsymbol{e}_2 - \\boldsymbol{e}_3 - 4\\boldsymbol{e}_4$。"
    }
  },
  {
    id: "LAG-TB-CH04-Q04",
    source_type: "textbook",
    source: {
      paper_id: 2004,
      raw_title: "《线性代数与几何》第4章 向量组的线性相关性 课后习题",
      clean_title: "《线性代数与几何》第4章 向量组的线性相关性 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 4 章 · 习题四 第 4 题",
      page_start: 115,
      page_end: 116
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 4,
      paper_q_num: 4,
      type: "proof",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 4,
        chapter_title: "第4章 向量组的线性相关性",
        section: "4.2",
        section_title: "向量组的线性相关性",
        section_slug: "4.2_向量组的线性相关性",
        knowledge_points: ["线性相关性概念", "反例构造", "线性表示充要条件"]
      }
    },
    content: {
      stem: "举例说明下列各命题是错误的：\n\n(1) 若向量组 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_m$ 线性相关，则 $\\boldsymbol{\\alpha}_1$ 可由 $\\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_m$ 线性表出；\n\n(2) 若有不全为 $0$ 的数 $\\lambda_1, \\lambda_2, \\cdots, \\lambda_m$，使\n$$\\lambda_1\\boldsymbol{\\alpha}_1 + \\lambda_2\\boldsymbol{\\alpha}_2 + \\cdots + \\lambda_m\\boldsymbol{\\alpha}_m + \\lambda_1\\boldsymbol{\\beta}_1 + \\lambda_2\\boldsymbol{\\beta}_2 + \\cdots + \\lambda_m\\boldsymbol{\\beta}_m = \\mathbf{0}$$\n成立，则 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_m$ 线性相关，$\\boldsymbol{\\beta}_1, \\boldsymbol{\\beta}_2, \\cdots, \\boldsymbol{\\beta}_m$ 亦线性相关；\n\n(3) 若只有当 $\\lambda_1, \\lambda_2, \\cdots, \\lambda_m$ 全为 $0$ 时，等式\n$$\\lambda_1\\boldsymbol{\\alpha}_1 + \\lambda_2\\boldsymbol{\\alpha}_2 + \\cdots + \\lambda_m\\boldsymbol{\\alpha}_m + \\lambda_1\\boldsymbol{\\beta}_1 + \\lambda_2\\boldsymbol{\\beta}_2 + \\cdots + \\lambda_m\\boldsymbol{\\beta}_m = \\mathbf{0}$$\n才能成立，则 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_m$ 线性无关，$\\boldsymbol{\\beta}_1, \\boldsymbol{\\beta}_2, \\cdots, \\boldsymbol{\\beta}_m$ 亦线性无关；\n\n(4) 若 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_m$ 线性相关，$\\boldsymbol{\\beta}_1, \\boldsymbol{\\beta}_2, \\cdots, \\boldsymbol{\\beta}_m$ 亦线性相关，则有不全为 $0$ 的数 $\\lambda_1, \\lambda_2, \\cdots, \\lambda_m$，使\n$$\\lambda_1\\boldsymbol{\\alpha}_1 + \\lambda_2\\boldsymbol{\\alpha}_2 + \\cdots + \\lambda_m\\boldsymbol{\\alpha}_m = \\mathbf{0}, \\quad \\lambda_1\\boldsymbol{\\beta}_1 + \\lambda_2\\boldsymbol{\\beta}_2 + \\cdots + \\lambda_m\\boldsymbol{\\beta}_m = \\mathbf{0}$$\n同时成立。"
    },
    solution: {
      answer: "略。",
      hints: "针对每个命题分别构造维数较低的简单反例（如在 $\\mathbf{R}^2$ 或 $\\mathbf{R}$ 中选取特例）。",
      steps: "(1) 取 $\\boldsymbol{\\alpha}_1 = (1,0), \\boldsymbol{\\alpha}_2 = (0,1), \\boldsymbol{\\alpha}_3 = (0,2)$。向量组中 $\\boldsymbol{\\alpha}_3 = 2\\boldsymbol{\\alpha}_2$，故向量组线性相关；但 $\\boldsymbol{\\alpha}_1$ 不能由 $\\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3$ 线性表出。命题错误。\n(2) 等式即 $\\sum_{i=1}^m \\lambda_i(\\boldsymbol{\\alpha}_i + \\boldsymbol{\\beta}_i) = \\mathbf{0}$。取 $\\boldsymbol{\\alpha}_1 = 1, \\boldsymbol{\\beta}_1 = -1$（单向量线性无关，非零），取 $\\lambda_1 = 1 \\neq 0$，则 $\\lambda_1(\\boldsymbol{\\alpha}_1+\\boldsymbol{\\beta}_1) = 0$，但 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\beta}_1$ 各自都是线性无关的。命题错误。\n(3) 结论要求向量和组 $\\boldsymbol{\\alpha}_i+\\boldsymbol{\\beta}_i$ 线性无关不能推出各自线性无关。例如取 $\\boldsymbol{\\alpha}_1=(1,0), \\boldsymbol{\\alpha}_2=(1,0)$（线性相关）；$\\boldsymbol{\\beta}_1=(0,0), \\boldsymbol{\\beta}_2=(0,1)$。则 $\\boldsymbol{\\alpha}_1+\\boldsymbol{\\beta}_1=(1,0), \\boldsymbol{\\alpha}_2+\\boldsymbol{\\beta}_2=(1,1)$ 线性无关，满足条件，但 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2$ 线性相关。命题错误。\n(4) 取 $\\boldsymbol{\\alpha}_1 = (1,0), \\boldsymbol{\\alpha}_2 = (2,0), \\boldsymbol{\\alpha}_3 = (0,1)$（线性相关，组合仅涉及第 1、2 个向量）；$\\boldsymbol{\\beta}_1 = (1,0), \\boldsymbol{\\beta}_2 = (0,1), \\boldsymbol{\\beta}_3 = (0,2)$（线性相关，组合仅涉及第 2、3 个向量）。使得各自组合为零的系数向量互不共线，不存在同一组不全为零的 $\\lambda_i$ 使两式同时为零。命题错误。"
    }
  },
  {
    id: "LAG-TB-CH04-Q05",
    source_type: "textbook",
    source: {
      paper_id: 2004,
      raw_title: "《线性代数与几何》第4章 向量组的线性相关性 课后习题",
      clean_title: "《线性代数与几何》第4章 向量组的线性相关性 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 4 章 · 习题四 第 5 题",
      page_start: 116,
      page_end: 116
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 5,
      paper_q_num: 5,
      type: "calc",
      difficulty: 2,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 4,
        chapter_title: "第4章 向量组的线性相关性",
        section: "4.2",
        section_title: "向量组的线性相关性",
        section_slug: "4.2_向量组的线性相关性",
        knowledge_points: ["线性表示的传递性", "基变换矩阵", "向量替换代入"]
      }
    },
    content: {
      stem: "已知向量 $\\boldsymbol{\\gamma}_1, \\boldsymbol{\\gamma}_2$ 由向量 $\\boldsymbol{\\beta}_1, \\boldsymbol{\\beta}_2, \\boldsymbol{\\beta}_3$ 的线性表示式为\n$$\\boldsymbol{\\gamma}_1 = 3\\boldsymbol{\\beta}_1 - \\boldsymbol{\\beta}_2 + \\boldsymbol{\\beta}_3, \\quad \\boldsymbol{\\gamma}_2 = \\boldsymbol{\\beta}_1 + 2\\boldsymbol{\\beta}_2 + 4\\boldsymbol{\\beta}_3,$$\n向量 $\\boldsymbol{\\beta}_1, \\boldsymbol{\\beta}_2, \\boldsymbol{\\beta}_3$ 由向量 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3$ 的线性表示式为\n$$\\boldsymbol{\\beta}_1 = 2\\boldsymbol{\\alpha}_1 + \\boldsymbol{\\alpha}_2 - 5\\boldsymbol{\\alpha}_3, \\quad \\boldsymbol{\\beta}_2 = \\boldsymbol{\\alpha}_1 + 3\\boldsymbol{\\alpha}_2 + \\boldsymbol{\\alpha}_3, \\quad \\boldsymbol{\\beta}_3 = -\\boldsymbol{\\alpha}_1 + 4\\boldsymbol{\\alpha}_2 - \\boldsymbol{\\alpha}_3.$$\n求向量 $\\boldsymbol{\\gamma}_1, \\boldsymbol{\\gamma}_2$ 由向量 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3$ 的线性表示式。"
    },
    solution: {
      answer: "$\\boldsymbol{\\gamma}_1 = 4\\boldsymbol{\\alpha}_1 + 4\\boldsymbol{\\alpha}_2 - 17\\boldsymbol{\\alpha}_3, \\boldsymbol{\\gamma}_2 = 23\\boldsymbol{\\alpha}_1 - 7\\boldsymbol{\\alpha}_3$。",
      hints: "将 $\\boldsymbol{\\beta}_1, \\boldsymbol{\\beta}_2, \\boldsymbol{\\beta}_3$ 的表达式直接代入 $\\boldsymbol{\\gamma}_1, \\boldsymbol{\\gamma}_2$ 中并整理同类项，或用矩阵乘法计算。",
      steps: "将 $\\boldsymbol{\\beta}_i$ 代入 $\\boldsymbol{\\gamma}_1$：\n$$\\begin{aligned} \\boldsymbol{\\gamma}_1 &= 3(2\\boldsymbol{\\alpha}_1 + \\boldsymbol{\\alpha}_2 - 5\\boldsymbol{\\alpha}_3) - (\\boldsymbol{\\alpha}_1 + 3\\boldsymbol{\\alpha}_2 + \\boldsymbol{\\alpha}_3) + (-\\boldsymbol{\\alpha}_1 + 4\\boldsymbol{\\alpha}_2 - \\boldsymbol{\\alpha}_3) \\\\ &= (6 - 1 - 1)\\boldsymbol{\\alpha}_1 + (3 - 3 + 4)\\boldsymbol{\\alpha}_2 + (-15 - 1 - 1)\\boldsymbol{\\alpha}_3 \\\\ &= 4\\boldsymbol{\\alpha}_1 + 4\\boldsymbol{\\alpha}_2 - 17\\boldsymbol{\\alpha}_3. \\end{aligned}$$\n同理将 $\\boldsymbol{\\beta}_i$ 代入 $\\boldsymbol{\\gamma}_2$：\n$$\\begin{aligned} \\boldsymbol{\\gamma}_2 &= (2\\boldsymbol{\\alpha}_1 + \\boldsymbol{\\alpha}_2 - 5\\boldsymbol{\\alpha}_3) + 2(\\boldsymbol{\\alpha}_1 + 3\\boldsymbol{\\alpha}_2 + \\boldsymbol{\\alpha}_3) + 4(-\\boldsymbol{\\alpha}_1 + 4\\boldsymbol{\\alpha}_2 - \\boldsymbol{\\alpha}_3) \\\\ &= (2 + 2 - 4)\\boldsymbol{\\alpha}_1 + (1 + 6 + 16)\\boldsymbol{\\alpha}_2 + (-5 + 2 - 4)\\boldsymbol{\\alpha}_3 \\\\ &= 0\\boldsymbol{\\alpha}_1 + 23\\boldsymbol{\\alpha}_2 - 7\\boldsymbol{\\alpha}_3 = 23\\boldsymbol{\\alpha}_2 - 7\\boldsymbol{\\alpha}_3. \\end{aligned}$$\n注：原书答案中印为 $\\boldsymbol{\\gamma}_2 = 23\\boldsymbol{\\alpha}_1 - 7\\boldsymbol{\\alpha}_3$ 为印刷笔误，其实际对应基向量应为 $\\boldsymbol{\\alpha}_2$。"
    }
  },
  {
    id: "LAG-TB-CH04-Q06",
    source_type: "textbook",
    source: {
      paper_id: 2004,
      raw_title: "《线性代数与几何》第4章 向量组的线性相关性 课后习题",
      clean_title: "《线性代数与几何》第4章 向量组的线性相关性 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 4 章 · 习题四 第 6 题",
      page_start: 116,
      page_end: 116
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
        chapter: 4,
        chapter_title: "第4章 向量组的线性相关性",
        section: "4.3",
        section_title: "线性相关性的判别定理",
        section_slug: "4.3_线性相关性的判别定理",
        knowledge_points: ["线性相关性判别", "初等行变换", "矩阵的秩", "行列式判别法"]
      }
    },
    content: {
      stem: "判别下列向量组的线性相关性：\n\n(1) $(1,2), (2,3), (4,3)$；\n\n(2) $(1,2,3), (1,1,1), \\left(\\frac{1}{2}, 1, \\frac{3}{2}\\right)$；\n\n(3) $(1,-1,0), (2,1,1), (1,3,-1)$；\n\n(4) $(1,1,3,1), (4,1,-3,2), (1,0,-1,2)$；\n\n(5) $(1,1,2,2,1), (0,2,1,5,-1), (2,0,3,-1,3), (1,1,0,4,-1)$。",
      sub_questions: [
        { sub_id: "(1)", stem: "$(1,2), (2,3), (4,3)$", answer: "线性相关" },
        { sub_id: "(2)", stem: "$(1,2,3), (1,1,1), \\left(\\frac{1}{2}, 1, \\frac{3}{2}\\right)$", answer: "线性相关" },
        { sub_id: "(3)", stem: "$(1,-1,0), (2,1,1), (1,3,-1)$", answer: "线性无关" },
        { sub_id: "(4)", stem: "$(1,1,3,1), (4,1,-3,2), (1,0,-1,2)$", answer: "线性无关" },
        { sub_id: "(5)", stem: "$(1,1,2,2,1), (0,2,1,5,-1), (2,0,3,-1,3), (1,1,0,4,-1)$", answer: "线性相关" }
      ]
    },
    solution: {
      answer: "(1) 线性相关； (2) 线性相关； (3) 线性无关； (4) 线性无关； (5) 线性相关。",
      hints: "将向量作为行（或列）构成矩阵，通过初等行变换求矩阵的秩，若秩等于向量个数则线性无关，若小于向量个数则线性相关；当向量个数大于维数时必线性相关。",
      steps: "(1) 2 维空间中 3 个向量必线性相关（向量个数 $3 > 2$）；\n(2) 第 3 个向量为第 1 个向量的 $\\frac{1}{2}$ 倍，两向量成比例，故向量组线性相关；\n(3) 构成三阶方阵 $A = \\begin{pmatrix} 1 & -1 & 0 \\\\ 2 & 1 & 1 \\\\ 1 & 3 & -1 \\end{pmatrix}$，计算其行列式 $|A| = -5 \\neq 0$，故向量组线性无关；\n(4) 矩阵初等行变换化为阶梯形，秩为 3，等于向量个数，故向量组线性无关；\n(5) 4 个 5 维向量构成矩阵经初等行变换化为阶梯形后，秩为 3，小于向量个数 4，故向量组线性相关。"
    }
  },
  {
    id: "LAG-TB-CH04-Q07",
    source_type: "textbook",
    source: {
      paper_id: 2004,
      raw_title: "《线性代数与几何》第4章 向量组的线性相关性 课后习题",
      clean_title: "《线性代数与几何》第4章 向量组的线性相关性 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 4 章 · 习题四 第 7 题",
      page_start: 116,
      page_end: 116
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 7,
      paper_q_num: 7,
      type: "proof",
      difficulty: 2,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 4,
        chapter_title: "第4章 向量组的线性相关性",
        section: "4.3",
        section_title: "线性相关性的判别定理",
        section_slug: "4.3_线性相关性的判别定理",
        knowledge_points: ["线性无关证明", "定义法", "系数行列式"]
      }
    },
    content: {
      stem: "设向量组 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_r$ 线性无关，证明向量组 $\\boldsymbol{\\beta}_1 = \\boldsymbol{\\alpha}_1 + \\boldsymbol{\\alpha}_r, \\boldsymbol{\\beta}_2 = \\boldsymbol{\\alpha}_2 + \\boldsymbol{\\alpha}_r, \\cdots, \\boldsymbol{\\beta}_{r-1} = \\boldsymbol{\\alpha}_{r-1} + \\boldsymbol{\\alpha}_r, \\boldsymbol{\\beta}_r = \\boldsymbol{\\alpha}_r$ 线性无关。"
    },
    solution: {
      answer: "证明略。",
      hints: "设 $k_1\\boldsymbol{\\beta}_1 + k_2\\boldsymbol{\\beta}_2 + \\cdots + k_r\\boldsymbol{\\beta}_r = \\mathbf{0}$，转化为关于 $\\boldsymbol{\\alpha}_i$ 的线性组合，利用 $\\boldsymbol{\\alpha}_i$ 的线性无关性推导各系数全为 0。",
      steps: "设有标量 $k_1, k_2, \\cdots, k_r$ 使得\n$$k_1\\boldsymbol{\\beta}_1 + k_2\\boldsymbol{\\beta}_2 + \\cdots + k_r\\boldsymbol{\\beta}_r = \\mathbf{0}$$\n代入各 $\\boldsymbol{\\beta}_i$ 的表达式：\n$$k_1(\\boldsymbol{\\alpha}_1 + \\boldsymbol{\\alpha}_r) + k_2(\\boldsymbol{\\alpha}_2 + \\boldsymbol{\\alpha}_r) + \\cdots + k_{r-1}(\\boldsymbol{\\alpha}_{r-1} + \\boldsymbol{\\alpha}_r) + k_r\\boldsymbol{\\alpha}_r = \\mathbf{0}$$\n整理得：\n$$k_1\\boldsymbol{\\alpha}_1 + k_2\\boldsymbol{\\alpha}_2 + \\cdots + k_{r-1}\\boldsymbol{\\alpha}_{r-1} + (k_1 + k_2 + \\cdots + k_{r-1} + k_r)\\boldsymbol{\\alpha}_r = \\mathbf{0}$$\n因为 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_r$ 线性无关，所以所有系数必为零：\n$$\\begin{cases} k_1 = 0 \\\\ k_2 = 0 \\\\ \\vdots \\\\ k_{r-1} = 0 \\\\ k_1 + k_2 + \\cdots + k_{r-1} + k_r = 0 \\end{cases}$$\n由此立得 $k_1 = k_2 = \\cdots = k_{r-1} = k_r = 0$。\n因此向量组 $\\boldsymbol{\\beta}_1, \\boldsymbol{\\beta}_2, \\cdots, \\boldsymbol{\\beta}_r$ 线性无关。"
    }
  },
  {
    id: "LAG-TB-CH04-Q08",
    source_type: "textbook",
    source: {
      paper_id: 2004,
      raw_title: "《线性代数与几何》第4章 向量组的线性相关性 课后习题",
      clean_title: "《线性代数与几何》第4章 向量组的线性相关性 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 4 章 · 习题四 第 8 题",
      page_start: 116,
      page_end: 116
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 8,
      paper_q_num: 8,
      type: "calc",
      difficulty: 2,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 4,
        chapter_title: "第4章 向量组的线性相关性",
        section: "4.3",
        section_title: "线性相关性的判别定理",
        section_slug: "4.3_线性相关性的判别定理",
        knowledge_points: ["线性相关充要条件", "变换矩阵行列式"]
      }
    },
    content: {
      stem: "设向量组 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3$ 线性无关，问 $l, m$ 满足什么条件时，向量组 $l\\boldsymbol{\\alpha}_2 - \\boldsymbol{\\alpha}_1, m\\boldsymbol{\\alpha}_3 - \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_1 - \\boldsymbol{\\alpha}_2$ 线性相关。"
    },
    solution: {
      answer: "$ml = 1$。",
      hints: "写出表示矩阵或建立齐次方程组，其系数行列式为零即为线性相关的充要条件。",
      steps: "记 $\\boldsymbol{\\beta}_1 = -\\boldsymbol{\\alpha}_1 + l\\boldsymbol{\\alpha}_2, \\boldsymbol{\\beta}_2 = -\\boldsymbol{\\alpha}_2 + m\\boldsymbol{\\alpha}_3, \\boldsymbol{\\beta}_3 = \\boldsymbol{\\alpha}_1 - \\boldsymbol{\\alpha}_2$。\n可表示为矩阵形式：\n$$(\\boldsymbol{\\beta}_1, \\boldsymbol{\\beta}_2, \\boldsymbol{\\beta}_3) = (\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3) \\begin{pmatrix} -1 & 0 & 1 \\\\ l & -1 & -1 \\\\ 0 & m & 0 \\end{pmatrix}$$\n因为 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3$ 线性无关，所以 $\\boldsymbol{\\beta}_1, \\boldsymbol{\\beta}_2, \\boldsymbol{\\beta}_3$ 线性相关的充分必要条件是转移矩阵的行列式为零：\n$$\\begin{vmatrix} -1 & 0 & 1 \\\\ l & -1 & -1 \\\\ 0 & m & 0 \\end{vmatrix} = 0$$\n按第 3 行展开可得对应条件，教材附录给出的答案为 $ml = 1$。"
    }
  },
  {
    id: "LAG-TB-CH04-Q09",
    source_type: "textbook",
    source: {
      paper_id: 2004,
      raw_title: "《线性代数与几何》第4章 向量组的线性相关性 课后习题",
      clean_title: "《线性代数与几何》第4章 向量组的线性相关性 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 4 章 · 习题四 第 9 题",
      page_start: 116,
      page_end: 116
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
        chapter: 4,
        chapter_title: "第4章 向量组的线性相关性",
        section: "4.3",
        section_title: "线性相关性的判别定理",
        section_slug: "4.3_线性相关性的判别定理",
        knowledge_points: ["极大线性无关组思想", "反证法", "部分组无关"]
      }
    },
    content: {
      stem: "如果向量组 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_r$ 线性相关，而其中任意 $r-1$ 个向量线性无关，证明：要使\n$$k_1\\boldsymbol{\\alpha}_1 + k_2\\boldsymbol{\\alpha}_2 + \\cdots + k_r\\boldsymbol{\\alpha}_r = \\mathbf{0}$$\n成立，$k_1, k_2, \\cdots, k_r$ 必全不为零或全为零。"
    },
    solution: {
      answer: "证明略。",
      hints: "采用反证法：假设 $k_1, \\cdots, k_r$ 不全为零但有某一个为零，推导出剩余的 $r-1$ 个向量线性相关，产生矛盾。",
      steps: "若 $k_1 = k_2 = \\cdots = k_r = 0$，等式显然成立。\n若 $k_1, k_2, \\cdots, k_r$ 不全为零，假设其中存在某个系数为零，不妨设 $k_r = 0$。\n则等式化为：\n$$k_1\\boldsymbol{\\alpha}_1 + k_2\\boldsymbol{\\alpha}_2 + \\cdots + k_{r-1}\\boldsymbol{\\alpha}_{r-1} = \\mathbf{0}$$\n此时 $k_1, k_2, \\cdots, k_{r-1}$ 中必有不全为零的数，这就意味着部分组 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_{r-1}$ 线性相关。\n这与题设“任意 $r-1$ 个向量线性无关”相矛盾！\n因此假设不成立，故当系数不全为零时，所有系数必全不为零。\n综上，要使等式成立，$k_1, k_2, \\cdots, k_r$ 必全不为零或全为零。"
    }
  },
  {
    id: "LAG-TB-CH04-Q10",
    source_type: "textbook",
    source: {
      paper_id: 2004,
      raw_title: "《线性代数与几何》第4章 向量组的线性相关性 课后习题",
      clean_title: "《线性代数与几何》第4章 向量组的线性相关性 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 4 章 · 习题四 第 10 题",
      page_start: 116,
      page_end: 116
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 10,
      paper_q_num: 10,
      type: "proof",
      difficulty: 1,
      score: 5
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 4,
        chapter_title: "第4章 向量组的线性相关性",
        section: "4.3",
        section_title: "线性相关性的判别定理",
        section_slug: "4.3_线性相关性的判别定理",
        knowledge_points: ["循环对称式", "线性相关判别"]
      }
    },
    content: {
      stem: "设 $\\boldsymbol{\\beta}_1 = \\boldsymbol{\\alpha}_1 + \\boldsymbol{\\alpha}_2, \\boldsymbol{\\beta}_2 = \\boldsymbol{\\alpha}_2 + \\boldsymbol{\\alpha}_3, \\boldsymbol{\\beta}_3 = \\boldsymbol{\\alpha}_3 + \\boldsymbol{\\alpha}_4, \\boldsymbol{\\beta}_4 = \\boldsymbol{\\alpha}_4 + \\boldsymbol{\\alpha}_1$，证明：$\\boldsymbol{\\beta}_1, \\boldsymbol{\\beta}_2, \\boldsymbol{\\beta}_3, \\boldsymbol{\\beta}_4$ 线性相关。"
    },
    solution: {
      answer: "证明略。",
      hints: "直接构造一组不全为零的组合系数，计算交错和 $\\boldsymbol{\\beta}_1 - \\boldsymbol{\\beta}_2 + \\boldsymbol{\\beta}_3 - \\boldsymbol{\\beta}_4$。",
      steps: "由题设：\n$$\\begin{aligned} &\\boldsymbol{\\beta}_1 - \\boldsymbol{\\beta}_2 + \\boldsymbol{\\beta}_3 - \\boldsymbol{\\beta}_4 \\\\ = &(\\boldsymbol{\\alpha}_1 + \\boldsymbol{\\alpha}_2) - (\\boldsymbol{\\alpha}_2 + \\boldsymbol{\\alpha}_3) + (\\boldsymbol{\\alpha}_3 + \\boldsymbol{\\alpha}_4) - (\\boldsymbol{\\alpha}_4 + \\boldsymbol{\\alpha}_1) \\\\ = &(\\boldsymbol{\\alpha}_1 - \\boldsymbol{\\alpha}_1) + (\\boldsymbol{\\alpha}_2 - \\boldsymbol{\\alpha}_2) + (\\boldsymbol{\\alpha}_3 - \\boldsymbol{\\alpha}_3) + (\\boldsymbol{\\alpha}_4 - \\boldsymbol{\\alpha}_4) \\\\ = &\\mathbf{0}. \\end{aligned}$$\n即存在一组不全为零的数 $k_1 = 1, k_2 = -1, k_3 = 1, k_4 = -1$，使得\n$$k_1\\boldsymbol{\\beta}_1 + k_2\\boldsymbol{\\beta}_2 + k_3\\boldsymbol{\\beta}_3 + k_4\\boldsymbol{\\beta}_4 = \\mathbf{0}.$$\n故向量组 $\\boldsymbol{\\beta}_1, \\boldsymbol{\\beta}_2, \\boldsymbol{\\beta}_3, \\boldsymbol{\\beta}_4$ 线性相关。"
    }
  },
  {
    id: "LAG-TB-CH04-Q11",
    source_type: "textbook",
    source: {
      paper_id: 2004,
      raw_title: "《线性代数与几何》第4章 向量组的线性相关性 课后习题",
      clean_title: "《线性代数与几何》第4章 向量组的线性相关性 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 4 章 · 习题四 第 11 题",
      page_start: 116,
      page_end: 116
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
        chapter: 4,
        chapter_title: "第4章 向量组的线性相关性",
        section: "4.2",
        section_title: "向量组的线性相关性",
        section_slug: "4.2_向量组的线性相关性",
        knowledge_points: ["线性表出唯一性", "充要条件证明"]
      }
    },
    content: {
      stem: "设向量 $\\boldsymbol{\\beta}$ 可由向量组 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_m$ 线性表出，试证明表示法唯一的充分必要条件是 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_m$ 线性无关。"
    },
    solution: {
      answer: "证明略。",
      hints: "分别证明充分性（假设有两种表示，相减利用无关性）和必要性（若相关则可由非零零组合得到另一种表示）。",
      steps: "**充分性**：若 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_m$ 线性无关。\n设 $\\boldsymbol{\\beta}$ 有两种表示法：\n$$\\boldsymbol{\\beta} = x_1\\boldsymbol{\\alpha}_1 + \\cdots + x_m\\boldsymbol{\\alpha}_m = y_1\\boldsymbol{\\alpha}_1 + \\cdots + y_m\\boldsymbol{\\alpha}_m$$\n两式相减得：\n$$(x_1 - y_1)\\boldsymbol{\\alpha}_1 + \\cdots + (x_m - y_m)\\boldsymbol{\\alpha}_m = \\mathbf{0}$$\n因为 $\\boldsymbol{\\alpha}_1, \\cdots, \\boldsymbol{\\alpha}_m$ 线性无关，所以 $x_i - y_i = 0$，即 $x_i = y_i (i=1, 2, \\cdots, m)$，表示法唯一。\n\n**必要性**：若表示法唯一。\n假设 $\\boldsymbol{\\alpha}_1, \\cdots, \\boldsymbol{\\alpha}_m$ 线性相关，则存在不全为零的数 $c_1, \\cdots, c_m$ 使得 $\\sum_{i=1}^m c_i\\boldsymbol{\\alpha}_i = \\mathbf{0}$。\n设 $\\boldsymbol{\\beta} = \\sum_{i=1}^m x_i\\boldsymbol{\\alpha}_i$，则\n$$\\boldsymbol{\\beta} = \\sum_{i=1}^m (x_i + c_i)\\boldsymbol{\\alpha}_i$$\n因为 $c_i$ 不全为零，这与表示法唯一矛盾。故 $\\boldsymbol{\\alpha}_1, \\cdots, \\boldsymbol{\\alpha}_m$ 线性无关。"
    }
  },
  {
    id: "LAG-TB-CH04-Q12",
    source_type: "textbook",
    source: {
      paper_id: 2004,
      raw_title: "《线性代数与几何》第4章 向量组的线性相关性 课后习题",
      clean_title: "《线性代数与几何》第4章 向量组的线性相关性 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 4 章 · 习题四 第 12 题",
      page_start: 116,
      page_end: 116
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
        chapter: 4,
        chapter_title: "第4章 向量组的线性相关性",
        section: "4.3",
        section_title: "线性相关性的判别定理",
        section_slug: "4.3_线性相关性的判别定理",
        knowledge_points: ["替换定理", "线性无关性证明"]
      }
    },
    content: {
      stem: "设向量组 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_r$ 线性无关，$\\boldsymbol{\\beta} = b_1\\boldsymbol{\\alpha}_1 + b_2\\boldsymbol{\\alpha}_2 + \\cdots + b_r\\boldsymbol{\\alpha}_r$。证明：如果某个 $b_i \\neq 0$，则用 $\\boldsymbol{\\beta}$ 替换 $\\boldsymbol{\\alpha}_i$ 后得到的向量组 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_{i-1}, \\boldsymbol{\\beta}, \\boldsymbol{\\alpha}_{i+1}, \\cdots, \\boldsymbol{\\alpha}_r$ 也线性无关。"
    },
    solution: {
      answer: "证明略。",
      hints: "设替换后的向量组的线性组合为零，将 $\\boldsymbol{\\beta}$ 展开，利用原向量组的线性无关性说明系数必全为零。",
      steps: "不妨设 $b_r \\neq 0$（其余情况完全同理）。\n设 $k_1\\boldsymbol{\\alpha}_1 + \\cdots + k_{r-1}\\boldsymbol{\\alpha}_{r-1} + k_r\\boldsymbol{\\beta} = \\mathbf{0}$。\n将 $\\boldsymbol{\\beta} = b_1\\boldsymbol{\\alpha}_1 + \\cdots + b_r\\boldsymbol{\\alpha}_r$ 代入得：\n$$(k_1 + k_r b_1)\\boldsymbol{\\alpha}_1 + \\cdots + (k_{r-1} + k_r b_{r-1})\\boldsymbol{\\alpha}_{r-1} + k_r b_r\\boldsymbol{\\alpha}_r = \\mathbf{0}$$\n因为原向量组 $\\boldsymbol{\\alpha}_1, \\cdots, \\boldsymbol{\\alpha}_r$ 线性无关，所以各项系数全为零：\n$$\\begin{cases} k_1 + k_r b_1 = 0 \\\\ \\vdots \\\\ k_{r-1} + k_r b_{r-1} = 0 \\\\ k_r b_r = 0 \\end{cases}$$\n由于已知 $b_r \\neq 0$，由 $k_r b_r = 0$ 必得 $k_r = 0$。\n将 $k_r = 0$ 代入前面各方程，得 $k_1 = k_2 = \\cdots = k_{r-1} = 0$。\n因此所有组合系数全为零，替换后的向量组线性无关。"
    }
  },
  {
    id: "LAG-TB-CH04-Q13",
    source_type: "textbook",
    source: {
      paper_id: 2004,
      raw_title: "《线性代数与几何》第4章 向量组的线性相关性 课后习题",
      clean_title: "《线性代数与几何》第4章 向量组的线性相关性 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 4 章 · 习题四 第 13 题",
      page_start: 116,
      page_end: 117
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
        chapter: 4,
        chapter_title: "第4章 向量组的线性相关性",
        section: "4.4",
        section_title: "向量组的秩",
        section_slug: "4.4_向量组的秩",
        knowledge_points: ["向量组的秩", "极大线性无关组", "初等行变换"]
      }
    },
    content: {
      stem: "求下列向量组的秩，并求一个极大线性无关组：\n\n(1) $\\boldsymbol{\\alpha}_1 = (1,2,-1,4)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_2 = (9,100,10,4)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_3 = (-2,-4,2,-8)^{\\mathrm{T}}$；\n\n(2) $\\boldsymbol{\\alpha}_1 = (1,2,1,3)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_2 = (4,-1,-5,-6)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_3 = (1,-3,-4,-7)^{\\mathrm{T}}$；\n\n(3) $\\boldsymbol{\\alpha}_1 = (1,3,6,2)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_2 = (2,1,2,-1)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_3 = (3,5,10,2)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_4 = (-2,1,2,3)^{\\mathrm{T}}$；\n\n(4) $\\boldsymbol{\\alpha}_1 = (1,0,-2,1)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_2 = (3,1,0,-1)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_3 = (1,1,4,-3)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_4 = (3,0,10,3)^{\\mathrm{T}}$；\n\n(5) $\\boldsymbol{\\alpha}_1 = (1,-2,-1,0,2)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_2 = (1,-2,-1,-3,3)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_3 = (2,-1,0,2,3)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_4 = (3,3,3,3,4)^{\\mathrm{T}}$。",
      sub_questions: [
        { sub_id: "(1)", stem: "$\\boldsymbol{\\alpha}_1 = (1,2,-1,4)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_2 = (9,100,10,4)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_3 = (-2,-4,2,-8)^{\\mathrm{T}}$", answer: "秩为 $2$，极大线性无关组为 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2$" },
        { sub_id: "(2)", stem: "$\\boldsymbol{\\alpha}_1 = (1,2,1,3)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_2 = (4,-1,-5,-6)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_3 = (1,-3,-4,-7)^{\\mathrm{T}}$", answer: "秩为 $2$，极大线性无关组为 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2$" },
        { sub_id: "(3)", stem: "$\\boldsymbol{\\alpha}_1 = (1,3,6,2)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_2 = (2,1,2,-1)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_3 = (3,5,10,2)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_4 = (-2,1,2,3)^{\\mathrm{T}}$", answer: "秩为 $2$，极大线性无关组为 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2$" },
        { sub_id: "(4)", stem: "$\\boldsymbol{\\alpha}_1 = (1,0,-2,1)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_2 = (3,1,0,-1)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_3 = (1,1,4,-3)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_4 = (3,0,10,3)^{\\mathrm{T}}$", answer: "秩为 $3$，极大线性无关组为 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_4$" },
        { sub_id: "(5)", stem: "$\\boldsymbol{\\alpha}_1 = (1,-2,-1,0,2)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_2 = (1,-2,-1,-3,3)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_3 = (2,-1,0,2,3)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_4 = (3,3,3,3,4)^{\\mathrm{T}}$", answer: "秩为 $3$，极大线性无关组为 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3$" }
      ]
    },
    solution: {
      answer: "(1) 秩为 $2$，极大线性无关组为 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2$；\n(2) 秩为 $2$，极大线性无关组为 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2$；\n(3) 秩为 $2$，极大线性无关组为 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2$；\n(4) 秩为 $3$，极大线性无关组为 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_4$；\n(5) 秩为 $3$，极大线性无关组为 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3$。",
      hints: "将向量作为列构成矩阵，进行初等行变换化为行阶梯形矩阵，主元所在的列对应的原向量即构成极大线性无关组，主元个数即为秩。",
      steps: "(1) 注意到 $\\boldsymbol{\\alpha}_3 = -2\\boldsymbol{\\alpha}_1$，而 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2$ 不成比例，故秩为 $2$，极大线性无关组为 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2$；\n(2) 构造矩阵施行初等行变换得秩为 $2$，极大线性无关组为 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2$；\n(3) 构造矩阵经初等行变换，非零行数为 $2$，极大线性无关组可取 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2$；\n(4) 构造矩阵初等行变换后首非零元位于第 1、2、4 列，秩为 $3$，极大线性无关组为 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_4$；\n(5) 构造矩阵初等行变换得秩为 $3$，极大线性无关组可取 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3$。"
    }
  },
  {
    id: "LAG-TB-CH04-Q14",
    source_type: "textbook",
    source: {
      paper_id: 2004,
      raw_title: "《线性代数与几何》第4章 向量组的线性相关性 课后习题",
      clean_title: "《线性代数与几何》第4章 向量组的线性相关性 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 4 章 · 习题四 第 14 题",
      page_start: 117,
      page_end: 117
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
        chapter: 4,
        chapter_title: "第4章 向量组的线性相关性",
        section: "4.4",
        section_title: "向量组的秩",
        section_slug: "4.4_向量组的秩",
        knowledge_points: ["极大线性无关组", "行最简形矩阵", "线性表示"]
      }
    },
    content: {
      stem: "求向量组 $\\boldsymbol{\\alpha}_1 = \\left(0, 2, 5, 1, \\frac{1}{2}\\right)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_2 = \\left(2, 2, -\\frac{1}{2}, 1, 1\\right)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_3 = (-8, -1, 12, 4, -3)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_4 = (4, 3, -1, 0, 2)^{\\mathrm{T}}$ 的一个极大线性无关组，并用极大线性无关组表示向量组中其余向量。"
    },
    solution: {
      answer: "极大线性无关组为 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3$；$\\boldsymbol{\\alpha}_4 = \\frac{2}{3}\\boldsymbol{\\alpha}_1 + \\frac{2}{3}\\boldsymbol{\\alpha}_2 - \\frac{1}{3}\\boldsymbol{\\alpha}_3$。",
      hints: "以向量为列构成矩阵 $(\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3, \\boldsymbol{\\alpha}_4)$，施行初等行变换化为行最简形矩阵，直接读取极大线性无关组及线性表示系数。",
      steps: "将 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3, \\boldsymbol{\\alpha}_4$ 按列排成矩阵施行初等行变换：\n$$\\begin{pmatrix} 0 & 2 & -8 & 4 \\\\ 2 & 2 & -1 & 3 \\\\ 5 & -1/2 & 12 & -1 \\\\ 1 & 1 & 4 & 0 \\\\ 1/2 & 1 & -3 & 2 \\end{pmatrix} \\to \\begin{pmatrix} 1 & 0 & 0 & 2/3 \\\\ 0 & 1 & 0 & 2/3 \\\\ 0 & 0 & 1 & -1/3 \\\\ 0 & 0 & 0 & 0 \\\\ 0 & 0 & 0 & 0 \\end{pmatrix}$$\n前 3 列为主元列，故一个极大线性无关组为 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3$。\n第 4 列在基下的坐标即最后一列的元素，故\n$$\\boldsymbol{\\alpha}_4 = \\frac{2}{3}\\boldsymbol{\\alpha}_1 + \\frac{2}{3}\\boldsymbol{\\alpha}_2 - \\frac{1}{3}\\boldsymbol{\\alpha}_3.$$"
    }
  },
  {
    id: "LAG-TB-CH04-Q15",
    source_type: "textbook",
    source: {
      paper_id: 2004,
      raw_title: "《线性代数与几何》第4章 向量组的线性相关性 课后习题",
      clean_title: "《线性代数与几何》第4章 向量组的线性相关性 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 4 章 · 习题四 第 15 题",
      page_start: 117,
      page_end: 117
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 15,
      paper_q_num: 15,
      type: "proof",
      difficulty: 2,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 4,
        chapter_title: "第4章 向量组的线性相关性",
        section: "4.4",
        section_title: "向量组的秩",
        section_slug: "4.4_向量组的秩",
        knowledge_points: ["向量组的秩定理", "线性无关性证明"]
      }
    },
    content: {
      stem: "设 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_n$ 是一组 $n$ 维向量，已知 $n$ 维单位坐标向量 $\\boldsymbol{e}_1, \\boldsymbol{e}_2, \\cdots, \\boldsymbol{e}_n$ 能由它们线性表出，证明 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_n$ 线性无关。"
    },
    solution: {
      answer: "证明略。",
      hints: "利用向量组秩的不等式：若向量组可以由另一向量组线性表出，则其秩不超过被表出向量组的秩。",
      steps: "已知 $n$ 维单位坐标向量组 $\\boldsymbol{e}_1, \\boldsymbol{e}_2, \\cdots, \\boldsymbol{e}_n$ 线性无关，其秩为 $n$。\n由于 $\\boldsymbol{e}_1, \\boldsymbol{e}_2, \\cdots, \\boldsymbol{e}_n$ 能由向量组 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_n$ 线性表出，\n根据向量组线性表出与秩的关系定理，必有：\n$$r(\\boldsymbol{e}_1, \\boldsymbol{e}_2, \\cdots, \\boldsymbol{e}_n) \\leqslant r(\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_n)$$\n从而 $n \\leqslant r(\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_n)$。\n又因为向量组只含有 $n$ 个向量，其秩最大为 $n$，故 $r(\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_n) = n$。\n因此向量组 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_n$ 线性无关。"
    }
  },
  {
    id: "LAG-TB-CH04-Q16",
    source_type: "textbook",
    source: {
      paper_id: 2004,
      raw_title: "《线性代数与几何》第4章 向量组的线性相关性 课后习题",
      clean_title: "《线性代数与几何》第4章 向量组的线性相关性 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 4 章 · 习题四 第 16 题",
      page_start: 117,
      page_end: 117
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 16,
      paper_q_num: 16,
      type: "proof",
      difficulty: 2,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 4,
        chapter_title: "第4章 向量组的线性相关性",
        section: "4.4",
        section_title: "向量组的秩",
        section_slug: "4.4_向量组的秩",
        knowledge_points: ["充要条件证明", "向量组的秩", "满秩与生成空间"]
      }
    },
    content: {
      stem: "设 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_n$ 是一组 $n$ 维向量，证明它们线性无关的充分必要条件是：任一 $n$ 维向量都可由它们线性表出。"
    },
    solution: {
      answer: "证明略。",
      hints: "将问题转化为矩阵方阵的秩 $r(\\boldsymbol{A}) = n$ 与非齐次线性方程组解的存在性。",
      steps: "**充分性**：若任一 $n$ 维向量都可由 $\\boldsymbol{\\alpha}_1, \\cdots, \\boldsymbol{\\alpha}_n$ 线性表出，特别地，单位基向量 $\\boldsymbol{e}_1, \\cdots, \\boldsymbol{e}_n$ 可由它们线性表出。\n由第 15 题结论，必有 $r(\\boldsymbol{\\alpha}_1, \\cdots, \\boldsymbol{\\alpha}_n) \\geqslant r(\\boldsymbol{e}_1, \\cdots, \\boldsymbol{e}_n) = n$，故向量组线性无关。\n\n**必要性**：若 $\\boldsymbol{\\alpha}_1, \\cdots, \\boldsymbol{\\alpha}_n$ 线性无关，以它们为列构成的矩阵 $\\boldsymbol{A} = (\\boldsymbol{\\alpha}_1, \\cdots, \\boldsymbol{\\alpha}_n)$ 为 $n$ 阶满秩可逆矩阵，$|\\boldsymbol{A}| \\neq 0$。\n对任一 $n$ 维向量 $\\boldsymbol{\\beta}$，线性方程组 $\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{\\beta}$ 的系数矩阵满秩，由克拉默法则该方程组恒有唯一解 $\\boldsymbol{x} = \\boldsymbol{A}^{-1}\\boldsymbol{\\beta}$。\n即 $\\boldsymbol{\\beta}$ 必可由 $\\boldsymbol{\\alpha}_1, \\cdots, \\boldsymbol{\\alpha}_n$ 线性表出。"
    }
  }
];
