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

    }
  }
  return null;
}

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

    }
  }
  return null;
}

export function hasChromiumBrowser(): boolean {
  return getChromiumPath() !== null;
}
