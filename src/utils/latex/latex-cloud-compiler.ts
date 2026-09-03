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
  progress: number;
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

export function saveCompilerConfig(config: Partial<CloudCompileConfig>): void {
  if (typeof window === 'undefined') return;
  if (config.token !== undefined) localStorage.setItem(STORAGE_KEYS.TOKEN, config.token.trim());
  if (config.owner !== undefined) localStorage.setItem(STORAGE_KEYS.OWNER, config.owner.trim());
  if (config.repo !== undefined) localStorage.setItem(STORAGE_KEYS.REPO, config.repo.trim());
  if (config.branch !== undefined) localStorage.setItem(STORAGE_KEYS.BRANCH, config.branch.trim());
}

export function generateJobId(): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 7);
  return `job-${time}-${rand}`;
}

export function unicodeBase64Encode(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_match, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    })
  );
}

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

  }
  return null;
}

export async function pollCompileResult(
  jobId: string,
  filename: string,
  config: CloudCompileConfig,
  onUpdate: (state: CompileJobState) => void,
  signal?: AbortSignal,
  startElapsedSeconds = 0
): Promise<string> {
  const startTime = Date.now() - startElapsedSeconds * 1000;

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

    const currentInterval = elapsed < 15 ? 2500 : 3500;
    await new Promise((res) => setTimeout(res, currentInterval));

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

      }
    }

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

        const errorAsset = assets.find((a) => a.name.endsWith('.log') || a.name.includes('error'));
        if (errorAsset) {
          let errorText = '编译未成功生成 PDF。';
          try {
            const logRes = await fetch(errorAsset.browser_download_url);
            errorText = await logRes.text();
          } catch {

          }
          state.step = 'failed';
          state.progress = 100;
          state.statusText = 'XeLaTeX 编译发生错误，请展开诊断日志查看';
          state.errorLog = errorText;
          onUpdate({ ...state });
          throw new Error('LaTeX 源码排版错误');
        }

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

    }
  }

  state.step = 'timeout';
  state.statusText = '云端编译耗时较长（GitHub Actions 队列繁忙）。任务仍在云端继续运行，可点击「继续等待」或「检查结果」';
  onUpdate({ ...state });
  throw new Error('编译耗时较长，GitHub 节点仍在运行中');
}

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

        window.open(pdfUrl, '_blank');
      }
    }, 300);
  };
}

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
