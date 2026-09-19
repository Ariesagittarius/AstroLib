// scripts/vision_reconstruct/ch03_part1.cjs
module.exports = [
  {
    id: "LAG-TB-CH03-Q01",
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
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 1 题",
      page_start: 93,
      page_end: 93
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
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.1",
        section_title: "向量及其线性运算",
        section_slug: "3.1_向量及其线性运算",
        knowledge_points: ["向量加减法", "平行四边形法则", "向量的线性运算"]
      }
    },
    content: {
      stem: "已知平行四边形 $ABCD$ 的对角线为 $\\vec{AC}=\\boldsymbol{\\alpha}, \\vec{BD}=\\boldsymbol{\\beta}$，求 $\\vec{AB}, \\vec{BC}$。"
    },
    solution: {
      answer: "$\\vec{AB}=\\frac{1}{2}(\\boldsymbol{\\alpha}-\\boldsymbol{\\beta}), \\vec{BC}=\\frac{1}{2}(\\boldsymbol{\\alpha}+\\boldsymbol{\\beta})$。",
      hints: "利用平行四边形中向量加减法与对角线的关系：$\\vec{AC}=\\vec{AB}+\\vec{BC}$，$\\vec{BD}=\\vec{BC}-\\vec{AB}$。",
      steps: "由向量加法与减法的几何意义：\n$$\\vec{AC} = \\vec{AB} + \\vec{BC} = \\boldsymbol{\\alpha}$$\n$$\\vec{BD} = \\vec{BC} + \\vec{CD} = \\vec{BC} - \\vec{AB} = \\boldsymbol{\\beta}$$\n两式相加得 $2\\vec{BC} = \\boldsymbol{\\alpha} + \\boldsymbol{\\beta}$，解得：\n$$\\vec{BC} = \\frac{1}{2}(\\boldsymbol{\\alpha} + \\boldsymbol{\\beta})$$\n两式相减得 $2\\vec{AB} = \\boldsymbol{\\alpha} - \\boldsymbol{\\beta}$，解得：\n$$\\vec{AB} = \\frac{1}{2}(\\boldsymbol{\\alpha} - \\boldsymbol{\\beta})$$。"
    }
  },
  {
    id: "LAG-TB-CH03-Q02",
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
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 2 题",
      page_start: 93,
      page_end: 93
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
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.1",
        section_title: "向量及其线性运算",
        section_slug: "3.1_向量及其线性运算",
        knowledge_points: ["向量模的性质", "向量夹角", "单位向量", "三角不等式"]
      }
    },
    content: {
      stem: "判断下列等式何时成立：\n\n(1) $|\\boldsymbol{\\alpha}+\\boldsymbol{\\beta}|=|\\boldsymbol{\\alpha}-\\boldsymbol{\\beta}|$；\n\n(2) $|\\boldsymbol{\\alpha}+\\boldsymbol{\\beta}|=|\\boldsymbol{\\alpha}|+|\\boldsymbol{\\beta}|$；\n\n(3) $|\\boldsymbol{\\alpha}+\\boldsymbol{\\beta}|=|\\boldsymbol{\\alpha}|-|\\boldsymbol{\\beta}|$；\n\n(4) $\\frac{\\boldsymbol{\\alpha}}{|\\boldsymbol{\\alpha}|}=\\frac{\\boldsymbol{\\beta}}{|\\boldsymbol{\\beta}|}$。",
      sub_questions: [
        { sub_id: "(1)", stem: "$|\\boldsymbol{\\alpha}+\\boldsymbol{\\beta}|=|\\boldsymbol{\\alpha}-\\boldsymbol{\\beta}|$", answer: "$\\boldsymbol{\\alpha} \\perp \\boldsymbol{\\beta}$" },
        { sub_id: "(2)", stem: "$|\\boldsymbol{\\alpha}+\\boldsymbol{\\beta}|=|\\boldsymbol{\\alpha}|+|\\boldsymbol{\\beta}|$", answer: "$\\boldsymbol{\\alpha}$ 与 $\\boldsymbol{\\beta}$ 同向，或 $\\boldsymbol{\\alpha}=\\boldsymbol{0}$ 或 $\\boldsymbol{\\beta}=\\boldsymbol{0}$" },
        { sub_id: "(3)", stem: "$|\\boldsymbol{\\alpha}+\\boldsymbol{\\beta}|=|\\boldsymbol{\\alpha}|-|\\boldsymbol{\\beta}|$", answer: "$\\boldsymbol{\\alpha}$ 与 $\\boldsymbol{\\beta}$ 反向，且 $|\\boldsymbol{\\alpha}| \\ge |\\boldsymbol{\\beta}|$" },
        { sub_id: "(4)", stem: "$\\frac{\\boldsymbol{\\alpha}}{|\\boldsymbol{\\alpha}|}=\\frac{\\boldsymbol{\\beta}}{|\\boldsymbol{\\beta}|}$", answer: "$\\boldsymbol{\\alpha}$ 与 $\\boldsymbol{\\beta}$ 同向，且 $\\boldsymbol{\\alpha} \\neq \\boldsymbol{0}, \\boldsymbol{\\beta} \\neq \\boldsymbol{0}$" }
      ]
    },
    solution: {
      answer: "(1) $\\boldsymbol{\\alpha} \\perp \\boldsymbol{\\beta}$；\n(2) $\\boldsymbol{\\alpha}$ 与 $\\boldsymbol{\\beta}$ 同向，或 $\\boldsymbol{\\alpha}=\\boldsymbol{0}$ 或 $\\boldsymbol{\\beta}=\\boldsymbol{0}$；\n(3) $\\boldsymbol{\\alpha}$ 与 $\\boldsymbol{\\beta}$ 反向，且 $|\\boldsymbol{\\alpha}| \\ge |\\boldsymbol{\\beta}|$；\n(4) $\\boldsymbol{\\alpha}$ 与 $\\boldsymbol{\\beta}$ 同向，且 $\\boldsymbol{\\alpha} \\neq \\boldsymbol{0}, \\boldsymbol{\\beta} \\neq \\boldsymbol{0}$。",
      hints: "从向量模的平方展开式 $|\\boldsymbol{\\alpha}\\pm\\boldsymbol{\\beta}|^2=|\\boldsymbol{\\alpha}|^2+|\\boldsymbol{\\beta}|^2\\pm 2\\boldsymbol{\\alpha}\\cdot\\boldsymbol{\\beta}$，以及向量方向和单位向量的定义分析。",
      steps: "(1) 两边平方得 $|\\boldsymbol{\\alpha}|^2+2\\boldsymbol{\\alpha}\\cdot\\boldsymbol{\\beta}+|\\boldsymbol{\\beta}|^2 = |\\boldsymbol{\\alpha}|^2-2\\boldsymbol{\\alpha}\\cdot\\boldsymbol{\\beta}+|\\boldsymbol{\\beta}|^2$，即 $4\\boldsymbol{\\alpha}\\cdot\\boldsymbol{\\beta}=0$，故 $\\boldsymbol{\\alpha} \\perp \\boldsymbol{\\beta}$（或至少有一个为零向量）；\n(2) 两边平方得 $2\\boldsymbol{\\alpha}\\cdot\\boldsymbol{\\beta} = 2|\\boldsymbol{\\alpha}||\\boldsymbol{\\beta}|$，即 $\\cos\\langle\\boldsymbol{\\alpha},\\boldsymbol{\\beta}\\rangle = 1$，故 $\\boldsymbol{\\alpha}$ 与 $\\boldsymbol{\\beta}$ 同向（或至少有一个为零向量）；\n(3) 由三角不等式 $|\\boldsymbol{\\alpha}+\\boldsymbol{\\beta}| \\ge ||\\boldsymbol{\\alpha}|-|\\boldsymbol{\\beta}||$，等号成立当且仅当 $\\boldsymbol{\\alpha}$ 与 $\\boldsymbol{\\beta}$ 反向；又左边为非负数，右边必须非负，故还需 $|\\boldsymbol{\\alpha}| \\ge |\\boldsymbol{\\beta}|$；\n(4) $\\frac{\\boldsymbol{\\alpha}}{|\\boldsymbol{\\alpha}|}$ 与 $\\frac{\\boldsymbol{\\beta}}{|\\boldsymbol{\\beta}|}$ 分别为 $\\boldsymbol{\\alpha},\\boldsymbol{\\beta}$ 的单位向量，二者相等当且仅当它们方向相同，且要求模不为零，即 $\\boldsymbol{\\alpha},\\boldsymbol{\\beta}$ 同向且均为非零向量。"
    }
  },
  {
    id: "LAG-TB-CH03-Q03",
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
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 3 题",
      page_start: 93,
      page_end: 93
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
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.1",
        section_title: "向量及其线性运算",
        section_slug: "3.1_向量及其线性运算",
        knowledge_points: ["中点向量公式", "向量线性运算", "几何证明"]
      }
    },
    content: {
      stem: "设 $M$ 是平行四边形 $ABCD$ 的对角线的交点，证明：对平面上任意一点 $O$，$\\vec{OM}=\\frac{1}{4}(\\vec{OA}+\\vec{OB}+\\vec{OC}+\\vec{OD})$。"
    },
    solution: {
      answer: "证明略。",
      hints: "利用对角线互相平分，点 $M$ 既是线段 $AC$ 的中点，也是线段 $BD$ 的中点。",
      steps: "因为 $M$ 是平行四边形 $ABCD$ 对角线的交点，所以 $M$ 是线段 $AC$ 的中点，也是线段 $BD$ 的中点。\n由中点向量公式，对任意一点 $O$ 均有：\n$$\\vec{OM} = \\frac{1}{2}(\\vec{OA} + \\vec{OC})$$\n$$\\vec{OM} = \\frac{1}{2}(\\vec{OB} + \\vec{OD})$$\n将两式相加得：\n$$2\\vec{OM} = \\frac{1}{2}(\\vec{OA} + \\vec{OB} + \\vec{OC} + \\vec{OD})$$\n两边同除以 $2$，即得：\n$$\\vec{OM} = \\frac{1}{4}(\\vec{OA} + \\vec{OB} + \\vec{OC} + \\vec{OD})$$。"
    }
  },
  {
    id: "LAG-TB-CH03-Q04",
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
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 4 题",
      page_start: 93,
      page_end: 93
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 4,
      paper_q_num: 4,
      type: "proof",
      difficulty: 2,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.1",
        section_title: "向量及其线性运算",
        section_slug: "3.1_向量及其线性运算",
        knowledge_points: ["空间四面体", "向量回路法则", "中点向量关系"]
      }
    },
    content: {
      stem: "设 $A,B,C,D$ 是一个四面体的顶点，$M,N$ 分别是边 $AB,CD$ 的中点，证明：$\\vec{MN}=\\frac{1}{2}(\\vec{AD}+\\vec{BC})$。"
    },
    solution: {
      answer: "证明略。",
      hints: "通过折线路径分别沿 $M\\to A\\to D\\to N$ 和 $M\\to B\\to C\\to N$ 表示 $\\vec{MN}$，然后将两式相加并利用中点反向向量相消。",
      steps: "在四面体中，沿两条折线路径表示向量 $\\vec{MN}$：\n$$\\vec{MN} = \\vec{MA} + \\vec{AD} + \\vec{DN}$$\n$$\\vec{MN} = \\vec{MB} + \\vec{BC} + \\vec{CN}$$\n将上述两式相加，得：\n$$2\\vec{MN} = (\\vec{MA} + \\vec{MB}) + (\\vec{AD} + \\vec{BC}) + (\\vec{DN} + \\vec{CN})$$\n因为 $M$ 是 $AB$ 的中点，所以 $\\vec{MA} + \\vec{MB} = \\boldsymbol{0}$；\n因为 $N$ 是 $CD$ 的中点，所以 $\\vec{DN} = \\frac{1}{2}\\vec{DC} = -\\vec{CN}$，即 $\\vec{DN} + \\vec{CN} = \\boldsymbol{0}$。\n代入得：\n$$2\\vec{MN} = \\vec{AD} + \\vec{BC}$$\n两边同除以 $2$，即得：\n$$\\vec{MN} = \\frac{1}{2}(\\vec{AD} + \\vec{BC})$$。"
    }
  },
  {
    id: "LAG-TB-CH03-Q05",
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
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 5 题",
      page_start: 93,
      page_end: 93
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 5,
      paper_q_num: 5,
      type: "calc",
      difficulty: 1,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.1",
        section_title: "向量及其线性运算",
        section_slug: "3.1_向量及其线性运算",
        knowledge_points: ["向量共面条件", "三阶行列式", "向量的线性相关性"]
      }
    },
    content: {
      stem: "判断下列向量是否共面：\n\n(1) $\\boldsymbol{\\alpha}=(-2,3,10), \\boldsymbol{\\beta}=(-1,4,15), \\boldsymbol{\\gamma}=(3,6,-15)$；\n\n(2) $\\boldsymbol{\\alpha}=(7,0,3), \\boldsymbol{\\beta}=(-8,-3,-6), \\boldsymbol{\\gamma}=(3,2,3)$。",
      sub_questions: [
        { sub_id: "(1)", stem: "$\\boldsymbol{\\alpha}=(-2,3,10), \\boldsymbol{\\beta}=(-1,4,15), \\boldsymbol{\\gamma}=(3,6,-15)$", answer: "不共面" },
        { sub_id: "(2)", stem: "$\\boldsymbol{\\alpha}=(7,0,3), \\boldsymbol{\\beta}=(-8,-3,-6), \\boldsymbol{\\gamma}=(3,2,3)$", answer: "共面" }
      ]
    },
    solution: {
      answer: "(1) 不共面； (2) 共面。",
      hints: "三个向量共面的充要条件是以这三个向量为行（或列）构成的三阶行列式（混合积）等于 $0$。",
      steps: "(1) 计算坐标构成的行列式：\n$$D_1 = \\begin{vmatrix} -2 & 3 & 10 \\\\ -1 & 4 & 15 \\\\ 3 & 6 & -15 \\end{vmatrix} = 3\\begin{vmatrix} -2 & 3 & 10 \\\\ -1 & 4 & 15 \\\\ 1 & 2 & -5 \\end{vmatrix}$$\n将第 3 行分别加到第 1、2 行化简：\n$$r_1 + 2r_3: (0, 7, 0), \\quad r_2 + r_3: (0, 6, 10)$$\n按第 1 列展开得 $D_1 = 3 \\cdot 1 \\cdot (7 \\times 10 - 0) = 210 \\neq 0$。\n因为行列式不为零，所以 $\\boldsymbol{\\alpha}, \\boldsymbol{\\beta}, \\boldsymbol{\\gamma}$ 不共面；\n\n(2) 计算坐标构成的行列式：\n$$D_2 = \\begin{vmatrix} 7 & 0 & 3 \\\\ -8 & -3 & -6 \\\\ 3 & 2 & 3 \\end{vmatrix}$$\n按第 1 行展开：\n$$D_2 = 7\\begin{vmatrix} -3 & -6 \\\\ 2 & 3 \\end{vmatrix} + 3\\begin{vmatrix} -8 & -3 \\\\ 3 & 2 \\end{vmatrix} = 7(-9+12) + 3(-16+9) = 7(3) + 3(-7) = 21 - 21 = 0$$\n因为行列式等于零，所以 $\\boldsymbol{\\alpha}, \\boldsymbol{\\beta}, \\boldsymbol{\\gamma}$ 共面。"
    }
  },
  {
    id: "LAG-TB-CH03-Q06",
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
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 6 题",
      page_start: 93,
      page_end: 93
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 6,
      paper_q_num: 6,
      type: "calc",
      difficulty: 1,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.1",
        section_title: "向量及其线性运算",
        section_slug: "3.1_向量及其线性运算",
        knowledge_points: ["向量在坐标轴上的投影", "向量的模", "单位向量"]
      }
    },
    content: {
      stem: "一矢量的起点为 $A(1,4,-2)$，终点为 $B(-1,5,0)$，试求 $\\vec{AB}$ 在 $x$ 轴、$y$ 轴、$z$ 轴上的投影，并求 $|\\vec{AB}|$ 和 $\\vec{AB}$ 的单位矢量。"
    },
    solution: {
      answer: "$-2, 1, 2$； $3$； $\\left(-\\frac{2}{3}, \\frac{1}{3}, \\frac{2}{3}\\right)$。",
      hints: "向量在各坐标轴上的投影即为其对应的坐标分量，单位向量为该向量除以自身的模长。",
      steps: "由起终点坐标求向量 $\\vec{AB}$：\n$$\\vec{AB} = (-1-1, 5-4, 0-(-2)) = (-2, 1, 2)$$\n因此 $\\vec{AB}$ 在 $x, y, z$ 轴上的投影分别为：\n$$\\mathrm{Prj}_x \\vec{AB} = -2, \\quad \\mathrm{Prj}_y \\vec{AB} = 1, \\quad \\mathrm{Prj}_z \\vec{AB} = 2$$\n向量的模为：\n$$|\\vec{AB}| = \\sqrt{(-2)^2 + 1^2 + 2^2} = \\sqrt{4+1+4} = 3$$\n$\\vec{AB}$ 的单位矢量为：\n$$\\boldsymbol{e} = \\frac{\\vec{AB}}{|\\vec{AB}|} = \\frac{1}{3}(-2, 1, 2) = \\left(-\\frac{2}{3}, \\frac{1}{3}, \\frac{2}{3}\\right)$$。"
    }
  },
  {
    id: "LAG-TB-CH03-Q07",
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
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 7 题",
      page_start: 93,
      page_end: 93
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
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.1",
        section_title: "向量及其线性运算",
        section_slug: "3.1_向量及其线性运算",
        knowledge_points: ["向量在轴上的投影", "投影定理"]
      }
    },
    content: {
      stem: "设 $\\boldsymbol{r}$ 的模为 $1$，且与 $u$ 轴的夹角为 $\\frac{\\pi}{3}$，求 $\\boldsymbol{r}$ 在 $u$ 轴上投影。"
    },
    solution: {
      answer: "$\\frac{1}{2}$。",
      hints: "直接套用向量在轴上的投影公式：$\\mathrm{Prj}_u\\boldsymbol{r} = |\\boldsymbol{r}|\\cos\\theta$。",
      steps: "由向量在轴上的投影公式：\n$$\\mathrm{Prj}_u\\boldsymbol{r} = |\\boldsymbol{r}|\\cos\\theta = 1 \\cdot \\cos\\frac{\\pi}{3} = \\frac{1}{2}$$。"
    }
  },
  {
    id: "LAG-TB-CH03-Q08",
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
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 8 题",
      page_start: 93,
      page_end: 93
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 8,
      paper_q_num: 8,
      type: "calc",
      difficulty: 1,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.1",
        section_title: "向量及其线性运算",
        section_slug: "3.1_向量及其线性运算",
        knowledge_points: ["向量的坐标线性运算", "单位向量"]
      }
    },
    content: {
      stem: "已知向量 $\\boldsymbol{a}=(3,5,4), \\boldsymbol{b}=(-6,1,2), \\boldsymbol{c}=(0,-3,-4)$，求 $2\\boldsymbol{a}-3\\boldsymbol{b}+4\\boldsymbol{c}$ 及其单位向量。"
    },
    solution: {
      answer: "$(24, -5, -14), \\frac{1}{\\sqrt{797}}(24, -5, -14)$。",
      hints: "按坐标分量分别进行线性组合计算，再求模长并归一化。",
      steps: "按坐标运算：\n$$2\\boldsymbol{a} - 3\\boldsymbol{b} + 4\\boldsymbol{c} = 2(3,5,4) - 3(-6,1,2) + 4(0,-3,-4)$$\n$$= (6, 10, 8) + (18, -3, -6) + (0, -12, -16)$$\n$$= (6+18+0, 10-3-12, 8-6-16) = (24, -5, -14)$$\n求该向量的模：\n$$|(24, -5, -14)| = \\sqrt{24^2 + (-5)^2 + (-14)^2} = \\sqrt{576 + 25 + 196} = \\sqrt{797}$$\n故其单位向量为：\n$$\\frac{1}{\\sqrt{797}}(24, -5, -14)$$。"
    }
  },
  {
    id: "LAG-TB-CH03-Q09",
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
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 9 题",
      page_start: 93,
      page_end: 93
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 9,
      paper_q_num: 9,
      type: "calc",
      difficulty: 1,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.1",
        section_title: "向量及其线性运算",
        section_slug: "3.1_向量及其线性运算",
        knowledge_points: ["共面向量定理", "线性组合"]
      }
    },
    content: {
      stem: "已知 $\\boldsymbol{\\alpha}=(3,5,-1), \\boldsymbol{\\beta}=(2,2,3)$，求向量 $\\boldsymbol{\\gamma}$，使 $\\boldsymbol{\\alpha},\\boldsymbol{\\beta},\\boldsymbol{\\gamma}$ 共面。"
    },
    solution: {
      answer: "$(3\\lambda+2\\mu, 5\\lambda+2\\mu, -\\lambda+3\\mu)$（其中 $\\lambda, \\mu$ 为不全为零的实数）。",
      hints: "因为 $\\boldsymbol{\\alpha}$ 与 $\\boldsymbol{\\beta}$ 不平行，所以与它们共面的向量 $\\boldsymbol{\\gamma}$ 可以表示为 $\\boldsymbol{\\alpha}$ 与 $\\boldsymbol{\\beta}$ 的线性组合 $\\boldsymbol{\\gamma}=\\lambda\\boldsymbol{\\alpha}+\\mu\\boldsymbol{\\beta}$。",
      steps: "由于 $\\frac{3}{2} \\neq \\frac{5}{2}$，向量 $\\boldsymbol{\\alpha}$ 与 $\\boldsymbol{\\beta}$ 不共线。\n由共面向量基本定理，$\\boldsymbol{\\gamma}$ 与 $\\boldsymbol{\\alpha},\\boldsymbol{\\beta}$ 共面的充要条件是存在实数 $\\lambda, \\mu$，使得：\n$$\\boldsymbol{\\gamma} = \\lambda\\boldsymbol{\\alpha} + \\mu\\boldsymbol{\\beta}$$\n代入坐标可得：\n$$\\boldsymbol{\\gamma} = \\lambda(3,5,-1) + \\mu(2,2,3) = (3\\lambda+2\\mu, 5\\lambda+2\\mu, -\\lambda+3\\mu)$$\n其中 $\\lambda, \\mu$ 为不全为零的任意实数（若包含零向量则可为任意实数）。"
    }
  },
  {
    id: "LAG-TB-CH03-Q10",
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
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 10 题",
      page_start: 94,
      page_end: 94
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
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.1",
        section_title: "向量及其线性运算",
        section_slug: "3.1_向量及其线性运算",
        knowledge_points: ["方向余弦", "向量的模"]
      }
    },
    content: {
      stem: "求向量 $\\boldsymbol{\\alpha}=(5,-12,-13)$ 的方向余弦。"
    },
    solution: {
      answer: "$\\cos\\alpha = \\frac{5\\sqrt{2}}{26}, \\cos\\beta = -\\frac{6\\sqrt{2}}{13}, \\cos\\gamma = -\\frac{\\sqrt{2}}{2}$。",
      hints: "方向余弦公式：$\\cos\\alpha = \\frac{x}{|\\boldsymbol{\\alpha}|}, \\cos\\beta = \\frac{y}{|\\boldsymbol{\\alpha}|}, \\cos\\gamma = \\frac{z}{|\\boldsymbol{\\alpha}|}$。",
      steps: "先求向量 $\\boldsymbol{\\alpha}$ 的模：\n$$|\\boldsymbol{\\alpha}| = \\sqrt{5^2 + (-12)^2 + (-13)^2} = \\sqrt{25 + 144 + 169} = \\sqrt{338} = 13\\sqrt{2}$$\n则方向余弦为：\n$$\\cos\\alpha = \\frac{5}{13\\sqrt{2}} = \\frac{5\\sqrt{2}}{26}$$\n$$\\cos\\beta = \\frac{-12}{13\\sqrt{2}} = -\\frac{6\\sqrt{2}}{13}$$\n$$\\cos\\gamma = \\frac{-13}{13\\sqrt{2}} = -\\frac{1}{\\sqrt{2}} = -\\frac{\\sqrt{2}}{2}$$。"
    }
  },
  {
    id: "LAG-TB-CH03-Q11",
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
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 11 题",
      page_start: 94,
      page_end: 94
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 11,
      paper_q_num: 11,
      type: "calc",
      difficulty: 2,
      score: 10
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.2",
        section_title: "向量的数量积向量积混合积",
        section_slug: "3.2_向量的数量积向量积混合积",
        knowledge_points: ["数量积", "向量积", "投影向量", "三角形面积与高", "二重外积"]
      }
    },
    content: {
      stem: "计算下列各题：\n\n(1) $\\boldsymbol{\\alpha}=(3,4,5), \\boldsymbol{\\beta}=(2,1,2)$，求内积 $\\boldsymbol{\\alpha}\\cdot\\boldsymbol{\\beta}$ 和夹角 $\\langle\\boldsymbol{\\alpha},\\boldsymbol{\\beta}\\rangle$；\n\n(2) $\\boldsymbol{\\alpha}=(-7,13,3), \\boldsymbol{\\beta}=(-1,2,-2)$，求 $\\boldsymbol{\\alpha}$ 在 $\\boldsymbol{\\beta}$ 上的投影向量及投影向量的长；\n\n(3) $\\boldsymbol{\\alpha}=(1,-1,3), \\boldsymbol{\\beta}=(2,3,1), \\boldsymbol{\\gamma}=(2,1,2)$，求满足：垂直于 $\\boldsymbol{\\alpha}$ 和 $\\boldsymbol{\\beta}$，并与 $\\boldsymbol{\\gamma}$ 内积为 $1$ 的向量 $\\boldsymbol{x}$；\n\n(4) 求以 $A(-1,1,-2), B(2,9,-1), C(1,3,-3)$ 为顶点的 $\\triangle ABC$ 的面积及 $AC$ 边的高；\n\n(5) $\\boldsymbol{\\alpha}=(1,-1,1), \\boldsymbol{\\beta}=(1,2,-1), \\boldsymbol{\\gamma}=(2,1,4)$，求 $\\boldsymbol{\\alpha}\\times\\boldsymbol{\\beta}, \\boldsymbol{\\alpha}\\times(\\boldsymbol{\\beta}+\\boldsymbol{\\gamma}), (\\boldsymbol{\\alpha}\\times\\boldsymbol{\\beta})\\times\\boldsymbol{\\gamma}, \\boldsymbol{\\alpha}\\times(\\boldsymbol{\\beta}\\times\\boldsymbol{\\gamma})$。",
      sub_questions: [
        { sub_id: "(1)", stem: "$\\boldsymbol{\\alpha}=(3,4,5), \\boldsymbol{\\beta}=(2,1,2)$，求内积 $\\boldsymbol{\\alpha}\\cdot\\boldsymbol{\\beta}$ 和夹角 $\\langle\\boldsymbol{\\alpha},\\boldsymbol{\\beta}\\rangle$", answer: "$20, \\arccos\\frac{2\\sqrt{2}}{3}$" },
        { sub_id: "(2)", stem: "$\\boldsymbol{\\alpha}=(-7,13,3), \\boldsymbol{\\beta}=(-1,2,-2)$，求 $\\boldsymbol{\\alpha}$ 在 $\\boldsymbol{\\beta}$ 上的投影向量及投影向量的长", answer: "$(-3,6,-6), 9$" },
        { sub_id: "(3)", stem: "$\\boldsymbol{\\alpha}=(1,-1,3), \\boldsymbol{\\beta}=(2,3,1), \\boldsymbol{\\gamma}=(2,1,2)$，求满足：垂直于 $\\boldsymbol{\\alpha}$ 和 $\\boldsymbol{\\beta}$，并与 $\\boldsymbol{\\gamma}$ 内积为 $1$ 的向量 $\\boldsymbol{x}$", answer: "$(2,-1,-1)$" },
        { sub_id: "(4)", stem: "求以 $A(-1,1,-2), B(2,9,-1), C(1,3,-3)$ 为顶点的 $\\triangle ABC$ 的面积及 $AC$ 边的高", answer: "$7.5$（平方单位），$5$（长度单位）" },
        { sub_id: "(5)", stem: "$\\boldsymbol{\\alpha}=(1,-1,1), \\boldsymbol{\\beta}=(1,2,-1), \\boldsymbol{\\gamma}=(2,1,4)$，求 $\\boldsymbol{\\alpha}\\times\\boldsymbol{\\beta}, \\boldsymbol{\\alpha}\\times(\\boldsymbol{\\beta}+\\boldsymbol{\\gamma}), (\\boldsymbol{\\alpha}\\times\\boldsymbol{\\beta})\\times\\boldsymbol{\\gamma}, \\boldsymbol{\\alpha}\\times(\\boldsymbol{\\beta}\\times\\boldsymbol{\\gamma})$", answer: "$(-1,2,3), (-6,0,6), (5,10,-5), (9,12,3)$" }
      ]
    },
    solution: {
      answer: "(1) $20, \\arccos\\frac{2\\sqrt{2}}{3}$；\n(2) $(-3,6,-6), 9$；\n(3) $(2,-1,-1)$；\n(4) $7.5$（平方单位），$5$（长度单位）；\n(5) $(-1,2,3), (-6,0,6), (5,10,-5), (9,12,3)$。",
      hints: "综合运用数量积求夹角与投影、向量积求垂向向量与面积，以及二重向量外积的展开运算法则。",
      steps: "(1) $\\boldsymbol{\\alpha}\\cdot\\boldsymbol{\\beta} = 3\\times 2 + 4\\times 1 + 5\\times 2 = 6+4+10 = 20$；\n$|\\boldsymbol{\\alpha}| = \\sqrt{9+16+25} = 5\\sqrt{2}$，$|\\boldsymbol{\\beta}| = \\sqrt{4+1+4} = 3$；\n$\\cos\\langle\\boldsymbol{\\alpha},\\boldsymbol{\\beta}\\rangle = \\frac{20}{5\\sqrt{2}\\times 3} = \\frac{4}{3\\sqrt{2}} = \\frac{2\\sqrt{2}}{3}$，夹角为 $\\arccos\\frac{2\\sqrt{2}}{3}$；\n\n(2) $\\boldsymbol{\\alpha}\\cdot\\boldsymbol{\\beta} = 7 + 26 - 6 = 27$，$|\\boldsymbol{\\beta}| = \\sqrt{1+4+4} = 3$；\n投影长为 $\\mathrm{Prj}_{\\boldsymbol{\\beta}}\\boldsymbol{\\alpha} = \\frac{\\boldsymbol{\\alpha}\\cdot\\boldsymbol{\\beta}}{|\\boldsymbol{\\beta}|} = \\frac{27}{3} = 9$；\n投影向量为 $9 \\cdot \\frac{\\boldsymbol{\\beta}}{|\\boldsymbol{\\beta}|} = 3(-1,2,-2) = (-3,6,-6)$；\n\n(3) 因为 $\\boldsymbol{x} \\perp \\boldsymbol{\\alpha}$ 且 $\\boldsymbol{x} \\perp \\boldsymbol{\\beta}$，故 $\\boldsymbol{x} \\parallel \\boldsymbol{\\alpha}\\times\\boldsymbol{\\beta}$；\n$$\\boldsymbol{\\alpha}\\times\\boldsymbol{\\beta} = \\begin{vmatrix} \\boldsymbol{i} & \\boldsymbol{j} & \\boldsymbol{k} \\\\ 1 & -1 & 3 \\\\ 2 & 3 & 1 \\end{vmatrix} = (-10, 5, 5) = 5(-2,1,1)$$\n设 $\\boldsymbol{x} = k(-2,1,1)$，由 $\\boldsymbol{x}\\cdot\\boldsymbol{\\gamma} = 1$ 得 $k(-4+1+2) = -k = 1 \\implies k = -1$，故 $\\boldsymbol{x} = (2,-1,-1)$；\n\n(4) $\\vec{AB} = (3,8,1), \\vec{AC} = (2,2,-1)$；\n$$\\vec{AB}\\times\\vec{AC} = \\begin{vmatrix} \\boldsymbol{i} & \\boldsymbol{j} & \\boldsymbol{k} \\\\ 3 & 8 & 1 \\\\ 2 & 2 & -1 \\end{vmatrix} = (-10, 5, -10)$$\n$|\\vec{AB}\\times\\vec{AC}| = \\sqrt{100+25+100} = 15$，面积 $S = \\frac{1}{2}\\times 15 = 7.5$；\n$|\\vec{AC}| = \\sqrt{4+4+1} = 3$，$AC$ 边的高 $h = \\frac{2S}{|\\vec{AC}|} = \\frac{15}{3} = 5$；\n\n(5) 计算各项向量积：\n$$\\boldsymbol{\\alpha}\\times\\boldsymbol{\\beta} = \\begin{vmatrix} \\boldsymbol{i} & \\boldsymbol{j} & \\boldsymbol{k} \\\\ 1 & -1 & 1 \\\\ 1 & 2 & -1 \\end{vmatrix} = (-1, 2, 3)$$\n$$\\boldsymbol{\\beta}+\\boldsymbol{\\gamma} = (3,3,3) \\implies \\boldsymbol{\\alpha}\\times(\\boldsymbol{\\beta}+\\boldsymbol{\\gamma}) = (1,-1,1)\\times(3,3,3) = (-6, 0, 6)$$\n$$(\\boldsymbol{\\alpha}\\times\\boldsymbol{\\beta})\\times\\boldsymbol{\\gamma} = (-1,2,3)\\times(2,1,4) = (5, 10, -5)$$\n$$\\boldsymbol{\\beta}\\times\\boldsymbol{\\gamma} = (1,2,-1)\\times(2,1,4) = (9, -6, -3) \\implies \\boldsymbol{\\alpha}\\times(\\boldsymbol{\\beta}\\times\\boldsymbol{\\gamma}) = (1,-1,1)\\times(9,-6,-3) = (9, 12, 3)$$。"
    }
  },
  {
    id: "LAG-TB-CH03-Q12",
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
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 12 题",
      page_start: 94,
      page_end: 94
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 12,
      paper_q_num: 12,
      type: "calc",
      difficulty: 1,
      score: 5
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.2",
        section_title: "向量的数量积向量积混合积",
        section_slug: "3.2_向量的数量积向量积混合积",
        knowledge_points: ["数量积分配律", "数量积计算"]
      }
    },
    content: {
      stem: "已知 $|\\boldsymbol{a}|=3, |\\boldsymbol{\\beta}|=2, \\langle\\boldsymbol{a},\\boldsymbol{\\beta}\\rangle=\\frac{\\pi}{3}$，求 $(3\\boldsymbol{a}+2\\boldsymbol{\\beta})\\cdot(2\\boldsymbol{a}-5\\boldsymbol{\\beta})$。"
    },
    solution: {
      answer: "$-19$。",
      hints: "先算出 $\\boldsymbol{a}\\cdot\\boldsymbol{\\beta} = |\\boldsymbol{a}||\\boldsymbol{\\beta}|\\cos\\frac{\\pi}{3}$，再将数量积展开代入化简。",
      steps: "由题设：\n$$\\boldsymbol{a}\\cdot\\boldsymbol{\\beta} = |\\boldsymbol{a}||\\boldsymbol{\\beta}|\\cos\\frac{\\pi}{3} = 3 \\times 2 \\times \\frac{1}{2} = 3$$\n将原式按数量积分配律展开：\n$$(3\\boldsymbol{a}+2\\boldsymbol{\\beta})\\cdot(2\\boldsymbol{a}-5\\boldsymbol{\\beta}) = 6|\\boldsymbol{a}|^2 - 15\\boldsymbol{a}\\cdot\\boldsymbol{\\beta} + 4\\boldsymbol{\\beta}\\cdot\\boldsymbol{a} - 10|\\boldsymbol{\\beta}|^2$$\n$$= 6|\\boldsymbol{a}|^2 - 11\\boldsymbol{a}\\cdot\\boldsymbol{\\beta} - 10|\\boldsymbol{\\beta}|^2$$\n代入已知数值：\n$$= 6 \\times 3^2 - 11 \\times 3 - 10 \\times 2^2 = 54 - 33 - 40 = -19$$。"
    }
  },
  {
    id: "LAG-TB-CH03-Q13",
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
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 13 题",
      page_start: 94,
      page_end: 94
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 13,
      paper_q_num: 13,
      type: "calc",
      difficulty: 1,
      score: 5
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.2",
        section_title: "向量的数量积向量积混合积",
        section_slug: "3.2_向量的数量积向量积混合积",
        knowledge_points: ["向量和的模", "数量积恒等式"]
      }
    },
    content: {
      stem: "设向量 $\\boldsymbol{\\alpha},\\boldsymbol{\\beta},\\boldsymbol{\\gamma}$ 满足 $\\boldsymbol{\\alpha}+\\boldsymbol{\\beta}+\\boldsymbol{\\gamma}=\\boldsymbol{0}, |\\boldsymbol{\\alpha}|=3, |\\boldsymbol{\\beta}|=5, |\\boldsymbol{\\gamma}|=6$，求 $\\boldsymbol{\\alpha}\\cdot\\boldsymbol{\\beta}+\\boldsymbol{\\beta}\\cdot\\boldsymbol{\\gamma}+\\boldsymbol{\\gamma}\\cdot\\boldsymbol{\\alpha}$。"
    },
    solution: {
      answer: "$-35$。",
      hints: "对等式 $\\boldsymbol{\\alpha}+\\boldsymbol{\\beta}+\\boldsymbol{\\gamma}=\\boldsymbol{0}$ 两边做自身数量积（即取模的平方）。",
      steps: "由 $\\boldsymbol{\\alpha}+\\boldsymbol{\\beta}+\\boldsymbol{\\gamma}=\\boldsymbol{0}$，对其两边平方：\n$$|\\boldsymbol{\\alpha}+\\boldsymbol{\\beta}+\\boldsymbol{\\gamma}|^2 = |\\boldsymbol{\\alpha}|^2 + |\\boldsymbol{\\beta}|^2 + |\\boldsymbol{\\gamma}|^2 + 2(\\boldsymbol{\\alpha}\\cdot\\boldsymbol{\\beta} + \\boldsymbol{\\beta}\\cdot\\boldsymbol{\\gamma} + \\boldsymbol{\\gamma}\\cdot\\boldsymbol{\\alpha}) = 0$$\n代入模长：\n$$3^2 + 5^2 + 6^2 + 2(\\boldsymbol{\\alpha}\\cdot\\boldsymbol{\\beta} + \\boldsymbol{\\beta}\\cdot\\boldsymbol{\\gamma} + \\boldsymbol{\\gamma}\\cdot\\boldsymbol{\\alpha}) = 0$$\n$$9 + 25 + 36 + 2(\\boldsymbol{\\alpha}\\cdot\\boldsymbol{\\beta} + \\boldsymbol{\\beta}\\cdot\\boldsymbol{\\gamma} + \\boldsymbol{\\gamma}\\cdot\\boldsymbol{\\alpha}) = 0$$\n$$70 + 2(\\boldsymbol{\\alpha}\\cdot\\boldsymbol{\\beta} + \\boldsymbol{\\beta}\\cdot\\boldsymbol{\\gamma} + \\boldsymbol{\\gamma}\\cdot\\boldsymbol{\\alpha}) = 0$$\n解得：\n$$\\boldsymbol{\\alpha}\\cdot\\boldsymbol{\\beta} + \\boldsymbol{\\beta}\\cdot\\boldsymbol{\\gamma} + \\boldsymbol{\\gamma}\\cdot\\boldsymbol{\\alpha} = -35$$。"
    }
  },
  {
    id: "LAG-TB-CH03-Q14",
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
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 14 题",
      page_start: 94,
      page_end: 94
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 14,
      paper_q_num: 14,
      type: "calc",
      difficulty: 2,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.2",
        section_title: "向量的数量积向量积混合积",
        section_slug: "3.2_向量的数量积向量积混合积",
        knowledge_points: ["混合积性质", "向量积分配律", "轮换对称性"]
      }
    },
    content: {
      stem: "化简：$(\\boldsymbol{\\alpha}-2\\boldsymbol{\\beta}+2\\boldsymbol{\\gamma})\\cdot[(\\boldsymbol{\\alpha}-3\\boldsymbol{\\beta})\\times(\\boldsymbol{\\alpha}+2\\boldsymbol{\\beta}-5\\boldsymbol{\\gamma})]$。"
    },
    solution: {
      answer: "$15(\\boldsymbol{\\alpha},\\boldsymbol{\\beta},\\boldsymbol{\\gamma})$。",
      hints: "先利用向量积分配律和 $\\boldsymbol{u}\\times\\boldsymbol{u}=\\boldsymbol{0}$ 展开方括号内部，再作数量积化简混合积。",
      steps: "先展开方括号内的向量积：\n$$(\\boldsymbol{\\alpha}-3\\boldsymbol{\\beta})\\times(\\boldsymbol{\\alpha}+2\\boldsymbol{\\beta}-5\\boldsymbol{\\gamma})$$\n$$= \\boldsymbol{\\alpha}\\times\\boldsymbol{\\alpha} + 2\\boldsymbol{\\alpha}\\times\\boldsymbol{\\beta} - 5\\boldsymbol{\\alpha}\\times\\boldsymbol{\\gamma} - 3\\boldsymbol{\\beta}\\times\\boldsymbol{\\alpha} - 6\\boldsymbol{\\beta}\\times\\boldsymbol{\\beta} + 15\\boldsymbol{\\beta}\\times\\boldsymbol{\\gamma}$$\n因为 $\\boldsymbol{\\alpha}\\times\\boldsymbol{\\alpha}=\\boldsymbol{0}, \\boldsymbol{\\beta}\\times\\boldsymbol{\\beta}=\\boldsymbol{0}$，且 $-3\\boldsymbol{\\beta}\\times\\boldsymbol{\\alpha} = 3\\boldsymbol{\\alpha}\\times\\boldsymbol{\\beta}$，故化简为：\n$$= 5\\boldsymbol{\\alpha}\\times\\boldsymbol{\\beta} - 5\\boldsymbol{\\alpha}\\times\\boldsymbol{\\gamma} + 15\\boldsymbol{\\beta}\\times\\boldsymbol{\\gamma}$$\n再与 $(\\boldsymbol{\\alpha}-2\\boldsymbol{\\beta}+2\\boldsymbol{\\gamma})$ 作数量积。任何含有重复向量的混合积均为 $0$，保留非零项：\n$$\\boldsymbol{\\alpha} \\cdot (15\\boldsymbol{\\beta}\\times\\boldsymbol{\\gamma}) = 15(\\boldsymbol{\\alpha},\\boldsymbol{\\beta},\\boldsymbol{\\gamma})$$\n$$-2\\boldsymbol{\\beta} \\cdot (-5\\boldsymbol{\\alpha}\\times\\boldsymbol{\\gamma}) = 10(\\boldsymbol{\\beta},\\boldsymbol{\\alpha},\\boldsymbol{\\gamma}) = -10(\\boldsymbol{\\alpha},\\boldsymbol{\\beta},\\boldsymbol{\\gamma})$$\n$$2\\boldsymbol{\\gamma} \\cdot (5\\boldsymbol{\\alpha}\\times\\boldsymbol{\\beta}) = 10(\\boldsymbol{\\gamma},\\boldsymbol{\\alpha},\\boldsymbol{\\beta}) = 10(\\boldsymbol{\\alpha},\\boldsymbol{\\beta},\\boldsymbol{\\gamma})$$\n将三项相加：\n$$15(\\boldsymbol{\\alpha},\\boldsymbol{\\beta},\\boldsymbol{\\gamma}) - 10(\\boldsymbol{\\alpha},\\boldsymbol{\\beta},\\boldsymbol{\\gamma}) + 10(\\boldsymbol{\\alpha},\\boldsymbol{\\beta},\\boldsymbol{\\gamma}) = 15(\\boldsymbol{\\alpha},\\boldsymbol{\\beta},\\boldsymbol{\\gamma})$$。"
    }
  },
  {
    id: "LAG-TB-CH03-Q15",
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
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 15 题",
      page_start: 94,
      page_end: 94
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 15,
      paper_q_num: 15,
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
        knowledge_points: ["共面充要条件", "向量积共线", "混合积"]
      }
    },
    content: {
      stem: "证明：向量 $\\boldsymbol{\\alpha},\\boldsymbol{\\beta},\\boldsymbol{\\gamma}$ 共面的充分必要条件是 $\\boldsymbol{\\alpha}\\times\\boldsymbol{\\beta}, \\boldsymbol{\\beta}\\times\\boldsymbol{\\gamma}, \\boldsymbol{\\gamma}\\times\\boldsymbol{\\alpha}$ 共线。"
    },
    solution: {
      answer: "证明略。",
      hints: "利用 $\\boldsymbol{\\alpha},\\boldsymbol{\\beta},\\boldsymbol{\\gamma}$ 共面 $\\iff \\boldsymbol{\\alpha}=k_1\\boldsymbol{\\beta}+k_2\\boldsymbol{\\gamma}$（$\\boldsymbol{\\beta}$ 与 $\\boldsymbol{\\gamma}$ 不平行），及 $\\boldsymbol{a},\\boldsymbol{b}$ 共线 $\\iff \\boldsymbol{a}=k\\boldsymbol{b} (\\boldsymbol{b}\\neq\\boldsymbol{0})$。",
      steps: "必要性：设 $\\boldsymbol{\\alpha}, \\boldsymbol{\\beta}, \\boldsymbol{\\gamma}$ 共面。\n若它们两两共线，则各外积均为 $\\boldsymbol{0}$，显然共线。\n若不全共线，不妨设 $\\boldsymbol{\\beta}, \\boldsymbol{\\gamma}$ 不共线，则存在实数 $k_1, k_2$ 使得 $\\boldsymbol{\\alpha} = k_1\\boldsymbol{\\beta} + k_2\\boldsymbol{\\gamma}$。\n计算各外积：\n$$\\boldsymbol{\\alpha}\\times\\boldsymbol{\\beta} = (k_1\\boldsymbol{\\beta} + k_2\\boldsymbol{\\gamma})\\times\\boldsymbol{\\beta} = k_2(\\boldsymbol{\\gamma}\\times\\boldsymbol{\\beta}) = -k_2(\\boldsymbol{\\beta}\\times\\boldsymbol{\\gamma})$$\n$$\\boldsymbol{\\gamma}\\times\\boldsymbol{\\alpha} = \\boldsymbol{\\gamma}\\times(k_1\\boldsymbol{\\beta} + k_2\\boldsymbol{\\gamma}) = k_1(\\boldsymbol{\\gamma}\\times\\boldsymbol{\\beta}) = -k_1(\\boldsymbol{\\beta}\\times\\boldsymbol{\\gamma})$$\n因此 $\\boldsymbol{\\alpha}\\times\\boldsymbol{\\beta}$ 与 $\\boldsymbol{\\gamma}\\times\\boldsymbol{\\alpha}$ 均与 $\\boldsymbol{\\beta}\\times\\boldsymbol{\\gamma}$ 共线，故这三个外积互相共线。\n\n充分性：若 $\\boldsymbol{\\alpha}\\times\\boldsymbol{\\beta}, \\boldsymbol{\\beta}\\times\\boldsymbol{\\gamma}, \\boldsymbol{\\gamma}\\times\\boldsymbol{\\alpha}$ 共线。\n若其中之一为非零向量，设 $\\boldsymbol{\\beta}\\times\\boldsymbol{\\gamma} \\neq \\boldsymbol{0}$，则存在常数 $k$ 使得 $\\boldsymbol{\\alpha}\\times\\boldsymbol{\\beta} = k(\\boldsymbol{\\beta}\\times\\boldsymbol{\\gamma})$。\n两边与 $\\boldsymbol{\\beta}$ 做数量积：\n$$(\\boldsymbol{\\alpha}\\times\\boldsymbol{\\beta})\\cdot\\boldsymbol{\\beta} = 0 = k(\\boldsymbol{\\beta}\\times\\boldsymbol{\\gamma})\\cdot\\boldsymbol{\\beta} = 0$$\n再与 $\\boldsymbol{\\gamma}$ 作数量积：\n$$(\\boldsymbol{\\alpha}\\times\\boldsymbol{\\beta})\\cdot\\boldsymbol{\\gamma} = k(\\boldsymbol{\\beta}\\times\\boldsymbol{\\gamma})\\cdot\\boldsymbol{\\gamma} = 0$$\n即混合积 $(\\boldsymbol{\\alpha},\\boldsymbol{\\beta},\\boldsymbol{\\gamma}) = (\\boldsymbol{\\alpha}\\times\\boldsymbol{\\beta})\\cdot\\boldsymbol{\\gamma} = 0$。\n由混合积为 $0$ 的几何意义，$\\boldsymbol{\\alpha}, \\boldsymbol{\\beta}, \\boldsymbol{\\gamma}$ 共面。\n若三者外积均为零向量，则 $\\boldsymbol{\\alpha},\\boldsymbol{\\beta},\\boldsymbol{\\gamma}$ 互相平行，自然共面。\n综上，原命题得证。"
    }
  }
];
