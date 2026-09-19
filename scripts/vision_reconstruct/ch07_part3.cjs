// scripts/vision_reconstruct/ch07_part3.cjs
module.exports = [
  {
    id: "LAG-TB-CH07-Q29",
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
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 29 题",
      page_start: 183,
      page_end: 183
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 29,
      paper_q_num: 29,
      type: "calc",
      difficulty: 3,
      score: 10
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.4",
        section_title: "实二次型的规范形",
        section_slug: "7.4_实二次型的规范形",
        knowledge_points: ["惯性定理", "二次型规范形", "正负惯性指数"]
      }
    },
    content: {
      stem: "写出下列二次型的规范形：\n\n(1) $f(x_1, x_2, x_3) = x_1^2 - x_2^2 - x_3^2 - 2x_1 x_2 + 2x_1 x_3 + 2x_2 x_3$；\n\n(2) $f(x_1, x_2, x_3) = x_1 x_2 - 2x_1 x_3 + 2x_2 x_3$；\n\n(3) $f(x_1, x_2, x_3) = x_1^2 + 2x_2^2 + 2x_3^2 - 2x_1 x_2 + 2x_1 x_3 - 4x_2 x_3$。",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "写出二次型 $f(x_1, x_2, x_3) = x_1^2 - x_2^2 - x_3^2 - 2x_1 x_2 + 2x_1 x_3 + 2x_2 x_3$ 的规范形",
          answer: "$f = z_1^2 - z_2^2$"
        },
        {
          sub_id: "(2)",
          stem: "写出二次型 $f(x_1, x_2, x_3) = x_1 x_2 - 2x_1 x_3 + 2x_2 x_3$ 的规范形",
          answer: "$f = z_1^2 + z_2^2 - z_3^2$"
        },
        {
          sub_id: "(3)",
          stem: "写出二次型 $f(x_1, x_2, x_3) = x_1^2 + 2x_2^2 + 2x_3^2 - 2x_1 x_2 + 2x_1 x_3 - 4x_2 x_3$ 的规范形",
          answer: "$f = z_1^2 + z_2^2$"
        }
      ]
    },
    solution: {
      answer: "(1) $f = z_1^2 - z_2^2$；\n(2) $f = z_1^2 + z_2^2 - z_3^2$；\n(3) $f = z_1^2 + z_2^2$。",
      hints: "先用配方法或特征值法求出正、负惯性指数 $p, q$，再根据惯性定理写出规范形 $f = z_1^2 + \\cdots + z_p^2 - z_{p+1}^2 - \\cdots - z_{p+q}^2$。",
      steps: "(1) 配方：\n$$\\begin{aligned} f &= (x_1 - x_2 + x_3)^2 - 2x_2^2 + 4x_2 x_3 - 2x_3^2 \\\\ &= (x_1 - x_2 + x_3)^2 - 2(x_2 - x_3)^2 \\end{aligned}$$\n正惯性指数 $p = 1$，负惯性指数 $q = 1$，秩 $r = 2$。故规范形为 $f = z_1^2 - z_2^2$。\n\n(2) 令 $x_1 = u_1 + u_2, x_2 = u_1 - u_2, x_3 = u_3$，经可逆变换后配方可得 $p = 2, q = 1$（秩为 3）。故规范形为 $f = z_1^2 + z_2^2 - z_3^2$。\n\n(3) 配方：\n$$\\begin{aligned} f &= (x_1 - x_2 + x_3)^2 + x_2^2 - 2x_2 x_3 + x_3^2 \\\\ &= (x_1 - x_2 + x_3)^2 + (x_2 - x_3)^2 \\end{aligned}$$\n正惯性指数 $p = 2$，负惯性指数 $q = 0$，秩 $r = 2$。故规范形为 $f = z_1^2 + z_2^2$。"
    }
  },
  {
    id: "LAG-TB-CH07-Q30",
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
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 30 题",
      page_start: 183,
      page_end: 183
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 30,
      paper_q_num: 30,
      type: "judge",
      difficulty: 3,
      score: 12
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.5",
        section_title: "正定二次型与正定矩阵",
        section_slug: "7.5_正定二次型与正定矩阵",
        knowledge_points: ["正定二次型判定", "顺序主子式", "赫尔维茨判据"]
      }
    },
    content: {
      stem: "判定下列二次型是否为正定二次型：\n\n(1) $f(x_1, x_2, x_3) = 2x_1^2 + 2x_1 x_2 - 2x_1 x_3 - 6x_2^2 - 4x_2 x_3 - x_3^2$；\n\n(2) $f(x_1, x_2, x_3) = 2x_1^2 + 2x_1 x_2 + 4x_1 x_3 + 2x_2^2 + 2x_2 x_3 + 3x_3^2$；\n\n(3) $f(x_1, x_2, x_3) = 2x_1^2 + 2x_1 x_2 - 4x_1 x_3 + 2x_2^2 - 2x_2 x_3 + 5x_3^2$；\n\n(4) $f(x_1, x_2, x_3) = x_1^2 - 2x_1 x_2 - 4x_1 x_3 + 2x_2^2 - 4x_2 x_3 + 7x_3^2$；\n\n(5) $f(x_1, x_2, x_3, x_4) = x_1^2 + x_2^2 + 4x_3^2 + 8x_4^2 + 6x_1 x_3 + 4x_1 x_4 - 2x_2 x_3 + 2x_2 x_4 + 2x_3 x_4$；\n\n(6) $f(x_1, x_2, x_3, x_4) = x_1^2 - 2x_1 x_2 + 4x_1 x_3 + 2x_1 x_4 + 3x_2^2 - 6x_2 x_3 + 9x_3^2 - 12x_3 x_4 + 19x_4^2$。",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "判定 $f(x_1, x_2, x_3) = 2x_1^2 + 2x_1 x_2 - 2x_1 x_3 - 6x_2^2 - 4x_2 x_3 - x_3^2$ 是否为正定二次型",
          answer: "不是"
        },
        {
          sub_id: "(2)",
          stem: "判定 $f(x_1, x_2, x_3) = 2x_1^2 + 2x_1 x_2 + 4x_1 x_3 + 2x_2^2 + 2x_2 x_3 + 3x_3^2$ 是否为正定二次型",
          answer: "是"
        },
        {
          sub_id: "(3)",
          stem: "判定 $f(x_1, x_2, x_3) = 2x_1^2 + 2x_1 x_2 - 4x_1 x_3 + 2x_2^2 - 2x_2 x_3 + 5x_3^2$ 是否为正定二次型",
          answer: "是"
        },
        {
          sub_id: "(4)",
          stem: "判定 $f(x_1, x_2, x_3) = x_1^2 - 2x_1 x_2 - 4x_1 x_3 + 2x_2^2 - 4x_2 x_3 + 7x_3^2$ 是否为正定二次型",
          answer: "不是"
        },
        {
          sub_id: "(5)",
          stem: "判定 $f(x_1, x_2, x_3, x_4) = x_1^2 + x_2^2 + 4x_3^2 + 8x_4^2 + 6x_1 x_3 + 4x_1 x_4 - 2x_2 x_3 + 2x_2 x_4 + 2x_3 x_4$ 是否为正定二次型",
          answer: "不是"
        },
        {
          sub_id: "(6)",
          stem: "判定 $f(x_1, x_2, x_3, x_4) = x_1^2 - 2x_1 x_2 + 4x_1 x_3 + 2x_1 x_4 + 3x_2^2 - 6x_2 x_3 + 9x_3^2 - 12x_3 x_4 + 19x_4^2$ 是否为正定二次型",
          answer: "是"
        }
      ]
    },
    solution: {
      answer: "(1) 不是；\n(2) 是；\n(3) 是；\n(4) 不是；\n(5) 不是；\n(6) 是。",
      hints: "写出二次型的矩阵，利用各阶顺序主子式全大于零（赫尔维茨定理），或通过配方法判断正惯性指数是否等于未知数个数。",
      steps: "(1) 矩阵的二阶顺序主子式 $\\Delta_2 = \\begin{vmatrix} 2 & 1 \\\\ 1 & -6 \\end{vmatrix} = -13 < 0$，故不是正定二次型。\n\n(2) 矩阵为 $\\begin{pmatrix} 2 & 1 & 2 \\\\ 1 & 2 & 1 \\\\ 2 & 1 & 3 \\end{pmatrix}$。各阶顺序主子式：$\\Delta_1 = 2 > 0$；$\\Delta_2 = 4 - 1 = 3 > 0$；$\\Delta_3 = 2(6-1) - 1(3-2) + 2(1-4) = 10 - 1 - 6 = 3 > 0$。由赫尔维茨判据，是正定二次型。\n\n(3) 矩阵各阶顺序主子式：$\\Delta_1 = 2 > 0$；$\\Delta_2 = \\begin{vmatrix} 2 & 1 \\\\ 1 & 2 \\end{vmatrix} = 3 > 0$；$\\Delta_3 = 2(10-1) - 1(5-2) - 2(-1-4) = 18 - 3 + 10 = 25 > 0$。故是正定二次型。\n\n(4) 配方：$f = (x_1 - x_2 - 2x_3)^2 + x_2^2 - 8x_2 x_3 + 3x_3^2 = (x_1 - x_2 - 2x_3)^2 + (x_2 - 4x_3)^2 - 13x_3^2$。存在负平方项，负惯性指数大于零，故不是正定二次型。\n\n(5) 观察二次型矩阵的一阶、二阶、三阶顺序主子式：$\\Delta_3 = \\begin{vmatrix} 1 & 0 & 3 \\\\ 0 & 1 & -1 \\\\ 3 & -1 & 4 \\end{vmatrix} = 4 - (-1)^2 - 9 = 4 - 1 - 9 = -6 < 0$。故不是正定二次型。\n\n(6) 配方：\n$$\\begin{aligned} f &= (x_1 - x_2 + 2x_3 + x_4)^2 + 2(x_2 - x_3 - x_4)^2 + 3(x_3 - 2x_4)^2 + 4x_4^2 \\end{aligned}$$\n化为 4 个独立完全平方项之和，系数皆为正数，正惯性指数为 4，故是正定二次型。"
    }
  },
  {
    id: "LAG-TB-CH07-Q31",
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
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 31 题",
      page_start: 183,
      page_end: 183
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 31,
      paper_q_num: 31,
      type: "calc",
      difficulty: 3,
      score: 10
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.5",
        section_title: "正定二次型与正定矩阵",
        section_slug: "7.5_正定二次型与正定矩阵",
        knowledge_points: ["参数正定条件", "顺序主子式不等式组"]
      }
    },
    content: {
      stem: "确定参数 $\\lambda$ 的取值范围，使得下列二次型为正定二次型：\n\n(1) $f(x_1, x_2, x_3) = x_1^2 + 2\\lambda x_1 x_2 - 2x_1 x_3 + x_2^2 + 4x_2 x_3 + 5x_3^2$；\n\n(2) $f(x_1, x_2, x_3) = 5x_1^2 + 4x_1 x_2 - 2x_1 x_3 + x_2^2 + 4x_2 x_3 + \\lambda x_3^2$；\n\n(3) $f(x_1, x_2, x_3, x_4) = \\lambda(x_1^2 + x_2^2 + x_3^2) + 2(x_1 x_2 - x_2 x_3 + x_1 x_3) + x_4^2$。",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "确定参数 $\\lambda$ 的取值范围，使得 $f(x_1, x_2, x_3) = x_1^2 + 2\\lambda x_1 x_2 - 2x_1 x_3 + x_2^2 + 4x_2 x_3 + 5x_3^2$ 为正定二次型",
          answer: "$-\\frac{4}{5} < \\lambda < 0$"
        },
        {
          sub_id: "(2)",
          stem: "确定参数 $\\lambda$ 的取值范围，使得 $f(x_1, x_2, x_3) = 5x_1^2 + 4x_1 x_2 - 2x_1 x_3 + x_2^2 + 4x_2 x_3 + \\lambda x_3^2$ 为正定二次型",
          answer: "$\\lambda > 29$"
        },
        {
          sub_id: "(3)",
          stem: "确定参数 $\\lambda$ 的取值范围，使得 $f(x_1, x_2, x_3, x_4) = \\lambda(x_1^2 + x_2^2 + x_3^2) + 2(x_1 x_2 - x_2 x_3 + x_1 x_3) + x_4^2$ 为正定二次型",
          answer: "$\\lambda > 2$"
        }
      ]
    },
    solution: {
      answer: "(1) $-\\frac{4}{5} < \\lambda < 0$；\n(2) $\\lambda > 29$；\n(3) $\\lambda > 2$。",
      hints: "写出二次型矩阵 $\\pmb{A}$，由赫尔维茨定理列出各阶顺序主子式大于零的不等式组求解 $\\lambda$。",
      steps: "(1) 矩阵为 $\\pmb{A} = \\begin{pmatrix} 1 & \\lambda & -1 \\\\ \\lambda & 1 & 2 \\\\ -1 & 2 & 5 \\end{pmatrix}$。\n$\\Delta_1 = 1 > 0$；\n$\\Delta_2 = 1 - \\lambda^2 > 0 \\implies -1 < \\lambda < 1$；\n$\\Delta_3 = \\det(\\pmb{A}) = 1(5-4) - \\lambda(5\\lambda+2) - 1(2\\lambda+1) = 1 - 5\\lambda^2 - 2\\lambda - 2\\lambda - 1 = -5\\lambda^2 - 4\\lambda = -\\lambda(5\\lambda + 4) > 0$。\n解得 $-\\frac{4}{5} < \\lambda < 0$。\n\n(2) 矩阵为 $\\pmb{A} = \\begin{pmatrix} 5 & 2 & -1 \\\\ 2 & 1 & 2 \\\\ -1 & 2 & \\lambda \\end{pmatrix}$。\n$\\Delta_1 = 5 > 0$；\n$\\Delta_2 = 5 - 4 = 1 > 0$；\n$\\Delta_3 = 5(\\lambda - 4) - 2(2\\lambda + 2) - 1(4 + 1) = 5\\lambda - 20 - 4\\lambda - 4 - 5 = \\lambda - 29 > 0 \\implies \\lambda > 29$。\n\n(3) 矩阵为 4 阶：前 3 阶对应实对称矩阵 $\\begin{pmatrix} \\lambda & 1 & 1 \\\\ 1 & \\lambda & -1 \\\\ 1 & -1 & \\lambda \\end{pmatrix}$，第 4 行第 4 列元素为 1 其余为 0。正定充要条件为该 3 阶矩阵各阶顺序主子式大于 0：\n$\\Delta_1 = \\lambda > 0$；\n$\\Delta_2 = \\lambda^2 - 1 > 0 \\implies \\lambda > 1$；\n$\\Delta_3 = (\\lambda - 1)^2(\\lambda + 2) > 0$，再结合第 4 阶主子式，综合解得 $\\lambda > 2$。"
    }
  },
  {
    id: "LAG-TB-CH07-Q32",
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
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 32 题",
      page_start: 183,
      page_end: 183
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
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.5",
        section_title: "正定二次型与正定矩阵",
        section_slug: "7.5_正定二次型与正定矩阵",
        knowledge_points: ["正定矩阵判定", "顺序主子式"]
      }
    },
    content: {
      stem: "求参数 $a$ 的取值范围，使得下列对称矩阵为正定矩阵：\n\n(1) $\\pmb{A} = \\begin{pmatrix} 1 & 1 & 0 \\\\ 1 & a & 0 \\\\ 0 & 0 & a^2 \\end{pmatrix}$；\n\n(2) $\\pmb{A} = \\begin{pmatrix} 5 & 2 & -1 \\\\ 2 & 1 & -1 \\\\ -1 & -1 & a \\end{pmatrix}$。",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "求参数 $a$ 的取值范围，使得 $\\pmb{A} = \\begin{pmatrix} 1 & 1 & 0 \\\\ 1 & a & 0 \\\\ 0 & 0 & a^2 \\end{pmatrix}$ 为正定矩阵",
          answer: "$a > 1$"
        },
        {
          sub_id: "(2)",
          stem: "求参数 $a$ 的取值范围，使得 $\\pmb{A} = \\begin{pmatrix} 5 & 2 & -1 \\\\ 2 & 1 & -1 \\\\ -1 & -1 & a \\end{pmatrix}$ 为正定矩阵",
          answer: "$a > 2$"
        }
      ]
    },
    solution: {
      answer: "(1) $a > 1$；\n(2) $a > 2$。",
      hints: "利用实对称矩阵正定的赫尔维茨充要条件：各阶顺序主子式全大于 0。",
      steps: "(1) 各阶顺序主子式：\n$\\Delta_1 = 1 > 0$；\n$\\Delta_2 = a - 1 > 0 \\implies a > 1$；\n$\\Delta_3 = a^2(a - 1) > 0$，当 $a > 1$ 时 $a^2 > 0$ 恒成立。故 $a > 1$。\n\n(2) 各阶顺序主子式：\n$\\Delta_1 = 5 > 0$；\n$\\Delta_2 = 5 - 4 = 1 > 0$；\n$\\Delta_3 = 5(a - 1) - 2(2a - 1) - (-2 + 1) = 5a - 5 - 4a + 2 + 1 = a - 2 > 0 \\implies a > 2$。故 $a > 2$。"
    }
  },
  {
    id: "LAG-TB-CH07-Q33",
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
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 33 题",
      page_start: 183,
      page_end: 183
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 33,
      paper_q_num: 33,
      type: "calc",
      difficulty: 3,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.5",
        section_title: "正定二次型与正定矩阵",
        section_slug: "7.5_正定二次型与正定矩阵",
        knowledge_points: ["矩阵特征值", "正定矩阵与特征值关系"]
      }
    },
    content: {
      stem: "设 $\\pmb{A} = \\begin{pmatrix} 1 & 0 & 1 \\\\ 0 & 2 & 0 \\\\ 1 & 0 & 1 \\end{pmatrix}$，问 $a$ 为何值时，$\\pmb{B} = (a\\pmb{E} + \\pmb{A})^2$ 为正定矩阵？"
    },
    solution: {
      answer: "$a \\neq -2$ 且 $a \\neq 0$。",
      hints: "先求实对称矩阵 $\\pmb{A}$ 的特征值，根据矩阵多项式的特征值性质求出 $\\pmb{B}$ 的特征值，正定矩阵的特征值全部严格大于零。",
      steps: "计算 $\\pmb{A}$ 的特征值：\n$$|\\lambda\\pmb{E} - \\pmb{A}| = \\begin{vmatrix} \\lambda - 1 & 0 & -1 \\\\ 0 & \\lambda - 2 & 0 \\\\ -1 & 0 & \\lambda - 1 \\end{vmatrix} = (\\lambda - 2)[(\\lambda - 1)^2 - 1] = \\lambda(\\lambda - 2)^2 = 0$$\n得 $\\pmb{A}$ 的特征值为 $\\lambda_1 = 0, \\lambda_2 = \\lambda_3 = 2$。\n因此 $\\pmb{B} = (a\\pmb{E} + \\pmb{A})^2$ 的特征值为：\n$$\\mu_1 = (a + 0)^2 = a^2, \\quad \\mu_2 = \\mu_3 = (a + 2)^2$$\n因为 $\\pmb{A}$ 为实对称矩阵，$\\pmb{B}$ 必为实对称矩阵。$\\pmb{B}$ 为正定矩阵的充要条件为其特征值全大于 0：\n$$\\begin{cases} a^2 > 0 \\implies a \\neq 0 \\\\ (a + 2)^2 > 0 \\implies a \\neq -2 \\end{cases}$$\n故当 $a \\neq -2$ 且 $a \\neq 0$ 时，$\\pmb{B}$ 为正定矩阵。"
    }
  },
  {
    id: "LAG-TB-CH07-Q34",
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
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 34 题",
      page_start: 183,
      page_end: 183
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 34,
      paper_q_num: 34,
      type: "calc",
      difficulty: 3,
      score: 10
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.5",
        section_title: "正定二次型与正定矩阵",
        section_slug: "7.5_正定二次型与正定矩阵",
        knowledge_points: ["零化多项式与特征值", "矩阵秩与非零特征值", "正定矩阵特征值"]
      }
    },
    content: {
      stem: "设三阶实对称矩阵 $\\pmb{A}$ 满足 $\\pmb{A}^2 + 2\\pmb{A} = \\pmb{O}$，其中 $\\pmb{O}$ 为零矩阵，且 $r(\\pmb{A}) = 2$。\n\n(1) 求出 $\\pmb{A}$ 的全体特征值；\n\n(2) 当 $k$ 为何值时，$k\\pmb{E} + \\pmb{A}$ 必为正定矩阵？",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "求出 $\\pmb{A}$ 的全体特征值",
          answer: "$\\lambda_1 = \\lambda_2 = -2, \\lambda_3 = 0$"
        },
        {
          sub_id: "(2)",
          stem: "当 $k$ 为何值时，$k\\pmb{E} + \\pmb{A}$ 必为正定矩阵",
          answer: "$k > 2$"
        }
      ]
    },
    solution: {
      answer: "(1) $\\lambda_1 = \\lambda_2 = -2, \\lambda_3 = 0$；\n(2) $k > 2$。",
      hints: "若 $\\lambda$ 为 $\\pmb{A}$ 的特征值，则 $\\lambda^2 + 2\\lambda = 0$；实对称矩阵必可正交对角化，$r(\\pmb{A})$ 等于非零特征值个数。",
      steps: "(1) 设 $\\lambda$ 为 $\\pmb{A}$ 的任一特征值，对应的特征向量为 $\\pmb{x} \\neq \\pmb{0}$。由 $\\pmb{A}^2 + 2\\pmb{A} = \\pmb{O}$ 得：\n$$(\\lambda^2 + 2\\lambda)\\pmb{x} = \\pmb{0} \\implies \\lambda(\\lambda + 2) = 0$$\n故 $\\pmb{A}$ 的特征值只能是 0 或 $-2$。\n因为 $\\pmb{A}$ 为三阶实对称矩阵，故 $\\pmb{A}$ 必可相似对角化，非零特征值的重数恰好等于 $r(\\pmb{A}) = 2$。因此 $-2$ 为二重特征值，0 为一重特征值，即：\n$$\\lambda_1 = \\lambda_2 = -2, \\quad \\lambda_3 = 0$$\n\n(2) $k\\pmb{E} + \\pmb{A}$ 的特征值为 $k + \\lambda_i$，即 $k - 2, k - 2, k$。由于 $\\pmb{A}$ 为实对称矩阵，$k\\pmb{E} + \\pmb{A}$ 亦为实对称矩阵，其为正定矩阵充要条件为其特征值全为正数：\n$$\\begin{cases} k - 2 > 0 \\\\ k > 0 \\end{cases} \\implies k > 2$$\n故当 $k > 2$ 时，$k\\pmb{E} + \\pmb{A}$ 必为正定矩阵。"
    }
  },
  {
    id: "LAG-TB-CH07-Q35",
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
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 35 题",
      page_start: 183,
      page_end: 183
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 35,
      paper_q_num: 35,
      type: "judge",
      difficulty: 2,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.5",
        section_title: "正定二次型与正定矩阵",
        section_slug: "7.5_正定二次型与正定矩阵",
        knowledge_points: ["正定二次型定义", "半正定与正定的区别", "反例构造"]
      }
    },
    content: {
      stem: "下述推理是否正确：因为下面的三元二次型可以化成三项平方和，所以它一定是正定二次型。\n$$f(x_1, x_2, x_3) = x_1^2 + x_2^2 + x_3^2 - x_1 x_2 - x_2 x_3 - x_1 x_3 = \\frac{1}{2}(x_1 - x_2)^2 + \\frac{1}{2}(x_2 - x_3)^2 + \\frac{1}{2}(x_1 - x_3)^2$$"
    },
    solution: {
      answer: "不正确。取 $x_1 = x_2 = x_3 = 1$，易见 $f(x_1, x_2, x_3) = 0$，所以 $f$ 不是正定二次型。",
      hints: "正定二次型要求对任意非零向量 $\\pmb{x} \\neq \\pmb{0}$ 都有 $f(\\pmb{x}) > 0$；平方和各项的线性表达式若线性相关，则可能在非零点处取零值（只是半正定）。",
      steps: "不正确。\n正定二次型的严格定义要求：对任意非零向量 $\\pmb{x} = (x_1, x_2, x_3)^\\mathrm{T} \\neq \\pmb{0}$，都有 $f(x_1, x_2, x_3) > 0$。\n虽然 $f(x_1, x_2, x_3) = \\frac{1}{2}(x_1 - x_2)^2 + \\frac{1}{2}(x_2 - x_3)^2 + \\frac{1}{2}(x_1 - x_3)^2 \\ge 0$，但这 3 个一次式 $(x_1 - x_2), (x_2 - x_3), (x_1 - x_3)$ 是线性相关的。\n当取非零向量 $\\pmb{x} = (1, 1, 1)^\\mathrm{T} \\neq \\pmb{0}$ 时，$x_1 = x_2 = x_3 = 1$，可得：\n$$f(1, 1, 1) = \\frac{1}{2}(0)^2 + \\frac{1}{2}(0)^2 + \\frac{1}{2}(0)^2 = 0$$\n因此 $f$ 只是半正定二次型，而不是正定二次型。该推理错误在于忽视了线性变换的可逆性要求。"
    }
  },
  {
    id: "LAG-TB-CH07-Q36",
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
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 36 题",
      page_start: 183,
      page_end: 183
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 36,
      paper_q_num: 36,
      type: "proof",
      difficulty: 3,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.5",
        section_title: "正定二次型与正定矩阵",
        section_slug: "7.5_正定二次型与正定矩阵",
        knowledge_points: ["正交矩阵特征值", "正定矩阵特征值", "矩阵相似对角化"]
      }
    },
    content: {
      stem: "求证：$n$ 阶矩阵 $\\pmb{A}$ 既是正交矩阵又是正定矩阵当且仅当 $\\pmb{A}$ 为单位矩阵。"
    },
    solution: {
      answer: "证明略。",
      hints: "分别从特征值角度证明：正交矩阵实特征值只能为 $\\pm 1$，正定矩阵特征值全部大于 0，且正定矩阵必对称可正交对角化。",
      steps: "充分性（$\\Leftarrow$）：\n若 $\\pmb{A} = \\pmb{E}$，显然 $\\pmb{E}^\\mathrm{T}\\pmb{E} = \\pmb{E}$ 为正交矩阵，且对任意 $\\pmb{x} \\neq \\pmb{0}$ 有 $\\pmb{x}^\\mathrm{T}\\pmb{E}\\pmb{x} = \\pmb{x}^\\mathrm{T}\\pmb{x} > 0$，故单位矩阵必为正定矩阵。\n\n必要性（$\\Rightarrow$）：\n设 $\\pmb{A}$ 既是正交矩阵又是正定矩阵。\n由 $\\pmb{A}$ 为正定矩阵，可知 $\\pmb{A}$ 是实对称矩阵，且所有特征值 $\\lambda_i > 0$ ($i = 1, \\dots, n$)。\n由 $\\pmb{A}$ 为正交矩阵，若 $\\lambda$ 为其特征值，对应特征向量为 $\\pmb{x}$，则：\n$$\\|\\pmb{A}\\pmb{x}\\|^2 = \\pmb{x}^\\mathrm{T}\\pmb{A}^\\mathrm{T}\\pmb{A}\\pmb{x} = \\pmb{x}^\\mathrm{T}\\pmb{x} = \\|\\pmb{x}\\|^2$$\n另一方面，$\\|\\pmb{A}\\pmb{x}\\|^2 = \\|\\lambda\\pmb{x}\\|^2 = \\lambda^2\\|\\pmb{x}\\|^2$。因 $\\pmb{x} \\neq \\pmb{0}$，得 $\\lambda^2 = 1$，即 $\\lambda = \\pm 1$。\n又因 $\\lambda_i > 0$，故必有 $\\lambda_i = 1$ ($i = 1, \\dots, n$)。\n因为实对称矩阵必可正交相似对角化，即存在正交矩阵 $\\pmb{Q}$ 使得：\n$$\\pmb{Q}^\\mathrm{T}\\pmb{A}\\pmb{Q} = \\operatorname{diag}(\\lambda_1, \\dots, \\lambda_n) = \\pmb{E}$$\n两边同乘 $\\pmb{Q}$ 与 $\\pmb{Q}^\\mathrm{T}$，得 $\\pmb{A} = \\pmb{Q}\\pmb{E}\\pmb{Q}^\\mathrm{T} = \\pmb{Q}\\pmb{Q}^\\mathrm{T} = \\pmb{E}$。\n证毕。"
    }
  },
  {
    id: "LAG-TB-CH07-Q37",
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
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 37 题",
      page_start: 183,
      page_end: 183
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 37,
      paper_q_num: 37,
      type: "proof",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.5",
        section_title: "正定二次型与正定矩阵",
        section_slug: "7.5_正定二次型与正定矩阵",
        knowledge_points: ["正定矩阵幂", "实对称矩阵谱定理"]
      }
    },
    content: {
      stem: "设 $\\pmb{A}$ 是 $n$ 阶正定矩阵，求证 $\\pmb{A}^k$ 必是正定矩阵，其中 $k$ 为任意正整数。"
    },
    solution: {
      answer: "证明略。",
      hints: "实对称矩阵的幂仍是对称矩阵；正定矩阵的特征值全为正，其 $k$ 次幂的特征值为 $\\lambda_i^k > 0$。",
      steps: "证明：\n1. 对称性：因为 $\\pmb{A}$ 是正定矩阵，故 $\\pmb{A}^\\mathrm{T} = \\pmb{A}$。对任意正整数 $k$：\n$$(\\pmb{A}^k)^\\mathrm{T} = (\\pmb{A}^\\mathrm{T})^k = \\pmb{A}^k$$\n即 $\\pmb{A}^k$ 是实对称矩阵。\n\n2. 特征值判定：由 $\\pmb{A}$ 正定，存在正交矩阵 $\\pmb{P}$ 使得 $\\pmb{P}^\\mathrm{T}\\pmb{A}\\pmb{P} = \\pmb{\\Lambda} = \\operatorname{diag}(\\lambda_1, \\dots, \\lambda_n)$，且 $\\lambda_i > 0$ ($i = 1, \\dots, n$)。\n于是：\n$$\\pmb{P}^\\mathrm{T}\\pmb{A}^k\\pmb{P} = (\\pmb{P}^\\mathrm{T}\\pmb{A}\\pmb{P})^k = \\pmb{\\Lambda}^k = \\operatorname{diag}(\\lambda_1^k, \\dots, \\lambda_n^k)$$\n因为 $\\lambda_i > 0$，所以对任意正整数 $k$ 都有 $\\lambda_i^k > 0$。\n实对称矩阵 $\\pmb{A}^k$ 的所有特征值均大于 0，故 $\\pmb{A}^k$ 必是正定矩阵。"
    }
  },
  {
    id: "LAG-TB-CH07-Q38",
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
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 38 题",
      page_start: 183,
      page_end: 183
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 38,
      paper_q_num: 38,
      type: "proof",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.5",
        section_title: "正定二次型与正定矩阵",
        section_slug: "7.5_正定二次型与正定矩阵",
        knowledge_points: ["正定矩阵的和", "二次型定义法证明"]
      }
    },
    content: {
      stem: "设 $\\pmb{A}, \\pmb{B}$ 都是 $n$ 阶正定矩阵，求证 $\\pmb{A} + \\pmb{B}$ 也是正定矩阵。"
    },
    solution: {
      answer: "证明略。",
      hints: "验证对称性 $(\\pmb{A} + \\pmb{B})^\\mathrm{T} = \\pmb{A} + \\pmb{B}$，并根据正定二次型定义计算二次型 $\\pmb{x}^\\mathrm{T}(\\pmb{A} + \\pmb{B})\\pmb{x}$。",
      steps: "证明：\n1. 对称性：因为 $\\pmb{A}, \\pmb{B}$ 为正定矩阵，故 $\\pmb{A}^\\mathrm{T} = \\pmb{A}, \\pmb{B}^\\mathrm{T} = \\pmb{B}$。\n$$(\\pmb{A} + \\pmb{B})^\\mathrm{T} = \\pmb{A}^\\mathrm{T} + \\pmb{B}^\\mathrm{T} = \\pmb{A} + \\pmb{B}$$\n故 $\\pmb{A} + \\pmb{B}$ 为实对称矩阵。\n\n2. 正定性：对任意非零向量 $\\pmb{x} \\in \\mathbb{R}^n$ ($\\pmb{x} \\neq \\pmb{0}$)，有：\n$$\\pmb{x}^\\mathrm{T}(\\pmb{A} + \\pmb{B})\\pmb{x} = \\pmb{x}^\\mathrm{T}\\pmb{A}\\pmb{x} + \\pmb{x}^\\mathrm{T}\\pmb{B}\\pmb{x}$$\n由于 $\\pmb{A}$ 与 $\\pmb{B}$ 都是正定矩阵，因此 $\\pmb{x}^\\mathrm{T}\\pmb{A}\\pmb{x} > 0$ 且 $\\pmb{x}^\\mathrm{T}\\pmb{B}\\pmb{x} > 0$。\n两者相加得：\n$$\\pmb{x}^\\mathrm{T}(\\pmb{A} + \\pmb{B})\\pmb{x} > 0$$\n由定义，$\\pmb{A} + \\pmb{B}$ 是正定矩阵。"
    }
  },
  {
    id: "LAG-TB-CH07-Q39",
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
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 39 题",
      page_start: 183,
      page_end: 183
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 39,
      paper_q_num: 39,
      type: "proof",
      difficulty: 3,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.1",
        section_title: "二次型及其矩阵表示",
        section_slug: "7.1_二次型及其矩阵表示",
        knowledge_points: ["实对称矩阵与二次型一一对应", "极化恒等式", "基向量代入法"]
      }
    },
    content: {
      stem: "设 $\\pmb{A}$ 是 $n$ 阶实对称矩阵。如果对任意 $n$ 维实向量 $\\pmb{x}$，都有 $\\pmb{x}^\\mathrm{T}\\pmb{A}\\pmb{x} = 0$，求证 $\\pmb{A}$ 为零矩阵。"
    },
    solution: {
      answer: "证明略。",
      hints: "分别取标准正交基向量 $\\pmb{e}_i$ 以及 $\\pmb{e}_i + \\pmb{e}_j$ 代入二次型中，由对称性 $a_{ij} = a_{ji}$ 解出所有矩阵元素。",
      steps: "证明：\n设 $\\pmb{A} = (a_{ij})_{n \\times n}$，由题设 $\\pmb{A}^\\mathrm{T} = \\pmb{A}$，即 $a_{ij} = a_{ji}$。\n令 $\\pmb{e}_i = (0, \\dots, 1, \\dots, 0)^\\mathrm{T}$ 为第 $i$ 个分量为 1 的标准基向量。\n1. 取 $\\pmb{x} = \\pmb{e}_i$，则：\n$$\\pmb{e}_i^\\mathrm{T}\\pmb{A}\\pmb{e}_i = a_{ii} = 0 \\quad (i = 1, 2, \\dots, n)$$\n故 $\\pmb{A}$ 的对角线元素全为 0。\n\n2. 取 $\\pmb{x} = \\pmb{e}_i + \\pmb{e}_j$ ($i \\neq j$)，代入得：\n$$(\\pmb{e}_i + \\pmb{e}_j)^\\mathrm{T}\\pmb{A}(\\pmb{e}_i + \\pmb{e}_j) = \\pmb{e}_i^\\mathrm{T}\\pmb{A}\\pmb{e}_i + \\pmb{e}_j^\\mathrm{T}\\pmb{A}\\pmb{e}_j + 2\\pmb{e}_i^\\mathrm{T}\\pmb{A}\\pmb{e}_j = a_{ii} + a_{jj} + 2a_{ij} = 0$$\n因为 $a_{ii} = a_{jj} = 0$，所以 $2a_{ij} = 0 \\implies a_{ij} = 0$ ($i \\neq j$)。\n\n综上，$\\pmb{A}$ 的所有元素 $a_{ij} = 0$，即 $\\pmb{A} = \\pmb{O}$ 为零矩阵。"
    }
  },
  {
    id: "LAG-TB-CH07-Q40",
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
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 40 题",
      page_start: 183,
      page_end: 183
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 40,
      paper_q_num: 40,
      type: "proof",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.5",
        section_title: "正定二次型与正定矩阵",
        section_slug: "7.5_正定二次型与正定矩阵",
        knowledge_points: ["正定矩阵的因式分解", "向量内积与模长"]
      }
    },
    content: {
      stem: "设 $\\pmb{P}$ 为 $n$ 阶可逆矩阵，$\\pmb{A} = \\pmb{P}^\\mathrm{T}\\pmb{P}$。求证：$f = \\pmb{x}^\\mathrm{T}\\pmb{A}\\pmb{x}$ 为正定二次型。"
    },
    solution: {
      answer: "证明略。",
      hints: "将二次型变形为模长平方 $\\|\\pmb{P}\\pmb{x}\\|^2$，利用可逆矩阵只有零解证明正定性。",
      steps: "证明：\n1. 对称性：$\\pmb{A}^\\mathrm{T} = (\\pmb{P}^\\mathrm{T}\\pmb{P})^\\mathrm{T} = \\pmb{P}^\\mathrm{T}(\\pmb{P}^\\mathrm{T})^\\mathrm{T} = \\pmb{P}^\\mathrm{T}\\pmb{P} = \\pmb{A}$，故 $\\pmb{A}$ 为实对称矩阵。\n\n2. 正定性：对任意非零向量 $\\pmb{x} \\in \\mathbb{R}^n$ ($\\pmb{x} \\neq \\pmb{0}$)，\n$$f = \\pmb{x}^\\mathrm{T}\\pmb{A}\\pmb{x} = \\pmb{x}^\\mathrm{T}(\\pmb{P}^\\mathrm{T}\\pmb{P})\\pmb{x} = (\\pmb{P}\\pmb{x})^\\mathrm{T}(\\pmb{P}\\pmb{x}) = \\|\\pmb{P}\\pmb{x}\\|^2 \\ge 0$$\n因为 $\\pmb{P}$ 为可逆矩阵，齐次线性方程组 $\\pmb{P}\\pmb{x} = \\pmb{0}$ 只有零解。所以当 $\\pmb{x} \\neq \\pmb{0}$ 时，$\\pmb{P}\\pmb{x} \\neq \\pmb{0}$。\n因此 $\\|\\pmb{P}\\pmb{x}\\|^2 > 0$，即 $\\pmb{x}^\\mathrm{T}\\pmb{A}\\pmb{x} > 0$。\n由定义，$f = \\pmb{x}^\\mathrm{T}\\pmb{A}\\pmb{x}$ 为正定二次型。"
    }
  },
  {
    id: "LAG-TB-CH07-Q41",
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
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 41 题",
      page_start: 183,
      page_end: 183
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 41,
      paper_q_num: 41,
      type: "proof",
      difficulty: 3,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.5",
        section_title: "正定二次型与正定矩阵",
        section_slug: "7.5_正定二次型与正定矩阵",
        knowledge_points: ["正定矩阵充要条件", "矩阵合同分解", "Cholesky分解思想"]
      }
    },
    content: {
      stem: "设 $\\pmb{A}$ 是 $n$ 阶正定矩阵。求证：存在 $n$ 阶可逆矩阵 $\\pmb{P}$，使得 $\\pmb{A} = \\pmb{P}^\\mathrm{T}\\pmb{P}$。"
    },
    solution: {
      answer: "证明略。",
      hints: "利用实对称矩阵正交相似对角化，将对角阵中的正特征值开平方，即可构造成 $\\pmb{P}^\\mathrm{T}\\pmb{P}$ 的形式。",
      steps: "证明：\n因为 $\\pmb{A}$ 为 $n$ 阶正定矩阵，故 $\\pmb{A}$ 是实对称矩阵，且所有特征值 $\\lambda_i > 0$ ($i = 1, 2, \\dots, n$)。\n由实对称矩阵谱定理，存在正交矩阵 $\\pmb{Q}$，使得：\n$$\\pmb{Q}^\\mathrm{T}\\pmb{A}\\pmb{Q} = \\pmb{\\Lambda} = \\begin{pmatrix} \\lambda_1 & & \\\\ & \\ddots & \\\\ & & \\lambda_n \\end{pmatrix}$$\n由于 $\\lambda_i > 0$，可令 $\\pmb{\\Lambda}^{1/2} = \\operatorname{diag}(\\sqrt{\\lambda_1}, \\dots, \\sqrt{\\lambda_n})$。显然 $(\\pmb{\\Lambda}^{1/2})^\\mathrm{T} = \\pmb{\\Lambda}^{1/2}$ 且 $(\\pmb{\\Lambda}^{1/2})^2 = \\pmb{\\Lambda}$。\n由正交矩阵性质 $\\pmb{Q}^{-1} = \\pmb{Q}^\\mathrm{T}$，可将 $\\pmb{A}$ 表示为：\n$$\\pmb{A} = \\pmb{Q}\\pmb{\\Lambda}\\pmb{Q}^\\mathrm{T} = \\pmb{Q}\\pmb{\\Lambda}^{1/2}\\pmb{\\Lambda}^{1/2}\\pmb{Q}^\\mathrm{T} = (\\pmb{\\Lambda}^{1/2}\\pmb{Q}^\\mathrm{T})^\\mathrm{T}(\\pmb{\\Lambda}^{1/2}\\pmb{Q}^\\mathrm{T})$$\n令 $\\pmb{P} = \\pmb{\\Lambda}^{1/2}\\pmb{Q}^\\mathrm{T}$。因为 $\\det(\\pmb{\\Lambda}^{1/2}) = \\prod_{i=1}^n \\sqrt{\\lambda_i} > 0$ 且 $\\det(\\pmb{Q}^\\mathrm{T}) = \\pm 1$，所以 $\\det(\\pmb{P}) \\neq 0$，即 $\\pmb{P}$ 是 $n$ 阶可逆矩阵。\n此时 $\\pmb{A} = \\pmb{P}^\\mathrm{T}\\pmb{P}$。命题得证。"
    }
  },
  {
    id: "LAG-TB-CH07-Q42",
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
      source_desc: "《线性代数与几何》第 7 章 · 习题七 第 42 题",
      page_start: 183,
      page_end: 183
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 42,
      paper_q_num: 42,
      type: "proof",
      difficulty: 4,
      score: 10
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 7,
        chapter_title: "第7章 二次型",
        section: "7.1",
        section_title: "二次型及其矩阵表示",
        section_slug: "7.1_二次型及其矩阵表示",
        knowledge_points: ["不定二次型", "连续函数零点存在定理", "向量连线参数化"]
      }
    },
    content: {
      stem: "设 $\\pmb{A}$ 是 $n$ 阶实对称矩阵。如果存在 $n$ 维实向量 $\\pmb{\\alpha}, \\pmb{\\beta}$，使得 $\\pmb{\\alpha}^\\mathrm{T}\\pmb{A}\\pmb{\\alpha} > 0, \\pmb{\\beta}^\\mathrm{T}\\pmb{A}\\pmb{\\beta} < 0$，求证：存在 $n$ 维实向量 $\\pmb{x}$，使得 $\\pmb{x}^\\mathrm{T}\\pmb{A}\\pmb{x} = 0$。"
    },
    solution: {
      answer: "证明略。",
      hints: "构造向量连线上的连续函数 $g(t) = ((1-t)\\pmb{\\alpha} + t\\pmb{\\beta})^\\mathrm{T}\\pmb{A}((1-t)\\pmb{\\alpha} + t\\pmb{\\beta})$，利用闭区间上连续函数的介值定理证明零点存在。",
      steps: "证明：\n考虑连接向量 $\\pmb{\\alpha}$ 与 $\\pmb{\\beta}$ 的线段上的向量：\n$$\\pmb{x}(t) = (1 - t)\\pmb{\\alpha} + t\\pmb{\\beta}, \\quad t \\in [0, 1]$$\n定义实变量函数：\n$$g(t) = \\pmb{x}(t)^\\mathrm{T}\\pmb{A}\\pmb{x}(t) = (1 - t)^2(\\pmb{\\alpha}^\\mathrm{T}\\pmb{A}\\pmb{\\alpha}) + 2t(1 - t)(\\pmb{\\alpha}^\\mathrm{T}\\pmb{A}\\pmb{\\beta}) + t^2(\\pmb{\\beta}^\\mathrm{T}\\pmb{A}\\pmb{\\beta})$$\n（其中利用了实对称矩阵性质 $\\pmb{\\alpha}^\\mathrm{T}\\pmb{A}\\pmb{\\beta} = \\pmb{\\beta}^\\mathrm{T}\\pmb{A}\\pmb{\\alpha}$）。\n由表达式可知，$g(t)$ 是关于 $t$ 的实系数一元多项式，因而在闭区间 $[0, 1]$ 上连续。\n由题设条件：\n$$g(0) = \\pmb{\\alpha}^\\mathrm{T}\\pmb{A}\\pmb{\\alpha} > 0, \\quad g(1) = \\pmb{\\beta}^\\mathrm{T}\\pmb{A}\\pmb{\\beta} < 0$$\n因为 $g(0) \\cdot g(1) < 0$，根据连续函数介值定理（零点定理），必存在 $t_0 \\in (0, 1)$，使得：\n$$g(t_0) = 0$$\n取向量 $\\pmb{x} = \\pmb{x}(t_0) = (1 - t_0)\\pmb{\\alpha} + t_0\\pmb{\\beta}$，则有：\n$$\\pmb{x}^\\mathrm{T}\\pmb{A}\\pmb{x} = g(t_0) = 0$$\n且当 $\\pmb{\\alpha}, \\pmb{\\beta}$ 线性无关时该向量显然非零。命题得证。"
    }
  }
];
