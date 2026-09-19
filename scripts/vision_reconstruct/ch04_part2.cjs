// scripts/vision_reconstruct/ch04_part2.cjs
module.exports = [
  {
    id: "LAG-TB-CH04-Q17",
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
      source_desc: "《线性代数与几何》第 4 章 · 习题四 第 17 题",
      page_start: 117,
      page_end: 117
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 17,
      paper_q_num: 17,
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
        knowledge_points: ["极大线性无关组定义", "等价向量组"]
      }
    },
    content: {
      stem: "证明：如果秩为 $r$ 的向量组可以由它的 $r$ 个向量线性表出，则这 $r$ 个向量构成这个向量组的一个极大线性无关组。"
    },
    solution: {
      answer: "证明略。",
      hints: "根据极大线性无关组的两条定义条件：自身线性无关，且向量组中任一向量均可由其线性表出。",
      steps: "设原向量组为 $T$，其秩为 $r(T) = r$。选出的 $r$ 个向量记为部分组 $T_0$。\n已知 $T$ 中每个向量均可由 $T_0$ 线性表出，所以 $r(T) \\leqslant r(T_0)$。\n又因为 $T_0 \\subseteq T$，显然有 $r(T_0) \\leqslant r(T)$。\n因此 $r(T_0) = r(T) = r$。\n而 $T_0$ 恰好由 $r$ 个向量组成，其秩等于向量个数 $r$，故 $T_0$ 自身线性无关。\n结合“$T_0$ 自身线性无关”且“$T$ 的任一向量可由 $T_0$ 线性表出”，由极大线性无关组的定义，这 $r$ 个向量构成向量组 $T$ 的一个极大线性无关组。"
    }
  },
  {
    id: "LAG-TB-CH04-Q18",
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
      source_desc: "《线性代数与几何》第 4 章 · 习题四 第 18 题",
      page_start: 117,
      page_end: 117
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 18,
      paper_q_num: 18,
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
        knowledge_points: ["线性方程组解的存在性", "克拉默法则", "矩阵行列式非零"]
      }
    },
    content: {
      stem: "证明：$n$ 个方程的 $n$ 元线性方程组\n$$x_1\\boldsymbol{\\alpha}_1 + x_2\\boldsymbol{\\alpha}_2 + \\cdots + x_n\\boldsymbol{\\alpha}_n = \\boldsymbol{\\beta}$$\n对任何 $\\boldsymbol{\\beta} \\in \\mathbf{R}^n$ 都有解的充分必要条件是它的系数行列式 $|\\boldsymbol{A}| \\neq 0$。"
    },
    solution: {
      answer: "证明略。",
      hints: "将向量方程改写为矩阵形式 $\\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{\\beta}$，利用线性方程组有解条件与向量组满秩的等价性。",
      steps: "记矩阵 $\\boldsymbol{A} = (\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_n)$。\n**充分性**：若 $|\\boldsymbol{A}| \\neq 0$，则 $\\boldsymbol{A}$ 可逆。对任意 $\\boldsymbol{\\beta} \\in \\mathbf{R}^n$，取 $\\boldsymbol{x} = \\boldsymbol{A}^{-1}\\boldsymbol{\\beta}$ 即为方程组的解。故充分性成立。\n**必要性**：若对任意 $\\boldsymbol{\\beta} \\in \\mathbf{R}^n$ 方程组都有解，这意味着任意向量 $\\boldsymbol{\\beta}$ 均可由列向量组 $\\boldsymbol{\\alpha}_1, \\cdots, \\boldsymbol{\\alpha}_n$ 线性表出。\n根据第 16 题的结论，列向量组 $\\boldsymbol{\\alpha}_1, \\cdots, \\boldsymbol{\\alpha}_n$ 必线性无关。\n因此方阵 $\\boldsymbol{A}$ 满秩，即 $r(\\boldsymbol{A}) = n$，由此可得其行列式 $|\\boldsymbol{A}| \\neq 0$。"
    }
  },
  {
    id: "LAG-TB-CH04-Q19",
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
      source_desc: "《线性代数与几何》第 4 章 · 习题四 第 19 题",
      page_start: 117,
      page_end: 117
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 19,
      paper_q_num: 19,
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
        knowledge_points: ["向量组并集的秩", "极大小组并集", "秩的次可加性"]
      }
    },
    content: {
      stem: "证明：$r(\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_r, \\boldsymbol{\\beta}_1, \\boldsymbol{\\beta}_2, \\cdots, \\boldsymbol{\\beta}_s) \\leqslant r(\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_r) + r(\\boldsymbol{\\beta}_1, \\boldsymbol{\\beta}_2, \\cdots, \\boldsymbol{\\beta}_s)$。"
    },
    solution: {
      answer: "证明略。",
      hints: "分别取两个向量组的极大线性无关组，合并后可以线性表出原合并向量组，利用极大无关组向量个数与秩的关系。",
      steps: "设向量组 $\\mathrm{I}: \\boldsymbol{\\alpha}_1, \\cdots, \\boldsymbol{\\alpha}_r$ 的一个极大线性无关组为 $\\boldsymbol{\\alpha}_{i_1}, \\cdots, \\boldsymbol{\\alpha}_{i_p}$，则 $p = r(\\mathrm{I})$；\n设向量组 $\\mathrm{II}: \\boldsymbol{\\beta}_1, \\cdots, \\boldsymbol{\\beta}_s$ 的一个极大线性无关组为 $\\boldsymbol{\\beta}_{j_1}, \\cdots, \\boldsymbol{\\beta}_{j_q}$，则 $q = r(\\mathrm{II})$。\n考察合并向量组 $\\mathrm{III}: \\boldsymbol{\\alpha}_{i_1}, \\cdots, \\boldsymbol{\\alpha}_{i_p}, \\boldsymbol{\\beta}_{j_1}, \\cdots, \\boldsymbol{\\beta}_{j_q}$。\n原向量组中任一 $\\boldsymbol{\\alpha}_k$ 均可由 $\\boldsymbol{\\alpha}_{i_1}, \\cdots, \\boldsymbol{\\alpha}_{i_p}$ 表出，任一 $\\boldsymbol{\\beta}_l$ 均可由 $\\boldsymbol{\\beta}_{j_1}, \\cdots, \\boldsymbol{\\beta}_{j_q}$ 表出，\n故合并组 $(\\boldsymbol{\\alpha}_1, \\cdots, \\boldsymbol{\\alpha}_r, \\boldsymbol{\\beta}_1, \\cdots, \\boldsymbol{\\beta}_s)$ 中所有向量皆可由 $\\mathrm{III}$ 线性表出。\n因此：\n$$r(\\boldsymbol{\\alpha}_1, \\cdots, \\boldsymbol{\\alpha}_r, \\boldsymbol{\\beta}_1, \\cdots, \\boldsymbol{\\beta}_s) \\leqslant r(\\mathrm{III})$$\n而 $\\mathrm{III}$ 仅由 $p+q$ 个向量组成，其秩必有 $r(\\mathrm{III}) \\leqslant p + q$。\n故 $r(\\boldsymbol{\\alpha}_1, \\cdots, \\boldsymbol{\\alpha}_r, \\boldsymbol{\\beta}_1, \\cdots, \\boldsymbol{\\beta}_s) \\leqslant p + q = r(\\boldsymbol{\\alpha}_1, \\cdots, \\boldsymbol{\\alpha}_r) + r(\\boldsymbol{\\beta}_1, \\cdots, \\boldsymbol{\\beta}_s)$。"
    }
  },
  {
    id: "LAG-TB-CH04-Q20",
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
      source_desc: "《线性代数与几何》第 4 章 · 习题四 第 20 题",
      page_start: 117,
      page_end: 117
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 20,
      paper_q_num: 20,
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
        knowledge_points: ["矩阵和的秩", "分块矩阵初等变换", "列向量线性组合"]
      }
    },
    content: {
      stem: "证明 $r(\\boldsymbol{A}+\\boldsymbol{B}) \\leqslant r(\\boldsymbol{A}) + r(\\boldsymbol{B})$。"
    },
    solution: {
      answer: "证明略。",
      hints: "利用列向量组的线性表出，或利用分块矩阵的初等变换证明。",
      steps: "设矩阵 $\\boldsymbol{A}, \\boldsymbol{B}$ 的列向量分别为 $\\boldsymbol{\\alpha}_1, \\cdots, \\boldsymbol{\\alpha}_n$ 和 $\\boldsymbol{\\beta}_1, \\cdots, \\boldsymbol{\\beta}_n$。\n则 $\\boldsymbol{A}+\\boldsymbol{B}$ 的列向量为 $\\boldsymbol{\\alpha}_1+\\boldsymbol{\\beta}_1, \\cdots, \\boldsymbol{\\alpha}_n+\\boldsymbol{\\beta}_n$。\n每一个向量 $\\boldsymbol{\\alpha}_j+\\boldsymbol{\\beta}_j$ 都是向量组 $\\boldsymbol{\\alpha}_1, \\cdots, \\boldsymbol{\\alpha}_n, \\boldsymbol{\\beta}_1, \\cdots, \\boldsymbol{\\beta}_n$ 的线性组合。\n由向量组线性表出与秩的关系及第 19 题结论：\n$$r(\\boldsymbol{A}+\\boldsymbol{B}) = r(\\boldsymbol{\\alpha}_1+\\boldsymbol{\\beta}_1, \\cdots, \\boldsymbol{\\alpha}_n+\\boldsymbol{\\beta}_n) \\leqslant r(\\boldsymbol{\\alpha}_1, \\cdots, \\boldsymbol{\\alpha}_n, \\boldsymbol{\\beta}_1, \\cdots, \\boldsymbol{\\beta}_n) \\leqslant r(\\boldsymbol{A}) + r(\\boldsymbol{B}).$$"
    }
  },
  {
    id: "LAG-TB-CH04-Q21",
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
      source_desc: "《线性代数与几何》第 4 章 · 习题四 第 21 题",
      page_start: 117,
      page_end: 117
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 21,
      paper_q_num: 21,
      type: "calc",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 4,
        chapter_title: "第4章 向量组的线性相关性",
        section: "4.5",
        section_title: "向量空间",
        section_slug: "4.5_向量空间",
        knowledge_points: ["向量空间判别", "封闭性", "基与维数"]
      }
    },
    content: {
      stem: "判别下面的集合是否构成向量空间，若构成向量空间，求一个基及维数：\n\n(1) 平面上不平行于某一向量的所有向量的集合；\n\n(2) $V = \\{\\boldsymbol{\\alpha}=(x_1, x_2, \\cdots, x_n) \\mid x_1 + x_2 + \\cdots + x_n = 0\\}$；\n\n(3) $V = \\{\\boldsymbol{\\alpha}=(x_1, x_2, \\cdots, x_n) \\mid x_1 + x_2 + \\cdots + x_n = 1\\}$；\n\n(4) $V = \\{\\boldsymbol{\\alpha}=(x_1, x_2, x_3) \\mid x_1 = 5x_2\\}$。",
      sub_questions: [
        { sub_id: "(1)", stem: "平面上不平行于某一向量的所有向量的集合", answer: "不是向量空间" },
        { sub_id: "(2)", stem: "$V = \\{\\boldsymbol{\\alpha}=(x_1, x_2, \\cdots, x_n) \\mid x_1 + x_2 + \\cdots + x_n = 0\\}$", answer: "构成向量空间，$\\dim V = n - 1$，基可取 $(-1,1,0,\\cdots,0), (-1,0,1,0,\\cdots,0), \\cdots, (-1,0,\\cdots,0,1)$" },
        { sub_id: "(3)", stem: "$V = \\{\\boldsymbol{\\alpha}=(x_1, x_2, \\cdots, x_n) \\mid x_1 + x_2 + \\cdots + x_n = 1\\}$", answer: "不是向量空间" },
        { sub_id: "(4)", stem: "$V = \\{\\boldsymbol{\\alpha}=(x_1, x_2, x_3) \\mid x_1 = 5x_2\\}$", answer: "构成向量空间，$\\dim V = 2$，基可取 $(5,1,0), (0,0,1)$" }
      ]
    },
    solution: {
      answer: "(1) 不是向量空间；\n(2) $\\dim V = n - 1$，基：$(-1,1,0,\\cdots,0), (-1,0,1,0,\\cdots,0), \\cdots, (-1,0,\\cdots,0,1)$；\n(3) 不是向量空间；\n(4) $\\dim V = 2$，基：$(5,1,0), (0,0,1)$。",
      hints: "验证加法与数乘的封闭性（注意零向量是否在集合中）；对于齐次线性方程组的解空间，求其基础解系作为基。",
      steps: "(1) 零向量与任何向量都平行，故零向量不在此集合中；且两个不平行的向量相加可能平行于该向量（对加法不封闭）。故不是向量空间。\n(2) $V$ 为齐次线性方程 $x_1+x_2+\\cdots+x_n=0$ 的解空间。对加法和数乘封闭，是向量空间。\n未知数有 $n$ 个，方程秩为 1，自由未知数有 $n-1$ 个，故 $\\dim V = n-1$。\n分别令自由未知数 $(x_2,\\cdots,x_n)$ 为标准基，得基向量 $(-1,1,0,\\cdots,0), \\cdots, (-1,0,\\cdots,0,1)$。\n(3) 零向量 $(0,0,\\cdots,0)$ 不满足 $0+0+\\cdots+0=1$，零向量不在集合中，对加法不封闭，故不是向量空间。\n(4) 方程 $x_1-5x_2=0$ 为齐次线性方程，解空间构成向量空间。未知数 3 个，方程秩为 1，$\\dim V = 3-1 = 2$。令自由变量 $x_2=1, x_3=0$ 得 $(5,1,0)$；令 $x_2=0, x_3=1$ 得 $(0,0,1)$。基为 $(5,1,0), (0,0,1)$。"
    }
  },
  {
    id: "LAG-TB-CH04-Q22",
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
      source_desc: "《线性代数与几何》第 4 章 · 习题四 第 22 题",
      page_start: 117,
      page_end: 117
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 22,
      paper_q_num: 22,
      type: "proof",
      difficulty: 1,
      score: 5
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 4,
        chapter_title: "第4章 向量组的线性相关性",
        section: "4.5",
        section_title: "向量空间",
        section_slug: "4.5_向量空间",
        knowledge_points: ["向量空间的基", "行列式不为零", "满秩判别"]
      }
    },
    content: {
      stem: "证明向量组 $\\boldsymbol{\\alpha}_1 = (1,1,0)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_2 = (0,0,2)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_3 = (0,3,2)^{\\mathrm{T}}$ 是 $\\mathbf{R}^3$ 上的一个基。"
    },
    solution: {
      answer: "证明略。",
      hints: "证明 3 个 3 维向量线性无关（如计算其构成的方阵行列式不为零）即可。",
      steps: "由 3 个向量作为列构成的三阶方阵：\n$$\\boldsymbol{A} = (\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3) = \\begin{pmatrix} 1 & 0 & 0 \\\\ 1 & 0 & 3 \\\\ 0 & 2 & 2 \\end{pmatrix}$$\n计算其行列式：\n$$|\\boldsymbol{A}| = 1 \\cdot \\begin{vmatrix} 0 & 3 \\\\ 2 & 2 \\end{vmatrix} = 1 \\cdot (0 - 6) = -6 \\neq 0.$$\n因为 $|\\boldsymbol{A}| \\neq 0$，所以向量组 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3$ 线性无关。\n又因为 $\\mathbf{R}^3$ 的维数为 3，3 个线性无关的向量必构成 $\\mathbf{R}^3$ 的一个基。"
    }
  },
  {
    id: "LAG-TB-CH04-Q23",
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
      source_desc: "《线性代数与几何》第 4 章 · 习题四 第 23 题",
      page_start: 117,
      page_end: 117
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 23,
      paper_q_num: 23,
      type: "calc",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 4,
        chapter_title: "第4章 向量组的线性相关性",
        section: "4.5",
        section_title: "向量空间",
        section_slug: "4.5_向量空间",
        knowledge_points: ["基的判定", "向量在基下的坐标", "初等行变换法"]
      }
    },
    content: {
      stem: "证明向量组 $\\boldsymbol{\\alpha}_1 = (1,1,0,1)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_2 = (2,1,3,1)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_3 = (1,1,0,0)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_4 = (0,1,-1,-1)^{\\mathrm{T}}$ 构成 $\\mathbf{R}^4$ 的一个基，并把向量 $\\boldsymbol{\\beta} = (2,2,4,1)^{\\mathrm{T}}$ 用这个基线性表出。"
    },
    solution: {
      answer: "$\\boldsymbol{\\beta} = \\boldsymbol{\\alpha}_1 + 2\\boldsymbol{\\alpha}_2 - 3\\boldsymbol{\\alpha}_3 + 2\\boldsymbol{\\alpha}_4$。",
      hints: "构造增广矩阵 $(\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3, \\boldsymbol{\\alpha}_4 \\mid \\boldsymbol{\\beta})$，施行初等行变换化为最简阶梯形，前 4 列若化为单位矩阵则证明是基，最后一列即为表出系数。",
      steps: "构造增广矩阵并进行初等行变换：\n$$\\begin{pmatrix} 1 & 2 & 1 & 0 & 2 \\\\ 1 & 1 & 1 & 1 & 2 \\\\ 0 & 3 & 0 & -1 & 4 \\\\ 1 & 1 & 0 & -1 & 1 \\end{pmatrix} \\to \\begin{pmatrix} 1 & 0 & 0 & 0 & 1 \\\\ 0 & 1 & 0 & 0 & 2 \\\\ 0 & 0 & 1 & 0 & -3 \\\\ 0 & 0 & 0 & 1 & 2 \\end{pmatrix}$$\n系数矩阵满秩，故 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3, \\boldsymbol{\\alpha}_4$ 线性无关，构成 $\\mathbf{R}^4$ 的一个基。\n最后一列对应坐标，故线性表示式为：\n$$\\boldsymbol{\\beta} = \\boldsymbol{\\alpha}_1 + 2\\boldsymbol{\\alpha}_2 - 3\\boldsymbol{\\alpha}_3 + 2\\boldsymbol{\\alpha}_4.$$"
    }
  },
  {
    id: "LAG-TB-CH04-Q24",
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
      source_desc: "《线性代数与几何》第 4 章 · 习题四 第 24 题",
      page_start: 117,
      page_end: 117
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 24,
      paper_q_num: 24,
      type: "calc",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 4,
        chapter_title: "第4章 向量组的线性相关性",
        section: "4.5",
        section_title: "向量空间",
        section_slug: "4.5_向量空间",
        knowledge_points: ["基与坐标", "相同坐标向量", "齐次线性方程组"]
      }
    },
    content: {
      stem: "在 $\\mathbf{R}^3$ 中求一个向量 $\\boldsymbol{\\gamma}$，使它在下面两个基：\n\n(1) $\\boldsymbol{\\alpha}_1 = (1,0,1)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_2 = (-1,0,0)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_3 = (0,1,1)^{\\mathrm{T}}$；\n\n(2) $\\boldsymbol{\\beta}_1 = (0,-1,1)^{\\mathrm{T}}, \\boldsymbol{\\beta}_2 = (1,-1,0)^{\\mathrm{T}}, \\boldsymbol{\\beta}_3 = (1,0,1)^{\\mathrm{T}}$\n\n下有相同的坐标。"
    },
    solution: {
      answer: "$\\boldsymbol{\\gamma} = (1,3,2)^{\\mathrm{T}}$（答案不唯一）。",
      hints: "设相同的坐标为 $(x_1, x_2, x_3)^{\\mathrm{T}}$，根据 $\\boldsymbol{\\gamma} = \\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{B}\\boldsymbol{x}$，得到齐次线性方程组 $(\\boldsymbol{A}-\\boldsymbol{B})\\boldsymbol{x} = \\mathbf{0}$，求其非零解。",
      steps: "记基矩阵 $\\boldsymbol{A} = (\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3) = \\begin{pmatrix} 1 & -1 & 0 \\\\ 0 & 0 & 1 \\\\ 1 & 0 & 1 \\end{pmatrix}$，$\\boldsymbol{B} = (\\boldsymbol{\\beta}_1, \\boldsymbol{\\beta}_2, \\boldsymbol{\\beta}_3) = \\begin{pmatrix} 0 & 1 & 1 \\\\ -1 & -1 & 0 \\\\ 1 & 0 & 1 \\end{pmatrix}$。\n设 $\\boldsymbol{\\gamma}$ 在两个基下的相同坐标为 $\\boldsymbol{x} = (x_1, x_2, x_3)^{\\mathrm{T}}$，则\n$$\\boldsymbol{\\gamma} = \\boldsymbol{A}\\boldsymbol{x} = \\boldsymbol{B}\\boldsymbol{x} \\iff (\\boldsymbol{A}-\\boldsymbol{B})\\boldsymbol{x} = \\mathbf{0}$$\n计算系数矩阵：\n$$\\boldsymbol{A} - \\boldsymbol{B} = \\begin{pmatrix} 1 & -2 & -1 \\\\ 1 & 1 & 1 \\\\ 0 & 0 & 0 \\end{pmatrix} \\to \\begin{pmatrix} 1 & 0 & 1/3 \\\\ 0 & 1 & 2/3 \\\\ 0 & 0 & 0 \\end{pmatrix}$$\n取基础解系 $\\boldsymbol{x} = (-1, -2, 3)^{\\mathrm{T}}$ 或非零特解。\n若取坐标 $\\boldsymbol{x} = (1, -1, 3)^{\\mathrm{T}}$ 等，代入求得向量 $\\boldsymbol{\\gamma}$。\n由教材答案给出特解为 $\\boldsymbol{\\gamma} = (1,3,2)^{\\mathrm{T}}$（任意非零倍数亦可）。"
    }
  },
  {
    id: "LAG-TB-CH04-Q25",
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
      source_desc: "《线性代数与几何》第 4 章 · 习题四 第 25 题",
      page_start: 117,
      page_end: 117
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 25,
      paper_q_num: 25,
      type: "calc",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 4,
        chapter_title: "第4章 向量组的线性相关性",
        section: "4.5",
        section_title: "向量空间",
        section_slug: "4.5_向量空间",
        knowledge_points: ["基与坐标", "下三角矩阵求逆", "递推回代"]
      }
    },
    content: {
      stem: "设 $\\mathbf{R}^n$ 的一个基为 $\\boldsymbol{\\alpha}_1 = (1,0,0,\\cdots,0)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_2 = (1,1,0,\\cdots,0)^{\\mathrm{T}}, \\cdots, \\boldsymbol{\\alpha}_n = (1,1,\\cdots,1)^{\\mathrm{T}}$，求向量 $\\boldsymbol{\\alpha} = (a_1, a_2, \\cdots, a_n)^{\\mathrm{T}}$ 在此基下的坐标。"
    },
    solution: {
      answer: "$a_1 - a_2, a_2 - a_3, \\cdots, a_{n-1} - a_n, a_n$（教材答案印为 $a_1 - a_2 - a_3 - \\cdots - a_n, a_2 - a_3 - \\cdots - a_n, \\cdots, a_{n-1} - a_n, a_n$）。",
      hints: "设坐标为 $(x_1, x_2, \\cdots, x_n)^{\\mathrm{T}}$，建立方程组 $\\sum_{j=1}^n x_j\\boldsymbol{\\alpha}_j = \\boldsymbol{\\alpha}$，从后向前回代求解各未知数。",
      steps: "设 $\\boldsymbol{\\alpha}$ 在该基下的坐标为 $(x_1, x_2, \\cdots, x_n)^{\\mathrm{T}}$，即\n$$\\boldsymbol{\\alpha} = x_1\\boldsymbol{\\alpha}_1 + x_2\\boldsymbol{\\alpha}_2 + \\cdots + x_n\\boldsymbol{\\alpha}_n$$\n写成分量方程：\n$$\\begin{cases} x_1 + x_2 + \\cdots + x_{n-1} + x_n = a_1 \\\\ x_2 + \\cdots + x_{n-1} + x_n = a_2 \\\\ \\vdots \\\\ x_{n-1} + x_n = a_{n-1} \\\\ x_n = a_n \\end{cases}$$\n由后向前依次相减可得：\n$$x_n = a_n, \\quad x_{n-1} = a_{n-1} - a_n, \\quad \\cdots, \\quad x_2 = a_2 - a_3, \\quad x_1 = a_1 - a_2$$\n故所求坐标为 $(a_1 - a_2, a_2 - a_3, \\cdots, a_{n-1} - a_n, a_n)$。\n（注：教材附录答案排版有笔误，多印了减号项，数学推导严格如上）。"
    }
  },
  {
    id: "LAG-TB-CH04-Q26",
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
      source_desc: "《线性代数与几何》第 4 章 · 习题四 第 26 题",
      page_start: 117,
      page_end: 117
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 26,
      paper_q_num: 26,
      type: "proof",
      difficulty: 3,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 4,
        chapter_title: "第4章 向量组的线性相关性",
        section: "4.4",
        section_title: "向量组的秩",
        section_slug: "4.4_向量组的秩",
        knowledge_points: ["矩阵乘积的秩", "过渡矩阵", "线性相关充要条件"]
      }
    },
    content: {
      stem: "设向量组 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_r$ 线性无关，又向量组 $\\boldsymbol{\\beta}_1, \\boldsymbol{\\beta}_2, \\cdots, \\boldsymbol{\\beta}_s$ 是 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_r$ 的线性组合，即\n$$\\boldsymbol{\\beta}_i = \\sum_{j=1}^r b_{ij}\\boldsymbol{\\alpha}_j \\quad (i=1, 2, \\cdots, s).$$\n证明：$\\boldsymbol{\\beta}_1, \\boldsymbol{\\beta}_2, \\cdots, \\boldsymbol{\\beta}_s$ 线性相关的充分必要条件是矩阵\n$$\\begin{pmatrix} b_{11} & b_{12} & \\cdots & b_{1r} \\\\ b_{21} & b_{22} & \\cdots & b_{2r} \\\\ \\vdots & \\vdots & & \\vdots \\\\ b_{s1} & b_{s2} & \\cdots & b_{sr} \\end{pmatrix}$$\n的秩小于 $s$。"
    },
    solution: {
      answer: "证明略。",
      hints: "记系数矩阵为 $\\boldsymbol{B}$，将组合式写成矩阵乘法形式 $(\\boldsymbol{\\beta}_1, \\cdots, \\boldsymbol{\\beta}_s) = (\\boldsymbol{\\alpha}_1, \\cdots, \\boldsymbol{\\alpha}_r)\\boldsymbol{B}^{\\mathrm{T}}$，利用 $\\boldsymbol{\\alpha}_i$ 的线性无关性建立联系。",
      steps: "设 $k_1\\boldsymbol{\\beta}_1 + k_2\\boldsymbol{\\beta}_2 + \\cdots + k_s\\boldsymbol{\\beta}_s = \\mathbf{0}$。\n代入 $\\boldsymbol{\\beta}_i = \\sum_{j=1}^r b_{ij}\\boldsymbol{\\alpha}_j$，交换求和次序得：\n$$\\sum_{j=1}^r \\left( \\sum_{i=1}^s k_i b_{ij} \\right) \\boldsymbol{\\alpha}_j = \\mathbf{0}$$\n因为 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_r$ 线性无关，所以每个关于 $\\boldsymbol{\\alpha}_j$ 的系数必为零：\n$$\\sum_{i=1}^s k_i b_{ij} = 0 \\quad (j=1, 2, \\cdots, r)$$\n写成矩阵形式即：\n$$(k_1, k_2, \\cdots, k_s) \\boldsymbol{B} = \\mathbf{0}^{\\mathrm{T}} \\iff \\boldsymbol{B}^{\\mathrm{T}} \\begin{pmatrix} k_1 \\\\ k_2 \\\\ \\vdots \\\\ k_s \\end{pmatrix} = \\mathbf{0}$$\n其中 $\\boldsymbol{B}$ 为 $s \\times r$ 矩阵，$\\boldsymbol{B}^{\\mathrm{T}}$ 为 $r \\times s$ 矩阵。\n向量组 $\\boldsymbol{\\beta}_1, \\cdots, \\boldsymbol{\\beta}_s$ 线性相关 $\\iff$ 存在不全为零的数 $k_1, \\cdots, k_s$ 使上式成立 $\\iff$ 齐次线性方程组 $\\boldsymbol{B}^{\\mathrm{T}}\\boldsymbol{k} = \\mathbf{0}$ 有非零解 $\\iff$ 未知数个数 $s > r(\\boldsymbol{B}^{\\mathrm{T}}) = r(\\boldsymbol{B})$ $\\iff r(\\boldsymbol{B}) < s$。"
    }
  },
  {
    id: "LAG-TB-CH04-Q27",
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
      source_desc: "《线性代数与几何》第 4 章 · 习题四 第 27 题",
      page_start: 118,
      page_end: 118
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 27,
      paper_q_num: 27,
      type: "calc",
      difficulty: 3,
      score: 10
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 4,
        chapter_title: "第4章 向量组的线性相关性",
        section: "4.4",
        section_title: "向量组的秩",
        section_slug: "4.4_向量组的秩",
        knowledge_points: ["矩阵的秩", "极大线性无关组", "范德蒙德行列式"]
      }
    },
    content: {
      stem: "设 $s \\times n$ 矩阵 $\\boldsymbol{A}$ 为\n$$\\boldsymbol{A} = \\begin{pmatrix} 1 & a & a^2 & \\cdots & a^{n-1} \\\\ 1 & a^2 & a^4 & \\cdots & a^{2(n-1)} \\\\ \\vdots & \\vdots & \\vdots & & \\vdots \\\\ 1 & a^s & a^{2s} & \\cdots & a^{s(n-1)} \\end{pmatrix},$$\n其中 $s \\leqslant n$，且当 $0 < r < n$ 时，$a^r \\neq 1$。求 $\\boldsymbol{A}$ 的秩和它的列向量组的一个极大线性无关组。"
    },
    solution: {
      answer: "$r(\\boldsymbol{A}) = s$，$\\boldsymbol{A}$ 的前 $s$ 列是 $\\boldsymbol{A}$ 的列向量组的一个极大线性无关组。",
      hints: "考察矩阵 $\\boldsymbol{A}$ 的前 $s$ 列构成的 $s$ 阶子式，利用范德蒙德行列式公式判断其是否为零。",
      steps: "取 $\\boldsymbol{A}$ 的前 $s$ 列构成 $s \\times s$ 方阵 $\\boldsymbol{A}_1$：\n$$\\boldsymbol{A}_1 = \\begin{pmatrix} 1 & a & a^2 & \\cdots & a^{s-1} \\\\ 1 & a^2 & a^4 & \\cdots & a^{2(s-1)} \\\\ \\vdots & \\vdots & \\vdots & & \\vdots \\\\ 1 & a^s & a^{2s} & \\cdots & a^{s(s-1)} \\end{pmatrix}$$\n该矩阵的转置 $\\boldsymbol{A}_1^{\\mathrm{T}}$ 为由 $1, a, a^2, \\cdots, a^s$（第 $i$ 行公比为 $a^i$）构成的范德蒙德行列式：\n$$|\\boldsymbol{A}_1| = \\prod_{1 \\leqslant j < i \\leqslant s} (a^i - a^j) = \\prod_{1 \\leqslant j < i \\leqslant s} a^j(a^{i-j} - 1)$$\n由于当 $0 < r < n$ 时，$a^r \\neq 1$，而 $1 \\leqslant i - j \\leqslant s - 1 < n$，故 $a^{i-j} - 1 \\neq 0$；且因 $a^r \\neq 1$ 知 $a \\neq 0$。\n因此 $|\\boldsymbol{A}_1| \\neq 0$。\n这说明矩阵 $\\boldsymbol{A}$ 存在一个 $s$ 阶非零子式，又因为 $\\boldsymbol{A}$ 只有 $s$ 行，故 $r(\\boldsymbol{A}) \\leqslant s$。\n由此可得 $r(\\boldsymbol{A}) = s$。\n因为前 $s$ 列构成的方阵满秩，所以前 $s$ 列线性无关，即 $\\boldsymbol{A}$ 的前 $s$ 列是其列向量组的一个极大线性无关组。"
    }
  },
  {
    id: "LAG-TB-CH04-Q28",
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
      source_desc: "《线性代数与几何》第 4 章 · 习题四 第 28 题",
      page_start: 118,
      page_end: 118
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 28,
      paper_q_num: 28,
      type: "proof",
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
        knowledge_points: ["范德蒙德行列式", "向量个数与维数", "线性相关性判定"]
      }
    },
    content: {
      stem: "设 $\\lambda_1, \\lambda_2, \\cdots, \\lambda_k$ 为互不相同的数，向量组 $\\boldsymbol{\\alpha}_i = (1, \\lambda_i, \\lambda_i^2, \\cdots, \\lambda_i^{n-1}), i=1, 2, \\cdots, k$。证明：\n\n(1) $k \\leqslant n$ 时，向量组线性无关；\n\n(2) $k > n$ 时，向量组线性相关。"
    },
    solution: {
      answer: "证明略。",
      hints: "(1) 考察由向量作为行组成的矩阵，取前 $k$ 列构成 $k$ 阶范德蒙德行列式；(2) $n$ 维向量空间中超过 $n$ 个向量必线性相关。",
      steps: "(1) 当 $k \\leqslant n$ 时，以 $\\boldsymbol{\\alpha}_1, \\cdots, \\boldsymbol{\\alpha}_k$ 为行向量构成 $k \\times n$ 矩阵 $\\boldsymbol{A}$。\n取 $\\boldsymbol{A}$ 的前 $k$ 列构成的 $k$ 阶子式：\n$$D_k = \\begin{vmatrix} 1 & \\lambda_1 & \\lambda_1^2 & \\cdots & \\lambda_1^{k-1} \\\\ 1 & \\lambda_2 & \\lambda_2^2 & \\cdots & \\lambda_2^{k-1} \\\\ \\vdots & \\vdots & \\vdots & & \\vdots \\\\ 1 & \\lambda_k & \\lambda_k^2 & \\cdots & \\lambda_k^{k-1} \\end{vmatrix} = \\prod_{1 \\leqslant j < i \\leqslant k} (\\lambda_i - \\lambda_j)$$\n由于 $\\lambda_1, \\lambda_2, \\cdots, \\lambda_k$ 互不相同，故 $D_k \\neq 0$。\n因此矩阵 $\\boldsymbol{A}$ 的秩 $r(\\boldsymbol{A}) = k$，即这 $k$ 个向量线性无关。\n(2) 当 $k > n$ 时，这 $k$ 个向量是 $n$ 维向量空间 $\\mathbf{R}^n$ 中的向量。\n因为任何 $n$ 维向量组的秩至多为 $n$，而向量个数 $k > n$，\n由定理可知：$n$ 维空间中任意超过 $n$ 个向量组成的向量组必定线性相关。"
    }
  },
  {
    id: "LAG-TB-CH04-Q29",
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
      source_desc: "《线性代数与几何》第 4 章 · 习题四 第 29 题",
      page_start: 118,
      page_end: 118
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 29,
      paper_q_num: 29,
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
        knowledge_points: ["矩阵乘积与秩", "单位矩阵", "列向量线性无关"]
      }
    },
    content: {
      stem: "设 $\\boldsymbol{A}, \\boldsymbol{B}$ 分别为 $m \\times n, n \\times m$ 矩阵，$n > m$ 且 $\\boldsymbol{A}\\boldsymbol{B} = \\boldsymbol{E}_m$，证明 $\\boldsymbol{B}$ 的 $m$ 个列向量线性无关。"
    },
    solution: {
      answer: "证明略。",
      hints: "证明方程 $\\boldsymbol{B}\\boldsymbol{x} = \\mathbf{0}$ 只有零解，两边左乘 $\\boldsymbol{A}$ 即可。",
      steps: "设 $\\boldsymbol{x} = (x_1, x_2, \\cdots, x_m)^{\\mathrm{T}}$ 满足 $\\boldsymbol{B}\\boldsymbol{x} = \\mathbf{0}$。\n在等式两边左乘矩阵 $\\boldsymbol{A}$：\n$$\\boldsymbol{A}(\\boldsymbol{B}\\boldsymbol{x}) = \\boldsymbol{A}\\mathbf{0} = \\mathbf{0}$$\n由矩阵乘法结合律：\n$$(\\boldsymbol{A}\\boldsymbol{B})\\boldsymbol{x} = \\mathbf{0}$$\n因为已知 $\\boldsymbol{A}\\boldsymbol{B} = \\boldsymbol{E}_m$，所以\n$$\\boldsymbol{E}_m\\boldsymbol{x} = \\boldsymbol{x} = \\mathbf{0}$$\n这表明齐次线性方程组 $\\boldsymbol{B}\\boldsymbol{x} = \\mathbf{0}$ 只有零解。\n因此矩阵 $\\boldsymbol{B}$ 的 $m$ 个列向量线性无关（亦即 $r(\\boldsymbol{B}) = m$）。"
    }
  },
  {
    id: "LAG-TB-CH04-Q30",
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
      source_desc: "《线性代数与几何》第 4 章 · 习题四 第 30 题",
      page_start: 118,
      page_end: 118
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 30,
      paper_q_num: 30,
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
        knowledge_points: ["反证法", "线性相关性等价刻画", "前序向量线性表出"]
      }
    },
    content: {
      stem: "设在向量组 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_r$ 中，$\\boldsymbol{\\alpha}_1 \\neq \\mathbf{0}$，并且每一个向量 $\\boldsymbol{\\alpha}_i$ 都不能由它前面的向量 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_{i-1}$ 线性表出，证明 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_r$ 线性无关。"
    },
    solution: {
      answer: "证明略。",
      hints: "使用反证法，结合“向量组线性相关的充要条件是至少有一个向量可由它前面的向量线性表出”的重要定理。",
      steps: "采用反证法。假设向量组 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_r$ 线性相关。\n根据线性相关性判别定理：向量组 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_r$ 线性相关（且 $\\boldsymbol{\\alpha}_1 \\neq \\mathbf{0}$）的充分必要条件是：存在某一个向量 $\\boldsymbol{\\alpha}_k (2 \\leqslant k \\leqslant r)$，使得 $\\boldsymbol{\\alpha}_k$ 可以由它前面的向量 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_{k-1}$ 线性表出。\n但题设明确已知“每一个向量 $\\boldsymbol{\\alpha}_i$ 都不能由它前面的向量 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_{i-1}$ 线性表出”，\n两者直接矛盾！\n因此假设错误，向量组 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_r$ 线性无关。"
    }
  },
  {
    id: "LAG-TB-CH04-Q31",
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
      source_desc: "《线性代数与几何》第 4 章 · 习题四 第 31 题",
      page_start: 118,
      page_end: 118
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 31,
      paper_q_num: 31,
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
        knowledge_points: ["矩阵乘积与秩", "向量组线性无关充要条件", "列满秩"]
      }
    },
    content: {
      stem: "设向量组 $\\mathrm{I}: \\boldsymbol{\\beta}_1, \\boldsymbol{\\beta}_2, \\cdots, \\boldsymbol{\\beta}_r$ 能由向量组 $\\mathrm{II}: \\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_s$ 线性表示为\n$$(\\boldsymbol{\\beta}_1, \\boldsymbol{\\beta}_2, \\cdots, \\boldsymbol{\\beta}_r) = (\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_s)\\boldsymbol{K},$$\n其中 $\\boldsymbol{K}$ 为 $s \\times r$ 矩阵，且向量组 $\\mathrm{II}$ 线性无关。证明向量组 $\\mathrm{I}$ 线性无关的充分必要条件是矩阵 $\\boldsymbol{K}$ 的秩 $r(\\boldsymbol{K}) = r$。"
    },
    solution: {
      answer: "证明略。",
      hints: "记 $\\boldsymbol{B} = (\\boldsymbol{\\beta}_1, \\cdots, \\boldsymbol{\\beta}_r), \\boldsymbol{A} = (\\boldsymbol{\\alpha}_1, \\cdots, \\boldsymbol{\\alpha}_s)$，则 $\\boldsymbol{B} = \\boldsymbol{A}\\boldsymbol{K}$。利用齐次线性方程组 $\\boldsymbol{B}\\boldsymbol{x}=\\mathbf{0} \\iff \\boldsymbol{A}(\\boldsymbol{K}\\boldsymbol{x})=\\mathbf{0}$ 说明。",
      steps: "记 $\\boldsymbol{B} = (\\boldsymbol{\\beta}_1, \\boldsymbol{\\beta}_2, \\cdots, \\boldsymbol{\\beta}_r), \\boldsymbol{A} = (\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\cdots, \\boldsymbol{\\alpha}_s)$，题设即 $\\boldsymbol{B} = \\boldsymbol{A}\\boldsymbol{K}$。\n考虑方程 $\\boldsymbol{B}\\boldsymbol{x} = \\mathbf{0}$，其中 $\\boldsymbol{x} \\in \\mathbf{R}^r$。\n代入得 $\\boldsymbol{A}(\\boldsymbol{K}\\boldsymbol{x}) = \\mathbf{0}$。\n由于向量组 $\\mathrm{II}$ 线性无关，矩阵 $\\boldsymbol{A}$ 的列向量线性无关，因此 $\\boldsymbol{A}\\boldsymbol{y} = \\mathbf{0} \\iff \\boldsymbol{y} = \\mathbf{0}$。\n令 $\\boldsymbol{y} = \\boldsymbol{K}\\boldsymbol{x}$，立得：\n$$\\boldsymbol{B}\\boldsymbol{x} = \\mathbf{0} \\iff \\boldsymbol{K}\\boldsymbol{x} = \\mathbf{0}$$\n根据定义，向量组 $\\mathrm{I}$ 线性无关 $\\iff$ 方程 $\\boldsymbol{B}\\boldsymbol{x} = \\mathbf{0}$ 只有零解 $\\boldsymbol{x} = \\mathbf{0}$ $\\iff$ 方程 $\\boldsymbol{K}\\boldsymbol{x} = \\mathbf{0}$ 只有零解 $\\iff$ 矩阵 $\\boldsymbol{K}$ 的列向量线性无关 $\\iff r(\\boldsymbol{K}) = r$。\n充分必要条件得证。"
    }
  },
  {
    id: "LAG-TB-CH04-Q32",
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
      source_desc: "《线性代数与几何》第 4 章 · 习题四 第 32 题",
      page_start: 118,
      page_end: 118
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 32,
      paper_q_num: 32,
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
        knowledge_points: ["平面几何位置关系", "齐次线性方程组解的结构", "矩阵的秩的几何意义"]
      }
    },
    content: {
      stem: "用矩阵的秩讨论下面三个平面的位置关系：\n$$\\pi_1: a_1 x + b_1 y + c_1 z = 0,$$\n$$\\pi_2: a_2 x + b_2 y + c_2 z = 0,$$\n$$\\pi_3: a_3 x + b_3 y + c_3 z = 0.$$"
    },
    solution: {
      answer: "(1) $r(\\boldsymbol{A}) = 3$ 时，三个平面相交于原点 $O(0,0,0)$；\n(2) $r(\\boldsymbol{A}) = 2$ 时，三个平面相交于一条直线；\n(3) $r(\\boldsymbol{A}) = 1$ 时，三个平面重合。",
      hints: "考虑由三个平面方程构成的齐次线性方程组系数矩阵 $\\boldsymbol{A}$ 的秩与解空间维数 $\\dim = 3 - r(\\boldsymbol{A})$。",
      steps: "三个平面方程构成三元齐次线性方程组：\n$$\\boldsymbol{A}\\boldsymbol{x} = \\mathbf{0}, \\quad \\boldsymbol{A} = \\begin{pmatrix} a_1 & b_1 & c_1 \\\\ a_2 & b_2 & c_2 \\\\ a_3 & b_3 & c_3 \\end{pmatrix}$$\n方程组的解空间对应三个平面的公共交集：\n(1) 当 $r(\\boldsymbol{A}) = 3$ 时，解空间维数为 $3 - 3 = 0$，方程组只有唯一零解 $(0,0,0)$，故三个平面仅相交于唯一的原点 $O(0,0,0)$；\n(2) 当 $r(\\boldsymbol{A}) = 2$ 时，解空间维数为 $3 - 2 = 1$，基础解系含 1 个向量，解空间为一条过原点的直线，故三个平面相交于一条过原点的直线；\n(3) 当 $r(\\boldsymbol{A}) = 1$ 时，解空间维数为 $3 - 1 = 2$，方程组三个方程两两成比例表示同一个平面，故三个平面重合为同一个平面。"
    }
  }
];
