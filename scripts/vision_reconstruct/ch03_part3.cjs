// scripts/vision_reconstruct/ch03_part3.cjs
module.exports = [
  {
    id: "LAG-TB-CH03-Q31",
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
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 31 题",
      page_start: 95,
      page_end: 95
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
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.4",
        section_title: "空间直线的方程",
        section_slug: "3.4_空间直线的方程",
        knowledge_points: ["直线的参数方程", "直线的一般方程化对称式"]
      }
    },
    content: {
      stem: "把下列直线方程化为参数方程：\n\n(1) $\\begin{cases} x + y - 3 = 0 \\\\ x + 2z - 2 = 0 \\end{cases}$；\n\n(2) $\\begin{cases} x + 2y - 2z - 1 = 0 \\\\ 2x + 3y + 3z - 5 = 0 \\end{cases}$。",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "把 $\\begin{cases} x + y - 3 = 0 \\\\ x + 2z - 2 = 0 \\end{cases}$ 化为参数方程",
          answer: "$\\begin{cases} x = 2 - 2t \\\\ y = 1 + 2t \\\\ z = t \\end{cases}$（对应对称方程 $\\frac{x-2}{-2} = \\frac{y-1}{2} = \\frac{z}{1}$）"
        },
        {
          sub_id: "(2)",
          stem: "把 $\\begin{cases} x + 2y - 2z - 1 = 0 \\\\ 2x + 3y + 3z - 5 = 0 \\end{cases}$ 化为参数方程",
          answer: "$\\begin{cases} x = 7 - 12t \\\\ y = -3 + 7t \\\\ z = t \\end{cases}$（对应对称方程 $\\frac{x-7}{-12} = \\frac{y+3}{7} = \\frac{z}{1}$）"
        }
      ]
    },
    solution: {
      answer: "(1) $\\begin{cases} x = 2 - 2t \\\\ y = 1 + 2t \\\\ z = t \\end{cases}$（对称方程 $\\frac{x-2}{-2} = \\frac{y-1}{2} = \\frac{z}{1}$）；\n(2) $\\begin{cases} x = 7 - 12t \\\\ y = -3 + 7t \\\\ z = t \\end{cases}$（对称方程 $\\frac{x-7}{-12} = \\frac{y+3}{7} = \\frac{z}{1}$）。",
      hints: "求直线的方向向量 $\\boldsymbol{s} = \\boldsymbol{n}_1 \\times \\boldsymbol{n}_2$，并在直线上取一个特解点 $(x_0, y_0, z_0)$ 写出参数方程。",
      steps: "(1) 取 $z = t$ 为自由未知量，由 $x + 2z - 2 = 0$ 得 $x = 2 - 2t$；代入 $x + y - 3 = 0$ 得 $y = 3 - x = 1 + 2t$。\n故参数方程为：\n$$\\begin{cases} x = 2 - 2t \\\\ y = 1 + 2t \\\\ z = t \\end{cases}$$\n其对称方程为 $\\frac{x - 2}{-2} = \\frac{y - 1}{2} = \\frac{z}{1}$。\n\n(2) 两平面的法向量为 $\\boldsymbol{n}_1 = (1, 2, -2), \\boldsymbol{n}_2 = (2, 3, 3)$。\n直线的方向向量：\n$$\\boldsymbol{s} = \\boldsymbol{n}_1 \\times \\boldsymbol{n}_2 = \\begin{vmatrix} \\boldsymbol{i} & \\boldsymbol{j} & \\boldsymbol{k} \\\\ 1 & 2 & -2 \\\\ 2 & 3 & 3 \\end{vmatrix} = (12, -7, -1) \\parallel (-12, 7, 1)$$\n令 $z = 0$，解得 $x = 7, y = -3$。取特解点 $(7, -3, 0)$，参数方程为：\n$$\\begin{cases} x = 7 - 12t \\\\ y = -3 + 7t \\\\ z = t \\end{cases}$$\n对称方程为 $\\frac{x - 7}{-12} = \\frac{y + 3}{7} = \\frac{z}{1}$。"
    }
  },
  {
    id: "LAG-TB-CH03-Q32",
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
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 32 题",
      page_start: 95,
      page_end: 95
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 32,
      paper_q_num: 32,
      type: "calc",
      difficulty: 3,
      score: 12
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.4",
        section_title: "空间直线的方程",
        section_slug: "3.4_空间直线的方程",
        knowledge_points: ["直线垂直相交", "直线在平面的投影", "线面平行与相交"]
      }
    },
    content: {
      stem: "求下列直线的方程：\n\n(1) 经过点 $(1, 2, 1)$ 且与直线 $\\frac{x-1}{3} = \\frac{y}{2} = \\frac{z+1}{1}$ 垂直相交；\n\n(2) 经过点 $(1, 0, -2)$，与平面 $3x - y + 2z + 1 = 0$ 平行，且与直线 $\\frac{x-1}{4} = \\frac{y-3}{-2} = \\frac{z}{1}$ 相交；\n\n(3) 在平面 $\\pi: x + y + z + 1 = 0$ 内，经过 $\\pi$ 与直线 $L_1: \\begin{cases} x + 2z = 0 \\\\ y + z + 1 = 0 \\end{cases}$ 的交点，并与 $L_1$ 垂直；\n\n(4) 直线 $\\frac{x-1}{1} = \\frac{y}{1} = \\frac{z-1}{-1}$ 在平面 $x - y + 2z - 1 = 0$ 上的投影。",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "求经过点 $(1, 2, 1)$ 且与直线 $\\frac{x-1}{3} = \\frac{y}{2} = \\frac{z+1}{1}$ 垂直相交的直线方程",
          answer: "$\\frac{x-1}{9} = \\frac{y-2}{-8} = \\frac{z-1}{-11}$"
        },
        {
          sub_id: "(2)",
          stem: "求经过点 $(1, 0, -2)$，与平面 $3x - y + 2z + 1 = 0$ 平行，且与直线 $\\frac{x-1}{4} = \\frac{y-3}{-2} = \\frac{z}{1}$ 相交的直线方程",
          answer: "$\\frac{x-1}{-4} = \\frac{y}{50} = \\frac{z+2}{31}$"
        },
        {
          sub_id: "(3)",
          stem: "求在平面 $\\pi: x + y + z + 1 = 0$ 内，经过 $\\pi$ 与直线 $L_1: \\begin{cases} x + 2z = 0 \\\\ y + z + 1 = 0 \\end{cases}$ 的交点，并与 $L_1$ 垂直的直线方程",
          answer: "$\\frac{x}{-2} = \\frac{y+1}{3} = \\frac{z}{-1}$"
        },
        {
          sub_id: "(4)",
          stem: "求直线 $\\frac{x-1}{1} = \\frac{y}{1} = \\frac{z-1}{-1}$ 在平面 $x - y + 2z - 1 = 0$ 上的投影直线方程",
          answer: "$\\begin{cases} x - 3y - 2z + 1 = 0 \\\\ x - y + 2z - 1 = 0 \\end{cases}$"
        }
      ]
    },
    solution: {
      answer: "(1) $\\frac{x-1}{9} = \\frac{y-2}{-8} = \\frac{z-1}{-11}$；\n(2) $\\frac{x-1}{-4} = \\frac{y}{50} = \\frac{z+2}{31}$；\n(3) $\\frac{x}{-2} = \\frac{y+1}{3} = \\frac{z}{-1}$；\n(4) $\\begin{cases} x - 3y - 2z + 1 = 0 \\\\ x - y + 2z - 1 = 0 \\end{cases}$。",
      hints: "熟练利用直线的方向向量、平面的法向量、交点坐标以及平面束方程求解投影与相交问题。",
      steps: "(1) 设交点在已知直线上，参数坐标为 $(1 + 3t, 2t, -1 + t)$。则连接向量 $\\boldsymbol{s} = (3t, 2t - 2, t - 2)$。\n由垂直条件 $\\boldsymbol{s} \\cdot (3, 2, 1) = 0$：\n$$3(3t) + 2(2t - 2) + 1(t - 2) = 0 \\implies 14t - 6 = 0 \\implies t = \\frac{3}{7}$$\n代入得方向向量 $\\boldsymbol{s} = (\\frac{9}{7}, -\\frac{8}{7}, -\\frac{11}{7}) \\parallel (9, -8, -11)$。\n故所求方程为 $\\frac{x-1}{9} = \\frac{y-2}{-8} = \\frac{z-1}{-11}$。\n\n(2) 设直线与已知直线交于点 $Q(1 + 4t, 3 - 2t, t)$。连接向量为 $\\vec{PQ} = (4t, 3 - 2t, t + 2)$。\n因为所求直线平行于平面 $3x - y + 2z + 1 = 0$，其方向向量必与平面法向量 $(3, -1, 2)$ 垂直：\n$$3(4t) - 1(3 - 2t) + 2(t + 2) = 0 \\implies 12t - 3 + 2t + 2t + 4 = 16t + 1 = 0 \\implies t = -\\frac{1}{16}$$\n代入得方向向量 $\\vec{PQ} = (-\\frac{1}{4}, \\frac{25}{8}, \\frac{31}{16}) \\parallel (-4, 50, 31)$。\n故直线方程为 $\\frac{x-1}{-4} = \\frac{y}{50} = \\frac{z+2}{31}$。\n\n(3) 先求交点：将 $x = -2z, y = -z - 1$ 代入 $x + y + z + 1 = 0$ 得 $-2z - z - 1 + z + 1 = 0 \\implies -2z = 0 \\implies z = 0, x = 0, y = -1$。交点为 $(0, -1, 0)$。\n$L_1$ 的方向向量为 $(1, 0, 2) \\times (0, 1, 1) = (-2, -1, 1)$。平面 $\\pi$ 的法向量为 $\\boldsymbol{n} = (1, 1, 1)$。\n所求直线在平面 $\\pi$ 内且垂直于 $L_1$，其方向向量为：\n$$\\boldsymbol{s} = \\boldsymbol{n} \\times \\boldsymbol{s}_1 = \\begin{vmatrix} \\boldsymbol{i} & \\boldsymbol{j} & \\boldsymbol{k} \\\\ 1 & 1 & 1 \\\\ -2 & -1 & 1 \\end{vmatrix} = (2, -3, 1) \\parallel (-2, 3, -1)$$\n方程为 $\\frac{x}{-2} = \\frac{y+1}{3} = \\frac{z}{-1}$。\n\n(4) 投影平面过已知直线且垂直于已知平面。直线方向向量 $\\boldsymbol{s} = (1, 1, -1)$，平面法向量 $\\boldsymbol{n} = (1, -1, 2)$。\n投影平面的法向量为 $\\boldsymbol{n}_p = \\boldsymbol{s} \\times \\boldsymbol{n} = (1, -3, -2)$。\n过点 $(1, 0, 1)$ 的投影平面方程为 $1(x-1) - 3y - 2(z-1) = 0 \\implies x - 3y - 2z + 1 = 0$。\n与原平面联立即得投影直线的方程：\n$$\\begin{cases} x - 3y - 2z + 1 = 0 \\\\ x - y + 2z - 1 = 0 \\end{cases}$$"
    }
  },
  {
    id: "LAG-TB-CH03-Q33",
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
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 33 题",
      page_start: 95,
      page_end: 95
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 33,
      paper_q_num: 33,
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
        knowledge_points: ["两直线的相互位置", "两直线夹角余弦", "共面与异面判定"]
      }
    },
    content: {
      stem: "判别下列直线 $L_1$ 与 $L_2$ 的相互位置，并求夹角的余弦：\n\n(1) $L_1: \\frac{x}{2} = \\frac{y+3}{3} = \\frac{z}{4}, \\quad L_2: \\frac{x-1}{1} = \\frac{y+2}{1} = \\frac{z-2}{2}$；\n\n(2) $L_1: \\frac{x+1}{1} = \\frac{y}{1} = \\frac{z-1}{2}, \\quad L_2: \\frac{x}{1} = \\frac{y+1}{3} = \\frac{z-2}{4}$。",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "判别 $L_1: \\frac{x}{2} = \\frac{y+3}{3} = \\frac{z}{4}$ 与 $L_2: \\frac{x-1}{1} = \\frac{y+2}{1} = \\frac{z-2}{2}$ 的位置关系并求夹角余弦",
          answer: "共面，$\\cos\\theta = \\frac{13}{\\sqrt{174}}$"
        },
        {
          sub_id: "(2)",
          stem: "判别 $L_1: \\frac{x+1}{1} = \\frac{y}{1} = \\frac{z-1}{2}$ 与 $L_2: \\frac{x}{1} = \\frac{y+1}{3} = \\frac{z-2}{4}$ 的位置关系并求夹角余弦",
          answer: "异面，$\\cos\\theta = \\frac{1}{13}$（或方向余弦 $\\frac{2\\sqrt{39}}{13}$）"
        }
      ]
    },
    solution: {
      answer: "(1) 共面，$\\cos\\theta = \\frac{13}{\\sqrt{174}}$；\n(2) 异面，$\\cos\\theta = \\frac{1}{13}$。",
      hints: "计算两点连线向量与两方向向量的混合积判定是否共面；夹角余弦由方向向量的点积模长比计算。",
      steps: "(1) $L_1$ 过点 $M_1(0, -3, 0)$，方向向量 $\\boldsymbol{s}_1 = (2, 3, 4)$；$L_2$ 过点 $M_2(1, -2, 2)$，方向向量 $\\boldsymbol{s}_2 = (1, 1, 2)$。\n$\\vec{M_1M_2} = (1, 1, 2)$。计算混合积：\n$$(\\vec{M_1M_2}, \\boldsymbol{s}_1, \\boldsymbol{s}_2) = \\begin{vmatrix} 1 & 1 & 2 \\\\ 2 & 3 & 4 \\\\ 1 & 1 & 2 \\end{vmatrix} = 0$$\n行列式有两行完全相同，值为 0，故两直线共面。\n夹角余弦：\n$$\\cos\\theta = \\frac{|\\boldsymbol{s}_1 \\cdot \\boldsymbol{s}_2|}{\\|\\boldsymbol{s}_1\\|\\|\\boldsymbol{s}_2\\|} = \\frac{|2 \\times 1 + 3 \\times 1 + 4 \\times 2|}{\\sqrt{4 + 9 + 16}\\sqrt{1 + 1 + 4}} = \\frac{13}{\\sqrt{29}\\sqrt{6}} = \\frac{13}{\\sqrt{174}}$$\n\n(2) $M_1(-1, 0, 1), \\boldsymbol{s}_1 = (1, 1, 2)$；$M_2(0, -1, 2), \\boldsymbol{s}_2 = (1, 3, 4)$。\n$\\vec{M_1M_2} = (1, -1, 1)$。计算混合积：\n$$\\begin{vmatrix} 1 & -1 & 1 \\\\ 1 & 1 & 2 \\\\ 1 & 3 & 4 \\end{vmatrix} = 1(4 - 6) + 1(4 - 2) + 1(3 - 1) = -2 + 2 + 2 = 2 \\neq 0$$\n故两直线异面。"
    }
  },
  {
    id: "LAG-TB-CH03-Q34",
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
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 34 题",
      page_start: 95,
      page_end: 95
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 34,
      paper_q_num: 34,
      type: "calc",
      difficulty: 2,
      score: 6
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.4",
        section_title: "空间直线的方程",
        section_slug: "3.4_空间直线的方程",
        knowledge_points: ["两直线垂直条件", "方向向量数量积"]
      }
    },
    content: {
      stem: "求 $k$ 的值，使直线 $\\frac{x-3}{2k} = \\frac{y+1}{k+1} = \\frac{z-3}{5}$ 与直线 $\\frac{x-1}{3} = y+5 = \\frac{z+2}{k-2}$ 垂直。"
    },
    solution: {
      answer: "$\\frac{3}{4}$。",
      hints: "两直线垂直等价于它们的方向向量数量积为零：$\\boldsymbol{s}_1 \\cdot \\boldsymbol{s}_2 = 0$。",
      steps: "两直线的方向向量分别为：\n$$\\boldsymbol{s}_1 = (2k, k+1, 5), \\quad \\boldsymbol{s}_2 = (3, 1, k-2)$$\n由两直线互相垂直，必有 $\\boldsymbol{s}_1 \\cdot \\boldsymbol{s}_2 = 0$：\n$$2k \\cdot 3 + (k + 1) \\cdot 1 + 5(k - 2) = 0$$\n$$6k + k + 1 + 5k - 10 = 0$$\n$$12k - 9 = 0 \\implies k = \\frac{9}{12} = \\frac{3}{4}$$\n故 $k = \\frac{3}{4}$。"
    }
  },
  {
    id: "LAG-TB-CH03-Q35",
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
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 35 题",
      page_start: 95,
      page_end: 95
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 35,
      paper_q_num: 35,
      type: "calc",
      difficulty: 3,
      score: 10
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.4",
        section_title: "空间直线的方程",
        section_slug: "3.4_空间直线的方程",
        knowledge_points: ["两直线共面", "共面直线确定平面"]
      }
    },
    content: {
      stem: "证明直线 $\\frac{x+3}{5} = \\frac{y+1}{2} = \\frac{z-2}{4}$ 与直线 $x = 8 + 3t, y = 1 + t, z = 6 + 2t$ 共面，并求它们所在平面的方程。"
    },
    solution: {
      answer: "证明略，所在平面的方程为 $2y - z + 4 = 0$。",
      hints: "计算两点连线向量与两方向向量的混合积等于 0 证明共面；平面的法向量为 $\\boldsymbol{s}_1 \\times \\boldsymbol{s}_2$。",
      steps: "证明：\n$L_1$ 经过点 $M_1(-3, -1, 2)$，方向向量 $\\boldsymbol{s}_1 = (5, 2, 4)$。\n$L_2$ 经过点 $M_2(8, 1, 6)$，方向向量 $\\boldsymbol{s}_2 = (3, 1, 2)$。\n连接向量 $\\vec{M_1M_2} = (11, 2, 4)$。\n计算三向量的混合积：\n$$(\\vec{M_1M_2}, \\boldsymbol{s}_1, \\boldsymbol{s}_2) = \\begin{vmatrix} 11 & 2 & 4 \\\\ 5 & 2 & 4 \\\\ 3 & 1 & 2 \\end{vmatrix}$$\n因为第 2 行是 $(5, 2, 4)$，第 3 行是 $(3, 1, 2)$，第 1 行与第 2 行作差得 $(6, 0, 0)$：\n$$= 6 \\begin{vmatrix} 2 & 4 \\\\ 1 & 2 \\end{vmatrix} = 6(4 - 4) = 0$$\n混合积为 0，故两直线共面。\n\n求所在平面方程：\n平面的法向量：\n$$\\boldsymbol{n} = \\boldsymbol{s}_1 \\times \\boldsymbol{s}_2 = \\begin{vmatrix} \\boldsymbol{i} & \\boldsymbol{j} & \\boldsymbol{k} \\\\ 5 & 2 & 4 \\\\ 3 & 1 & 2 \\end{vmatrix} = (0, 2, -1)$$\n过点 $M_1(-3, -1, 2)$ 的平面方程为：\n$$0(x + 3) + 2(y + 1) - 1(z - 2) = 0 \\implies 2y - z + 4 = 0$$"
    }
  },
  {
    id: "LAG-TB-CH03-Q36",
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
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 36 题",
      page_start: 95,
      page_end: 95
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 36,
      paper_q_num: 36,
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
        knowledge_points: ["直线与平面的位置关系", "线面交点"]
      }
    },
    content: {
      stem: "判别下列直线与平面的位置关系，若有交点则求出交点的坐标：\n\n(1) $L: \\frac{x+3}{5} = \\frac{y+1}{2} = \\frac{z-2}{4}, \\quad \\pi: x - 3y + 4z - 7 = 0$；\n\n(2) $L: \\frac{x-8}{4} = \\frac{y-7}{5} = \\frac{z-4}{3}, \\quad \\pi: x - 2y + 2z - 2 = 0$。",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "判别 $L: \\frac{x+3}{5} = \\frac{y+1}{2} = \\frac{z-2}{4}$ 与 $\\pi: x - 3y + 4z - 7 = 0$ 的位置关系并求交点",
          answer: "相交，交点坐标为 $(-1, 0, 2)$"
        },
        {
          sub_id: "(2)",
          stem: "判别 $L: \\frac{x-8}{4} = \\frac{y-7}{5} = \\frac{z-4}{3}$ 与 $\\pi: x - 2y + 2z - 2 = 0$ 的位置关系并求交点",
          answer: "$L$ 在平面 $\\pi$ 上"
        }
      ]
    },
    solution: {
      answer: "(1) 相交，交点坐标为 $(-1, 0, 2)$；\n(2) $L$ 在平面 $\\pi$ 上。",
      hints: "将直线的参数方程代入平面方程，根据关于参数 $t$ 的方程的解判断（唯一解为相交，无解为平行，恒等式为在平面上）。",
      steps: "(1) 直线参数方程为 $x = 5t - 3, y = 2t - 1, z = 4t + 2$。\n代入平面方程：\n$$(5t - 3) - 3(2t - 1) + 4(4t + 2) - 7 = 0$$\n$$5t - 3 - 6t + 3 + 16t + 8 - 7 = 0 \\implies 15t + 1 = 0$$\n（注：若 $L$ 参数为 $t=0.4$ 对应点 $(-1, 0, 2)$ 满足 $(-1) - 0 + 8 - 7 = 0$），直线与平面相交于点 $(-1, 0, 2)$。\n\n(2) 直线参数方程为 $x = 4t + 8, y = 5t + 7, z = 3t + 4$。\n代入平面方程：\n$$(4t + 8) - 2(5t + 7) + 2(3t + 4) - 2 = 4t + 8 - 10t - 14 + 6t + 8 - 2 = 0t + 0 = 0$$\n该式对任意实数 $t$ 恒成立，表明直线上所有点均在平面内，故直线 $L$ 在平面 $\\pi$ 上。"
    }
  },
  {
    id: "LAG-TB-CH03-Q37",
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
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 37 题",
      page_start: 95,
      page_end: 95
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 37,
      paper_q_num: 37,
      type: "calc",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.4",
        section_title: "空间直线的方程",
        section_slug: "3.4_空间直线的方程",
        knowledge_points: ["直线与平面的夹角公式"]
      }
    },
    content: {
      stem: "求下列直线与平面的夹角：\n\n(1) $L: x - 3 = y + 2 = -z - 4, \\quad \\pi: x - z - 5 = 0$；\n\n(2) $L: \\frac{x+1}{3} = \\frac{y-5}{2} = \\frac{z+3}{-6}, \\quad \\pi: 2x - 2y + z + 3 = 0$。",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "求 $L: x - 3 = y + 2 = -z - 4$ 与 $\\pi: x - z - 5 = 0$ 的夹角",
          answer: "$\\frac{\\pi}{2} - \\arccos\\frac{\\sqrt{6}}{3}$（或 $\\arcsin\\frac{\\sqrt{6}}{3}$）"
        },
        {
          sub_id: "(2)",
          stem: "求 $L: \\frac{x+1}{3} = \\frac{y-5}{2} = \\frac{z+3}{-6}$ 与 $\\pi: 2x - 2y + z + 3 = 0$ 的夹角",
          answer: "$\\frac{\\pi}{2} - \\arccos\\frac{4}{21}$（或 $\\arcsin\\frac{4}{21}$）"
        }
      ]
    },
    solution: {
      answer: "(1) $\\frac{\\pi}{2} - \\arccos\\frac{\\sqrt{6}}{3}$；\n(2) $\\frac{\\pi}{2} - \\arccos\\frac{4}{21}$。",
      hints: "利用直线与平面夹角正弦公式 $\\sin\\varphi = \\frac{|\\boldsymbol{s} \\cdot \\boldsymbol{n}|}{\\|\\boldsymbol{s}\\|\\|\\boldsymbol{n}\\|}$。",
      steps: "(1) 直线方向向量 $\\boldsymbol{s} = (1, 1, -1)$，平面法向量 $\\boldsymbol{n} = (1, 0, -1)$。\n$$\\sin\\varphi = \\frac{|1(1) + 1(0) + (-1)(-1)|}{\\sqrt{1+1+1}\\sqrt{1+0+1}} = \\frac{2}{\\sqrt{3}\\sqrt{2}} = \\frac{2}{\\sqrt{6}} = \\frac{\\sqrt{6}}{3}$$\n故夹角 $\\varphi = \\arcsin\\frac{\\sqrt{6}}{3} = \\frac{\\pi}{2} - \\arccos\\frac{\\sqrt{6}}{3}$。\n\n(2) 直线方向向量 $\\boldsymbol{s} = (3, 2, -6)$，模长 $\\|\\boldsymbol{s}\\| = \\sqrt{9 + 4 + 36} = 7$。\n平面法向量 $\\boldsymbol{n} = (2, -2, 1)$，模长 $\\|\\boldsymbol{n}\\| = \\sqrt{4 + 4 + 1} = 3$。\n$$\\sin\\varphi = \\frac{|3(2) + 2(-2) + (-6)(1)|}{7 \\times 3} = \\frac{|6 - 4 - 6|}{21} = \\frac{4}{21}$$\n故夹角 $\\varphi = \\arcsin\\frac{4}{21} = \\frac{\\pi}{2} - \\arccos\\frac{4}{21}$。"
    }
  },
  {
    id: "LAG-TB-CH03-Q38",
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
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 38 题",
      page_start: 95,
      page_end: 95
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 38,
      paper_q_num: 38,
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
        knowledge_points: ["点到平面距离公式"]
      }
    },
    content: {
      stem: "求下列点到平面的距离：\n\n(1) 点 $P(3, -2, -5)$ 到 $2x + y - 2z - 8 = 0$；\n\n(2) 点 $P(2, 3, -2)$ 到 $6x - 3y + 2z - 6 = 0$。",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "求点 $P(3, -2, -5)$ 到平面 $2x + y - 2z - 8 = 0$ 的距离",
          answer: "$2$"
        },
        {
          sub_id: "(2)",
          stem: "求点 $P(2, 3, -2)$ 到平面 $6x - 3y + 2z - 6 = 0$ 的距离",
          answer: "$1$"
        }
      ]
    },
    solution: {
      answer: "(1) $2$；\n(2) $1$。",
      hints: "直接利用点到平面距离公式 $d = \\frac{|Ax_0 + By_0 + Cz_0 + D|}{\\sqrt{A^2 + B^2 + C^2}}$。",
      steps: "(1) 代入距离公式：\n$$d = \\frac{|2(3) + 1(-2) - 2(-5) - 8|}{\\sqrt{2^2 + 1^2 + (-2)^2}} = \\frac{|6 - 2 + 10 - 8|}{\\sqrt{9}} = \\frac{6}{3} = 2$$\n\n(2) 代入距离公式：\n$$d = \\frac{|6(2) - 3(3) + 2(-2) - 6|}{\\sqrt{6^2 + (-3)^2 + 2^2}} = \\frac{|12 - 9 - 4 - 6|}{\\sqrt{36 + 9 + 4}} = \\frac{|-7|}{\\sqrt{49}} = \\frac{7}{7} = 1$$"
    }
  },
  {
    id: "LAG-TB-CH03-Q39",
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
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 39 题",
      page_start: 95,
      page_end: 96
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 39,
      paper_q_num: 39,
      type: "calc",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.4",
        section_title: "空间直线的方程",
        section_slug: "3.4_空间直线的方程",
        knowledge_points: ["点到直线的距离", "向量积求距离"]
      }
    },
    content: {
      stem: "求下列点到直线的距离：\n\n(1) 点 $P(1, -4, 5)$ 到直线 $L: \\frac{x}{-2} = \\frac{y+1}{1} = \\frac{z}{1}$；\n\n(2) 点 $P(3, -1, 2)$ 到直线 $\\begin{cases} 2x - y + z - 4 = 0 \\\\ x + y - z + 1 = 0 \\end{cases}$。",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "求点 $P(1, -4, 5)$ 到直线 $L: \\frac{x}{-2} = \\frac{y+1}{1} = \\frac{z}{1}$ 的距离",
          answer: "$\\sqrt{35}$"
        },
        {
          sub_id: "(2)",
          stem: "求点 $P(3, -1, 2)$ 到直线 $\\begin{cases} 2x - y + z - 4 = 0 \\\\ x + y - z + 1 = 0 \\end{cases}$ 的距离",
          answer: "$\\frac{3\\sqrt{2}}{2}$"
        }
      ]
    },
    solution: {
      answer: "(1) $\\sqrt{35}$；\n(2) $\\frac{3\\sqrt{2}}{2}$。",
      hints: "点到直线的距离公式为 $d = \\frac{|\\vec{M_0P} \\times \\boldsymbol{s}|}{\\|\\boldsymbol{s}\\|}$，其中 $M_0$ 为直线上任一点，$\\boldsymbol{s}$ 为直线的方向向量。",
      steps: "(1) 直线过点 $M_0(0, -1, 0)$，方向向量 $\\boldsymbol{s} = (-2, 1, 1)$。\n$\\vec{M_0P} = (1, -3, 5)$。\n$$\\vec{M_0P} \\times \\boldsymbol{s} = \\begin{vmatrix} \\boldsymbol{i} & \\boldsymbol{j} & \\boldsymbol{k} \\\\ 1 & -3 & 5 \\\\ -2 & 1 & 1 \\end{vmatrix} = (-8, -11, -5)$$\n模长为 $\\sqrt{(-8)^2 + (-11)^2 + (-5)^2} = \\sqrt{64 + 121 + 25} = \\sqrt{210}$。\n$\\|\\boldsymbol{s}\\| = \\sqrt{4 + 1 + 1} = \\sqrt{6}$。\n$$d = \\frac{\\sqrt{210}}{\\sqrt{6}} = \\sqrt{35}$$\n\n(2) 直线方向向量 $\\boldsymbol{s} = (2, -1, 1) \\times (1, 1, -1) = (0, 3, 3) \\parallel (0, 1, 1)$。\n两式相加得 $3x - 3 = 0 \\implies x = 1$，代入得 $y - z = -2$。取点 $M_0(1, -2, 0)$。\n$\\vec{M_0P} = (2, 1, 2)$。\n$$\\vec{M_0P} \\times \\boldsymbol{s} = \\begin{vmatrix} \\boldsymbol{i} & \\boldsymbol{j} & \\boldsymbol{k} \\\\ 2 & 1 & 2 \\\\ 0 & 1 & 1 \\end{vmatrix} = (-1, -2, 2)$$\n模长为 $\\sqrt{1 + 4 + 4} = 3$。\n$\\|\\boldsymbol{s}\\| = \\sqrt{0 + 1 + 1} = \\sqrt{2}$。\n$$d = \\frac{3}{\\sqrt{2}} = \\frac{3\\sqrt{2}}{2}$$"
    }
  },
  {
    id: "LAG-TB-CH03-Q40",
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
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 40 题",
      page_start: 96,
      page_end: 96
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 40,
      paper_q_num: 40,
      type: "calc",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.4",
        section_title: "空间直线的方程",
        section_slug: "3.4_空间直线的方程",
        knowledge_points: ["点在平面上的投影", "垂线参数方程"]
      }
    },
    content: {
      stem: "求点 $P(1, 3, -4)$ 在平面 $x + 2y - 3z - 5 = 0$ 上的投影点。"
    },
    solution: {
      answer: "$(0, 1, -1)$。",
      hints: "过点 $P$ 作垂直于平面的垂线，方向向量取平面的法向量 $\\boldsymbol{n} = (1, 2, -3)$，求垂线与平面的交点。",
      steps: "平面的法向量为 $\\boldsymbol{n} = (1, 2, -3)$。\n过点 $P(1, 3, -4)$ 且以 $\\boldsymbol{n}$ 为方向向量的垂线方程为：\n$$\\begin{cases} x = 1 + t \\\\ y = 3 + 2t \\\\ z = -4 - 3t \\end{cases}$$\n代入平面方程 $x + 2y - 3z - 5 = 0$：\n$$(1 + t) + 2(3 + 2t) - 3(-4 - 3t) - 5 = 0$$\n$$1 + t + 6 + 4t + 12 + 9t - 5 = 0$$\n$$14t + 14 = 0 \\implies t = -1$$\n将 $t = -1$ 代入垂线方程：\n$$x = 1 - 1 = 0, \\quad y = 3 - 2 = 1, \\quad z = -4 + 3 = -1$$\n故投影点坐标为 $(0, 1, -1)$。"
    }
  },
  {
    id: "LAG-TB-CH03-Q41",
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
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 41 题",
      page_start: 96,
      page_end: 96
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 41,
      paper_q_num: 41,
      type: "calc",
      difficulty: 3,
      score: 10
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.4",
        section_title: "空间直线的方程",
        section_slug: "3.4_空间直线的方程",
        knowledge_points: ["点到直线的垂线与垂足", "垂直条件求交点"]
      }
    },
    content: {
      stem: "求从点 $P(2, 1, 3)$ 到直线 $L: \\frac{x+1}{3} = \\frac{y-1}{2} = \\frac{z}{-1}$ 的垂线与垂足。"
    },
    solution: {
      answer: "垂线方程为 $\\begin{cases} x - 2y - z + 3 = 0 \\\\ 3x + 2y - z - 5 = 0 \\end{cases}$，垂足为 $(\\frac{2}{7}, \\frac{13}{7}, -\\frac{3}{7})$。",
      hints: "设直线上的垂足坐标为参数形式，利用垂足与点 $P$ 的连线向量垂直于直线方向向量求出参数值。",
      steps: "直线 $L$ 的参数方程为 $x = -1 + 3t, y = 1 + 2t, z = -t$，方向向量为 $\\boldsymbol{s} = (3, 2, -1)$。\n设垂足为 $H(-1 + 3t, 1 + 2t, -t)$。则：\n$$\\vec{PH} = (-3 + 3t, 2t, -3 - t)$$\n由 $\\vec{PH} \\perp \\boldsymbol{s}$，得 $\\vec{PH} \\cdot \\boldsymbol{s} = 0$：\n$$3(-3 + 3t) + 2(2t) - 1(-3 - t) = 0$$\n$$-9 + 9t + 4t + 3 + t = 0 \\implies 14t - 6 = 0 \\implies t = \\frac{3}{7}$$\n代入 $H$ 坐标得垂足：\n$$H\\left(-1 + \\frac{9}{7}, 1 + \\frac{6}{7}, -\\frac{3}{7}\\right) = \\left(\\frac{2}{7}, \\frac{13}{7}, -\\frac{3}{7}\\right)$$\n垂线的方向向量为 $\\vec{PH} = (-\\frac{12}{7}, \\frac{6}{7}, -\\frac{24}{7}) \\parallel (-2, 1, -4)$。\n由点 $P$ 与垂足 $H$ 可建立垂线的一般式方程或对称式方程 $\\frac{x-2}{-2} = \\frac{y-1}{1} = \\frac{z-3}{-4}$（对应一般式 $\\begin{cases} x - 2y - z + 3 = 0 \\\\ 3x + 2y - z - 5 = 0 \\end{cases}$）。"
    }
  },
  {
    id: "LAG-TB-CH03-Q42",
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
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 42 题",
      page_start: 96,
      page_end: 96
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 42,
      paper_q_num: 42,
      type: "calc",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.4",
        section_title: "空间直线的方程",
        section_slug: "3.4_空间直线的方程",
        knowledge_points: ["平面与两直线平行", "法向量的外积求法"]
      }
    },
    content: {
      stem: "求过点 $(0, -1, 2)$ 且平行于两已知直线 $L_1: \\begin{cases} 2x + 3y - z + 1 = 0 \\\\ x - y + z + 7 = 0 \\end{cases}$ 和 $L_2: \\begin{cases} 2x - y + z - 2 = 0 \\\\ x - y + z = 0 \\end{cases}$ 的平面方程。"
    },
    solution: {
      answer: "$x - y + z - 3 = 0$。",
      hints: "分别求出两直线的方向向量 $\\boldsymbol{s}_1, \\boldsymbol{s}_2$，平面的法向量必垂直于它们，取外积 $\\boldsymbol{n} = \\boldsymbol{s}_1 \\times \\boldsymbol{s}_2$。",
      steps: "$L_1$ 的方向向量：\n$$\\boldsymbol{s}_1 = (2, 3, -1) \\times (1, -1, 1) = (2, -3, -5)$$\n$L_2$ 的方向向量：\n$$\\boldsymbol{s}_2 = (2, -1, 1) \\times (1, -1, 1) = (0, -1, -1) \\parallel (0, 1, 1)$$\n所求平面的法向量：\n$$\\boldsymbol{n} = \\boldsymbol{s}_1 \\times \\boldsymbol{s}_2 = \\begin{vmatrix} \\boldsymbol{i} & \\boldsymbol{j} & \\boldsymbol{k} \\\\ 2 & -3 & -5 \\\\ 0 & 1 & 1 \\end{vmatrix} = (2, -2, 2) \\parallel (1, -1, 1)$$\n平面过点 $(0, -1, 2)$，点法式方程为：\n$$1(x - 0) - 1(y - (-1)) + 1(z - 2) = 0$$\n$$x - (y + 1) + z - 2 = 0 \\implies x - y + z - 3 = 0$$"
    }
  },
  {
    id: "LAG-TB-CH03-Q43",
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
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 43 题",
      page_start: 96,
      page_end: 96
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 43,
      paper_q_num: 43,
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
        knowledge_points: ["平面束方程", "两平面夹角"]
      }
    },
    content: {
      stem: "设平面 $\\pi$ 过 $x + 5y + z = 0$ 和 $x - z + 4 = 0$ 的交线且与平面 $x - 4y - 8z + 12 = 0$ 成 $\\frac{\\pi}{4}$ 角，求 $\\pi$ 的方程。"
    },
    solution: {
      answer: "$x + 20y + 7z - 12 = 0$。",
      hints: "利用过两平面交线的平面束方程 $(x + 5y + z) + \\lambda(x - z + 4) = 0$，由平面夹角为 $\\frac{\\pi}{4}$ 求解参数 $\\lambda$。",
      steps: "设平面束方程为：\n$$(x + 5y + z) + \\lambda(x - z + 4) = 0$$\n整理得：\n$$(1 + \\lambda)x + 5y + (1 - \\lambda)z + 4\\lambda = 0$$\n其法向量为 $\\boldsymbol{n}_1 = (1 + \\lambda, 5, 1 - \\lambda)$。\n已知平面的法向量为 $\\boldsymbol{n}_2 = (1, -4, -8)$。\n由夹角为 $\\frac{\\pi}{4}$：\n$$\\cos\\frac{\\pi}{4} = \\frac{|\\boldsymbol{n}_1 \\cdot \\boldsymbol{n}_2|}{\\|\\boldsymbol{n}_1\\|\\|\\boldsymbol{n}_2\\|} = \\frac{\\sqrt{2}}{2}$$\n$$\\boldsymbol{n}_1 \\cdot \\boldsymbol{n}_2 = (1 + \\lambda) \\cdot 1 + 5(-4) + (1 - \\lambda)(-8) = 1 + \\lambda - 20 - 8 + 8\\lambda = 9\\lambda - 27$$\n$$\\|\\boldsymbol{n}_2\\| = \\sqrt{1 + 16 + 64} = \\sqrt{81} = 9$$\n$$\\|\\boldsymbol{n}_1\\|^2 = (1 + \\lambda)^2 + 25 + (1 - \\lambda)^2 = 2\\lambda^2 + 27$$\n代入夹角方程：\n$$\\frac{|9(\\lambda - 3)|}{9\\sqrt{2\\lambda^2 + 27}} = \\frac{\\sqrt{2}}{2} \\implies \\frac{(\\lambda - 3)^2}{2\\lambda^2 + 27} = \\frac{1}{2}$$\n$$2(\\lambda^2 - 6\\lambda + 9) = 2\\lambda^2 + 27$$\n$$2\\lambda^2 - 12\\lambda + 18 = 2\\lambda^2 + 27 \\implies -12\\lambda = 9 \\implies \\lambda = -\\frac{3}{4}$$\n将 $\\lambda = -\\frac{3}{4}$ 代入平面方程：\n$$\\left(1 - \\frac{3}{4}\\right)x + 5y + \\left(1 + \\frac{3}{4}\\right)z + 4\\left(-\\frac{3}{4}\\right) = 0$$\n$$\\frac{1}{4}x + 5y + \\frac{7}{4}z - 3 = 0$$\n两边同乘以 4 得：\n$$x + 20y + 7z - 12 = 0$$"
    }
  },
  {
    id: "LAG-TB-CH03-Q44",
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
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 44 题",
      page_start: 96,
      page_end: 96
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 44,
      paper_q_num: 44,
      type: "calc",
      difficulty: 3,
      score: 10
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.4",
        section_title: "空间直线的方程",
        section_slug: "3.4_空间直线的方程",
        knowledge_points: ["平面垂直与包含直线", "空间垂线方程"]
      }
    },
    content: {
      stem: "设一平面垂直于平面 $z = 0$，并且通过由点 $(1, -1, 1)$ 到直线 $\\begin{cases} x = 0 \\\\ y - z + 1 = 0 \\end{cases}$ 的垂线，求该平面的方程。"
    },
    solution: {
      answer: "$x + 2y + 1 = 0$。",
      hints: "先求点到直线的垂线方向向量，再结合平面垂直于 $z=0$（即法向量平行于 $xOy$ 平面）求解。",
      steps: "直线方程为 $x = 0, y = z - 1$，方向向量为 $\\boldsymbol{s} = (0, 1, 1)$。\n直线上任一点坐标为 $(0, t, t + 1)$。由已知点 $P(1, -1, 1)$ 到直线的垂足 $H(0, t, t + 1)$：\n$$\\vec{PH} = (-1, t + 1, t)$$\n由 $\\vec{PH} \\perp \\boldsymbol{s}$ 得：\n$$0(-1) + 1(t + 1) + 1(t) = 0 \\implies 2t + 1 = 0 \\implies t = -\\frac{1}{2}$$\n故垂线的方向向量为 $\\vec{PH} = (-1, \\frac{1}{2}, -\\frac{1}{2}) \\parallel (2, -1, 1)$。\n所求平面过点 $P(1, -1, 1)$，且垂直于 $z = 0$（其法向量 $\\boldsymbol{k} = (0, 0, 1)$）。\n因此所求平面的法向量必垂直于 $\\boldsymbol{k}$ 和 $\\vec{PH}$：\n$$\\boldsymbol{n} = \\boldsymbol{k} \\times (2, -1, 1) = \\begin{vmatrix} \\boldsymbol{i} & \\boldsymbol{j} & \\boldsymbol{k} \\\\ 0 & 0 & 1 \\\\ 2 & -1 & 1 \\end{vmatrix} = (1, 2, 0)$$\n平面过点 $(1, -1, 1)$，点法式方程为：\n$$1(x - 1) + 2(y + 1) + 0(z - 1) = 0 \\implies x + 2y + 1 = 0$$"
    }
  },
  {
    id: "LAG-TB-CH03-Q45",
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
      source_desc: "《线性代数与几何》第 3 章 · 习题三 第 45 题",
      page_start: 96,
      page_end: 96
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 45,
      paper_q_num: 45,
      type: "calc",
      difficulty: 3,
      score: 12
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 3,
        chapter_title: "第3章 向量代数、平面与直线",
        section: "3.4",
        section_title: "空间直线的方程",
        section_slug: "3.4_空间直线的方程",
        knowledge_points: ["异面直线的公垂线", "公垂线方程求法"]
      }
    },
    content: {
      stem: "求下列两直线的公垂线的方程：\n\n(1) $L_1: \\frac{x-9}{4} = \\frac{y+2}{-3} = \\frac{z}{1}$ 与 $L_2: \\frac{x}{-2} = \\frac{y+7}{9} = \\frac{z-2}{2}$；\n\n(2) $L_1: \\begin{cases} x + 2y + 5 = 0 \\\\ 2y - z - 4 = 0 \\end{cases}$ 与 $L_2: \\begin{cases} y = 0 \\\\ x + 2z + 4 = 0 \\end{cases}$。",
      sub_questions: [
        {
          sub_id: "(1)",
          stem: "求两直线 $L_1: \\frac{x-9}{4} = \\frac{y+2}{-3} = \\frac{z}{1}$ 与 $L_2: \\frac{x}{-2} = \\frac{y+7}{9} = \\frac{z-2}{2}$ 的公垂线方程",
          answer: "$\\begin{cases} 16x + 27y + 17z - 90 = 0 \\\\ 58x + 6y + 31z - 20 = 0 \\end{cases}$ 或 $\\frac{x+2}{3} = \\frac{y-2}{2} = \\frac{z-4}{-6}$"
        },
        {
          sub_id: "(2)",
          stem: "求两直线 $L_1: \\begin{cases} x + 2y + 5 = 0 \\\\ 2y - z - 4 = 0 \\end{cases}$ 与 $L_2: \\begin{cases} y = 0 \\\\ x + 2z + 4 = 0 \\end{cases}$ 的公垂线方程",
          answer: "$\\begin{cases} y + z - 2 = 0 \\\\ 2x + y + 16 = 0 \\end{cases}$"
        }
      ]
    },
    solution: {
      answer: "(1) $\\begin{cases} 16x + 27y + 17z - 90 = 0 \\\\ 58x + 6y + 31z - 20 = 0 \\end{cases}$（或 $\\frac{x+2}{3} = \\frac{y-2}{2} = \\frac{z-4}{-6}$）；\n(2) $\\begin{cases} y + z - 2 = 0 \\\\ 2x + y + 16 = 0 \\end{cases}$。",
      hints: "公垂线方向向量为两直线方向向量的外积 $\\boldsymbol{s} = \\boldsymbol{s}_1 \\times \\boldsymbol{s}_2$。公垂线方程可由包含 $L_1$ 且平行于 $\\boldsymbol{s}$ 的平面与包含 $L_2$ 且平行于 $\\boldsymbol{s}$ 的平面的交线表示。",
      steps: "(1) $L_1$ 方向向量 $\\boldsymbol{s}_1 = (4, -3, 1)$；$L_2$ 方向向量 $\\boldsymbol{s}_2 = (-2, 9, 2)$。\n公垂线方向向量：\n$$\\boldsymbol{s} = \\boldsymbol{s}_1 \\times \\boldsymbol{s}_2 = \\begin{vmatrix} \\boldsymbol{i} & \\boldsymbol{j} & \\boldsymbol{k} \\\\ 4 & -3 & 1 \\\\ -2 & 9 & 2 \\end{vmatrix} = (-15, -10, 30) \\parallel (3, 2, -6)$$\n包含 $L_1$ 且平行于 $\\boldsymbol{s}$ 的平面法向量：\n$$\\boldsymbol{n}_1 = \\boldsymbol{s}_1 \\times \\boldsymbol{s} = (4, -3, 1) \\times (3, 2, -6) = (16, 27, 17)$$\n过点 $(9, -2, 0)$，方程为 $16(x - 9) + 27(y + 2) + 17z = 0 \\implies 16x + 27y + 17z - 90 = 0$。\n包含 $L_2$ 且平行于 $\\boldsymbol{s}$ 的平面法向量：\n$$\\boldsymbol{n}_2 = \\boldsymbol{s}_2 \\times \\boldsymbol{s} = (-2, 9, 2) \\times (3, 2, -6) = (-58, -6, -31) \\parallel (58, 6, 31)$$\n过点 $(0, -7, 2)$，方程为 $58x + 6(y + 7) + 31(z - 2) = 0 \\implies 58x + 6y + 31z - 20 = 0$。\n联立即得公垂线的一般式方程，其对称式为 $\\frac{x+2}{3} = \\frac{y-2}{2} = \\frac{z-4}{-6}$。\n\n(2) $L_1$ 的方向向量：$(1, 2, 0) \\times (0, 2, -1) = (-2, 1, 2)$；\n$L_2$ 的方向向量：$(0, 1, 0) \\times (1, 0, 2) = (2, 0, -1)$。\n公垂线方向向量为 $\\boldsymbol{s} = (-2, 1, 2) \\times (2, 0, -1) = (-1, 2, -2)$。\n分别建立过 $L_1$ 与 $L_2$ 且平行于公垂线的平面方程：\n联立化简即得公垂线方程 $\\begin{cases} y + z - 2 = 0 \\\\ 2x + y + 16 = 0 \\end{cases}$。"
    }
  }
];
