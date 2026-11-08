module.exports = [
  {
    id: "LAG-TB-CH07-Q16",
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
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 16 题",
      page_start: 181,
      page_end: 181
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 16,
      paper_q_num: 16,
      type: "calc",
      difficulty: 3,
      score: 10
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.2",
        section_title: "实对称矩阵的对角化",
        section_slug: "7.2_实对称矩阵的对角化",
        knowledge_points: ["实对称矩阵谱分解", "正交对角化反求原矩阵", "特征向量正交性"]
      }
    },
    content: {
      stem: "设 $\\pmb{A}$ 是三阶实对称矩阵，其特征值为 $\\lambda_1 = \\lambda_2 = 6, \\lambda_3 = 2$。已知属于 $\\lambda_1 = \\lambda_2 = 6$ 的特征向量为 $\\pmb{p}_1 = (1, -1, 1)^\\mathrm{T}, \\pmb{p}_2 = (1, 1, 1)^\\mathrm{T}$。\n\n(1) 求 $\\pmb{A}$ 的属于 $\\lambda_3 = 2$ 的特征向量 $\\pmb{p}_3$；\n\n(2) 求正交矩阵 $\\pmb{O}$，使得 $\\pmb{O}^\\mathrm{T}\\pmb{A}\\pmb{O}$ 为对角形；\n\n(3) 求 $\\pmb{A}$。",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "求 $\\pmb{A}$ 的属于 $\\lambda_3 = 2$ 的特征向量 $\\pmb{p}_3$",
          answer: "$k(1, 0, -1)^\\mathrm{T} \\quad (k \\neq 0)$"
        },
        {
          sub_id: "(2)",
          stem: "求正交矩阵 $\\pmb{O}$，使得 $\\pmb{O}^\\mathrm{T}\\pmb{A}\\pmb{O}$ 为对角形",
          answer: "$\\pmb{O} = \\begin{pmatrix} \\frac{\\sqrt{3}}{3} & \\frac{\\sqrt{6}}{6} & \\frac{\\sqrt{2}}{2} \\\\ \\frac{\\sqrt{3}}{3} & -\\frac{\\sqrt{6}}{3} & 0 \\\\ \\frac{\\sqrt{3}}{3} & \\frac{\\sqrt{6}}{6} & -\\frac{\\sqrt{2}}{2} \\end{pmatrix}$（注：答案不唯一）；$\\pmb{O}^\\mathrm{T}\\pmb{A}\\pmb{O} = \\begin{pmatrix} 6 & 0 & 0 \\\\ 0 & 6 & 0 \\\\ 0 & 0 & 2 \\end{pmatrix}$"
        },
        {
          sub_id: "(3)",
          stem: "求 $\\pmb{A}$",
          answer: "$\\pmb{A} = \\begin{pmatrix} 4 & 0 & 2 \\\\ 0 & 6 & 0 \\\\ 2 & 0 & 4 \\end{pmatrix}$"
        }
      ]
    },
    solution: {
      answer: "(1) $k(1, 0, -1)^\\mathrm{T} \\quad (k \\neq 0)$；\n(2) $\\pmb{O} = \\begin{pmatrix} \\frac{\\sqrt{3}}{3} & \\frac{\\sqrt{6}}{6} & \\frac{\\sqrt{2}}{2} \\\\ \\frac{\\sqrt{3}}{3} & -\\frac{\\sqrt{6}}{3} & 0 \\\\ \\frac{\\sqrt{3}}{3} & \\frac{\\sqrt{6}}{6} & -\\frac{\\sqrt{2}}{2} \\end{pmatrix}$（注：答案不唯一）；$\\pmb{O}^\\mathrm{T}\\pmb{A}\\pmb{O} = \\begin{pmatrix} 6 & 0 & 0 \\\\ 0 & 6 & 0 \\\\ 0 & 0 & 2 \\end{pmatrix}$；\n(3) $\\pmb{A} = \\begin{pmatrix} 4 & 0 & 2 \\\\ 0 & 6 & 0 \\\\ 2 & 0 & 4 \\end{pmatrix}$。",
      hints: "实对称矩阵属于不同特征值的特征向量相互正交；利用矩阵谱分解 $\\pmb{A} = \\pmb{O}\\pmb{\\Lambda}\\pmb{O}^\\mathrm{T}$ 反求矩阵 $\\pmb{A}$。",
      steps: "(1) 设 $\\pmb{p}_3 = (x_1, x_2, x_3)^\\mathrm{T}$。由实对称矩阵性质，$\\pmb{p}_3$ 必与属于特征值 6 的特征向量 $\\pmb{p}_1, \\pmb{p}_2$ 都正交：\n$$\\begin{cases} x_1 - x_2 + x_3 = 0 \\\\ x_1 + x_2 + x_3 = 0 \\end{cases}$$\n相加得 $2(x_1 + x_3) = 0 \\implies x_3 = -x_1$，相减得 $2x_2 = 0 \\implies x_2 = 0$。\n故 $\\pmb{p}_3 = k(1, 0, -1)^\\mathrm{T} \\quad (k \\neq 0)$。\n\n(2) 属于特征值 6 的特征向量正交化：取 $\\pmb{\\beta}_1 = \\pmb{p}_2 = (1, 1, 1)^\\mathrm{T}$，对 $\\pmb{p}_1$ 正交化得 $\\pmb{\\beta}_2 = (1, -2, 1)^\\mathrm{T}$；$\\lambda_3=2$ 的特征向量为 $\\pmb{\\beta}_3 = (1, 0, -1)^\\mathrm{T}$。分别单位化排列组成正交矩阵 $\\pmb{O}$，此时 $\\pmb{O}^\\mathrm{T}\\pmb{A}\\pmb{O} = \\operatorname{diag}(6, 6, 2)$。\n\n(3) 根据正交相似反解：$\\pmb{A} = \\pmb{O}\\operatorname{diag}(6, 6, 2)\\pmb{O}^\\mathrm{T}$，代入计算得：\n$$\\pmb{A} = \\begin{pmatrix} 4 & 0 & 2 \\\\ 0 & 6 & 0 \\\\ 2 & 0 & 4 \\end{pmatrix}$$。"
    }
  },
  {
    id: "LAG-TB-CH07-Q17",
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
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 17 题",
      page_start: 181,
      page_end: 181
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 17,
      paper_q_num: 17,
      type: "calc",
      difficulty: 3,
      score: 10
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.2",
        section_title: "实对称矩阵的对角化",
        section_slug: "7.2_实对称矩阵的对角化",
        knowledge_points: ["实对称矩阵谱分解", "重特征值正交特征向量", "正交矩阵求法"]
      }
    },
    content: {
      stem: "设 $\\pmb{A}$ 是三阶实对称矩阵，其特征值为 $\\lambda_1 = \\lambda_2 = 1, \\lambda_3 = -2$。已知 $\\pmb{A}$ 的属于 $\\lambda_3 = -2$ 的特征向量为 $\\pmb{p}_3 = (1, 1, -1)^\\mathrm{T}$。\n\n(1) 求 $\\pmb{A}$ 的属于 $\\lambda_1 = \\lambda_2 = 1$ 的相互正交的特征向量 $\\pmb{p}_1$ 与 $\\pmb{p}_2$；\n\n(2) 求正交矩阵 $\\pmb{O}$，使得 $\\pmb{O}^\\mathrm{T}\\pmb{A}\\pmb{O}$ 为对角形；\n\n(3) 求 $\\pmb{A}$。",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "求 $\\pmb{A}$ 的属于 $\\lambda_1 = \\lambda_2 = 1$ 的相互正交的特征向量 $\\pmb{p}_1$ 与 $\\pmb{p}_2$",
          answer: "$\\pmb{p}_1 = (1, 0, 1)^\\mathrm{T}, \\pmb{p}_2 = (-1, 2, 1)^\\mathrm{T}$（注：答案不唯一）"
        },
        {
          sub_id: "(2)",
          stem: "求正交矩阵 $\\pmb{O}$，使得 $\\pmb{O}^\\mathrm{T}\\pmb{A}\\pmb{O}$ 为对角形",
          answer: "$\\pmb{O} = \\begin{pmatrix} \\frac{1}{\\sqrt{2}} & -\\frac{1}{\\sqrt{6}} & \\frac{1}{\\sqrt{3}} \\\\ 0 & \\frac{2}{\\sqrt{6}} & \\frac{1}{\\sqrt{3}} \\\\ \\frac{1}{\\sqrt{2}} & \\frac{1}{\\sqrt{6}} & -\\frac{1}{\\sqrt{3}} \\end{pmatrix}, \\pmb{O}^\\mathrm{T}\\pmb{A}\\pmb{O} = \\begin{pmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & -2 \\end{pmatrix}$"
        },
        {
          sub_id: "(3)",
          stem: "求 $\\pmb{A}$",
          answer: "$\\pmb{A} = \\begin{pmatrix} 0 & -1 & 1 \\\\ -1 & 0 & 1 \\\\ 1 & 1 & 0 \\end{pmatrix}$"
        }
      ]
    },
    solution: {
      answer: "(1) $\\pmb{p}_1 = (1, 0, 1)^\\mathrm{T}, \\pmb{p}_2 = (-1, 2, 1)^\\mathrm{T}$（注：答案不唯一）；\n(2) $\\pmb{O} = \\begin{pmatrix} \\frac{1}{\\sqrt{2}} & -\\frac{1}{\\sqrt{6}} & \\frac{1}{\\sqrt{3}} \\\\ 0 & \\frac{2}{\\sqrt{6}} & \\frac{1}{\\sqrt{3}} \\\\ \\frac{1}{\\sqrt{2}} & \\frac{1}{\\sqrt{6}} & -\\frac{1}{\\sqrt{3}} \\end{pmatrix}, \\pmb{O}^\\mathrm{T}\\pmb{A}\\pmb{O} = \\begin{pmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & -2 \\end{pmatrix}$；\n(3) $\\pmb{A} = \\begin{pmatrix} 0 & -1 & 1 \\\\ -1 & 0 & 1 \\\\ 1 & 1 & 0 \\end{pmatrix}$。",
      hints: "属于二重特征值 1 的特征子空间为与 $\\pmb{p}_3$ 正交的平面 $x_1 + x_2 - x_3 = 0$，在该平面上选取两个正交向量并单位化。",
      steps: "(1) 属于 $\\lambda_1=\\lambda_2=1$ 的特征向量满足 $(\\pmb{p}_3, \\pmb{x}) = 0 \\iff x_1 + x_2 - x_3 = 0$。取 $\\pmb{p}_1 = (1, 0, 1)^\\mathrm{T}$，设 $\\pmb{p}_2 = (y_1, y_2, y_3)^\\mathrm{T}$ 满足该方程且与 $\\pmb{p}_1$ 正交：$y_1 + y_3 = 0 \\implies y_3 = -y_1$，代入平面方程得 $y_1 + y_2 - (-y_1) = 0 \\implies y_2 = -2y_1$。取 $y_1 = -1$，得 $\\pmb{p}_2 = (-1, 2, 1)^\\mathrm{T}$。\n\n(2) 将 $\\pmb{p}_1, \\pmb{p}_2, \\pmb{p}_3$ 分别单位化并按列组成正交矩阵 $\\pmb{O}$，得到对角化形式 $\\pmb{O}^\\mathrm{T}\\pmb{A}\\pmb{O} = \\operatorname{diag}(1, 1, -2)$。\n\n(3) 由 $\\pmb{A} = \\pmb{O}\\operatorname{diag}(1, 1, -2)\\pmb{O}^\\mathrm{T}$ 计算得：\n$$\\pmb{A} = \\begin{pmatrix} 0 & -1 & 1 \\\\ -1 & 0 & 1 \\\\ 1 & 1 & 0 \\end{pmatrix}$$。"
    }
  },
  {
    id: "LAG-TB-CH07-Q18",
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
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 18 题",
      page_start: 181,
      page_end: 181
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 18,
      paper_q_num: 18,
      type: "calc",
      difficulty: 3,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.2",
        section_title: "实对称矩阵的对角化",
        section_slug: "7.2_实对称矩阵的对角化",
        knowledge_points: ["方阵的高次幂", "相似对角化计算矩阵幂"]
      }
    },
    content: {
      stem: "设 $\\pmb{A} = \\begin{pmatrix} 1 & 2 & 2 \\\\ 2 & 1 & 2 \\\\ 2 & 2 & 1 \\end{pmatrix}$，求 $\\pmb{A}^k$（$k$ 为正整数）。"
    },
    solution: {
      answer: "$\\pmb{A}^k = \\frac{1}{3}\\begin{pmatrix} 5^k + 2(-1)^k & 5^k + (-1)^{k+1} & 5^k + (-1)^{k+1} \\\\ 5^k + (-1)^{k+1} & 5^k + 2(-1)^k & 5^k + (-1)^{k+1} \\\\ 5^k + (-1)^{k+1} & 5^k + (-1)^{k+1} & 5^k + 2(-1)^k \\end{pmatrix}$。",
      hints: "求出对称矩阵 $\\pmb{A}$ 的特征值与对应特征向量，利用对角化公式 $\\pmb{A}^k = \\pmb{P}\\pmb{\\Lambda}^k\\pmb{P}^{-1}$ 求解。",
      steps: "计算特征多项式：\n$$|\\lambda\\pmb{E}-\\pmb{A}| = \\begin{vmatrix} \\lambda-1 & -2 & -2 \\\\ -2 & \\lambda-1 & -2 \\\\ -2 & -2 & \\lambda-1 \\end{vmatrix} = (\\lambda+1)^2(\\lambda-5) = 0$$\n特征值为 $\\lambda_1 = \\lambda_2 = -1, \\lambda_3 = 5$。\n对应特征向量：对于 $\\lambda=-1$，基础解系为 $\\pmb{p}_1 = (-1, 1, 0)^\\mathrm{T}, \\pmb{p}_2 = (-1, 0, 1)^\\mathrm{T}$；对于 $\\lambda=5$，特征向量为 $\\pmb{p}_3 = (1, 1, 1)^\\mathrm{T}$。\n令可逆矩阵 $\\pmb{P} = \\begin{pmatrix} -1 & -1 & 1 \\\\ 1 & 0 & 1 \\\\ 0 & 1 & 1 \\end{pmatrix}$，其逆矩阵为 $\\pmb{P}^{-1} = \\frac{1}{3}\\begin{pmatrix} -1 & 2 & -1 \\\\ -1 & -1 & 2 \\\\ 1 & 1 & 1 \\end{pmatrix}$。\n因此：\n$$\\pmb{A}^k = \\pmb{P}\\begin{pmatrix} (-1)^k & 0 & 0 \\\\ 0 & (-1)^k & 0 \\\\ 0 & 0 & 5^k \\end{pmatrix}\\pmb{P}^{-1} = \\frac{1}{3}\\begin{pmatrix} 5^k+2(-1)^k & 5^k+(-1)^{k+1} & 5^k+(-1)^{k+1} \\\\ 5^k+(-1)^{k+1} & 5^k+2(-1)^k & 5^k+(-1)^{k+1} \\\\ 5^k+(-1)^{k+1} & 5^k+(-1)^{k+1} & 5^k+2(-1)^k \\end{pmatrix}$$。"
    }
  },
  {
    id: "LAG-TB-CH07-Q19",
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
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 19 题",
      page_start: 181,
      page_end: 181
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
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.2",
        section_title: "实对称矩阵的对角化",
        section_slug: "7.2_实对称矩阵的对角化",
        knowledge_points: ["幂等矩阵", "实对称矩阵", "正交对角化"]
      }
    },
    content: {
      stem: "试证：若 $\\pmb{A}$ 是秩为 $r$ 的 $n$ 阶实对称矩阵，且 $\\pmb{A}^2 = \\pmb{A}$，则存在正交矩阵 $\\pmb{T}$，使得\n\n$$\\pmb{T}^{-1}\\pmb{A}\\pmb{T} = \\begin{pmatrix} \\pmb{E}_r & \\pmb{O}_1 \\\\ \\pmb{O}_2 & \\pmb{O}_3 \\end{pmatrix}，$$\n\n其中 $\\pmb{O}_1, \\pmb{O}_2, \\pmb{O}_3$ 为零矩阵。"
    },
    solution: {
      answer: "证明略。",
      hints: "实对称矩阵必可正交对角化；利用条件 $\\pmb{A}^2 = \\pmb{A}$ 推出特征值只能为 0 或 1，且非零特征值的重数等于矩阵的秩。",
      steps: "因为 $\\pmb{A}$ 是实对称矩阵，所以存在正交矩阵 $\\pmb{T}$，使得 $\\pmb{T}^{-1}\\pmb{A}\\pmb{T} = \\pmb{\\Lambda} = \\operatorname{diag}(\\lambda_1, \\lambda_2, \\cdots, \\lambda_n)$。\n由 $\\pmb{A}^2 = \\pmb{A}$ 得 $\\pmb{\\Lambda}^2 = \\pmb{\\Lambda}$，即对每个特征值满足 $\\lambda_i^2 = \\lambda_i$，故 $\\lambda_i$ 只能为 1 或 0。\n又因为相似变换保持矩阵的秩不变，有 $\\operatorname{rank}(\\pmb{\\Lambda}) = \\operatorname{rank}(\\pmb{A}) = r$。\n因此对角矩阵 $\\pmb{\\Lambda}$ 主对角线上非零特征值 1 的个数恰好为 $r$ 个，其余 $n-r$ 个特征值全为 0。\n适当调整正交变换矩阵 $\\pmb{T}$ 中列向量的次序，使得特征值 1 全部排在前 $r$ 个位置，即可得到：\n$$\\pmb{T}^{-1}\\pmb{A}\\pmb{T} = \\begin{pmatrix} \\pmb{E}_r & \\pmb{O}_1 \\\\ \\pmb{O}_2 & \\pmb{O}_3 \\end{pmatrix}$$\n命题得证。"
    }
  },
  {
    id: "LAG-TB-CH07-Q20",
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
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 20 题",
      page_start: 181,
      page_end: 181
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
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.2",
        section_title: "实对称矩阵的对角化",
        section_slug: "7.2_实对称矩阵的对角化",
        knowledge_points: ["实对称矩阵正交对角化", "惯性指数", "对合矩阵"]
      }
    },
    content: {
      stem: "试证：若 $\\pmb{A}$ 是 $n$ 阶实对称矩阵，且 $\\pmb{A}^2 = \\pmb{E}$，则存在正交矩阵 $\\pmb{T}$，使得\n\n$$\\pmb{T}^{-1}\\pmb{A}\\pmb{T} = \\begin{pmatrix} \\pmb{E}_p & \\pmb{O}_1 \\\\ \\pmb{O}_2 & -\\pmb{E}_{n-p} \\end{pmatrix}，$$\n\n其中 $\\pmb{O}_1, \\pmb{O}_2$ 为零矩阵，$p$ 为 $\\pmb{A}$ 的正惯性指数。"
    },
    solution: {
      answer: "证明略。",
      hints: "实对称矩阵必可正交对角化，由 $\\pmb{A}^2 = \\pmb{E}$ 确定特征值只能为 $\\pm 1$。",
      steps: "因为 $\\pmb{A}$ 是实对称矩阵，故存在正交矩阵 $\\pmb{T}$，使得 $\\pmb{T}^{-1}\\pmb{A}\\pmb{T} = \\pmb{\\Lambda} = \\operatorname{diag}(\\lambda_1, \\lambda_2, \\cdots, \\lambda_n)$。\n由 $\\pmb{A}^2 = \\pmb{E}$ 得 $\\pmb{\\Lambda}^2 = \\pmb{E}$，即对每个特征值满足 $\\lambda_i^2 = 1$。\n由于实对称矩阵的特征值全部为实数，因此 $\\lambda_i$ 只能为 1 或 $-1$。\n设特征值 1 的个数为 $p$（即 $\\pmb{A}$ 的正惯性指数），则特征值 $-1$ 的个数必为 $n-p$。\n调整正交变换中列向量的次序，使得正特征值排在前 $p$ 位，负特征值排在后 $n-p$ 位，即可得到：\n$$\\pmb{T}^{-1}\\pmb{A}\\pmb{T} = \\begin{pmatrix} \\pmb{E}_p & \\pmb{O}_1 \\\\ \\pmb{O}_2 & -\\pmb{E}_{n-p} \\end{pmatrix}$$\n命题得证。"
    }
  },
  {
    id: "LAG-TB-CH07-Q21",
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
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 21 题",
      page_start: 182,
      page_end: 182
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 21,
      paper_q_num: 21,
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
        knowledge_points: ["实对称矩阵性质", "幂零矩阵", "特征值为零"]
      }
    },
    content: {
      stem: "设 $\\pmb{A}$ 是 $n$ 阶实对称矩阵，且存在正整数 $k$，使得 $\\pmb{A}^k = \\pmb{O}$，其中 $\\pmb{O}$ 为零矩阵（称 $\\pmb{A}$ 为幂零矩阵）。求证：$\\pmb{A} = \\pmb{O}$。"
    },
    solution: {
      answer: "证明略。",
      hints: "实对称矩阵必可正交对角化，结合幂零矩阵的所有特征值均为 0 进行推导。",
      steps: "因为 $\\pmb{A}$ 为实对称矩阵，故存在正交矩阵 $\\pmb{P}$，使得 $\\pmb{P}^{-1}\\pmb{A}\\pmb{P} = \\pmb{\\Lambda} = \\operatorname{diag}(\\lambda_1, \\lambda_2, \\cdots, \\lambda_n)$。\n由 $\\pmb{A}^k = \\pmb{O}$ 得：\n$$\\pmb{\\Lambda}^k = (\\pmb{P}^{-1}\\pmb{A}\\pmb{P})^k = \\pmb{P}^{-1}\\pmb{A}^k\\pmb{P} = \\pmb{P}^{-1}\\pmb{O}\\pmb{P} = \\pmb{O}$$\n因此对角线上每个元素均满足 $\\lambda_i^k = 0 \\implies \\lambda_i = 0 \\quad (i=1, 2, \\cdots, n)$。\n这表明对角矩阵 $\\pmb{\\Lambda} = \\pmb{O}$ 为零矩阵。\n从而：\n$$\\pmb{A} = \\pmb{P}\\pmb{\\Lambda}\\pmb{P}^{-1} = \\pmb{P}\\pmb{O}\\pmb{P}^{-1} = \\pmb{O}$$\n命题得证。"
    }
  },
  {
    id: "LAG-TB-CH07-Q22",
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
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 22 题",
      page_start: 182,
      page_end: 182
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 22,
      paper_q_num: 22,
      type: "calc",
      difficulty: 1,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.3",
        section_title: "实二次型及其标准形",
        section_slug: "7.3_实二次型及其标准形",
        knowledge_points: ["二次型的矩阵表示", "二次型的对称矩阵"]
      }
    },
    content: {
      stem: "写出下列二次型的矩阵表示式：\n\n(1) $f(x, y) = x^2 - 4xy + 3y^2$；\n\n(2) $f(x, y, z) = xy + xz - yz$；\n\n(3) $f(x_1, x_2, x_3) = x_1^2 + 2x_1x_2 + x_2^2 - x_3^2 - 4x_1x_3$；\n\n(4) $f(x_1, x_2, x_3, x_4) = 3x_1^2 - 2x_1x_2 + 4x_1x_4 - 5x_2^2 - 6x_2x_3 + x_3^2 - 8x_3x_4 - 7x_4^2$；\n\n(5) $f(x_1, x_2, \\cdots, x_n) = \\sum_{i=1}^{n-1}\\sum_{j=i+1}^n 2x_ix_j$。",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "$f(x, y) = x^2 - 4xy + 3y^2$",
          answer: "$f = \\pmb{\\tilde{x}}^\\mathrm{T}\\pmb{A}\\pmb{\\tilde{x}}, \\pmb{\\tilde{x}}=(x, y)^\\mathrm{T}, \\pmb{A} = \\begin{pmatrix} 1 & -2 \\\\ -2 & 3 \\end{pmatrix}$"
        },
        {
          sub_id: "(2)",
          stem: "$f(x, y, z) = xy + xz - yz$",
          answer: "$f = \\pmb{\\tilde{x}}^\\mathrm{T}\\pmb{A}\\pmb{\\tilde{x}}, \\pmb{\\tilde{x}}=(x, y, z)^\\mathrm{T}, \\pmb{A} = \\begin{pmatrix} 0 & \\frac{1}{2} & \\frac{1}{2} \\\\ \\frac{1}{2} & 0 & -\\frac{1}{2} \\\\ \\frac{1}{2} & -\\frac{1}{2} & 0 \\end{pmatrix}$"
        },
        {
          sub_id: "(3)",
          stem: "$f(x_1, x_2, x_3) = x_1^2 + 2x_1x_2 + x_2^2 - x_3^2 - 4x_1x_3$",
          answer: "$f = \\pmb{x}^\\mathrm{T}\\pmb{A}\\pmb{x}, \\pmb{x}=(x_1, x_2, x_3)^\\mathrm{T}, \\pmb{A} = \\begin{pmatrix} 1 & 1 & -2 \\\\ 1 & 1 & 0 \\\\ -2 & 0 & -1 \\end{pmatrix}$"
        },
        {
          sub_id: "(4)",
          stem: "$f(x_1, x_2, x_3, x_4) = 3x_1^2 - 2x_1x_2 + 4x_1x_4 - 5x_2^2 - 6x_2x_3 + x_3^2 - 8x_3x_4 - 7x_4^2$",
          answer: "$f = \\pmb{x}^\\mathrm{T}\\pmb{A}\\pmb{x}, \\pmb{x}=(x_1, x_2, x_3, x_4)^\\mathrm{T}, \\pmb{A} = \\begin{pmatrix} 3 & -1 & 0 & 2 \\\\ -1 & -5 & -3 & 0 \\\\ 0 & -3 & 1 & -4 \\\\ 2 & 0 & -4 & -7 \\end{pmatrix}$"
        },
        {
          sub_id: "(5)",
          stem: "$f(x_1, x_2, \\cdots, x_n) = \\sum_{i=1}^{n-1}\\sum_{j=i+1}^n 2x_ix_j$",
          answer: "$f = \\pmb{x}^\\mathrm{T}\\pmb{A}\\pmb{x}, \\pmb{x}=(x_1, x_2, \\cdots, x_n)^\\mathrm{T}, \\pmb{A}$ 是主对角线上元素为 0，其余元素全为 1 的 $n$ 阶对称矩阵"
        }
      ]
    },
    solution: {
      answer: "(1) $f = \\pmb{\\tilde{x}}^\\mathrm{T}\\pmb{A}\\pmb{\\tilde{x}}, \\pmb{\\tilde{x}}=(x, y)^\\mathrm{T}, \\pmb{A} = \\begin{pmatrix} 1 & -2 \\\\ -2 & 3 \\end{pmatrix}$；\n(2) $f = \\pmb{\\tilde{x}}^\\mathrm{T}\\pmb{A}\\pmb{\\tilde{x}}, \\pmb{\\tilde{x}}=(x, y, z)^\\mathrm{T}, \\pmb{A} = \\begin{pmatrix} 0 & \\frac{1}{2} & \\frac{1}{2} \\\\ \\frac{1}{2} & 0 & -\\frac{1}{2} \\\\ \\frac{1}{2} & -\\frac{1}{2} & 0 \\end{pmatrix}$；\n(3) $f = \\pmb{x}^\\mathrm{T}\\pmb{A}\\pmb{x}, \\pmb{x}=(x_1, x_2, x_3)^\\mathrm{T}, \\pmb{A} = \\begin{pmatrix} 1 & 1 & -2 \\\\ 1 & 1 & 0 \\\\ -2 & 0 & -1 \\end{pmatrix}$；\n(4) $f = \\pmb{x}^\\mathrm{T}\\pmb{A}\\pmb{x}, \\pmb{x}=(x_1, x_2, x_3, x_4)^\\mathrm{T}, \\pmb{A} = \\begin{pmatrix} 3 & -1 & 0 & 2 \\\\ -1 & -5 & -3 & 0 \\\\ 0 & -3 & 1 & -4 \\\\ 2 & 0 & -4 & -7 \\end{pmatrix}$；\n(5) $f = \\pmb{x}^\\mathrm{T}\\pmb{A}\\pmb{x}, \\pmb{x}=(x_1, x_2, \\cdots, x_n)^\\mathrm{T}, \\pmb{A}$ 是主对角线上元素为 0，其余元素全为 1 的 $n$ 阶对称矩阵。",
      hints: "二次型矩阵的主对角线元素 $a_{ii}$ 等于平方项 $x_i^2$ 的系数，非对角线元素 $a_{ij} = a_{ji}$ 等于交叉项 $x_i x_j$ 系数的一半。",
      steps: "直接根据二次型对称矩阵的定义，将各平方项系数放在主对角线，交叉项系数平分置于对应对称位置即可写出对应的对称矩阵 $\\pmb{A}$。"
    }
  },
  {
    id: "LAG-TB-CH07-Q23",
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
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 23 题",
      page_start: 182,
      page_end: 182
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 23,
      paper_q_num: 23,
      type: "calc",
      difficulty: 1,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.3",
        section_title: "实二次型及其标准形",
        section_slug: "7.3_实二次型及其标准形",
        knowledge_points: ["对称矩阵对应的二次型", "二次型代数表达式"]
      }
    },
    content: {
      stem: "写出下列对称矩阵 $\\pmb{A}$ 对应的二次型 $f$：\n\n(1) $\\pmb{A} = \\begin{pmatrix} a & b \\\\ b & d \\end{pmatrix}$；\n\n(2) $\\pmb{A} = \\begin{pmatrix} 1 & 1 & 0 \\\\ 1 & -1 & 2 \\\\ 0 & 2 & 0 \\end{pmatrix}$；\n\n(3) $\\pmb{A} = \\begin{pmatrix} -1 & 1 & -3 \\\\ 1 & -2 & 0 \\\\ -3 & 0 & 4 \\end{pmatrix}$；\n\n(4) $\\pmb{A} = \\begin{pmatrix} -1 & \\frac{1}{2} & 1 & -2 \\\\ \\frac{1}{2} & 3 & 3 & -1 \\\\ 1 & 3 & 0 & \\frac{3}{2} \\\\ -2 & -1 & \\frac{3}{2} & -2 \\end{pmatrix}$。",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "$\\pmb{A} = \\begin{pmatrix} a & b \\\\ b & d \\end{pmatrix}$",
          answer: "$f(x_1, x_2) = ax_1^2 + 2bx_1x_2 + dx_2^2$"
        },
        {
          sub_id: "(2)",
          stem: "$\\pmb{A} = \\begin{pmatrix} 1 & 1 & 0 \\\\ 1 & -1 & 2 \\\\ 0 & 2 & 0 \\end{pmatrix}$",
          answer: "$f(x_1, x_2, x_3) = x_1^2 - x_2^2 + 2x_1x_2 + 4x_2x_3$"
        },
        {
          sub_id: "(3)",
          stem: "$\\pmb{A} = \\begin{pmatrix} -1 & 1 & -3 \\\\ 1 & -2 & 0 \\\\ -3 & 0 & 4 \\end{pmatrix}$",
          answer: "$f(x_1, x_2, x_3) = -x_1^2 - 2x_2^2 + 4x_3^2 + 2x_1x_2 - 6x_1x_3$"
        },
        {
          sub_id: "(4)",
          stem: "$\\pmb{A} = \\begin{pmatrix} -1 & \\frac{1}{2} & 1 & -2 \\\\ \\frac{1}{2} & 3 & 3 & -1 \\\\ 1 & 3 & 0 & \\frac{3}{2} \\\\ -2 & -1 & \\frac{3}{2} & -2 \\end{pmatrix}$",
          answer: "$f(x_1, x_2, x_3, x_4) = -x_1^2 + 3x_2^2 - 2x_4^2 + x_1x_2 + 2x_1x_3 - 4x_1x_4 + 6x_2x_3 - 2x_2x_4 + 3x_3x_4$"
        }
      ]
    },
    solution: {
      answer: "(1) $f(x_1, x_2) = ax_1^2 + 2bx_1x_2 + dx_2^2$；\n(2) $f(x_1, x_2, x_3) = x_1^2 - x_2^2 + 2x_1x_2 + 4x_2x_3$；\n(3) $f(x_1, x_2, x_3) = -x_1^2 - 2x_2^2 + 4x_3^2 + 2x_1x_2 - 6x_1x_3$；\n(4) $f(x_1, x_2, x_3, x_4) = -x_1^2 + 3x_2^2 - 2x_4^2 + x_1x_2 + 2x_1x_3 - 4x_1x_4 + 6x_2x_3 - 2x_2x_4 + 3x_3x_4$。",
      hints: "由定义 $f = \\pmb{x}^\\mathrm{T}\\pmb{A}\\pmb{x} = \\sum_{i=1}^n a_{ii}x_i^2 + 2\\sum_{1 \\le i < j \\le n} a_{ij}x_i x_j$ 直接展开。",
      steps: "按照矩阵对角线元素作为平方项系数、非对角线元素加倍后作为交叉项系数展开即可得到二次型代数多项式。"
    }
  },
  {
    id: "LAG-TB-CH07-Q24",
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
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 24 题",
      page_start: 182,
      page_end: 182
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
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.3",
        section_title: "实二次型及其标准形",
        section_slug: "7.3_实二次型及其标准形",
        knowledge_points: ["正交变换法化二次型为标准形", "实对称矩阵正交化"]
      }
    },
    content: {
      stem: "用正交变换将下列二次型化为标准形，并求出所做的正交变换：\n\n(1) $f(x_1, x_2, x_3) = 2x_1^2 + 3x_2^2 + 3x_3^2 + 4x_2x_3$；\n\n(2) $f(x_1, x_2, x_3) = x_1^2 - 2x_2^2 + x_3^2 + 4x_1x_2 + 8x_1x_3 + 4x_2x_3$。",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "$f(x_1, x_2, x_3) = 2x_1^2 + 3x_2^2 + 3x_3^2 + 4x_2x_3$",
          answer: "做正交变换 $\\pmb{x} = \\pmb{O}\\pmb{y}, \\pmb{O} = \\begin{pmatrix} 1 & 0 & 0 \\\\ 0 & -\\frac{\\sqrt{2}}{2} & \\frac{\\sqrt{2}}{2} \\\\ 0 & \\frac{\\sqrt{2}}{2} & \\frac{\\sqrt{2}}{2} \\end{pmatrix}$，标准形为 $f = 2y_1^2 + y_2^2 + 5y_3^2$"
        },
        {
          sub_id: "(2)",
          stem: "$f(x_1, x_2, x_3) = x_1^2 - 2x_2^2 + x_3^2 + 4x_1x_2 + 8x_1x_3 + 4x_2x_3$",
          answer: "做正交变换 $\\pmb{x} = \\pmb{O}\\pmb{y}, \\pmb{O} = \\begin{pmatrix} \\frac{\\sqrt{2}}{2} & \\frac{\\sqrt{2}}{6} & \\frac{2}{3} \\\\ 0 & -\\frac{2\\sqrt{2}}{3} & \\frac{1}{3} \\\\ -\\frac{\\sqrt{2}}{2} & \\frac{\\sqrt{2}}{6} & \\frac{2}{3} \\end{pmatrix}$，标准形为 $f = -3y_1^2 - 3y_2^2 + 6y_3^2$"
        }
      ]
    },
    solution: {
      answer: "(1) 做正交变换 $\\pmb{x} = \\pmb{O}\\pmb{y}, \\pmb{x} = (x_1, x_2, x_3)^\\mathrm{T}, \\pmb{y} = (y_1, y_2, y_3)^\\mathrm{T}$，其中 $\\pmb{O} = \\begin{pmatrix} 1 & 0 & 0 \\\\ 0 & -\\frac{\\sqrt{2}}{2} & \\frac{\\sqrt{2}}{2} \\\\ 0 & \\frac{\\sqrt{2}}{2} & \\frac{\\sqrt{2}}{2} \\end{pmatrix}$，标准形为 $f = 2y_1^2 + y_2^2 + 5y_3^2$；\n(2) 做正交变换 $\\pmb{x} = \\pmb{O}\\pmb{y}, \\pmb{x} = (x_1, x_2, x_3)^\\mathrm{T}, \\pmb{y} = (y_1, y_2, y_3)^\\mathrm{T}$，其中 $\\pmb{O} = \\begin{pmatrix} \\frac{\\sqrt{2}}{2} & \\frac{\\sqrt{2}}{6} & \\frac{2}{3} \\\\ 0 & -\\frac{2\\sqrt{2}}{3} & \\frac{1}{3} \\\\ -\\frac{\\sqrt{2}}{2} & \\frac{\\sqrt{2}}{6} & \\frac{2}{3} \\end{pmatrix}$，标准形为 $f = -3y_1^2 - 3y_2^2 + 6y_3^2$。",
      hints: "写出二次型的对称矩阵 $\\pmb{A}$，求其全部特征值及两两正交的单位特征向量构成正交矩阵 $\\pmb{O}$。",
      steps: "(1) 二次型矩阵为 $\\pmb{A} = \\begin{pmatrix} 2 & 0 & 0 \\\\ 0 & 3 & 2 \\\\ 0 & 2 & 3 \\end{pmatrix}$，特征值为 $\\lambda_1=2, \\lambda_2=1, \\lambda_3=5$。求对应特征向量单位化得到正交变换矩阵 $\\pmb{O}$，标准形为 $f = 2y_1^2 + y_2^2 + 5y_3^2$。\n\n(2) 二次型矩阵为 $\\pmb{A} = \\begin{pmatrix} 1 & 2 & 4 \\\\ 2 & -2 & 2 \\\\ 4 & 2 & 1 \\end{pmatrix}$，特征值为 $\\lambda_1=\\lambda_2=-3, \\lambda_3=6$。对二重根求相互正交的特征向量并单位化，组合得到正交矩阵 $\\pmb{O}$，标准形为 $f = -3y_1^2 - 3y_2^2 + 6y_3^2$。"
    }
  },
  {
    id: "LAG-TB-CH07-Q25",
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
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 25 题",
      page_start: 182,
      page_end: 182
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 25,
      paper_q_num: 25,
      type: "calc",
      difficulty: 2,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.3",
        section_title: "实二次型及其标准形",
        section_slug: "7.3_实二次型及其标准形",
        knowledge_points: ["正交变换保迹与特征值", "二次型标准形"]
      }
    },
    content: {
      stem: "已知实二次型 $f = a(x_1^2 + x_2^2 + x_3^2) + 4(x_1x_2 + x_1x_3 + x_2x_3)$，经过某个正交变换后，$f$ 可化成标准形 $f = 6y_1^2$，求 $a$ 的值。"
    },
    solution: {
      answer: "$a = 2$。",
      hints: "正交变换保持实对称矩阵的迹不变，即矩阵对角线元素之和等于全体特征值之和。",
      steps: "二次型 $f$ 的对称矩阵为：\n$$\\pmb{A} = \\begin{pmatrix} a & 2 & 2 \\\\ 2 & a & 2 \\\\ 2 & 2 & a \\end{pmatrix}$$\n已知经正交变换后标准形为 $f = 6y_1^2 + 0y_2^2 + 0y_3^2$，说明 $\\pmb{A}$ 的三个特征值为 $\\lambda_1 = 6, \\lambda_2 = 0, \\lambda_3 = 0$。\n因为正交相似变换保持矩阵的迹不变，所以：\n$$\\operatorname{tr}(\\pmb{A}) = a + a + a = 3a = \\lambda_1 + \\lambda_2 + \\lambda_3 = 6 + 0 + 0 = 6$$\n解得 $a = 2$。"
    }
  },
  {
    id: "LAG-TB-CH07-Q26",
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
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 26 题",
      page_start: 182,
      page_end: 182
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 26,
      paper_q_num: 26,
      type: "calc",
      difficulty: 3,
      score: 10
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.3",
        section_title: "实二次型及其标准形",
        section_slug: "7.3_实二次型及其标准形",
        knowledge_points: ["二次型矩阵特征值与迹", "正交变换化标准形", "二次型规范形"]
      }
    },
    content: {
      stem: "设二次型 $f(x_1, x_2, x_3) = \\pmb{x}^\\mathrm{T}\\pmb{A}\\pmb{x} = ax_1^2 + 2x_2^2 - 2x_3^2 + 2bx_1x_3 \\quad (b > 0)$。已知 $f$ 的矩阵 $\\pmb{A}$ 的特征值之和为 1，特征值之积为 $-12$。\n\n(1) 求 $a$ 和 $b$ 的值；\n\n(2) 求正交变换 $\\pmb{x} = \\pmb{O}\\pmb{y}$，将 $f$ 化为标准形；\n\n(3) 写出 $f$ 的规范形。",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "求 $a$ 和 $b$ 的值",
          answer: "$a = 1, b = 2$"
        },
        {
          sub_id: "(2)",
          stem: "求正交变换 $\\pmb{x} = \\pmb{O}\\pmb{y}$，将 $f$ 化为标准形",
          answer: "$\\pmb{O} = \\frac{\\sqrt{5}}{5}\\begin{pmatrix} 1 & 0 & 2 \\\\ 0 & \\sqrt{5} & 0 \\\\ -2 & 0 & 1 \\end{pmatrix}$，标准形为 $f = -3y_1^2 + 2y_2^2 + 2y_3^2$"
        },
        {
          sub_id: "(3)",
          stem: "写出 $f$ 的规范形",
          answer: "$f = z_1^2 + z_2^2 - z_3^2$"
        }
      ]
    },
    solution: {
      answer: "(1) $a = 1, b = 2$；\n(2) $\\pmb{O} = \\frac{\\sqrt{5}}{5}\\begin{pmatrix} 1 & 0 & 2 \\\\ 0 & \\sqrt{5} & 0 \\\\ -2 & 0 & 1 \\end{pmatrix}$，标准形为 $f = -3y_1^2 + 2y_2^2 + 2y_3^2$；\n(3) $f = z_1^2 + z_2^2 - z_3^2$。",
      hints: "利用特征值之和等于迹 $\\operatorname{tr}(\\pmb{A})$，特征值之积等于行列式 $|\\pmb{A}|$ 求出 $a, b$；再求特征值及正交变换矩阵。",
      steps: "(1) 二次型矩阵为 $\\pmb{A} = \\begin{pmatrix} a & 0 & b \\\\ 0 & 2 & 0 \\\\ b & 0 & -2 \\end{pmatrix}$。\n由特征值之和等于迹得：$\\operatorname{tr}(\\pmb{A}) = a + 2 - 2 = a = 1$。\n由特征值之积等于行列式得：$|\\pmb{A}| = 2(-2a - b^2) = 2(-2 - b^2) = -12 \\implies 2 + b^2 = 6 \\implies b^2 = 4$。\n因为 $b > 0$，所以 $b = 2$。\n\n(2) 将 $a=1, b=2$ 代入得 $\\pmb{A} = \\begin{pmatrix} 1 & 0 & 2 \\\\ 0 & 2 & 0 \\\\ 2 & 0 & -2 \\end{pmatrix}$。\n计算特征多项式得特征值为 $\\lambda_1 = -3, \\lambda_2 = \\lambda_3 = 2$。\n对应正交特征向量单位化后组合为 $\\pmb{O} = \\frac{\\sqrt{5}}{5}\\begin{pmatrix} 1 & 0 & 2 \\\\ 0 & \\sqrt{5} & 0 \\\\ -2 & 0 & 1 \\end{pmatrix}$，标准形为 $f = -3y_1^2 + 2y_2^2 + 2y_3^2$。\n\n(3) 二次型有两个正特征值、一个负特征值，正惯性指数 $p=2$，负惯性指数 $q=1$，故规范形为 $f = z_1^2 + z_2^2 - z_3^2$。"
    }
  },
  {
    id: "LAG-TB-CH07-Q27",
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
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 27 题",
      page_start: 182,
      page_end: 182
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
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.3",
        section_title: "实二次型及其标准形",
        section_slug: "7.3_实二次型及其标准形",
        knowledge_points: ["特征值与特征向量定义", "正交变换化二次型为标准形", "特征向量正交扩充"]
      }
    },
    content: {
      stem: "已知 $\\pmb{\\beta} = \\left(\\frac{1}{\\sqrt{2}}, -\\frac{1}{\\sqrt{2}}, 0\\right)^\\mathrm{T}$ 是对称矩阵 $\\pmb{A} = \\begin{pmatrix} 4 & 2 & a \\\\ 2 & 4 & 2 \\\\ a & 2 & 4 \\end{pmatrix}$ 的单位特征向量。\n\n(1) 求 $a$，并求 $\\pmb{\\beta}$ 对应的特征值 $\\lambda$；\n\n(2) 求以 $\\pmb{\\beta}$ 为第 1 列的正交矩阵 $\\pmb{P}$，使得在正交变换 $\\pmb{x} = \\pmb{P}\\pmb{y}$ 下，二次型 $f = \\pmb{x}^\\mathrm{T}\\pmb{A}\\pmb{x}$ 化为标准形，并写出标准形，其中 $\\pmb{x} = (x_1, x_2, x_3)^\\mathrm{T}, \\pmb{y} = (y_1, y_2, y_3)^\\mathrm{T}$。",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "求 $a$，并求 $\\pmb{\\beta}$ 对应的特征值 $\\lambda$",
          answer: "$a = 2, \\lambda = 2$"
        },
        {
          sub_id: "(2)",
          stem: "求以 $\\pmb{\\beta}$ 为第 1 列的正交矩阵 $\\pmb{P}$，使得在正交变换 $\\pmb{x} = \\pmb{P}\\pmb{y}$ 下，二次型 $f = \\pmb{x}^\\mathrm{T}\\pmb{A}\\pmb{x}$ 化为标准形，并写出标准形",
          answer: "$\\pmb{P} = \\begin{pmatrix} \\frac{1}{\\sqrt{2}} & \\frac{1}{\\sqrt{6}} & \\frac{1}{\\sqrt{3}} \\\\ -\\frac{1}{\\sqrt{2}} & \\frac{1}{\\sqrt{6}} & \\frac{1}{\\sqrt{3}} \\\\ 0 & -\\frac{2}{\\sqrt{6}} & \\frac{1}{\\sqrt{3}} \\end{pmatrix}$，标准形为 $f = 2y_1^2 + 2y_2^2 + 8y_3^2$"
        }
      ]
    },
    solution: {
      answer: "(1) $a = 2, \\lambda = 2$；\n(2) $\\pmb{P} = \\begin{pmatrix} \\frac{1}{\\sqrt{2}} & \\frac{1}{\\sqrt{6}} & \\frac{1}{\\sqrt{3}} \\\\ -\\frac{1}{\\sqrt{2}} & \\frac{1}{\\sqrt{6}} & \\frac{1}{\\sqrt{3}} \\\\ 0 & -\\frac{2}{\\sqrt{6}} & \\frac{1}{\\sqrt{3}} \\end{pmatrix}$，标准形为 $f = 2y_1^2 + 2y_2^2 + 8y_3^2$。",
      hints: "根据特征向量的定义 $\\pmb{A}\\pmb{\\beta} = \\lambda\\pmb{\\beta}$ 求出 $a$ 和 $\\lambda$，再求解其余特征值和正交特征向量。",
      steps: "(1) 由 $\\pmb{A}\\pmb{\\beta} = \\lambda\\pmb{\\beta}$：\n$$\\begin{pmatrix} 4 & 2 & a \\\\ 2 & 4 & 2 \\\\ a & 2 & 4 \\end{pmatrix} \\begin{pmatrix} 1/\\sqrt{2} \\\\ -1/\\sqrt{2} \\\\ 0 \\end{pmatrix} = \\begin{pmatrix} \\sqrt{2} \\\\ -\\sqrt{2} \\\\ (a-2)/\\sqrt{2} \\end{pmatrix} = \\lambda \\begin{pmatrix} 1/\\sqrt{2} \\\\ -1/\\sqrt{2} \\\\ 0 \\end{pmatrix}$$\n比较分量得 $\\lambda = 2$，且 $(a-2)/\\sqrt{2} = 0 \\implies a = 2$。\n\n(2) 当 $a=2$ 时，特征方程为 $(\\lambda-2)^2(\\lambda-8) = 0$。\n特征值为 $\\lambda_1 = \\lambda_2 = 2, \\lambda_3 = 8$。\n已知第 1 列 $\\pmb{p}_1 = \\pmb{\\beta} = \\left(\\frac{1}{\\sqrt{2}}, -\\frac{1}{\\sqrt{2}}, 0\\right)^\\mathrm{T}$。\n属于 $\\lambda=2$ 且与 $\\pmb{p}_1$ 正交的单位特征向量为 $\\pmb{p}_2 = \\left(\\frac{1}{\\sqrt{6}}, \\frac{1}{\\sqrt{6}}, -\\frac{2}{\\sqrt{6}}\\right)^\\mathrm{T}$；\n属于 $\\lambda=8$ 的单位特征向量为 $\\pmb{p}_3 = \\left(\\frac{1}{\\sqrt{3}}, \\frac{1}{\\sqrt{3}}, \\frac{1}{\\sqrt{3}}\\right)^\\mathrm{T}$。\n组合得正交矩阵 $\\pmb{P}$，标准形为 $f = 2y_1^2 + 2y_2^2 + 8y_3^2$。"
    }
  },
  {
    id: "LAG-TB-CH07-Q28",
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
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 28 题",
      page_start: 182,
      page_end: 182
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 28,
      paper_q_num: 28,
      type: "calc",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.3",
        section_title: "实二次型及其标准形",
        section_slug: "7.3_实二次型及其标准形",
        knowledge_points: ["配方法化二次型为标准形", "可逆线性变换矩阵"]
      }
    },
    content: {
      stem: "用配方法将下列二次型化为标准形，并求出所做的可逆线性变换：\n\n(1) $f(x_1, x_2, x_3) = x_1^2 + 2x_2^2 + 2x_1x_2 - 2x_1x_3$；\n\n(2) $f(x_1, x_2, x_3) = x_1x_2 + x_1x_3 + x_2x_3$；\n\n(3) $f(x_1, x_2, x_3) = x_1^2 + 3x_2^2 + x_3^2 + 4x_1x_2 + 2x_1x_3 + 2x_2x_3$。",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "$f(x_1, x_2, x_3) = x_1^2 + 2x_2^2 + 2x_1x_2 - 2x_1x_3$",
          answer: "可逆线性变换 $\\pmb{x} = \\pmb{C}\\pmb{y}, \\pmb{C} = \\begin{pmatrix} 1 & -1 & 2 \\\\ 0 & 1 & -1 \\\\ 0 & 0 & 1 \\end{pmatrix}$，标准形为 $f = y_1^2 + y_2^2 - 2y_3^2$"
        },
        {
          sub_id: "(2)",
          stem: "$f(x_1, x_2, x_3) = x_1x_2 + x_1x_3 + x_2x_3$",
          answer: "可逆线性变换 $\\pmb{x} = \\pmb{C}\\pmb{y}, \\pmb{C} = \\begin{pmatrix} 1 & 1 & -1 \\\\ 1 & -1 & -1 \\\\ 0 & 0 & 1 \\end{pmatrix}$，标准形为 $f = y_1^2 - y_2^2 - y_3^2$"
        },
        {
          sub_id: "(3)",
          stem: "$f(x_1, x_2, x_3) = x_1^2 + 3x_2^2 + x_3^2 + 4x_1x_2 + 2x_1x_3 + 2x_2x_3$",
          answer: "可逆线性变换 $\\pmb{x} = \\pmb{C}\\pmb{y}, \\pmb{C} = \\begin{pmatrix} 1 & -2 & 1 \\\\ 0 & 1 & -1 \\\\ 0 & 0 & 1 \\end{pmatrix}$，标准形为 $f = y_1^2 - y_2^2 + y_3^2$"
        }
      ]
    },
    solution: {
      answer: "(1) 做可逆线性变换 $\\pmb{x} = \\pmb{C}\\pmb{y}, \\pmb{C} = \\begin{pmatrix} 1 & -1 & 2 \\\\ 0 & 1 & -1 \\\\ 0 & 0 & 1 \\end{pmatrix}$，标准形为 $f = y_1^2 + y_2^2 - 2y_3^2$；\n(2) 做可逆线性变换 $\\pmb{x} = \\pmb{C}\\pmb{y}, \\pmb{C} = \\begin{pmatrix} 1 & 1 & -1 \\\\ 1 & -1 & -1 \\\\ 0 & 0 & 1 \\end{pmatrix}$，标准形为 $f = y_1^2 - y_2^2 - y_3^2$；\n(3) 做可逆线性变换 $\\pmb{x} = \\pmb{C}\\pmb{y}, \\pmb{C} = \\begin{pmatrix} 1 & -2 & 1 \\\\ 0 & 1 & -1 \\\\ 0 & 0 & 1 \\end{pmatrix}$，标准形为 $f = y_1^2 - y_2^2 + y_3^2$。",
      hints: "通过拉格朗日配方法将含某个变元的项集中配方，设配方后的各一次齐次式为新坐标变元，反解得到变换矩阵 $\\pmb{C}$。",
      steps: "(1) $f = (x_1 + x_2 - x_3)^2 + x_2^2 + 2x_2x_3 - x_3^2 = (x_1 + x_2 - x_3)^2 + (x_2 + x_3)^2 - 2x_3^2$。令 $y_1 = x_1 + x_2 - x_3, y_2 = x_2 + x_3, y_3 = x_3$，反解得 $\\pmb{x} = \\pmb{C}\\pmb{y}, \\pmb{C} = \\begin{pmatrix} 1 & -1 & 2 \\\\ 0 & 1 & -1 \\\\ 0 & 0 & 1 \\end{pmatrix}$，标准形为 $f = y_1^2 + y_2^2 - 2y_3^2$。\n\n(2) 原式无平方项，先作非退化变换 $x_1 = u_1 + u_2, x_2 = u_1 - u_2, x_3 = u_3$，代入配方得 $f = y_1^2 - y_2^2 - y_3^2$，变换矩阵为 $\\pmb{C} = \\begin{pmatrix} 1 & 1 & -1 \\\\ 1 & -1 & -1 \\\\ 0 & 0 & 1 \\end{pmatrix}$。\n\n(3) $f = (x_1 + 2x_2 + x_3)^2 - (x_2 + x_3)^2 + x_3^2$。令 $y_1 = x_1 + 2x_2 + x_3, y_2 = x_2 + x_3, y_3 = x_3$，反解得 $\\pmb{C} = \\begin{pmatrix} 1 & -2 & 1 \\\\ 0 & 1 & -1 \\\\ 0 & 0 & 1 \\end{pmatrix}$，标准形为 $f = y_1^2 - y_2^2 + y_3^2$。"
    }
  }
];
