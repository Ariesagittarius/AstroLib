/**
 * Reader Feedback & Errata System · Issue Formatter & Dispatch Engine
 *
 * Implements strict, academic, developer-centric English formatting for
 * GitHub Issues and handles dual-mode submission (Bot Proxy & Prefilled URL).
 */

export interface ErrataPayload {
  bookTitle: string;
  bookSlug: string;
  chapterTitle: string;
  filePath: string;
  line: number;
  blockKind: string;
  targetExcerpt: string;
  isFormula?: boolean;
  category: string;
  categoryLabel: string;
  customCategory?: string;
  description: string;
  correction?: string;
  reporter?: string;
  url: string;
  timestamp: string;
  userAgent?: string;
}

export interface FeedbackConfig {
  githubRepo: string;
  issueLabels: string[];
  shortcutKey: string;
  botEndpoint?: string;
}

export interface CategoryOption {
  id: string;
  label: string;
  desc: string;
}

export const FEEDBACK_CATEGORIES: CategoryOption[] = [
  { id: 'formula', label: 'Formula / LaTeX Typo', desc: 'Symbol errors, calculation errors, or LaTeX syntax typos' },
  { id: 'typo', label: 'Text Typo / OCR Artifact', desc: 'Spelling, punctuation, missing characters, or OCR noise' },
  { id: 'logic', label: 'Condition / Solution Logic', desc: 'Missing problem constraints, contradictory steps, or incorrect answers' },
  { id: 'reference', label: 'Broken Asset / Cross-Reference', desc: 'Broken figures, missing charts, or mismatched cross-reference anchors' },
  { id: 'suggestion', label: 'Clarity / Clarification', desc: 'Ambiguous wording or proposed alternative explanation' },
  { id: 'custom', label: 'Custom / Other', desc: 'Other issues not listed above' },
];

/**
 * Generates concise, structured English title for GitHub Issues.
 * Format: [Errata] <Book Title> · <Chapter Title>: <Category> (<shortFile>:<line>)
 */
export function formatIssueTitle(data: ErrataPayload): string {
  const shortFile = (data.filePath || 'unknown.mdx').split('/').pop() || 'unknown.mdx';
  const cat = data.customCategory?.trim() || data.categoryLabel || 'General Errata';
  const book = data.bookTitle?.trim() || 'AstroLib';
  const chapter = data.chapterTitle?.trim() || shortFile;
  const lineStr = data.line > 0 ? `:${data.line}` : '';
  return `[Errata] ${book} · ${chapter}: ${cat} (${shortFile}${lineStr})`;
}

/**
 * Formats full English issue markdown body for triage.
 */
export function formatIssueBody(data: ErrataPayload): string {
  const codeLang = data.isFormula ? 'latex' : 'markdown';
  const categoryName = data.customCategory?.trim()
    ? `Custom: ${data.customCategory.trim()}`
    : data.categoryLabel;

  const lines: string[] = [
    '### Errata Context',
    '',
    '| Context Attribute | Value |',
    '| :--- | :--- |',
    `| **Book Title** | ${data.bookTitle || 'N/A'} |`,
    `| **Chapter** | ${data.chapterTitle || 'N/A'} |`,
    `| **File Location** | \`${data.filePath || 'N/A'}\` |`,
    `| **Line Number** | \`L${data.line > 0 ? data.line : 'N/A'}\` |`,
    `| **Block Type** | \`${data.blockKind || 'paragraph'}\` |`,
    `| **Source URL** | [${data.url}](${data.url}) |`,
    `| **Reported At** | ${data.timestamp} |`,
  ];

  if (data.reporter?.trim()) {
    lines.push(`| **Reporter** | ${data.reporter.trim()} |`);
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('### Category');
  lines.push(`- **${categoryName}**`);
  lines.push('');

  lines.push('### Target Excerpt');
  lines.push('```' + codeLang);
  lines.push(data.targetExcerpt?.trim() || '(No excerpt captured)');
  lines.push('```');
  lines.push('');

  lines.push('### Problem Description');
  lines.push(data.description?.trim() ? data.description.trim() : '*(No description provided)*');
  lines.push('');

  if (data.correction?.trim()) {
    lines.push('### Proposed Correction');
    lines.push('```' + codeLang);
    lines.push(data.correction.trim());
    lines.push('```');
    lines.push('');
  }

  lines.push('---');
  lines.push('*Automated submission via AstroLib Reader Errata Tool (Feedback Mode)*');

  return lines.join('\n');
}

/**
 * Builds prefilled GitHub Issue creation URL.
 */
export function buildGithubIssueUrl(data: ErrataPayload, config: FeedbackConfig): string {
  const repo = config.githubRepo || 'Ariesagittarius/AstroLib';
  const title = formatIssueTitle(data);
  const body = formatIssueBody(data);
  const labels = Array.from(new Set([...(config.issueLabels || ['errata']), `kind:${data.category}`]));

  const base = `https://github.com/${repo}/issues/new`;
  const params = new URLSearchParams({
    title,
    body,
    labels: labels.join(','),
  });

  return `${base}?${params.toString()}`;
}

/**
 * Submits payload to the Serverless Bot Proxy API.
 */
export async function submitToBotProxy(
  data: ErrataPayload,
  endpoint: string,
  config: FeedbackConfig
): Promise<{ ok: boolean; issueUrl?: string; issueNumber?: number; message?: string }> {
  if (!endpoint) {
    return { ok: false, message: 'Serverless Bot endpoint is not configured in features.config.mjs.' };
  }

  const title = formatIssueTitle(data);
  const body = formatIssueBody(data);
  const labels = Array.from(new Set([...(config.issueLabels || ['errata']), `kind:${data.category}`]));

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        repo: config.githubRepo,
        title,
        body,
        labels,
        payload: data,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      return {
        ok: false,
        message: errJson?.message || `Serverless Proxy responded with HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const resJson = await res.json();
    return {
      ok: true,
      issueUrl: resJson.issueUrl || resJson.html_url,
      issueNumber: resJson.issueNumber || resJson.number,
      message: resJson.message || 'Issue successfully created on GitHub.',
    };
  } catch (err) {
    return {
      ok: false,
      message: 'Network error communicating with Bot Proxy: ' + String(err),
    };
  }
}
