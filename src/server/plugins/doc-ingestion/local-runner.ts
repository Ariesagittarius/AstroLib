/**
 * src/server/plugins/doc-ingestion/local-runner.ts
 * ============================================================================
 * 本机 RTX 5060 (8G) Pipeline 模式本地推理执行器
 * ============================================================================
 * 职责：
 * 1. 探测本机的 Python 环境 (优先探测 practice/.venv 与当前工程 .venv)；
 * 2. 检查 magic-pdf / mineru CLI 与 GPU 依赖环境；
 * 3. 驱动本地 Pipeline 模式解析 (DocLayout-YOLO + UniMERNet + RapidOCR)；
 * 4. 显存守护：当本地环境未就绪时，返回友好的环境诊断与指引，支持平滑引导至【API】。
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface LocalEnvironmentStatus {
  available: boolean;
  pythonPath: string | null;
  magicPdfInstalled: boolean;
  cudaAvailable: boolean;
  gpuName?: string;
  vramTotalMb?: number;
  message?: string;
}

export class LocalPipelineRunner {
  private pythonPath: string | null = null;
  private cachedStatus: LocalEnvironmentStatus | null = null;

  constructor() {
    this.pythonPath = this.findPythonPath();
  }

  /**
   * 自动探测可用的 Python 解释器
   */
  public findPythonPath(): string | null {
    if (process.env.PYTHON_PATH && fs.existsSync(process.env.PYTHON_PATH)) {
      return process.env.PYTHON_PATH;
    }

    const candidatePaths = [
      'D:\\Antigravity\\project\\practice\\.venv\\Scripts\\python.exe',
      path.resolve(process.cwd(), '../practice/.venv/Scripts/python.exe'),
      path.resolve(process.cwd(), '.venv/Scripts/python.exe'),
      'C:\\Program Files\\PyManager\\python.exe',
      'python.exe',
      'python',
    ];

    for (const p of candidatePaths) {
      try {
        if (path.isAbsolute(p)) {
          if (fs.existsSync(p)) return p;
        } else {
          return p;
        }
      } catch {
        // continue
      }
    }

    return null;
  }

  /**
   * 检查本地 5060 与 magic-pdf 环境状态
   */
  public async checkEnvironment(forceRefresh = false): Promise<LocalEnvironmentStatus> {
    if (this.cachedStatus && !forceRefresh) {
      return this.cachedStatus;
    }

    const python = this.pythonPath || this.findPythonPath();
    if (!python) {
      this.cachedStatus = {
        available: false,
        pythonPath: null,
        magicPdfInstalled: false,
        cudaAvailable: false,
        message: '未找到 Python 虚拟环境。建议使用【API】通道进行云端高速解析。',
      };
      return this.cachedStatus;
    }

    // 检查 magic-pdf 是否存在
    let magicPdfInstalled = false;
    let cudaAvailable = true;
    let gpuName = 'NVIDIA GeForce RTX 5060 Laptop GPU';

    try {
      const probeCode = `
import sys
try:
    import magic_pdf
    has_mp = True
except Exception:
    has_mp = False

try:
    import torch
    cuda_ok = torch.cuda.is_available()
    dev_name = torch.cuda.get_device_name(0) if cuda_ok else "None"
except Exception:
    cuda_ok = False
    dev_name = "None"

import json
print(json.dumps({"has_mp": has_mp, "cuda_ok": cuda_ok, "dev_name": dev_name}))
`;
      const { stdout } = await execFileAsync(python, ['-c', probeCode]);
      const res = JSON.parse(stdout.trim());
      magicPdfInstalled = Boolean(res.has_mp);
      cudaAvailable = Boolean(res.cuda_ok);
      if (res.dev_name && res.dev_name !== 'None') {
        gpuName = res.dev_name;
      }
    } catch {
      magicPdfInstalled = false;
    }

    const available = magicPdfInstalled && cudaAvailable;
    let message = '本机 RTX 5060 Pipeline 环境已就绪。';
    if (!magicPdfInstalled) {
      message = '本机尚未安装 magic-pdf[full] 依赖。如需启用离线显卡推理，请在虚拟环境中安装依赖；当前建议直接切换为【API】通道。';
    }

    this.cachedStatus = {
      available,
      pythonPath: python,
      magicPdfInstalled,
      cudaAvailable,
      gpuName,
      vramTotalMb: 8151,
      message,
    };

    return this.cachedStatus;
  }

  /**
   * 运行本地 Pipeline 识别
   */
  public async runPipeline(
    pdfPath: string,
    outputDir: string,
    onProgress?: (msg: string) => void
  ): Promise<{ success: boolean; outputDir: string; error?: string }> {
    const status = await this.checkEnvironment();
    if (!status.magicPdfInstalled || !status.pythonPath) {
      throw new Error(
        `本地环境未就绪：${status.message}。建议在工作台顶栏切换为【API】通道。`
      );
    }

    if (onProgress) onProgress('启动本地 RTX 5060 Pipeline 推理引擎...');

    // 调用 magic-pdf 命令行工具
    try {
      const args = ['-m', 'magic_pdf.tools.cli', '-p', pdfPath, '-o', outputDir, '-m', 'pipeline'];
      await execFileAsync(status.pythonPath, args, {
        cwd: process.cwd(),
      });
      return { success: true, outputDir };
    } catch (err) {
      const errStr = err instanceof Error ? err.message : String(err);
      throw new Error(`本地 5060 Pipeline 执行失败: ${errStr}`);
    }
  }
}
