import { features } from '../../config/features.config.mjs';

export interface CommunityAiSolution {
  id: string;
  question_id: string;
  model_name: string;
  author_name: string;
  solution_md: string;
  created_at: string;
  upvotes: number;
  tags?: string[];
  remarks?: string;
}

export interface ExerciseFeedbackPayload {
  question_id: string;
  paper_title?: string;
  order_in_paper?: number;
  chapter?: number;
  section?: string;
  question_type?: string;
  error_types: string[];
  description: string;
  suggestion?: string;
  reporter_name?: string;
  created_at?: string;
}

export interface SaveSourcePayload {
  question_id: string;
  chapter: number;
  question_data: any;
}

class ExerciseDbClient {
  private config: any = {};
  private upvotedSolutions = new Set<string>();

  constructor() {
    const featConfig = features.exercises?.config || {};
    this.config = featConfig.cloudDb || { apiBaseUrl: '/api/exercise' };
    this.loadUpvotedLocal();
  }

  private loadUpvotedLocal() {
    if (typeof localStorage === 'undefined') return;
    try {
      const saved = localStorage.getItem('astrolib_ex_upvoted_solutions');
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) {
          arr.forEach((id) => this.upvotedSolutions.add(id));
        }
      }
    } catch {}
  }

  private saveUpvotedLocal() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(
        'astrolib_ex_upvoted_solutions',
        JSON.stringify(Array.from(this.upvotedSolutions))
      );
    } catch {}
  }

  public isUpvoted(solutionId: string): boolean {
    return this.upvotedSolutions.has(solutionId);
  }

  public async fetchCommunitySolutions(questionId: string): Promise<CommunityAiSolution[]> {
    const baseUrl = this.config.apiBaseUrl || '/api/exercise';

    if (this.config.supabaseUrl && this.config.supabaseAnonKey) {
      try {
        const url = `${this.config.supabaseUrl}/rest/v1/exercise_ai_solutions?question_id=eq.${encodeURIComponent(questionId)}&order=upvotes.desc,created_at.desc`;
        const res = await fetch(url, {
          headers: {
            apikey: this.config.supabaseAnonKey,
            Authorization: `Bearer ${this.config.supabaseAnonKey}`,
          },
        });
        if (res.ok) {
          const list = await res.json();
          return Array.isArray(list) ? list : [];
        }
      } catch (err) {
        console.warn('[ExerciseDbClient] Supabase fetch error, fallback to local:', err);
      }
    }

    try {
      const res = await fetch(`${baseUrl}/community-solutions?question_id=${encodeURIComponent(questionId)}`);
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      }
    } catch (err) {

    }

    return this.getLocalSolutions(questionId);
  }

  public async uploadCommunitySolution(payload: {
    question_id: string;
    model_name: string;
    author_name?: string;
    solution_md: string;
    remarks?: string;
    tags?: string[];
  }): Promise<{ success: boolean; data?: CommunityAiSolution; message?: string }> {
    const newSolution: CommunityAiSolution = {
      id: `sol_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      question_id: payload.question_id,
      model_name: (payload.model_name || 'AI 推导模型').trim(),
      author_name: (payload.author_name || '热心读者').trim(),
      solution_md: payload.solution_md,
      created_at: new Date().toISOString(),
      upvotes: 0,
      tags: payload.tags || [],
      remarks: payload.remarks || '',
    };

    if (this.config.supabaseUrl && this.config.supabaseAnonKey) {
      try {
        const url = `${this.config.supabaseUrl}/rest/v1/exercise_ai_solutions`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: this.config.supabaseAnonKey,
            Authorization: `Bearer ${this.config.supabaseAnonKey}`,
            Prefer: 'return=representation',
          },
          body: JSON.stringify(newSolution),
        });
        if (res.ok) {
          const created = await res.json();
          return { success: true, data: Array.isArray(created) ? created[0] : newSolution };
        }
      } catch (err) {
        console.warn('[ExerciseDbClient] Supabase upload failed, saving to dev/local API:', err);
      }
    }

    const baseUrl = this.config.apiBaseUrl || '/api/exercise';
    try {
      const res = await fetch(`${baseUrl}/community-solutions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSolution),
      });
      if (res.ok) {
        const result = await res.json();
        return { success: true, data: result.data || newSolution };
      }
    } catch {}

    this.saveLocalSolution(newSolution);
    return { success: true, data: newSolution, message: '已保存至本地题解库' };
  }

  public async upvoteSolution(solutionId: string): Promise<{ success: boolean; newUpvotes: number }> {
    if (this.upvotedSolutions.has(solutionId)) {
      return { success: false, newUpvotes: 0 };
    }

    this.upvotedSolutions.add(solutionId);
    this.saveUpvotedLocal();

    const baseUrl = this.config.apiBaseUrl || '/api/exercise';
    try {
      const res = await fetch(`${baseUrl}/community-solutions/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: solutionId }),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, newUpvotes: data.upvotes ?? 1 };
      }
    } catch {}

    return { success: true, newUpvotes: 1 };
  }

  public async submitFeedback(payload: ExerciseFeedbackPayload): Promise<{ success: boolean; message?: string }> {
    const feedbackItem = {
      id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ...payload,
      created_at: payload.created_at || new Date().toISOString(),
      status: 'pending',
    };

    if (this.config.supabaseUrl && this.config.supabaseAnonKey) {
      try {
        const url = `${this.config.supabaseUrl}/rest/v1/exercise_feedbacks`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: this.config.supabaseAnonKey,
            Authorization: `Bearer ${this.config.supabaseAnonKey}`,
          },
          body: JSON.stringify(feedbackItem),
        });
        if (res.ok) {
          return { success: true, message: '勘误反馈已成功提交至云端，感谢您的贡献！' };
        }
      } catch {}
    }

    const baseUrl = this.config.apiBaseUrl || '/api/exercise';
    try {
      const res = await fetch(`${baseUrl}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackItem),
      });
      if (res.ok) {
        return { success: true, message: '勘误反馈已成功提交至开发团队，感谢您的反馈！' };
      }
    } catch {}

    this.saveLocalFeedback(feedbackItem);
    return { success: true, message: '勘误已记录在本地反馈列表中，感谢您的贡献！' };
  }

  public async saveQuestionSource(payload: SaveSourcePayload): Promise<{ success: boolean; message?: string }> {
    const baseUrl = this.config.apiBaseUrl || '/api/exercise';
    try {
      const res = await fetch(`${baseUrl}/save-source`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, message: data.message || '源码修改已持久化写入本地源文件并完成热重载！' };
      }
      const errData = await res.json().catch(() => ({}));
      return { success: false, message: errData.error || `保存失败 (HTTP ${res.status})` };
    } catch (err: any) {
      return { success: false, message: `网络或服务连接失败: ${err?.message || err}` };
    }
  }

  private getLocalSolutions(questionId: string): CommunityAiSolution[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(`astrolib_ex_solutions_${questionId}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }

  private saveLocalSolution(solution: CommunityAiSolution) {
    if (typeof localStorage === 'undefined') return;
    try {
      const list = this.getLocalSolutions(solution.question_id);
      list.unshift(solution);
      localStorage.setItem(`astrolib_ex_solutions_${solution.question_id}`, JSON.stringify(list));
    } catch {}
  }

  private saveLocalFeedback(feedback: any) {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem('astrolib_ex_feedbacks') || '[]';
      const list = JSON.parse(raw);
      list.unshift(feedback);
      localStorage.setItem('astrolib_ex_feedbacks', JSON.stringify(list));
    } catch {}
  }
}

export const exerciseDb = new ExerciseDbClient();
