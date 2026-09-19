// scripts/vision_reconstruct/ch09_part2.cjs
module.exports = [
  {
    id: "LAG-TB-CH09-Q11",
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
      source_desc: "《线性代数与几何》第 9 章 · 习题九 第 11 题",
      page_start: 207,
      page_end: 207
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 11,
      paper_q_num: 11,
      type: "calc",
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
        knowledge_points: ["实对称矩阵空间", "维数", "基的构造"]
      }
    },
    content: {
      stem: "设 $V$ 为全体三阶实对称矩阵的集合，按矩阵的加法与数乘运算，$V$ 构成一个实线性空间。求 $V$ 的维数与一组基。"
    },
    solution: {
      answer: "维数是 $6$，$\\boldsymbol{E}_{11}, \\boldsymbol{E}_{22}, \\boldsymbol{E}_{33}, \\boldsymbol{E}_{12}+\\boldsymbol{E}_{21}, \\boldsymbol{E}_{13}+\\boldsymbol{E}_{31}, \\boldsymbol{E}_{23}+\\boldsymbol{E}_{32}$ 为一组基（$\\boldsymbol{E}_{ij}$ 为第 $i$ 行第 $j$ 列元素为 1，其余元素为零的矩阵）。",
      hints: "三阶实对称矩阵由对角线上的 3 个元素和对角线上方的 3 个独立元素确定，共 6 个自由参数。",
      steps: "三阶实对称矩阵 $\\boldsymbol{A}$ 满足 $a_{ij}=a_{ji}$，故形如\n$$\\boldsymbol{A}=\\begin{pmatrix} a_{11} & a_{12} & a_{13} \\\\ a_{12} & a_{22} & a_{23} \\\\ a_{13} & a_{23} & a_{33} \\end{pmatrix}.$$\n将其按独立参数拆分：\n$$\\boldsymbol{A} = a_{11}\\boldsymbol{E}_{11} + a_{22}\\boldsymbol{E}_{22} + a_{33}\\boldsymbol{E}_{33} + a_{12}(\\boldsymbol{E}_{12}+\\boldsymbol{E}_{21}) + a_{13}(\\boldsymbol{E}_{13}+\\boldsymbol{E}_{31}) + a_{23}(\\boldsymbol{E}_{23}+\\boldsymbol{E}_{32}).$$\n这 6 个矩阵显然线性无关，且能线性表出 $V$ 中任意元素。\n因此 $V$ 的维数为 $6$，一组基为 $\\boldsymbol{E}_{11}, \\boldsymbol{E}_{22}, \\boldsymbol{E}_{33}, \\boldsymbol{E}_{12}+\\boldsymbol{E}_{21}, \\boldsymbol{E}_{13}+\\boldsymbol{E}_{31}, \\boldsymbol{E}_{23}+\\boldsymbol{E}_{32}$。"
    }
  },
  {
    id: "LAG-TB-CH09-Q12",
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
      source_desc: "《线性代数与几何》第 9 章 · 习题九 第 12 题",
      page_start: 207,
      page_end: 207
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 12,
      paper_q_num: 12,
      type: "calc",
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
        knowledge_points: ["上三角矩阵空间", "维数", "基的构造"]
      }
    },
    content: {
      stem: "设 $V$ 为全体三阶实上三角矩阵的集合，按矩阵的加法与数乘运算，$V$ 构成一个实线性空间。求 $V$ 的维数与一组基。"
    },
    solution: {
      answer: "维数是 $6$，$\\boldsymbol{E}_{11}, \\boldsymbol{E}_{12}, \\boldsymbol{E}_{13}, \\boldsymbol{E}_{22}, \\boldsymbol{E}_{23}, \\boldsymbol{E}_{33}$ 为一组基（$\\boldsymbol{E}_{ij}$ 为第 $i$ 行第 $j$ 列元素为 1，其余元素为零的矩阵）。",
      hints: "三阶上三角矩阵主对角线及上方的 6 个元素为任意实数，主对角线下方的 3 个元素为零。",
      steps: "三阶实上三角矩阵 $\\boldsymbol{A}$ 形如\n$$\\boldsymbol{A}=\\begin{pmatrix} a_{11} & a_{12} & a_{13} \\\\ 0 & a_{22} & a_{23} \\\\ 0 & 0 & a_{33} \\end{pmatrix} = a_{11}\\boldsymbol{E}_{11} + a_{12}\\boldsymbol{E}_{12} + a_{13}\\boldsymbol{E}_{13} + a_{22}\\boldsymbol{E}_{22} + a_{23}\\boldsymbol{E}_{23} + a_{33}\\boldsymbol{E}_{33}.$$\n这 6 个基本矩阵显然线性无关，且可线性表出所有三阶实上三角矩阵。\n因此 $\\dim V=6$，一组基为 $\\boldsymbol{E}_{11}, \\boldsymbol{E}_{12}, \\boldsymbol{E}_{13}, \\boldsymbol{E}_{22}, \\boldsymbol{E}_{23}, \\boldsymbol{E}_{33}$。"
    }
  },
  {
    id: "LAG-TB-CH09-Q13",
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
      source_desc: "《线性代数与几何》第 9 章 · 习题九 第 13 题",
      page_start: 207,
      page_end: 207
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 13,
      paper_q_num: 13,
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
        knowledge_points: ["线性生成子空间", "极大线性无关组", "坐标表示"]
      }
    },
    content: {
      stem: "设 $\\mathbf{R}^4$ 为全体四维实向量的集合，按向量的加法与数乘运算，$\\mathbf{R}^4$ 构成一个实线性空间。设 $\\boldsymbol{\\alpha}_1=(1,-1,2,3)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_2=(2,1,0,-1)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_3=(4,-1,4,5)^{\\mathrm{T}}, \\boldsymbol{\\alpha}_4=(7,-1,6,7)^{\\mathrm{T}}$。\n\n(1) 求 $L(\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3, \\boldsymbol{\\alpha}_4)$ 的维数与一组基；\n\n(2) 求 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3, \\boldsymbol{\\alpha}_4$ 在题(1)中基下的坐标。",
      sub_questions: [
        { sub_id: "(1)", stem: "求 $L(\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3, \\boldsymbol{\\alpha}_4)$ 的维数与一组基", answer: "维数是 $2$，$\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2$ 为一组基" },
        { sub_id: "(2)", stem: "求各向量在基下的坐标", answer: "$\\boldsymbol{x}_1=(1,0)^{\\mathrm{T}}, \\boldsymbol{x}_2=(0,1)^{\\mathrm{T}}, \\boldsymbol{x}_3=(2,1)^{\\mathrm{T}}, \\boldsymbol{x}_4=(3,2)^{\\mathrm{T}}$" }
      ]
    },
    solution: {
      answer: "(1) 维数是 $2$，$\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2$ 为一组基；\n(2) $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3, \\boldsymbol{\\alpha}_4$ 在基 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2$ 下的坐标分别为 $\\boldsymbol{x}_1=(1,0)^{\\mathrm{T}}, \\boldsymbol{x}_2=(0,1)^{\\mathrm{T}}, \\boldsymbol{x}_3=(2,1)^{\\mathrm{T}}, \\boldsymbol{x}_4=(3,2)^{\\mathrm{T}}$。",
      hints: "将四个列向量构成矩阵，通过初等行变换求其秩和极大线性无关组，并由行变换的系数直接读出坐标。",
      steps: "构造矩阵并施以初等行变换：\n$$\\begin{pmatrix} \\boldsymbol{\\alpha}_1 & \\boldsymbol{\\alpha}_2 & \\boldsymbol{\\alpha}_3 & \\boldsymbol{\\alpha}_4 \\end{pmatrix} = \\begin{pmatrix} 1 & 2 & 4 & 7 \\\\ -1 & 1 & -1 & -1 \\\\ 2 & 0 & 4 & 6 \\\\ 3 & -1 & 5 & 7 \\end{pmatrix} \\to \\begin{pmatrix} 1 & 2 & 4 & 7 \\\\ 0 & 3 & 3 & 6 \\\\ 0 & -4 & -4 & -8 \\\\ 0 & -7 & -7 & -14 \\end{pmatrix} \\to \\begin{pmatrix} 1 & 0 & 2 & 3 \\\\ 0 & 1 & 1 & 2 \\\\ 0 & 0 & 0 & 0 \\\\ 0 & 0 & 0 & 0 \\end{pmatrix}.$$\n(1) 矩阵的秩为 2，故 $L(\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3, \\boldsymbol{\\alpha}_4)$ 的维数是 2，$\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2$ 为一组基。\n(2) 由行最简形可知：\n$$\\boldsymbol{\\alpha}_1 = 1\\boldsymbol{\\alpha}_1 + 0\\boldsymbol{\\alpha}_2 \\implies \\boldsymbol{x}_1=(1, 0)^{\\mathrm{T}},$$\n$$\\boldsymbol{\\alpha}_2 = 0\\boldsymbol{\\alpha}_1 + 1\\boldsymbol{\\alpha}_2 \\implies \\boldsymbol{x}_2=(0, 1)^{\\mathrm{T}},$$\n$$\\boldsymbol{\\alpha}_3 = 2\\boldsymbol{\\alpha}_1 + 1\\boldsymbol{\\alpha}_2 \\implies \\boldsymbol{x}_3=(2, 1)^{\\mathrm{T}},$$\n$$\\boldsymbol{\\alpha}_4 = 3\\boldsymbol{\\alpha}_1 + 2\\boldsymbol{\\alpha}_2 \\implies \\boldsymbol{x}_4=(3, 2)^{\\mathrm{T}}.$$"
    }
  },
  {
    id: "LAG-TB-CH09-Q14",
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
      source_desc: "《线性代数与几何》第 9 章 · 习题九 第 14 题",
      page_start: 207,
      page_end: 207
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 14,
      paper_q_num: 14,
      type: "calc",
      difficulty: 1,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 9,
        chapter_title: "第9章 线性空间与线性变换",
        section: "9.5",
        section_title: "线性变换的矩阵表示",
        section_slug: "9.5_线性变换的矩阵表示",
        knowledge_points: ["线性变换判定", "基下的矩阵"]
      }
    },
    content: {
      stem: "设 $\\mathbf{R}^3$ 为全体三维实向量的集合，按向量的加法与数乘运算，$\\mathbf{R}^3$ 构成一个实线性空间。在 $\\mathbf{R}^3$ 中定义 $\\sigma$ 为\n$$\\sigma(x_1, x_2, x_3)^{\\mathrm{T}} = (x_1+x_2, x_2+x_3, x_3+x_1)^{\\mathrm{T}}, \\quad \\forall x_1, x_2, x_3 \\in \\mathbf{R}。$$\n\n(1) 验证 $\\sigma$ 为 $\\mathbf{R}^3$ 的一个线性变换；\n\n(2) 求 $\\sigma$ 在基 $\\boldsymbol{\\varepsilon}_1, \\boldsymbol{\\varepsilon}_2, \\boldsymbol{\\varepsilon}_3$ 下的矩阵 $\\boldsymbol{A}$。（$\\boldsymbol{\\varepsilon}_i$ 为第 $i$ 个分量为 1，其余分量为零的向量）",
      sub_questions: [
        { sub_id: "(1)", stem: "验证 $\\sigma$ 为 $\\mathbf{R}^3$ 的一个线性变换", answer: "验证略" },
        { sub_id: "(2)", stem: "求 $\\sigma$ 在基 $\\boldsymbol{\\varepsilon}_1, \\boldsymbol{\\varepsilon}_2, \\boldsymbol{\\varepsilon}_3$ 下的矩阵 $\\boldsymbol{A}$", answer: "$\\boldsymbol{A}=\\begin{pmatrix} 1 & 1 & 0 \\\\ 0 & 1 & 1 \\\\ 1 & 0 & 1 \\end{pmatrix}$" }
      ]
    },
    solution: {
      answer: "(1) 验证略；\n(2) $\\boldsymbol{A}=\\begin{pmatrix} 1 & 1 & 0 \\\\ 0 & 1 & 1 \\\\ 1 & 0 & 1 \\end{pmatrix}$。",
      hints: "验证 $\\sigma(\\boldsymbol{\\alpha}+\\boldsymbol{\\beta})=\\sigma(\\boldsymbol{\\alpha})+\\sigma(\\boldsymbol{\\beta})$ 与 $\\sigma(k\\boldsymbol{\\alpha})=k\\sigma(\\boldsymbol{\\alpha})$；计算基向量的像并按列构成矩阵。",
      steps: "(1) 对任意 $\\boldsymbol{x}=(x_1, x_2, x_3)^{\\mathrm{T}}, \\boldsymbol{y}=(y_1, y_2, y_3)^{\\mathrm{T}}\\in\\mathbf{R}^3, k\\in\\mathbf{R}$：\n$$\\begin{aligned} \\sigma(\\boldsymbol{x}+\\boldsymbol{y}) &= ((x_1+y_1)+(x_2+y_2), (x_2+y_2)+(x_3+y_3), (x_3+y_3)+(x_1+y_1))^{\\mathrm{T}} \\\\ &= (x_1+x_2, x_2+x_3, x_3+x_1)^{\\mathrm{T}} + (y_1+y_2, y_2+y_3, y_3+y_1)^{\\mathrm{T}} = \\sigma(\\boldsymbol{x})+\\sigma(\\boldsymbol{y}), \\end{aligned}$$\n$$\\sigma(k\\boldsymbol{x}) = (kx_1+kx_2, kx_2+kx_3, kx_3+kx_1)^{\\mathrm{T}} = k(x_1+x_2, x_2+x_3, x_3+x_1)^{\\mathrm{T}} = k\\sigma(\\boldsymbol{x}),$$\n故 $\\sigma$ 是 $\\mathbf{R}^3$ 的线性变换。\n(2) 计算各标准基向量的像：\n$$\\sigma(\\boldsymbol{\\varepsilon}_1) = \\sigma(1,0,0)^{\\mathrm{T}} = (1, 0, 1)^{\\mathrm{T}} = 1\\boldsymbol{\\varepsilon}_1 + 0\\boldsymbol{\\varepsilon}_2 + 1\\boldsymbol{\\varepsilon}_3,$$\n$$\\sigma(\\boldsymbol{\\varepsilon}_2) = \\sigma(0,1,0)^{\\mathrm{T}} = (1, 1, 0)^{\\mathrm{T}} = 1\\boldsymbol{\\varepsilon}_1 + 1\\boldsymbol{\\varepsilon}_2 + 0\\boldsymbol{\\varepsilon}_3,$$\n$$\\sigma(\\boldsymbol{\\varepsilon}_3) = \\sigma(0,0,1)^{\\mathrm{T}} = (0, 1, 1)^{\\mathrm{T}} = 0\\boldsymbol{\\varepsilon}_1 + 1\\boldsymbol{\\varepsilon}_2 + 1\\boldsymbol{\\varepsilon}_3.$$\n以像向量在基下的坐标为列，得矩阵\n$$\\boldsymbol{A}=\\begin{pmatrix} 1 & 1 & 0 \\\\ 0 & 1 & 1 \\\\ 1 & 0 & 1 \\end{pmatrix}.$$"
    }
  },
  {
    id: "LAG-TB-CH09-Q15",
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
      source_desc: "《线性代数与几何》第 9 章 · 习题九 第 15 题",
      page_start: 207,
      page_end: 207
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 15,
      paper_q_num: 15,
      type: "calc",
      difficulty: 1,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 9,
        chapter_title: "第9章 线性空间与线性变换",
        section: "9.5",
        section_title: "线性变换的矩阵表示",
        section_slug: "9.5_线性变换的矩阵表示",
        knowledge_points: ["矩阵空间上的线性变换", "基下的矩阵"]
      }
    },
    content: {
      stem: "设 $V$ 为全体二阶实矩阵的集合，按矩阵的加法与数乘运算，$V$ 构成一个实线性空间。在 $V$ 中定义 $\\sigma$ 为\n$$\\sigma(\\boldsymbol{X})=\\boldsymbol{X}\\begin{pmatrix} 1 & -2 \\\\ 3 & 1 \\end{pmatrix}, \\quad \\forall \\boldsymbol{X}\\in V。$$\n\n(1) 验证 $\\sigma$ 为 $V$ 的一个线性变换；\n\n(2) 求 $\\sigma$ 在基 $\\boldsymbol{E}_{11}, \\boldsymbol{E}_{12}, \\boldsymbol{E}_{21}, \\boldsymbol{E}_{22}$ 下的矩阵 $\\boldsymbol{A}$。（$\\boldsymbol{E}_{ij}$ 为第 $i$ 行第 $j$ 列元素为 1，其余元素为零的矩阵）",
      sub_questions: [
        { sub_id: "(1)", stem: "验证 $\\sigma$ 为 $V$ 的一个线性变换", answer: "验证略" },
        { sub_id: "(2)", stem: "求 $\\sigma$ 在基 $\\boldsymbol{E}_{11}, \\boldsymbol{E}_{12}, \\boldsymbol{E}_{21}, \\boldsymbol{E}_{22}$ 下的矩阵 $\\boldsymbol{A}$", answer: "$\\boldsymbol{A}=\\begin{pmatrix} 1 & 3 & 0 & 0 \\\\ -2 & 1 & 0 & 0 \\\\ 0 & 0 & 1 & 3 \\\\ 0 & 0 & -2 & 1 \\end{pmatrix}$" }
      ]
    },
    solution: {
      answer: "(1) 验证略；\n(2) $\\boldsymbol{A}=\\begin{pmatrix} 1 & 3 & 0 & 0 \\\\ -2 & 1 & 0 & 0 \\\\ 0 & 0 & 1 & 3 \\\\ 0 & 0 & -2 & 1 \\end{pmatrix}$。",
      hints: "利用矩阵乘法对加法的分配律以及数乘结合律验证线性性；依次计算 4 个基矩阵的像并按列排列。",
      steps: "记 $\\boldsymbol{M}=\\begin{pmatrix} 1 & -2 \\\\ 3 & 1 \\end{pmatrix}$。\n(1) 对任意 $\\boldsymbol{X}, \\boldsymbol{Y}\\in V, k\\in\\mathbf{R}$：\n$$\\sigma(\\boldsymbol{X}+\\boldsymbol{Y})=(\\boldsymbol{X}+\\boldsymbol{Y})\\boldsymbol{M}=\\boldsymbol{XM}+\\boldsymbol{YM}=\\sigma(\\boldsymbol{X})+\\sigma(\\boldsymbol{Y}),$$\n$$\\sigma(k\\boldsymbol{X})=(k\\boldsymbol{X})\\boldsymbol{M}=k(\\boldsymbol{XM})=k\\sigma(\\boldsymbol{X}),$$\n故 $\\sigma$ 是 $V$ 上的线性变换。\n(2) 分别计算基矩阵在 $\\sigma$ 下的像：\n$$\\sigma(\\boldsymbol{E}_{11})=\\begin{pmatrix} 1 & 0 \\\\ 0 & 0 \\end{pmatrix}\\begin{pmatrix} 1 & -2 \\\\ 3 & 1 \\end{pmatrix}=\\begin{pmatrix} 1 & -2 \\\\ 0 & 0 \\end{pmatrix}=1\\boldsymbol{E}_{11}-2\\boldsymbol{E}_{12},$$\n$$\\sigma(\\boldsymbol{E}_{12})=\\begin{pmatrix} 0 & 1 \\\\ 0 & 0 \\end{pmatrix}\\begin{pmatrix} 1 & -2 \\\\ 3 & 1 \\end{pmatrix}=\\begin{pmatrix} 3 & 1 \\\\ 0 & 0 \\end{pmatrix}=3\\boldsymbol{E}_{11}+1\\boldsymbol{E}_{12},$$\n$$\\sigma(\\boldsymbol{E}_{21})=\\begin{pmatrix} 0 & 0 \\\\ 1 & 0 \\end{pmatrix}\\begin{pmatrix} 1 & -2 \\\\ 3 & 1 \\end{pmatrix}=\\begin{pmatrix} 0 & 0 \\\\ 1 & -2 \\end{pmatrix}=1\\boldsymbol{E}_{21}-2\\boldsymbol{E}_{22},$$\n$$\\sigma(\\boldsymbol{E}_{22})=\\begin{pmatrix} 0 & 0 \\\\ 0 & 1 \\end{pmatrix}\\begin{pmatrix} 1 & -2 \\\\ 3 & 1 \\end{pmatrix}=\\begin{pmatrix} 0 & 0 \\\\ 3 & 1 \\end{pmatrix}=3\\boldsymbol{E}_{21}+1\\boldsymbol{E}_{22}.$$\n将各像在基下的坐标按列排列，得\n$$\\boldsymbol{A}=\\begin{pmatrix} 1 & 3 & 0 & 0 \\\\ -2 & 1 & 0 & 0 \\\\ 0 & 0 & 1 & 3 \\\\ 0 & 0 & -2 & 1 \\end{pmatrix}.$$"
    }
  },
  {
    id: "LAG-TB-CH09-Q16",
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
      source_desc: "《线性代数与几何》第 9 章 · 习题九 第 16 题",
      page_start: 207,
      page_end: 208
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
        chapter: 9,
        chapter_title: "第9章 线性空间与线性变换",
        section: "9.5",
        section_title: "线性变换的矩阵表示",
        section_slug: "9.5_线性变换的矩阵表示",
        knowledge_points: ["差分算子", "组合数多项式基", "线性变换矩阵"]
      }
    },
    content: {
      stem: "设 $V=\\mathbf{R}[x]_n$ 为全体次数小于 $n$ 的实系数多项式的集合，按多项式的加法与数乘运算，$V$ 构成一个实线性空间。在 $V$ 中定义 $\\sigma$ 为\n$$\\sigma[f(x)] = f(x+1)-f(x), \\quad \\forall f(x) \\in V。$$\n\n(1) 验证 $\\sigma$ 为 $V$ 的一个线性变换；\n\n(2) 求 $\\sigma$ 在基 $1, x, \\frac{x(x-1)}{2!}, \\frac{x(x-1)(x-2)}{3!}, \\cdots, \\frac{x(x-1)\\cdots(x-n+2)}{(n-1)!}$ 下的矩阵 $\\boldsymbol{A}$。",
      sub_questions: [
        { sub_id: "(1)", stem: "验证 $\\sigma$ 为 $V$ 的一个线性变换", answer: "验证略" },
        { sub_id: "(2)", stem: "求 $\\sigma$ 在给定基下的矩阵 $\\boldsymbol{A}$", answer: "$\\boldsymbol{A}=\\begin{pmatrix} 0 & 1 & 0 & \\cdots & 0 \\\\ 0 & 0 & 1 & \\cdots & 0 \\\\ \\vdots & \\vdots & \\vdots & & \\vdots \\\\ 0 & 0 & 0 & \\cdots & 1 \\\\ 0 & 0 & 0 & \\cdots & 0 \\end{pmatrix}_{n\\times n}$" }
      ]
    },
    solution: {
      answer: "(1) 验证略；\n(2) $\\boldsymbol{A}=\\begin{pmatrix} 0 & 1 & 0 & \\cdots & 0 \\\\ 0 & 0 & 1 & \\cdots & 0 \\\\ \\vdots & \\vdots & \\vdots & & \\vdots \\\\ 0 & 0 & 0 & \\cdots & 1 \\\\ 0 & 0 & 0 & \\cdots & 0 \\end{pmatrix}_{n\\times n}$。",
      hints: "利用向前差分算子的性质 $\\Delta\\binom{x}{k}=\\binom{x+1}{k}-\\binom{x}{k}=\\binom{x}{k-1}$，计算每个基向量的像。",
      steps: "(1) 容易验证差分算子满足线性性质：\n$$\\sigma[f(x)+g(x)] = (f(x+1)+g(x+1)) - (f(x)+g(x)) = \\sigma[f(x)]+\\sigma[g(x)],$$\n$$\\sigma[kf(x)] = kf(x+1)-kf(x) = k\\sigma[f(x)],$$\n且当 $f(x)$ 次数小于 $n$ 时，$f(x+1)-f(x)$ 的次数小于 $n-1 < n$，故 $\\sigma$ 是 $V$ 上的线性变换。\n(2) 记基向量为 $p_0(x)=1$，且对 $k=1, 2, \\dots, n-1$：\n$$p_k(x) = \\frac{x(x-1)\\cdots(x-k+1)}{k!} = \\binom{x}{k}.$$\n则：\n$$\\sigma[p_0(x)] = 1-1 = 0,$$\n$$\\sigma[p_k(x)] = \\binom{x+1}{k} - \\binom{x}{k} = \\binom{x}{k-1} = p_{k-1}(x) \\quad (k=1, 2, \\dots, n-1).$$\n即 $\\sigma(p_0)=0, \\sigma(p_1)=p_0, \\sigma(p_2)=p_1, \\dots, \\sigma(p_{n-1})=p_{n-2}$。\n按列排成矩阵，第 1 列为全零列，第 $k+1$ 列（$k=1,\\dots, n-1$）在第 $k$ 行元素为 1 其余为 0。\n故矩阵为超对角线上全为 1 的 $n$ 阶 Jordan 型幂零方阵：\n$$\\boldsymbol{A}=\\begin{pmatrix} 0 & 1 & 0 & \\cdots & 0 \\\\ 0 & 0 & 1 & \\cdots & 0 \\\\ \\vdots & \\vdots & \\vdots & & \\vdots \\\\ 0 & 0 & 0 & \\cdots & 1 \\\\ 0 & 0 & 0 & \\cdots & 0 \\end{pmatrix}_{n\\times n}.$$"
    }
  },
  {
    id: "LAG-TB-CH09-Q17",
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
      source_desc: "《线性代数与几何》第 9 章 · 习题九 第 17 题",
      page_start: 208,
      page_end: 208
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 17,
      paper_q_num: 17,
      type: "calc",
      difficulty: 2,
      score: 10
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 9,
        chapter_title: "第9章 线性空间与线性变换",
        section: "9.5",
        section_title: "线性变换的矩阵表示",
        section_slug: "9.5_线性变换的矩阵表示",
        knowledge_points: ["线性变换矩阵", "基变换与过渡矩阵", "相似变换公式"]
      }
    },
    content: {
      stem: "设 $V$ 为三维实线性空间，$\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3$ 为 $V$ 的一组基。\n\n(1) 在 $V$ 中定义 $\\sigma$ 为\n$$\\sigma(x_1\\boldsymbol{\\alpha}_1+x_2\\boldsymbol{\\alpha}_2+x_3\\boldsymbol{\\alpha}_3)=(x_1+x_3)\\boldsymbol{\\alpha}_1+x_2\\boldsymbol{\\alpha}_2+(x_1-x_3)\\boldsymbol{\\alpha}_3, \\quad \\forall x_1, x_2, x_3\\in\\mathbf{R},$$\n验证 $\\sigma$ 为 $V$ 的一个线性变换；\n\n(2) 求 $\\sigma$ 在基 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3$ 下的矩阵 $\\boldsymbol{A}$；\n\n(3) 若 $\\boldsymbol{\\beta}_1=\\boldsymbol{\\alpha}_1+\\boldsymbol{\\alpha}_2-\\boldsymbol{\\alpha}_3, \\boldsymbol{\\beta}_2=\\boldsymbol{\\alpha}_2-2\\boldsymbol{\\alpha}_3, \\boldsymbol{\\beta}_3=2\\boldsymbol{\\alpha}_1+\\boldsymbol{\\alpha}_2-2\\boldsymbol{\\alpha}_3$，证明 $\\boldsymbol{\\beta}_1, \\boldsymbol{\\beta}_2, \\boldsymbol{\\beta}_3$ 也是 $V$ 的一组基，并求从基 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3$ 到基 $\\boldsymbol{\\beta}_1, \\boldsymbol{\\beta}_2, \\boldsymbol{\\beta}_3$ 的过渡矩阵 $\\boldsymbol{P}$；\n\n(4) 求 $\\sigma$ 在基 $\\boldsymbol{\\beta}_1, \\boldsymbol{\\beta}_2, \\boldsymbol{\\beta}_3$ 下的矩阵 $\\boldsymbol{B}$。",
      sub_questions: [
        { sub_id: "(1)", stem: "验证 $\\sigma$ 为 $V$ 的一个线性变换", answer: "验证略" },
        { sub_id: "(2)", stem: "求 $\\sigma$ 在基 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3$ 下的矩阵 $\\boldsymbol{A}$", answer: "$\\boldsymbol{A}=\\begin{pmatrix} 1 & 0 & 1 \\\\ 0 & 1 & 0 \\\\ 1 & 0 & -1 \\end{pmatrix}$" },
        { sub_id: "(3)", stem: "证明 $\\boldsymbol{\\beta}_1, \\boldsymbol{\\beta}_2, \\boldsymbol{\\beta}_3$ 也是基，并求过渡矩阵 $\\boldsymbol{P}$", answer: "证明略，$\\boldsymbol{P}=\\begin{pmatrix} 1 & 0 & 2 \\\\ 1 & 1 & 1 \\\\ -1 & -2 & -2 \\end{pmatrix}$" },
        { sub_id: "(4)", stem: "求 $\\sigma$ 在基 $\\boldsymbol{\\beta}_1, \\boldsymbol{\\beta}_2, \\boldsymbol{\\beta}_3$ 下的矩阵 $\\boldsymbol{B}$", answer: "$\\boldsymbol{B}=\\boldsymbol{P}^{-1}\\boldsymbol{AP}=\\begin{pmatrix} 4 & 4 & 6 \\\\ -1 & 0 & -2 \\\\ -2 & -3 & -3 \\end{pmatrix}$" }
      ]
    },
    solution: {
      answer: "(1) 验证略；\n(2) $\\boldsymbol{A}=\\begin{pmatrix} 1 & 0 & 1 \\\\ 0 & 1 & 0 \\\\ 1 & 0 & -1 \\end{pmatrix}$；\n(3) 证明略，$\\boldsymbol{P}=\\begin{pmatrix} 1 & 0 & 2 \\\\ 1 & 1 & 1 \\\\ -1 & -2 & -2 \\end{pmatrix}$；\n(4) $\\boldsymbol{B}=\\boldsymbol{P}^{-1}\\boldsymbol{AP}=\\begin{pmatrix} 4 & 4 & 6 \\\\ -1 & 0 & -2 \\\\ -2 & -3 & -3 \\end{pmatrix}$，其中 $\\boldsymbol{P}^{-1}=\\begin{pmatrix} 0 & 2 & 1 \\\\ -\\frac{1}{2} & 0 & -\\frac{1}{2} \\\\ \\frac{1}{2} & -1 & -\\frac{1}{2} \\end{pmatrix}$。",
      hints: "由定义直接计算像向量在基下的坐标确定矩阵 $\\boldsymbol{A}$；由过渡矩阵行列式不为零证明新基；利用相似变换公式 $\\boldsymbol{B}=\\boldsymbol{P}^{-1}\\boldsymbol{AP}$ 计算新基下的矩阵。",
      steps: "(1) 易验证对任意向量 $\\boldsymbol{x}, \\boldsymbol{y}\\in V$ 和数 $k\\in\\mathbf{R}$ 满足 $\\sigma(\\boldsymbol{x}+\\boldsymbol{y})=\\sigma(\\boldsymbol{x})+\\sigma(\\boldsymbol{y}), \\sigma(k\\boldsymbol{x})=k\\sigma(\\boldsymbol{x})$，故为线性变换。\n(2) 分别求基向量的像：\n$$\\sigma(\\boldsymbol{\\alpha}_1) = 1\\boldsymbol{\\alpha}_1 + 0\\boldsymbol{\\alpha}_2 + 1\\boldsymbol{\\alpha}_3,$$\n$$\\sigma(\\boldsymbol{\\alpha}_2) = 0\\boldsymbol{\\alpha}_1 + 1\\boldsymbol{\\alpha}_2 + 0\\boldsymbol{\\alpha}_3,$$\n$$\\sigma(\\boldsymbol{\\alpha}_3) = 1\\boldsymbol{\\alpha}_1 + 0\\boldsymbol{\\alpha}_2 - 1\\boldsymbol{\\alpha}_3.$$\n故 $\\sigma$ 在基 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3$ 下的矩阵为 $\\boldsymbol{A}=\\begin{pmatrix} 1 & 0 & 1 \\\\ 0 & 1 & 0 \\\\ 1 & 0 & -1 \\end{pmatrix}$。\n(3) 过渡矩阵各列由 $\\boldsymbol{\\beta}_j$ 的系数构成：\n$$\\boldsymbol{P}=\\begin{pmatrix} 1 & 0 & 2 \\\\ 1 & 1 & 1 \\\\ -1 & -2 & -2 \\end{pmatrix}.$$\n计算行列式 $\\det \\boldsymbol{P} = 1(0) + 2(-1) = -2 \\ne 0$，因此 $\\boldsymbol{\\beta}_1, \\boldsymbol{\\beta}_2, \\boldsymbol{\\beta}_3$ 线性无关，也是 $V$ 的一组基，且过渡矩阵为 $\\boldsymbol{P}$。\n(4) 求逆矩阵得\n$$\\boldsymbol{P}^{-1}=\\begin{pmatrix} 0 & 2 & 1 \\\\ -\\frac{1}{2} & 0 & -\\frac{1}{2} \\\\ \\frac{1}{2} & -1 & -\\frac{1}{2} \\end{pmatrix}.$$\n利用相似公式计算新基下的矩阵 $\\boldsymbol{B}$：\n$$\\boldsymbol{AP}=\\begin{pmatrix} 1 & 0 & 1 \\\\ 0 & 1 & 0 \\\\ 1 & 0 & -1 \\end{pmatrix}\\begin{pmatrix} 1 & 0 & 2 \\\\ 1 & 1 & 1 \\\\ -1 & -2 & -2 \\end{pmatrix}=\\begin{pmatrix} 0 & -2 & 0 \\\\ 1 & 1 & 1 \\\\ 2 & 2 & 4 \\end{pmatrix},$$\n$$\\boldsymbol{B}=\\boldsymbol{P}^{-1}\\boldsymbol{AP}=\\begin{pmatrix} 0 & 2 & 1 \\\\ -\\frac{1}{2} & 0 & -\\frac{1}{2} \\\\ \\frac{1}{2} & -1 & -\\frac{1}{2} \\end{pmatrix}\\begin{pmatrix} 0 & -2 & 0 \\\\ 1 & 1 & 1 \\\\ 2 & 2 & 4 \\end{pmatrix}=\\begin{pmatrix} 4 & 4 & 6 \\\\ -1 & 0 & -2 \\\\ -2 & -3 & -3 \\end{pmatrix}.$$"
    }
  },
  {
    id: "LAG-TB-CH09-Q18",
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
      source_desc: "《线性代数与几何》第 9 章 · 习题九 第 18 题",
      page_start: 208,
      page_end: 208
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 18,
      paper_q_num: 18,
      type: "calc",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 9,
        chapter_title: "第9章 线性空间与线性变换",
        section: "9.5",
        section_title: "线性变换的矩阵表示",
        section_slug: "9.5_线性变换的矩阵表示",
        knowledge_points: ["基变换与线性变换矩阵", "基向量置换", "基向量伸缩"]
      }
    },
    content: {
      stem: "设 $V$ 为三维实线性空间，$\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3$ 为 $V$ 的一组基。已知 $V$ 的线性变换 $\\sigma$ 在基 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3$ 下的矩阵为 $\\boldsymbol{A}=(a_{ij})$。\n\n(1) 求 $\\sigma$ 在基 $\\boldsymbol{\\alpha}_3, \\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2$ 下的矩阵 $\\boldsymbol{B}_1$；\n\n(2) 求 $\\sigma$ 在基 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, 2\\boldsymbol{\\alpha}_3$ 下的矩阵 $\\boldsymbol{B}_2$。",
      sub_questions: [
        { sub_id: "(1)", stem: "求 $\\sigma$ 在基 $\\boldsymbol{\\alpha}_3, \\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2$ 下的矩阵 $\\boldsymbol{B}_1$", answer: "$\\boldsymbol{B}_1=\\begin{pmatrix} a_{33} & a_{31} & a_{32} \\\\ a_{13} & a_{11} & a_{12} \\\\ a_{23} & a_{21} & a_{22} \\end{pmatrix}$" },
        { sub_id: "(2)", stem: "求 $\\sigma$ 在基 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, 2\\boldsymbol{\\alpha}_3$ 下的矩阵 $\\boldsymbol{B}_2$", answer: "$\\boldsymbol{B}_2=\\begin{pmatrix} a_{11} & a_{12} & 2a_{13} \\\\ a_{21} & a_{22} & 2a_{23} \\\\ \\frac{1}{2}a_{31} & \\frac{1}{2}a_{32} & a_{33} \\end{pmatrix}$" }
      ]
    },
    solution: {
      answer: "(1) $\\boldsymbol{B}_1=\\begin{pmatrix} a_{33} & a_{31} & a_{32} \\\\ a_{13} & a_{11} & a_{12} \\\\ a_{23} & a_{21} & a_{22} \\end{pmatrix}$；\n(2) $\\boldsymbol{B}_2=\\begin{pmatrix} a_{11} & a_{12} & 2a_{13} \\\\ a_{21} & a_{22} & 2a_{23} \\\\ \\frac{1}{2}a_{31} & \\frac{1}{2}a_{32} & a_{33} \\end{pmatrix}$。",
      hints: "既可通过基变换过渡矩阵公式 $\\boldsymbol{B}=\\boldsymbol{P}^{-1}\\boldsymbol{AP}$ 计算，也可直接由像向量在新基下的线性表出确定矩阵各列。",
      steps: "(1) 从基 $(\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3)$ 到基 $(\\boldsymbol{\\alpha}_3, \\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2)$ 的过渡矩阵为\n$$\\boldsymbol{P}_1 = \\begin{pmatrix} 0 & 1 & 0 \\\\ 0 & 0 & 1 \\\\ 1 & 0 & 0 \\end{pmatrix}, \\quad \\boldsymbol{P}_1^{-1} = \\boldsymbol{P}_1^{\\mathrm{T}} = \\begin{pmatrix} 0 & 0 & 1 \\\\ 1 & 0 & 0 \\\\ 0 & 1 & 0 \\end{pmatrix}.$$\n由 $\\boldsymbol{B}_1 = \\boldsymbol{P}_1^{-1}\\boldsymbol{A}\\boldsymbol{P}_1$ 可得：\n$$\\boldsymbol{B}_1 = \\begin{pmatrix} 0 & 0 & 1 \\\\ 1 & 0 & 0 \\\\ 0 & 1 & 0 \\end{pmatrix}\\begin{pmatrix} a_{11} & a_{12} & a_{13} \\\\ a_{21} & a_{22} & a_{23} \\\\ a_{31} & a_{32} & a_{33} \\end{pmatrix}\\begin{pmatrix} 0 & 1 & 0 \\\\ 0 & 0 & 1 \\\\ 1 & 0 & 0 \\end{pmatrix} = \\begin{pmatrix} a_{33} & a_{31} & a_{32} \\\\ a_{13} & a_{11} & a_{12} \\\\ a_{23} & a_{21} & a_{22} \\end{pmatrix}.$$\n(2) 从基 $(\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3)$ 到基 $(\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, 2\\boldsymbol{\\alpha}_3)$ 的过渡矩阵为\n$$\\boldsymbol{P}_2 = \\begin{pmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & 2 \\end{pmatrix}, \\quad \\boldsymbol{P}_2^{-1} = \\begin{pmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & \\frac{1}{2} \\end{pmatrix}.$$\n由 $\\boldsymbol{B}_2 = \\boldsymbol{P}_2^{-1}\\boldsymbol{A}\\boldsymbol{P}_2$ 计算可得：\n$$\\boldsymbol{B}_2 = \\begin{pmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & \\frac{1}{2} \\end{pmatrix}\\begin{pmatrix} a_{11} & a_{12} & a_{13} \\\\ a_{21} & a_{22} & a_{23} \\\\ a_{31} & a_{32} & a_{33} \\end{pmatrix}\\begin{pmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & 2 \\end{pmatrix} = \\begin{pmatrix} a_{11} & a_{12} & 2a_{13} \\\\ a_{21} & a_{22} & 2a_{23} \\\\ \\frac{1}{2}a_{31} & \\frac{1}{2}a_{32} & a_{33} \\end{pmatrix}.$$"
    }
  },
  {
    id: "LAG-TB-CH09-Q19",
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
      source_desc: "《线性代数与几何》第 9 章 · 习题九 第 19* 题",
      page_start: 208,
      page_end: 208
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 19,
      paper_q_num: 19,
      type: "calc",
      difficulty: 2,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 9,
        chapter_title: "第9章 线性空间与线性变换",
        section: "9.6",
        section_title: "欧氏空间",
        section_slug: "9.6_欧氏空间",
        knowledge_points: ["度量矩阵", "欧氏空间内积", "坐标内积公式"]
      }
    },
    content: {
      stem: "设 $V$ 为三维欧氏空间，$\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3$ 为 $V$ 的一组基，$V$ 在基 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3$ 下的度量矩阵为\n$$\\boldsymbol{A}=\\begin{pmatrix} 1 & 1 & 0 \\\\ 1 & 3 & 2 \\\\ 0 & 2 & 5 \\end{pmatrix}, \\quad \\boldsymbol{\\beta}_1=2\\boldsymbol{\\alpha}_1-\\boldsymbol{\\alpha}_2, \\quad \\boldsymbol{\\beta}_2=\\boldsymbol{\\alpha}_2+\\boldsymbol{\\alpha}_3,$$\n求 $(\\boldsymbol{\\beta}_1, \\boldsymbol{\\beta}_2)$。"
    },
    solution: {
      answer: "$(\\boldsymbol{\\beta}_1, \\boldsymbol{\\beta}_2)=-3$。",
      hints: "若向量在基下的坐标分别为 $\\boldsymbol{x}$ 和 $\\boldsymbol{y}$，度量矩阵为 $\\boldsymbol{A}$，则内积计算公式为 $(\\boldsymbol{\\beta}_1, \\boldsymbol{\\beta}_2)=\\boldsymbol{x}^{\\mathrm{T}}\\boldsymbol{A}\\boldsymbol{y}$。",
      steps: "由题意，$\\boldsymbol{\\beta}_1=2\\boldsymbol{\\alpha}_1-\\boldsymbol{\\alpha}_2$ 在基 $\\boldsymbol{\\alpha}_1, \\boldsymbol{\\alpha}_2, \\boldsymbol{\\alpha}_3$ 下的坐标为 $\\boldsymbol{x}=(2, -1, 0)^{\\mathrm{T}}$；\n$\\boldsymbol{\\beta}_2=\\boldsymbol{\\alpha}_2+\\boldsymbol{\\alpha}_3$ 在该基下的坐标为 $\\boldsymbol{y}=(0, 1, 1)^{\\mathrm{T}}$。\n代入度量矩阵内积公式：\n$$(\\boldsymbol{\\beta}_1, \\boldsymbol{\\beta}_2) = \\boldsymbol{x}^{\\mathrm{T}}\\boldsymbol{A}\\boldsymbol{y} = \\begin{pmatrix} 2 & -1 & 0 \\end{pmatrix}\\begin{pmatrix} 1 & 1 & 0 \\\\ 1 & 3 & 2 \\\\ 0 & 2 & 5 \\end{pmatrix}\\begin{pmatrix} 0 \\\\ 1 \\\\ 1 \\end{pmatrix}.$$\n先算 $\\boldsymbol{A}\\boldsymbol{y}$：\n$$\\boldsymbol{A}\\boldsymbol{y} = \\begin{pmatrix} 1 & 1 & 0 \\\\ 1 & 3 & 2 \\\\ 0 & 2 & 5 \\end{pmatrix}\\begin{pmatrix} 0 \\\\ 1 \\\\ 1 \\end{pmatrix} = \\begin{pmatrix} 1 \\\\ 5 \\\\ 7 \\end{pmatrix}.$$\n再算内积：\n$$(\\boldsymbol{\\beta}_1, \\boldsymbol{\\beta}_2) = \\begin{pmatrix} 2 & -1 & 0 \\end{pmatrix}\\begin{pmatrix} 1 \\\\ 5 \\\\ 7 \\end{pmatrix} = 2\\times 1 + (-1)\\times 5 + 0\\times 7 = 2 - 5 = -3.$$"
    }
  },
  {
    id: "LAG-TB-CH09-Q20",
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
      source_desc: "《线性代数与几何》第 9 章 · 习题九 第 20* 题",
      page_start: 208,
      page_end: 208
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
        chapter: 9,
        chapter_title: "第9章 线性空间与线性变换",
        section: "9.6",
        section_title: "欧氏空间",
        section_slug: "9.6_欧氏空间",
        knowledge_points: ["矩阵内积空间", "标准正交基", "施密特正交化"]
      }
    },
    content: {
      stem: "设 $V$ 为全体二阶实对称矩阵。对于矩阵的加法与数乘运算，$V$ 构成一个三维实线性空间。在 $V$ 中定义内积：$(\\boldsymbol{A}, \\boldsymbol{B})=\\mathrm{tr}(\\boldsymbol{A}^{\\mathrm{T}}\\boldsymbol{B}), \\forall \\boldsymbol{A}, \\boldsymbol{B}\\in V$。求 $V$ 的一组标准正交基。"
    },
    solution: {
      answer: "$\\boldsymbol{A}_1=\\begin{pmatrix} 1 & 0 \\\\ 0 & 0 \\end{pmatrix}, \\boldsymbol{A}_2=\\begin{pmatrix} 0 & \\frac{1}{\\sqrt{2}} \\\\ \\frac{1}{\\sqrt{2}} & 0 \\end{pmatrix}, \\boldsymbol{A}_3=\\begin{pmatrix} 0 & 0 \\\\ 0 & 1 \\end{pmatrix}$。",
      hints: "选取一组方便的正交基，利用内积定义 $(\\boldsymbol{A},\\boldsymbol{A})=\\mathrm{tr}(\\boldsymbol{A}^2)$ 计算各基矩阵的长度并进行单位化。",
      steps: "在 $V$ 中选取一组自然基：\n$$\\boldsymbol{B}_1 = \\begin{pmatrix} 1 & 0 \\\\ 0 & 0 \\end{pmatrix}, \\quad \\boldsymbol{B}_2 = \\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}, \\quad \\boldsymbol{B}_3 = \\begin{pmatrix} 0 & 0 \\\\ 0 & 1 \\end{pmatrix}.$$\n验证它们两两正交：\n$$(\\boldsymbol{B}_1, \\boldsymbol{B}_2) = \\mathrm{tr}\\left[\\begin{pmatrix} 1 & 0 \\\\ 0 & 0 \\end{pmatrix}\\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}\\right] = \\mathrm{tr}\\begin{pmatrix} 0 & 1 \\\\ 0 & 0 \\end{pmatrix} = 0,$$\n$$(\\boldsymbol{B}_1, \\boldsymbol{B}_3) = \\mathrm{tr}\\begin{pmatrix} 0 & 0 \\\\ 0 & 0 \\end{pmatrix} = 0,$$\n$$(\\boldsymbol{B}_2, \\boldsymbol{B}_3) = \\mathrm{tr}\\left[\\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}\\begin{pmatrix} 0 & 0 \\\\ 0 & 1 \\end{pmatrix}\\right] = \\mathrm{tr}\\begin{pmatrix} 0 & 1 \\\\ 0 & 0 \\end{pmatrix} = 0.$$\n故 $\\boldsymbol{B}_1, \\boldsymbol{B}_2, \\boldsymbol{B}_3$ 已经两两正交。\n再计算其长度并进行单位化：\n$$\\|\\boldsymbol{B}_1\\|^2 = (\\boldsymbol{B}_1, \\boldsymbol{B}_1) = \\mathrm{tr}\\begin{pmatrix} 1 & 0 \\\\ 0 & 0 \\end{pmatrix} = 1 \\implies \\boldsymbol{A}_1 = \\boldsymbol{B}_1 = \\begin{pmatrix} 1 & 0 \\\\ 0 & 0 \\end{pmatrix},$$\n$$\\|\\boldsymbol{B}_2\\|^2 = (\\boldsymbol{B}_2, \\boldsymbol{B}_2) = \\mathrm{tr}\\left[\\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}\\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}\\right] = \\mathrm{tr}\\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix} = 2 \\implies \\|\\boldsymbol{B}_2\\|=\\sqrt{2},$$\n$$\\boldsymbol{A}_2 = \\frac{1}{\\sqrt{2}}\\boldsymbol{B}_2 = \\begin{pmatrix} 0 & \\frac{1}{\\sqrt{2}} \\\\ \\frac{1}{\\sqrt{2}} & 0 \\end{pmatrix},$$\n$$\\|\\boldsymbol{B}_3\\|^2 = (\\boldsymbol{B}_3, \\boldsymbol{B}_3) = \\mathrm{tr}\\begin{pmatrix} 0 & 0 \\\\ 0 & 1 \\end{pmatrix} = 1 \\implies \\boldsymbol{A}_3 = \\boldsymbol{B}_3 = \\begin{pmatrix} 0 & 0 \\\\ 0 & 1 \\end{pmatrix}.$$\n因此，$\\boldsymbol{A}_1, \\boldsymbol{A}_2, \\boldsymbol{A}_3$ 即为 $V$ 的一组标准正交基。"
    }
  }
];
