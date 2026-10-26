const fs = require('fs');
const path = require('path');
const katex = require('katex');

const ch06Questions = [
  {
    id: "LAG-TB-CH06-Q01",
    source_type: "textbook",
    source: {
      paper_id: 2006,
      raw_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      clean_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 6 章 · 习题六 第 1 题",
      page_start: 144,
      page_end: 144
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 1,
      paper_q_num: 1,
      type: "proof",
      difficulty: 1,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 6,
        chapter_title: "第6章 特征值与特征向量",
        section: "6.1",
        section_title: "特征值与特征向量",
        section_slug: "6.1_特征值与特征向量",
        knowledge_points: ["矩阵的迹", "迹的运算性质"]
      }
    },
    content: {
      stem: "设 $\\boldsymbol{A}, \\boldsymbol{B}$ 为 $n$ 阶方阵. 试证：\n\n(1) $\\operatorname{tr}(\\boldsymbol{A}+\\boldsymbol{B}) = \\operatorname{tr}(\\boldsymbol{A}) + \\operatorname{tr}(\\boldsymbol{B})$；\n\n(2) $\\operatorname{tr}(k\\boldsymbol{A}) = k\\operatorname{tr}(\\boldsymbol{A})$（$k$ 为任意数）；\n\n(3) $\\operatorname{tr}(\\boldsymbol{AB}) = \\operatorname{tr}(\\boldsymbol{BA})$。",
      sub_questions: [
        { sub_id: "(1)", stem: "$\\operatorname{tr}(\\boldsymbol{A}+\\boldsymbol{B}) = \\operatorname{tr}(\\boldsymbol{A}) + \\operatorname{tr}(\\boldsymbol{B})$", answer: "证明略。" },
        { sub_id: "(2)", stem: "$\\operatorname{tr}(k\\boldsymbol{A}) = k\\operatorname{tr}(\\boldsymbol{A})$（$k$ 为任意数）", answer: "证明略。" },
        { sub_id: "(3)", stem: "$\\operatorname{tr}(\\boldsymbol{AB}) = \\operatorname{tr}(\\boldsymbol{BA})$", answer: "证明略。" }
      ]
    },
    solution: {
      answer: "证明略。",
      hints: "利用方阵的迹的定义 $\\operatorname{tr}(\\boldsymbol{A}) = \\sum_{i=1}^n a_{ii}$，根据矩阵加法、数乘以及矩阵乘法的主对角元公式展开验证。",
      steps: "设 $\\boldsymbol{A} = (a_{ij})_{n \\times n}$，$\\boldsymbol{B} = (b_{ij})_{n \\times n}$。\n\n(1) $\\boldsymbol{A}+\\boldsymbol{B}$ 的第 $i$ 行第 $i$ 列元素为 $a_{ii} + b_{ii}$，故\n$$\\operatorname{tr}(\\boldsymbol{A}+\\boldsymbol{B}) = \\sum_{i=1}^n (a_{ii}+b_{ii}) = \\sum_{i=1}^n a_{ii} + \\sum_{i=1}^n b_{ii} = \\operatorname{tr}(\\boldsymbol{A}) + \\operatorname{tr}(\\boldsymbol{B})$$；\n\n(2) $k\\boldsymbol{A}$ 的第 $i$ 行第 $i$ 列元素为 $k a_{ii}$，故\n$$\\operatorname{tr}(k\\boldsymbol{A}) = \\sum_{i=1}^n k a_{ii} = k \\sum_{i=1}^n a_{ii} = k\\operatorname{tr}(\\boldsymbol{A})$$；\n\n(3) 由矩阵乘法定义，$\\boldsymbol{AB}$ 的第 $i$ 行第 $i$ 列元素为 $\\sum_{j=1}^n a_{ij}b_{ji}$，故\n$$\\operatorname{tr}(\\boldsymbol{AB}) = \\sum_{i=1}^n \\sum_{j=1}^n a_{ij}b_{ji}$$\n同理，$\\boldsymbol{BA}$ 的主对角元素之和为\n$$\\operatorname{tr}(\\boldsymbol{BA}) = \\sum_{j=1}^n \\sum_{i=1}^n b_{ji}a_{ij} = \\sum_{i=1}^n \\sum_{j=1}^n a_{ij}b_{ji}$$\n交换求和次序后两者完全相等，因此 $\\operatorname{tr}(\\boldsymbol{AB}) = \\operatorname{tr}(\\boldsymbol{BA})$。"
    }
  },
  {
    id: "LAG-TB-CH06-Q02",
    source_type: "textbook",
    source: {
      paper_id: 2006,
      raw_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      clean_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 6 章 · 习题六 第 2 题",
      page_start: 144,
      page_end: 144
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 2,
      paper_q_num: 2,
      type: "calc",
      difficulty: 2,
      score: 12
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 6,
        chapter_title: "第6章 特征值与特征向量",
        section: "6.1",
        section_title: "特征值与特征向量",
        section_slug: "6.1_特征值与特征向量",
        knowledge_points: ["特征多项式", "特征值计算", "特征向量求解"]
      }
    },
    content: {
      stem: "求下列矩阵的特征值与特征向量：\n\n(1) $\\boldsymbol{A} = \\begin{bmatrix} 3 & 4 \\\\ 5 & 2 \\end{bmatrix}$；\n\n(2) $\\boldsymbol{A} = \\begin{bmatrix} 0 & 0 & 1 \\\\ 0 & 1 & 0 \\\\ 1 & 0 & 0 \\end{bmatrix}$；\n\n(3) $\\boldsymbol{A} = \\begin{bmatrix} 1 & 2 & 3 \\\\ 2 & 1 & 3 \\\\ 3 & 3 & 6 \\end{bmatrix}$；\n\n(4) $\\boldsymbol{A} = \\begin{bmatrix} 2 & -1 & 2 \\\\ 5 & -3 & 3 \\\\ -1 & 0 & -2 \\end{bmatrix}$；\n\n(5) $\\boldsymbol{A} = \\begin{bmatrix} 1 & -3 & 3 \\\\ 3 & -5 & 3 \\\\ 6 & -6 & 4 \\end{bmatrix}$；\n\n(6) $\\boldsymbol{A} = \\begin{bmatrix} 1 & 1 & 1 & 1 \\\\ 1 & 1 & -1 & -1 \\\\ 1 & -1 & 1 & -1 \\\\ 1 & -1 & -1 & 1 \\end{bmatrix}$。",
      sub_questions: [
        { sub_id: "(1)", stem: "$\\boldsymbol{A} = \\begin{bmatrix} 3 & 4 \\\\ 5 & 2 \\end{bmatrix}$", answer: "$\\lambda_1 = 7, \\boldsymbol{p}_1 = k_1(1, 1)^{\\mathrm{T}} (k_1 \\neq 0)$；$\\lambda_2 = -2, \\boldsymbol{p}_2 = k_2(4, -5)^{\\mathrm{T}} (k_2 \\neq 0)$" },
        { sub_id: "(2)", stem: "$\\boldsymbol{A} = \\begin{bmatrix} 0 & 0 & 1 \\\\ 0 & 1 & 0 \\\\ 1 & 0 & 0 \\end{bmatrix}$", answer: "$\\lambda_1 = \\lambda_2 = 1, \\boldsymbol{p}_1 = k_1(0, 1, 0)^{\\mathrm{T}} + k_2(1, 0, 1)^{\\mathrm{T}}$（$k_1, k_2$ 不同时为零）；$\\lambda_3 = -1, \\boldsymbol{p}_2 = k_3(1, 0, -1)^{\\mathrm{T}} (k_3 \\neq 0)$" },
        { sub_id: "(3)", stem: "$\\boldsymbol{A} = \\begin{bmatrix} 1 & 2 & 3 \\\\ 2 & 1 & 3 \\\\ 3 & 3 & 6 \\end{bmatrix}$", answer: "$\\lambda_1 = -1, \\boldsymbol{p}_1 = k_1(1, -1, 0)^{\\mathrm{T}} (k_1 \\neq 0)$；$\\lambda_2 = 9, \\boldsymbol{p}_2 = k_2(1, 1, 2)^{\\mathrm{T}} (k_2 \\neq 0)$；$\\lambda_3 = 0, \\boldsymbol{p}_3 = k_3(1, 1, -1)^{\\mathrm{T}} (k_3 \\neq 0)$" },
        { sub_id: "(4)", stem: "$\\boldsymbol{A} = \\begin{bmatrix} 2 & -1 & 2 \\\\ 5 & -3 & 3 \\\\ -1 & 0 & -2 \\end{bmatrix}$", answer: "$\\lambda_1 = \\lambda_2 = \\lambda_3 = -1, \\boldsymbol{p} = k(1, 1, -1)^{\\mathrm{T}} (k \\neq 0)$" },
        { sub_id: "(5)", stem: "$\\boldsymbol{A} = \\begin{bmatrix} 1 & -3 & 3 \\\\ 3 & -5 & 3 \\\\ 6 & -6 & 4 \\end{bmatrix}$", answer: "$\\lambda_1 = \\lambda_2 = -2, \\boldsymbol{p}_1 = k_1(1, 1, 0)^{\\mathrm{T}} + k_2(-1, 0, 1)^{\\mathrm{T}}$（$k_1, k_2$ 不同时为零）；$\\lambda_3 = 4, \\boldsymbol{p}_2 = k_3(1, 1, 2)^{\\mathrm{T}} (k_3 \\neq 0)$" },
        { sub_id: "(6)", stem: "$\\boldsymbol{A} = \\begin{bmatrix} 1 & 1 & 1 & 1 \\\\ 1 & 1 & -1 & -1 \\\\ 1 & -1 & 1 & -1 \\\\ 1 & -1 & -1 & 1 \\end{bmatrix}$", answer: "$\\lambda_1 = \\lambda_2 = \\lambda_3 = 2, \\boldsymbol{p}_1 = k_1(1, 1, 0, 0)^{\\mathrm{T}} + k_2(1, 0, 1, 0)^{\\mathrm{T}} + k_3(1, 0, 0, 1)^{\\mathrm{T}}$（$k_1, k_2, k_3$ 不同时为零）；$\\lambda_4 = -2, \\boldsymbol{p}_2 = k_4(-1, 1, 1, 1)^{\\mathrm{T}} (k_4 \\neq 0)$" }
      ]
    },
    solution: {
      answer: "(1) $\\lambda_1 = 7, \\boldsymbol{p}_1 = k_1(1, 1)^{\\mathrm{T}} (k_1 \\neq 0)$；$\\lambda_2 = -2, \\boldsymbol{p}_2 = k_2(4, -5)^{\\mathrm{T}} (k_2 \\neq 0)$。\n(2) $\\lambda_1 = \\lambda_2 = 1, \\boldsymbol{p}_1 = k_1(0, 1, 0)^{\\mathrm{T}} + k_2(1, 0, 1)^{\\mathrm{T}}$（$k_1, k_2$ 不同时为零）；$\\lambda_3 = -1, \\boldsymbol{p}_2 = k_3(1, 0, -1)^{\\mathrm{T}} (k_3 \\neq 0)$。\n(3) $\\lambda_1 = -1, \\boldsymbol{p}_1 = k_1(1, -1, 0)^{\\mathrm{T}} (k_1 \\neq 0)$；$\\lambda_2 = 9, \\boldsymbol{p}_2 = k_2(1, 1, 2)^{\\mathrm{T}} (k_2 \\neq 0)$；$\\lambda_3 = 0, \\boldsymbol{p}_3 = k_3(1, 1, -1)^{\\mathrm{T}} (k_3 \\neq 0)$。\n(4) $\\lambda_1 = \\lambda_2 = \\lambda_3 = -1, \\boldsymbol{p} = k(1, 1, -1)^{\\mathrm{T}} (k \\neq 0)$。\n(5) $\\lambda_1 = \\lambda_2 = -2, \\boldsymbol{p}_1 = k_1(1, 1, 0)^{\\mathrm{T}} + k_2(-1, 0, 1)^{\\mathrm{T}}$（$k_1, k_2$ 不同时为零）；$\\lambda_3 = 4, \\boldsymbol{p}_2 = k_3(1, 1, 2)^{\\mathrm{T}} (k_3 \\neq 0)$。\n(6) $\\lambda_1 = \\lambda_2 = \\lambda_3 = 2, \\boldsymbol{p}_1 = k_1(1, 1, 0, 0)^{\\mathrm{T}} + k_2(1, 0, 1, 0)^{\\mathrm{T}} + k_3(1, 0, 0, 1)^{\\mathrm{T}}$（$k_1, k_2, k_3$ 不同时为零）；$\\lambda_4 = -2, \\boldsymbol{p}_2 = k_4(-1, 1, 1, 1)^{\\mathrm{T}} (k_4 \\neq 0)$。",
      hints: "计算特征多项式 $|\\lambda\\boldsymbol{E} - \\boldsymbol{A}| = 0$ 求得特征值，再分别求出对应齐次线性方程组 $(\\lambda\\boldsymbol{E} - \\boldsymbol{A})\\boldsymbol{x} = \\boldsymbol{0}$ 的基础解系，写出全部非零特征向量。",
      steps: "各小题求解过程如下：\n(1) 由 $|\\lambda\\boldsymbol{E}-\\boldsymbol{A}| = (\\lambda-3)(\\lambda-2)-20 = \\lambda^2 - 5\\lambda - 14 = (\\lambda-7)(\\lambda+2) = 0$ 得特征值 $\\lambda_1=7, \\lambda_2=-2$。对 $\\lambda_1=7$，解 $(7\\boldsymbol{E}-\\boldsymbol{A})\\boldsymbol{x}=\\boldsymbol{0}$ 得基础解系 $(1, 1)^{\\mathrm{T}}$；对 $\\lambda_2=-2$，解 $(-2\\boldsymbol{E}-\\boldsymbol{A})\\boldsymbol{x}=\\boldsymbol{0}$ 得基础解系 $(4, -5)^{\\mathrm{T}}$；\n(2) 特征多项式 $|\\lambda\\boldsymbol{E}-\\boldsymbol{A}| = (\\lambda-1)(\\lambda^2-1) = (\\lambda-1)^2(\\lambda+1) = 0$，特征值为 $\\lambda_1=\\lambda_2=1, \\lambda_3=-1$。对 $\\lambda=1$，$r(\\boldsymbol{E}-\\boldsymbol{A})=1$，基础解系为 $(0, 1, 0)^{\\mathrm{T}}, (1, 0, 1)^{\\mathrm{T}}$；对 $\\lambda=-1$，解得基础解系 $(1, 0, -1)^{\\mathrm{T}}$；\n(3) 第三行等于前两行之和，故 $|\\boldsymbol{A}|=0$，必有 $\\lambda=0$。计算得 $|\\lambda\\boldsymbol{E}-\\boldsymbol{A}| = \\lambda(\\lambda+1)(\\lambda-9) = 0$。特征值为 $-1, 9, 0$，分别求解对应齐次线性方程组即得特征向量；\n(4) 特征多项式展开为 $(\\lambda+1)^3 = 0$，三重特征值 $\\lambda=-1$。系数矩阵 $-\\boldsymbol{E}-\\boldsymbol{A}$ 的秩为 $2$，基础解系仅含一个向量 $(1, 1, -1)^{\\mathrm{T}}$；\n(5) 特征多项式为 $(\\lambda+2)^2(\\lambda-4) = 0$。对二重特征值 $\\lambda=-2$，$-2\\boldsymbol{E}-\\boldsymbol{A}$ 的秩为 $1$，基础解系为 $(1, 1, 0)^{\\mathrm{T}}, (-1, 0, 1)^{\\mathrm{T}}$；对 $\\lambda=4$ 得特征向量 $(1, 1, 2)^{\\mathrm{T}}$；\n(6) 计算特征多项式得 $|\\lambda\\boldsymbol{E}-\\boldsymbol{A}| = (\\lambda-2)^3(\\lambda+2) = 0$。对三重特征值 $\\lambda=2$，$2\\boldsymbol{E}-\\boldsymbol{A}$ 的秩为 $1$，解空间维数为 $3$；对单特征值 $\\lambda=-2$ 得特征向量 $(-1, 1, 1, 1)^{\\mathrm{T}}$。"
    }
  },
  {
    id: "LAG-TB-CH06-Q03",
    source_type: "textbook",
    source: {
      paper_id: 2006,
      raw_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      clean_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 6 章 · 习题六 第 3 题",
      page_start: 144,
      page_end: 144
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 3,
      paper_q_num: 3,
      type: "proof",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 6,
        chapter_title: "第6章 特征值与特征向量",
        section: "6.1",
        section_title: "特征值与特征向量",
        section_slug: "6.1_特征值与特征向量",
        knowledge_points: ["不同特征值的特征向量性质", "特征向量的线性无关性"]
      }
    },
    content: {
      stem: "设 $\\boldsymbol{p}_1, \\boldsymbol{p}_2$ 分别是矩阵 $\\boldsymbol{A}$ 的属于特征值 $\\lambda_1, \\lambda_2$ 的特征向量，且 $\\lambda_1 \\neq \\lambda_2$。试证：\n\n(1) $\\boldsymbol{p}_1, \\boldsymbol{p}_2$ 线性无关；\n\n(2) $\\boldsymbol{p}_1 + \\boldsymbol{p}_2$ 不可能是 $\\boldsymbol{A}$ 的特征向量。",
      sub_questions: [
        { sub_id: "(1)", stem: "$\\boldsymbol{p}_1, \\boldsymbol{p}_2$ 线性无关", answer: "证明略。" },
        { sub_id: "(2)", stem: "$\\boldsymbol{p}_1 + \\boldsymbol{p}_2$ 不可能是 $\\boldsymbol{A}$ 的特征向量", answer: "证明略。" }
      ]
    },
    solution: {
      answer: "证明略。",
      hints: "(1) 用定义法设线性组合为零向量，两边左乘 $\\boldsymbol{A}$ 消去一个系数；(2) 用反证法，假设 $\\boldsymbol{p}_1 + \\boldsymbol{p}_2$ 为特征向量并由无关性导出 $\\lambda_1 = \\lambda_2$ 的矛盾。",
      steps: "(1) 设 $k_1\\boldsymbol{p}_1 + k_2\\boldsymbol{p}_2 = \\boldsymbol{0}$ ①。\n两边左乘 $\\boldsymbol{A}$，得 $k_1\\lambda_1\\boldsymbol{p}_1 + k_2\\lambda_2\\boldsymbol{p}_2 = \\boldsymbol{0}$ ②。\n由 ② 减去 $\\lambda_1 \\times$ ①，得\n$$k_2(\\lambda_2 - \\lambda_1)\\boldsymbol{p}_2 = \\boldsymbol{0}$$\n因为 $\\lambda_1 \\neq \\lambda_2$ 且特征向量 $\\boldsymbol{p}_2 \\neq \\boldsymbol{0}$，故必有 $k_2 = 0$。代入 ① 得 $k_1\\boldsymbol{p}_1 = \\boldsymbol{0}$，又 $\\boldsymbol{p}_1 \\neq \\boldsymbol{0}$，故 $k_1 = 0$。\n因此 $\\boldsymbol{p}_1, \\boldsymbol{p}_2$ 线性无关。\n\n(2) 反证法：假设 $\\boldsymbol{p}_1 + \\boldsymbol{p}_2$ 是 $\\boldsymbol{A}$ 的特征向量，则存在常数 $\\lambda$，使得\n$$\\boldsymbol{A}(\\boldsymbol{p}_1 + \\boldsymbol{p}_2) = \\lambda(\\boldsymbol{p}_1 + \\boldsymbol{p}_2)$$\n又由特征向量定义，$\\boldsymbol{A}(\\boldsymbol{p}_1 + \\boldsymbol{p}_2) = \\boldsymbol{A}\\boldsymbol{p}_1 + \\boldsymbol{A}\\boldsymbol{p}_2 = \\lambda_1\\boldsymbol{p}_1 + \\lambda_2\\boldsymbol{p}_2$。\n两式相减得：\n$$(\\lambda - \\lambda_1)\\boldsymbol{p}_1 + (\\lambda - \\lambda_2)\\boldsymbol{p}_2 = \\boldsymbol{0}$$\n由 (1) 知 $\\boldsymbol{p}_1, \\boldsymbol{p}_2$ 线性无关，所以其组合系数必全为零，即\n$$\\lambda - \\lambda_1 = 0 \\quad \\text{且} \\quad \\lambda - \\lambda_2 = 0$$\n由此可得 $\\lambda = \\lambda_1 = \\lambda_2$，这与已知条件 $\\lambda_1 \\neq \\lambda_2$ 矛盾。\n故 $\\boldsymbol{p}_1 + \\boldsymbol{p}_2$ 不可能是 $\\boldsymbol{A}$ 的特征向量。"
    }
  },
  {
    id: "LAG-TB-CH06-Q04",
    source_type: "textbook",
    source: {
      paper_id: 2006,
      raw_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      clean_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 6 章 · 习题六 第 4 题",
      page_start: 144,
      page_end: 144
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
        chapter: 6,
        chapter_title: "第6章 特征值与特征向量",
        section: "6.1",
        section_title: "特征值与特征向量",
        section_slug: "6.1_特征值与特征向量",
        knowledge_points: ["数量矩阵", "特征向量定义与性质"]
      }
    },
    content: {
      stem: "设 $\\boldsymbol{A}$ 为 $n$ 阶矩阵，如果任意 $n$ 维非零向量都是 $\\boldsymbol{A}$ 的特征向量，求证 $\\boldsymbol{A}$ 为数量矩阵，即存在数 $\\lambda$，使得 $\\boldsymbol{A} = \\lambda\\boldsymbol{E}$。"
    },
    solution: {
      answer: "证明略。",
      hints: "选取标准基向量 $\\boldsymbol{e}_i$ 和非零向量 $\\boldsymbol{e}_i + \\boldsymbol{e}_j$，证明所有基向量对应的特征值必须完全相同。",
      steps: "设 $\\mathbb{R}^n$ 的标准基向量为 $\\boldsymbol{e}_1, \\boldsymbol{e}_2, \\cdots, \\boldsymbol{e}_n$。\n由题设，任意非零向量都是 $\\boldsymbol{A}$ 的特征向量，故对于每个基向量 $\\boldsymbol{e}_i$（$i=1, 2, \\cdots, n$），存在数 $\\lambda_i$，使得\n$$\\boldsymbol{A}\\boldsymbol{e}_i = \\lambda_i\\boldsymbol{e}_i$$\n对于任意 $i \\neq j$（$1 \\le i, j \\le n$），向量 $\\boldsymbol{e}_i + \\boldsymbol{e}_j \\neq \\boldsymbol{0}$ 也是 $\\boldsymbol{A}$ 的特征向量，设其特征值为 $\\mu$，则\n$$\\boldsymbol{A}(\\boldsymbol{e}_i + \\boldsymbol{e}_j) = \\mu(\\boldsymbol{e}_i + \\boldsymbol{e}_j)$$\n另一方面，\n$$\\boldsymbol{A}(\\boldsymbol{e}_i + \\boldsymbol{e}_j) = \\boldsymbol{A}\\boldsymbol{e}_i + \\boldsymbol{A}\\boldsymbol{e}_j = \\lambda_i\\boldsymbol{e}_i + \\lambda_j\\boldsymbol{e}_j$$\n两式相减得：\n$$(\\lambda_i - \\mu)\\boldsymbol{e}_i + (\\lambda_j - \\mu)\\boldsymbol{e}_j = \\boldsymbol{0}$$\n由于 $\\boldsymbol{e}_i, \\boldsymbol{e}_j$ 线性无关，必有 $\\lambda_i - \\mu = 0$ 且 $\\lambda_j - \\mu = 0$，即 $\\lambda_i = \\lambda_j = \\mu$。\n这说明所有基向量 $\\boldsymbol{e}_i$ 对应的特征值全相等，记为 $\\lambda$。\n于是对于任意 $i=1, 2, \\cdots, n$，都有 $\\boldsymbol{A}\\boldsymbol{e}_i = \\lambda\\boldsymbol{e}_i$。\n根据矩阵的列分块表示：\n$$\\boldsymbol{A} = \\boldsymbol{AE} = \\boldsymbol{A}[\\boldsymbol{e}_1, \\boldsymbol{e}_2, \\cdots, \\boldsymbol{e}_n] = [\\boldsymbol{A}\\boldsymbol{e}_1, \\boldsymbol{A}\\boldsymbol{e}_2, \\cdots, \\boldsymbol{A}\\boldsymbol{e}_n] = [\\lambda\\boldsymbol{e}_1, \\lambda\\boldsymbol{e}_2, \\cdots, \\lambda\\boldsymbol{e}_n] = \\lambda\\boldsymbol{E}$$\n因此 $\\boldsymbol{A}$ 为数量矩阵。"
    }
  },
  {
    id: "LAG-TB-CH06-Q05",
    source_type: "textbook",
    source: {
      paper_id: 2006,
      raw_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      clean_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 6 章 · 习题六 第 5 题",
      page_start: 144,
      page_end: 144
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 5,
      paper_q_num: 5,
      type: "calc",
      difficulty: 1,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 6,
        chapter_title: "第6章 特征值与特征向量",
        section: "6.1",
        section_title: "特征值与特征向量",
        section_slug: "6.1_特征值与特征向量",
        knowledge_points: ["矩阵多项式的特征值", "行列式与特征值的关系"]
      }
    },
    content: {
      stem: "已知三阶矩阵 $\\boldsymbol{A}$ 的特征值为 $\\lambda_1 = 1, \\lambda_2 = 0, \\lambda_3 = -2$。求以下行列式的值：\n\n$|\\boldsymbol{A} - \\boldsymbol{E}|$，$|\\boldsymbol{A} + 2\\boldsymbol{E}|$，$|\\boldsymbol{A}^2 + 3\\boldsymbol{A} + 2\\boldsymbol{E}|$，$|\\boldsymbol{A}^2 + 3\\boldsymbol{A} + 4\\boldsymbol{E}|$。"
    },
    solution: {
      answer: "$0, 0, 0, 64$。",
      hints: "利用矩阵多项式性质：若 $\\lambda$ 为 $\\boldsymbol{A}$ 的特征值，则 $f(\\lambda)$ 为 $f(\\boldsymbol{A})$ 的特征值，且矩阵行列式等于其全体特征值的乘积。",
      steps: "三阶方阵 $\\boldsymbol{A}$ 的特征值为 $\\lambda_1 = 1, \\lambda_2 = 0, \\lambda_3 = -2$。\n\n(1) 矩阵 $\\boldsymbol{A}-\\boldsymbol{E}$ 的特征值为 $\\lambda_i - 1$，即 $0, -1, -3$。行列式为其特征值的乘积：\n$$|\\boldsymbol{A}-\\boldsymbol{E}| = 0 \\times (-1) \\times (-3) = 0$$；\n\n(2) 矩阵 $\\boldsymbol{A}+2\\boldsymbol{E}$ 的特征值为 $\\lambda_i + 2$，即 $3, 2, 0$。其行列式为：\n$$|\\boldsymbol{A}+2\\boldsymbol{E}| = 3 \\times 2 \\times 0 = 0$$；\n\n(3) 令 $g(x) = x^2 + 3x + 2 = (x+1)(x+2)$，则矩阵 $\\boldsymbol{A}^2+3\\boldsymbol{A}+2\\boldsymbol{E}$ 的特征值为 $g(1)=6, g(0)=2, g(-2)=0$。其行列式为：\n$$|\\boldsymbol{A}^2+3\\boldsymbol{A}+2\\boldsymbol{E}| = 6 \\times 2 \\times 0 = 0$$；\n\n(4) 令 $h(x) = x^2 + 3x + 4$，则矩阵 $\\boldsymbol{A}^2+3\\boldsymbol{A}+4\\boldsymbol{E}$ 的特征值为：\n$$h(1) = 1 + 3 + 4 = 8, \\quad h(0) = 4, \\quad h(-2) = 4 - 6 + 4 = 2$$\n其行列式为特征值的乘积：\n$$|\\boldsymbol{A}^2+3\\boldsymbol{A}+4\\boldsymbol{E}| = 8 \\times 4 \\times 2 = 64$$。"
    }
  },
  {
    id: "LAG-TB-CH06-Q06",
    source_type: "textbook",
    source: {
      paper_id: 2006,
      raw_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      clean_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 6 章 · 习题六 第 6 题",
      page_start: 144,
      page_end: 144
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
        chapter: 6,
        chapter_title: "第6章 特征值与特征向量",
        section: "6.1",
        section_title: "特征值与特征向量",
        section_slug: "6.1_特征值与特征向量",
        knowledge_points: ["特征方程", "特征值判定", "矩阵多项式的行列式"]
      }
    },
    content: {
      stem: "设 $\\boldsymbol{A}$ 是三阶方阵。如果已知 $|\\boldsymbol{A} + \\boldsymbol{E}| = 0$，$|2\\boldsymbol{E} + \\boldsymbol{A}| = 0$，$|\\boldsymbol{E} - \\boldsymbol{A}| = 0$，求行列式 $|\\boldsymbol{A}^2 + 4\\boldsymbol{A} + \\boldsymbol{E}|$ 的值。"
    },
    solution: {
      answer: "$36$。",
      hints: "根据特征方程 $|\\lambda\\boldsymbol{E}-\\boldsymbol{A}|=0$，由已知条件确定 $\\boldsymbol{A}$ 的三个特征值，再求矩阵多项式的特征值乘积。",
      steps: "因为 $\\boldsymbol{A}$ 为三阶方阵：\n(1) 由 $|\\boldsymbol{E}-\\boldsymbol{A}|=0$ 可知 $\\lambda_1 = 1$ 是 $\\boldsymbol{A}$ 的特征值；\n(2) 由 $|\\boldsymbol{A}+\\boldsymbol{E}| = (-1)^3 |-\\boldsymbol{E}-\\boldsymbol{A}| = 0$ 得 $|-\\boldsymbol{E}-\\boldsymbol{A}|=0$，可知 $\\lambda_2 = -1$ 是 $\\boldsymbol{A}$ 的特征值；\n(3) 由 $|2\\boldsymbol{E}+\\boldsymbol{A}| = (-1)^3 |-2\\boldsymbol{E}-\\boldsymbol{A}| = 0$ 得 $|-2\\boldsymbol{E}-\\boldsymbol{A}|=0$，可知 $\\lambda_3 = -2$ 是 $\\boldsymbol{A}$ 的特征值。\n所以 $\\boldsymbol{A}$ 的三个特征值恰为 $1, -1, -2$。\n设 $f(\\lambda) = \\lambda^2 + 4\\lambda + 1$，则矩阵 $\\boldsymbol{A}^2+4\\boldsymbol{A}+\\boldsymbol{E}$ 的特征值分别为：\n$$f(1) = 1^2 + 4(1) + 1 = 6$$\n$$f(-1) = (-1)^2 + 4(-1) + 1 = -2$$\n$$f(-2) = (-2)^2 + 4(-2) + 1 = -3$$\n因此，行列式的值等于各特征值的乘积：\n$$|\\boldsymbol{A}^2+4\\boldsymbol{A}+\\boldsymbol{E}| = 6 \\times (-2) \\times (-3) = 36$$。"
    }
  },
  {
    id: "LAG-TB-CH06-Q07",
    source_type: "textbook",
    source: {
      paper_id: 2006,
      raw_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      clean_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 6 章 · 习题六 第 7 题",
      page_start: 144,
      page_end: 144
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 7,
      paper_q_num: 7,
      type: "calc",
      difficulty: 1,
      score: 5
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 6,
        chapter_title: "第6章 特征值与特征向量",
        section: "6.1",
        section_title: "特征值与特征向量",
        section_slug: "6.1_特征值与特征向量",
        knowledge_points: ["幂等矩阵", "特征值的性质"]
      }
    },
    content: {
      stem: "设 $n$ 阶矩阵 $\\boldsymbol{A}$ 满足 $\\boldsymbol{A}^2 = \\boldsymbol{A}$，求 $\\boldsymbol{A}$ 的所有可能的特征值。"
    },
    solution: {
      answer: "$0, 1$。",
      hints: "设 $\\lambda$ 为特征值，$\\boldsymbol{x}$ 为对应的非零特征向量，两边作用于 $\\boldsymbol{x}$ 并利用 $\\boldsymbol{A}^2 = \\boldsymbol{A}$ 建立关于 $\\lambda$ 的方程。",
      steps: "设 $\\lambda$ 是 $\\boldsymbol{A}$ 的任一特征值，对应的特征向量为 $\\boldsymbol{x} \\neq \\boldsymbol{0}$，则\n$$\\boldsymbol{A}\\boldsymbol{x} = \\lambda\\boldsymbol{x}$$\n两边左乘 $\\boldsymbol{A}$，得\n$$\\boldsymbol{A}^2\\boldsymbol{x} = \\lambda\\boldsymbol{A}\\boldsymbol{x} = \\lambda^2\\boldsymbol{x}$$\n又已知 $\\boldsymbol{A}^2 = \\boldsymbol{A}$，所以\n$$\\boldsymbol{A}^2\\boldsymbol{x} = \\boldsymbol{A}\\boldsymbol{x} = \\lambda\\boldsymbol{x}$$\n从而\n$$\\lambda^2\\boldsymbol{x} = \\lambda\\boldsymbol{x} \\implies (\\lambda^2 - \\lambda)\\boldsymbol{x} = \\boldsymbol{0}$$\n由于 $\\boldsymbol{x} \\neq \\boldsymbol{0}$，必有 $\\lambda^2 - \\lambda = 0$，解得\n$$\\lambda = 0 \\quad \\text{或} \\quad \\lambda = 1$$\n因此 $\\boldsymbol{A}$ 的所有可能的特征值为 $0$ 和 $1$。"
    }
  },
  {
    id: "LAG-TB-CH06-Q08",
    source_type: "textbook",
    source: {
      paper_id: 2006,
      raw_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      clean_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 6 章 · 习题六 第 8 题",
      page_start: 144,
      page_end: 144
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 8,
      paper_q_num: 8,
      type: "calc",
      difficulty: 1,
      score: 5
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 6,
        chapter_title: "第6章 特征值与特征向量",
        section: "6.1",
        section_title: "特征值与特征向量",
        section_slug: "6.1_特征值与特征向量",
        knowledge_points: ["逆矩阵的特征值"]
      }
    },
    content: {
      stem: "已知 $n$ 阶可逆矩阵 $\\boldsymbol{A}$ 的全体特征值为 $\\lambda_1, \\lambda_2, \\cdots, \\lambda_n$，求 $\\boldsymbol{A}^{-1}$ 的全体特征值。"
    },
    solution: {
      answer: "$\\frac{1}{\\lambda_1}, \\frac{1}{\\lambda_2}, \\cdots, \\frac{1}{\\lambda_n}$。",
      hints: "由可逆性知 $\\lambda_i \\neq 0$，由 $\\boldsymbol{Ax} = \\lambda\\boldsymbol{x}$ 两边左乘 $\\boldsymbol{A}^{-1}$ 推导。",
      steps: "因为 $\\boldsymbol{A}$ 为可逆矩阵，其行列式 $|\\boldsymbol{A}| = \\prod_{i=1}^n \\lambda_i \\neq 0$，故所有特征值 $\\lambda_i \\neq 0$（$i=1, 2, \\cdots, n$）。\n设 $\\boldsymbol{x}_i \\neq \\boldsymbol{0}$ 是属于特征值 $\\lambda_i$ 的特征向量，则\n$$\\boldsymbol{A}\\boldsymbol{x}_i = \\lambda_i\\boldsymbol{x}_i$$\n两边同时左乘 $\\boldsymbol{A}^{-1}$，得\n$$\\boldsymbol{x}_i = \\lambda_i\\boldsymbol{A}^{-1}\\boldsymbol{x}_i$$\n因为 $\\lambda_i \\neq 0$，两边同除以 $\\lambda_i$，得\n$$\\boldsymbol{A}^{-1}\\boldsymbol{x}_i = \\frac{1}{\\lambda_i}\\boldsymbol{x}_i$$\n由于 $\\boldsymbol{x}_i \\neq \\boldsymbol{0}$，根据特征值定义，$\\frac{1}{\\lambda_i}$ 是 $\\boldsymbol{A}^{-1}$ 的特征值。\n因此，$\\boldsymbol{A}^{-1}$ 的全体特征值为 $\\frac{1}{\\lambda_1}, \\frac{1}{\\lambda_2}, \\cdots, \\frac{1}{\\lambda_n}$。"
    }
  },
  {
    id: "LAG-TB-CH06-Q09",
    source_type: "textbook",
    source: {
      paper_id: 2006,
      raw_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      clean_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 6 章 · 习题六 第 9 题",
      page_start: 145,
      page_end: 145
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
        chapter: 6,
        chapter_title: "第6章 特征值与特征向量",
        section: "6.1",
        section_title: "特征值与特征向量",
        section_slug: "6.1_特征值与特征向量",
        knowledge_points: ["全 1 矩阵", "矩阵的秩与特征值", "特征向量求解"]
      }
    },
    content: {
      stem: "如果 $n$ 阶矩阵 $\\boldsymbol{A}$ 中的所有元素都是 $1$，求 $\\boldsymbol{A}$ 的所有特征值，并求 $\\boldsymbol{A}$ 的属于特征值 $\\lambda = n$ 的特征向量。"
    },
    solution: {
      answer: "$\\boldsymbol{A}$ 的特征值为 $0$（$n-1$ 重）和 $n$（单重）；$\\boldsymbol{A}$ 的属于特征值 $\\lambda = n$ 的特征向量为 $\\boldsymbol{p} = k(1, 1, \\cdots, 1)^{\\mathrm{T}} (k \\neq 0)$。",
      hints: "方阵所有行相同故 $r(\\boldsymbol{A})=1$，利用零空间维数确定特征值 $0$ 的重数，再利用迹确定非零特征值。",
      steps: "矩阵 $\\boldsymbol{A} = \\begin{bmatrix} 1 & 1 & \\cdots & 1 \\\\ 1 & 1 & \\cdots & 1 \\\\ \\vdots & \\vdots & & \\vdots \\\\ 1 & 1 & \\cdots & 1 \\end{bmatrix}$ 的各行完全相同，故 $r(\\boldsymbol{A}) = 1$。\n由齐次线性方程组解空间维数定理，方程组 $\\boldsymbol{Ax} = \\boldsymbol{0}$ 的基础解系含有 $n - r(\\boldsymbol{A}) = n - 1$ 个线性无关解向量，因此 $\\lambda = 0$ 是 $\\boldsymbol{A}$ 的至少 $n-1$ 重特征值。\n又方阵全体特征值之和等于其主对角元素之和（迹）：\n$$\\sum_{i=1}^n \\lambda_i = \\operatorname{tr}(\\boldsymbol{A}) = n \\times 1 = n$$\n故剩余的一个特征值为 $\\lambda = n - 0 = n$。\n所以 $\\boldsymbol{A}$ 的所有特征值为 $0$（$n-1$ 重）与 $n$（单重）。\n\n对于特征值 $\\lambda = n$，解齐次线性方程组 $(n\\boldsymbol{E} - \\boldsymbol{A})\\boldsymbol{x} = \\boldsymbol{0}$：\n方程组各行相加即为 $n x_i - \\sum_{j=1}^n x_j = 0$ ($i=1, \\cdots, n$)，解得 $x_1 = x_2 = \\cdots = x_n$。\n取基础解系为 $(1, 1, \\cdots, 1)^{\\mathrm{T}}$。\n因此属于特征值 $\\lambda = n$ 的特征向量为 $\\boldsymbol{p} = k(1, 1, \\cdots, 1)^{\\mathrm{T}} (k \\neq 0)$。"
    }
  },
  {
    id: "LAG-TB-CH06-Q10",
    source_type: "textbook",
    source: {
      paper_id: 2006,
      raw_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      clean_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 6 章 · 习题六 第 10 题",
      page_start: 145,
      page_end: 145
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 10,
      paper_q_num: 10,
      type: "calc",
      difficulty: 1,
      score: 5
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 6,
        chapter_title: "第6章 特征值与特征向量",
        section: "6.1",
        section_title: "特征值与特征向量",
        section_slug: "6.1_特征值与特征向量",
        knowledge_points: ["矩阵多项式方程", "零矩阵多项式", "特征值求法"]
      }
    },
    content: {
      stem: "设 $n$ 阶矩阵 $\\boldsymbol{A}$ 满足 $\\boldsymbol{A}^2 + 4\\boldsymbol{A} + 4\\boldsymbol{E} = \\boldsymbol{O}$（$\\boldsymbol{O}$ 为零矩阵），求 $\\boldsymbol{A}$ 的所有特征值。"
    },
    solution: {
      answer: "$\\boldsymbol{A}$ 的所有特征值均为 $-2$。",
      hints: "设 $\\lambda$ 为特征值，由矩阵方程对应特征值方程求解。",
      steps: "设 $\\lambda$ 为 $\\boldsymbol{A}$ 的任一特征值，对应的特征向量为 $\\boldsymbol{x} \\neq \\boldsymbol{0}$，则 $\\boldsymbol{Ax} = \\lambda\\boldsymbol{x}$，$\\boldsymbol{A}^2\\boldsymbol{x} = \\lambda^2\\boldsymbol{x}$。\n将方程作用于 $\\boldsymbol{x}$：\n$$(\\boldsymbol{A}^2 + 4\\boldsymbol{A} + 4\\boldsymbol{E})\\boldsymbol{x} = \\boldsymbol{O}\\boldsymbol{x} = \\boldsymbol{0}$$\n左边化简得：\n$$(\\lambda^2 + 4\\lambda + 4)\\boldsymbol{x} = \\boldsymbol{0} \\implies (\\lambda + 2)^2\\boldsymbol{x} = \\boldsymbol{0}$$\n因为特征向量 $\\boldsymbol{x} \\neq \\boldsymbol{0}$，所以必有\n$$(\\lambda + 2)^2 = 0 \\implies \\lambda = -2$$\n因此 $\\boldsymbol{A}$ 的所有特征值均为 $-2$。"
    }
  },
  {
    id: "LAG-TB-CH06-Q11",
    source_type: "textbook",
    source: {
      paper_id: 2006,
      raw_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      clean_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 6 章 · 习题六 第 11 题",
      page_start: 145,
      page_end: 145
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
        chapter: 6,
        chapter_title: "第6章 特征值与特征向量",
        section: "6.1",
        section_title: "特征值与特征向量",
        section_slug: "6.1_特征值与特征向量",
        knowledge_points: ["逆矩阵特征向量", "特征向量方程求解"]
      }
    },
    content: {
      stem: "求 $k$ 的值，使得 $\\boldsymbol{\\alpha} = \\begin{bmatrix} 1 \\\\ k \\\\ 1 \\end{bmatrix}$ 是 $\\boldsymbol{A} = \\begin{bmatrix} 2 & 1 & 1 \\\\ 1 & 2 & 1 \\\\ 1 & 1 & 2 \\end{bmatrix}$ 的逆矩阵的特征向量。"
    },
    solution: {
      answer: "$k=1$（对应 $\\boldsymbol{A}$ 的特征值 $\\lambda=4$，$\\boldsymbol{A}^{-1}$ 特征值 $\\frac{1}{4}$）或 $k=-2$（对应 $\\boldsymbol{A}$ 的特征值 $\\lambda=1$，$\\boldsymbol{A}^{-1}$ 特征值 $1$）。",
      hints: "可逆矩阵 $\\boldsymbol{A}^{-1}$ 与 $\\boldsymbol{A}$ 拥有相同的特征向量，故只需验证 $\\boldsymbol{\\alpha}$ 为 $\\boldsymbol{A}$ 的特征向量，即存在常数 $\\lambda$ 满足 $\\boldsymbol{A}\\boldsymbol{\\alpha} = \\lambda\\boldsymbol{\\alpha}$。",
      steps: "因为矩阵 $\\boldsymbol{A}$ 可逆，$\\boldsymbol{\\alpha}$ 是 $\\boldsymbol{A}^{-1}$ 的特征向量当且仅当 $\\boldsymbol{\\alpha}$ 是 $\\boldsymbol{A}$ 的特征向量。\n计算 $\\boldsymbol{A}\\boldsymbol{\\alpha}$：\n$$\\boldsymbol{A}\\boldsymbol{\\alpha} = \\begin{bmatrix} 2 & 1 & 1 \\\\ 1 & 2 & 1 \\\\ 1 & 1 & 2 \\end{bmatrix} \\begin{bmatrix} 1 \\\\ k \\\\ 1 \\end{bmatrix} = \\begin{bmatrix} 3 + k \\\\ 2 + 2k \\\\ 3 + k \\end{bmatrix}$$\n设 $\\boldsymbol{A}\\boldsymbol{\\alpha} = \\lambda\\boldsymbol{\\alpha}$，则：\n$$\\begin{cases} 3 + k = \\lambda \\\\ 2 + 2k = \\lambda k \\\\ 3 + k = \\lambda \\end{cases}$$\n将 $\\lambda = 3 + k$ 代入第二式：\n$$2 + 2k = (3 + k)k = 3k + k^2 \\implies k^2 + k - 2 = 0$$\n因式分解得 $(k - 1)(k + 2) = 0$，解得：\n$$k = 1 \\quad \\text{或} \\quad k = -2$$\n- 当 $k = 1$ 时，$\\lambda = 4$，此时 $\\boldsymbol{\\alpha} = (1, 1, 1)^{\\mathrm{T}}$ 是 $\\boldsymbol{A}$ 属于特征值 $4$ 的特征向量，也是 $\\boldsymbol{A}^{-1}$ 属于特征值 $\\frac{1}{4}$ 的特征向量；\n- 当 $k = -2$ 时，$\\lambda = 1$，此时 $\\boldsymbol{\\alpha} = (1, -2, 1)^{\\mathrm{T}}$ 是 $\\boldsymbol{A}$ 属于特征值 $1$ 的特征向量，也是 $\\boldsymbol{A}^{-1}$ 属于特征值 $1$ 的特征向量。\n\n综上，$k=1$ 或 $k=-2$。"
    }
  },
  {
    id: "LAG-TB-CH06-Q12",
    source_type: "textbook",
    source: {
      paper_id: 2006,
      raw_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      clean_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 6 章 · 习题六 第 12 题",
      page_start: 145,
      page_end: 145
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
        chapter: 6,
        chapter_title: "第6章 特征值与特征向量",
        section: "6.1",
        section_title: "特征值与特征向量",
        section_slug: "6.1_特征值与特征向量",
        knowledge_points: ["特征向量定义", "待定系数法求参数与特征值"]
      }
    },
    content: {
      stem: "求出 $a$ 和 $b$ 的值，使得 $\\boldsymbol{p} = \\begin{bmatrix} 1 \\\\ -2 \\\\ 3 \\end{bmatrix}$ 是 $\\boldsymbol{A} = \\begin{bmatrix} 3 & 2 & -1 \\\\ a & -2 & 2 \\\\ 3 & b & -1 \\end{bmatrix}$ 的特征向量，并求出对应的特征值。"
    },
    solution: {
      answer: "$a = -2, b = 6$，对应的特征值为 $\\lambda = -4$。",
      hints: "由特征向量定义 $\\boldsymbol{Ap} = \\lambda\\boldsymbol{p}$，展开后逐分量对比建立方程组求解。",
      steps: "根据特征向量定义，存在常数 $\\lambda$ 使得 $\\boldsymbol{A}\\boldsymbol{p} = \\lambda\\boldsymbol{p}$。\n计算 $\\boldsymbol{A}\\boldsymbol{p}$：\n$$\\boldsymbol{A}\\boldsymbol{p} = \\begin{bmatrix} 3 & 2 & -1 \\\\ a & -2 & 2 \\\\ 3 & b & -1 \\end{bmatrix} \\begin{bmatrix} 1 \\\\ -2 \\\\ 3 \\end{bmatrix} = \\begin{bmatrix} 3(1) + 2(-2) - 1(3) \\\\ a(1) - 2(-2) + 2(3) \\\\ 3(1) + b(-2) - 1(3) \\end{bmatrix} = \\begin{bmatrix} -4 \\\\ a + 10 \\\\ -2b \\end{bmatrix}$$\n与 $\\lambda\\boldsymbol{p} = \\begin{bmatrix} \\lambda \\\\ -2\\lambda \\\\ 3\\lambda \\end{bmatrix}$ 比较各分量：\n$$\\begin{cases} \\lambda = -4 \\\\ a + 10 = -2\\lambda \\\\ -2b = 3\\lambda \\end{cases}$$\n由第一式直接得特征值 $\\lambda = -4$；\n代入第二式：$a + 10 = -2(-4) = 8 \\implies a = -2$；\n代入第三式：$-2b = 3(-4) = -12 \\implies b = 6$。\n因此，$a = -2, b = 6$，对应的特征值为 $\\lambda = -4$。"
    }
  },
  {
    id: "LAG-TB-CH06-Q13",
    source_type: "textbook",
    source: {
      paper_id: 2006,
      raw_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      clean_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 6 章 · 习题六 第 13 题",
      page_start: 145,
      page_end: 145
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 13,
      paper_q_num: 13,
      type: "calc",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 6,
        chapter_title: "第6章 特征值与特征向量",
        section: "6.1",
        section_title: "特征值与特征向量",
        section_slug: "6.1_特征值与特征向量",
        knowledge_points: ["特征值计算", "特征多项式", "迹与特征值之和"]
      }
    },
    content: {
      stem: "已知 $12$ 是 $\\boldsymbol{A} = \\begin{bmatrix} 7 & 4 & -1 \\\\ 4 & 7 & -1 \\\\ -4 & a & 4 \\end{bmatrix}$ 的一个特征值，求 $a$ 及 $\\boldsymbol{A}$ 的另外两个特征值。"
    },
    solution: {
      answer: "$a = -4$，另外两个特征值为 $\\lambda_1 = \\lambda_2 = 3$。",
      hints: "将特征值 $\\lambda = 12$ 代入特征方程 $|12\\boldsymbol{E}-\\boldsymbol{A}|=0$ 求得 $a$，再利用迹的性质或特征多项式分解求其余特征值。",
      steps: "因为 $12$ 是 $\\boldsymbol{A}$ 的特征值，所以 $|12\\boldsymbol{E} - \\boldsymbol{A}| = 0$。\n计算行列式：\n$$|12\\boldsymbol{E} - \\boldsymbol{A}| = \\begin{vmatrix} 12 - 7 & -4 & 1 \\\\ -4 & 12 - 7 & 1 \\\\ 4 & -a & 12 - 4 \\end{vmatrix} = \\begin{vmatrix} 5 & -4 & 1 \\\\ -4 & 5 & 1 \\\\ 4 & -a & 8 \\end{vmatrix}$$\n第二行减去第一行：\n$$\\begin{vmatrix} 5 & -4 & 1 \\\\ -9 & 9 & 0 \\\\ 4 & -a & 8 \\end{vmatrix} = 9 \\begin{vmatrix} 5 & -4 & 1 \\\\ -1 & 1 & 0 \\\\ 4 & -a & 8 \\end{vmatrix}$$\n按第三列展开：\n$$9 \\left[ 1 \\times (a - 4) + 8 \\times (5 - 4) \\right] = 9(a - 4 + 8) = 9(a + 4) = 0$$\n解得 $a = -4$。\n当 $a = -4$ 时，$\\boldsymbol{A}$ 的主对角元素之和为：\n$$\\operatorname{tr}(\\boldsymbol{A}) = 7 + 7 + 4 = 18$$\n设另外两个特征值为 $\\lambda_1, \\lambda_2$，由方阵的迹等于全体特征值之和得：\n$$12 + \\lambda_1 + \\lambda_2 = 18 \\implies \\lambda_1 + \\lambda_2 = 6$$\n计算特征多项式：\n$$|\\lambda\\boldsymbol{E}-\\boldsymbol{A}| = (\\lambda - 12)(\\lambda - 3)^2 = 0$$\n解得另外两个特征值为 $\\lambda_1 = \\lambda_2 = 3$。\n综上所述，$a = -4$，另外两个特征值为 $\\lambda_1 = \\lambda_2 = 3$。"
    }
  },
  {
    id: "LAG-TB-CH06-Q14",
    source_type: "textbook",
    source: {
      paper_id: 2006,
      raw_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      clean_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 6 章 · 习题六 第 14 题",
      page_start: 145,
      page_end: 145
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 14,
      paper_q_num: 14,
      type: "proof",
      difficulty: 1,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 6,
        chapter_title: "第6章 特征值与特征向量",
        section: "6.1",
        section_title: "特征值与特征向量",
        section_slug: "6.1_特征值与特征向量",
        knowledge_points: ["行和相等的矩阵性质", "特征向量的几何意义"]
      }
    },
    content: {
      stem: "设 $n$ 阶方阵 $\\boldsymbol{A} = (a_{ij})$ 的每一行元素之和同为 $a$，证明 $a$ 必是 $\\boldsymbol{A}$ 的特征值，并求 $\\boldsymbol{A}$ 的属于这个特征值 $a$ 的一个特征向量 $\\boldsymbol{p}$。"
    },
    solution: {
      answer: "$\\boldsymbol{A}$ 的属于特征值 $a$ 的特征向量为 $\\boldsymbol{p} = k(1, 1, \\cdots, 1)^{\\mathrm{T}} (k \\neq 0)$。",
      hints: "取全 1 向量 $\\boldsymbol{p} = (1, 1, \\cdots, 1)^{\\mathrm{T}}$，直接验证 $\\boldsymbol{Ap} = a\\boldsymbol{p}$。",
      steps: "令列向量 $\\boldsymbol{p} = (1, 1, \\cdots, 1)^{\\mathrm{T}}$。显然 $\\boldsymbol{p} \\neq \\boldsymbol{0}$。\n由矩阵与向量乘法定义，$\\boldsymbol{A}\\boldsymbol{p}$ 的第 $i$ 个分量为：\n$$(\\boldsymbol{A}\\boldsymbol{p})_i = \\sum_{j=1}^n a_{ij} \\times 1 = \\sum_{j=1}^n a_{ij}$$\n已知方阵 $\\boldsymbol{A}$ 的每一行元素之和同为 $a$，即对所有 $i=1, 2, \\cdots, n$，都有 $\\sum_{j=1}^n a_{ij} = a$。\n因此：\n$$\\boldsymbol{A}\\boldsymbol{p} = \\begin{bmatrix} a \\\\ a \\\\ \\vdots \\\\ a \\end{bmatrix} = a \\begin{bmatrix} 1 \\\\ 1 \\\\ \\vdots \\\\ 1 \\end{bmatrix} = a\\boldsymbol{p}$$\n因为 $\\boldsymbol{p} \\neq \\boldsymbol{0}$ 且满足 $\\boldsymbol{A}\\boldsymbol{p} = a\\boldsymbol{p}$，根据特征值与特征向量的定义：\n$a$ 必是 $\\boldsymbol{A}$ 的一个特征值，且 $\\boldsymbol{p} = k(1, 1, \\cdots, 1)^{\\mathrm{T}} (k \\neq 0)$ 是属于特征值 $a$ 的特征向量。"
    }
  },
  {
    id: "LAG-TB-CH06-Q15",
    source_type: "textbook",
    source: {
      paper_id: 2006,
      raw_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      clean_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 6 章 · 习题六 第 15 题",
      page_start: 145,
      page_end: 145
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 15,
      paper_q_num: 15,
      type: "calc",
      difficulty: 2,
      score: 12
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 6,
        chapter_title: "第6章 特征值与特征向量",
        section: "6.2",
        section_title: "方阵的相似化简",
        section_slug: "6.2_方阵的相似化简",
        knowledge_points: ["相似对角化判定", "相似变换矩阵P的构造", "特征子空间维数"]
      }
    },
    content: {
      stem: "下列方阵能不能相似于对角矩阵？若能，求可逆矩阵 $\\boldsymbol{P}$，使 $\\boldsymbol{P}^{-1}\\boldsymbol{AP}$ 为对角形。\n\n(1) $\\boldsymbol{A} = \\begin{bmatrix} 5 & 4 & 2 \\\\ 4 & 5 & 2 \\\\ 2 & 2 & 2 \\end{bmatrix}$；\n\n(2) $\\boldsymbol{A} = \\begin{bmatrix} -1 & 4 & -2 \\\\ -3 & 4 & 0 \\\\ -3 & 1 & 3 \\end{bmatrix}$；\n\n(3) $\\boldsymbol{A} = \\begin{bmatrix} 0 & 0 & 0 \\\\ 0 & 0 & 0 \\\\ 3 & 0 & 1 \\end{bmatrix}$；\n\n(4) $\\boldsymbol{A} = \\begin{bmatrix} a & 1 & 0 \\\\ 0 & a & 1 \\\\ 0 & 0 & a \\end{bmatrix}$；\n\n(5) $\\boldsymbol{A} = \\begin{bmatrix} 4 & 6 & 0 \\\\ -3 & -5 & 0 \\\\ -3 & -6 & 1 \\end{bmatrix}$。",
      sub_questions: [
        { sub_id: "(1)", stem: "$\\boldsymbol{A} = \\begin{bmatrix} 5 & 4 & 2 \\\\ 4 & 5 & 2 \\\\ 2 & 2 & 2 \\end{bmatrix}$", answer: "能。$\\boldsymbol{P} = \\begin{bmatrix} 1 & 0 & 2 \\\\ 0 & 1 & 2 \\\\ -2 & -2 & 1 \\end{bmatrix}$，$\\boldsymbol{P}^{-1}\\boldsymbol{AP} = \\begin{bmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & 10 \\end{bmatrix}$。" },
        { sub_id: "(2)", stem: "$\\boldsymbol{A} = \\begin{bmatrix} -1 & 4 & -2 \\\\ -3 & 4 & 0 \\\\ -3 & 1 & 3 \\end{bmatrix}$", answer: "能。$\\boldsymbol{P} = \\begin{bmatrix} 1 & 2 & 1 \\\\ 1 & 3 & 3 \\\\ 1 & 3 & 4 \\end{bmatrix}$，$\\boldsymbol{P}^{-1}\\boldsymbol{AP} = \\begin{bmatrix} 1 & 0 & 0 \\\\ 0 & 2 & 0 \\\\ 0 & 0 & 3 \\end{bmatrix}$。" },
        { sub_id: "(3)", stem: "$\\boldsymbol{A} = \\begin{bmatrix} 0 & 0 & 0 \\\\ 0 & 0 & 0 \\\\ 3 & 0 & 1 \\end{bmatrix}$", answer: "能。$\\boldsymbol{P} = \\begin{bmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ -3 & 0 & 1 \\end{bmatrix}$，$\\boldsymbol{P}^{-1}\\boldsymbol{AP} = \\begin{bmatrix} 0 & 0 & 0 \\\\ 0 & 0 & 0 \\\\ 0 & 0 & 1 \\end{bmatrix}$。" },
        { sub_id: "(4)", stem: "$\\boldsymbol{A} = \\begin{bmatrix} a & 1 & 0 \\\\ 0 & a & 1 \\\\ 0 & 0 & a \\end{bmatrix}$", answer: "不能。因为 $r(a\\boldsymbol{E} - \\boldsymbol{A}) = 2$，对应 3 重特征值 $a$ 只能找到一个线性无关的特征向量，故 $\\boldsymbol{A}$ 不能相似于对角矩阵。" },
        { sub_id: "(5)", stem: "$\\boldsymbol{A} = \\begin{bmatrix} 4 & 6 & 0 \\\\ -3 & -5 & 0 \\\\ -3 & -6 & 1 \\end{bmatrix}$", answer: "能。$\\boldsymbol{P} = \\begin{bmatrix} -2 & 0 & -1 \\\\ 1 & 0 & 1 \\\\ 0 & 1 & 1 \\end{bmatrix}$，$\\boldsymbol{P}^{-1}\\boldsymbol{AP} = \\begin{bmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & -2 \\end{bmatrix}$。" }
      ]
    },
    solution: {
      answer: "(1) 能。$\\boldsymbol{P} = \\begin{bmatrix} 1 & 0 & 2 \\\\ 0 & 1 & 2 \\\\ -2 & -2 & 1 \\end{bmatrix}$，$\\boldsymbol{P}^{-1}\\boldsymbol{AP} = \\begin{bmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & 10 \\end{bmatrix}$。\n(2) 能。$\\boldsymbol{P} = \\begin{bmatrix} 1 & 2 & 1 \\\\ 1 & 3 & 3 \\\\ 1 & 3 & 4 \\end{bmatrix}$，$\\boldsymbol{P}^{-1}\\boldsymbol{AP} = \\begin{bmatrix} 1 & 0 & 0 \\\\ 0 & 2 & 0 \\\\ 0 & 0 & 3 \\end{bmatrix}$。\n(3) 能。$\\boldsymbol{P} = \\begin{bmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ -3 & 0 & 1 \\end{bmatrix}$，$\\boldsymbol{P}^{-1}\\boldsymbol{AP} = \\begin{bmatrix} 0 & 0 & 0 \\\\ 0 & 0 & 0 \\\\ 0 & 0 & 1 \\end{bmatrix}$。\n(4) 不能。因为 $r(a\\boldsymbol{E}-\\boldsymbol{A}) = 2$，对应 3 重特征值 $a$ 只能找到一个线性无关的特征向量，因此 $\\boldsymbol{A}$ 不能相似于对角矩阵。\n(5) 能。$\\boldsymbol{P} = \\begin{bmatrix} -2 & 0 & -1 \\\\ 1 & 0 & 1 \\\\ 0 & 1 & 1 \\end{bmatrix}$，$\\boldsymbol{P}^{-1}\\boldsymbol{AP} = \\begin{bmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & -2 \\end{bmatrix}$。",
      hints: "计算特征值及其代数重数与几何重数。若每个重特征值的线性无关特征向量个数等于重数，则方阵可对角化，以特征向量为列构造可逆矩阵 $\\boldsymbol{P}$。",
      steps: "(1) $|\\lambda\\boldsymbol{E}-\\boldsymbol{A}| = (\\lambda-1)^2(\\lambda-10)=0$。对二重特征值 $\\lambda=1$，$r(\\boldsymbol{E}-\\boldsymbol{A})=1$，基础解系为 $(1, 0, -2)^{\\mathrm{T}}, (0, 1, -2)^{\\mathrm{T}}$；对 $\\lambda=10$ 得特征向量 $(2, 2, 1)^{\\mathrm{T}}$。取 $\\boldsymbol{P} = \\begin{bmatrix} 1 & 0 & 2 \\\\ 0 & 1 & 2 \\\\ -2 & -2 & 1 \\end{bmatrix}$，则 $\\boldsymbol{P}^{-1}\\boldsymbol{AP} = \\operatorname{diag}(1, 1, 10)$；\n(2) 特征多项式展开解得互异特征值 $\\lambda_1=1, \\lambda_2=2, \\lambda_3=3$。因为有 3 个互异特征值，必可相似对角化。对应特征向量分别为 $(1, 1, 1)^{\\mathrm{T}}, (2, 3, 3)^{\\mathrm{T}}, (1, 3, 4)^{\\mathrm{T}}$。取 $\\boldsymbol{P} = \\begin{bmatrix} 1 & 2 & 1 \\\\ 1 & 3 & 3 \\\\ 1 & 3 & 4 \\end{bmatrix}$，得 $\\boldsymbol{P}^{-1}\\boldsymbol{AP} = \\operatorname{diag}(1, 2, 3)$；\n(3) 下三角矩阵特征值为对角元 $\\lambda_1=\\lambda_2=0, \\lambda_3=1$。对二重特征值 $\\lambda=0$，$r(0\\boldsymbol{E}-\\boldsymbol{A})=r(\\boldsymbol{A})=1$，几何重数为 $3-1=2$，基础解系为 $(1, 0, -3)^{\\mathrm{T}}, (0, 1, 0)^{\\mathrm{T}}$；对 $\\lambda_3=1$ 得特征向量 $(0, 0, 1)^{\\mathrm{T}}$。取 $\\boldsymbol{P} = \\begin{bmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ -3 & 0 & 1 \\end{bmatrix}$，得 $\\boldsymbol{P}^{-1}\\boldsymbol{AP} = \\operatorname{diag}(0, 0, 1)$；\n(4) 特征多项式为 $(\\lambda-a)^3=0$，特征值为 $\\lambda=a$（3 重）。$a\\boldsymbol{E}-\\boldsymbol{A} = \\begin{bmatrix} 0 & -1 & 0 \\\\ 0 & 0 & -1 \\\\ 0 & 0 & 0 \\end{bmatrix}$，其秩为 $2$。线性无关特征向量个数为 $3-2=1 < 3$，故不能相似于对角矩阵；\n(5) 特征多项式为 $(\\lambda-1)^2(\\lambda+2)=0$。对 $\\lambda=1$，$r(\\boldsymbol{E}-\\boldsymbol{A})=1$，基础解系有两个向量 $(-2, 1, 0)^{\\mathrm{T}}, (0, 0, 1)^{\\mathrm{T}}$；对 $\\lambda=-2$ 得特征向量 $(-1, 1, 1)^{\\mathrm{T}}$。取 $\\boldsymbol{P} = \\begin{bmatrix} -2 & 0 & -1 \\\\ 1 & 0 & 1 \\\\ 0 & 1 & 1 \\end{bmatrix}$，得 $\\boldsymbol{P}^{-1}\\boldsymbol{AP} = \\operatorname{diag}(1, 1, -2)$。"
    }
  },
  {
    id: "LAG-TB-CH06-Q16",
    source_type: "textbook",
    source: {
      paper_id: 2006,
      raw_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      clean_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 6 章 · 习题六 第 16 题",
      page_start: 145,
      page_end: 145
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 16,
      paper_q_num: 16,
      type: "calc",
      difficulty: 1,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 6,
        chapter_title: "第6章 特征值与特征向量",
        section: "6.2",
        section_title: "方阵的相似化简",
        section_slug: "6.2_方阵的相似化简",
        knowledge_points: ["相似矩阵的性质", "行列式与相似不变量"]
      }
    },
    content: {
      stem: "设 $\\boldsymbol{A} = \\begin{bmatrix} 1 & -1 & 0 \\\\ -1 & 0 & 0 \\\\ 0 & 0 & 1 \\end{bmatrix}$ 与 $\\boldsymbol{B} = \\begin{bmatrix} 1 & a & 0 \\\\ -1 & 0 & -1 \\\\ 0 & a & 1 \\end{bmatrix}$ 相似，求 $a$。"
    },
    solution: {
      answer: "$a = -\\frac{1}{2}$。",
      hints: "相似矩阵的行列式相等，即 $|\\boldsymbol{A}| = |\\boldsymbol{B}|$，以此列方程求解 $a$。",
      steps: "因为矩阵 $\\boldsymbol{A}$ 与 $\\boldsymbol{B}$ 相似，所以它们的行列式必然相等，即 $|\\boldsymbol{A}| = |\\boldsymbol{B}|$。\n计算 $|\\boldsymbol{A}|$（按第三行展开）：\n$$|\\boldsymbol{A}| = 1 \\times \\begin{vmatrix} 1 & -1 \\\\ -1 & 0 \\end{vmatrix} = 1 \\times (0 - 1) = -1$$\n计算 $|\\boldsymbol{B}|$（按第一行展开）：\n$$|\\boldsymbol{B}| = 1 \\times \\begin{vmatrix} 0 & -1 \\\\ a & 1 \\end{vmatrix} - a \\times \\begin{vmatrix} -1 & -1 \\\\ 0 & 1 \\end{vmatrix} = (0 - (-a)) - a(-1 - 0) = a + a = 2a$$\n由 $|\\boldsymbol{A}| = |\\boldsymbol{B}|$ 得：\n$$2a = -1 \\implies a = -\\frac{1}{2}$$\n当 $a = -\\frac{1}{2}$ 时，两矩阵的迹均为 $2$，特征多项式均为 $\\lambda^3 - 2\\lambda^2 - \\lambda + 1$，完全一致。\n因此 $a = -\\frac{1}{2}$。"
    }
  },
  {
    id: "LAG-TB-CH06-Q17",
    source_type: "textbook",
    source: {
      paper_id: 2006,
      raw_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      clean_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 6 章 · 习题六 第 17 题",
      page_start: 145,
      page_end: 145
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
        chapter: 6,
        chapter_title: "第6章 特征值与特征向量",
        section: "6.2",
        section_title: "方阵的相似化简",
        section_slug: "6.2_方阵的相似化简",
        knowledge_points: ["相似矩阵特征值相同", "迹与相似不变量", "相似对角化过渡矩阵"]
      }
    },
    content: {
      stem: "求 $x, y$，使 $\\boldsymbol{A} = \\begin{bmatrix} 2 & 0 & 0 \\\\ 0 & 0 & 1 \\\\ 0 & 1 & x \\end{bmatrix}$ 与 $\\boldsymbol{B} = \\begin{bmatrix} 2 & 0 & 0 \\\\ 0 & y & 0 \\\\ 0 & 0 & -1 \\end{bmatrix}$ 相似，并求可逆矩阵 $\\boldsymbol{P}$，使 $\\boldsymbol{P}^{-1}\\boldsymbol{AP} = \\boldsymbol{B}$。"
    },
    solution: {
      answer: "$x = 0, y = 1$；$\\boldsymbol{P} = \\begin{bmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 1 \\\\ 0 & 1 & -1 \\end{bmatrix}$。",
      hints: "相似矩阵具有相同的特征值与迹。由 $\\boldsymbol{B}$ 的特征值确定 $\\boldsymbol{A}$ 的特征值以求 $x$，再由迹守恒求 $y$，最后求特征向量构建 $\\boldsymbol{P}$。",
      steps: "因为 $\\boldsymbol{A}$ 与对角矩阵 $\\boldsymbol{B}$ 相似，所以它们具有完全相同的特征值与迹。\n对角矩阵 $\\boldsymbol{B}$ 的特征值为 $2, y, -1$，因此 $\\lambda = -1$ 必为 $\\boldsymbol{A}$ 的特征值，即满足 $|-\\boldsymbol{E} - \\boldsymbol{A}| = 0$：\n$$|-\\boldsymbol{E} - \\boldsymbol{A}| = \\begin{vmatrix} -3 & 0 & 0 \\\\ 0 & -1 & -1 \\\\ 0 & -1 & -1 - x \\end{vmatrix} = -3 \\left[ (-1)(-1 - x) - 1 \\right] = -3(1 + x - 1) = -3x = 0$$\n解得 $x = 0$。\n当 $x = 0$ 时，$\\operatorname{tr}(\\boldsymbol{A}) = 2 + 0 + 0 = 2$。\n又 $\\operatorname{tr}(\\boldsymbol{B}) = 2 + y - 1 = 1 + y$。\n由迹相等 $\\operatorname{tr}(\\boldsymbol{A}) = \\operatorname{tr}(\\boldsymbol{B})$ 得 $1 + y = 2$，解得 $y = 1$。\n此时 $\\boldsymbol{B} = \\operatorname{diag}(2, 1, -1)$，$\\boldsymbol{A}$ 的特征值依次为 $\\lambda_1 = 2, \\lambda_2 = 1, \\lambda_3 = -1$。\n分别求 $\\boldsymbol{A}$ 对应的特征向量：\n- 对于 $\\lambda_1 = 2$：$(2\\boldsymbol{E} - \\boldsymbol{A})\\boldsymbol{x} = \\boldsymbol{0} \\implies \\begin{bmatrix} 0 & 0 & 0 \\\\ 0 & 2 & -1 \\\\ 0 & -1 & 2 \\end{bmatrix} \\boldsymbol{x} = \\boldsymbol{0}$，解得 $\\boldsymbol{p}_1 = \\begin{bmatrix} 1 \\\\ 0 \\\\ 0 \\end{bmatrix}$；\n- 对于 $\\lambda_2 = 1$：$(\\boldsymbol{E} - \\boldsymbol{A})\\boldsymbol{x} = \\boldsymbol{0} \\implies \\begin{bmatrix} -1 & 0 & 0 \\\\ 0 & 1 & -1 \\\\ 0 & -1 & 1 \\end{bmatrix} \\boldsymbol{x} = \\boldsymbol{0}$，解得 $\\boldsymbol{p}_2 = \\begin{bmatrix} 0 \\\\ 1 \\\\ 1 \\end{bmatrix}$；\n- 对于 $\\lambda_3 = -1$：$(-\\boldsymbol{E} - \\boldsymbol{A})\\boldsymbol{x} = \\boldsymbol{0} \\implies \\begin{bmatrix} -3 & 0 & 0 \\\\ 0 & -1 & -1 \\\\ 0 & -1 & -1 \\end{bmatrix} \\boldsymbol{x} = \\boldsymbol{0}$，解得 $\\boldsymbol{p}_3 = \\begin{bmatrix} 0 \\\\ 1 \\\\ -1 \\end{bmatrix}$。\n令 $\\boldsymbol{P} = [\\boldsymbol{p}_1, \\boldsymbol{p}_2, \\boldsymbol{p}_3] = \\begin{bmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 1 \\\\ 0 & 1 & -1 \\end{bmatrix}$，则 $\\boldsymbol{P}$ 为可逆矩阵且满足 $\\boldsymbol{P}^{-1}\\boldsymbol{AP} = \\boldsymbol{B}$。"
    }
  },
  {
    id: "LAG-TB-CH06-Q18",
    source_type: "textbook",
    source: {
      paper_id: 2006,
      raw_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      clean_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 6 章 · 习题六 第 18 题",
      page_start: 145,
      page_end: 145
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 18,
      paper_q_num: 18,
      type: "calc",
      difficulty: 2,
      score: 10
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 6,
        chapter_title: "第6章 特征值与特征向量",
        section: "6.2",
        section_title: "方阵的相似化简",
        section_slug: "6.2_方阵的相似化简",
        knowledge_points: ["特征值与迹的关系", "相似对角化", "重特征值特征向量求法"]
      }
    },
    content: {
      stem: "已知 $\\boldsymbol{A} = \\begin{bmatrix} 1 & -2 & -4 \\\\ -2 & x & -2 \\\\ -4 & -2 & 1 \\end{bmatrix}$ 与 $\\boldsymbol{\\Lambda} = \\begin{bmatrix} 5 & & \\\\ & y & \\\\ & & -4 \\end{bmatrix}$ 相似。求参数 $x, y$ 的值，并求可逆矩阵 $\\boldsymbol{P}$，使得 $\\boldsymbol{P}^{-1}\\boldsymbol{AP} = \\boldsymbol{\\Lambda}$。"
    },
    solution: {
      answer: "$x = 4, y = 5$；$\\boldsymbol{P} = \\begin{bmatrix} 1 & 0 & 2 \\\\ -2 & -2 & 1 \\\\ 0 & 1 & 2 \\end{bmatrix}$。",
      hints: "利用相似矩阵特征值相同，由 $\\lambda = -4$ 是特征值求 $x$，由迹相等求 $y$，再求解特征方程得到特征向量组拼成矩阵 $\\boldsymbol{P}$。",
      steps: "因为 $\\boldsymbol{A}$ 与对角矩阵 $\\boldsymbol{\\Lambda}$ 相似，所以 $\\boldsymbol{\\Lambda}$ 的对角元即为 $\\boldsymbol{A}$ 的全部特征值。\n由于 $\\lambda = -4$ 是 $\\boldsymbol{\\Lambda}$ 的特征值，故也是 $\\boldsymbol{A}$ 的特征值，即满足 $|-4\\boldsymbol{E} - \\boldsymbol{A}| = 0$：\n$$|-4\\boldsymbol{E} - \\boldsymbol{A}| = \\begin{vmatrix} -5 & 2 & 4 \\\\ 2 & -4-x & 2 \\\\ 4 & 2 & -5 \\end{vmatrix} = 0$$\n第 1 行加上第 3 行：\n$$\\begin{vmatrix} -1 & 4 & -1 \\\\ 2 & -4-x & 2 \\\\ 4 & 2 & -5 \\end{vmatrix} = 0$$\n计算行列式得 $36 - 9x = 0$，解得 $x = 4$。\n当 $x = 4$ 时，$\\operatorname{tr}(\\boldsymbol{A}) = 1 + 4 + 1 = 6$。\n又 $\\operatorname{tr}(\\boldsymbol{\\Lambda}) = 5 + y - 4 = 1 + y$。\n由迹相等得 $1 + y = 6 \\implies y = 5$。\n此时 $\\boldsymbol{\\Lambda} = \\operatorname{diag}(5, 5, -4)$，特征值为 $\\lambda_1 = \\lambda_2 = 5, \\lambda_3 = -4$。\n求对应的特征向量：\n- 对二重特征值 $\\lambda = 5$，解 $(5\\boldsymbol{E} - \\boldsymbol{A})\\boldsymbol{x} = \\boldsymbol{0}$：\n$$5\\boldsymbol{E} - \\boldsymbol{A} = \\begin{bmatrix} 4 & 2 & 4 \\\\ 2 & 1 & 2 \\\\ 4 & 2 & 4 \\end{bmatrix} \\to \\begin{bmatrix} 2 & 1 & 2 \\\\ 0 & 0 & 0 \\\\ 0 & 0 & 0 \\end{bmatrix}$$\n方程为 $2x_1 + x_2 + 2x_3 = 0$。选取两个线性无关的基础解系：\n令 $x_3 = 0, x_1 = 1$，得 $x_2 = -2$，即 $\\boldsymbol{p}_1 = \\begin{bmatrix} 1 \\\\ -2 \\\\ 0 \\end{bmatrix}$；\n令 $x_1 = 0, x_3 = 1$，得 $x_2 = -2$，即 $\\boldsymbol{p}_2 = \\begin{bmatrix} 0 \\\\ -2 \\\\ 1 \\end{bmatrix}$；\n- 对单特征值 $\\lambda = -4$，解 $(-4\\boldsymbol{E} - \\boldsymbol{A})\\boldsymbol{x} = \\boldsymbol{0}$：\n$$-4\\boldsymbol{E} - \\boldsymbol{A} = \\begin{bmatrix} -5 & 2 & 4 \\\\ 2 & -8 & 2 \\\\ 4 & 2 & -5 \\end{bmatrix} \\to \\begin{bmatrix} 1 & -4 & 1 \\\\ 0 & -18 & 9 \\\\ 0 & 18 & -9 \\end{bmatrix} \\to \\begin{bmatrix} 1 & 0 & -1 \\\\ 0 & 2 & -1 \\\\ 0 & 0 & 0 \\end{bmatrix}$$\n解得基础解系 $\\boldsymbol{p}_3 = \\begin{bmatrix} 2 \\\\ 1 \\\\ 2 \\end{bmatrix}$。\n令 $\\boldsymbol{P} = [\\boldsymbol{p}_1, \\boldsymbol{p}_2, \\boldsymbol{p}_3] = \\begin{bmatrix} 1 & 0 & 2 \\\\ -2 & -2 & 1 \\\\ 0 & 1 & 2 \\end{bmatrix}$，\n则 $\\boldsymbol{P}$ 可逆且满足 $\\boldsymbol{P}^{-1}\\boldsymbol{AP} = \\boldsymbol{\\Lambda}$。"
    }
  },
  {
    id: "LAG-TB-CH06-Q19",
    source_type: "textbook",
    source: {
      paper_id: 2006,
      raw_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      clean_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 6 章 · 习题六 第 19 题",
      page_start: 145,
      page_end: 146
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 19,
      paper_q_num: 19,
      type: "calc",
      difficulty: 2,
      score: 10
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 6,
        chapter_title: "第6章 特征值与特征向量",
        section: "6.2",
        section_title: "方阵的相似化简",
        section_slug: "6.2_方阵的相似化简",
        knowledge_points: ["由特征值与特征向量反求矩阵", "矩阵相似对角化公式"]
      }
    },
    content: {
      stem: "求三阶方阵 $\\boldsymbol{A}$，使得 $\\boldsymbol{A}$ 的特征值 $\\lambda_1, \\lambda_2, \\lambda_3$ 和对应的特征向量 $\\boldsymbol{p}_1, \\boldsymbol{p}_2, \\boldsymbol{p}_3$ 如下所示：\n\n(1) $\\lambda_1 = 1, \\lambda_2 = 1, \\lambda_3 = 2$；$\\boldsymbol{p}_1 = \\begin{bmatrix} 1 \\\\ 2 \\\\ 1 \\end{bmatrix}, \\boldsymbol{p}_2 = \\begin{bmatrix} 1 \\\\ 1 \\\\ 0 \\end{bmatrix}, \\boldsymbol{p}_3 = \\begin{bmatrix} 2 \\\\ 0 \\\\ -1 \\end{bmatrix}$；\n\n(2) $\\lambda_1 = 1, \\lambda_2 = -1, \\lambda_3 = 0$；$\\boldsymbol{p}_1 = \\begin{bmatrix} 1 \\\\ 2 \\\\ 1 \\end{bmatrix}, \\boldsymbol{p}_2 = \\begin{bmatrix} 0 \\\\ -2 \\\\ 1 \\end{bmatrix}, \\boldsymbol{p}_3 = \\begin{bmatrix} 1 \\\\ 1 \\\\ 2 \\end{bmatrix}$。",
      sub_questions: [
        { sub_id: "(1)", stem: "$\\lambda_1 = 1, \\lambda_2 = 1, \\lambda_3 = 2$；$\\boldsymbol{p}_1 = \\begin{bmatrix} 1 \\\\ 2 \\\\ 1 \\end{bmatrix}, \\boldsymbol{p}_2 = \\begin{bmatrix} 1 \\\\ 1 \\\\ 0 \\end{bmatrix}, \\boldsymbol{p}_3 = \\begin{bmatrix} 2 \\\\ 0 \\\\ -1 \\end{bmatrix}$", answer: "$\\boldsymbol{A} = \\begin{bmatrix} 3 & -2 & 2 \\\\ 0 & 1 & 0 \\\\ -1 & 1 & 0 \\end{bmatrix}$" },
        { sub_id: "(2)", stem: "$\\lambda_1 = 1, \\lambda_2 = -1, \\lambda_3 = 0$；$\\boldsymbol{p}_1 = \\begin{bmatrix} 1 \\\\ 2 \\\\ 1 \\end{bmatrix}, \\boldsymbol{p}_2 = \\begin{bmatrix} 0 \\\\ -2 \\\\ 1 \\end{bmatrix}, \\boldsymbol{p}_3 = \\begin{bmatrix} 1 \\\\ 1 \\\\ 2 \\end{bmatrix}$", answer: "$\\boldsymbol{A} = \\begin{bmatrix} 5 & -1 & -2 \\\\ 16 & -4 & -6 \\\\ 2 & 0 & -1 \\end{bmatrix}$" }
      ]
    },
    solution: {
      answer: "(1) $\\boldsymbol{A} = \\begin{bmatrix} 3 & -2 & 2 \\\\ 0 & 1 & 0 \\\\ -1 & 1 & 0 \\end{bmatrix}$；\n(2) $\\boldsymbol{A} = \\begin{bmatrix} 5 & -1 & -2 \\\\ 16 & -4 & -6 \\\\ 2 & 0 & -1 \\end{bmatrix}$。",
      hints: "令 $\\boldsymbol{P} = [\\boldsymbol{p}_1, \\boldsymbol{p}_2, \\boldsymbol{p}_3]$，$\\boldsymbol{\\Lambda} = \\operatorname{diag}(\\lambda_1, \\lambda_2, \\lambda_3)$，由 $\\boldsymbol{AP} = \\boldsymbol{P\\Lambda}$ 得 $\\boldsymbol{A} = \\boldsymbol{P\\Lambda P}^{-1}$。",
      steps: "(1) 构造过渡矩阵 $\\boldsymbol{P}$ 和对角矩阵 $\\boldsymbol{\\Lambda}$：\n$$\\boldsymbol{P} = \\begin{bmatrix} 1 & 1 & 2 \\\\ 2 & 1 & 0 \\\\ 1 & 0 & -1 \\end{bmatrix}, \\quad \\boldsymbol{\\Lambda} = \\begin{bmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & 2 \\end{bmatrix}$$\n计算 $|\\boldsymbol{P}| = -1$，其逆矩阵为：\n$$\\boldsymbol{P}^{-1} = \\begin{bmatrix} 1 & -1 & 2 \\\\ -2 & 3 & -4 \\\\ 1 & -1 & 1 \\end{bmatrix}$$\n计算 $\\boldsymbol{A} = \\boldsymbol{P\\Lambda P}^{-1}$：\n$$\\boldsymbol{A} = \\begin{bmatrix} 1 & 1 & 2 \\\\ 2 & 1 & 0 \\\\ 1 & 0 & -1 \\end{bmatrix} \\begin{bmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & 2 \\end{bmatrix} \\begin{bmatrix} 1 & -1 & 2 \\\\ -2 & 3 & -4 \\\\ 1 & -1 & 1 \\end{bmatrix} = \\begin{bmatrix} 1 & 1 & 4 \\\\ 2 & 1 & 0 \\\\ 1 & 0 & -2 \\end{bmatrix} \\begin{bmatrix} 1 & -1 & 2 \\\\ -2 & 3 & -4 \\\\ 1 & -1 & 1 \\end{bmatrix} = \\begin{bmatrix} 3 & -2 & 2 \\\\ 0 & 1 & 0 \\\\ -1 & 1 & 0 \\end{bmatrix}$$\n\n(2) 构造 $\\boldsymbol{P}$ 和 $\\boldsymbol{\\Lambda}$：\n$$\\boldsymbol{P} = \\begin{bmatrix} 1 & 0 & 1 \\\\ 2 & -2 & 1 \\\\ 1 & 1 & 2 \\end{bmatrix}, \\quad \\boldsymbol{\\Lambda} = \\begin{bmatrix} 1 & 0 & 0 \\\\ 0 & -1 & 0 \\\\ 0 & 0 & 0 \\end{bmatrix}$$\n计算 $|\\boldsymbol{P}| = -1$，求逆矩阵得：\n$$\\boldsymbol{P}^{-1} = \\begin{bmatrix} 5 & -1 & -2 \\\\ 3 & -1 & -1 \\\\ -4 & 1 & 2 \\end{bmatrix}$$\n计算 $\\boldsymbol{A} = \\boldsymbol{P\\Lambda P}^{-1}$：\n$$\\boldsymbol{A} = \\begin{bmatrix} 1 & 0 & 1 \\\\ 2 & -2 & 1 \\\\ 1 & 1 & 2 \\end{bmatrix} \\begin{bmatrix} 1 & 0 & 0 \\\\ 0 & -1 & 0 \\\\ 0 & 0 & 0 \\end{bmatrix} \\begin{bmatrix} 5 & -1 & -2 \\\\ 3 & -1 & -1 \\\\ -4 & 1 & 2 \\end{bmatrix} = \\begin{bmatrix} 1 & 0 & 0 \\\\ 2 & 2 & 0 \\\\ 1 & -1 & 0 \\end{bmatrix} \\begin{bmatrix} 5 & -1 & -2 \\\\ 3 & -1 & -1 \\\\ -4 & 1 & 2 \\end{bmatrix} = \\begin{bmatrix} 5 & -1 & -2 \\\\ 16 & -4 & -6 \\\\ 2 & 0 & -1 \\end{bmatrix}$$。"
    }
  },
  {
    id: "LAG-TB-CH06-Q20",
    source_type: "textbook",
    source: {
      paper_id: 2006,
      raw_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      clean_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 6 章 · 习题六 第 20 题",
      page_start: 146,
      page_end: 146
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
        chapter: 6,
        chapter_title: "第6章 特征值与特征向量",
        section: "6.2",
        section_title: "方阵的相似化简",
        section_slug: "6.2_方阵的相似化简",
        knowledge_points: ["特征方程求参数", "相似对角化变换", "特征向量求解"]
      }
    },
    content: {
      stem: "求参数 $x$ 的值，使 $\\boldsymbol{A} = \\begin{bmatrix} -2 & 0 & 0 \\\\ 2 & x & 2 \\\\ 3 & 1 & 1 \\end{bmatrix}$ 的特征值为 $-2, -1, 2$，并求可逆矩阵 $\\boldsymbol{P}$，使 $\\boldsymbol{P}^{-1}\\boldsymbol{AP}$ 为对角矩阵。"
    },
    solution: {
      answer: "$x = 0$；$\\boldsymbol{P} = \\begin{bmatrix} 1 & 0 & 0 \\\\ 0 & -2 & 1 \\\\ -1 & 1 & 1 \\end{bmatrix}$，$\\boldsymbol{P}^{-1}\\boldsymbol{AP} = \\begin{bmatrix} -2 & 0 & 0 \\\\ 0 & -1 & 0 \\\\ 0 & 0 & 2 \\end{bmatrix}$。",
      hints: "由特征多项式或迹确定 $x$ 的值，再分别求解各特征值对应的齐次方程组得到特征向量组构成 $\\boldsymbol{P}$。",
      steps: "因为 $\\lambda = -1$ 是 $\\boldsymbol{A}$ 的特征值，所以 $|-\\boldsymbol{E} - \\boldsymbol{A}| = 0$：\n$$|-\\boldsymbol{E} - \\boldsymbol{A}| = \\begin{vmatrix} 1 & 0 & 0 \\\\ -2 & -1-x & -2 \\\\ -3 & -1 & -2 \\end{vmatrix} = 1 \\times [(-1-x)(-2) - 2] = 2x = 0 \\implies x = 0$$\n验证方阵的迹：$\\operatorname{tr}(\\boldsymbol{A}) = -2 + 0 + 1 = -1$，等于特征值之和 $(-2) + (-1) + 2 = -1$，吻合。\n此时矩阵 $\\boldsymbol{A} = \\begin{bmatrix} -2 & 0 & 0 \\\\ 2 & 0 & 2 \\\\ 3 & 1 & 1 \\end{bmatrix}$，求各特征值的特征向量：\n- 对于 $\\lambda_1 = -2$：\n$$(-2\\boldsymbol{E} - \\boldsymbol{A})\\boldsymbol{x} = \\begin{bmatrix} 0 & 0 & 0 \\\\ -2 & -2 & -2 \\\\ -3 & -1 & -3 \\end{bmatrix}\\boldsymbol{x} = \\boldsymbol{0} \\to \\begin{bmatrix} 1 & 1 & 1 \\\\ 0 & 2 & 0 \\\\ 0 & 0 & 0 \\end{bmatrix}\\boldsymbol{x} = \\boldsymbol{0}$$\n解得 $x_2 = 0, x_1 + x_3 = 0$，基础解系取 $\\boldsymbol{p}_1 = \\begin{bmatrix} 1 \\\\ 0 \\\\ -1 \\end{bmatrix}$；\n- 对于 $\\lambda_2 = -1$：\n$$(-\\boldsymbol{E} - \\boldsymbol{A})\\boldsymbol{x} = \\begin{bmatrix} 1 & 0 & 0 \\\\ -2 & -1 & -2 \\\\ -3 & -1 & -2 \\end{bmatrix}\\boldsymbol{x} = \\boldsymbol{0} \\to \\begin{bmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 2 \\\\ 0 & 0 & 0 \\end{bmatrix}\\boldsymbol{x} = \\boldsymbol{0}$$\n解得 $x_1 = 0, x_2 + 2x_3 = 0$，基础解系取 $\\boldsymbol{p}_2 = \\begin{bmatrix} 0 \\\\ -2 \\\\ 1 \\end{bmatrix}$；\n- 对于 $\\lambda_3 = 2$：\n$$(2\\boldsymbol{E} - \\boldsymbol{A})\\boldsymbol{x} = \\begin{bmatrix} 4 & 0 & 0 \\\\ -2 & 2 & -2 \\\\ -3 & -1 & 1 \\end{bmatrix}\\boldsymbol{x} = \\boldsymbol{0} \\to \\begin{bmatrix} 1 & 0 & 0 \\\\ 0 & 1 & -1 \\\\ 0 & 0 & 0 \\end{bmatrix}\\boldsymbol{x} = \\boldsymbol{0}$$\n解得 $x_1 = 0, x_2 - x_3 = 0$，基础解系取 $\\boldsymbol{p}_3 = \\begin{bmatrix} 0 \\\\ 1 \\\\ 1 \\end{bmatrix}$。\n令 $\\boldsymbol{P} = [\\boldsymbol{p}_1, \\boldsymbol{p}_2, \\boldsymbol{p}_3] = \\begin{bmatrix} 1 & 0 & 0 \\\\ 0 & -2 & 1 \\\\ -1 & 1 & 1 \\end{bmatrix}$，\n则 $\\boldsymbol{P}$ 为可逆矩阵，且 $\\boldsymbol{P}^{-1}\\boldsymbol{AP} = \\begin{bmatrix} -2 & 0 & 0 \\\\ 0 & -1 & 0 \\\\ 0 & 0 & 2 \\end{bmatrix}$。"
    }
  },
  {
    id: "LAG-TB-CH06-Q21",
    source_type: "textbook",
    source: {
      paper_id: 2006,
      raw_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      clean_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 6 章 · 习题六 第 21 题",
      page_start: 146,
      page_end: 146
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 21,
      paper_q_num: 21,
      type: "proof",
      difficulty: 1,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 6,
        chapter_title: "第6章 特征值与特征向量",
        section: "6.2",
        section_title: "方阵的相似化简",
        section_slug: "6.2_方阵的相似化简",
        knowledge_points: ["相似矩阵的性质", "矩阵幂的相似性"]
      }
    },
    content: {
      stem: "求证：若 $\\boldsymbol{A}$ 与 $\\boldsymbol{B}$ 相似，则对任意正整数 $k$，$\\boldsymbol{A}^k$ 与 $\\boldsymbol{B}^k$ 也相似。"
    },
    solution: {
      answer: "证明略。",
      hints: "利用相似的定义 $\\boldsymbol{P}^{-1}\\boldsymbol{AP} = \\boldsymbol{B}$，直接计算 $(\\boldsymbol{P}^{-1}\\boldsymbol{AP})^k$ 并利用矩阵乘法结合律中间相消。",
      steps: "因为 $\\boldsymbol{A}$ 与 $\\boldsymbol{B}$ 相似，所以存在可逆矩阵 $\\boldsymbol{P}$，使得\n$$\\boldsymbol{P}^{-1}\\boldsymbol{AP} = \\boldsymbol{B}$$\n对任意正整数 $k$，计算 $\\boldsymbol{B}^k$：\n$$\\boldsymbol{B}^k = (\\boldsymbol{P}^{-1}\\boldsymbol{AP})^k = (\\boldsymbol{P}^{-1}\\boldsymbol{AP})(\\boldsymbol{P}^{-1}\\boldsymbol{AP}) \\cdots (\\boldsymbol{P}^{-1}\\boldsymbol{AP})$$\n根据矩阵乘法的结合律，相邻的内项满足 $\\boldsymbol{P}\\boldsymbol{P}^{-1} = \\boldsymbol{E}$，依次相消：\n$$\\boldsymbol{B}^k = \\boldsymbol{P}^{-1}\\boldsymbol{A}(\\boldsymbol{P}\\boldsymbol{P}^{-1})\\boldsymbol{A}(\\boldsymbol{P}\\boldsymbol{P}^{-1}) \\cdots (\\boldsymbol{P}\\boldsymbol{P}^{-1})\\boldsymbol{AP} = \\boldsymbol{P}^{-1}\\boldsymbol{A}^k\\boldsymbol{P}$$\n因此存在可逆矩阵 $\\boldsymbol{P}$ 使得 $\\boldsymbol{P}^{-1}\\boldsymbol{A}^k\\boldsymbol{P} = \\boldsymbol{B}^k$，即 $\\boldsymbol{A}^k$ 与 $\\boldsymbol{B}^k$ 相似。"
    }
  },
  {
    id: "LAG-TB-CH06-Q22",
    source_type: "textbook",
    source: {
      paper_id: 2006,
      raw_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      clean_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 6 章 · 习题六 第 22 题",
      page_start: 146,
      page_end: 146
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 22,
      paper_q_num: 22,
      type: "proof",
      difficulty: 1,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 6,
        chapter_title: "第6章 特征值与特征向量",
        section: "6.2",
        section_title: "方阵的相似化简",
        section_slug: "6.2_方阵的相似化简",
        knowledge_points: ["矩阵可逆性与相似", "乘积的相似性"]
      }
    },
    content: {
      stem: "设 $\\boldsymbol{A}, \\boldsymbol{B}$ 都是 $n$ 阶方阵，$|\\boldsymbol{A}| \\neq 0$。求证：$\\boldsymbol{AB}$ 与 $\\boldsymbol{BA}$ 相似。"
    },
    solution: {
      answer: "证明略。",
      hints: "由 $|\\boldsymbol{A}| \\neq 0$ 知 $\\boldsymbol{A}$ 可逆，利用相似变换 $\\boldsymbol{A}^{-1}(\\boldsymbol{AB})\\boldsymbol{A}$ 证明。",
      steps: "因为 $|\\boldsymbol{A}| \\neq 0$，所以矩阵 $\\boldsymbol{A}$ 可逆，即存在逆矩阵 $\\boldsymbol{A}^{-1}$。\n考察矩阵乘积 $\\boldsymbol{A}^{-1}(\\boldsymbol{AB})\\boldsymbol{A}$：\n根据矩阵乘法的结合律：\n$$\\boldsymbol{A}^{-1}(\\boldsymbol{AB})\\boldsymbol{A} = (\\boldsymbol{A}^{-1}\\boldsymbol{A})(\\boldsymbol{BA}) = \\boldsymbol{E}(\\boldsymbol{BA}) = \\boldsymbol{BA}$$\n取可逆矩阵 $\\boldsymbol{P} = \\boldsymbol{A}$，则有：\n$$\\boldsymbol{P}^{-1}(\\boldsymbol{AB})\\boldsymbol{P} = \\boldsymbol{BA}$$\n根据相似矩阵的定义，$\\boldsymbol{AB}$ 与 $\\boldsymbol{BA}$ 相似。"
    }
  },
  {
    id: "LAG-TB-CH06-Q23",
    source_type: "textbook",
    source: {
      paper_id: 2006,
      raw_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      clean_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 6 章 · 习题六 第 23 题",
      page_start: 146,
      page_end: 146
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 23,
      paper_q_num: 23,
      type: "proof",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 6,
        chapter_title: "第6章 特征值与特征向量",
        section: "6.2",
        section_title: "方阵的相似化简",
        section_slug: "6.2_方阵的相似化简",
        knowledge_points: ["分块矩阵乘法", "分块对角矩阵的相似性", "逆矩阵的分块形式"]
      }
    },
    content: {
      stem: "设 $\\boldsymbol{A}, \\boldsymbol{B}$ 是 $n$ 阶方阵，$\\boldsymbol{C}, \\boldsymbol{D}$ 是 $m$ 阶方阵。求证：若 $\\boldsymbol{A}$ 与 $\\boldsymbol{B}$ 相似，$\\boldsymbol{C}$ 与 $\\boldsymbol{D}$ 相似，则\n$$\\begin{bmatrix} \\boldsymbol{A} & \\boldsymbol{O}_1 \\\\ \\boldsymbol{O}_2 & \\boldsymbol{C} \\end{bmatrix} \\quad \\text{与} \\quad \\begin{bmatrix} \\boldsymbol{B} & \\boldsymbol{O}_1 \\\\ \\boldsymbol{O}_2 & \\boldsymbol{D} \\end{bmatrix}$$\n也相似，其中 $\\boldsymbol{O}_1, \\boldsymbol{O}_2$ 为零矩阵。"
    },
    solution: {
      answer: "证明略。",
      hints: "构造分块对角可逆矩阵 $\\boldsymbol{M} = \\begin{bmatrix} \\boldsymbol{P} & \\boldsymbol{O}_1 \\\\ \\boldsymbol{O}_2 & \\boldsymbol{Q} \\end{bmatrix}$，直接验证相似变换。",
      steps: "因为 $\\boldsymbol{A}$ 与 $\\boldsymbol{B}$ 相似，$\\boldsymbol{C}$ 与 $\\boldsymbol{D}$ 相似，所以存在 $n$ 阶可逆矩阵 $\\boldsymbol{P}$ 和 $m$ 阶可逆矩阵 $\\boldsymbol{Q}$，使得\n$$\\boldsymbol{P}^{-1}\\boldsymbol{AP} = \\boldsymbol{B}, \\quad \\boldsymbol{Q}^{-1}\\boldsymbol{CQ} = \\boldsymbol{D}$$\n构造 $(n+m)$ 阶分块对角矩阵 $\\boldsymbol{M}$：\n$$\\boldsymbol{M} = \\begin{bmatrix} \\boldsymbol{P} & \\boldsymbol{O}_1 \\\\ \\boldsymbol{O}_2 & \\boldsymbol{Q} \\end{bmatrix}$$\n根据分块矩阵行列式性质，$|\\boldsymbol{M}| = |\\boldsymbol{P}| \\cdot |\\boldsymbol{Q}|$。由于 $|\\boldsymbol{P}| \\neq 0$ 且 $|\\boldsymbol{Q}| \\neq 0$，故 $|\\boldsymbol{M}| \\neq 0$，$\\boldsymbol{M}$ 为可逆矩阵，且其逆矩阵为：\n$$\\boldsymbol{M}^{-1} = \\begin{bmatrix} \\boldsymbol{P}^{-1} & \\boldsymbol{O}_1 \\\\ \\boldsymbol{O}_2 & \\boldsymbol{Q}^{-1} \\end{bmatrix}$$\n根据分块矩阵乘法法则：\n$$\\boldsymbol{M}^{-1} \\begin{bmatrix} \\boldsymbol{A} & \\boldsymbol{O}_1 \\\\ \\boldsymbol{O}_2 & \\boldsymbol{C} \\end{bmatrix} \\boldsymbol{M} = \\begin{bmatrix} \\boldsymbol{P}^{-1} & \\boldsymbol{O}_1 \\\\ \\boldsymbol{O}_2 & \\boldsymbol{Q}^{-1} \\end{bmatrix} \\begin{bmatrix} \\boldsymbol{A} & \\boldsymbol{O}_1 \\\\ \\boldsymbol{O}_2 & \\boldsymbol{C} \\end{bmatrix} \\begin{bmatrix} \\boldsymbol{P} & \\boldsymbol{O}_1 \\\\ \\boldsymbol{O}_2 & \\boldsymbol{Q} \\end{bmatrix} = \\begin{bmatrix} \\boldsymbol{P}^{-1}\\boldsymbol{A} & \\boldsymbol{O}_1 \\\\ \\boldsymbol{O}_2 & \\boldsymbol{Q}^{-1}\\boldsymbol{C} \\end{bmatrix} \\begin{bmatrix} \\boldsymbol{P} & \\boldsymbol{O}_1 \\\\ \\boldsymbol{O}_2 & \\boldsymbol{Q} \\end{bmatrix} = \\begin{bmatrix} \\boldsymbol{P}^{-1}\\boldsymbol{AP} & \\boldsymbol{O}_1 \\\\ \\boldsymbol{O}_2 & \\boldsymbol{Q}^{-1}\\boldsymbol{CQ} \\end{bmatrix} = \\begin{bmatrix} \\boldsymbol{B} & \\boldsymbol{O}_1 \\\\ \\boldsymbol{O}_2 & \\boldsymbol{D} \\end{bmatrix}$$\n因此，分块矩阵 $\\begin{bmatrix} \\boldsymbol{A} & \\boldsymbol{O}_1 \\\\ \\boldsymbol{O}_2 & \\boldsymbol{C} \\end{bmatrix}$ 与 $\\begin{bmatrix} \\boldsymbol{B} & \\boldsymbol{O}_1 \\\\ \\boldsymbol{O}_2 & \\boldsymbol{D} \\end{bmatrix}$ 相似。"
    }
  },
  {
    id: "LAG-TB-CH06-Q24",
    source_type: "textbook",
    source: {
      paper_id: 2006,
      raw_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      clean_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 6 章 · 习题六 第 24 题",
      page_start: 146,
      page_end: 146
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
        chapter: 6,
        chapter_title: "第6章 特征值与特征向量",
        section: "6.2",
        section_title: "方阵的相似化简",
        section_slug: "6.2_方阵的相似化简",
        knowledge_points: ["相似对角化求矩阵高次幂", "特征值与特征向量应用"]
      }
    },
    content: {
      stem: "已知 $\\boldsymbol{A} = \\begin{bmatrix} 1 & 2 \\\\ 2 & 1 \\end{bmatrix}$，求 $\\boldsymbol{A}^k$，其中 $k$ 是正整数。"
    },
    solution: {
      answer: "$\\boldsymbol{A}^k = \\frac{1}{2} \\begin{bmatrix} (-1)^k + 3^k & (-1)^{k-1} + 3^k \\\\ (-1)^{k-1} + 3^k & (-1)^k + 3^k \\end{bmatrix}$。",
      hints: "对 $\\boldsymbol{A}$ 进行相似对角化 $\\boldsymbol{A} = \\boldsymbol{P\\Lambda P}^{-1}$，再利用 $\\boldsymbol{A}^k = \\boldsymbol{P\\Lambda}^k\\boldsymbol{P}^{-1}$ 求解。",
      steps: "计算 $\\boldsymbol{A}$ 的特征值：\n$$|\\lambda\\boldsymbol{E} - \\boldsymbol{A}| = \\begin{vmatrix} \\lambda - 1 & -2 \\\\ -2 & \\lambda - 1 \\end{vmatrix} = (\\lambda - 1)^2 - 4 = (\\lambda - 3)(\\lambda + 1) = 0$$\n得特征值为 $\\lambda_1 = -1, \\lambda_2 = 3$。\n求对应的特征向量：\n- 对于 $\\lambda_1 = -1$：$(-\\boldsymbol{E} - \\boldsymbol{A})\\boldsymbol{x} = \\begin{bmatrix} -2 & -2 \\\\ -2 & -2 \\end{bmatrix}\\boldsymbol{x} = \\boldsymbol{0}$，取 $\\boldsymbol{p}_1 = \\begin{bmatrix} 1 \\\\ -1 \\end{bmatrix}$；\n- 对于 $\\lambda_2 = 3$：$(3\\boldsymbol{E} - \\boldsymbol{A})\\boldsymbol{x} = \\begin{bmatrix} 2 & -2 \\\\ -2 & 2 \\end{bmatrix}\\boldsymbol{x} = \\boldsymbol{0}$，取 $\\boldsymbol{p}_2 = \\begin{bmatrix} 1 \\\\ 1 \\end{bmatrix}$。\n令过渡矩阵 $\\boldsymbol{P} = \\begin{bmatrix} 1 & 1 \\\\ -1 & 1 \\end{bmatrix}$，则 $|\\boldsymbol{P}| = 2$，$\\boldsymbol{P}^{-1} = \\frac{1}{2}\\begin{bmatrix} 1 & -1 \\\\ 1 & 1 \\end{bmatrix}$，且\n$$\\boldsymbol{P}^{-1}\\boldsymbol{AP} = \\boldsymbol{\\Lambda} = \\begin{bmatrix} -1 & 0 \\\\ 0 & 3 \\end{bmatrix}$$\n于是对任意正整数 $k$：\n$$\\boldsymbol{A}^k = \\boldsymbol{P}\\boldsymbol{\\Lambda}^k\\boldsymbol{P}^{-1} = \\begin{bmatrix} 1 & 1 \\\\ -1 & 1 \\end{bmatrix} \\begin{bmatrix} (-1)^k & 0 \\\\ 0 & 3^k \\end{bmatrix} \\left( \\frac{1}{2} \\begin{bmatrix} 1 & -1 \\\\ 1 & 1 \\end{bmatrix} \\right)$$\n$$= \\frac{1}{2} \\begin{bmatrix} (-1)^k & 3^k \\\\ -(-1)^k & 3^k \\end{bmatrix} \\begin{bmatrix} 1 & -1 \\\\ 1 & 1 \\end{bmatrix}$$\n$$= \\frac{1}{2} \\begin{bmatrix} (-1)^k + 3^k & -(-1)^k + 3^k \\\\ -(-1)^k + 3^k & (-1)^k + 3^k \\end{bmatrix} = \\frac{1}{2} \\begin{bmatrix} (-1)^k + 3^k & (-1)^{k-1} + 3^k \\\\ (-1)^{k-1} + 3^k & (-1)^k + 3^k \\end{bmatrix}$$。"
    }
  },
  {
    id: "LAG-TB-CH06-Q25",
    source_type: "textbook",
    source: {
      paper_id: 2006,
      raw_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      clean_title: "《线性代数与几何》第6章 特征值与特征向量 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 6 章 · 习题六 第 25 题",
      page_start: 146,
      page_end: 146
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 25,
      paper_q_num: 25,
      type: "proof",
      difficulty: 1,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 6,
        chapter_title: "第6章 特征值与特征向量",
        section: "6.2",
        section_title: "方阵的相似化简",
        section_slug: "6.2_方阵的相似化简",
        knowledge_points: ["相似变换与特征向量的关系", "特征向量的映射"]
      }
    },
    content: {
      stem: "设 $\\boldsymbol{\\alpha}$ 是 $n$ 阶矩阵 $\\boldsymbol{A}$ 的属于特征值 $\\lambda$ 的特征向量，验证 $\\boldsymbol{\\beta} = \\boldsymbol{P}^{-1}\\boldsymbol{\\alpha}$ 一定是 $\\boldsymbol{B} = \\boldsymbol{P}^{-1}\\boldsymbol{AP}$ 的属于特征值 $\\lambda$ 的特征向量。"
    },
    solution: {
      answer: "证明略。",
      hints: "根据特征向量的定义，需验证两点：(1) $\\boldsymbol{\\beta} \\neq \\boldsymbol{0}$；(2) $\\boldsymbol{B}\\boldsymbol{\\beta} = \\lambda\\boldsymbol{\\beta}$。",
      steps: "由题意，$\\boldsymbol{\\alpha}$ 是 $\\boldsymbol{A}$ 的属于特征值 $\\lambda$ 的特征向量，因此满足：\n$$\\boldsymbol{\\alpha} \\neq \\boldsymbol{0} \\quad \\text{且} \\quad \\boldsymbol{A}\\boldsymbol{\\alpha} = \\lambda\\boldsymbol{\\alpha}$$\n下面验证 $\\boldsymbol{\\beta} = \\boldsymbol{P}^{-1}\\boldsymbol{\\alpha}$ 是 $\\boldsymbol{B}$ 的特征向量：\n(1) 验证非零性：\n因为 $\\boldsymbol{P}$ 为可逆矩阵，逆矩阵 $\\boldsymbol{P}^{-1}$ 也可逆。若 $\\boldsymbol{\\beta} = \\boldsymbol{P}^{-1}\\boldsymbol{\\alpha} = \\boldsymbol{0}$，则两边左乘 $\\boldsymbol{P}$ 得 $\\boldsymbol{\\alpha} = \\boldsymbol{P}\\boldsymbol{0} = \\boldsymbol{0}$，这与 $\\boldsymbol{\\alpha} \\neq \\boldsymbol{0}$ 矛盾，故必有 $\\boldsymbol{\\beta} \\neq \\boldsymbol{0}$。\n(2) 验证特征方程：\n计算 $\\boldsymbol{B}\\boldsymbol{\\beta}$：\n$$\\boldsymbol{B}\\boldsymbol{\\beta} = (\\boldsymbol{P}^{-1}\\boldsymbol{AP})(\\boldsymbol{P}^{-1}\\boldsymbol{\\alpha})$$\n由矩阵乘法结合律：\n$$\\boldsymbol{B}\\boldsymbol{\\beta} = \\boldsymbol{P}^{-1}\\boldsymbol{A}(\\boldsymbol{P}\\boldsymbol{P}^{-1})\\boldsymbol{\\alpha} = \\boldsymbol{P}^{-1}\\boldsymbol{A}\\boldsymbol{E}\\boldsymbol{\\alpha} = \\boldsymbol{P}^{-1}(\\boldsymbol{A}\\boldsymbol{\\alpha})$$\n将 $\\boldsymbol{A}\\boldsymbol{\\alpha} = \\lambda\\boldsymbol{\\alpha}$ 代入，得：\n$$\\boldsymbol{B}\\boldsymbol{\\beta} = \\boldsymbol{P}^{-1}(\\lambda\\boldsymbol{\\alpha}) = \\lambda(\\boldsymbol{P}^{-1}\\boldsymbol{\\alpha}) = \\lambda\\boldsymbol{\\beta}$$\n综上，$\\boldsymbol{\\beta} \\neq \\boldsymbol{0}$ 且 $\\boldsymbol{B}\\boldsymbol{\\beta} = \\lambda\\boldsymbol{\\beta}$，故 $\\boldsymbol{\\beta} = \\boldsymbol{P}^{-1}\\boldsymbol{\\alpha}$ 一定是 $\\boldsymbol{B} = \\boldsymbol{P}^{-1}\\boldsymbol{AP}$ 的属于特征值 $\\lambda$ 的特征向量。"
    }
  }
];

let errCount = 0;
function testMath(str, qid, field) {
  if (!str) return;
  const matches = str.match(/\$\$([\s\S]+?)\$\$|\$([^\$]+?)\$/g) || [];
  for (const m of matches) {
    const raw = m.startsWith('$$') ? m.slice(2, -2).trim() : m.slice(1, -1).trim();
    try {
      katex.renderToString(raw, { output: 'html', throwOnError: true, strict: false });
    } catch (e) {
      console.error(`[KaTeX Error] ${qid} in ${field}: ${raw} -> ${e.message}`);
      errCount++;
    }
  }
}

for (const q of ch06Questions) {
  testMath(q.content.stem, q.id, 'content.stem');
  testMath(q.solution.answer, q.id, 'solution.answer');
  testMath(q.solution.hints, q.id, 'solution.hints');
  testMath(q.solution.steps, q.id, 'solution.steps');
  if (q.content.sub_questions) {
    for (const sub of q.content.sub_questions) {
      testMath(sub.stem, q.id, 'sub_questions.stem');
      testMath(sub.answer, q.id, 'sub_questions.answer');
    }
  }
}

console.log(`Ch06 Total questions: ${ch06Questions.length}, KaTeX errors: ${errCount}`);
if (errCount === 0) {
  const outFile = path.join(__dirname, '../../src/data/exercises/raw_lag/ch06.json');
  fs.writeFileSync(outFile, JSON.stringify(ch06Questions, null, 2), 'utf-8');
  console.log(`Saved Chapter 6 to ${outFile}`);
} else {
  process.exit(1);
}
