// scripts/vision_reconstruct/build_ch08.cjs
const fs = require('fs');
const path = require('path');
const katex = require('katex');

const ch08Questions = [
  {
    id: "LAG-TB-CH08-Q01",
    source_type: "textbook",
    source: {
      paper_id: 2008,
      raw_title: "《线性代数与几何》第8章 空间曲面与曲线 课后习题",
      clean_title: "《线性代数与几何》第8章 空间曲面与曲线 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 8 章 · 习题八 第 1 题",
      page_start: 194,
      page_end: 194
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
        chapter: 8,
        chapter_title: "第8章 空间曲面与曲线",
        section: "8.1",
        section_title: "空间曲面及其方程",
        section_slug: "8.1_空间曲面及其方程",
        knowledge_points: ["球面方程", "待定系数法"]
      }
    },
    content: {
      stem: "已知 $O(0,0,0), A(-1,1,4), B(0,-3,3), C(-4,1,1)$，求过 $O, A, B, C$ 四点的球面方程。"
    },
    solution: {
      answer: "$x^2+y^2+z^2+4x+2y-4z=0$。",
      hints: "设球面的一般方程为 $x^2+y^2+z^2+Dx+Ey+Fz+G=0$，代入已知四点坐标确定待定系数。",
      steps: "因为球面过原点 $O(0,0,0)$，所以 $G=0$。\n将点 $A(-1,1,4), B(0,-3,3), C(-4,1,1)$ 分别代入方程得：\n$$\\begin{cases} -D+E+4F = -18 \\\\ -3E+3F = -18 \\\\ -4D+E+F = -18 \\end{cases}$$\n解该三元一次线性方程组得 $D=4, E=2, F=-4$。\n故所求球面方程为 $x^2+y^2+z^2+4x+2y-4z=0$。"
    }
  },
  {
    id: "LAG-TB-CH08-Q02",
    source_type: "textbook",
    source: {
      paper_id: 2008,
      raw_title: "《线性代数与几何》第8章 空间曲面与曲线 课后习题",
      clean_title: "《线性代数与几何》第8章 空间曲面与曲线 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 8 章 · 习题八 第 2 题",
      page_start: 194,
      page_end: 194
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 2,
      paper_q_num: 2,
      type: "calc",
      difficulty: 1,
      score: 5
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 8,
        chapter_title: "第8章 空间曲面与曲线",
        section: "8.1",
        section_title: "空间曲面及其方程",
        section_slug: "8.1_空间曲面及其方程",
        knowledge_points: ["动点轨迹方程", "阿波罗尼斯球面"]
      }
    },
    content: {
      stem: "已知某动点到点 $A(2,3,4)$ 与点 $B(1,1,1)$ 的距离之比为 $2:1$，求动点的轨迹方程，它表示怎样的曲面？"
    },
    solution: {
      answer: "$3(x^2+y^2+z^2)-4x-2y-17=0$，其图形是球面。",
      hints: "设动点坐标为 $M(x,y,z)$，由 $|MA| = 2|MB|$ 两边平方化简整理即可。",
      steps: "设动点为 $M(x,y,z)$，依题意有 $\\frac{\\sqrt{(x-2)^2+(y-3)^2+(z-4)^2}}{\\sqrt{(x-1)^2+(y-1)^2+(z-1)^2}} = 2$。\n两边平方得：\n$$(x-2)^2+(y-3)^2+(z-4)^2 = 4[(x-1)^2+(y-1)^2+(z-1)^2]$$\n展开整理同类项得：\n$$3(x^2+y^2+z^2)-4x-2y-17=0$$\n配方可得 $(x-\\frac{2}{3})^2+(y-\\frac{1}{3})^2+z^2 = \\frac{56}{9}$，故其图形为球面（阿波罗尼斯球面）。"
    }
  },
  {
    id: "LAG-TB-CH08-Q03",
    source_type: "textbook",
    source: {
      paper_id: 2008,
      raw_title: "《线性代数与几何》第8章 空间曲面与曲线 课后习题",
      clean_title: "《线性代数与几何》第8章 空间曲面与曲线 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 8 章 · 习题八 第 3 题",
      page_start: 194,
      page_end: 195
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 3,
      paper_q_num: 3,
      type: "calc",
      difficulty: 1,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 8,
        chapter_title: "第8章 空间曲面与曲线",
        section: "8.1",
        section_title: "空间曲面及其方程",
        section_slug: "8.1_空间曲面及其方程",
        knowledge_points: ["旋转曲面方程", "绕坐标轴旋转"]
      }
    },
    content: {
      stem: "写出下列旋转面的方程：\n\n(1) $xOy$ 平面上的抛物线 $y=4x^2$ 绕 $y$ 轴旋转一周所形成的旋转面；\n\n(2) $xOz$ 平面上的椭圆 $\\frac{x^2}{4}+\\frac{z^2}{9}=1$ 绕 $x$ 轴旋转一周所形成的旋转面；\n\n(3) $yOz$ 平面上的双曲线 $\\frac{y^2}{4}-z^2=1$ 绕 $y$ 轴旋转一周所形成的旋转面；\n\n(4) $yOz$ 平面上的直线 $y+z=0$ 绕 $z$ 轴旋转一周所形成的旋转面。",
      sub_questions: [
        { sub_id: "(1)", stem: "$xOy$ 平面上抛物线 $y=4x^2$ 绕 $y$ 轴旋转", answer: "$y=4(x^2+z^2)$" },
        { sub_id: "(2)", stem: "$xOz$ 平面上椭圆 $\\frac{x^2}{4}+\\frac{z^2}{9}=1$ 绕 $x$ 轴旋转", answer: "$\\frac{x^2}{4}+\\frac{y^2+z^2}{9}=1$" },
        { sub_id: "(3)", stem: "$yOz$ 平面上双曲线 $\\frac{y^2}{4}-z^2=1$ 绕 $y$ 轴旋转", answer: "$\\frac{y^2}{4}-x^2-z^2=1$" },
        { sub_id: "(4)", stem: "$yOz$ 平面上直线 $y+z=0$ 绕 $z$ 轴旋转", answer: "$z^2=x^2+y^2$" }
      ]
    },
    solution: {
      answer: "(1) $y=4(x^2+z^2)$；\n(2) $\\frac{x^2}{4}+\\frac{y^2+z^2}{9}=1$；\n(3) $\\frac{y^2}{4}-x^2-z^2=1$；\n(4) $z^2=x^2+y^2$。",
      hints: "绕哪个轴旋转，该轴对应的坐标保持不变，垂直于该轴的坐标变量用 $\\pm\\sqrt{u^2+v^2}$ 替代。",
      steps: "(1) 绕 $y$ 轴旋转，将 $x$ 替换为 $\\pm\\sqrt{x^2+z^2}$，得 $y=4(x^2+z^2)$；\n(2) 绕 $x$ 轴旋转，将 $z$ 替换为 $\\pm\\sqrt{y^2+z^2}$，得 $\\frac{x^2}{4}+\\frac{y^2+z^2}{9}=1$；\n(3) 绕 $y$ 轴旋转，将 $z$ 替换为 $\\pm\\sqrt{x^2+z^2}$，得 $\\frac{y^2}{4}-(x^2+z^2)=1$ 即 $\\frac{y^2}{4}-x^2-z^2=1$；\n(4) 绕 $z$ 轴旋转，将 $y$ 替换为 $\\pm\\sqrt{x^2+y^2}$，代入 $y+z=0 \\implies \\pm\\sqrt{x^2+y^2}+z=0 \\implies z^2=x^2+y^2$（圆锥面）。"
    }
  },
  {
    id: "LAG-TB-CH08-Q04",
    source_type: "textbook",
    source: {
      paper_id: 2008,
      raw_title: "《线性代数与几何》第8章 空间曲面与曲线 课后习题",
      clean_title: "《线性代数与几何》第8章 空间曲面与曲线 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 8 章 · 习题八 第 4 题",
      page_start: 195,
      page_end: 195
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 4,
      paper_q_num: 4,
      type: "calc",
      difficulty: 1,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 8,
        chapter_title: "第8章 空间曲面与曲线",
        section: "8.1",
        section_title: "空间曲面及其方程",
        section_slug: "8.1_空间曲面及其方程",
        knowledge_points: ["旋转曲面识别", "母线与旋转轴"]
      }
    },
    content: {
      stem: "说明下列方程所表示的旋转面是怎样形成的：\n\n(1) $\\frac{x^2}{9}-\\frac{y^2}{4}-\\frac{z^2}{4}=1$；\n\n(2) $x^2+y^2-\\frac{z^2}{4}=1$；\n\n(3) $x^2+\\frac{y^2}{4}+z^2=1$；\n\n(4) $y=x^2+z^2$；\n\n(5) $x=\\sqrt{y^2+z^2}$。",
      sub_questions: [
        { sub_id: "(1)", stem: "$\\frac{x^2}{9}-\\frac{y^2}{4}-\\frac{z^2}{4}=1$", answer: "$xOy$ 平面上的双曲线 $\\frac{x^2}{9}-\\frac{y^2}{4}=1$ 绕 $x$ 轴旋转一周" },
        { sub_id: "(2)", stem: "$x^2+y^2-\\frac{z^2}{4}=1$", answer: "$xOz$ 平面上的双曲线 $x^2-\\frac{z^2}{4}=1$ 绕 $z$ 轴旋转一周" },
        { sub_id: "(3)", stem: "$x^2+\\frac{y^2}{4}+z^2=1$", answer: "$xOy$ 平面上的椭圆 $x^2+\\frac{y^2}{4}=1$ 绕 $y$ 轴旋转一周" },
        { sub_id: "(4)", stem: "$y=x^2+z^2$", answer: "$xOy$ 平面上的抛物线 $y=x^2$ 绕 $y$ 轴旋转一周" },
        { sub_id: "(5)", stem: "$x=\\sqrt{y^2+z^2}$", answer: "$xOy$ 平面上的半直线 $x=y(y\\ge 0)$ 绕 $x$ 轴旋转一周" }
      ]
    },
    solution: {
      answer: "(1) $xOy$ 平面上的双曲线 $\\frac{x^2}{9}-\\frac{y^2}{4}=1$ 绕 $x$ 轴旋转一周或 $xOz$ 平面上的双曲线 $\\frac{x^2}{9}-\\frac{z^2}{4}=1$ 绕 $x$ 轴旋转一周；\n(2) $xOz$ 平面上的双曲线 $x^2-\\frac{z^2}{4}=1$ 绕 $z$ 轴旋转一周或 $yOz$ 平面上的双曲线 $y^2-\\frac{z^2}{4}=1$ 绕 $z$ 轴旋转一周；\n(3) $xOy$ 平面上的椭圆 $x^2+\\frac{y^2}{4}=1$ 绕 $y$ 轴旋转一周或 $yOz$ 平面上的椭圆 $\\frac{y^2}{4}+z^2=1$ 绕 $y$ 轴旋转一周；\n(4) $xOy$ 平面上的抛物线 $y=x^2$ 绕 $y$ 轴旋转一周或 $yOz$ 平面上的抛物线 $y=z^2$ 绕 $y$ 轴旋转一周；\n(5) $xOy$ 平面上的半直线 $x=y(y\\ge 0)$ 绕 $x$ 轴旋转一周或 $xOz$ 平面上的半直线 $x=z(z\\ge 0)$ 绕 $x$ 轴旋转一周。",
      hints: "观察方程中具有两项平方和结构的部分，判断其旋转对称轴及在坐标面上的母线。",
      steps: "(1) 方程可写作 $\\frac{x^2}{9}-\\frac{y^2+z^2}{4}=1$，由 $y^2+z^2$ 知绕 $x$ 轴旋转，母线为 $xOy$ 平面上的双曲线 $\\frac{x^2}{9}-\\frac{y^2}{4}=1$；\n(2) 由 $x^2+y^2$ 知绕 $z$ 轴旋转，母线为 $xOz$ 平面上的双曲线 $x^2-\\frac{z^2}{4}=1$；\n(3) 由 $x^2+z^2$ 知绕 $y$ 轴旋转，母线为 $xOy$ 平面上的椭圆 $x^2+\\frac{y^2}{4}=1$；\n(4) 由 $x^2+z^2$ 知绕 $y$ 轴旋转，母线为 $y=x^2$；\n(5) 由 $y^2+z^2$ 知绕 $x$ 轴旋转，母线为半射线 $x=y (y\\ge 0)$（圆锥面的一叶）。"
    }
  },
  {
    id: "LAG-TB-CH08-Q05",
    source_type: "textbook",
    source: {
      paper_id: 2008,
      raw_title: "《线性代数与几何》第8章 空间曲面与曲线 课后习题",
      clean_title: "《线性代数与几何》第8章 空间曲面与曲线 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 8 章 · 习题八 第 5 题",
      page_start: 195,
      page_end: 195
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 5,
      paper_q_num: 5,
      type: "calc",
      difficulty: 1,
      score: 5
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 8,
        chapter_title: "第8章 空间曲面与曲线",
        section: "8.1",
        section_title: "空间曲面及其方程",
        section_slug: "8.1_空间曲面及其方程",
        knowledge_points: ["柱面方程", "柱面作图"]
      }
    },
    content: {
      stem: "画出下列方程所表示的曲面：\n\n(1) $\\frac{x^2}{4}+y^2=1$；\n\n(2) $y^2-z^2=1$；\n\n(3) $x=z^2+1$；\n\n(4) $y=\\sqrt{1-x^2}$。",
      sub_questions: [
        { sub_id: "(1)", stem: "$\\frac{x^2}{4}+y^2=1$", answer: "略（母线平行于 $z$ 轴的椭圆柱面）" },
        { sub_id: "(2)", stem: "$y^2-z^2=1$", answer: "略（母线平行于 $x$ 轴的双曲柱面）" },
        { sub_id: "(3)", stem: "$x=z^2+1$", answer: "略（母线平行于 $y$ 轴的抛物柱面）" },
        { sub_id: "(4)", stem: "$y=\\sqrt{1-x^2}$", answer: "略（母线平行于 $z$ 轴的半圆柱面，位于 $y \\ge 0$ 部分）" }
      ]
    },
    solution: {
      answer: "略。",
      hints: "缺一个坐标变量的二元方程 $F(u, v)=0$ 在三维空间中表示母线平行于所缺坐标轴的柱面。",
      steps: "(1) 缺 $z$，表示母线平行于 $z$ 轴的椭圆柱面；\n(2) 缺 $x$，表示母线平行于 $x$ 轴的双曲柱面；\n(3) 缺 $y$，表示母线平行于 $y$ 轴的抛物柱面；\n(4) 缺 $z$，且 $y \\ge 0$，表示母线平行于 $z$ 轴的半圆柱面。"
    }
  },
  {
    id: "LAG-TB-CH08-Q06",
    source_type: "textbook",
    source: {
      paper_id: 2008,
      raw_title: "《线性代数与几何》第8章 空间曲面与曲线 课后习题",
      clean_title: "《线性代数与几何》第8章 空间曲面与曲线 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 8 章 · 习题八 第 6 题",
      page_start: 195,
      page_end: 195
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 6,
      paper_q_num: 6,
      type: "calc",
      difficulty: 3,
      score: 10
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 8,
        chapter_title: "第8章 空间曲面与曲线",
        section: "8.2",
        section_title: "二次曲面及其分类",
        section_slug: "8.2_二次曲面及其分类",
        knowledge_points: ["二次曲面化简", "主轴变换", "二次曲面分类"]
      }
    },
    content: {
      stem: "将下列二次曲面的方程化简为标准方程，并说明方程表示怎样的曲面：\n\n(1) $2x^2+3y^2+3z^2+4yz=1$；\n\n(2) $z=xy$；\n\n(3) $x^2-2y^2+z^2+4xy+8xz+4yz=3$。",
      sub_questions: [
        { sub_id: "(1)", stem: "$2x^2+3y^2+3z^2+4yz=1$", answer: "$2\\tilde{x}^2+\\tilde{y}^2+5\\tilde{z}^2=1$，椭球面" },
        { sub_id: "(2)", stem: "$z=xy$", answer: "$\\tilde{z}=\\frac{1}{2}\\tilde{x}^2-\\frac{1}{2}\\tilde{y}^2$，双曲抛物面（马鞍面）" },
        { sub_id: "(3)", stem: "$x^2-2y^2+z^2+4xy+8xz+4yz=3$", answer: "$\\tilde{x}^2+\\tilde{y}^2-2\\tilde{z}^2=-1$，双叶双曲面" }
      ]
    },
    solution: {
      answer: "(1) $2\\tilde{x}^2+\\tilde{y}^2+5\\tilde{z}^2=1$，方程表示椭球面。坐标变换为 $x=\\tilde{x}, y=\\frac{1}{\\sqrt{2}}(\\tilde{y}+\\tilde{z}), z=\\frac{1}{\\sqrt{2}}(\\tilde{z}-\\tilde{y})$；\n(2) $\\tilde{z}=\\frac{1}{2}\\tilde{x}^2-\\frac{1}{2}\\tilde{y}^2$，方程表示双曲抛物面（马鞍面）。坐标变换为 $x=\\frac{1}{\\sqrt{2}}(\\tilde{x}+\\tilde{y}), y=\\frac{1}{\\sqrt{2}}(\\tilde{x}-\\tilde{y}), z=\\tilde{z}$；\n(3) $\\tilde{x}^2+\\tilde{y}^2-2\\tilde{z}^2=-1$，方程表示双叶双曲面。坐标变换为 $x=\\frac{1}{\\sqrt{5}}\\tilde{x}-\\frac{4}{\\sqrt{45}}\\tilde{y}+\\frac{2}{3}\\tilde{z}, y=-\\frac{2}{\\sqrt{5}}\\tilde{x}-\\frac{2}{\\sqrt{45}}\\tilde{y}+\\frac{1}{3}\\tilde{z}, z=\\frac{5}{\\sqrt{45}}\\tilde{y}+\\frac{2}{3}\\tilde{z}$。",
      hints: "写出二次型的实对称矩阵，求其特征值与正交特征向量，利用正交坐标变换消去交叉项，化为标准形。",
      steps: "(1) 二次型矩阵特征值为 $\\lambda_1=2, \\lambda_2=1, \\lambda_3=5$。标准形为 $2\\tilde{x}^2+\\tilde{y}^2+5\\tilde{z}^2=1$，全部系数为正，为椭球面；\n(2) 作旋转变换 $x=\\frac{1}{\\sqrt{2}}(\\tilde{x}+\\tilde{y}), y=\\frac{1}{\\sqrt{2}}(\\tilde{x}-\\tilde{y})$，得 $xy = \\frac{1}{2}\\tilde{x}^2-\\frac{1}{2}\\tilde{y}^2$，故 $\\tilde{z}=\\frac{\\tilde{x}^2}{2}-\\frac{\\tilde{y}^2}{2}$，为双曲抛物面；\n(3) 二次型矩阵特征值求解后正交对角化得 $\\tilde{x}^2+\\tilde{y}^2-2\\tilde{z}^2=-1$（或 $-\\tilde{x}^2-\\tilde{y}^2+2\\tilde{z}^2=1$），符号差为负，为双叶双曲面。"
    }
  },
  {
    id: "LAG-TB-CH08-Q07",
    source_type: "textbook",
    source: {
      paper_id: 2008,
      raw_title: "《线性代数与几何》第8章 空间曲面与曲线 课后习题",
      clean_title: "《线性代数与几何》第8章 空间曲面与曲线 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 8 章 · 习题八 第 7 题",
      page_start: 195,
      page_end: 195
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
        chapter: 8,
        chapter_title: "第8章 空间曲面与曲线",
        section: "8.2",
        section_title: "二次曲面及其分类",
        section_slug: "8.2_二次曲面及其分类",
        knowledge_points: ["常见二次曲面识别", "截痕法"]
      }
    },
    content: {
      stem: "画出下列方程所表示的曲面：\n\n(1) $\\frac{x^2}{4}+y^2-z^2=1$；\n\n(2) $x^2-4y^2-z^2=4$；\n\n(3) $x=2y^2+z^2$。",
      sub_questions: [
        { sub_id: "(1)", stem: "$\\frac{x^2}{4}+y^2-z^2=1$", answer: "略（单叶双曲面）" },
        { sub_id: "(2)", stem: "$x^2-4y^2-z^2=4$", answer: "略（双叶双曲面）" },
        { sub_id: "(3)", stem: "$x=2y^2+z^2$", answer: "略（椭圆抛物面）" }
      ]
    },
    solution: {
      answer: "略。",
      hints: "结合二次曲面标准方程结构与截痕法识别曲面几何构型。",
      steps: "(1) 方程为 $\\frac{x^2}{2^2}+\\frac{y^2}{1^2}-\\frac{z^2}{1^2}=1$，负号项只有一项，表示以 $z$ 轴为中心轴的单叶双曲面；\n(2) 两边除以 4 得 $\\frac{x^2}{2^2}-\\frac{y^2}{1^2}-\\frac{z^2}{2^2}=1$，负号项有两项，表示以 $x$ 轴为中心轴的双叶双曲面；\n(3) 一次项为 $x$，右端为 $2y^2+z^2$，表示以 $x$ 轴为轴开口向右的椭圆抛物面。"
    }
  },
  {
    id: "LAG-TB-CH08-Q08",
    source_type: "textbook",
    source: {
      paper_id: 2008,
      raw_title: "《线性代数与几何》第8章 空间曲面与曲线 课后习题",
      clean_title: "《线性代数与几何》第8章 空间曲面与曲线 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 8 章 · 习题八 第 8 题",
      page_start: 195,
      page_end: 195
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 8,
      paper_q_num: 8,
      type: "calc",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 8,
        chapter_title: "第8章 空间曲面与曲线",
        section: "8.3",
        section_title: "空间曲线及其方程",
        section_slug: "8.3_空间曲线及其方程",
        knowledge_points: ["空间曲线参数方程", "三角代换参数化"]
      }
    },
    content: {
      stem: "将下列曲线的方程化为参数方程：\n\n(1) $\\begin{cases} (x-1)^2+(y+1)^2+(z-2)^2=9, \\\\ z=1; \\end{cases}$\n\n(2) $\\begin{cases} x^2+y^2+z^2=4, \\\\ z=y. \\end{cases}$",
      sub_questions: [
        { sub_id: "(1)", stem: "$\\begin{cases} (x-1)^2+(y+1)^2+(z-2)^2=9, \\\\ z=1; \\end{cases}$", answer: "$\\begin{cases} x=1+2\\sqrt{2}\\cos\\theta, \\\\ y=-1+2\\sqrt{2}\\sin\\theta, \\\\ z=1 \\end{cases}$" },
        { sub_id: "(2)", stem: "$\\begin{cases} x^2+y^2+z^2=4, \\\\ z=y; \\end{cases}$", answer: "$\\begin{cases} x=2\\cos\\theta, \\\\ y=\\sqrt{2}\\sin\\theta, \\\\ z=\\sqrt{2}\\sin\\theta \\end{cases}$" }
      ]
    },
    solution: {
      answer: "(1) $\\begin{cases} x=1+2\\sqrt{2}\\cos\\theta, \\\\ y=-1+2\\sqrt{2}\\sin\\theta, \\\\ z=1; \\end{cases}$\n(2) $\\begin{cases} x=2\\cos\\theta, \\\\ y=\\sqrt{2}\\sin\\theta, \\\\ z=\\sqrt{2}\\sin\\theta. \\end{cases}$",
      hints: "利用已知平面截面将曲线转化为平面上的圆或椭圆，然后引入角度参数 $\\theta$ 进行三角参数化。",
      steps: "(1) 将 $z=1$ 代入球面方程得 $(x-1)^2+(y+1)^2+(1-2)^2=9 \\implies (x-1)^2+(y+1)^2=8$。圆心为 $(1,-1,1)$，半径为 $2\\sqrt{2}$。参数方程为 $\\begin{cases} x=1+2\\sqrt{2}\\cos\\theta, \\\\ y=-1+2\\sqrt{2}\\sin\\theta, \\\\ z=1; \\end{cases}$\n(2) 将 $z=y$ 代入球面方程得 $x^2+2y^2=4 \\implies \\frac{x^2}{4}+\\frac{y^2}{2}=1$。设 $x=2\\cos\\theta, y=\\sqrt{2}\\sin\\theta$，由 $z=y$ 得 $z=\\sqrt{2}\\sin\\theta$。参数方程为 $\\begin{cases} x=2\\cos\\theta, \\\\ y=\\sqrt{2}\\sin\\theta, \\\\ z=\\sqrt{2}\\sin\\theta. \\end{cases}$"
    }
  },
  {
    id: "LAG-TB-CH08-Q09",
    source_type: "textbook",
    source: {
      paper_id: 2008,
      raw_title: "《线性代数与几何》第8章 空间曲面与曲线 课后习题",
      clean_title: "《线性代数与几何》第8章 空间曲面与曲线 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 8 章 · 习题八 第 9 题",
      page_start: 195,
      page_end: 195
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
        chapter: 8,
        chapter_title: "第8章 空间曲面与曲线",
        section: "8.3",
        section_title: "空间曲线及其方程",
        section_slug: "8.3_空间曲线及其方程",
        knowledge_points: ["曲线在坐标面上的投影", "消元法"]
      }
    },
    content: {
      stem: "求下列曲线在坐标面上的投影：\n\n(1) $\\begin{cases} x^2+y^2+z^2=9, \\\\ y-z=1, \\end{cases}$ 在 $xOy$ 平面；\n\n(2) $\\begin{cases} x=y^2+z^2, \\\\ x=4, \\end{cases}$ 在 $yOz$ 平面；\n\n(3) $\\begin{cases} x^2+y^2+z^2=2, \\\\ y=\\sqrt{x^2+z^2}, \\end{cases}$ 在 $xOz$ 平面。",
      sub_questions: [
        { sub_id: "(1)", stem: "$\\begin{cases} x^2+y^2+z^2=9, \\\\ y-z=1 \\end{cases}$ 在 $xOy$ 平面的投影", answer: "$\\begin{cases} x^2+2\\left(y-\\frac{1}{2}\\right)^2=\\frac{17}{2}, \\\\ z=0 \\end{cases}$" },
        { sub_id: "(2)", stem: "$\\begin{cases} x=y^2+z^2, \\\\ x=4 \\end{cases}$ 在 $yOz$ 平面的投影", answer: "$\\begin{cases} y^2+z^2=4, \\\\ x=0 \\end{cases}$" },
        { sub_id: "(3)", stem: "$\\begin{cases} x^2+y^2+z^2=2, \\\\ y=\\sqrt{x^2+z^2} \\end{cases}$ 在 $xOz$ 平面的投影", answer: "$\\begin{cases} x^2+z^2=1, \\\\ y=0 \\end{cases}$" }
      ]
    },
    solution: {
      answer: "(1) $\\begin{cases} x^2+2\\left(y-\\frac{1}{2}\\right)^2=\\frac{17}{2}, \\\\ z=0; \\end{cases}$\n(2) $\\begin{cases} y^2+z^2=4, \\\\ x=0; \\end{cases}$\n(3) $\\begin{cases} x^2+z^2=1, \\\\ y=0. \\end{cases}$",
      hints: "在方程组中消去垂直于目标坐标面的那个变量，得到投影柱面方程，再补充目标坐标面的平面方程。",
      steps: "(1) 在 $xOy$ 平面投影消去 $z$。由 $z=y-1$ 代入得 $x^2+y^2+(y-1)^2=9 \\implies x^2+2y^2-2y=8 \\implies x^2+2(y-\\frac{1}{2})^2 = \\frac{17}{2}$。方程为 $\\begin{cases} x^2+2(y-\\frac{1}{2})^2=\\frac{17}{2}, \\\\ z=0; \\end{cases}$\n(2) 在 $yOz$ 平面投影消去 $x$。代入 $x=4$ 得 $y^2+z^2=4$。方程为 $\\begin{cases} y^2+z^2=4, \\\\ x=0; \\end{cases}$\n(3) 在 $xOz$ 平面投影消去 $y$。代入 $y^2=x^2+z^2$ 得 $2(x^2+z^2)=2 \\implies x^2+z^2=1$。方程为 $\\begin{cases} x^2+z^2=1, \\\\ y=0. \\end{cases}$"
    }
  },
  {
    id: "LAG-TB-CH08-Q10",
    source_type: "textbook",
    source: {
      paper_id: 2008,
      raw_title: "《线性代数与几何》第8章 空间曲面与曲线 课后习题",
      clean_title: "《线性代数与几何》第8章 空间曲面与曲线 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 8 章 · 习题八 第 10 题",
      page_start: 196,
      page_end: 196
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 10,
      paper_q_num: 10,
      type: "calc",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 8,
        chapter_title: "第8章 空间曲面与曲线",
        section: "8.1",
        section_title: "空间曲面及其方程",
        section_slug: "8.1_空间曲面及其方程",
        knowledge_points: ["柱面方程求法", "准线与母线"]
      }
    },
    content: {
      stem: "写出下列柱面的方程：\n\n(1) 以 $\\begin{cases} x^2+y^2+z^2=4, \\\\ x+y+z=0 \\end{cases}$ 为准线，母线平行于 $z$ 轴；\n\n(2) 以 $\\begin{cases} 2x^2+y^2+z^2=16, \\\\ y=\\sqrt{x^2+z^2} \\end{cases}$ 为准线，母线平行于 $y$ 轴；\n\n(3) 以 $\\begin{cases} x^2+y^2+z^2=16, \\\\ y=-\\sqrt{x^2+z^2} \\end{cases}$ 为准线，母线平行于 $x$ 轴。",
      sub_questions: [
        { sub_id: "(1)", stem: "准线 $\\begin{cases} x^2+y^2+z^2=4, \\\\ x+y+z=0 \\end{cases}$，母线平行于 $z$ 轴", answer: "$x^2+y^2+xy=2$" },
        { sub_id: "(2)", stem: "准线 $\\begin{cases} 2x^2+y^2+z^2=16, \\\\ y=\\sqrt{x^2+z^2} \\end{cases}$，母线平行于 $y$ 轴", answer: "$3x^2+2z^2=16$" },
        { sub_id: "(3)", stem: "准线 $\\begin{cases} x^2+y^2+z^2=16, \\\\ y=-\\sqrt{x^2+z^2} \\end{cases}$，母线平行于 $x$ 轴", answer: "$y=-2\\sqrt{2} \\quad (|z| \\le 2\\sqrt{2})$" }
      ]
    },
    solution: {
      answer: "(1) $x^2+y^2+xy=2$；\n(2) $3x^2+2z^2=16$；\n(3) $y=-2\\sqrt{2} \\quad (|z| \\le 2\\sqrt{2})$。",
      hints: "母线平行于某轴，则柱面方程不含该轴变量。从准线方程组中消去母线所平行的坐标变量即可。",
      steps: "(1) 母线平行于 $z$ 轴，消去 $z$。由 $z=-(x+y)$ 代入得 $x^2+y^2+(x+y)^2=4 \\implies 2x^2+2y^2+2xy=4 \\implies x^2+y^2+xy=2$；\n(2) 母线平行于 $y$ 轴，消去 $y$。代入 $y^2=x^2+z^2$ 得 $2x^2+(x^2+z^2)+z^2=16 \\implies 3x^2+2z^2=16$；\n(3) 母线平行于 $x$ 轴，消去 $x$。由 $x^2+z^2=y^2$ 代入得 $y^2+y^2=16 \\implies 2y^2=16 \\implies y^2=8$。因 $y=-\\sqrt{x^2+z^2} \\le 0$，取 $y=-2\\sqrt{2}$。又因 $x^2=8-z^2 \\ge 0$，故定义域范围为 $|z| \\le 2\\sqrt{2}$。"
    }
  },
  {
    id: "LAG-TB-CH08-Q11",
    source_type: "textbook",
    source: {
      paper_id: 2008,
      raw_title: "《线性代数与几何》第8章 空间曲面与曲线 课后习题",
      clean_title: "《线性代数与几何》第8章 空间曲面与曲线 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 8 章 · 习题八 第 11 题",
      page_start: 196,
      page_end: 196
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
        chapter: 8,
        chapter_title: "第8章 空间曲面与曲线",
        section: "8.3",
        section_title: "空间曲线及其方程",
        section_slug: "8.3_空间曲线及其方程",
        knowledge_points: ["螺旋线", "投影曲线直角坐标方程"]
      }
    },
    content: {
      stem: "求螺旋线 $\\begin{cases} x=a\\cos\\theta, \\\\ y=a\\sin\\theta, \\\\ z=b\\theta \\end{cases}$ 在三个坐标面上的投影曲线的直角坐标方程。"
    },
    solution: {
      answer: "在 $xOy$ 平面上的投影曲线方程为 $\\begin{cases} x^2+y^2=a^2, \\\\ z=0; \\end{cases}$\n在 $yOz$ 平面上的投影曲线方程为 $\\begin{cases} y=a\\sin\\frac{z}{b}, \\\\ x=0; \\end{cases}$\n在 $xOz$ 平面上的投影曲线方程为 $\\begin{cases} x=a\\cos\\frac{z}{b}, \\\\ y=0. \\end{cases}$",
      hints: "消去参数 $\\theta$ 并令相应坐标平面的法向坐标为零。",
      steps: "(1) 在 $xOy$ 平面上：$x^2+y^2=a^2(\\cos^2\\theta+\\sin^2\\theta)=a^2$，故方程为 $\\begin{cases} x^2+y^2=a^2, \\\\ z=0; \\end{cases}$\n(2) 在 $yOz$ 平面上：由 $z=b\\theta$ 得 $\\theta=\\frac{z}{b}$，代入得 $y=a\\sin\\frac{z}{b}$，故方程为 $\\begin{cases} y=a\\sin\\frac{z}{b}, \\\\ x=0; \\end{cases}$\n(3) 在 $xOz$ 平面上：代入 $\\theta=\\frac{z}{b}$ 得 $x=a\\cos\\frac{z}{b}$，故方程为 $\\begin{cases} x=a\\cos\\frac{z}{b}, \\\\ y=0. \\end{cases}$"
    }
  },
  {
    id: "LAG-TB-CH08-Q12",
    source_type: "textbook",
    source: {
      paper_id: 2008,
      raw_title: "《线性代数与几何》第8章 空间曲面与曲线 课后习题",
      clean_title: "《线性代数与几何》第8章 空间曲面与曲线 课后习题",
      category: "教材课后习题",
      course_name: "线性代数与几何",
      academic_year: "教材配套",
      term: 1,
      exam_type: "textbook",
      paper_type: "教材原题",
      source_desc: "《线性代数与几何》第 8 章 · 习题八 第 12 题",
      page_start: 196,
      page_end: 196
    },
    meta: {
      section_type: "课后习题",
      order_in_paper: 12,
      paper_q_num: 12,
      type: "calc",
      difficulty: 2,
      score: 8
    },
    mapping: {
      linear_algebra_geometry: {
        chapter: 8,
        chapter_title: "第8章 空间曲面与曲线",
        section: "8.3",
        section_title: "空间曲线及其方程",
        section_slug: "8.3_空间曲线及其方程",
        knowledge_points: ["立体在坐标面上的投影", "不等式区域表示"]
      }
    },
    content: {
      stem: "求上半球面 $z=\\sqrt{4-x^2-y^2}$ 与圆锥面 $z=\\sqrt{x^2+y^2}$ 所围的立体在三个坐标面上的投影。"
    },
    solution: {
      answer: "在 $xOy$ 平面上的投影为 $\\begin{cases} x^2+y^2 \\le 2, \\\\ z=0; \\end{cases}$\n在 $yOz$ 平面上的投影为 $\\begin{cases} |y| \\le z \\le \\sqrt{4-y^2}, \\\\ x=0; \\end{cases}$\n在 $xOz$ 平面上的投影为 $\\begin{cases} |x| \\le z \\le \\sqrt{4-x^2}, \\\\ y=0. \\end{cases}$",
      hints: "求出两曲面的交线，并确定立体各向投影轮廓对应的区域不等式。",
      steps: "(1) 两曲面交线：$\\sqrt{4-x^2-y^2}=\\sqrt{x^2+y^2} \\implies 4-x^2-y^2=x^2+y^2 \\implies x^2+y^2=2$。在 $xOy$ 平面上立体投影为交线包围的闭区域，即 $\\begin{cases} x^2+y^2 \\le 2, \\\\ z=0; \\end{cases}$\n(2) 在 $yOz$ 平面上，下边界为锥面截线 $z=|y|$，上边界为球面截线 $z=\\sqrt{4-y^2}$，投影为曲边扇形区域 $\\begin{cases} |y| \\le z \\le \\sqrt{4-y^2}, \\\\ x=0; \\end{cases}$\n(3) 由对称性，在 $xOz$ 平面上的投影为 $\\begin{cases} |x| \\le z \\le \\sqrt{4-x^2}, \\\\ y=0. \\end{cases}$"
    }
  }
];

// KaTeX 校验
let errCount = 0;
function testMath(str, qid, field) {
  if (!str) return;
  const matches = str.match(/\\$\\$([\\s\\S]+?)\\$\\$|\\$([^\\$]+?)\\$/g) || [];
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

for (const q of ch08Questions) {
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

console.log(`Ch08 Total questions: ${ch08Questions.length}, KaTeX errors: ${errCount}`);
if (errCount === 0) {
  const outFile = path.join(__dirname, '../../src/data/exercises/raw_lag/ch08.json');
  fs.writeFileSync(outFile, JSON.stringify(ch08Questions, null, 2), 'utf-8');
  console.log(`Saved Chapter 8 to ${outFile}`);
} else {
  process.exit(1);
}
