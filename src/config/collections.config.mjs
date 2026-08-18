
export const collections = [
  {
    id: 'math',
    slug: 'math', 
    title: '高考数学',
    description: '',
    books: [
      {
        id: 'math-senior',
        slug: 'math_senior', 
        title: '新高考数学你真的掌握了吗（第二版）',
        description: '',
        cover: 'https://img.alicdn.com/bao/uploaded/i3/2222147525702/O1CN01uA0zRt1rzZVUNfX91_!!4611686018427386950-53-xy_item.heic_790x10000Q90.jpg_.webp',
        entryPoint: '06_第1章-三角函数', 
        trackClasses: ['.example-card', '.variant-card', '.summary-card', '.knowledge-card', '.method-card', '.fallback-block'],
        
        modules: {
          '例题': { emoji: '✍️', short: '例', aliases: ['例题', '例'], theme: 'chip-example' },
          '例': { emoji: '✍️', short: '例', aliases: ['例题', '例'], theme: 'chip-example' },
          '变式': { emoji: '🎯', short: '变', aliases: ['变式'], theme: 'chip-variant' },
          '结论总结': { emoji: '🏆', short: '结', aliases: ['结论总结', '结论'], theme: 'chip-conclusion' },
          '结论': { emoji: '🏆', short: '结', aliases: ['结论总结', '结论'], theme: 'chip-conclusion' },
          '经验总结': { emoji: '🏆', short: '经', aliases: ['经验总结', '经验', '总结'], theme: 'chip-conclusion' },
          '方法总结': { emoji: '🛠️', short: '方', aliases: ['方法总结', '方法'], theme: 'chip-method' },
          '方法': { emoji: '🛠️', short: '方', aliases: ['方法总结', '方法'], theme: 'chip-method' },
          '知识点': { emoji: '💡', short: '点', aliases: ['知识点'], theme: 'chip-knowledge' },
          '问题': { emoji: '❓', short: '问', aliases: ['问题'], theme: 'chip-problem' },
          '解析': { emoji: '🔑', short: '解', aliases: ['解析', '步骤'], theme: 'chip-problem' },
          '图': { 
            short: '图', 
            aliases: ['图'], 
            theme: 'chip-default', 
            isImage: true, 
            targetQuery: 'p, div, figcaption', 
            targetPattern: '^图\\\\s*(\\\\d+\\\\s*[-－]\\\\s*\\\\d+)$' 
          }
        }
      },
      {
        id: 'math-analysis',
        slug: 'math_analysis',
        title: '数学分析',
        description: '???',
        cover: 'https://images.unsplash.com/photo-1509228626012-67e33ae61292?auto=format&fit=crop&q=80&w=400',
        entryPoint: '01_内容简介',
        trackClasses: ['.example-card', '.variant-card', '.summary-card'],
        modules: {
          '例': { emoji: '✍️', short: '例', aliases: ['例'], theme: 'chip-example' },
          '变式': { emoji: '🎯', short: '变', aliases: ['变式'], theme: 'chip-variant' },
          '结论': { emoji: '🏆', short: '结', aliases: ['结论'], theme: 'chip-conclusion' },
          '图': { 
            short: '图', 
            aliases: ['图'], 
            theme: 'chip-default', 
            isImage: true, 
            targetQuery: 'p, div, figcaption', 
            targetPattern: '^图\\\\s*(\\\\d+\\\\s*[-－]\\\\s*\\\\d+)$' 
          }
        }
      },
      {
        id: 'engineering-analysis',
        slug: 'engineering_analysis',
        title: '工科数学分析基础（第三版）',
        description: '王绵森、马知恩主编，高等教育出版社。上册（第 1—4 章）为一元函数微积分与常微分方程，下册（第 5—7 章）为多元函数微积分与无穷级数，含习题与答案。',
        cover: '/covers/engineering_analysis.jpg',
        entryPoint: '00_内容简介',
        trackClasses: ['.example-card', '.knowledge-card', '.fallback-block'],
        modules: {
          '例': { emoji: '✍️', short: '例', aliases: ['例', '例题'], theme: 'chip-example' },
          '例题': { emoji: '✍️', short: '例', aliases: ['例', '例题'], theme: 'chip-example' },
          '定理': { emoji: '📐', short: '理', aliases: ['定理'], theme: 'chip-conclusion' },
          '定义': { emoji: '📖', short: '定', aliases: ['定义'], theme: 'chip-knowledge' },
          '性质': { emoji: '🔬', short: '性', aliases: ['性质'], theme: 'chip-knowledge' },
          '推论': { emoji: '➡️', short: '推', aliases: ['推论'], theme: 'chip-conclusion' },
          '引理': { emoji: '🧩', short: '引', aliases: ['引理'], theme: 'chip-conclusion' },
          '命题': { emoji: '📌', short: '命', aliases: ['命题'], theme: 'chip-conclusion' },
          '公理': { emoji: '📐', short: '公', aliases: ['公理'], theme: 'chip-conclusion' },
          '图': {
            short: '图',
            aliases: ['图'],
            theme: 'chip-default',
            isImage: true,
            targetQuery: 'p, div, figcaption',
            targetPattern: '^图\\s*(\\d+\\s*[-－]\\s*\\d+)$'
          }
        }
      },
      {
        id: 'linear-algebra',
        slug: 'linear_algebra',
        title: '线性代数及其应用（原书第5版）',
        description: '[美] David C. Lay、Steven R. Lay、Judi J. McDonald 著，刘深泉等译，机械工业出版社（华章数学译丛）。全书 8 章：线性方程组、矩阵代数、行列式、向量空间、特征值与特征向量、正交性和最小二乘法、对称矩阵和二次型、向量空间的几何学，另含附录、术语表与奇数习题答案。',
        cover: '/covers/linear_algebra.jpg',
        entryPoint: '00_内容简介',
        trackClasses: ['.example-card', '.knowledge-card', '.note-block', '.fallback-block'],
        modules: {
          '例': { emoji: '✍️', short: '例', aliases: ['例', '例题'], theme: 'chip-example' },
          '例题': { emoji: '✍️', short: '例', aliases: ['例', '例题'], theme: 'chip-example' },
          '定理': { emoji: '📐', short: '理', aliases: ['定理'], theme: 'chip-conclusion' },
          '定义': { emoji: '📖', short: '定', aliases: ['定义'], theme: 'chip-knowledge' },
          '性质': { emoji: '🔬', short: '性', aliases: ['性质'], theme: 'chip-knowledge' },
          '推论': { emoji: '➡️', short: '推', aliases: ['推论'], theme: 'chip-conclusion' },
          '引理': { emoji: '🧩', short: '引', aliases: ['引理'], theme: 'chip-conclusion' },
          '命题': { emoji: '📌', short: '命', aliases: ['命题'], theme: 'chip-conclusion' },
          '公理': { emoji: '📐', short: '公', aliases: ['公理'], theme: 'chip-conclusion' },
          '图': {
            short: '图',
            aliases: ['图'],
            theme: 'chip-default',
            isImage: true,
            targetQuery: 'p, div, figcaption',
            targetPattern: '^图\\s*(\\d+\\s*[-－]\\s*\\d+)$'
          }
        }
      },
      {
        id: 'probability-statistics',
        slug: 'probability_statistics',
        title: '概率论与数理统计教程（第三版）',
        description: '茆诗松、程依明、濮晓龙编著，高等教育出版社。全书八章：前四章为概率论部分（随机事件与概率、随机变量及其分布、多维随机变量及其分布、大数定律与中心极限定理），后四章为数理统计部分（统计量及其分布、参数估计、假设检验、方差分析与回归分析）。每节末附分节习题，书末附统计用表（附表1—14）与习题参考答案。',
        cover: '/covers/probability_statistics.jpg',
        entryPoint: '00_内容简介',
        trackClasses: ['.example-card', '.knowledge-card', '.note-block', '.fallback-block'],
        modules: {
          '例': { emoji: '✍️', short: '例', aliases: ['例', '例题'], theme: 'chip-example' },
          '例题': { emoji: '✍️', short: '例', aliases: ['例', '例题'], theme: 'chip-example' },
          '定理': { emoji: '📐', short: '理', aliases: ['定理'], theme: 'chip-conclusion' },
          '定义': { emoji: '📖', short: '定', aliases: ['定义'], theme: 'chip-knowledge' },
          '性质': { emoji: '🔬', short: '性', aliases: ['性质'], theme: 'chip-knowledge' },
          '推论': { emoji: '➡️', short: '推', aliases: ['推论'], theme: 'chip-conclusion' },
          '引理': { emoji: '🧩', short: '引', aliases: ['引理'], theme: 'chip-conclusion' },
          '命题': { emoji: '📌', short: '命', aliases: ['命题'], theme: 'chip-conclusion' },
          '公理': { emoji: '📐', short: '公', aliases: ['公理'], theme: 'chip-conclusion' },
          '图': {
            short: '图',
            aliases: ['图'],
            theme: 'chip-default',
            isImage: true,
            targetQuery: 'p, div, figcaption',
            targetPattern: '^图\\s*(\\d+\\s*[-－]\\s*\\d+)$'
          }
        }
      }
    ]
  },
  {
    id: 'science',
    slug: 'science',
    title: '物理',
    description: '大学物理教材数字化',
    books: [
      {
        id: 'university-physics',
        slug: 'university_physics',
        title: '大学物理学（第七版）',
        description: '赵近芳、王登龙主编，北京邮电大学出版社。上册（第 1—8 章）为力学基础、气体动理论和热力学；下册（第 9—17 章）为电磁学、波动光学和量子论。各章课后习题按题型分页，每题一个板块，部分章节附参考答案。',
        cover: '/covers/university_physics.jpg',
        entryPoint: '00_内容简介',
        trackClasses: ['.example-card', '.knowledge-card', '.exercise-card'],
        modules: {
          '例': { emoji: '✍️', short: '例', aliases: ['例', '例题'], theme: 'chip-example' },
          '例题': { emoji: '✍️', short: '例', aliases: ['例', '例题'], theme: 'chip-example' },
          '定理': { emoji: '📐', short: '理', aliases: ['定理'], theme: 'chip-conclusion' },
          '定义': { emoji: '📖', short: '定', aliases: ['定义'], theme: 'chip-knowledge' },
          '性质': { emoji: '🔬', short: '性', aliases: ['性质'], theme: 'chip-knowledge' },
          '推论': { emoji: '➡️', short: '推', aliases: ['推论'], theme: 'chip-conclusion' },
          '引理': { emoji: '🧩', short: '引', aliases: ['引理'], theme: 'chip-conclusion' },
          '命题': { emoji: '📌', short: '命', aliases: ['命题'], theme: 'chip-conclusion' },
          '公理': { emoji: '📐', short: '公', aliases: ['公理'], theme: 'chip-conclusion' },
          '习题': { emoji: '📝', short: '习', aliases: ['习题'], theme: 'chip-problem' }
        }
      }
    ]
  }
];
