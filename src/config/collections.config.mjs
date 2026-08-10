
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
      }
    ]
  },
  {
    id: 'science',
    slug: 'science', 
    title: '???',
    description: '???',
    books: [
      {
        id: 'biology-bank',
        slug: 'biology_bank',
        title: '???',
        description: '???',
        cover: 'https://images.unsplash.com/photo-1532187863486-abf9d39d66e8?auto=format&fit=crop&q=80&w=400',
        entryPoint: '???',
        trackClasses: ['.question-card', '.answer-card', '.concept-card'],
        modules: {
          '题': { emoji: '📝', short: '题', aliases: ['题'], theme: 'chip-problem' },
          '考点': { emoji: '💡', short: '考', aliases: ['考点', '考'], theme: 'chip-knowledge' },
          '概念': { emoji: '🧬', short: '概', aliases: ['概念', '概'], theme: 'chip-example' }
        }
      }
    ]
  }
];