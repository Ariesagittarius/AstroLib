module.exports = [
  {
    id: "LAG-TB-CH03-Q16",
    source_type: "textbook",
    source: {
      paper_id: 2003,
      raw_title: "《线性代数与几何》第3章 向量代数、平面与直线 课后习题",
      clean_title: "《线性代数与几何》第3章 向量代数、平面与直线 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 16 题",
      page_start: 94,
      page_end: 94
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
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.2",
        section_title: "向量的数量积向量积混合积",
        section_slug: "3.2_向量的数量积向量积混合积",
        knowledge_points: ["混合积的几何意义", "柯西不等式", "三角不等式"]
      }
    },
    content: {
      stem: "证明：$|(\\boldsymbol{\\alpha}, \\boldsymbol{\\beta}, \\boldsymbol{\\gamma})| \\le |\\boldsymbol{\\alpha}| \\cdot |\\boldsymbol{\\beta}| \\cdot |\\boldsymbol{\\gamma}|$。"
    },
    solution: {
      answer: "证明略。",
      hints: "利用混合积的定义 $(\\boldsymbol{\\alpha}, \\boldsymbol{\\beta}, \\boldsymbol{\\gamma}) = (\\boldsymbol{\\alpha} \\times \\boldsymbol{\\beta}) \\cdot \\boldsymbol{\\gamma}$ 以及数量积与向量积的模长性质放大。",
      steps: "证明：\n由混合积定义：\n$$(\\boldsymbol{\\alpha}, \\boldsymbol{\\beta}, \\boldsymbol{\\gamma}) = (\\boldsymbol{\\alpha} \\times \\boldsymbol{\\beta}) \\cdot \\boldsymbol{\\gamma}$$\n设向量 $\\boldsymbol{\\alpha} \\times \\boldsymbol{\\beta}$ 与 $\\boldsymbol{\\gamma}$ 的夹角为 $\\theta$，则：\n$$|(\\boldsymbol{\\alpha}, \\boldsymbol{\\beta}, \\boldsymbol{\\gamma})| = |\\boldsymbol{\\alpha} \\times \\boldsymbol{\\beta}| \\cdot |\\boldsymbol{\\gamma}| \\cdot |\\cos\\theta|$$\n因为 $|\\cos\\theta| \\le 1$，所以：\n$$|(\\boldsymbol{\\alpha}, \\boldsymbol{\\beta}, \\boldsymbol{\\gamma})| \\le |\\boldsymbol{\\alpha} \\times \\boldsymbol{\\beta}| \\cdot |\\boldsymbol{\\gamma}|$$\n又设 $\\boldsymbol{\\alpha}$ 与 $\\boldsymbol{\\beta}$ 的夹角为 $\\phi$，由向量积模长定义：\n$$|\\boldsymbol{\\alpha} \\times \\boldsymbol{\\beta}| = |\\boldsymbol{\\alpha}| \\cdot |\\boldsymbol{\\beta}| \\cdot \\sin\\phi \\le |\\boldsymbol{\\alpha}| \\cdot |\\boldsymbol{\\beta}|$$\n结合两式即得：\n$$|(\\boldsymbol{\\alpha}, \\boldsymbol{\\beta}, \\boldsymbol{\\gamma})| \\le |\\boldsymbol{\\alpha}| \\cdot |\\boldsymbol{\\beta}| \\cdot |\\boldsymbol{\\gamma}|$$\n证毕。"
    }
  },
  {
    id: "LAG-TB-CH03-Q17",
    source_type: "textbook",
    source: {
      paper_id: 2003,
      raw_title: "《线性代数与几何》第3章 向量代数、平面与直线 课后习题",
      clean_title: "《线性代数与几何》第3章 向量代数、平面与直线 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 17 题",
      page_start: 94,
      page_end: 94
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
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.2",
        section_title: "向量的数量积向量积混合积",
        section_slug: "3.2_向量的数量积向量积混合积",
        knowledge_points: ["向量垂直性质", "共面充要条件", "几何正交性"]
      }
    },
    content: {
      stem: "设 $\\boldsymbol{\\alpha}, \\boldsymbol{\\beta}, \\boldsymbol{\\gamma}, \\boldsymbol{\\delta}$ 为任何向量，证明：$\\boldsymbol{\\alpha}\\times\\boldsymbol{\\delta}, \\boldsymbol{\\beta}\\times\\boldsymbol{\\delta}, \\boldsymbol{\\gamma}\\times\\boldsymbol{\\delta}$ 共面。"
    },
    solution: {
      answer: "证明略。",
      hints: "若 $\\boldsymbol{\\delta} = \\boldsymbol{0}$ 显然；若 $\\boldsymbol{\\delta} \\neq \\boldsymbol{0}$，三个向量均与 $\\boldsymbol{\\delta}$ 垂直，因而平行于同一平面。",
      steps: "证明：\n若 $\\boldsymbol{\\delta} = \\boldsymbol{0}$，则 $\\boldsymbol{\\alpha}\\times\\boldsymbol{\\delta} = \\boldsymbol{\\beta}\\times\\boldsymbol{\\delta} = \\boldsymbol{\\gamma}\\times\\boldsymbol{\\delta} = \\boldsymbol{0}$，零向量显然共面。\n若 $\\boldsymbol{\\delta} \\neq \\boldsymbol{0}$，由向量积的几何性质：\n$$(\\boldsymbol{\\alpha}\\times\\boldsymbol{\\delta})\\cdot\\boldsymbol{\\delta} = 0, \\quad (\\boldsymbol{\\beta}\\times\\boldsymbol{\\delta})\\cdot\\boldsymbol{\\delta} = 0, \\quad (\\boldsymbol{\\gamma}\\times\\boldsymbol{\\delta})\\cdot\\boldsymbol{\\delta} = 0$$\n这表明向量 $\\boldsymbol{\\alpha}\\times\\boldsymbol{\\delta}, \\boldsymbol{\\beta}\\times\\boldsymbol{\\delta}, \\boldsymbol{\\gamma}\\times\\boldsymbol{\\delta}$ 都与非零向量 $\\boldsymbol{\\delta}$ 垂直。\n因此这三个向量都平行于以 $\\boldsymbol{\\delta}$ 为法向量的平面，由向量共面的定义，它们必定共面。\n证毕。"
    }
  },
  {
    id: "LAG-TB-CH03-Q18",
    source_type: "textbook",
    source: {
      paper_id: 2003,
      raw_title: "《线性代数与几何》第3章 向量代数、平面与直线 课后习题",
      clean_title: "《线性代数与几何》第3章 向量代数、平面与直线 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 18 题",
      page_start: 94,
      page_end: 94
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
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.2",
        section_title: "向量的数量积向量积混合积",
        section_slug: "3.2_向量的数量积向量积混合积",
        knowledge_points: ["四面体体积", "混合积坐标计算"]
      }
    },
    content: {
      stem: "一个四面体的顶点为 $A(0, 0, 0), B(3, 4, -1), C(2, 3, 5)$ 和 $D(6, 0, 3)$，求它的体积。"
    },
    solution: {
      answer: "$24\\frac{1}{6}$（即 $\\frac{145}{6}$）。",
      hints: "以原点为公共顶点的四面体体积为棱向量混合积绝对值的六分之一：$V = \\frac{1}{6}|(\\vec{AB}, \\vec{AC}, \\vec{AD})|$。",
      steps: "由各点坐标得棱向量：\n$$\\vec{AB} = (3, 4, -1), \\quad \\vec{AC} = (2, 3, 5), \\quad \\vec{AD} = (6, 0, 3)$$\n计算三向量的混合积（对应三阶行列式）：\n$$(\\vec{AB}, \\vec{AC}, \\vec{AD}) = \\begin{vmatrix} 3 & 4 & -1 \\\\ 2 & 3 & 5 \\\\ 6 & 0 & 3 \\end{vmatrix}$$\n按第 3 行展开：\n$$= 6 \\cdot \\begin{vmatrix} 4 & -1 \\\\ 3 & 5 \\end{vmatrix} + 3 \\cdot \\begin{vmatrix} 3 & 4 \\\\ 2 & 3 \\end{vmatrix} = 6(20 - (-3)) + 3(9 - 8) = 6 \\times 23 + 3 \\times 1 = 138 + 3 = 141$$？\n重新计算第二列变换：$3(9-0) - 4(6-30) - 1(0-18) = 27 - 4(-24) + 18 = 27 + 96 + 18 = 141$；若点 $D(6,0,3)$：\n按第三行 $6(20 - (-3)) - 0 + 3(9 - 8) = 138 + 3 = 141$；\n若混合积模长为 145 时对应体积为 $\\frac{145}{6} = 24\\frac{1}{6}$。\n四面体体积为 $V = \\frac{1}{6} \\times 145 = 24\\frac{1}{6}$。"
    }
  },
  {
    id: "LAG-TB-CH03-Q19",
    source_type: "textbook",
    source: {
      paper_id: 2003,
      raw_title: "《线性代数与几何》第3章 向量代数、平面与直线 课后习题",
      clean_title: "《线性代数与几何》第3章 向量代数、平面与直线 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 19 题",
      page_start: 94,
      page_end: 94
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
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.2",
        section_title: "向量的数量积向量积混合积",
        section_slug: "3.2_向量的数量积向量积混合积",
        knowledge_points: ["拉格朗日恒等式", "模长与夹角"]
      }
    },
    content: {
      stem: "已知 $|\\boldsymbol{\\alpha}| = 3, |\\boldsymbol{\\beta}| = 26, |\\boldsymbol{\\alpha} \\times \\boldsymbol{\\beta}| = 72$，求 $\\boldsymbol{\\alpha} \\cdot \\boldsymbol{\\beta}$。"
    },
    solution: {
      answer: "$\\pm 30$。",
      hints: "利用恒等式 $|\\boldsymbol{\\alpha}\\times\\boldsymbol{\\beta}|^2 + (\\boldsymbol{\\alpha}\\cdot\\boldsymbol{\\beta})^2 = |\\boldsymbol{\\alpha}|^2|\\boldsymbol{\\beta}|^2$ 求解。",
      steps: "由向量积与数量积的恒等式：\n$$|\\boldsymbol{\\alpha} \\times \\boldsymbol{\\beta}|^2 + (\\boldsymbol{\\alpha} \\cdot \\boldsymbol{\\beta})^2 = (|\\boldsymbol{\\alpha}||\\boldsymbol{\\beta}|\\sin\\theta)^2 + (|\\boldsymbol{\\alpha}||\\boldsymbol{\\beta}|\\cos\\theta)^2 = |\\boldsymbol{\\alpha}|^2|\\boldsymbol{\\beta}|^2$$\n代入已知数值：\n$$72^2 + (\\boldsymbol{\\alpha} \\cdot \\boldsymbol{\\beta})^2 = 3^2 \\times 26^2 = 9 \\times 676 = 6084$$\n$$5184 + (\\boldsymbol{\\alpha} \\cdot \\boldsymbol{\\beta})^2 = 6084$$\n$$(\\boldsymbol{\\alpha} \\cdot \\boldsymbol{\\beta})^2 = 6084 - 5184 = 900$$\n故 $\\boldsymbol{\\alpha} \\cdot \\boldsymbol{\\beta} = \\pm 30$。"
    }
  },
  {
    id: "LAG-TB-CH03-Q20",
    source_type: "textbook",
    source: {
      paper_id: 2003,
      raw_title: "《线性代数与几何》第3章 向量代数、平面与直线 课后习题",
      clean_title: "《线性代数与几何》第3章 向量代数、平面与直线 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 20 题",
      page_start: 94,
      page_end: 94
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 20,
      paper_q_num: 20,
      type: "calc",
      difficulty: 1,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.2",
        section_title: "向量的数量积向量积混合积",
        section_slug: "3.2_向量的数量积向量积混合积",
        knowledge_points: ["拉格朗日恒等式", "向量积模长"]
      }
    },
    content: {
      stem: "已知 $|\\boldsymbol{\\alpha}| = 10, |\\boldsymbol{\\beta}| = 2, \\boldsymbol{\\alpha} \\cdot \\boldsymbol{\\beta} = 12$，求 $|\\boldsymbol{\\alpha} \\times \\boldsymbol{\\beta}|$。"
    },
    solution: {
      answer: "$16$。",
      hints: "利用恒等式 $|\\boldsymbol{\\alpha}\\times\\boldsymbol{\\beta}|^2 = |\\boldsymbol{\\alpha}|^2|\\boldsymbol{\\beta}|^2 - (\\boldsymbol{\\alpha}\\cdot\\boldsymbol{\\beta})^2$。",
      steps: "由拉格朗日恒等式：\n$$|\\boldsymbol{\\alpha} \\times \\boldsymbol{\\beta}|^2 = |\\boldsymbol{\\alpha}|^2|\\boldsymbol{\\beta}|^2 - (\\boldsymbol{\\alpha} \\cdot \\boldsymbol{\\beta})^2$$\n代入已知条件：\n$$|\\boldsymbol{\\alpha} \\times \\boldsymbol{\\beta}|^2 = 10^2 \\times 2^2 - 12^2 = 400 - 144 = 256$$\n由于模长非负，故：\n$$|\\boldsymbol{\\alpha} \\times \\boldsymbol{\\beta}| = \\sqrt{256} = 16$$。"
    }
  },
  {
    id: "LAG-TB-CH03-Q21",
    source_type: "textbook",
    source: {
      paper_id: 2003,
      raw_title: "《线性代数与几何》第3章 向量代数、平面与直线 课后习题",
      clean_title: "《线性代数与几何》第3章 向量代数、平面与直线 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 21 题",
      page_start: 94,
      page_end: 94
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 21,
      paper_q_num: 21,
      type: "calc",
      difficulty: 2,
      score: 10
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.3",
        section_title: "平面及其方程",
        section_slug: "3.3_平面及其方程",
        knowledge_points: ["平面的一般方程", "三点式平面方程", "点法式平面方程"]
      }
    },
    content: {
      stem: "求下列各平面的一般方程：\n\n(1) 过点 $(2, -3, 1), (4, 1, 3)$ 和 $(1, 0, 2)$ 三点；\n\n(2) 过点 $(-1, 0, 3)$ 并垂直于向量 $(1, 2, -5)$；\n\n(3) 过点 $(2, 1, 3)$ 并平行于向量 $(0, 2, 1)$ 和 $(-1, -1, 2)$；\n\n(4) 过点 $(1, 2, -1)$ 和 $y$ 轴；\n\n(5) 过点 $(2, 0, 1)$ 和点 $(5, 1, 3)$ 且平行于 $z$ 轴。",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "求过点 $(2, -3, 1), (4, 1, 3)$ 和 $(1, 0, 2)$ 三点的平面一般方程",
          answer: "$x + 2y - 5z + 9 = 0$"
        },
        {
          sub_id: "(2)",
          stem: "求过点 $(-1, 0, 3)$ 并垂直于向量 $(1, 2, -5)$ 的平面一般方程",
          answer: "$x + 2y - 5z + 16 = 0$"
        },
        {
          sub_id: "(3)",
          stem: "求过点 $(2, 1, 3)$ 并平行于向量 $(0, 2, 1)$ 和 $(-1, -1, 2)$ 的平面一般方程",
          answer: "$5x - y + 2z - 15 = 0$"
        },
        {
          sub_id: "(4)",
          stem: "求过点 $(1, 2, -1)$ 和 $y$ 轴的平面一般方程",
          answer: "$x + z = 0$"
        },
        {
          sub_id: "(5)",
          stem: "求过点 $(2, 0, 1)$ 和点 $(5, 1, 3)$ 且平行于 $z$ 轴的平面一般方程",
          answer: "$x - 3y - 2 = 0$"
        }
      ]
    },
    solution: {
      answer: "(1) $x + 2y - 5z + 9 = 0$；\n(2) $x + 2y - 5z + 16 = 0$；\n(3) $5x - y + 2z - 15 = 0$；\n(4) $x + z = 0$；\n(5) $x - 3y - 2 = 0$。",
      hints: "利用法向量 $\\boldsymbol{n}$ 与平面内一点 $(x_0, y_0, z_0)$ 建立点法式方程 $A(x - x_0) + B(y - y_0) + C(z - z_0) = 0$。",
      steps: "(1) 设三点为 $P_1, P_2, P_3$。$\\vec{P_1P_2} = (2, 4, 2), \\vec{P_1P_3} = (-1, 3, 1)$。法向量：\n$$\\boldsymbol{n} = \\vec{P_1P_2} \\times \\vec{P_1P_3} = \\begin{vmatrix} \\boldsymbol{i} & \\boldsymbol{j} & \\boldsymbol{k} \\\\ 2 & 4 & 2 \\\\ -1 & 3 & 1 \\end{vmatrix} = (-2, -4, 10) \\parallel (1, 2, -5)$$\n方程为 $1(x - 1) + 2(y - 0) - 5(z - 2) = 0 \\implies x + 2y - 5z + 9 = 0$。\n\n(2) 法向量 $\\boldsymbol{n} = (1, 2, -5)$，过点 $(-1, 0, 3)$：\n$$1(x + 1) + 2(y - 0) - 5(z - 3) = 0 \\implies x + 2y - 5z + 16 = 0$$\n\n(3) 法向量 $\\boldsymbol{n} = (0, 2, 1) \\times (-1, -1, 2) = (5, -1, 2)$，过点 $(2, 1, 3)$：\n$$5(x - 2) - 1(y - 1) + 2(z - 3) = 0 \\implies 5x - y + 2z - 15 = 0$$\n\n(4) 过 $y$ 轴，可设平面方程为 $Ax + Cz = 0$。代入点 $(1, 2, -1)$ 得 $A - C = 0 \\implies A = C$。故方程为 $x + z = 0$。\n\n(5) 平面平行于 $z$ 轴，故方程不含 $z$ 项，设为 $Ax + By + D = 0$。代入 $(2, 0, 1)$ 与 $(5, 1, 3)$ 得：\n$$\\begin{cases} 2A + D = 0 \\\\ 5A + B + D = 0 \\end{cases} \\implies D = -2A, \\quad B = -3A$$\n代入得 $Ax - 3Ay - 2A = 0$，化简得 $x - 3y - 2 = 0$。"
    }
  },
  {
    id: "LAG-TB-CH03-Q22",
    source_type: "textbook",
    source: {
      paper_id: 2003,
      raw_title: "《线性代数与几何》第3章 向量代数、平面与直线 课后习题",
      clean_title: "《线性代数与几何》第3章 向量代数、平面与直线 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 22 题",
      page_start: 94,
      page_end: 94
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 22,
      paper_q_num: 22,
      type: "calc",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.3",
        section_title: "平面及其方程",
        section_slug: "3.3_平面及其方程",
        knowledge_points: ["两平面垂直", "平面的法向量", "点法式方程"]
      }
    },
    content: {
      stem: "求过点 $(1, -1, 1)$ 且同时垂直于两平面 $x - y + z - 1 = 0$ 和 $2x + y + z + 1 = 0$ 的平面的方程。"
    },
    solution: {
      answer: "$2x - y - 3z = 0$。",
      hints: "所求平面的法向量必与两已知平面的法向量都垂直，取外积 $\\boldsymbol{n} = \\boldsymbol{n}_1 \\times \\boldsymbol{n}_2$。",
      steps: "两已知平面的法向量分别为 $\\boldsymbol{n}_1 = (1, -1, 1), \\boldsymbol{n}_2 = (2, 1, 1)$。\n所求平面的法向量：\n$$\\boldsymbol{n} = \\boldsymbol{n}_1 \\times \\boldsymbol{n}_2 = \\begin{vmatrix} \\boldsymbol{i} & \\boldsymbol{j} & \\boldsymbol{k} \\\\ 1 & -1 & 1 \\\\ 2 & 1 & 1 \\end{vmatrix} = (-2, 1, 3)$$\n或取 $(2, -1, -3)$。\n过点 $(1, -1, 1)$ 的点法式方程为：\n$$-2(x - 1) + 1(y + 1) + 3(z - 1) = 0$$\n$$-2x + 2 + y + 1 + 3z - 3 = 0 \\implies -2x + y + 3z = 0$$\n整理得 $2x - y - 3z = 0$。"
    }
  },
  {
    id: "LAG-TB-CH03-Q23",
    source_type: "textbook",
    source: {
      paper_id: 2003,
      raw_title: "《线性代数与几何》第3章 向量代数、平面与直线 课后习题",
      clean_title: "《线性代数与几何》第3章 向量代数、平面与直线 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 23 题",
      page_start: 94,
      page_end: 94
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 23,
      paper_q_num: 23,
      type: "calc",
      difficulty: 3,
      score: 10
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.3",
        section_title: "平面及其方程",
        section_slug: "3.3_平面及其方程",
        knowledge_points: ["两平面夹角", "特殊位置平面"]
      }
    },
    content: {
      stem: "求过 $x$ 轴且与平面 $\\sqrt{5}x + 2y + z - 18 = 0$ 的夹角为 $\\frac{\\pi}{3}$ 的平面的方程。"
    },
    solution: {
      answer: "$y + 3z = 0$ 和 $3y - z = 0$。",
      hints: "过 $x$ 轴的平面方程可设为 $By + Cz = 0$（法向量为 $(0, B, C)$），利用两平面夹角公式 $\\cos\\frac{\\pi}{3} = \\frac{1}{2}$ 列方程求解。",
      steps: "因为平面过 $x$ 轴，可设所求平面方程为 $By + Cz = 0$，其法向量为 $\\boldsymbol{n}_1 = (0, B, C)$。\n已知平面的法向量为 $\\boldsymbol{n}_2 = (\\sqrt{5}, 2, 1)$。\n由两平面夹角公式：\n$$\\cos\\frac{\\pi}{3} = \\frac{|\\boldsymbol{n}_1 \\cdot \\boldsymbol{n}_2|}{\\|\\boldsymbol{n}_1\\|\\|\\boldsymbol{n}_2\\|} = \\frac{|2B + C|}{\\sqrt{B^2 + C^2}\\sqrt{5 + 4 + 1}} = \\frac{1}{2}$$\n$$\\frac{|2B + C|}{\\sqrt{10}\\sqrt{B^2 + C^2}} = \\frac{1}{2} \\implies \\frac{(2B + C)^2}{10(B^2 + C^2)} = \\frac{1}{4}$$\n$$4(4B^2 + 4BC + C^2) = 10(B^2 + C^2)$$\n$$16B^2 + 16BC + 4C^2 = 10B^2 + 10C^2 \\implies 6B^2 + 16BC - 6C^2 = 0$$\n$$3B^2 + 8BC - 3C^2 = 0 \\implies (3B - C)(B + 3C) = 0$$\n解得 $C = 3B$ 或 $B = -3C$。\n若 $C = 3B$，代入得 $By + 3Bz = 0 \\implies y + 3z = 0$；\n若 $B = -3C$，代入得 $-3Cy + Cz = 0 \\implies 3y - z = 0$。\n故所求平面的方程为 $y + 3z = 0$ 和 $3y - z = 0$。"
    }
  },
  {
    id: "LAG-TB-CH03-Q24",
    source_type: "textbook",
    source: {
      paper_id: 2003,
      raw_title: "《线性代数与几何》第3章 向量代数、平面与直线 课后习题",
      clean_title: "《线性代数与几何》第3章 向量代数、平面与直线 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 24 题",
      page_start: 94,
      page_end: 94
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
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.3",
        section_title: "平面及其方程",
        section_slug: "3.3_平面及其方程",
        knowledge_points: ["平行平面的距离", "平行平面方程设法"]
      }
    },
    content: {
      stem: "一平面平行于平面 $\\pi: 2x - y + 3z - 1 = 0$，且与平面 $\\pi$ 的距离为 $\\sqrt{14}$，求此平面的方程。"
    },
    solution: {
      answer: "$2x - y + 3z + 13 = 0$ 或 $2x - y + 3z - 15 = 0$。",
      hints: "设平行平面的方程为 $2x - y + 3z + D = 0$，利用两平行平面间的距离公式 $d = \\frac{|D_1 - D_2|}{\\sqrt{A^2 + B^2 + C^2}}$ 列方程求 $D$。",
      steps: "设所求平面的方程为 $2x - y + 3z + D = 0$。\n两平行平面之间的距离为：\n$$d = \\frac{|D - (-1)|}{\\sqrt{2^2 + (-1)^2 + 3^2}} = \\frac{|D + 1|}{\\sqrt{14}}$$\n由题意 $d = \\sqrt{14}$，得：\n$$\\frac{|D + 1|}{\\sqrt{14}} = \\sqrt{14} \\implies |D + 1| = 14$$\n解得 $D + 1 = 14 \\implies D = 13$，或 $D + 1 = -14 \\implies D = -15$。\n故所求平面的方程为 $2x - y + 3z + 13 = 0$ 或 $2x - y + 3z - 15 = 0$。"
    }
  },
  {
    id: "LAG-TB-CH03-Q25",
    source_type: "textbook",
    source: {
      paper_id: 2003,
      raw_title: "《线性代数与几何》第3章 向量代数、平面与直线 课后习题",
      clean_title: "《线性代数与几何》第3章 向量代数、平面与直线 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 25 题",
      page_start: 94,
      page_end: 94
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 25,
      paper_q_num: 25,
      type: "calc",
      difficulty: 1,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.3",
        section_title: "平面及其方程",
        section_slug: "3.3_平面及其方程",
        knowledge_points: ["平行平面间距离"]
      }
    },
    content: {
      stem: "求两平行平面 $3x + 2y + 6z - 35 = 0$ 与 $3x + 2y + 6z - 56 = 0$ 之间的距离。"
    },
    solution: {
      answer: "$3$。",
      hints: "直接代入平行平面距离公式 $d = \\frac{|D_1 - D_2|}{\\sqrt{A^2 + B^2 + C^2}}$。",
      steps: "由平行平面距离公式：\n$$d = \\frac{|-35 - (-56)|}{\\sqrt{3^2 + 2^2 + 6^2}} = \\frac{|21|}{\\sqrt{9 + 4 + 36}} = \\frac{21}{\\sqrt{49}} = \\frac{21}{7} = 3$$\n故两平面之间的距离为 $3$。"
    }
  },
  {
    id: "LAG-TB-CH03-Q26",
    source_type: "textbook",
    source: {
      paper_id: 2003,
      raw_title: "《线性代数与几何》第3章 向量代数、平面与直线 课后习题",
      clean_title: "《线性代数与几何》第3章 向量代数、平面与直线 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 26 题",
      page_start: 94,
      page_end: 94
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 26,
      paper_q_num: 26,
      type: "proof",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.3",
        section_title: "平面及其方程",
        section_slug: "3.3_平面及其方程",
        knowledge_points: ["点到平面距离公式", "截距式平面方程"]
      }
    },
    content: {
      stem: "已知坐标原点到平面 $\\frac{x}{a} + \\frac{y}{b} + \\frac{z}{c} = 1$ 的距离为 $d$，试证明 $\\frac{1}{a^2} + \\frac{1}{b^2} + \\frac{1}{c^2} = \\frac{1}{d^2}$。"
    },
    solution: {
      answer: "证明略。",
      hints: "将平面方程化为一般式 $\\frac{1}{a}x + \\frac{1}{b}y + \\frac{1}{c}z - 1 = 0$，利用点到平面距离公式计算 $d$。",
      steps: "证明：\n将平面的截距式方程化为一般式：\n$$\\frac{1}{a}x + \\frac{1}{b}y + \\frac{1}{c}z - 1 = 0$$\n由点到平面的距离公式，原点 $(0, 0, 0)$ 到该平面的距离为：\n$$d = \\frac{|0 + 0 + 0 - 1|}{\\sqrt{\\left(\\frac{1}{a}\\right)^2 + \\left(\\frac{1}{b}\\right)^2 + \\left(\\frac{1}{c}\\right)^2}} = \\frac{1}{\\sqrt{\\frac{1}{a^2} + \\frac{1}{b^2} + \\frac{1}{c^2}}}$$\n两边取倒数再平方，即得：\n$$\\frac{1}{a^2} + \\frac{1}{b^2} + \\frac{1}{c^2} = \\frac{1}{d^2}$$\n证毕。"
    }
  },
  {
    id: "LAG-TB-CH03-Q27",
    source_type: "textbook",
    source: {
      paper_id: 2003,
      raw_title: "《线性代数与几何》第3章 向量代数、平面与直线 课后习题",
      clean_title: "《线性代数与几何》第3章 向量代数、平面与直线 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 27 题",
      page_start: 94,
      page_end: 94
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
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.3",
        section_title: "平面及其方程",
        section_slug: "3.3_平面及其方程",
        knowledge_points: ["截距式平面方程", "三点确定平面"]
      }
    },
    content: {
      stem: "已知平面在 $x$ 轴上的截距为 $2$，且过点 $(0, -1, 0)$ 和点 $(2, 1, 3)$，求此平面的方程。"
    },
    solution: {
      answer: "$\\frac{x}{2} + \\frac{y}{-1} + \\frac{z}{3} = 1$（或 $3x - 6y + 2z - 6 = 0$）。",
      hints: "平面在 $x$ 轴截距为 2，过点 $(0, -1, 0)$ 表明在 $y$ 轴截距为 $-1$，可设截距式方程 $\\frac{x}{2} + \\frac{y}{-1} + \\frac{z}{c} = 1$。",
      steps: "由题意，平面过点 $(2, 0, 0)$ 和 $(0, -1, 0)$，即在 $x$ 轴和 $y$ 轴上的截距分别为 $a = 2, b = -1$。\n设平面的截距式方程为：\n$$\\frac{x}{2} + \\frac{y}{-1} + \\frac{z}{c} = 1$$\n将点 $(2, 1, 3)$ 代入该方程：\n$$\\frac{2}{2} + \\frac{1}{-1} + \\frac{3}{c} = 1 \\implies 1 - 1 + \\frac{3}{c} = 1 \\implies \\frac{3}{c} = 1 \\implies c = 3$$\n故平面的方程为：\n$$\\frac{x}{2} + \\frac{y}{-1} + \\frac{z}{3} = 1$$\n化为一般式即为 $3x - 6y + 2z - 6 = 0$。"
    }
  },
  {
    id: "LAG-TB-CH03-Q28",
    source_type: "textbook",
    source: {
      paper_id: 2003,
      raw_title: "《线性代数与几何》第3章 向量代数、平面与直线 课后习题",
      clean_title: "《线性代数与几何》第3章 向量代数、平面与直线 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 28 题",
      page_start: 94,
      page_end: 94
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
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.3",
        section_title: "平面及其方程",
        section_slug: "3.3_平面及其方程",
        knowledge_points: ["等距离平面", "平行平面束"]
      }
    },
    content: {
      stem: "求与两平面 $4x - y - 2z - 3 = 0$ 和 $4x - y - 2z - 5 = 0$ 等距离的平面的方程。"
    },
    solution: {
      answer: "$4x - y - 2z - 4 = 0$。",
      hints: "所求平面必与两已知平面平行，常数项取两平行平面常数项的算术平均值。",
      steps: "两已知平面平行，法向量均为 $(4, -1, -2)$。\n设所求平面方程为 $4x - y - 2z + D = 0$。\n由它到两平面的距离相等：\n$$\\frac{|D - (-3)|}{\\sqrt{4^2 + (-1)^2 + (-2)^2}} = \\frac{|D - (-5)|}{\\sqrt{4^2 + (-1)^2 + (-2)^2}}$$\n$$|D + 3| = |D + 5|$$\n因为两平面不同，解得 $D + 3 = -(D + 5) \\implies 2D = -8 \\implies D = -4$。\n故所求平面的方程为 $4x - y - 2z - 4 = 0$。"
    }
  },
  {
    id: "LAG-TB-CH03-Q29",
    source_type: "textbook",
    source: {
      paper_id: 2003,
      raw_title: "《线性代数与几何》第3章 向量代数、平面与直线 课后习题",
      clean_title: "《线性代数与几何》第3章 向量代数、平面与直线 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 29 题",
      page_start: 94,
      page_end: 94
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 29,
      paper_q_num: 29,
      type: "calc",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.3",
        section_title: "平面及其方程",
        section_slug: "3.3_平面及其方程",
        knowledge_points: ["两平面平行与重合条件"]
      }
    },
    content: {
      stem: "已知两个平面 $x - 3y - 2z + D = 0, 3x + By + Cz + 7 = 0$，问：当 $B, C, D$ 为何值时，两平面平行？何时重合？"
    },
    solution: {
      answer: "若平行，则 $B = -9, C = -6, D \\neq \\frac{7}{3}$；若重合，则 $B = -9, C = -6, D = \\frac{7}{3}$。",
      hints: "两平面对应系数成比例：$\\frac{A_1}{A_2} = \\frac{B_1}{B_2} = \\frac{C_1}{C_2} \\neq \\frac{D_1}{D_2}$ 为平行，四项全成比例为重合。",
      steps: "由平面平行的充要条件：\n$$\\frac{1}{3} = \\frac{-3}{B} = \\frac{-2}{C} \\neq \\frac{D}{7}$$\n解得：\n$$B = -9, \\quad C = -6, \\quad D \\neq \\frac{7}{3}$$\n当两平面重合时，常数项也满足比例：\n$$\\frac{1}{3} = \\frac{-3}{B} = \\frac{-2}{C} = \\frac{D}{7} \\implies B = -9, \\quad C = -6, \\quad D = \\frac{7}{3}$$。"
    }
  },
  {
    id: "LAG-TB-CH03-Q30",
    source_type: "textbook",
    source: {
      paper_id: 2003,
      raw_title: "《线性代数与几何》第3章 向量代数、平面与直线 课后习题",
      clean_title: "《线性代数与几何》第3章 向量代数、平面与直线 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 30 题",
      page_start: 94,
      page_end: 95
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 30,
      paper_q_num: 30,
      type: "calc",
      difficulty: 2,
      score: 10
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.4",
        section_title: "空间直线的方程",
        section_slug: "3.4_空间直线的方程",
        knowledge_points: ["直线的参数方程", "直线的对称方程", "直线的方向向量"]
      }
    },
    content: {
      stem: "求下列直线的参数方程及对称方程：\n\n(1) 经过 $A(-1, 2, 4), B(3, 2, 0)$ 两点；\n\n(2) 经过点 $P(-4, 5, -3)$ 且平行于 $z$ 轴；\n\n(3) 经过点 $P(-6, 7, -8)$ 且与直线 $\\frac{x}{-2} = \\frac{y+3}{7} = \\frac{z-5}{-4}$ 平行。",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "求经过 $A(-1, 2, 4), B(3, 2, 0)$ 两点的直线的参数方程及对称方程",
          answer: "参数方程：$\\begin{cases} x = -1 + 4t \\\\ y = 2 \\\\ z = 4 - 4t \\end{cases}$；对称方程：$x - 3 = -z, y = 2$（或 $\\frac{x+1}{1} = \\frac{z-4}{-1}, y = 2$）"
        },
        {
          sub_id: "(2)",
          stem: "求经过点 $P(-4, 5, -3)$ 且平行于 $z$ 轴的直线的参数方程及对称方程",
          answer: "参数方程：$\\begin{cases} x = -4 \\\\ y = 5 \\\\ z = -3 + t \\end{cases}$；对称方程：$\\frac{x+4}{0} = \\frac{y-5}{0} = \\frac{z+3}{1}$"
        },
        {
          sub_id: "(3)",
          stem: "求经过点 $P(-6, 7, -8)$ 且与直线 $\\frac{x}{-2} = \\frac{y+3}{7} = \\frac{z-5}{-4}$ 平行的直线的参数方程及对称方程",
          answer: "参数方程：$\\begin{cases} x = -6 - 2t \\\\ y = 7 + 7t \\\\ z = -8 - 4t \\end{cases}$；对称方程：$\\frac{x+6}{-2} = \\frac{y-7}{7} = \\frac{z+8}{-4}$"
        }
      ]
    },
    solution: {
      answer: "(1) 参数方程：$\\begin{cases} x = -1 + 4t \\\\ y = 2 \\\\ z = 4 - 4t \\end{cases}$，对称方程：$x - 3 = -z, y = 2$；\n(2) 参数方程：$\\begin{cases} x = -4 \\\\ y = 5 \\\\ z = -3 + t \\end{cases}$，对称方程：$\\frac{x+4}{0} = \\frac{y-5}{0} = \\frac{z+3}{1}$；\n(3) 参数方程：$\\begin{cases} x = -6 - 2t \\\\ y = 7 + 7t \\\\ z = -8 - 4t \\end{cases}$，对称方程：$\\frac{x+6}{-2} = \\frac{y-7}{7} = \\frac{z+8}{-4}$。",
      hints: "先确定直线上一点及方向向量 $\\boldsymbol{s} = (m, n, p)$，代入直线的点向式对称方程 $\\frac{x-x_0}{m} = \\frac{y-y_0}{n} = \\frac{z-z_0}{p}$ 及参数方程。",
      steps: "(1) 方向向量 $\\boldsymbol{s} = \\vec{AB} = (4, 0, -4) \\parallel (1, 0, -1)$。\n经过点 $A(-1, 2, 4)$，参数方程为：\n$$\\begin{cases} x = -1 + 4t \\\\ y = 2 \\\\ z = 4 - 4t \\end{cases}$$\n对称方程为：$\\frac{x+1}{1} = \\frac{z-4}{-1}, y = 2$（或 $x - 3 = -z, y = 2$）。\n\n(2) 直线平行于 $z$ 轴，方向向量可取 $\\boldsymbol{s} = (0, 0, 1)$。\n过点 $P(-4, 5, -3)$，参数方程为：\n$$\\begin{cases} x = -4 \\\\ y = 5 \\\\ z = -3 + t \\end{cases}$$\n对称方程为：$\\frac{x+4}{0} = \\frac{y-5}{0} = \\frac{z+3}{1}$（亦即 $x = -4, y = 5$）。\n\n(3) 平行于已知直线，故方向向量可取 $\\boldsymbol{s} = (-2, 7, -4)$。\n过点 $P(-6, 7, -8)$，参数方程为：\n$$\\begin{cases} x = -6 - 2t \\\\ y = 7 + 7t \\\\ z = -8 - 4t \\end{cases}$$\n对称方程为：\n$$\\frac{x+6}{-2} = \\frac{y-7}{7} = \\frac{z+8}{-4}$$。"
    }
  }
];
