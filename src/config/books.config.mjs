// 全站多合集、多图书中央数据配置文件
export const collections = [
  {
    id: 'math',
    slug: 'math', // 对应 docs/collections/math 目录名
    title: '高考数学通关系列',
    description: '深度聚焦新高考数学命题规律，攻克函数、几何与向量大招体系。',
    books: [
      {
        id: 'math-senior',
        slug: 'math_senior', // 对应 docs/collections/math/math_senior 目录名
        title: '新高掌数学你真的掌握了吗（第二版）',
        description: '三角函数、解三角形与平面向量核心提分指南。',
        cover: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=400',
        entryPoint: '06_第1章-三角函数', // 首页点击后跳转的初始章节
        tocRules: {
          // 1. 指定本书中要抓取哪些卡片大类到大纲中
          trackClasses: ['.example-card', '.variant-card', '.summary-card', '.knowledge-card', '.method-card', '.fallback-block'],
          // 2. 将正文中的所有前缀名，映射到对应的归类徽章上
          // 例：正文出现“例题 1.74”或“例1.74”，均能被自动识别，并在徽章内展示汉字“例”，且绑定对应的“例题”绿色配色
          chipLabels: {
            '例': '例', 
            '例题': '例', 
            '变式': '变式', 
            '结论总结': '结论', 
            '结论': '结论', 
            '经验总结': '结论', 
            '方法总结': '方法', 
            '知识点': '点', 
            '问题': '问'
          },
          // 3. 动态配置这本图书是否启用图片联动、以及匹配图片的正则规则
          linkFigures: {
            enabled: true,
            pattern: '图\\s*\\d+-\\d+' // 匹配“图 3-48”或“图3-48”的正则
          }
        }
      },
      {
        id: 'math-geometry',
        slug: 'math_geometry',
        title: '高分几何与代数专项训练',
        description: '解析几何、立体几何与代数方程的解题方法精讲。',
        cover: 'https://images.unsplash.com/photo-1509228626012-67e33ae61292?auto=format&fit=crop&q=80&w=400',
        entryPoint: '01_解析几何导读',
        tocRules: {
          trackClasses: ['.example-card', '.variant-card', '.summary-card'],
          chipLabels: { 
            '例': '例', 
            '变式': '变式', 
            '结论': '结论' 
          },
          linkFigures: {
            enabled: true,
            pattern: '图\\s*\\d+-\\d+'
          }
        }
      }
    ]
  },
  {
    id: 'science',
    slug: 'science', // 对应 docs/collections/science 目录名
    title: '高考理综提分系列',
    description: '理化生三科核心题型与易错点分类精讲，直击高考必考核心模块。',
    books: [
      {
        id: 'biology-bank',
        slug: 'biology_bank',
        title: '高考生物题库分类解析',
        description: '分子与细胞、遗传与进化核心核心概念及高考真题深度拆解。',
        cover: 'https://images.unsplash.com/photo-1532187863486-abf9d39d66e8?auto=format&fit=crop&q=80&w=400',
        entryPoint: '01_分子与细胞导读',
        tocRules: {
          trackClasses: ['.question-card', '.answer-card', '.concept-card'],
          chipLabels: { 
            '题': '题', 
            '考点': '考点', 
            '概念': '概念' 
          },
          linkFigures: {
            enabled: false, // 生物书中不启用图片联动，完全解耦
            pattern: ''
          }
        }
      }
    ]
  }
];