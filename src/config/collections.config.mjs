export const collections = [
  {
    id: 'math',
    slug: 'math',
    title: '数学',
    description: '收录高中数学教辅、数学分析、工科数学分析、线性代数与概率论数理统计教材',
    books: [
      {
        id: 'math-senior',
        slug: 'math_senior',
        title: '新高考数学你真的掌握了吗（第二版）',
        author: '清华大学出版社教研团队',
        publisher: '清华大学出版社',
        isbn: '9787302521198',
        edition: '第二版',
        stage: 'high-school',
        stageLabel: '高中',
        category: 'supplement',
        categoryLabel: '教辅',
        subject: 'math',
        subjectLabel: '数学',
        description: '高中数学专题方法与典型例题解析，包含三角函数、数列、导数与立体几何等核心章节。',
        tags: ['高考数学', '高中数学', '三角函数', '数列', '导数', '解析几何'],
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
        author: '华东师范大学数学系',
        publisher: '高等教育出版社',
        isbn: '9787040516609',
        edition: '第五版',
        stage: 'university',
        stageLabel: '大学本科',
        category: 'textbook',
        categoryLabel: '教材',
        subject: 'math',
        subjectLabel: '数学',
        description: '数学类专业基础课教材。系统阐述实数理论、极限理论、单变量与多变量微积分、级数论及含参变量积分。',
        tags: ['数学分析', '实数理论', '极限论', '微积分', '级数'],
        cover: 'https://images.unsplash.com/photo-1509228626012-67e33ae61292?auto=format&fit=crop&q=80&w=400',
        entryPoint: '01_内容简介',
        trackClasses: ['.example-card', '.variant-card', '.summary-card', '.knowledge-card', '.method-card', '.fallback-block'],
        modules: {
          '例': { emoji: '✍️', short: '例', aliases: ['例', '例题'], theme: 'chip-example' },
          '例题': { emoji: '✍️', short: '例', aliases: ['例', '例题'], theme: 'chip-example' },
          '变式': { emoji: '🎯', short: '变', aliases: ['变式'], theme: 'chip-variant' },
          '定理': { emoji: '📐', short: '理', aliases: ['定理'], theme: 'chip-conclusion' },
          '定义': { emoji: '📖', short: '定', aliases: ['定义'], theme: 'chip-knowledge' },
          '性质': { emoji: '🔬', short: '性', aliases: ['性质'], theme: 'chip-knowledge' },
          '推论': { emoji: '➡️', short: '推', aliases: ['推论'], theme: 'chip-conclusion' },
          '引理': { emoji: '🧩', short: '引', aliases: ['引理'], theme: 'chip-conclusion' },
          '命题': { emoji: '📌', short: '命', aliases: ['命题'], theme: 'chip-conclusion' },
          '公理': { emoji: '📐', short: '公', aliases: ['公理'], theme: 'chip-conclusion' },
          '结论': { emoji: '🏆', short: '结', aliases: ['结论'], theme: 'chip-conclusion' },
          '方法': { emoji: '🛠️', short: '方', aliases: ['方法总结', '方法'], theme: 'chip-method' },
          '习题': { emoji: '📝', short: '习', aliases: ['习题', '练习题'], theme: 'chip-problem' },
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
        author: '王绵森、马知恩主编',
        publisher: '高等教育出版社',
        isbn: '9787040401882',
        edition: '第三版',
        stage: 'university',
        stageLabel: '大学本科',
        category: 'textbook',
        categoryLabel: '教材',
        subject: 'math',
        subjectLabel: '数学',
        description: '高等工科院校数学基础教材。上册包含一元微积分与常微分方程，下册包含多元微积分与无穷级数。',
        tags: ['工科数学分析', '高等数学', '微积分', '常微分方程', '无穷级数'],
        cover: '/covers/engineering_analysis.jpg',
        entryPoint: '00_内容简介',
        trackClasses: ['.example-card', '.knowledge-card', '.exercise-card', '.fallback-block'],
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
          '习题': { emoji: '📝', short: '习', aliases: ['习题', '真题', '练习题'], theme: 'chip-problem' },
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
        author: '[美] David C. Lay、Steven R. Lay 等著，刘深泉等译',
        publisher: '机械工业出版社',
        isbn: '9787111603528',
        edition: '原书第5版',
        stage: 'university',
        stageLabel: '大学本科',
        category: 'textbook',
        categoryLabel: '教材',
        subject: 'math',
        subjectLabel: '数学',
        description: '现代线性代数经典教材。涵盖线性方程组、矩阵代数、行列式、向量空间、特征值与特征向量、正交性及对称矩阵。',
        tags: ['线性代数', '矩阵代数', '行列式', '向量空间', '特征值', '正交性'],
        cover: '/covers/linear_algebra.jpg',
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
        id: 'probability-statistics',
        slug: 'probability_statistics',
        title: '概率论与数理统计教程（第三版）',
        author: '茆诗松、程依明、濮晓龙编著',
        publisher: '高等教育出版社',
        isbn: '9787040510843',
        edition: '第三版',
        stage: 'university',
        stageLabel: '大学本科',
        category: 'textbook',
        categoryLabel: '教材',
        subject: 'math',
        subjectLabel: '数学',
        description: '高等院校概率论与数理统计教材。涵盖随机事件与概率、随机变量及其分布、极限定理、参数估计与假设检验。',
        tags: ['概率论', '数理统计', '随机变量', '极限定理', '参数估计', '假设检验'],
        cover: '/covers/probability_statistics.jpg',
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
      }
    ]
  },
  {
    id: 'science',
    slug: 'science',
    title: '物理',
    description: '收录大学物理学教材与配套课后习题',
    books: [
      {
        id: 'university-physics',
        slug: 'university_physics',
        title: '大学物理学（第七版）',
        author: '赵近芳、王登龙主编',
        publisher: '北京邮电大学出版社',
        isbn: '9787563560738',
        edition: '第七版',
        stage: 'university',
        stageLabel: '大学本科',
        category: 'exercise',
        categoryLabel: '教材与习题',
        subject: 'science',
        subjectLabel: '物理',
        description: '理工科大学物理教材与分章习题。涵盖力学基础、热学、电磁学、波动光学与近代物理基础。',
        tags: ['大学物理', '力学', '电磁学', '热学', '波动光学', '课后习题'],
        cover: '/covers/university_physics.jpg',
        entryPoint: '00_内容简介',
        trackClasses: ['.example-card', '.knowledge-card', '.exercise-card', '.fallback-block'],
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

export function getAllBooks() {
  const list = [];
  for (const col of collections) {
    for (const book of col.books) {
      list.push({
        ...book,
        collectionId: col.id,
        collectionSlug: col.slug,
        collectionTitle: col.title,
      });
    }
  }
  return list;
}
