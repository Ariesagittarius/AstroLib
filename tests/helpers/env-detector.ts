import { execSync } from 'node:child_process';
import fs from 'node:fs';

export function getXelatexCmd(): string | null {
  const candidates = [
    'xelatex',
    'D:\\texlive\\2026\\bin\\windows\\xelatex.exe',
    'C:\\texlive\\2026\\bin\\windows\\xelatex.exe',
    'C:\\texlive\\2025\\bin\\windows\\xelatex.exe',
    'C:\\texlive\\2024\\bin\\windows\\xelatex.exe',
  ];

  for (const cand of candidates) {
    try {
      execSync(`"${cand}" --version`, { stdio: 'ignore' });
      return cand;
    } catch {
      // 尝试下一个候选路径
    }
  }
  return null;
}

/**
 * 探测宿主环境是否存在可用的 xelatex 编译器
 */
export function hasXelatex(): boolean {
  return getXelatexCmd() !== null;
}

export function getChromiumPath(): string | null {
  const candidates = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'google-chrome',
    'chromium',
    'msedge',
  ];

  for (const cand of candidates) {
    if (cand.includes('\\') && fs.existsSync(cand)) {
      return cand;
    }
    try {
      execSync(`"${cand}" --version`, { stdio: 'ignore' });
      return cand;
    } catch {
      // 继续探测
    }
  }
  return null;
}

/**
 * 探测宿主环境是否存在 Edge / Chrome 浏览器 (供无头 UI 测试使用)
 */
export function hasChromiumBrowser(): boolean {
  return getChromiumPath() !== null;
}

