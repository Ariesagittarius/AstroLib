module.exports = [
  {
    id: "LAG-TB-CH02-Q27",
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
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 27 题",
      page_start: 70,
      page_end: 70
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 27,
      paper_q_num: 27,
      type: "calc",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 2,
        chapter_title: "第2章 矩阵",
        section: "2.6",
        section_title: "矩阵的分块法",
        section_slug: "2.6_矩阵的分块法",
        knowledge_points: ["分块矩阵乘法", "准对角矩阵的幂"]
      }
    },
    content: {
      stem: "(1) 用分块法求 $AB$，其中\n$$A = \\begin{bmatrix} 1 & 0 & 0 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ -1 & 2 & 1 & 0 \\\\ 1 & 1 & 0 & 1 \\end{bmatrix}, \\quad B = \\begin{bmatrix} 1 & 0 & 3 & 2 \\\\ -1 & 2 & 0 & 1 \\\\ 1 & 0 & 4 & 1 \\\\ 1 & -1 & 0 & 0 \\end{bmatrix}$$\n\n(2) 设 $A = \\begin{bmatrix} 3 & 4 & 0 & 0 \\\\ 4 & -3 & 0 & 0 \\\\ 0 & 0 & 2 & 4 \\\\ 0 & 0 & 0 & 2 \\end{bmatrix}$，求 $|A^{2k}|, A^{2k}$，$k$ 为正整数。",
      sub_questions: [
        { sub_id: "(1)", stem: "用分块法求 $AB$", answer: "$AB = \\begin{bmatrix} 1 & 0 & 3 & 2 \\\\ -1 & 2 & 0 & 1 \\\\ -2 & 4 & 1 & 1 \\\\ 1 & 1 & 3 & 3 \\end{bmatrix}$" },
        { sub_id: "(2)", stem: "求 $|A^{2k}|, A^{2k}$", answer: "$|A^{2k}| = 100^{2k}, A^{2k} = \\begin{bmatrix} 5^{2k} & 0 & 0 & 0 \\\\ 0 & 5^{2k} & 0 & 0 \\\\ 0 & 0 & 4^k & k 4^{k+1} \\\\ 0 & 0 & 0 & 4^k \\end{bmatrix}$" }
      ]
    },
    solution: {
      answer: "(1) $\\begin{bmatrix} 1 & 0 & 3 & 2 \\\\ -1 & 2 & 0 & 1 \\\\ -2 & 4 & 1 & 1 \\\\ 1 & 1 & 3 & 3 \\end{bmatrix}$； (2) $|A^{2k}| = 100^{2k}, A^{2k} = \\begin{bmatrix} 5^{2k} & 0 & 0 & 0 \\\\ 0 & 5^{2k} & 0 & 0 \\\\ 0 & 0 & 4^k & k 4^{k+1} \\\\ 0 & 0 & 0 & 4^k \\end{bmatrix}$。",
      hints: "(1) 将 $A, B$ 按 $2\\times 2$ 进行分块，左上角为单位阵；(2) $A$ 为准对角分块矩阵，分别求两对角块的偶数次幂。",
      steps: "(1) 将 $A, B$ 分块为 $2\\times 2$ 子块：\n$$A = \\begin{bmatrix} E & \\mathbf{0} \\\\ A_{21} & E \\end{bmatrix}, \\quad B = \\begin{bmatrix} B_{11} & B_{12} \\\\ B_{21} & B_{22} \\end{bmatrix}$$\n其中 $E = \\begin{bmatrix} 1 & 0 \\\\ 0 & 1 \\end{bmatrix}, A_{21} = \\begin{bmatrix} -1 & 2 \\\\ 1 & 1 \\end{bmatrix}, B_{11} = \\begin{bmatrix} 1 & 0 \\\\ -1 & 2 \\end{bmatrix}, B_{12} = \\begin{bmatrix} 3 & 2 \\\\ 0 & 1 \\end{bmatrix}, B_{21} = \\begin{bmatrix} 1 & 0 \\\\ 1 & -1 \\end{bmatrix}, B_{22} = \\begin{bmatrix} 4 & 1 \\\\ 0 & 0 \\end{bmatrix}$。\n计算分块乘积：\n$$AB = \\begin{bmatrix} B_{11} & B_{12} \\\\ A_{21}B_{11}+B_{21} & A_{21}B_{12}+B_{22} \\end{bmatrix}$$\n代入各子块计算得：\n$$AB = \\begin{bmatrix} 1 & 0 & 3 & 2 \\\\ -1 & 2 & 0 & 1 \\\\ -2 & 4 & 1 & 1 \\\\ 1 & 1 & 3 & 3 \\end{bmatrix}$$\n\n(2) 矩阵 $A$ 为准对角矩阵 $A = \\operatorname{diag}(A_1, A_2)$，其中：\n$$A_1 = \\begin{bmatrix} 3 & 4 \\\\ 4 & -3 \\end{bmatrix}, \\quad A_2 = \\begin{bmatrix} 2 & 4 \\\\ 0 & 2 \\end{bmatrix}$$\n计算 $|A| = |A_1||A_2| = (-9 - 16) \\times 4 = -100$。\n故 $|A^{2k}| = |A|^{2k} = (-100)^{2k} = 100^{2k}$。\n计算两子块的平方：\n$$A_1^2 = \\begin{bmatrix} 3 & 4 \\\\ 4 & -3 \\end{bmatrix}^2 = \\begin{bmatrix} 25 & 0 \\\\ 0 & 25 \\end{bmatrix} = 5^2 E$$\n故 $A_1^{2k} = (A_1^2)^k = 5^{2k} E = \\begin{bmatrix} 5^{2k} & 0 \\\\ 0 & 5^{2k} \\end{bmatrix}$；\n$$A_2^2 = \\begin{bmatrix} 2 & 4 \\\\ 0 & 2 \\end{bmatrix}^2 = \\begin{bmatrix} 4 & 16 \\\\ 0 & 4 \\end{bmatrix} = \\begin{bmatrix} 4 & 4^2 \\\\ 0 & 4 \\end{bmatrix}$$\n由数学归纳法易得 $(A_2^2)^k = \\begin{bmatrix} 4^k & k 4^{k+1} \\\\ 0 & 4^k \\end{bmatrix}$。\n因此：\n$$A^{2k} = \\begin{bmatrix} 5^{2k} & 0 & 0 & 0 \\\\ 0 & 5^{2k} & 0 & 0 \\\\ 0 & 0 & 4^k & k 4^{k+1} \\\\ 0 & 0 & 0 & 4^k \\end{bmatrix}$$"
    }
  },
  {
    id: "LAG-TB-CH02-Q28",
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
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 28 题",
      page_start: 70,
      page_end: 70
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 28,
      paper_q_num: 28,
      type: "calc",
      difficulty: 2,
      score: 10
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 2,
        chapter_title: "第2章 矩阵",
        section: "2.6",
        section_title: "矩阵的分块法",
        section_slug: "2.6_矩阵的分块法",
        knowledge_points: ["分块矩阵求逆", "准对角矩阵的逆", "分块三角矩阵的逆"]
      }
    },
    content: {
      stem: "用分块法求下列矩阵的逆矩阵：\n\n(1) $\\begin{bmatrix} 1 & 2 & 0 & 0 \\\\ 3 & 7 & 0 & 0 \\\\ 0 & 0 & 5 & 6 \\\\ 0 & 0 & 4 & 5 \\end{bmatrix}$；\n\n(2) $\\begin{bmatrix} 0 & 0 & 1 & 2 \\\\ 0 & 0 & 3 & 7 \\\\ 5 & 6 & 0 & 0 \\\\ 4 & 5 & 0 & 0 \\end{bmatrix}$；\n\n(3) $\\begin{bmatrix} 0 & 0 & a & 0 \\\\ 0 & 0 & 0 & b \\\\ c & 0 & 0 & 0 \\\\ 0 & d & 0 & 0 \\end{bmatrix}$ ($abcd \\neq 0$)；\n\n(4) $\\begin{bmatrix} 1 & 3 & 0 & 0 \\\\ 2 & 8 & 0 & 0 \\\\ 1 & 0 & 1 & 0 \\\\ 0 & 1 & 2 & 3 \\end{bmatrix}$；\n\n(5) $\\begin{bmatrix} \\cos\\theta & \\sin\\theta & 0 & 0 & 0 \\\\ -\\sin\\theta & \\cos\\theta & 0 & 0 & 0 \\\\ 0 & 0 & 1 & a & b \\\\ 0 & 0 & 0 & 1 & a \\\\ 0 & 0 & 0 & 0 & 1 \\end{bmatrix}$。",
      sub_questions: [
        { sub_id: "(1)", stem: "求 $\\begin{bmatrix} 1 & 2 & 0 & 0 \\\\ 3 & 7 & 0 & 0 \\\\ 0 & 0 & 5 & 6 \\\\ 0 & 0 & 4 & 5 \\end{bmatrix}^{-1}$", answer: "$\\begin{bmatrix} 7 & -2 & 0 & 0 \\\\ -3 & 1 & 0 & 0 \\\\ 0 & 0 & 5 & -6 \\\\ 0 & 0 & -4 & 5 \\end{bmatrix}$" },
        { sub_id: "(2)", stem: "求 $\\begin{bmatrix} 0 & 0 & 1 & 2 \\\\ 0 & 0 & 3 & 7 \\\\ 5 & 6 & 0 & 0 \\\\ 4 & 5 & 0 & 0 \\end{bmatrix}^{-1}$", answer: "$\\begin{bmatrix} 0 & 0 & 5 & -6 \\\\ 0 & 0 & -4 & 5 \\\\ 7 & -2 & 0 & 0 \\\\ -3 & 1 & 0 & 0 \\end{bmatrix}$" },
        { sub_id: "(3)", stem: "求 $\\begin{bmatrix} 0 & 0 & a & 0 \\\\ 0 & 0 & 0 & b \\\\ c & 0 & 0 & 0 \\\\ 0 & d & 0 & 0 \\end{bmatrix}^{-1}$", answer: "$\\begin{bmatrix} 0 & 0 & c^{-1} & 0 \\\\ 0 & 0 & 0 & d^{-1} \\\\ a^{-1} & 0 & 0 & 0 \\\\ 0 & b^{-1} & 0 & 0 \\end{bmatrix}$" },
        { sub_id: "(4)", stem: "求 $\\begin{bmatrix} 1 & 3 & 0 & 0 \\\\ 2 & 8 & 0 & 0 \\\\ 1 & 0 & 1 & 0 \\\\ 0 & 1 & 2 & 3 \\end{bmatrix}^{-1}$", answer: "$\\begin{bmatrix} 4 & -\\frac{3}{2} & 0 & 0 \\\\ -1 & \\frac{1}{2} & 0 & 0 \\\\ -4 & \\frac{3}{2} & 1 & 0 \\\\ 3 & -\\frac{7}{6} & -\\frac{2}{3} & \\frac{1}{3} \\end{bmatrix}$" },
        { sub_id: "(5)", stem: "求 $\\begin{bmatrix} \\cos\\theta & \\sin\\theta & 0 & 0 & 0 \\\\ -\\sin\\theta & \\cos\\theta & 0 & 0 & 0 \\\\ 0 & 0 & 1 & a & b \\\\ 0 & 0 & 0 & 1 & a \\\\ 0 & 0 & 0 & 0 & 1 \\end{bmatrix}^{-1}$", answer: "$\\begin{bmatrix} \\cos\\theta & -\\sin\\theta & 0 & 0 & 0 \\\\ \\sin\\theta & \\cos\\theta & 0 & 0 & 0 \\\\ 0 & 0 & 1 & -a & a^2-b \\\\ 0 & 0 & 0 & 1 & -a \\\\ 0 & 0 & 0 & 0 & 1 \\end{bmatrix}$" }
      ]
    },
    solution: {
      answer: "(1) $\\begin{bmatrix} 7 & -2 & 0 & 0 \\\\ -3 & 1 & 0 & 0 \\\\ 0 & 0 & 5 & -6 \\\\ 0 & 0 & -4 & 5 \\end{bmatrix}$；\n(2) $\\begin{bmatrix} 0 & 0 & 5 & -6 \\\\ 0 & 0 & -4 & 5 \\\\ 7 & -2 & 0 & 0 \\\\ -3 & 1 & 0 & 0 \\end{bmatrix}$；\n(3) $\\begin{bmatrix} 0 & 0 & c^{-1} & 0 \\\\ 0 & 0 & 0 & d^{-1} \\\\ a^{-1} & 0 & 0 & 0 \\\\ 0 & b^{-1} & 0 & 0 \\end{bmatrix}$；\n(4) $\\begin{bmatrix} 4 & -\\frac{3}{2} & 0 & 0 \\\\ -1 & \\frac{1}{2} & 0 & 0 \\\\ -4 & \\frac{3}{2} & 1 & 0 \\\\ 3 & -\\frac{7}{6} & -\\frac{2}{3} & \\frac{1}{3} \\end{bmatrix}$；\n(5) $\\begin{bmatrix} \\cos\\theta & -\\sin\\theta & 0 & 0 & 0 \\\\ \\sin\\theta & \\cos\\theta & 0 & 0 & 0 \\\\ 0 & 0 & 1 & -a & a^2-b \\\\ 0 & 0 & 0 & 1 & -a \\\\ 0 & 0 & 0 & 0 & 1 \\end{bmatrix}$。",
      hints: "熟练运用分块矩阵求逆公式：准对角阵 $\\begin{bmatrix} A & \\mathbf{0} \\\\ \\mathbf{0} & B \\end{bmatrix}^{-1} = \\begin{bmatrix} A^{-1} & \\mathbf{0} \\\\ \\mathbf{0} & B^{-1} \\end{bmatrix}$；副准对角阵 $\\begin{bmatrix} \\mathbf{0} & A \\\\ B & \\mathbf{0} \\end{bmatrix}^{-1} = \\begin{bmatrix} \\mathbf{0} & B^{-1} \\\\ A^{-1} & \\mathbf{0} \\end{bmatrix}$；分块下三角阵 $\\begin{bmatrix} A & \\mathbf{0} \\\\ C & B \\end{bmatrix}^{-1} = \\begin{bmatrix} A^{-1} & \\mathbf{0} \\\\ -B^{-1}CA^{-1} & B^{-1} \\end{bmatrix}$。",
      steps: "(1) 准对角矩阵分块：分别求两二阶块的逆矩阵，$\\begin{bmatrix} 1 & 2 \\\\ 3 & 7 \\end{bmatrix}^{-1} = \\begin{bmatrix} 7 & -2 \\\\ -3 & 1 \\end{bmatrix}$，$\\begin{bmatrix} 5 & 6 \\\\ 4 & 5 \\end{bmatrix}^{-1} = \\begin{bmatrix} 5 & -6 \\\\ -4 & 5 \\end{bmatrix}$，直接拼接即可；\n(2) 副对角分块：利用公式 $\\begin{bmatrix} \\mathbf{0} & A \\\\ B & \\mathbf{0} \\end{bmatrix}^{-1} = \\begin{bmatrix} \\mathbf{0} & B^{-1} \\\\ A^{-1} & \\mathbf{0} \\end{bmatrix}$ 得到；\n(3) 设 $A = \\operatorname{diag}(a, b), B = \\operatorname{diag}(c, d)$，利用副对角分块求逆公式得到；\n(4) 分块下三角阵：$\\begin{bmatrix} A & \\mathbf{0} \\\\ C & B \\end{bmatrix}^{-1} = \\begin{bmatrix} A^{-1} & \\mathbf{0} \\\\ -B^{-1}CA^{-1} & B^{-1} \\end{bmatrix}$，求出各子块后代入计算；\n(5) 准对角分块：前 $2\\times 2$ 为正交旋转矩阵，其逆为转置阵；后 $3\\times 3$ 为上三角若尔当型矩阵，求逆得 $\\begin{bmatrix} 1 & -a & a^2-b \\\\ 0 & 1 & -a \\\\ 0 & 0 & 1 \\end{bmatrix}$。"
    }
  },
  {
    id: "LAG-TB-CH02-Q29",
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
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 29 题",
      page_start: 70,
      page_end: 70
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 29,
      paper_q_num: 29,
      type: "calc",
      difficulty: 1,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 2,
        chapter_title: "第2章 矩阵",
        section: "2.6",
        section_title: "矩阵的分块法",
        section_slug: "2.6_矩阵的分块法",
        knowledge_points: ["分块矩阵乘法"]
      }
    },
    content: {
      stem: "做下列分块矩阵的乘法，其中 $A, B, E$ 都是 $n$ 阶矩阵：\n\n(1) $A^{-1}(A, E)$；\n\n(2) $(A, E)^{\\mathrm{T}}(A, E)$；\n\n(3) $\\begin{bmatrix} A \\\\ E \\end{bmatrix} A^{-1}$；\n\n(4) $\\begin{bmatrix} A^{-1} \\\\ E \\end{bmatrix} (A, E)$；\n\n(5) $\\begin{bmatrix} \\mathbf{0} & E \\\\ E & \\mathbf{0} \\end{bmatrix} \\begin{bmatrix} A \\\\ B \\end{bmatrix}$；\n\n(6) $\\begin{bmatrix} E & \\mathbf{0} \\\\ \\mathbf{0} & \\mathbf{0} \\end{bmatrix} \\begin{bmatrix} A \\\\ B \\end{bmatrix}$。",
      sub_questions: [
        { sub_id: "(1)", stem: "$A^{-1}(A, E)$", answer: "$(E, A^{-1})$" },
        { sub_id: "(2)", stem: "$(A, E)^{\\mathrm{T}}(A, E)$", answer: "$\\begin{bmatrix} A^{\\mathrm{T}}A & A^{\\mathrm{T}} \\\\ A & E \\end{bmatrix}$" },
        { sub_id: "(3)", stem: "$\\begin{bmatrix} A \\\\ E \\end{bmatrix} A^{-1}$", answer: "$\\begin{bmatrix} E \\\\ A^{-1} \\end{bmatrix}$" },
        { sub_id: "(4)", stem: "$\\begin{bmatrix} A^{-1} \\\\ E \\end{bmatrix} (A, E)$", answer: "$\\begin{bmatrix} E & A^{-1} \\\\ A & E \\end{bmatrix}$" },
        { sub_id: "(5)", stem: "$\\begin{bmatrix} \\mathbf{0} & E \\\\ E & \\mathbf{0} \\end{bmatrix} \\begin{bmatrix} A \\\\ B \\end{bmatrix}$", answer: "$\\begin{bmatrix} B \\\\ A \\end{bmatrix}$" },
        { sub_id: "(6)", stem: "$\\begin{bmatrix} E & \\mathbf{0} \\\\ \\mathbf{0} & \\mathbf{0} \\end{bmatrix} \\begin{bmatrix} A \\\\ B \\end{bmatrix}$", answer: "$\\begin{bmatrix} A \\\\ \\mathbf{0} \\end{bmatrix}$" }
      ]
    },
    solution: {
      answer: "(1) $(E, A^{-1})$； (2) $\\begin{bmatrix} A^{\\mathrm{T}}A & A^{\\mathrm{T}} \\\\ A & E \\end{bmatrix}$； (3) $\\begin{bmatrix} E \\\\ A^{-1} \\end{bmatrix}$； (4) $\\begin{bmatrix} E & A^{-1} \\\\ A & E \\end{bmatrix}$； (5) $\\begin{bmatrix} B \\\\ A \\end{bmatrix}$； (6) $\\begin{bmatrix} A \\\\ \\mathbf{0} \\end{bmatrix}$。",
      hints: "按分块矩阵乘法规则，将每个子块作为基本元素进行相乘相加。",
      steps: "(1) $A^{-1}(A, E) = (A^{-1}A, A^{-1}E) = (E, A^{-1})$；\n(2) $(A, E)^{\\mathrm{T}}(A, E) = \\begin{bmatrix} A^{\\mathrm{T}} \\\\ E \\end{bmatrix} (A, E) = \\begin{bmatrix} A^{\\mathrm{T}}A & A^{\\mathrm{T}}E \\\\ EA & EE \\end{bmatrix} = \\begin{bmatrix} A^{\\mathrm{T}}A & A^{\\mathrm{T}} \\\\ A & E \\end{bmatrix}$；\n(3) $\\begin{bmatrix} A \\\\ E \\end{bmatrix} A^{-1} = \\begin{bmatrix} AA^{-1} \\\\ EA^{-1} \\end{bmatrix} = \\begin{bmatrix} E \\\\ A^{-1} \\end{bmatrix}$；\n(4) $\\begin{bmatrix} A^{-1} \\\\ E \\end{bmatrix} (A, E) = \\begin{bmatrix} A^{-1}A & A^{-1}E \\\\ EA & EE \\end{bmatrix} = \\begin{bmatrix} E & A^{-1} \\\\ A & E \\end{bmatrix}$；\n(5) $\\begin{bmatrix} \\mathbf{0} & E \\\\ E & \\mathbf{0} \\end{bmatrix} \\begin{bmatrix} A \\\\ B \\end{bmatrix} = \\begin{bmatrix} \\mathbf{0}A + EB \\\\ EA + \\mathbf{0}B \\end{bmatrix} = \\begin{bmatrix} B \\\\ A \\end{bmatrix}$；\n(6) $\\begin{bmatrix} E & \\mathbf{0} \\\\ \\mathbf{0} & \\mathbf{0} \\end{bmatrix} \\begin{bmatrix} A \\\\ B \\end{bmatrix} = \\begin{bmatrix} EA + \\mathbf{0}B \\\\ \\mathbf{0}A + \\mathbf{0}B \\end{bmatrix} = \\begin{bmatrix} A \\\\ \\mathbf{0} \\end{bmatrix}$。"
    }
  },
  {
    id: "LAG-TB-CH02-Q30",
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
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 30 题",
      page_start: 70,
      page_end: 70
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 30,
      paper_q_num: 30,
      type: "calc_proof",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 2,
        chapter_title: "第2章 矩阵",
        section: "2.6",
        section_title: "矩阵的分块法",
        section_slug: "2.6_矩阵的分块法",
        knowledge_points: ["分块矩阵的逆", "待定子块法"]
      }
    },
    content: {
      stem: "设 $A, B$ 均有逆，求下列分块矩阵的逆：\n\n(1) $\\begin{bmatrix} A & C \\\\ \\mathbf{0} & B \\end{bmatrix}$；\n\n(2) $\\begin{bmatrix} \\mathbf{0} & A \\\\ B & \\mathbf{0} \\end{bmatrix}$。",
      sub_questions: [
        { sub_id: "(1)", stem: "求 $\\begin{bmatrix} A & C \\\\ \\mathbf{0} & B \\end{bmatrix}^{-1}$", answer: "$\\begin{bmatrix} A^{-1} & -A^{-1}CB^{-1} \\\\ \\mathbf{0} & B^{-1} \\end{bmatrix}$" },
        { sub_id: "(2)", stem: "求 $\\begin{bmatrix} \\mathbf{0} & A \\\\ B & \\mathbf{0} \\end{bmatrix}^{-1}$", answer: "$\\begin{bmatrix} \\mathbf{0} & B^{-1} \\\\ A^{-1} & \\mathbf{0} \\end{bmatrix}$" }
      ]
    },
    solution: {
      answer: "(1) $\\begin{bmatrix} A^{-1} & -A^{-1}CB^{-1} \\\\ \\mathbf{0} & B^{-1} \\end{bmatrix}$； (2) $\\begin{bmatrix} \\mathbf{0} & B^{-1} \\\\ A^{-1} & \\mathbf{0} \\end{bmatrix}$。",
      hints: "设逆矩阵为 $\\begin{bmatrix} X & Y \\\\ Z & W \\end{bmatrix}$，利用分块乘法等于单位分块矩阵列出方程组求解。",
      steps: "(1) 设 $\\begin{bmatrix} A & C \\\\ \\mathbf{0} & B \\end{bmatrix} \\begin{bmatrix} X & Y \\\\ Z & W \\end{bmatrix} = \\begin{bmatrix} E & \\mathbf{0} \\\\ \\mathbf{0} & E \\end{bmatrix}$。\n开展分块乘法：\n$$\\begin{cases} AX + CZ = E \\\\ AY + CW = \\mathbf{0} \\\\ BZ = \\mathbf{0} \\\\ BW = E \\end{cases}$$\n由于 $B$ 可逆，由 $BZ = \\mathbf{0}$ 得 $Z = \\mathbf{0}$；由 $BW = E$ 得 $W = B^{-1}$。\n将 $Z=\\mathbf{0}$ 代入第一式得 $AX = E \\implies X = A^{-1}$。\n将 $W=B^{-1}$ 代入第二式得 $AY + CB^{-1} = \\mathbf{0} \\implies Y = -A^{-1}CB^{-1}$。\n故：\n$$\\begin{bmatrix} A & C \\\\ \\mathbf{0} & B \\end{bmatrix}^{-1} = \\begin{bmatrix} A^{-1} & -A^{-1}CB^{-1} \\\\ \\mathbf{0} & B^{-1} \\end{bmatrix}$$\n\n(2) 设 $\\begin{bmatrix} \\mathbf{0} & A \\\\ B & \\mathbf{0} \\end{bmatrix} \\begin{bmatrix} X & Y \\\\ Z & W \\end{bmatrix} = \\begin{bmatrix} E & \\mathbf{0} \\\\ \\mathbf{0} & E \\end{bmatrix}$。\n开展分块乘法：\n$$\\begin{cases} AZ = E \\\\ AW = \\mathbf{0} \\\\ BX = \\mathbf{0} \\\\ BY = E \\end{cases}$$\n由 $A, B$ 可逆解得 $Z = A^{-1}, W = \\mathbf{0}, X = \\mathbf{0}, Y = B^{-1}$。\n故：\n$$\\begin{bmatrix} \\mathbf{0} & A \\\\ B & \\mathbf{0} \\end{bmatrix}^{-1} = \\begin{bmatrix} \\mathbf{0} & B^{-1} \\\\ A^{-1} & \\mathbf{0} \\end{bmatrix}$$"
    }
  },
  {
    id: "LAG-TB-CH02-Q31",
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
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 31 题",
      page_start: 70,
      page_end: 70
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 31,
      paper_q_num: 31,
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
        knowledge_points: ["转置运算性质", "逆矩阵性质", "矩阵恒等变形"]
      }
    },
    content: {
      stem: "化简下列各式：\n\n(1) $(AB^{\\mathrm{T}})^{-1}(C^{\\mathrm{T}}A^{\\mathrm{T}}+E)^{\\mathrm{T}} - (C^{\\mathrm{T}}B^{-1})^{\\mathrm{T}}$，其中 $A, B$ 均为可逆矩阵；\n\n(2) $(E+BA)[E-B(E+AB)^{-1}A]$，其中 $(E+AB)$ 可逆。",
      sub_questions: [
        { sub_id: "(1)", stem: "化简 $(AB^{\\mathrm{T}})^{-1}(C^{\\mathrm{T}}A^{\\mathrm{T}}+E)^{\\mathrm{T}} - (C^{\\mathrm{T}}B^{-1})^{\\mathrm{T}}$", answer: "$(B^{-1})^{\\mathrm{T}}A^{-1}$（或 $(B^{\\mathrm{T}})^{-1}A^{-1}$）" },
        { sub_id: "(2)", stem: "化简 $(E+BA)[E-B(E+AB)^{-1}A]$", answer: "$E$" }
      ]
    },
    solution: {
      answer: "(1) $(B^{-1})^{\\mathrm{T}}A^{-1}$； (2) $E$。",
      hints: "(1) 利用 $(XY)^{-1} = Y^{-1}X^{-1}$ 与 $(X+Y)^{\\mathrm{T}} = X^{\\mathrm{T}} + Y^{\\mathrm{T}}$ 展开；(2) 注意 $(E+BA)B = B(E+AB)$。",
      steps: "(1) 化简各部分：\n$$(AB^{\\mathrm{T}})^{-1} = (B^{\\mathrm{T}})^{-1} A^{-1} = (B^{-1})^{\\mathrm{T}} A^{-1}$$\n$$(C^{\\mathrm{T}}A^{\\mathrm{T}} + E)^{\\mathrm{T}} = (C^{\\mathrm{T}}A^{\\mathrm{T}})^{\\mathrm{T}} + E = AC + E$$\n$$(C^{\\mathrm{T}}B^{-1})^{\\mathrm{T}} = (B^{-1})^{\\mathrm{T}} C$$\n代入原式：\n$$(B^{-1})^{\\mathrm{T}} A^{-1} (AC + E) - (B^{-1})^{\\mathrm{T}} C = (B^{-1})^{\\mathrm{T}} A^{-1} AC + (B^{-1})^{\\mathrm{T}} A^{-1} - (B^{-1})^{\\mathrm{T}} C$$\n$$= (B^{-1})^{\\mathrm{T}} C + (B^{-1})^{\\mathrm{T}} A^{-1} - (B^{-1})^{\\mathrm{T}} C = (B^{-1})^{\\mathrm{T}} A^{-1}$$\n\n(2) 展开乘积：\n$$(E+BA)[E - B(E+AB)^{-1}A] = (E+BA)E - (E+BA)B(E+AB)^{-1}A$$\n注意 $(E+BA)B = B + BAB = B(E+AB)$。\n代入得：\n$$= E + BA - B(E+AB)(E+AB)^{-1}A = E + BA - BA = E$$"
    }
  },
  {
    id: "LAG-TB-CH02-Q32",
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
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 32 题",
      page_start: 70,
      page_end: 70
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 32,
      paper_q_num: 32,
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
        knowledge_points: ["矩阵的迹", "主对角线元素之和", "乘法交换求和号"]
      }
    },
    content: {
      stem: "证明：若 $A, B$ 为两个 $n$ 阶矩阵，则 $AB$ 与 $BA$ 的主对角线上元素之和相等。",
      sub_questions: []
    },
    solution: {
      answer: "证明略（见步骤）。",
      hints: "写出 $AB$ 与 $BA$ 的对角元素公式 $c_{ii} = \\sum_{j=1}^n a_{ij}b_{ji}$ 并交换求和顺序。",
      steps: "设 $A = (a_{ij})_{n \\times n}, B = (b_{ij})_{n \\times n}$。\n记 $C = AB = (c_{ij})_{n \\times n}$，则 $C$ 的主对角线上元素为：\n$$c_{ii} = \\sum_{j=1}^n a_{ij} b_{ji}$$\n$AB$ 的主对角线上元素之和为：\n$$\\operatorname{tr}(AB) = \\sum_{i=1}^n c_{ii} = \\sum_{i=1}^n \\sum_{j=1}^n a_{ij} b_{ji}$$\n\n记 $D = BA = (d_{ij})_{n \\times n}$，则 $D$ 的主对角线上元素为：\n$$d_{jj} = \\sum_{i=1}^n b_{ji} a_{ij}$$\n$BA$ 的主对角线上元素之和为：\n$$\\operatorname{tr}(BA) = \\sum_{j=1}^n d_{jj} = \\sum_{j=1}^n \\sum_{i=1}^n b_{ji} a_{ij}$$\n\n由于标量乘法满足交换律 $a_{ij}b_{ji} = b_{ji}a_{ij}$，且双重求和有限和可交换求和次序，因此：\n$$\\sum_{i=1}^n \\sum_{j=1}^n a_{ij} b_{ji} = \\sum_{j=1}^n \\sum_{i=1}^n b_{ji} a_{ij}$$\n即 $\\operatorname{tr}(AB) = \\operatorname{tr}(BA)$，命题得证。"
    }
  },
  {
    id: "LAG-TB-CH02-Q33",
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
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 33 题",
      page_start: 70,
      page_end: 70
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 33,
      paper_q_num: 33,
      type: "proof",
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
        knowledge_points: ["正交矩阵", "行列式乘法公式", "转置行列式"]
      }
    },
    content: {
      stem: "设 $A$ 为 $n$ 阶矩阵，$A^{\\mathrm{T}}A = E$，$|A| < 0$，证明 $|A+E| = 0$。",
      sub_questions: []
    },
    solution: {
      answer: "证明略（见步骤）。",
      hints: "利用 $A^{\\mathrm{T}}A = E$ 可得 $|A|^2 = 1 \\implies |A| = -1$；再将 $A+E$ 表示为 $(A+A^{\\mathrm{T}}A)$ 提取公因式。",
      steps: "因为 $A^{\\mathrm{T}}A = E$，两边取行列式得：\n$$|A^{\\mathrm{T}}||A| = |A|^2 = |E| = 1$$\n已知 $|A| < 0$，因此必有 $|A| = -1$。\n\n考察行列式 $|A+E|$：\n由于 $E = A^{\\mathrm{T}}A$，代入得：\n$$|A+E| = |A + A^{\\mathrm{T}}A| = |(E + A^{\\mathrm{T}})A| = |E + A^{\\mathrm{T}}| \\cdot |A|$$\n由行列式性质 $|E+A^{\\mathrm{T}}| = |(E+A)^{\\mathrm{T}}| = |E+A| = |A+E|$，且已知 $|A| = -1$：\n$$|A+E| = |A+E| \\cdot (-1) = -|A+E|$$\n移项得：\n$$2|A+E| = 0 \\implies |A+E| = 0$$"
    }
  },
  {
    id: "LAG-TB-CH02-Q34",
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
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 34 题",
      page_start: 71,
      page_end: 71
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 34,
      paper_q_num: 34,
      type: "proof",
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
        knowledge_points: ["全1向量", "特征向量法", "逆矩阵性质"]
      }
    },
    content: {
      stem: "设 $A$ 为 $n$ 阶可逆方阵，且每一行元素之和都等于常数 $a (a \\neq 0)$，证明 $A$ 的逆矩阵的每一行元素之和为 $a^{-1}$。",
      sub_questions: []
    },
    solution: {
      answer: "证明略（见步骤）。",
      hints: "引入全 1 列向量 $e = (1, 1, \\cdots, 1)^{\\mathrm{T}}$，将“每一行元素之和等于 $a$”转化为矩阵向量乘法 $Ae = ae$。",
      steps: "设全 1 列向量 $e = \\begin{bmatrix} 1 \\\\ 1 \\\\ \\vdots \\\\ 1 \\end{bmatrix}$。\n矩阵 $A$ 的第 $i$ 行元素之和为 $\\sum_{j=1}^n a_{ij}$，因此“$A$ 的每一行元素之和都等于 $a$”等价于：\n$$Ae = ae$$\n因 $A$ 可逆且常数 $a \\neq 0$，在等式两边左乘 $A^{-1}$：\n$$e = a A^{-1} e$$\n两边同除以 $a$：\n$$A^{-1} e = \\frac{1}{a} e = \\begin{bmatrix} a^{-1} \\\\ a^{-1} \\\\ \\vdots \\\\ a^{-1} \\end{bmatrix}$$\n由于 $A^{-1} e$ 的第 $i$ 个分量恰好是 $A^{-1}$ 的第 $i$ 行所有元素之和，故等式说明 $A^{-1}$ 的每一行元素之和都等于 $a^{-1}$。"
    }
  },
  {
    id: "LAG-TB-CH02-Q35",
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
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 35 题",
      page_start: 71,
      page_end: 71
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 35,
      paper_q_num: 35,
      type: "proof",
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
        knowledge_points: ["外积矩阵", "幂等矩阵", "齐次方程非零解与可逆性"]
      }
    },
    content: {
      stem: "设 $A = E - XX^{\\mathrm{T}}$，$X = (x_1, x_2, \\cdots, x_n)^{\\mathrm{T}}$ 为非零列矩阵，证明：\n\n(1) $A^2 = A$ 的充分必要条件是 $X^{\\mathrm{T}}X = 1$；\n\n(2) 若 $X^{\\mathrm{T}}X = 1$，则 $A$ 不可逆。",
      sub_questions: [
        { sub_id: "(1)", stem: "证明 $A^2 = A$ 的充要条件是 $X^{\\mathrm{T}}X = 1$", answer: "详见证明步骤" },
        { sub_id: "(2)", stem: "证明若 $X^{\\mathrm{T}}X = 1$，则 $A$ 不可逆", answer: "详见证明步骤" }
      ]
    },
    solution: {
      answer: "证明略（见步骤）。",
      hints: "(1) 计算 $A^2 = (E-XX^{\\mathrm{T}})^2$ 注意 $X^{\\mathrm{T}}X$ 为标量；(2) 验证 $AX = \\mathbf{0}$ 说明存在非零解。",
      steps: "(1) 计算 $A^2$：\n$$A^2 = (E - XX^{\\mathrm{T}})(E - XX^{\\mathrm{T}}) = E - 2XX^{\\mathrm{T}} + X(X^{\\mathrm{T}}X)X^{\\mathrm{T}}$$\n由于 $X^{\\mathrm{T}}X$ 为 $1\\times 1$ 标量，可提到乘积前方：\n$$A^2 = E - (2 - X^{\\mathrm{T}}X)XX^{\\mathrm{T}}$$\n从而：\n$$A^2 = A \\iff E - (2 - X^{\\mathrm{T}}X)XX^{\\mathrm{T}} = E - XX^{\\mathrm{T}} \\iff (1 - X^{\\mathrm{T}}X)XX^{\\mathrm{T}} = \\mathbf{0}$$\n因为 $X$ 为非零列向量，故外积矩阵 $XX^{\\mathrm{T}} \\neq \\mathbf{0}$。\n因此必有 $1 - X^{\\mathrm{T}}X = 0$，即 $X^{\\mathrm{T}}X = 1$。\n反之若 $X^{\\mathrm{T}}X = 1$，显然 $(1-X^{\\mathrm{T}}X)XX^{\\mathrm{T}} = \\mathbf{0}$，即 $A^2 = A$。\n故 $A^2 = A$ 的充要条件是 $X^{\\mathrm{T}}X = 1$。\n\n(2) 若 $X^{\\mathrm{T}}X = 1$，考察齐次线性方程组 $AX = \\mathbf{0}$：\n$$AX = (E - XX^{\\mathrm{T}})X = X - X(X^{\\mathrm{T}}X) = X - X(1) = \\mathbf{0}$$\n因为 $X$ 为非零列向量，这表明齐次线性方程组 $AX = \\mathbf{0}$ 存在非零解 $X$。\n由方阵可逆的充要条件知，$A$ 必不可逆（即 $|A| = 0$）。"
    }
  },
  {
    id: "LAG-TB-CH02-Q36",
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
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 36 题",
      page_start: 71,
      page_end: 71
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 36,
      paper_q_num: 36,
      type: "proof",
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
        knowledge_points: ["伴随矩阵行列式", "零行列式性质", "矩阵行列式乘法定理"]
      }
    },
    content: {
      stem: "设 $n$ 阶矩阵 $A$ 的伴随矩阵为 $A^*$，证明：\n\n(1) 若 $|A| = 0$，则 $|A^*| = 0$；\n\n(2) $|A^*| = |A|^{n-1}$。",
      sub_questions: [
        { sub_id: "(1)", stem: "证明若 $|A| = 0$，则 $|A^*| = 0$", answer: "详见证明步骤" },
        { sub_id: "(2)", stem: "证明 $|A^*| = |A|^{n-1}$", answer: "详见证明步骤" }
      ]
    },
    solution: {
      answer: "证明略（见步骤）。",
      hints: "利用核心恒等式 $AA^* = |A|E$，分别在 $|A| \\neq 0$ 和 $|A| = 0$ 两种情况下讨论。",
      steps: "(1) 反证法或利用秩的性质：\n已知 $AA^* = |A|E$。若 $|A| = 0$，则 $AA^* = \\mathbf{0}$。\n假设 $|A^*| \\neq 0$，则 $A^*$ 可逆，在 $AA^* = \\mathbf{0}$ 两边右乘 $(A^*)^{-1}$ 得 $A = \\mathbf{0}$。\n当 $A = \\mathbf{0}$ 时，由于 $n \\ge 2$，$A$ 中每一个元素的 $(n-1)$ 阶代数余子式均为零，故 $A^* = \\mathbf{0}$，从而 $|A^*| = 0$，与假设矛盾。\n因此若 $|A| = 0$，必有 $|A^*| = 0$。\n\n(2) 由基本性质 $AA^* = |A|E$，两边取行列式：\n$$|AA^*| = |A| |A^*| = ||A|E| = |A|^n$$\n- 当 $|A| \\neq 0$ 时，两边除以非零数 $|A|$，立即得到：\n$$|A^*| = |A|^{n-1}$$\n- 当 $|A| = 0$ 时，由 (1) 知左端 $|A^*| = 0$；右端 $|A|^{n-1} = 0^{n-1} = 0$（因 $n \\ge 2$），等式亦成立。\n\n综上所述，对任意 $n$ 阶矩阵 $A$，均有 $|A^*| = |A|^{n-1}$。"
    }
  },
  {
    id: "LAG-TB-CH02-Q37",
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
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 37 题",
      page_start: 71,
      page_end: 71
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 37,
      paper_q_num: 37,
      type: "proof",
      difficulty: 3,
      score: 10
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 2,
        chapter_title: "第2章 矩阵",
        section: "2.3",
        section_title: "逆矩阵",
        section_slug: "2.3_逆矩阵",
        knowledge_points: ["伴随矩阵性质", "转置伴随矩阵", "重伴随矩阵公式"]
      }
    },
    content: {
      stem: "设 $A$ 为 $n$ 阶可逆矩阵，$A^*$ 为 $A$ 的伴随矩阵，证明：\n\n(1) $(A^*)^{\\mathrm{T}} = (A^{\\mathrm{T}})^*$；\n\n(2) $(A^*)^* = |A|^{n-2}A$。",
      sub_questions: [
        { sub_id: "(1)", stem: "证明 $(A^*)^{\\mathrm{T}} = (A^{\\mathrm{T}})^*$", answer: "详见证明步骤" },
        { sub_id: "(2)", stem: "证明 $(A^*)^* = |A|^{n-2}A$", answer: "详见证明步骤" }
      ]
    },
    solution: {
      answer: "证明略（见步骤）。",
      hints: "当 $A$ 可逆时，伴随矩阵可表示为 $A^* = |A|A^{-1}$，运用逆矩阵与转置的代数运算法则证明。",
      steps: "(1) 因为 $A$ 可逆，由伴随矩阵公式 $A^* = |A|A^{-1}$。\n对两边取转置：\n$$(A^*)^{\\mathrm{T}} = (|A|A^{-1})^{\\mathrm{T}} = |A|(A^{-1})^{\\mathrm{T}} = |A|(A^{\\mathrm{T}})^{-1}$$\n又因为 $|A^{\\mathrm{T}}| = |A|$，故：\n$$(A^*)^{\\mathrm{T}} = |A^{\\mathrm{T}}|(A^{\\mathrm{T}})^{-1} = (A^{\\mathrm{T}})^*$$\n\n(2) 设 $B = A^*$。由伴随矩阵定义公式，对可逆矩阵 $B$ 均有：\n$$B^* = |B|B^{-1}$$\n代入 $B = A^*$：\n$$(A^*)^* = |A^*| (A^*)^{-1}$$\n由第 36 题结论，$|A^*| = |A|^{n-1}$。\n又由 $A^* = |A|A^{-1}$ 求逆得：\n$$(A^*)^{-1} = (|A|A^{-1})^{-1} = \\frac{1}{|A|} (A^{-1})^{-1} = |A|^{-1} A$$\n将上述两式代入：\n$$(A^*)^* = |A|^{n-1} \\cdot \\left( |A|^{-1} A \\right) = |A|^{(n-1)-1} A = |A|^{n-2} A$$\n命题得证。"
    }
  },
  {
    id: "LAG-TB-CH02-Q38",
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
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 38 题",
      page_start: 71,
      page_end: 71
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 38,
      paper_q_num: 38,
      type: "proof",
      difficulty: 3,
      score: 10
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 2,
        chapter_title: "第2章 矩阵",
        section: "2.3",
        section_title: "逆矩阵",
        section_slug: "2.3_逆矩阵",
        knowledge_points: ["代数余子式与伴随矩阵", "矩阵可逆性判定", "矩阵行列式计算"]
      }
    },
    content: {
      stem: "设 $A$ 为 $n$ 阶 ($n>2$) 非零矩阵，且 $A_{ij} = a_{ij}$，$A_{ij}$ 是矩阵 $A$ 的行列式中元素 $a_{ij}$ 对应的代数余子式，证明：\n\n(1) $A$ 可逆；\n\n(2) $|A| = 1$。",
      sub_questions: [
        { sub_id: "(1)", stem: "证明 $A$ 可逆", answer: "详见证明步骤" },
        { sub_id: "(2)", stem: "证明 $|A| = 1$", answer: "详见证明步骤" }
      ]
    },
    solution: {
      answer: "证明略（见步骤）。",
      hints: "伴随矩阵 $A^* = (A_{ji})_{n\\times n}$，由 $A_{ij} = a_{ij}$ 得 $A^* = A^{\\mathrm{T}}$；利用 $AA^* = |A|E$ 推导 $AA^{\\mathrm{T}} = |A|E$ 并两边取行列式。",
      steps: "由伴随矩阵定义：\n$$A^* = \\begin{bmatrix} A_{11} & A_{21} & \\cdots & A_{n1} \\\\ A_{12} & A_{22} & \\cdots & A_{n2} \\\\ \\vdots & \\vdots & & \\vdots \\\\ A_{1n} & A_{2n} & \\cdots & A_{nn} \\end{bmatrix} = (A_{ji})_{n \\times n}$$\n由题设已知 $A_{ij} = a_{ij}$，故 $A_{ji} = a_{ji}$，从而：\n$$A^* = (a_{ji})_{n \\times n} = A^{\\mathrm{T}}$$\n由伴随矩阵的核心性质 $AA^* = |A|E$，代入可得：\n$$AA^{\\mathrm{T}} = |A|E$$\n\n(1) 证明 $A$ 可逆：\n两边取行列式：\n$$|AA^{\\mathrm{T}}| = |A||A^{\\mathrm{T}}| = |A|^2 = ||A|E| = |A|^n$$\n移项得：\n$$|A|^2 (|A|^{n-2} - 1) = 0$$\n若 $|A| = 0$，则 $AA^{\\mathrm{T}} = \\mathbf{0}$。\n因为 $AA^{\\mathrm{T}}$ 的主对角线上元素为：\n$$(AA^{\\mathrm{T}})_{ii} = \\sum_{j=1}^n a_{ij}^2$$\n$AA^{\\mathrm{T}} = \\mathbf{0}$ 意味着 $\\sum_{j=1}^n a_{ij}^2 = 0$ 对所有 $i=1, 2, \\cdots, n$ 成立，由于 $a_{ij}$ 均为实数，必导致所有元素 $a_{ij} = 0$，即 $A = \\mathbf{0}$。\n这与题设 “$A$ 为非零矩阵” 矛盾！\n因此必有 $|A| \\neq 0$，即 $A$ 可逆。\n\n(2) 证明 $|A| = 1$：\n因为 $|A| \\neq 0$，方程 $|A|^2 (|A|^{n-2} - 1) = 0$ 两边可除以 $|A|^2$，得：\n$$|A|^{n-2} = 1$$\n又考察式子 $AA^{\\mathrm{T}} = |A|E$ 的对角线第 1 个元素：\n$$\\sum_{j=1}^n a_{1j}^2 = |A|$$\n因为 $A$ 为非零矩阵，至少存在一行不全为零（设其第 1 行不全为零，若全为零则可取非零行讨论），平方和为正实数，故 $|A| > 0$。\n已知 $n > 2$，指数 $n-2 \\ge 1$ 为正整数。\n正实数方程 $|A|^{n-2} = 1$ 在实数范围内的唯一正解为：\n$$|A| = 1$$\n证毕。"
    }
  }
];
