/**
 * src/config/exercise-banks.config.ts
 * AstroLib 题库与习题册配置中心（单一事实源 SSOT）
 *
 * 规范遵循：
 * - Layer 1 (Configuration / Source of Truth)
 * - 纯 TypeScript / ESM 模块，跨服务端与客户端安全复用
 * - 声明各题库适用书籍（applicableBooks）、题库类型（sourceType）及开源许可协议（license）
 */

export interface ExerciseBankLicense {
  /** 规范协议标识符（如 'CC-BY-NC-SA 4.0'） */
  spdx: string;
  /** 协议简短显示名（如 'CC-BY-NC-SA 4.0'） */
  shortName: string;
  /** 完整协议全称（如 '知识共享 署名-非商业性使用-相同方式共享 4.0 国际许可协议'） */
  name: string;
  /** 开源/归档源码仓库 URL */
  repoUrl: string;
  /** 仓库短名（如 'ArtveFlinaInBupt/bump-archive'） */
  repoName?: string;
  /** 作者或开源社区主体 */
  author?: string;
}

export interface ExerciseBank {
  /** 题库唯一标识符 */
  id: string;
  /** 题库显示名称 */
  title: string;
  /** 题目来源分类 */
  sourceType: 'exam' | 'textbook';
  /** 该题库可生效的书籍 slug 列表（对应 collections.config.mjs 中的 book.slug） */
  applicableBooks: string[];
  /** 开源许可证元数据（若具有开源许可） */
  license?: ExerciseBankLicense;
  /** 题库描述说明 */
  description?: string;
}

/**
 * 全站题库注册表
 */
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

/**
 * 根据书籍 slug 获取适用于该书的所有题库配置
 * @param bookSlug 书籍唯一 slug（例如 'engineering_analysis'）
 */
export function getExerciseBanksForBook(bookSlug: string): ExerciseBank[] {
  if (!bookSlug) return [];
  return EXERCISE_BANKS.filter((bank) => bank.applicableBooks.includes(bookSlug));
}

/**
 * 根据题库 ID 获取特定题库配置
 * @param bankId 题库唯一 ID
 */
export function getExerciseBankById(bankId: string): ExerciseBank | undefined {
  return EXERCISE_BANKS.find((bank) => bank.id === bankId);
}
