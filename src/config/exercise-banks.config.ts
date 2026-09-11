export interface ExerciseBankLicense {

  spdx: string;

  shortName: string;

  name: string;

  repoUrl: string;

  repoName?: string;

  author?: string;
}

export interface ExerciseBank {

  id: string;

  title: string;

  sourceType: 'exam' | 'textbook';

  applicableBooks: string[];

  license?: ExerciseBankLicense;

  description?: string;
}

export const EXERCISE_BANKS: ExerciseBank[] = [
  {
    id: 'bupt_math',
    title: '大邮数学集',
    sourceType: 'exam',
    applicableBooks: ['engineering_analysis'],
    license: {
      spdx: 'CC-BY-NC-SA 4.0',
      shortName: 'CC-BY-NC-SA 4.0',
      name: '知识共享 署名-非商业性使用-相同方式共享 4.0 国际许可协议',
      repoUrl: 'https://github.com/ArtveFlinaInBupt/bump-archive',
      repoName: 'ArtveFlinaInBupt/bump-archive',
      author: '北京邮电大学开源社区',
    },
    description: '北京邮电大学数学类核心基础课程期中、期末真题与推导解析。',
  },
  {
    id: 'textbook_exercises',
    title: '《工科数学分析》课后习题',
    sourceType: 'textbook',
    applicableBooks: ['engineering_analysis'],
    description: '《工科数学分析基础（第三版）》教材配套分节课后练习题与推导解析。',
  },
];

export function getExerciseBanksForBook(bookSlug: string): ExerciseBank[] {
  if (!bookSlug) return [];
  return EXERCISE_BANKS.filter((bank) => bank.applicableBooks.includes(bookSlug));
}

export function getExerciseBankById(bankId: string): ExerciseBank | undefined {
  return EXERCISE_BANKS.find((bank) => bank.id === bankId);
}
