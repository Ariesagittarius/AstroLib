// scripts/vision_reconstruct/ch02_part2.cjs
module.exports = [
  {
    id: "LAG-TB-CH02-Q15",
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
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 15 题",
      page_start: 68,
      page_end: 68
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 15,
      paper_q_num: 15,
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
        knowledge_points: ["逆矩阵解线性方程组", "矩阵方程AX=b"]
      }
    },
    content: {
      stem: "用求逆矩阵的方法解线性方程组\n\n$$\\begin{cases} x_1 + 2x_2 + 3x_3 = 1, \\\\ 2x_1 + 2x_2 + 5x_3 = 2, \\\\ 3x_1 + 5x_2 + x_3 = 3. \\end{cases}$$",
      sub_questions: []
    },
    solution: {
      answer: "$x_1 = 1, x_2 = 0, x_3 = 0$。",
      hints: "将方程组写为矩阵方程 $AX = b$，求出系数矩阵的逆矩阵 $A^{-1}$，再计算 $X = A^{-1}b$。",
      steps: "设方程组的系数矩阵为 $A$，未知数向量为 $X$，常数项向量为 $b$：\n$$A = \\begin{bmatrix} 1 & 2 & 3 \\\\ 2 & 2 & 5 \\\\ 3 & 5 & 1 \\end{bmatrix}, \\quad X = \\begin{bmatrix} x_1 \\\\ x_2 \\\\ x_3 \\end{bmatrix}, \\quad b = \\begin{bmatrix} 1 \\\\ 2 \\\\ 3 \\end{bmatrix}$$\n\n计算 $|A|$：\n$$|A| = 1(2-25) - 2(2-15) + 3(10-6) = -23 + 26 + 12 = 15 \\neq 0$$\n故 $A$ 可逆。计算各元素的代数余子式求 $A^{-1}$：\n$$A^{-1} = \\frac{1}{15} \\begin{bmatrix} -23 & 13 & 4 \\\\ 13 & -8 & 1 \\\\ 4 & 1 & -2 \\end{bmatrix}$$\n\n计算解向量 $X = A^{-1}b$：\n$$X = \\frac{1}{15} \\begin{bmatrix} -23 & 13 & 4 \\\\ 13 & -8 & 1 \\\\ 4 & 1 & -2 \\end{bmatrix} \\begin{bmatrix} 1 \\\\ 2 \\\\ 3 \\end{bmatrix} = \\frac{1}{15} \\begin{bmatrix} -23 + 26 + 12 \\\\ 13 - 16 + 3 \\\\ 4 + 2 - 6 \\end{bmatrix} = \\frac{1}{15} \\begin{bmatrix} 15 \\\\ 0 \\\\ 0 \\end{bmatrix} = \\begin{bmatrix} 1 \\\\ 0 \\\\ 0 \\end{bmatrix}$$\n\n故方程组的解为 $x_1 = 1, x_2 = 0, x_3 = 0$。"
    }
  },
  {
    id: "LAG-TB-CH02-Q16",
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
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 16 题",
      page_start: 68,
      page_end: 68
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
        chapter: 2,
        chapter_title: "第2章 矩阵",
        section: "2.3",
        section_title: "逆矩阵",
        section_slug: "2.3_逆矩阵",
        knowledge_points: ["矩阵方程求解", "逆矩阵应用"]
      }
    },
    content: {
      stem: "已知 $\\begin{bmatrix} 1 & 2 & 0 \\\\ 0 & 1 & -3 \\\\ 4 & 0 & 1 \\end{bmatrix} X + \\begin{bmatrix} 0 & 0 & 1 \\\\ 0 & 1 & 0 \\\\ 1 & 0 & 1 \\end{bmatrix} = X + \\begin{bmatrix} 1 & 0 & 1 \\\\ 0 & 2 & 0 \\\\ 1 & 0 & 1 \\end{bmatrix}$，求 $X$。",
      sub_questions: []
    },
    solution: {
      answer: "$X = \\begin{bmatrix} 0 & 0 & 0 \\\\ \\frac{1}{2} & 0 & 0 \\\\ 0 & -\\frac{1}{3} & 0 \\end{bmatrix}$。",
      hints: "移项合并同类项，化为 $CX = D$ 的形式，其中 $C = A - E$。",
      steps: "原方程移项化简：\n$$\\left( \\begin{bmatrix} 1 & 2 & 0 \\\\ 0 & 1 & -3 \\\\ 4 & 0 & 1 \\end{bmatrix} - E \\right) X = \\begin{bmatrix} 1 & 0 & 1 \\\\ 0 & 2 & 0 \\\\ 1 & 0 & 1 \\end{bmatrix} - \\begin{bmatrix} 0 & 0 & 1 \\\\ 0 & 1 & 0 \\\\ 1 & 0 & 1 \\end{bmatrix}$$\n即：\n$$\\begin{bmatrix} 0 & 2 & 0 \\\\ 0 & 0 & -3 \\\\ 4 & 0 & 0 \\end{bmatrix} X = \\begin{bmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & 0 \\end{bmatrix}$$\n记系数矩阵为 $C$，$|C| = 4(-6) = -24 \\neq 0$，$C$ 可逆。\n求 $C^{-1}$：\n$$C^{-1} = \\begin{bmatrix} 0 & 0 & \\frac{1}{4} \\\\ \\frac{1}{2} & 0 & 0 \\\\ 0 & -\\frac{1}{3} & 0 \\end{bmatrix}$$\n两边左乘 $C^{-1}$：\n$$X = \\begin{bmatrix} 0 & 0 & \\frac{1}{4} \\\\ \\frac{1}{2} & 0 & 0 \\\\ 0 & -\\frac{1}{3} & 0 \\end{bmatrix} \\begin{bmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & 0 \\end{bmatrix} = \\begin{bmatrix} 0 & 0 & 0 \\\\ \\frac{1}{2} & 0 & 0 \\\\ 0 & -\\frac{1}{3} & 0 \\end{bmatrix}$$"
    }
  },
  {
    id: "LAG-TB-CH02-Q17",
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
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 17 题",
      page_start: 68,
      page_end: 68
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 17,
      paper_q_num: 17,
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
        knowledge_points: ["矩阵方程求解", "初等变换法解矩阵方程", "初等矩阵"]
      }
    },
    content: {
      stem: "解下列矩阵方程：\n\n(1) $\\begin{bmatrix} 2 & 3 & -1 \\\\ 1 & 2 & 0 \\\\ -1 & 2 & -1 \\end{bmatrix} X = \\begin{bmatrix} 2 & 1 \\\\ -1 & 0 \\\\ 3 & 0 \\end{bmatrix}$；\n\n(2) $X \\begin{bmatrix} 2 & 1 & -1 \\\\ 2 & 1 & 0 \\\\ 1 & -1 & 1 \\end{bmatrix} = \\begin{bmatrix} 1 & 0 & 2 \\\\ 2 & 1 & 0 \\end{bmatrix}$；\n\n(3) $\\begin{bmatrix} 0 & 1 & 0 \\\\ 1 & 0 & 0 \\\\ 0 & 0 & 1 \\end{bmatrix} X \\begin{bmatrix} 1 & 0 & 0 \\\\ 0 & 0 & 1 \\\\ 0 & 1 & 0 \\end{bmatrix} = \\begin{bmatrix} 1 & -4 & 3 \\\\ 2 & 0 & -1 \\\\ 1 & -2 & 0 \\end{bmatrix}$。",
      sub_questions: [
        { sub_id: "(1)", stem: "解 $\\begin{bmatrix} 2 & 3 & -1 \\\\ 1 & 2 & 0 \\\\ -1 & 2 & -1 \\end{bmatrix} X = \\begin{bmatrix} 2 & 1 \\\\ -1 & 0 \\\\ 3 & 0 \\end{bmatrix}$", answer: "$X = \\frac{1}{5} \\begin{bmatrix} -1 & 2 \\\\ -2 & -1 \\\\ -18 & -4 \\end{bmatrix}$" },
        { sub_id: "(2)", stem: "解 $X \\begin{bmatrix} 2 & 1 & -1 \\\\ 2 & 1 & 0 \\\\ 1 & -1 & 1 \\end{bmatrix} = \\begin{bmatrix} 1 & 0 & 2 \\\\ 2 & 1 & 0 \\end{bmatrix}$", answer: "$X = \\frac{1}{3} \\begin{bmatrix} -5 & 6 & 1 \\\\ 0 & 3 & 0 \\end{bmatrix}$" },
        { sub_id: "(3)", stem: "解 $\\begin{bmatrix} 0 & 1 & 0 \\\\ 1 & 0 & 0 \\\\ 0 & 0 & 1 \\end{bmatrix} X \\begin{bmatrix} 1 & 0 & 0 \\\\ 0 & 0 & 1 \\\\ 0 & 1 & 0 \\end{bmatrix} = \\begin{bmatrix} 1 & -4 & 3 \\\\ 2 & 0 & -1 \\\\ 1 & -2 & 0 \\end{bmatrix}$", answer: "$X = \\begin{bmatrix} 2 & -1 & 0 \\\\ 1 & 3 & -4 \\\\ 1 & 0 & -2 \\end{bmatrix}$" }
      ]
    },
    solution: {
      answer: "(1) $\\frac{1}{5} \\begin{bmatrix} -1 & 2 \\\\ -2 & -1 \\\\ -18 & -4 \\end{bmatrix}$； (2) $\\frac{1}{3} \\begin{bmatrix} -5 & 6 & 1 \\\\ 0 & 3 & 0 \\end{bmatrix}$； (3) $\\begin{bmatrix} 2 & -1 & 0 \\\\ 1 & 3 & -4 \\\\ 1 & 0 & -2 \\end{bmatrix}$。",
      hints: "(1) $AX=B \\implies X = A^{-1}B$；(2) $XB=C \\implies X = CB^{-1}$；(3) 左乘和右乘的初等置换阵均为其自身的逆。",
      steps: "(1) 设 $A = \\begin{bmatrix} 2 & 3 & -1 \\\\ 1 & 2 & 0 \\\\ -1 & 2 & -1 \\end{bmatrix}$，计算 $|A| = -5 \\neq 0$。求得逆矩阵 $A^{-1} = -\\frac{1}{5} \\begin{bmatrix} -2 & 1 & 2 \\\\ 1 & -3 & -1 \\\\ 4 & -7 & 1 \\end{bmatrix}$，从而：\n$$X = A^{-1} \\begin{bmatrix} 2 & 1 \\\\ -1 & 0 \\\\ 3 & 0 \\end{bmatrix} = \\frac{1}{5} \\begin{bmatrix} -1 & 2 \\\\ -2 & -1 \\\\ -18 & -4 \\end{bmatrix}$$\n\n(2) 设 $B = \\begin{bmatrix} 2 & 1 & -1 \\\\ 2 & 1 & 0 \\\\ 1 & -1 & 1 \\end{bmatrix}$，计算 $|B| = 3 \\neq 0$。求得 $B^{-1} = \\frac{1}{3} \\begin{bmatrix} 1 & 0 & 1 \\\\ -2 & 3 & -2 \\\\ -3 & 3 & 0 \\end{bmatrix}$，从而：\n$$X = \\begin{bmatrix} 1 & 0 & 2 \\\\ 2 & 1 & 0 \\end{bmatrix} B^{-1} = \\frac{1}{3} \\begin{bmatrix} -5 & 6 & 1 \\\\ 0 & 3 & 0 \\end{bmatrix}$$\n\n(3) 设 $P = \\begin{bmatrix} 0 & 1 & 0 \\\\ 1 & 0 & 0 \\\\ 0 & 0 & 1 \\end{bmatrix}, Q = \\begin{bmatrix} 1 & 0 & 0 \\\\ 0 & 0 & 1 \\\\ 0 & 1 & 0 \\end{bmatrix}$。显然 $P^{-1} = P, Q^{-1} = Q$。则：\n$$X = P \\begin{bmatrix} 1 & -4 & 3 \\\\ 2 & 0 & -1 \\\\ 1 & -2 & 0 \\end{bmatrix} Q$$\n左乘 $P$ 交换第 1、2 行，右乘 $Q$ 交换第 2、3 列：\n$$X = \\begin{bmatrix} 2 & 0 & -1 \\\\ 1 & -4 & 3 \\\\ 1 & -2 & 0 \\end{bmatrix} \\begin{bmatrix} 1 & 0 & 0 \\\\ 0 & 0 & 1 \\\\ 0 & 1 & 0 \\end{bmatrix} = \\begin{bmatrix} 2 & -1 & 0 \\\\ 1 & 3 & -4 \\\\ 1 & 0 & -2 \\end{bmatrix}$$"
    }
  },
  {
    id: "LAG-TB-CH02-Q18",
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
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 18 题",
      page_start: 68,
      page_end: 69
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 18,
      paper_q_num: 18,
      type: "calc_proof",
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
        knowledge_points: ["逆矩阵的定义", "矩阵多项式因式分解"]
      }
    },
    content: {
      stem: "(1) 若 $A^3+2A^2+A-E=\\mathbf{0}$，证明 $A$ 可逆，并求 $A^{-1}$；\n\n(2) 若 $A^2-A-4E=\\mathbf{0}$，证明 $A+E$ 可逆，并求 $(A+E)^{-1}$；\n\n(3) 若 $A^2+2A-3E=\\mathbf{0}$，求 $A^{-1}, (A+2E)^{-1}, (A+4E)^{-1}$。",
      sub_questions: [
        { sub_id: "(1)", stem: "证明 $A$ 可逆并求 $A^{-1}$", answer: "$A^{-1} = (A+E)^2$（或 $A^2+2A+E$）" },
        { sub_id: "(2)", stem: "证明 $A+E$ 可逆并求 $(A+E)^{-1}$", answer: "$(A+E)^{-1} = \\frac{1}{2}(A-2E)$" },
        { sub_id: "(3)", stem: "求 $A^{-1}, (A+2E)^{-1}, (A+4E)^{-1}$", answer: "$A^{-1} = \\frac{1}{3}(A+2E), (A+2E)^{-1} = \\frac{1}{3}A, (A+4E)^{-1} = -\\frac{1}{5}(A-2E)$" }
      ]
    },
    solution: {
      answer: "(1) $(A+E)^2$； (2) $\\frac{1}{2}(A-2E)$； (3) $A^{-1} = \\frac{1}{3}(A+2E), (A+2E)^{-1} = \\frac{1}{3}A, (A+4E)^{-1} = -\\frac{1}{5}(A-2E)$。",
      hints: "将方程恒等变形为 $M \\cdot N = E$ 的形式，直接由逆矩阵定义确定可逆性与逆矩阵表达式。",
      steps: "(1) 由已知得 $A(A^2 + 2A + E) = E$，即 $A(A+E)^2 = E$。由逆矩阵定义知 $A$ 可逆，且 $A^{-1} = (A+E)^2 = A^2+2A+E$。\n\n(2) 配凑含 $A+E$ 的多项式：\n$$A^2 - A - 4E = (A+E)(A-2E) - 2E = \\mathbf{0}$$\n移项得 $(A+E)(A-2E) = 2E$，即：\n$$(A+E) \\left[ \\frac{1}{2}(A-2E) \\right] = E$$\n故 $A+E$ 可逆，且 $(A+E)^{-1} = \\frac{1}{2}(A-2E)$。\n\n(3) 由 $A^2+2A-3E = \\mathbf{0}$：\n- 变形得 $A(A+2E) = 3E \\implies A \\left[\\frac{1}{3}(A+2E)\\right] = E$，故 $A^{-1} = \\frac{1}{3}(A+2E)$；\n- 变形得 $(A+2E)A = 3E \\implies (A+2E)\\left[\\frac{1}{3}A\\right] = E$，故 $(A+2E)^{-1} = \\frac{1}{3}A$；\n- 配凑含 $A+4E$ 的式子：$(A+4E)(A-2E) + 5E = A^2+2A-8E+5E = A^2+2A-3E = \\mathbf{0}$，移项得 $(A+4E)(A-2E) = -5E$，即 $(A+4E)\\left[-\\frac{1}{5}(A-2E)\\right] = E$，故 $(A+4E)^{-1} = -\\frac{1}{5}(A-2E)$。"
    }
  },
  {
    id: "LAG-TB-CH02-Q19",
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
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 19 题",
      page_start: 69,
      page_end: 69
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 19,
      paper_q_num: 19,
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
        knowledge_points: ["伴随矩阵性质", "伴随矩阵的逆", "矩阵行列式性质"]
      }
    },
    content: {
      stem: "(1) 已知 $A$ 为 $n$ 阶矩阵，且 $|A| = 2$，求 $\\left| \\left( \\frac{1}{2}A \\right)^{-1} - 3A^* \\right|$；\n\n(2) 已知 $A = \\begin{bmatrix} 1 & 5 & 4 \\\\ 0 & 2 & 4 \\\\ 1 & 3 & 1 \\end{bmatrix}$，求 $(A^*)^{-1}$。",
      sub_questions: [
        { sub_id: "(1)", stem: "求 $\\left| \\left( \\frac{1}{2}A \\right)^{-1} - 3A^* \\right|$", answer: "$(-1)^n \\frac{4^n}{2}$" },
        { sub_id: "(2)", stem: "求 $(A^*)^{-1}$", answer: "$\\frac{1}{2}A$" }
      ]
    },
    solution: {
      answer: "(1) $(-1)^n \\frac{4^n}{2}$； (2) $\\frac{1}{2}A$。",
      hints: "利用伴随矩阵基本公式 $A^* = |A|A^{-1}$ 以及方阵行列式性质 $|kA| = k^n |A|$。",
      steps: "(1) 由伴随矩阵性质 $A^* = |A|A^{-1} = 2A^{-1}$，且 $\\left(\\frac{1}{2}A\\right)^{-1} = 2A^{-1}$。\n代入所求式：\n$$\\left( \\frac{1}{2}A \\right)^{-1} - 3A^* = 2A^{-1} - 3(2A^{-1}) = -4A^{-1}$$\n取行列式：\n$$\\left| -4A^{-1} \\right| = (-4)^n |A^{-1}| = (-4)^n \\frac{1}{|A|} = (-1)^n 4^n \\cdot \\frac{1}{2} = (-1)^n \\frac{4^n}{2}$$\n\n(2) 由 $A^* = |A|A^{-1}$，两边求逆得 $(A^*)^{-1} = \\frac{1}{|A|}A$。\n计算 $|A|$：\n$$|A| = 1(2-12) - 5(0-4) + 4(0-2) = -10 + 20 - 8 = 2 \\neq 0$$\n故：\n$$(A^*)^{-1} = \\frac{1}{2}A = \\frac{1}{2} \\begin{bmatrix} 1 & 5 & 4 \\\\ 0 & 2 & 4 \\\\ 1 & 3 & 1 \\end{bmatrix}$$"
    }
  },
  {
    id: "LAG-TB-CH02-Q20",
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
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 20 题",
      page_start: 69,
      page_end: 69
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 20,
      paper_q_num: 20,
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
        knowledge_points: ["逆矩阵定义", "幂零矩阵", "等比数列求和公式"]
      }
    },
    content: {
      stem: "设 $A^k = \\mathbf{0}$ ($k$ 为正整数)，证明：\n$$(E-A)^{-1} = E + A + A^2 + \\cdots + A^{k-1}$$。",
      sub_questions: []
    },
    solution: {
      answer: "证明略（见步骤）。",
      hints: "直接根据逆矩阵的定义，验证 $(E-A)$ 与 $(E+A+A^2+\\cdots+A^{k-1})$ 的乘积是否为单位矩阵 $E$。",
      steps: "考虑矩阵乘积 $(E-A)(E + A + A^2 + \\cdots + A^{k-1})$：\n展开得：\n$$(E-A)(E + A + A^2 + \\cdots + A^{k-1}) = (E + A + A^2 + \\cdots + A^{k-1}) - (A + A^2 + \\cdots + A^{k-1} + A^k)$$\n$$= E - A^k$$\n已知 $A^k = \\mathbf{0}$，因此：\n$$(E-A)(E + A + A^2 + \\cdots + A^{k-1}) = E$$\n同理可验证：\n$$(E + A + A^2 + \\cdots + A^{k-1})(E-A) = E - A^k = E$$\n由逆矩阵的定义，$(E-A)$ 可逆，且：\n$$(E-A)^{-1} = E + A + A^2 + \\cdots + A^{k-1}$$"
    }
  },
  {
    id: "LAG-TB-CH02-Q21",
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
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 21 题",
      page_start: 69,
      page_end: 69
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
        chapter: 2,
        chapter_title: "第2章 矩阵",
        section: "2.3",
        section_title: "逆矩阵",
        section_slug: "2.3_逆矩阵",
        knowledge_points: ["矩阵方程求解", "逆矩阵应用"]
      }
    },
    content: {
      stem: "设 $A = \\begin{bmatrix} 0 & 3 & 3 \\\\ 1 & 1 & 0 \\\\ -1 & 2 & 3 \\end{bmatrix}$，$AB = A + 2B$，求 $B$。",
      sub_questions: []
    },
    solution: {
      answer: "$B = \\begin{bmatrix} 0 & 3 & 3 \\\\ -1 & 2 & 3 \\\\ 1 & 1 & 0 \\end{bmatrix}$。",
      hints: "移项提取 $B$ 得 $(A-2E)B = A$，检验 $A-2E$ 可逆后求逆矩阵。",
      steps: "由 $AB = A + 2B$ 移项得 $(A-2E)B = A$。\n计算 $A-2E$：\n$$A-2E = \\begin{bmatrix} -2 & 3 & 3 \\\\ 1 & -1 & 0 \\\\ -1 & 2 & 1 \\end{bmatrix}$$\n计算行列式 $|A-2E| = -2(-1) - 3(1) + 3(2-1) = 2 - 3 + 3 = 2 \\neq 0$。故 $A-2E$ 可逆。\n求 $(A-2E)^{-1}$：\n$$(A-2E)^{-1} = \\frac{1}{2} \\begin{bmatrix} -1 & 3 & 3 \\\\ -1 & 1 & 3 \\\\ 1 & 1 & -1 \\end{bmatrix}$$\n从而：\n$$B = (A-2E)^{-1} A = \\frac{1}{2} \\begin{bmatrix} -1 & 3 & 3 \\\\ -1 & 1 & 3 \\\\ 1 & 1 & -1 \\end{bmatrix} \\begin{bmatrix} 0 & 3 & 3 \\\\ 1 & 1 & 0 \\\\ -1 & 2 & 3 \\end{bmatrix} = \\begin{bmatrix} 0 & 3 & 3 \\\\ -1 & 2 & 3 \\\\ 1 & 1 & 0 \\end{bmatrix}$$"
    }
  },
  {
    id: "LAG-TB-CH02-Q22",
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
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 22 题",
      page_start: 69,
      page_end: 69
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 22,
      paper_q_num: 22,
      type: "calc",
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
        knowledge_points: ["伴随矩阵性质", "矩阵方程求解", "逆矩阵运算"]
      }
    },
    content: {
      stem: "设矩阵 $A$ 的伴随矩阵 $A^* = \\begin{bmatrix} 1 & 0 & 0 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ 1 & 0 & 1 & 0 \\\\ 0 & -3 & 0 & 8 \\end{bmatrix}$ 且 $ABA^{-1} = BA^{-1} + 3E$，其中 $E$ 是四阶单位矩阵，求矩阵 $B$。",
      sub_questions: []
    },
    solution: {
      answer: "$B = \\begin{bmatrix} 6 & 0 & 0 & 0 \\\\ 0 & 6 & 0 & 0 \\\\ 6 & 0 & 6 & 0 \\\\ 0 & 3 & 0 & -1 \\end{bmatrix}$。",
      hints: "先利用 $|A^*| = |A|^{n-1}$ 确定 $|A|$，求出 $A = |A|(A^*)^{-1}$；再化简矩阵方程为 $(A-E)B = 3A$ 解出 $B$。",
      steps: "由已知 $A^*$ 为下三角矩阵，其行列式为对角线乘积：\n$$|A^*| = 1\\times 1\\times 1\\times 8 = 8$$\n由四阶矩阵伴随矩阵行列式性质 $|A^*| = |A|^3$，得 $|A|^3 = 8 \\implies |A| = 2$。\n由 $AA^* = |A|E$，得 $A = |A|(A^*)^{-1} = 2(A^*)^{-1}$。\n对 $A^*$ 求逆，由初等行变换或下三角公式得：\n$$(A^*)^{-1} = \\begin{bmatrix} 1 & 0 & 0 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ -1 & 0 & 1 & 0 \\\\ 0 & \\frac{3}{8} & 0 & \\frac{1}{8} \\end{bmatrix}$$\n故：\n$$A = 2(A^*)^{-1} = \\begin{bmatrix} 2 & 0 & 0 & 0 \\\\ 0 & 2 & 0 & 0 \\\\ -2 & 0 & 2 & 0 \\\\ 0 & \\frac{3}{4} & 0 & \\frac{1}{4} \\end{bmatrix}$$\n\n将矩阵方程 $ABA^{-1} = BA^{-1} + 3E$ 两边右乘 $A$：\n$$AB = B + 3A \\implies (A-E)B = 3A$$\n计算 $A-E$：\n$$A-E = \\begin{bmatrix} 1 & 0 & 0 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ -2 & 0 & 1 & 0 \\\\ 0 & \\frac{3}{4} & 0 & -\\frac{3}{4} \\end{bmatrix}$$\n其逆为：\n$$(A-E)^{-1} = \\begin{bmatrix} 1 & 0 & 0 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ 2 & 0 & 1 & 0 \\\\ 0 & 1 & 0 & -\\frac{4}{3} \\end{bmatrix}$$\n从而：\n$$B = 3(A-E)^{-1} A = 3 \\begin{bmatrix} 1 & 0 & 0 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ 2 & 0 & 1 & 0 \\\\ 0 & 1 & 0 & -\\frac{4}{3} \\end{bmatrix} \\begin{bmatrix} 2 & 0 & 0 & 0 \\\\ 0 & 2 & 0 & 0 \\\\ -2 & 0 & 2 & 0 \\\\ 0 & \\frac{3}{4} & 0 & \\frac{1}{4} \\end{bmatrix} = \\begin{bmatrix} 6 & 0 & 0 & 0 \\\\ 0 & 6 & 0 & 0 \\\\ 6 & 0 & 6 & 0 \\\\ 0 & 3 & 0 & -1 \\end{bmatrix}$$"
    }
  },
  {
    id: "LAG-TB-CH02-Q23",
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
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 23 题",
      page_start: 69,
      page_end: 69
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
        chapter: 2,
        chapter_title: "第2章 矩阵",
        section: "2.3",
        section_title: "逆矩阵",
        section_slug: "2.3_逆矩阵",
        knowledge_points: ["相似变换", "矩阵的幂", "对角矩阵的幂"]
      }
    },
    content: {
      stem: "设 $P^{-1}AP = \\Lambda$，其中 $P = \\begin{bmatrix} -1 & -4 \\\\ 1 & 1 \\end{bmatrix}, \\Lambda = \\begin{bmatrix} -1 & 0 \\\\ 0 & 2 \\end{bmatrix}$，求 $A^{11}$。",
      sub_questions: []
    },
    solution: {
      answer: "$\\frac{1}{3} \\begin{bmatrix} 1+2^{13} & 4+2^{13} \\\\ -1-2^{11} & -4-2^{11} \\end{bmatrix} = \\begin{bmatrix} 2731 & 2732 \\\\ -683 & -684 \\end{bmatrix}$。",
      hints: "由 $P^{-1}AP = \\Lambda$ 可得 $A = P\\Lambda P^{-1}$，故 $A^{11} = P\\Lambda^{11}P^{-1}$。",
      steps: "由已知 $A = P\\Lambda P^{-1}$，则 $A^{11} = P\\Lambda^{11}P^{-1}$。\n计算 $P^{-1}$：\n$$|P| = (-1)(1) - (-4)(1) = 3$$\n$$P^{-1} = \\frac{1}{3} \\begin{bmatrix} 1 & 4 \\\\ -1 & -1 \\end{bmatrix}$$\n计算对角矩阵的幂：\n$$\\Lambda^{11} = \\begin{bmatrix} (-1)^{11} & 0 \\\\ 0 & 2^{11} \\end{bmatrix} = \\begin{bmatrix} -1 & 0 \\\\ 0 & 2048 \\end{bmatrix}$$\n代入计算：\n$$A^{11} = \\begin{bmatrix} -1 & -4 \\\\ 1 & 1 \\end{bmatrix} \\begin{bmatrix} -1 & 0 \\\\ 0 & 2^{11} \\end{bmatrix} \\cdot \\frac{1}{3} \\begin{bmatrix} 1 & 4 \\\\ -1 & -1 \\end{bmatrix}$$\n$$= \\frac{1}{3} \\begin{bmatrix} 1 & -4\\cdot 2^{11} \\\\ -1 & 2^{11} \\end{bmatrix} \\begin{bmatrix} 1 & 4 \\\\ -1 & -1 \\end{bmatrix} = \\frac{1}{3} \\begin{bmatrix} 1 + 2^{13} & 4 + 2^{13} \\\\ -1 - 2^{11} & -4 - 2^{11} \\end{bmatrix}$$\n将 $2^{11} = 2048, 2^{13} = 8192$ 代入：\n$$A^{11} = \\frac{1}{3} \\begin{bmatrix} 8193 & 8196 \\\\ -2049 & -2052 \\end{bmatrix} = \\begin{bmatrix} 2731 & 2732 \\\\ -683 & -684 \\end{bmatrix}$$"
    }
  },
  {
    id: "LAG-TB-CH02-Q24",
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
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 24 题",
      page_start: 69,
      page_end: 69
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
        chapter: 2,
        chapter_title: "第2章 矩阵",
        section: "2.3",
        section_title: "逆矩阵",
        section_slug: "2.3_逆矩阵",
        knowledge_points: ["矩阵多项式", "对角化应用"]
      }
    },
    content: {
      stem: "设 $AP=P\\Lambda$，其中 $P = \\begin{bmatrix} 1 & 1 & 1 \\\\ 1 & 0 & -2 \\\\ 1 & -1 & 1 \\end{bmatrix}, \\Lambda = \\begin{bmatrix} -1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & 5 \\end{bmatrix}$，求 $\\varphi(A) = A^8(5E-6A+A^2)$。",
      sub_questions: []
    },
    solution: {
      answer: "$4 \\begin{bmatrix} 1 & 1 & 1 \\\\ 1 & 1 & 1 \\\\ 1 & 1 & 1 \\end{bmatrix}$。",
      hints: "多项式分解 $\\varphi(\\lambda) = \\lambda^8(\\lambda-1)(\\lambda-5)$，由于 $AP=P\\Lambda$，有 $\\varphi(A) = P\\varphi(\\Lambda)P^{-1}$。",
      steps: "记标量多项式 $\\varphi(\\lambda) = \\lambda^8(5 - 6\\lambda + \\lambda^2) = \\lambda^8(\\lambda - 1)(\\lambda - 5)$。\n计算对角阵各特征值对应的多项式值：\n- $\\lambda_1 = -1$ 时，$\\varphi(-1) = (-1)^8(-1 - 1)(-1 - 5) = 1 \\times (-2) \\times (-6) = 12$；\n- $\\lambda_2 = 1$ 时，$\\varphi(1) = 1^8(0)(1-5) = 0$；\n- $\\lambda_3 = 5$ 时，$\\varphi(5) = 5^8(5-1)(0) = 0$。\n故：\n$$\\varphi(\\Lambda) = \\begin{bmatrix} 12 & 0 & 0 \\\\ 0 & 0 & 0 \\\\ 0 & 0 & 0 \\end{bmatrix}$$\n\n由 $AP = P\\Lambda$ 且 $|P| = 1(0-2) - 1(1+2) + 1(-1-0) = -2-3-1 = -6 \\neq 0$，知 $P$ 可逆，且 $\\varphi(A) = P\\varphi(\\Lambda)P^{-1}$。\n注意 $\\varphi(\\Lambda)$ 仅有 $(1,1)$ 元非零，故：\n$$\\varphi(A) = P \\begin{bmatrix} 12 \\\\ 0 \\\\ 0 \\end{bmatrix} \\begin{bmatrix} 1 & 0 & 0 \\end{bmatrix} P^{-1} = 12 \\begin{bmatrix} 1 \\\\ 1 \\\\ 1 \\end{bmatrix} [P^{-1}\\text{的第1行}]$$\n求 $P^{-1}$ 的第 1 行（对应于代数余子式除以 $|P|$）：\n$A_{11} = -2, A_{21} = -2, A_{31} = -2$。\n故 $P^{-1}$ 的第 1 行为 $\\frac{1}{-6} [-2, -2, -2] = \\left[ \\frac{1}{3}, \\frac{1}{3}, \\frac{1}{3} \\right]$。\n因此：\n$$\\varphi(A) = 12 \\begin{bmatrix} 1 \\\\ 1 \\\\ 1 \\end{bmatrix} \\begin{bmatrix} \\frac{1}{3} & \\frac{1}{3} & \\frac{1}{3} \\end{bmatrix} = 4 \\begin{bmatrix} 1 & 1 & 1 \\\\ 1 & 1 & 1 \\\\ 1 & 1 & 1 \\end{bmatrix}$$"
    }
  },
  {
    id: "LAG-TB-CH02-Q25",
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
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 25 题",
      page_start: 69,
      page_end: 69
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
        chapter: 2,
        chapter_title: "第2章 矩阵",
        section: "2.4",
        section_title: "矩阵的秩与初等变换",
        section_slug: "2.4_矩阵的秩与初等变换",
        knowledge_points: ["矩阵的秩", "初等行变换", "行阶梯形矩阵"]
      }
    },
    content: {
      stem: "用初等变换求下列矩阵的秩：\n\n(1) $\\begin{bmatrix} 1 & 0 & 0 & 2 & 2 \\\\ 5 & 7 & 6 & 8 & 3 \\\\ 4 & 0 & 0 & 8 & 4 \\\\ 7 & 1 & 0 & 1 & 0 \\end{bmatrix}$；\n\n(2) $\\begin{bmatrix} 4 & -1 & 3 & -2 \\\\ 3 & -1 & 4 & -2 \\\\ 3 & -2 & 2 & -4 \\\\ 0 & 1 & 2 & 2 \\end{bmatrix}$；\n\n(3) $\\begin{bmatrix} 1 & 1 & 1 & 1 & 1 \\\\ 3 & 2 & 1 & 1 & -3 \\\\ 0 & 1 & 3 & 2 & 5 \\\\ 5 & 4 & 3 & 3 & -1 \\end{bmatrix}$；\n\n(4) $\\begin{bmatrix} 1 & 5 & 6 & -4 & -10 \\\\ 2 & 3 & 5 & -1 & -6 \\\\ 6 & -1 & 5 & 7 & 2 \\\\ 2 & -3 & -1 & 5 & 6 \\end{bmatrix}$。",
      sub_questions: [
        { sub_id: "(1)", stem: "求 $\\begin{bmatrix} 1 & 0 & 0 & 2 & 2 \\\\ 5 & 7 & 6 & 8 & 3 \\\\ 4 & 0 & 0 & 8 & 4 \\\\ 7 & 1 & 0 & 1 & 0 \\end{bmatrix}$ 的秩", answer: "$r(A) = 4$" },
        { sub_id: "(2)", stem: "求 $\\begin{bmatrix} 4 & -1 & 3 & -2 \\\\ 3 & -1 & 4 & -2 \\\\ 3 & -2 & 2 & -4 \\\\ 0 & 1 & 2 & 2 \\end{bmatrix}$ 的秩", answer: "$r(A) = 3$" },
        { sub_id: "(3)", stem: "求 $\\begin{bmatrix} 1 & 1 & 1 & 1 & 1 \\\\ 3 & 2 & 1 & 1 & -3 \\\\ 0 & 1 & 3 & 2 & 5 \\\\ 5 & 4 & 3 & 3 & -1 \\end{bmatrix}$ 的秩", answer: "$r(A) = 3$" },
        { sub_id: "(4)", stem: "求 $\\begin{bmatrix} 1 & 5 & 6 & -4 & -10 \\\\ 2 & 3 & 5 & -1 & -6 \\\\ 6 & -1 & 5 & 7 & 2 \\\\ 2 & -3 & -1 & 5 & 6 \\end{bmatrix}$ 的秩", answer: "$r(A) = 2$" }
      ]
    },
    solution: {
      answer: "(1) $r(A)=4$； (2) $r(A)=3$； (3) $r(A)=3$； (4) $r(A)=2$。",
      hints: "使用初等行变换将矩阵化为行阶梯形矩阵，非零行的行数即为矩阵的秩。",
      steps: "(1) 对矩阵施以初等行变换：$r_3 - 4r_1$ 得第 3 行为 $[0, 0, 0, 0, -4]$；继续化为行阶梯形，共有 4 个非零行，故 $r(A) = 4$；\n(2) 作行初等变换：$r_2 - r_3, r_1 - r_2$ 等，化为行阶梯形后有 1 行全零，非零行数为 3，故 $r(A) = 3$；\n(3) 作初等行变换：$r_2 - 3r_1, r_4 - 5r_1$，化简可知第 4 行与前 3 行线性相关，非零行数为 3，故 $r(A) = 3$；\n(4) 作初等行变换：化简得第 3 行与第 4 行全为零，非零行数为 2，故 $r(A) = 2$。"
    }
  },
  {
    id: "LAG-TB-CH02-Q26",
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
      source_desc: "《线性代数与几何》第 2 章 · 习题二 第 26 题",
      page_start: 69,
      page_end: 70
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 26,
      paper_q_num: 26,
      type: "calc",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 2,
        chapter_title: "第2章 矩阵",
        section: "2.4",
        section_title: "矩阵的秩与初等变换",
        section_slug: "2.4_矩阵的秩与初等变换",
        knowledge_points: ["初等行变换求逆", "增广矩阵", "逆矩阵"]
      }
    },
    content: {
      stem: "用初等变换求下列矩阵的逆矩阵：\n\n(1) $\\begin{bmatrix} 3 & -3 & 4 \\\\ 2 & -3 & 4 \\\\ 0 & -1 & 1 \\end{bmatrix}$；\n\n(2) $\\begin{bmatrix} 1 & -3 & 2 \\\\ -3 & 0 & 1 \\\\ 1 & 1 & -1 \\end{bmatrix}$；\n\n(3) $\\begin{bmatrix} 1 & 0 & 0 & 0 \\\\ 2 & 1 & 0 & 0 \\\\ 3 & 2 & 1 & 0 \\\\ 4 & 3 & 2 & 1 \\end{bmatrix}$；\n\n(4) $\\begin{bmatrix} 1 & 1 & 1 & 1 \\\\ 1 & 1 & 1 & 0 \\\\ 1 & 1 & 0 & 0 \\\\ 1 & 0 & 0 & 0 \\end{bmatrix}$。",
      sub_questions: [
        { sub_id: "(1)", stem: "$\\begin{bmatrix} 3 & -3 & 4 \\\\ 2 & -3 & 4 \\\\ 0 & -1 & 1 \\end{bmatrix}^{-1}$", answer: "$\\begin{bmatrix} 1 & -1 & 0 \\\\ -2 & 3 & -4 \\\\ -2 & 3 & -3 \\end{bmatrix}$" },
        { sub_id: "(2)", stem: "$\\begin{bmatrix} 1 & -3 & 2 \\\\ -3 & 0 & 1 \\\\ 1 & 1 & -1 \\end{bmatrix}^{-1}$", answer: "$\\begin{bmatrix} 1 & 1 & 3 \\\\ 2 & 3 & 7 \\\\ 3 & 4 & 9 \\end{bmatrix}$" },
        { sub_id: "(3)", stem: "$\\begin{bmatrix} 1 & 0 & 0 & 0 \\\\ 2 & 1 & 0 & 0 \\\\ 3 & 2 & 1 & 0 \\\\ 4 & 3 & 2 & 1 \\end{bmatrix}^{-1}$", answer: "$\\begin{bmatrix} 1 & 0 & 0 & 0 \\\\ -2 & 1 & 0 & 0 \\\\ 1 & -2 & 1 & 0 \\\\ 0 & 1 & -2 & 1 \\end{bmatrix}$" },
        { sub_id: "(4)", stem: "$\\begin{bmatrix} 1 & 1 & 1 & 1 \\\\ 1 & 1 & 1 & 0 \\\\ 1 & 1 & 0 & 0 \\\\ 1 & 0 & 0 & 0 \\end{bmatrix}$", answer: "$\\begin{bmatrix} 0 & 0 & 0 & 1 \\\\ 0 & 0 & 1 & -1 \\\\ 0 & 1 & -1 & 0 \\\\ 1 & -1 & 0 & 0 \\end{bmatrix}$" }
      ]
    },
    solution: {
      answer: "(1) $\\begin{bmatrix} 1 & -1 & 0 \\\\ -2 & 3 & -4 \\\\ -2 & 3 & -3 \\end{bmatrix}$； (2) $\\begin{bmatrix} 1 & 1 & 3 \\\\ 2 & 3 & 7 \\\\ 3 & 4 & 9 \\end{bmatrix}$； (3) $\\begin{bmatrix} 1 & 0 & 0 & 0 \\\\ -2 & 1 & 0 & 0 \\\\ 1 & -2 & 1 & 0 \\\\ 0 & 1 & -2 & 1 \\end{bmatrix}$； (4) $\\begin{bmatrix} 0 & 0 & 0 & 1 \\\\ 0 & 0 & 1 & -1 \\\\ 0 & 1 & -1 & 0 \\\\ 1 & -1 & 0 & 0 \\end{bmatrix}$。",
      hints: "构造增广矩阵 $(A|E)$，通过初等行变换将左半部分化为单位矩阵 $E$，此时右半部分即为 $A^{-1}$。",
      steps: "(1) 构造 $(A|E)$，通过行初等变换消元：$r_1 - r_2$ 直接获得第一行主元，进而化为单位阵，右端化为 $\\begin{bmatrix} 1 & -1 & 0 \\\\ -2 & 3 & -4 \\\\ -2 & 3 & -3 \\end{bmatrix}$；\n(2) 对增广矩阵 $(A|E)$ 作初等行变换，化简得 $A^{-1} = \\begin{bmatrix} 1 & 1 & 3 \\\\ 2 & 3 & 7 \\\\ 3 & 4 & 9 \\end{bmatrix}$；\n(3) 下三角矩阵求逆：从上到下依次用上一行消去下一行的非对角元，得 $A^{-1} = \\begin{bmatrix} 1 & 0 & 0 & 0 \\\\ -2 & 1 & 0 & 0 \\\\ 1 & -2 & 1 & 0 \\\\ 0 & 1 & -2 & 1 \\end{bmatrix}$；\n(4) 先将行倒序置换再由下向上消元，得 $A^{-1} = \\begin{bmatrix} 0 & 0 & 0 & 1 \\\\ 0 & 0 & 1 & -1 \\\\ 0 & 1 & -1 & 0 \\\\ 1 & -1 & 0 & 0 \\end{bmatrix}$。"
    }
  }
];
