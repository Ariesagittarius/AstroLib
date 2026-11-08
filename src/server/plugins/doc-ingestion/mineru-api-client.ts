import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface MineruBatchFileRequest {
  name: string;
  data_id: string;
}

export interface MineruUploadBatchResponse {
  code: number;
  msg: string;
  data?: {
    batch_id: string;
    file_urls: string[];
  };
}

export interface MineruBatchStatusResponse {
  code: number;
  msg: string;
  data?: {
    batch_id: string;
    state: 'waiting-file' | 'pending' | 'processing' | 'done' | 'failed';
    extract_result?: Array<{
      file_name: string;
      state: 'waiting-file' | 'pending' | 'processing' | 'done' | 'failed';
      full_zip_url?: string;
      err_msg?: string;
      data_id?: string;
    }>;
  };
}

export class MineruApiClient {
  private token: string | null = null;
  private readonly baseUrl = 'https://mineru.net';

  constructor(token?: string) {
    this.token = token || this.resolveToken();
  }

  public resolveToken(): string | null {
    if (process.env.MINERU_API_TOKEN) {
      return process.env.MINERU_API_TOKEN.trim();
    }

    const homeDir = os.homedir();
    const candidateFiles = [
      path.join(homeDir, 'MinerU', 'config.json'),
      path.join(homeDir, '.mineru', 'config.json'),
      path.join(process.cwd(), '.mineru.json'),
    ];

    for (const f of candidateFiles) {
      try {
        if (fs.existsSync(f)) {
          const raw = fs.readFileSync(f, 'utf-8');
          const parsed = JSON.parse(raw);
          if (typeof parsed.config === 'string') {
            try {
              const nested = JSON.parse(parsed.config);
              if (nested?.state?.client_api_token) {
                return nested.state.client_api_token.trim();
              }
            } catch {

            }
          }
          if (parsed.client_api_token) return String(parsed.client_api_token).trim();
          if (parsed.token) return String(parsed.token).trim();
        }
      } catch {

      }
    }

    return null;
  }

  public getToken(): string | null {
    return this.token;
  }

  public setToken(token: string) {
    this.token = token.trim();
  }

  public async requestBatchUploadUrls(
    fileName: string,
    dataId: string,
    options: {
      modelVersion?: string;
      isOcr?: boolean;
      enableFormula?: boolean;
      enableTable?: boolean;
      pageRanges?: string;
    } = {}
  ): Promise<{ batchId: string; fileUrl: string }> {
    const token = this.token || this.resolveToken();
    if (!token) {
      throw new Error('未检测到有效的 MinerU API Token。请在工作台顶栏设置或配置 MINERU_API_TOKEN。');
    }

    const endpoint = `${this.baseUrl}/api/v4/file-urls/batch`;
    const payload: Record<string, unknown> = {
      files: [{ name: fileName, data_id: dataId }],
      model_version: options.modelVersion || 'vlm',
      is_ocr: options.isOcr !== false,
      enable_formula: options.enableFormula !== false,
      enable_table: options.enableTable !== false,
    };

    if (options.pageRanges && options.pageRanges.trim()) {
      payload.page_ranges = options.pageRanges.trim();
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`MinerU 申请上传接口失败 (HTTP ${res.status}): ${errText}`);
    }

    const json = (await res.json()) as MineruUploadBatchResponse;
    if (json.code !== 0 || !json.data) {
      throw new Error(`MinerU 接口错误 (code ${json.code}): ${json.msg}`);
    }

    const { batch_id, file_urls } = json.data;
    if (!file_urls || file_urls.length === 0) {
      throw new Error('MinerU 未返回有效的预签名上传链接');
    }

    return {
      batchId: batch_id,
      fileUrl: file_urls[0],
    };
  }

  public async uploadFileToPreSignedUrl(fileUrl: string, filePath: string): Promise<void> {
    const fileBuffer = fs.readFileSync(filePath);

    const res = await fetch(fileUrl, {
      method: 'PUT',
      headers: {},
      body: fileBuffer,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`文件上传至云端对象存储失败 (HTTP ${res.status}): ${errText}`);
    }
  }

  public async pollBatchStatus(
    batchId: string,
    options: {
      intervalMs?: number;
      maxRetries?: number;
      onProgress?: (state: string, raw?: MineruBatchStatusResponse) => void;
    } = {}
  ): Promise<{ fullZipUrl: string; state: string }> {
    const token = this.token || this.resolveToken();
    if (!token) {
      throw new Error('MinerU Token 缺失');
    }

    const endpoint = `${this.baseUrl}/api/v4/extract-results/batch/${batchId}`;
    const intervalMs = options.intervalMs || 3000;
    const maxRetries = options.maxRetries || 120;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`查询批次状态失败 (HTTP ${res.status})`);
      }

      const json = (await res.json()) as MineruBatchStatusResponse;
      if (json.code !== 0) {
        throw new Error(`MinerU 查询错误: ${json.msg}`);
      }

      const state = json.data?.state || 'pending';
      const extractResult = json.data?.extract_result?.[0];
      const itemState = extractResult?.state || state;

      if (options.onProgress) {
        options.onProgress(itemState, json);
      }

      if (itemState === 'done') {
        const fullZipUrl = extractResult?.full_zip_url;
        if (!fullZipUrl) {
          throw new Error('任务解析完成，但返回数据中未包含 full_zip_url 下载链接');
        }
        return { fullZipUrl, state: 'done' };
      }

      if (itemState === 'failed') {
        throw new Error(`解析任务失败: ${extractResult?.err_msg || '未知错误'}`);
      }

      await new Promise((r) => setTimeout(r, intervalMs));
    }

    throw new Error('解析任务轮询超时（超过最大等待时间）');
  }

  public async downloadAndExtractZip(zipUrl: string, targetDir: string): Promise<string> {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const zipTempPath = path.join(targetDir, 'result_archive.zip');

    const res = await fetch(zipUrl);
    if (!res.ok) {
      throw new Error(`下载结果 ZIP 失败 (HTTP ${res.status})`);
    }

    const arrayBuffer = await res.arrayBuffer();
    fs.writeFileSync(zipTempPath, Buffer.from(arrayBuffer));

    try {
      await execFileAsync('tar', ['-xf', zipTempPath, '-C', targetDir]);
    } catch (tarErr) {

      try {
        const psCommand = `Expand-Archive -LiteralPath '${zipTempPath}' -DestinationPath '${targetDir}' -Force`;
        await execFileAsync('powershell', ['-NoProfile', '-Command', psCommand]);
      } catch (psErr) {
        throw new Error(`解压结果 ZIP 失败: ${tarErr instanceof Error ? tarErr.message : String(tarErr)}`);
      }
    }

    return targetDir;
  }

  public async parseWithAgentApi(
    filePath: string,
    options: {
      pageRange?: string;
      intervalMs?: number;
      maxRetries?: number;
      onProgress?: (state: string) => void;
    } = {}
  ): Promise<{ markdown: string }> {
    const stats = fs.statSync(filePath);
    if (stats.size > 10 * 1024 * 1024) {
      throw new Error('Agent 轻量解析仅支持 <= 10MB 的文件。当前文件超出限制，请切换为【高精 API】');
    }

    const fileName = path.basename(filePath);
    if (options.onProgress) {
      options.onProgress('正在获取 Agent 免密上传签名...');
    }

    const initEndpoint = `${this.baseUrl}/api/v1/agent/parse/file`;
    const initPayload: Record<string, any> = {
      file_name: fileName,
      language: 'ch',
      enable_table: true,
      is_ocr: false,
      enable_formula: true,
    };
    if (options.pageRange) {
      initPayload.page_range = options.pageRange;
    }

    const initRes = await fetch(initEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(initPayload),
    });

    if (!initRes.ok) {
      const errText = await initRes.text();
      throw new Error(`Agent 接口申请失败 (HTTP ${initRes.status}): ${errText}`);
    }

    const initJson = (await initRes.json()) as any;
    if (initJson.code !== 0) {
      throw new Error(`Agent 接口错误: ${initJson.msg || '未知错误'}`);
    }

    const taskId = initJson.data?.task_id;
    const fileUrl = initJson.data?.file_url;
    if (!taskId || !fileUrl) {
      throw new Error('Agent 接口未返回有效的 task_id 或 file_url');
    }

    if (options.onProgress) {
      options.onProgress('正在上传文档至 Agent 极速解析集群...');
    }

    const fileBuffer = fs.readFileSync(filePath);
    const uploadRes = await fetch(fileUrl, {
      method: 'PUT',
      headers: {},
      body: fileBuffer,
    });

    if (!uploadRes.ok) {
      throw new Error(`Agent 文件上传 OSS 失败 (HTTP ${uploadRes.status})`);
    }

    if (options.onProgress) {
      options.onProgress('文档已入列，正在执行 Agent 轻量解析 (排队与转换中)...');
    }

    const statusUrl = `${this.baseUrl}/api/v1/agent/parse/${taskId}`;
    const intervalMs = options.intervalMs || 2500;
    const maxRetries = options.maxRetries || 60;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const statusRes = await fetch(statusUrl);
      if (statusRes.ok) {
        const statusJson = (await statusRes.json()) as any;
        const data = statusJson.data || {};
        const state = (data.state || '').toLowerCase();

        if (options.onProgress) {
          options.onProgress(`Agent 状态: ${state || 'running'}`);
        }

        if (state === 'done') {
          const markdownUrl = data.markdown_url;
          if (!markdownUrl) {
            throw new Error('Agent 任务完成但未返回 markdown_url');
          }
          const mdRes = await fetch(markdownUrl);
          if (!mdRes.ok) {
            throw new Error(`获取 Agent Markdown 失败 (HTTP ${mdRes.status})`);
          }
          const markdown = await mdRes.text();
          return { markdown };
        } else if (state === 'failed') {
          throw new Error(`Agent 解析失败: ${data.err_msg || '未知错误'}`);
        }
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }

    throw new Error('Agent 轻量解析超时 (超过最大轮询等待时间)');
  }
}
