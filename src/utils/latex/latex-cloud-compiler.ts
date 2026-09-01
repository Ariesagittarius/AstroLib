/**
 * src/utils/latex/latex-cloud-compiler.ts
 * 基于 GitHub Actions 并发池的 XeLaTeX 云端编译与免自建服务器直出 PDF 打印调度引擎
 * 遵循极简学术排版哲学与 VitePress 设计规范
 */

export interface CloudCompileConfig {
  owner: string;
  repo: string;
  workflowFile: string;
  branch: string;
  token: string;
  proxyUrl?: string;
}

export type CompileStep = 'idle' | 'preparing' | 'dispatching' | 'queued' | 'compiling' | 'ready' | 'failed' | 'timeout';

export interface CompileJobState {
  jobId: string;
  step: CompileStep;
  progress: number; // 0 - 100
  statusText: string;
  elapsedSeconds: number;
  pdfUrl?: string;
  filename: string;
  errorLog?: string;
}

export const STORAGE_KEYS = {
  TOKEN: 'astrolib_compiler_gh_token',
  OWNER: 'astrolib_compiler_owner',
  REPO: 'astrolib_compiler_repo',
  BRANCH: 'astrolib_compiler_branch',
};

export const DEFAULT_CLOUD_CONFIG: CloudCompileConfig = {
  owner: 'Ariesagittarius',
  repo: 'AstroLib',
  workflowFile: 'compile-latex.yml',
  branch: 'main',
  token: '',
};

/**
 * 获取持久化的编译配置
 */
export function getStoredCompilerConfig(): CloudCompileConfig {
  if (typeof window === 'undefined') return { ...DEFAULT_CLOUD_CONFIG };

  const token = localStorage.getItem(STORAGE_KEYS.TOKEN) || '';
  const owner = localStorage.getItem(STORAGE_KEYS.OWNER) || DEFAULT_CLOUD_CONFIG.owner;
  const repo = localStorage.getItem(STORAGE_KEYS.REPO) || DEFAULT_CLOUD_CONFIG.repo;
  const branch = localStorage.getItem(STORAGE_KEYS.BRANCH) || DEFAULT_CLOUD_CONFIG.branch;

  return {
    owner,
    repo,
    workflowFile: DEFAULT_CLOUD_CONFIG.workflowFile,
    branch,
    token,
  };
}

/**
 * 保存编译配置到 localStorage
 */
export function saveCompilerConfig(config: Partial<CloudCompileConfig>): void {
  if (typeof window === 'undefined') return;
  if (config.token !== undefined) localStorage.setItem(STORAGE_KEYS.TOKEN, config.token.trim());
  if (config.owner !== undefined) localStorage.setItem(STORAGE_KEYS.OWNER, config.owner.trim());
  if (config.repo !== undefined) localStorage.setItem(STORAGE_KEYS.REPO, config.repo.trim());
  if (config.branch !== undefined) localStorage.setItem(STORAGE_KEYS.BRANCH, config.branch.trim());
}

/**
 * 生成唯一的任务标识符 (形如 job-l8x9a2-k4f9)
 */
export function generateJobId(): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 7);
  return `job-${time}-${rand}`;
}

/**
 * UTF-8 字符串安全 Base64 编码 (适配浏览器 Unicode 与公式特殊符号)
 */
export function unicodeBase64Encode(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_match, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    })
  );
}

/**
 * 向 GitHub Actions 发起 workflow_dispatch 编译请求
 */
export async function dispatchCompileWorkflow(
  jobId: string,
  latexSource: string,
  filename: string,
  config: CloudCompileConfig
): Promise<void> {
  const token = config.token.trim();
  if (!token) {
    throw new Error('未配置 GitHub Access Token，请先在设置中配置具备 actions:write 权限的 Personal Access Token');
  }

  const texB64 = unicodeBase64Encode(latexSource);
  const endpoint = `https://api.github.com/repos/${config.owner}/${config.repo}/actions/workflows/${config.workflowFile}/dispatches`;

  const payload = {
    ref: config.branch || 'main',
    inputs: {
      job_id: jobId,
      tex_b64: texB64,
      output_filename: filename,
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github.v3+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const json = await response.json();
      errorDetail = json.message || response.statusText;
    } catch {
      errorDetail = response.statusText;
    }
    if (response.status === 404) {
      throw new Error(`找不到工作流文件 (${config.workflowFile}) 或仓库不存在。请确认仓库所有者与工作流配置。`);
    } else if (response.status === 401 || response.status === 403) {
      throw new Error(`GitHub 鉴权失败 (${response.status}): ${errorDetail}。请检查 Token 是否有效且包含 repo/actions 权限。`);
    } else {
      throw new Error(`提交编译请求失败 (${response.status}): ${errorDetail}`);
    }
  }
}

/**
 * 单次直接检查指定任务的 GitHub Release PDF 资产 (用于超时后手动刷新或断点恢复)
 */
export async function checkReleaseDirectly(
  jobId: string,
  config: CloudCompileConfig
): Promise<string | null> {
  const releaseApi = `https://api.github.com/repos/${config.owner}/${config.repo}/releases/tags/job-${jobId}`;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (config.token) {
    headers['Authorization'] = `Bearer ${config.token.trim()}`;
  }
  try {
    const res = await fetch(releaseApi, { headers });
    if (res.status === 200) {
      const releaseData = await res.json();
      const assets: any[] = releaseData.assets || [];
      const pdfAsset = assets.find((a) => a.name.endsWith('.pdf'));
      if (pdfAsset) {
        return pdfAsset.browser_download_url;
      }
    }
  } catch {
    // 忽略网络异常，返回 null
  }
  return null;
}

/**
 * 轮询任务编译状态并获取 Release PDF 直链 (免本站服务器中转)
 * 适配 TeX Live 2024 Docker 镜像拉取 (90~150s) 与 XeLaTeX 完整编译周期 (30~60s)
 */
export async function pollCompileResult(
  jobId: string,
  filename: string,
  config: CloudCompileConfig,
  onUpdate: (state: CompileJobState) => void,
  signal?: AbortSignal,
  startElapsedSeconds = 0
): Promise<string> {
  const startTime = Date.now() - startElapsedSeconds * 1000;
  // 110 次迭代，每次约 3.5 秒，总计 ~6.5 分钟超时，充分覆盖 GitHub Actions 5 分钟上限
  const maxAttempts = 110;

  const state: CompileJobState = {
    jobId,
    step: startElapsedSeconds > 0 ? 'compiling' : 'queued',
    progress: Math.min(85, 25 + Math.floor(startElapsedSeconds * 0.4)),
    statusText: startElapsedSeconds > 0 ? `继续检查编译状态 (${startElapsedSeconds}s)...` : '已派发至 GitHub Actions 算力池，正在调度 Runner...',
    elapsedSeconds: startElapsedSeconds,
    filename,
  };

  onUpdate({ ...state });

  let lastRunCheckTime = 0;
  let ghRunStatusText = '';

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (signal?.aborted) {
      throw new Error('用户已取消编译');
    }

    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    state.elapsedSeconds = elapsed;

    // 动态调整轮询间隔：前 15 秒快速检测 (2.5s)，之后放宽至 3.5s 减少 GitHub API 频次
    const currentInterval = elapsed < 15 ? 2500 : 3500;
    await new Promise((res) => setTimeout(res, currentInterval));

    // 每隔约 18 秒，若有 Token 则辅助检查 GitHub Actions 真实 Run 状态
    const now = Date.now();
    if (config.token && now - lastRunCheckTime > 18000) {
      lastRunCheckTime = now;
      try {
        const runsApi = `https://api.github.com/repos/${config.owner}/${config.repo}/actions/workflows/${config.workflowFile}/runs?per_page=3`;
        const runRes = await fetch(runsApi, {
          headers: {
            Accept: 'application/vnd.github.v3+json',
            Authorization: `Bearer ${config.token.trim()}`,
          },
          signal,
        });
        if (runRes.ok) {
          const runData = await runRes.json();
          const runs: any[] = runData.workflow_runs || [];
          // 寻找最近的 workflow run
          if (runs.length > 0) {
            const latestRun = runs[0];
            if (latestRun.status === 'queued') {
              ghRunStatusText = 'GitHub Actions 正在排队等待分配 Ubuntu 算力节点...';
            } else if (latestRun.status === 'in_progress') {
              ghRunStatusText = 'Ubuntu 节点运行中：拉取 TeXLive 镜像并编译中...';
            } else if (latestRun.status === 'completed' && latestRun.conclusion === 'failure') {
              ghRunStatusText = 'GitHub Actions 工作流执行失败';
            }
          }
        }
      } catch {
        // 忽略状态检查异常，以 Release 资产为准
      }
    }

    // 根据真实耗时反馈清晰、诚实的学术排版进度阶段
    if (elapsed < 15) {
      state.step = 'queued';
      state.progress = Math.min(35, 20 + elapsed * 1.0);
      state.statusText = ghRunStatusText || `正在调度 GitHub Actions 运行节点 (${elapsed}s)...`;
    } else if (elapsed < 90) {
      state.step = 'compiling';
      state.progress = Math.min(65, 35 + (elapsed - 15) * 0.4);
      state.statusText = ghRunStatusText || `正在载入 TeX Live 2024 环境与中文字体 (${elapsed}s)...`;
    } else if (elapsed < 180) {
      state.step = 'compiling';
      state.progress = Math.min(88, 65 + (elapsed - 90) * 0.25);
      state.statusText = ghRunStatusText || `XeLaTeX 正在排版公式与编译宏包 (${elapsed}s)...`;
    } else {
      state.step = 'compiling';
      state.progress = Math.min(96, 88 + (elapsed - 180) * 0.08);
      state.statusText = ghRunStatusText || `正在打包高清矢量 PDF 并发布 Release 资产 (${elapsed}s)...`;
    }
    onUpdate({ ...state });

    // 查询 GitHub Release 资产
    try {
      const releaseApi = `https://api.github.com/repos/${config.owner}/${config.repo}/releases/tags/job-${jobId}`;
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
      };
      if (config.token) {
        headers['Authorization'] = `Bearer ${config.token.trim()}`;
      }

      const res = await fetch(releaseApi, { headers, signal });

      if (res.status === 200) {
        const releaseData = await res.json();
        const assets: any[] = releaseData.assets || [];

        // 检查是否有错误日志
        const errorAsset = assets.find((a) => a.name.endsWith('.log') || a.name.includes('error'));
        if (errorAsset) {
          let errorText = '编译未成功生成 PDF。';
          try {
            const logRes = await fetch(errorAsset.browser_download_url);
            errorText = await logRes.text();
          } catch {
            // ignore
          }
          state.step = 'failed';
          state.progress = 100;
          state.statusText = 'XeLaTeX 编译发生错误，请展开诊断日志查看';
          state.errorLog = errorText;
          onUpdate({ ...state });
          throw new Error('LaTeX 源码排版错误');
        }

        // 检查是否有生成的 PDF
        const pdfAsset = assets.find((a) => a.name.endsWith('.pdf'));
        if (pdfAsset) {
          const directPdfUrl = pdfAsset.browser_download_url;
          state.step = 'ready';
          state.progress = 100;
          state.statusText = `✓ 编译成功！文档已生成 (总耗时 ${elapsed}s)`;
          state.pdfUrl = directPdfUrl;
          onUpdate({ ...state });
          return directPdfUrl;
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || signal?.aborted) {
        throw new Error('编译已取消');
      }
      if (state.step === 'failed') {
        throw err;
      }
      // 404 或网络波动继续轮询
    }
  }

  // 超过最大重试次数进入 timeout 状态 (非致命中断，支持用户继续等待或手动检查)
  state.step = 'timeout';
  state.statusText = '云端编译耗时较长（GitHub Actions 队列繁忙）。任务仍在云端继续运行，可点击「继续等待」或「检查结果」';
  onUpdate({ ...state });
  throw new Error('编译耗时较长，GitHub 节点仍在运行中');
}

/**
 * 无感调起系统级 PDF 打印面板 (通过静默 IFrame 载入并调用 print)
 */
export function printPdfDirectly(pdfUrl: string): void {
  if (typeof window === 'undefined') return;

  const frameId = 'ex-pdf-print-frame';
  let iframe = document.getElementById(frameId) as HTMLIFrameElement;

  if (iframe) {
    iframe.remove();
  }

  iframe = document.createElement('iframe');
  iframe.id = frameId;
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  iframe.src = pdfUrl;

  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        // 跨域或安全拦截回退：直接弹窗打开 PDF 供用户打印
        window.open(pdfUrl, '_blank');
      }
    }, 300);
  };
}

/**
 * 触发浏览器直接下载 PDF 文件
 */
export function downloadPdfFile(pdfUrl: string, filename: string): void {
  if (typeof window === 'undefined') return;

  const a = document.createElement('a');
  a.href = pdfUrl;
  a.download = filename;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
