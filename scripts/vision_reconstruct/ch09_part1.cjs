// scripts/vision_reconstruct/ch09_part1.cjs
module.exports = [
  {
    id: "LAG-TB-CH09-Q01",
    source_type: "textbook",
    source: {
      paper_id: 2009,
      raw_title: "《线性代数与几何》第9章 线性空间与线性变换 课后习题",
      clean_title: "《线性代数与几何》第9章 线性空间与线性变换 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 9 章 · 习题九 第 1 题",
      page_start: 205,
      page_end: 205
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
        chapter: 9,
        chapter_title: "第9章 线性空间与线性变换",
        section: "9.1",
        section_title: "线性空间的概念与基本性质",
        section_slug: "9.1_线性空间的概念与基本性质",
        knowledge_points: ["实线性空间判定", "运算封闭性", "线性空间公理"]
      }
    },
    content: {
      stem: "说明下列集合 $V$ 关于所规定的加法与数乘运算是否构成实线性空间：\n\n(1) $V$ 为全体 $n$ 阶正交矩阵的集合，按矩阵的加法与数乘运算；\n\n(2) $V=\\mathbf{R}^2$ 为全体二维实向量的集合，按向量的数乘与如下规定的加法 $\\oplus$：\n$$(a_1, a_2) \\oplus (b_1, b_2) = (a_1+b_2, a_2+b_1), \\quad \\forall (a_1, a_2), (b_1, b_2) \\in \\mathbf{R}^2;$$\n\n(3) $V=\\{a_{11}x^2+a_{12}xy+a_{22}y^2 \\mid a_{11}, a_{12}, a_{22} \\in \\mathbf{R}\\}$，按多项式的加法与数乘运算；\n\n(4) 设 $\\mathbf{C}$ 为全体复数集，$V=\\left\\{ \\begin{pmatrix} a_{11} & a_{12} \\\\ a_{21} & a_{22} \\end{pmatrix} \\;\\middle|\\; a_{11}, a_{12}, a_{21}, a_{22} \\in \\mathbf{C}, a_{11}+a_{22}=0 \\right\\}$，按矩阵的加法与数乘运算。",
      sub_questions: [
        { sub_id: "(1)", stem: "$V$ 为全体 $n$ 阶正交矩阵的集合，按矩阵的加法与数乘运算", answer: "不是" },
        { sub_id: "(2)", stem: "$V=\\mathbf{R}^2$，按通常数乘与加法 $(a_1, a_2) \\oplus (b_1, b_2) = (a_1+b_2, a_2+b_1)$", answer: "不是" },
        { sub_id: "(3)", stem: "$V=\\{a_{11}x^2+a_{12}xy+a_{22}y^2 \\mid a_{11}, a_{12}, a_{22} \\in \\mathbf{R}\\}$，按多项式的加法与数乘运算", answer: "是" },
        { sub_id: "(4)", stem: "设 $\\mathbf{C}$ 为全体复数集，$V=\\left\\{ \\begin{pmatrix} a_{11} & a_{12} \\\\ a_{21} & a_{22} \\end{pmatrix} \\;\\middle|\\; a_{11}, a_{12}, a_{21}, a_{22} \\in \\mathbf{C}, a_{11}+a_{22}=0 \\right\\}$，按矩阵的加法与数乘运算", answer: "是" }
      ]
    },
    solution: {
      answer: "(1) 不是；(2) 不是；(3) 是；(4) 是。",
      hints: "依据实线性空间的定义，检验集合对所定义的加法和实数数乘运算是否封闭，以及是否满足 8 条运算公理（如结合律、交换律、零元素、分配律等）。",
      steps: "(1) 不是。正交矩阵关于加法不封闭。例如单位阵 $\\boldsymbol{I}\\in V$，但 $\\boldsymbol{I}+\\boldsymbol{I}=2\\boldsymbol{I}$，有 $(2\\boldsymbol{I})^{\\mathrm{T}}(2\\boldsymbol{I})=4\\boldsymbol{I}\\ne \\boldsymbol{I}$，故 $2\\boldsymbol{I}\\notin V$；且零矩阵 $\\boldsymbol{O}\\notin V$。\n(2) 不是。检验加法结合律：取 $\\boldsymbol{\\alpha}=(a_1, a_2), \\boldsymbol{\\beta}=(b_1, b_2), \\boldsymbol{\\gamma}=(c_1, c_2)$，则\n$$(\\boldsymbol{\\alpha}\\oplus\\boldsymbol{\\beta})\\oplus\\boldsymbol{\\gamma} = (a_1+b_2, a_2+b_1)\\oplus(c_1, c_2) = (a_1+b_2+c_2, a_2+b_1+c_1),$$\n$$\\boldsymbol{\\alpha}\\oplus(\\boldsymbol{\\beta}\\oplus\\boldsymbol{\\gamma}) = (a_1, a_2)\\oplus(b_1+c_2, b_2+c_1) = (a_1+b_2+c_1, a_2+b_1+c_2).$$\n两者一般不相等，不满足加法结合律；同理也不满足交换律（例如 $(1,0)\\oplus(0,2)=(3,0)$ 而 $(0,2)\\oplus(1,0)=(0,3)$），故不构成线性空间。\n(3) 是。$V$ 为所有二元齐次二次多项式构成的集合，对普通加法和数乘显然封闭，且满足线性空间的 8 条运算公理。\n(4) 是。矩阵加法与实数数乘满足线性运算规律，且对于任意 $\\boldsymbol{A}, \\boldsymbol{B}\\in V$ 及 $k, l\\in\\mathbf{R}$，有 $\\mathrm{tr}(k\\boldsymbol{A}+l\\boldsymbol{B})=k\\,\\mathrm{tr}(\\boldsymbol{A})+l\\,\\mathrm{tr}(\\boldsymbol{B})=0$，对实数数乘与矩阵加法封闭，故 $V$ 构成实线性空间。"
    }
  },
  {
    id: "LAG-TB-CH09-Q02",
    source_type: "textbook",
    source: {
      paper_id: 2009,
      raw_title: "《线性代数与几何》第9章 线性空间与线性变换 课后习题",
      clean_title: "《线性代数与几何》第9章 线性空间与线性变换 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 9 章 · 习题九 第 2 题",
      page_start: 205,
      page_end: 206
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
        chapter: 9,
        chapter_title: "第9章 线性空间与线性变换",
        section: "9.1",
        section_title: "线性空间的概念与基本性质",
        section_slug: "9.1_线性空间的概念与基本性质",
        knowledge_points: ["子空间判定定理", "加法封闭性", "数乘封闭性"]
      }
    },
    content: {
      stem: "说明下列集合 $W$ 是否构成实线性空间 $V$ 的子空间：\n\n(1) 设 $V$ 为全体二阶实矩阵的集合，按矩阵的加法与数乘运算，$V$ 构成一个实线性空间。\n$$W=\\{\\boldsymbol{B}\\mid \\boldsymbol{B}\\in V, \\boldsymbol{AB}=\\boldsymbol{BA}\\}, \\quad \\text{其中 } \\boldsymbol{A}=\\begin{pmatrix} 1 & 2 \\\\ 0 & 1 \\end{pmatrix};$$\n\n(2) 设 $V=\\mathbf{R}^3$ 为全体三维实向量的集合，按向量的加法与数乘运算，$V$ 构成一个实线性空间。\n$$W=\\{(x_1, x_2, x_3)\\mid x_1, x_2, x_3 \\in \\mathbf{R}, x_1+x_2+x_3=1\\};$$\n\n(3) 设 $V$ 为全体 $n$ 阶实矩阵的集合，按矩阵的加法与数乘运算，$V$ 构成一个实线性空间。\n$$W=\\{\\boldsymbol{B}\\mid \\boldsymbol{B}\\in V, \\mathrm{tr}(\\boldsymbol{B})=0\\};$$\n\n(4) 设 $V=\\mathbf{R}[x]_3$ 为全体次数小于 3 的实系数多项式的集合，按多项式的加法与数乘运算，$V$ 构成一个实线性空间。\n$$W=\\left\\{ f(x) \\;\\middle|\\; f(x) \\in V, \\int_0^1 f(x)\\,\\mathrm{d}x = 1 \\right\\}。$$",
      sub_questions: [
        { sub_id: "(1)", stem: "$W=\\{\\boldsymbol{B}\\mid \\boldsymbol{B}\\in V, \\boldsymbol{AB}=\\boldsymbol{BA}\\}$, 其中 $\\boldsymbol{A}=\\begin{pmatrix} 1 & 2 \\\\ 0 & 1 \\end{pmatrix}$", answer: "是" },
        { sub_id: "(2)", stem: "$W=\\{(x_1, x_2, x_3)\\mid x_1, x_2, x_3 \\in \\mathbf{R}, x_1+x_2+x_3=1\\}$", answer: "不是" },
        { sub_id: "(3)", stem: "$W=\\{\\boldsymbol{B}\\mid \\boldsymbol{B}\\in V, \\mathrm{tr}(\\boldsymbol{B})=0\\}$", answer: "是" },
        { sub_id: "(4)", stem: "$W=\\left\\{ f(x) \\;\\middle|\\; f(x) \\in V, \\int_0^1 f(x)\\,\\mathrm{d}x = 1 \\right\\}$", answer: "不是" }
      ]
    },
    solution: {
      answer: "(1) 是；(2) 不是；(3) 是；(4) 不是。",
      hints: "利用子空间判定定理：非空子集 $W$ 是 $V$ 的子空间当且仅当 $W$ 对加法与数乘运算封闭（特别地，必须包含零元素 $\\boldsymbol{0}$）。",
      steps: "(1) 是。首先零矩阵 $\\boldsymbol{O}\\in W$（非空）。若 $\\boldsymbol{B}_1, \\boldsymbol{B}_2\\in W, k\\in\\mathbf{R}$，则 $\\boldsymbol{A}(\\boldsymbol{B}_1+\\boldsymbol{B}_2)=\\boldsymbol{AB}_1+\\boldsymbol{AB}_2=\\boldsymbol{B}_1\\boldsymbol{A}+\\boldsymbol{B}_2\\boldsymbol{A}=(\\boldsymbol{B}_1+\\boldsymbol{B}_2)\\boldsymbol{A}$，且 $\\boldsymbol{A}(k\\boldsymbol{B}_1)=k(\\boldsymbol{AB}_1)=k(\\boldsymbol{B}_1\\boldsymbol{A})=(k\\boldsymbol{B}_1)\\boldsymbol{A}$，对加法和数乘封闭，故是子空间。\n(2) 不是。零向量 $(0,0,0)$ 满足 $0+0+0=0\\ne 1$，故 $\\boldsymbol{0}\\notin W$，不构成子空间。\n(3) 是。$\\mathrm{tr}(\\boldsymbol{O})=0$；且迹函数具有线性性：$\\mathrm{tr}(\\boldsymbol{B}_1+\\boldsymbol{B}_2)=\\mathrm{tr}(\\boldsymbol{B}_1)+\\mathrm{tr}(\\boldsymbol{B}_2)=0$，$ \\mathrm{tr}(k\\boldsymbol{B})=k\\,\\mathrm{tr}(\\boldsymbol{B})=0$，封闭，故是子空间。\n(4) 不是。零多项式 $f(x)=0$ 的积分为 $0\\ne 1$，故 $\\boldsymbol{0}\\notin W$，不构成子空间。"
    }
  },
  {
    id: "LAG-TB-CH09-Q03",
    source_type: "textbook",
    source: {
      paper_id: 2009,
      raw_title: "《线性代数与几何》第9章 线性空间与线性变换 课后习题",
      clean_title: "《线性代数与几何》第9章 线性空间与线性变换 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 9 章 · 习题九 第 3 题",
      page_start: 206,
      page_end: 206
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 3,
      paper_q_num: 3,
      type: "proof",
      difficulty: 1,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 9,
        chapter_title: "第9章 线性空间与线性变换",
        section: "9.1",
        section_title: "线性空间的概念与基本性质",
        section_slug: "9.1_线性空间的概念与基本性质",
        knowledge_points: ["和子空间", "子空间证明"]
      }
    },
    content: {
      stem: "设 $V$ 为实线性空间，$V_1, V_2$ 为 $V$ 的子空间。$W=\\{\\boldsymbol{\\alpha}_1+\\boldsymbol{\\alpha}_2 \\mid \\boldsymbol{\\alpha}_1\\in V_1, \\boldsymbol{\\alpha}_2\\in V_2\\}$（记为 $W=V_1+V_2$），证明 $W$ 是 $V$ 的子空间。"
    },
    solution: {
      answer: "证明略。",
      hints: "检验非空性及对加法与数乘的封闭性。",
      steps: "因为 $V_1, V_2$ 是 $V$ 的子空间，所以 $\\boldsymbol{0}\\in V_1, \\boldsymbol{0}\\in V_2$，从而 $\\boldsymbol{0}=\\boldsymbol{0}+\\boldsymbol{0}\\in W$，$W$ 非空。\n任取 $\\boldsymbol{\\alpha}, \\boldsymbol{\\beta}\\in W$，设 $\\boldsymbol{\\alpha}=\\boldsymbol{\\alpha}_1+\\boldsymbol{\\alpha}_2, \\boldsymbol{\\beta}=\\boldsymbol{\\beta}_1+\\boldsymbol{\\beta}_2$，其中 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\beta}_1\\in V_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\beta}_2\\in V_2$。\n(1) 对加法：\n$$\\boldsymbol{\\alpha}+\\boldsymbol{\\beta} = (\\boldsymbol{\\alpha}_1+\\boldsymbol{\\beta}_1)+(\\boldsymbol{\\alpha}_2+\\boldsymbol{\\beta}_2),$$\n因为 $V_1, V_2$ 对加法封闭，所以 $\\boldsymbol{\\alpha}_1+\\boldsymbol{\\beta}_1\\in V_1, \\boldsymbol{\\alpha}_2+\\boldsymbol{\\beta}_2\\in V_2$，故 $\\boldsymbol{\\alpha}+\\boldsymbol{\\beta}\\in W$。\n(2) 对数乘：任取 $k\\in\\mathbf{R}$，\n$$k\\boldsymbol{\\alpha} = k(\\boldsymbol{\\alpha}_1+\\boldsymbol{\\alpha}_2) = k\\boldsymbol{\\alpha}_1+k\\boldsymbol{\\alpha}_2,$$\n因为 $V_1, V_2$ 对数乘封闭，所以 $k\\boldsymbol{\\alpha}_1\\in V_1, k\\boldsymbol{\\alpha}_2\\in V_2$，故 $k\\boldsymbol{\\alpha}\\in W$。\n综上可知，$W=V_1+V_2$ 是 $V$ 的子空间。"
    }
  },
  {
    id: "LAG-TB-CH09-Q04",
    source_type: "textbook",
    source: {
      paper_id: 2009,
      raw_title: "《线性代数与几何》第9章 线性空间与线性变换 课后习题",
      clean_title: "《线性代数与几何》第9章 线性空间与线性变换 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 9 章 · 习题九 第 4 题",
      page_start: 206,
      page_end: 206
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
        chapter: 9,
        chapter_title: "第9章 线性空间与线性变换",
        section: "9.1",
        section_title: "线性空间的概念与基本性质",
        section_slug: "9.1_线性空间的概念与基本性质",
        knowledge_points: ["交子空间", "子空间证明"]
      }
    },
    content: {
      stem: "设 $V$ 为实线性空间，$V_1, V_2$ 为 $V$ 的子空间。$W=V_1\\cap V_2$，证明 $W$ 是 $V$ 的子空间。"
    },
    solution: {
      answer: "证明略。",
      hints: "利用子空间的定义及交集的性质，证明非空且对线性运算封闭。",
      steps: "因为 $V_1, V_2$ 为 $V$ 的子空间，所以 $\\boldsymbol{0}\\in V_1$ 且 $\\boldsymbol{0}\\in V_2$，故 $\\boldsymbol{0}\\in W=V_1\\cap V_2$，$W$ 非空。\n任取 $\\boldsymbol{\\alpha}, \\boldsymbol{\\beta}\\in W, k\\in\\mathbf{R}$：\n由 $\\boldsymbol{\\alpha}, \\boldsymbol{\\beta}\\in W$ 知 $\\boldsymbol{\\alpha}, \\boldsymbol{\\beta}\\in V_1$ 且 $\\boldsymbol{\\alpha}, \\boldsymbol{\\beta}\\in V_2$。\n因为 $V_1, V_2$ 是子空间，所以 $\\boldsymbol{\\alpha}+\\boldsymbol{\\beta}\\in V_1$ 且 $\\boldsymbol{\\alpha}+\\boldsymbol{\\beta}\\in V_2$，从而 $\\boldsymbol{\\alpha}+\\boldsymbol{\\beta}\\in V_1\\cap V_2=W$；\n同理 $k\\boldsymbol{\\alpha}\\in V_1$ 且 $k\\boldsymbol{\\alpha}\\in V_2$，从而 $k\\boldsymbol{\\alpha}\\in V_1\\cap V_2=W$。\n因此 $W=V_1\\cap V_2$ 是 $V$ 的子空间。"
    }
  },
  {
    id: "LAG-TB-CH09-Q05",
    source_type: "textbook",
    source: {
      paper_id: 2009,
      raw_title: "《线性代数与几何》第9章 线性空间与线性变换 课后习题",
      clean_title: "《线性代数与几何》第9章 线性空间与线性变换 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 9 章 · 习题九 第 5 题",
      page_start: 206,
      page_end: 206
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 5,
      paper_q_num: 5,
      type: "proof",
      difficulty: 1,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 9,
        chapter_title: "第9章 线性空间与线性变换",
        section: "9.2",
        section_title: "线性空间的基与坐标",
        section_slug: "9.2_线性空间的基与坐标",
        knowledge_points: ["向量组等价", "线性表出", "矩阵基"]
      }
    },
    content: {
      stem: "设 $V$ 为全体二阶实矩阵的集合，按矩阵的加法与数乘运算，$V$ 构成一个实线性空间。记 $\\boldsymbol{E}_{ij}$ 为第 $i$ 行第 $j$ 列元素为 1，其余元素为零的二阶矩阵，求证：$\\boldsymbol{E}_{11}, \\boldsymbol{E}_{12}, \\boldsymbol{E}_{21}, \\boldsymbol{E}_{22}$ 与 $\\boldsymbol{E}_{11}, \\boldsymbol{E}_{22}, \\boldsymbol{E}_{12}+\\boldsymbol{E}_{21}, \\boldsymbol{E}_{12}-\\boldsymbol{E}_{21}$ 等价。"
    },
    solution: {
      answer: "证明略。",
      hints: "证明两个向量（矩阵）组可以相互线性表出即可。",
      steps: "记第一组为 (I)：$\\boldsymbol{E}_{11}, \\boldsymbol{E}_{12}, \\boldsymbol{E}_{21}, \\boldsymbol{E}_{22}$；第二组为 (II)：$\\boldsymbol{E}_{11}, \\boldsymbol{E}_{22}, \\boldsymbol{E}_{12}+\\boldsymbol{E}_{21}, \\boldsymbol{E}_{12}-\\boldsymbol{E}_{21}$。\n一方面，组 (II) 中每一个矩阵显然是组 (I) 中矩阵的线性组合：\n$$\\boldsymbol{E}_{11}=\\boldsymbol{E}_{11}, \\quad \\boldsymbol{E}_{22}=\\boldsymbol{E}_{22}, \\quad \\boldsymbol{E}_{12}+\\boldsymbol{E}_{21}=1\\cdot\\boldsymbol{E}_{12}+1\\cdot\\boldsymbol{E}_{21}, \\quad \\boldsymbol{E}_{12}-\\boldsymbol{E}_{21}=1\\cdot\\boldsymbol{E}_{12}-1\\cdot\\boldsymbol{E}_{21},$$\n故组 (II) 可由组 (I) 线性表出。\n另一方面，由组 (II) 可以表示组 (I)：\n$$\\boldsymbol{E}_{11}=\\boldsymbol{E}_{11}, \\quad \\boldsymbol{E}_{22}=\\boldsymbol{E}_{22},$$\n$$\\boldsymbol{E}_{12} = \\frac{1}{2}\\big[(\\boldsymbol{E}_{12}+\\boldsymbol{E}_{21})+(\\boldsymbol{E}_{12}-\\boldsymbol{E}_{21})\\big],$$\n$$\\boldsymbol{E}_{21} = \\frac{1}{2}\\big[(\\boldsymbol{E}_{12}+\\boldsymbol{E}_{21})-(\\boldsymbol{E}_{12}-\\boldsymbol{E}_{21})\\big],$$\n故组 (I) 也可由组 (II) 线性表出。\n因此两向量（矩阵）组等价。"
    }
  },
  {
    id: "LAG-TB-CH09-Q06",
    source_type: "textbook",
    source: {
      paper_id: 2009,
      raw_title: "《线性代数与几何》第9章 线性空间与线性变换 课后习题",
      clean_title: "《线性代数与几何》第9章 线性空间与线性变换 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 9 章 · 习题九 第 6 题",
      page_start: 206,
      page_end: 206
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 6,
      paper_q_num: 6,
      type: "calc",
      difficulty: 1,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 9,
        chapter_title: "第9章 线性空间与线性变换",
        section: "9.2",
        section_title: "线性空间的基与坐标",
        section_slug: "9.2_线性空间的基与坐标",
        knowledge_points: ["矩阵子空间的基", "维数", "向量的坐标"]
      }
    },
    content: {
      stem: "设 $\\mathbf{R}^{2\\times 2}$ 为全体二阶实矩阵的集合，$V=\\{\\boldsymbol{B}\\mid \\boldsymbol{B}\\in \\mathbf{R}^{2\\times 2}, \\boldsymbol{AB}=\\boldsymbol{BA}\\}$, 其中 $\\boldsymbol{A}=\\begin{pmatrix} 1 & 1 \\\\ 0 & 1 \\end{pmatrix}$。按矩阵的加法与数乘运算，$V$ 构成一个实线性空间。\n\n(1) 验证 $\\boldsymbol{B}_1=\\begin{pmatrix} 1 & 1 \\\\ 0 & 1 \\end{pmatrix}, \\boldsymbol{B}_2=\\begin{pmatrix} 0 & 1 \\\\ 0 & 0 \\end{pmatrix}$ 为 $V$ 的一组基；\n\n(2) 求 $\\dim V$ 及 $\\boldsymbol{B}=\\begin{pmatrix} 2 & 1 \\\\ 0 & 2 \\end{pmatrix}$ 在基 $\\boldsymbol{B}_1, \\boldsymbol{B}_2$ 下的坐标。",
      sub_questions: [
        { sub_id: "(1)", stem: "验证 $\\boldsymbol{B}_1, \\boldsymbol{B}_2$ 为 $V$ 的一组基", answer: "验证略" },
        { sub_id: "(2)", stem: "求 $\\dim V$ 及 $\\boldsymbol{B}=\\begin{pmatrix} 2 & 1 \\\\ 0 & 2 \\end{pmatrix}$ 在基 $\\boldsymbol{B}_1, \\boldsymbol{B}_2$ 下的坐标", answer: "$\\dim V=2$，坐标为 $\\boldsymbol{x}=(2,-1)^{\\mathrm{T}}$" }
      ]
    },
    solution: {
      answer: "(1) 验证略；\n(2) $\\dim V=2$，$\\boldsymbol{B}=\\begin{pmatrix} 2 & 1 \\\\ 0 & 2 \\end{pmatrix}$ 在基 $\\boldsymbol{B}_1, \\boldsymbol{B}_2$ 下的坐标为 $\\boldsymbol{x}=(2,-1)^{\\mathrm{T}}$。",
      hints: "设 $\\boldsymbol{B}=\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$，代入 $\\boldsymbol{AB}=\\boldsymbol{BA}$ 求解矩阵元素满足的齐次方程，确定 $V$ 的一般形式，再验证线性无关与坐标表示。",
      steps: "设 $\\boldsymbol{B}=\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$，则\n$$\\boldsymbol{AB}=\\begin{pmatrix} 1 & 1 \\\\ 0 & 1 \\end{pmatrix}\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}=\\begin{pmatrix} a+c & b+d \\\\ c & d \\end{pmatrix},$$\n$$\\boldsymbol{BA}=\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}\\begin{pmatrix} 1 & 1 \\\\ 0 & 1 \\end{pmatrix}=\\begin{pmatrix} a & a+b \\\\ c & c+d \\end{pmatrix}.$$\n由 $\\boldsymbol{AB}=\\boldsymbol{BA}$ 对应元素相等得 $c=0, a=d$。因此 $V$ 中元素形如 $\\boldsymbol{B}=\\begin{pmatrix} a & b \\\\ 0 & a \\end{pmatrix}$。\n(1) 易见 $\\boldsymbol{B}_1, \\boldsymbol{B}_2\\in V$。若 $k_1\\boldsymbol{B}_1+k_2\\boldsymbol{B}_2=\\begin{pmatrix} k_1 & k_1+k_2 \\\\ 0 & k_1 \\end{pmatrix}=\\boldsymbol{O}$，则 $k_1=0, k_2=0$，故线性无关；\n对任一 $\\boldsymbol{B}=\\begin{pmatrix} a & b \\\\ 0 & a \\end{pmatrix}\\in V$，有 $\\boldsymbol{B}=a\\boldsymbol{B}_1+(b-a)\\boldsymbol{B}_2$，故可生成 $V$。因此 $\\boldsymbol{B}_1, \\boldsymbol{B}_2$ 为 $V$ 的一组基。\n(2) 由基含 2 个元素可知 $\\dim V=2$。\n对于 $\\boldsymbol{B}=\\begin{pmatrix} 2 & 1 \\\\ 0 & 2 \\end{pmatrix}$，有 $a=2, b=1$。设 $\\boldsymbol{B}=x_1\\boldsymbol{B}_1+x_2\\boldsymbol{B}_2$，则 $x_1=2, x_1+x_2=1 \\implies x_2=-1$。\n故 $\\boldsymbol{B}$ 在基 $\\boldsymbol{B}_1, \\boldsymbol{B}_2$ 下的坐标为 $\\boldsymbol{x}=(2,-1)^{\\mathrm{T}}$。"
    }
  },
  {
    id: "LAG-TB-CH09-Q07",
    source_type: "textbook",
    source: {
      paper_id: 2009,
      raw_title: "《线性代数与几何》第9章 线性空间与线性变换 课后习题",
      clean_title: "《线性代数与几何》第9章 线性空间与线性变换 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 9 章 · 习题九 第 7 题",
      page_start: 206,
      page_end: 206
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 7,
      paper_q_num: 7,
      type: "calc",
      difficulty: 1,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 9,
        chapter_title: "第9章 线性空间与线性变换",
        section: "9.2",
        section_title: "线性空间的基与坐标",
        section_slug: "9.2_线性空间的基与坐标",
        knowledge_points: ["复对角矩阵空间", "实线性空间的基", "坐标计算"]
      }
    },
    content: {
      stem: "设 $\\mathbf{C}$ 为全体复数集，$V=\\left\\{ \\begin{pmatrix} a_1 & 0 \\\\ 0 & a_2 \\end{pmatrix} \\;\\middle|\\; a_1, a_2 \\in \\mathbf{C}, a_1+a_2=0 \\right\\}$，按矩阵的加法与数乘运算，$V$ 构成一个实线性空间。\n\n(1) 验证 $\\boldsymbol{A}_1=\\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix}, \\boldsymbol{A}_2=\\begin{pmatrix} \\mathrm{i} & 0 \\\\ 0 & -\\mathrm{i} \\end{pmatrix}$ 为 $V$ 的一组基；\n\n(2) 求 $\\dim V$ 及 $\\boldsymbol{A}=\\begin{pmatrix} -1+3\\mathrm{i} & 0 \\\\ 0 & 1-3\\mathrm{i} \\end{pmatrix}$ 在基 $\\boldsymbol{A}_1, \\boldsymbol{A}_2$ 下的坐标。",
      sub_questions: [
        { sub_id: "(1)", stem: "验证 $\\boldsymbol{A}_1, \\boldsymbol{A}_2$ 为 $V$ 的一组基", answer: "验证略" },
        { sub_id: "(2)", stem: "求 $\\dim V$ 及 $\\boldsymbol{A}$ 在基 $\\boldsymbol{A}_1, \\boldsymbol{A}_2$ 下的坐标", answer: "$\\dim V=2$，坐标为 $\\boldsymbol{x}=(-1, 3)^{\\mathrm{T}}$" }
      ]
    },
    solution: {
      answer: "(1) 验证略；\n(2) $\\dim V=2$，$\\boldsymbol{A}=\\begin{pmatrix} -1+3\\mathrm{i} & 0 \\\\ 0 & 1-3\\mathrm{i} \\end{pmatrix}$ 在基 $\\boldsymbol{A}_1, \\boldsymbol{A}_2$ 下的坐标为 $\\boldsymbol{x}=(-1,3)^{\\mathrm{T}}$。",
      hints: "注意 $V$ 是实线性空间，数乘标量只能取实数。复数 $a_1=u+v\\mathrm{i}$（$u, v\\in\\mathbf{R}$），对应的矩阵由实数 $u, v$ 线性表出。",
      steps: "由 $a_1+a_2=0$ 得 $a_2=-a_1$。设 $a_1=u+v\\mathrm{i}$（$u, v\\in\\mathbf{R}$），则 $a_2=-(u+v\\mathrm{i})=-u-v\\mathrm{i}$。\n因此 $V$ 中任意矩阵为\n$$\\begin{pmatrix} u+v\\mathrm{i} & 0 \\\\ 0 & -u-v\\mathrm{i} \\end{pmatrix} = u\\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix} + v\\begin{pmatrix} \\mathrm{i} & 0 \\\\ 0 & -\\mathrm{i} \\end{pmatrix} = u\\boldsymbol{A}_1 + v\\boldsymbol{A}_2.$$\n(1) 若存在实数 $k_1, k_2$ 使得 $k_1\\boldsymbol{A}_1+k_2\\boldsymbol{A}_2=\\boldsymbol{O}$，则 $k_1+k_2\\mathrm{i}=0$，因 $k_1, k_2\\in\\mathbf{R}$，必有 $k_1=k_2=0$，故 $\\boldsymbol{A}_1, \\boldsymbol{A}_2$ 线性无关；又可生成 $V$，故为 $V$ 的一组基。\n(2) 因为基中含有 2 个元素，所以 $\\dim V=2$。\n对于矩阵 $\\boldsymbol{A}=\\begin{pmatrix} -1+3\\mathrm{i} & 0 \\\\ 0 & 1-3\\mathrm{i} \\end{pmatrix}$，有 $u=-1, v=3$，即 $\\boldsymbol{A}=-1\\boldsymbol{A}_1+3\\boldsymbol{A}_2$。\n故其在基 $\\boldsymbol{A}_1, \\boldsymbol{A}_2$ 下的坐标为 $\\boldsymbol{x}=(-1,3)^{\\mathrm{T}}$。"
    }
  },
  {
    id: "LAG-TB-CH09-Q08",
    source_type: "textbook",
    source: {
      paper_id: 2009,
      raw_title: "《线性代数与几何》第9章 线性空间与线性变换 课后习题",
      clean_title: "《线性代数与几何》第9章 线性空间与线性变换 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 9 章 · 习题九 第 8 题",
      page_start: 206,
      page_end: 206
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 8,
      paper_q_num: 8,
      type: "calc",
      difficulty: 1,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 9,
        chapter_title: "第9章 线性空间与线性变换",
        section: "9.2",
        section_title: "线性空间的基与坐标",
        section_slug: "9.2_线性空间的基与坐标",
        knowledge_points: ["无迹矩阵空间", "基与维数", "矩阵的坐标"]
      }
    },
    content: {
      stem: "设 $\\mathbf{R}^{2\\times 2}$ 为全体二阶实矩阵的集合，$V=\\{\\boldsymbol{A}\\mid \\boldsymbol{A}\\in \\mathbf{R}^{2\\times 2}, \\mathrm{tr}(\\boldsymbol{A})=0\\}$，按矩阵的加法与数乘运算，$V$ 构成一个实线性空间。\n\n(1) 验证 $\\boldsymbol{A}_1=\\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix}, \\boldsymbol{A}_2=\\begin{pmatrix} 0 & 1 \\\\ 0 & 0 \\end{pmatrix}, \\boldsymbol{A}_3=\\begin{pmatrix} 0 & 0 \\\\ 1 & 0 \\end{pmatrix}$ 为 $V$ 的一组基；\n\n(2) 求 $\\dim V$ 及 $\\boldsymbol{A}=\\begin{pmatrix} -2 & 1 \\\\ -3 & 2 \\end{pmatrix}$ 在基 $\\boldsymbol{A}_1, \\boldsymbol{A}_2, \\boldsymbol{A}_3$ 下的坐标。",
      sub_questions: [
        { sub_id: "(1)", stem: "验证 $\\boldsymbol{A}_1, \\boldsymbol{A}_2, \\boldsymbol{A}_3$ 为 $V$ 的一组基", answer: "验证略" },
        { sub_id: "(2)", stem: "求 $\\dim V$ 及 $\\boldsymbol{A}$ 在基 $\\boldsymbol{A}_1, \\boldsymbol{A}_2, \\boldsymbol{A}_3$ 下的坐标", answer: "$\\dim V=3$，坐标为 $\\boldsymbol{x}=(-2, 1, -3)^{\\mathrm{T}}$" }
      ]
    },
    solution: {
      answer: "(1) 验证略；\n(2) $\\dim V=3$，$\\boldsymbol{A}=\\begin{pmatrix} -2 & 1 \\\\ -3 & 2 \\end{pmatrix}$ 在基 $\\boldsymbol{A}_1, \\boldsymbol{A}_2, \\boldsymbol{A}_3$ 下的坐标为 $\\boldsymbol{x}=(-2,1,-3)^{\\mathrm{T}}$。",
      hints: "由 $\\mathrm{tr}(\\boldsymbol{A})=a_{11}+a_{22}=0$ 得 $a_{22}=-a_{11}$，从而矩阵由三个自由实参数唯一确定。",
      steps: "设 $\\boldsymbol{A}=\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$，由 $\\mathrm{tr}(\\boldsymbol{A})=a+d=0$ 知 $d=-a$。\n故 $V$ 中元素可表示为 $\\boldsymbol{A}=\\begin{pmatrix} a & b \\\\ c & -a \\end{pmatrix}=a\\boldsymbol{A}_1+b\\boldsymbol{A}_2+c\\boldsymbol{A}_3$。\n(1) 若 $k_1\\boldsymbol{A}_1+k_2\\boldsymbol{A}_2+k_3\\boldsymbol{A}_3=\\begin{pmatrix} k_1 & k_2 \\\\ k_3 & -k_1 \\end{pmatrix}=\\boldsymbol{O}$，则 $k_1=k_2=k_3=0$，故 $\\boldsymbol{A}_1, \\boldsymbol{A}_2, \\boldsymbol{A}_3$ 线性无关；且能线性表出 $V$ 中任意矩阵，故为 $V$ 的一组基。\n(2) 基中含有 3 个元素，故 $\\dim V=3$。\n对于 $\\boldsymbol{A}=\\begin{pmatrix} -2 & 1 \\\\ -3 & 2 \\end{pmatrix}$，对应 $a=-2, b=1, c=-3$。\n即 $\\boldsymbol{A}=-2\\boldsymbol{A}_1+1\\boldsymbol{A}_2+(-3)\\boldsymbol{A}_3$。\n故 $\\boldsymbol{A}$ 在基 $\\boldsymbol{A}_1, \\boldsymbol{A}_2, \\boldsymbol{A}_3$ 下的坐标为 $\\boldsymbol{x}=(-2,1,-3)^{\\mathrm{T}}$。"
    }
  },
  {
    id: "LAG-TB-CH09-Q09",
    source_type: "textbook",
    source: {
      paper_id: 2009,
      raw_title: "《线性代数与几何》第9章 线性空间与线性变换 课后习题",
      clean_title: "《线性代数与几何》第9章 线性空间与线性变换 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 9 章 · 习题九 第 9 题",
      page_start: 206,
      page_end: 207
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 9,
      paper_q_num: 9,
      type: "calc",
      difficulty: 1,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 9,
        chapter_title: "第9章 线性空间与线性变换",
        section: "9.3",
        section_title: "基变换与坐标变换",
        section_slug: "9.3_基变换与坐标变换",
        knowledge_points: ["多项式空间的基", "过渡矩阵", "坐标变换公式"]
      }
    },
    content: {
      stem: "设 $V=\\mathbf{R}[x]_3$ 为全体次数小于 3 的实系数多项式的集合，按多项式的加法与数乘运算，$V$ 构成一个实线性空间。\n\n(1) 验证 $1, x, x^2$ 与 $1, x-1, (x-1)(x-2)$ 分别为 $V$ 的一组基；\n\n(2) 求从基 $1, x, x^2$ 到基 $1, x-1, (x-1)(x-2)$ 的过渡矩阵 $\\boldsymbol{P}$；\n\n(3) 求 $f(x)=2x^2-x+9$ 在基 $1, x-1, (x-1)(x-2)$ 下的坐标 $\\boldsymbol{y}$。",
      sub_questions: [
        { sub_id: "(1)", stem: "验证 $1, x, x^2$ 与 $1, x-1, (x-1)(x-2)$ 分别为 $V$ 的一组基", answer: "验证略" },
        { sub_id: "(2)", stem: "求从基 $1, x, x^2$ 到基 $1, x-1, (x-1)(x-2)$ 的过渡矩阵 $\\boldsymbol{P}$", answer: "$\\boldsymbol{P}=\\begin{pmatrix} 1 & -1 & 2 \\\\ 0 & 1 & -3 \\\\ 0 & 0 & 1 \\end{pmatrix}$" },
        { sub_id: "(3)", stem: "求 $f(x)=2x^2-x+9$ 在基 $1, x-1, (x-1)(x-2)$ 下的坐标 $\\boldsymbol{y}$", answer: "$\\boldsymbol{y}=(10, 5, 2)^{\\mathrm{T}}$" }
      ]
    },
    solution: {
      answer: "(1) 验证略；\n(2) $\\boldsymbol{P}=\\begin{pmatrix} 1 & -1 & 2 \\\\ 0 & 1 & -3 \\\\ 0 & 0 & 1 \\end{pmatrix}$；\n(3) $\\boldsymbol{y}=(10, 5, 2)^{\\mathrm{T}}$。",
      hints: "将新基的多项式用旧基 $1, x, x^2$ 线性表出，各列系数构成过渡矩阵 $\\boldsymbol{P}$；再利用坐标变换公式 $\\boldsymbol{x}=\\boldsymbol{P}\\boldsymbol{y}$ 或待定系数法求坐标 $\\boldsymbol{y}$。",
      steps: "(1) $1, x, x^2$ 是次数小于 3 的多项式空间的自然基，线性无关且维数为 3；后一组中三个多项式次数分别为 0, 1, 2，次数互不相同，由阶梯形性质知必线性无关，故分别构成 $V$ 的基。\n(2) 将新基向量用旧基 $1, x, x^2$ 展开：\n$$\\begin{cases} 1 = 1\\cdot 1 + 0\\cdot x + 0\\cdot x^2 \\\\ x-1 = -1\\cdot 1 + 1\\cdot x + 0\\cdot x^2 \\\\ (x-1)(x-2) = 2\\cdot 1 - 3\\cdot x + 1\\cdot x^2 \\end{cases}$$\n按列排成矩阵，得从基 $1, x, x^2$ 到基 $1, x-1, (x-1)(x-2)$ 的过渡矩阵为\n$$\\boldsymbol{P}=\\begin{pmatrix} 1 & -1 & 2 \\\\ 0 & 1 & -3 \\\\ 0 & 0 & 1 \\end{pmatrix}.$$\n(3) $f(x)=2x^2-x+9$ 在基 $1, x, x^2$ 下的坐标为 $\\boldsymbol{x}=(9, -1, 2)^{\\mathrm{T}}$。\n由坐标变换公式 $\\boldsymbol{x}=\\boldsymbol{P}\\boldsymbol{y}$，有 $\\boldsymbol{y}=\\boldsymbol{P}^{-1}\\boldsymbol{x}$。\n求逆矩阵得 $\\boldsymbol{P}^{-1}=\\begin{pmatrix} 1 & 1 & 1 \\\\ 0 & 1 & 3 \\\\ 0 & 0 & 1 \\end{pmatrix}$，从而\n$$\\boldsymbol{y} = \\begin{pmatrix} 1 & 1 & 1 \\\\ 0 & 1 & 3 \\\\ 0 & 0 & 1 \\end{pmatrix}\\begin{pmatrix} 9 \\\\ -1 \\\\ 2 \\end{pmatrix} = \\begin{pmatrix} 9-1+2 \\\\ -1+6 \\\\ 2 \\end{pmatrix} = \\begin{pmatrix} 10 \\\\ 5 \\\\ 2 \\end{pmatrix}.$$\n故 $\\boldsymbol{y}=(10, 5, 2)^{\\mathrm{T}}$。"
    }
  },
  {
    id: "LAG-TB-CH09-Q10",
    source_type: "textbook",
    source: {
      paper_id: 2009,
      raw_title: "《线性代数与几何》第9章 线性空间与线性变换 课后习题",
      clean_title: "《线性代数与几何》第9章 线性空间与线性变换 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 9 章 · 习题九 第 10 题",
      page_start: 207,
      page_end: 207
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
        chapter: 9,
        chapter_title: "第9章 线性空间与线性变换",
        section: "9.3",
        section_title: "基变换与坐标变换",
        section_slug: "9.3_基变换与坐标变换",
        knowledge_points: ["二阶对称矩阵的基", "过渡矩阵", "坐标变换公式"]
      }
    },
    content: {
      stem: "设 $V$ 为全体二阶实对称矩阵的集合，按矩阵的加法与数乘运算，$V$ 构成一个实线性空间。\n\n(1) 验证 $\\boldsymbol{A}_1=\\begin{pmatrix} 1 & 0 \\\\ 0 & 0 \\end{pmatrix}, \\boldsymbol{A}_2=\\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}, \\boldsymbol{A}_3=\\begin{pmatrix} 0 & 0 \\\\ 0 & 1 \\end{pmatrix}$ 与 $\\boldsymbol{B}_1=\\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix}, \\boldsymbol{B}_2=\\begin{pmatrix} 1 & 1 \\\\ 1 & 0 \\end{pmatrix}, \\boldsymbol{B}_3=\\begin{pmatrix} 1 & 1 \\\\ 1 & 1 \\end{pmatrix}$ 分别为 $V$ 的一组基；\n\n(2) 求从基 $\\boldsymbol{A}_1, \\boldsymbol{A}_2, \\boldsymbol{A}_3$ 到基 $\\boldsymbol{B}_1, \\boldsymbol{B}_2, \\boldsymbol{B}_3$ 的过渡矩阵 $\\boldsymbol{P}$；\n\n(3) 求 $\\boldsymbol{A}=\\begin{pmatrix} 4 & 2 \\\\ 2 & -3 \\end{pmatrix}$ 在基 $\\boldsymbol{B}_1, \\boldsymbol{B}_2, \\boldsymbol{B}_3$ 下的坐标 $\\boldsymbol{y}$。",
      sub_questions: [
        { sub_id: "(1)", stem: "验证两组矩阵分别为 $V$ 的一组基", answer: "验证略" },
        { sub_id: "(2)", stem: "求从基 $\\boldsymbol{A}_1, \\boldsymbol{A}_2, \\boldsymbol{A}_3$ 到基 $\\boldsymbol{B}_1, \\boldsymbol{B}_2, \\boldsymbol{B}_3$ 的过渡矩阵 $\\boldsymbol{P}$", answer: "$\\boldsymbol{P}=\\begin{pmatrix} 1 & 1 & 1 \\\\ 0 & 1 & 1 \\\\ -1 & 0 & 1 \\end{pmatrix}$" },
        { sub_id: "(3)", stem: "求 $\\boldsymbol{A}$ 在基 $\\boldsymbol{B}_1, \\boldsymbol{B}_2, \\boldsymbol{B}_3$ 下的坐标 $\\boldsymbol{y}$", answer: "$\\boldsymbol{y}=(2, 3, -1)^{\\mathrm{T}}$" }
      ]
    },
    solution: {
      answer: "(1) 验证略；\n(2) $\\boldsymbol{P}=\\begin{pmatrix} 1 & 1 & 1 \\\\ 0 & 1 & 1 \\\\ -1 & 0 & 1 \\end{pmatrix}$；\n(3) $\\boldsymbol{y}=\\boldsymbol{P}^{-1}\\begin{pmatrix} 4 \\\\ 2 \\\\ -3 \\end{pmatrix}=\\begin{pmatrix} 1 & -1 & 0 \\\\ -1 & 2 & -1 \\\\ 1 & -1 & 1 \\end{pmatrix}\\begin{pmatrix} 4 \\\\ 2 \\\\ -3 \\end{pmatrix}=\\begin{pmatrix} 2 \\\\ 3 \\\\ -1 \\end{pmatrix}$。",
      hints: "将基 $\\boldsymbol{B}_1, \\boldsymbol{B}_2, \\boldsymbol{B}_3$ 用 $\\boldsymbol{A}_1, \\boldsymbol{A}_2, \\boldsymbol{A}_3$ 线性表出得过渡矩阵 $\\boldsymbol{P}$，再由 $\\boldsymbol{y}=\\boldsymbol{P}^{-1}\\boldsymbol{x}$ 求坐标。",
      steps: "(1) 易验证 $\\boldsymbol{A}_1, \\boldsymbol{A}_2, \\boldsymbol{A}_3$ 为标准基，线性无关且维数为 3；对 $\\boldsymbol{B}_1, \\boldsymbol{B}_2, \\boldsymbol{B}_3$，计算行列式 $\\det \\boldsymbol{P}=1\\ne 0$，可知线性无关，故也为一组基。\n(2) 由\n$$\\boldsymbol{B}_1 = 1\\boldsymbol{A}_1+0\\boldsymbol{A}_2-1\\boldsymbol{A}_3,$$\n$$\\boldsymbol{B}_2 = 1\\boldsymbol{A}_1+1\\boldsymbol{A}_2+0\\boldsymbol{A}_3,$$\n$$\\boldsymbol{B}_3 = 1\\boldsymbol{A}_1+1\\boldsymbol{A}_2+1\\boldsymbol{A}_3,$$\n得过渡矩阵为 $\\boldsymbol{P}=\\begin{pmatrix} 1 & 1 & 1 \\\\ 0 & 1 & 1 \\\\ -1 & 0 & 1 \\end{pmatrix}$。\n(3) 矩阵 $\\boldsymbol{A}=\\begin{pmatrix} 4 & 2 \\\\ 2 & -3 \\end{pmatrix}$ 在基 $\\boldsymbol{A}_1, \\boldsymbol{A}_2, \\boldsymbol{A}_3$ 下的坐标为 $\\boldsymbol{x}=(4, 2, -3)^{\\mathrm{T}}$。\n计算 $\\boldsymbol{P}^{-1}$ 得 $\\boldsymbol{P}^{-1}=\\begin{pmatrix} 1 & -1 & 0 \\\\ -1 & 2 & -1 \\\\ 1 & -1 & 1 \\end{pmatrix}$。\n由坐标变换公式，在基 $\\boldsymbol{B}_1, \\boldsymbol{B}_2, \\boldsymbol{B}_3$ 下的坐标为\n$$\\boldsymbol{y} = \\boldsymbol{P}^{-1}\\boldsymbol{x} = \\begin{pmatrix} 1 & -1 & 0 \\\\ -1 & 2 & -1 \\\\ 1 & -1 & 1 \\end{pmatrix}\\begin{pmatrix} 4 \\\\ 2 \\\\ -3 \\end{pmatrix} = \\begin{pmatrix} 2 \\\\ 3 \\\\ -1 \\end{pmatrix}.$$"
    }
  }
];
