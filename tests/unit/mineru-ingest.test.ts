import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { MineruApiClient } from '../../src/server/plugins/doc-ingestion/mineru-api-client.ts';
import { LocalPipelineRunner } from '../../src/server/plugins/doc-ingestion/local-runner.ts';
import { TaskManager } from '../../src/server/plugins/doc-ingestion/task-manager.ts';

describe('MinerU Ingestion Engine Unit Tests', () => {
  const taskManager = TaskManager.getInstance();

  it('1. should resolve MinerU API token from local environment or config', () => {
    const client = new MineruApiClient();
    const token = client.getToken();
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token!.length).toBeGreaterThan(10);
  });

  it('2. should correctly count PDF pages via raw buffer matching', () => {
    const dummyPdf = Buffer.from(
      '%PDF-1.4\n1 0 obj\n<</Type /Pages /Count 42 /Kids [2 0 R]>>\nendobj\n%%EOF'
    );
    const pages = taskManager.countPdfPages(dummyPdf);
    expect(pages).toBe(42);
  });

  it('3. should diagnose local RTX 5060 Python environment', async () => {
    const runner = new LocalPipelineRunner();
    const status = await runner.checkEnvironment();
    expect(status).toBeDefined();
    expect(status.pythonPath).toBeDefined();
    expect(status.gpuName).toContain('5060');
    expect(status.vramTotalMb).toBe(8151);
  });

  it('4. should create task and persist meta.json in task/ingest', async () => {
    const dummyBuffer = Buffer.from('%PDF-1.4\n<</Type /Pages /Count 5>>\n%%EOF');
    const meta = await taskManager.createTask('test_paper.pdf', dummyBuffer, {
      engine: 'api',
      pageRanges: '1-3',
    });

    expect(meta.taskId).toMatch(/^task_\d+_/);
    expect(meta.fileName).toBe('test_paper.pdf');
    expect(meta.pageCount).toBe(5);
    expect(meta.pageRanges).toBe('1-3');
    expect(meta.status).toBe('idle');

    const taskDir = path.join(taskManager.getBaseDir(), meta.taskId);
    expect(fs.existsSync(taskDir)).toBe(true);
    expect(fs.existsSync(path.join(taskDir, 'origin.pdf'))).toBe(true);
    expect(fs.existsSync(path.join(taskDir, 'meta.json'))).toBe(true);

    fs.rmSync(taskDir, { recursive: true, force: true });
  });

  it('5. should escape MDX characters without corrupting math formulas', () => {
    const rawContent = `
# 标题测试

这里是非公式文本中的裸大括号 {foo: "bar"} 和波浪线 10~20。

行内公式：$f(x) = {x^2 + 1}$ 应该保持完整。

块级公式：
$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$
`;

    const safeMdx = taskManager.escapeMdxContent(rawContent);

    expect(safeMdx).toContain('&#123;foo: "bar"&#125;');
    expect(safeMdx).toContain('10～20');

    expect(safeMdx).toContain('$f(x) = {x^2 + 1}$');
    expect(safeMdx).toContain('e^{-x^2}');
  });

  it('6. should compile MinerU content_list_v2 into high-fidelity AST LayoutBlocks', () => {
    const testTaskDir = path.join(process.cwd(), 'task/ingest/task_1793621396668_7357z3/unpacked');
    if (fs.existsSync(testTaskDir)) {
      const result = taskManager.getResult('task_1793621396668_7357z3');
      expect(result).toBeDefined();
      expect(result!.layoutBlocks.length).toBeGreaterThan(100);

      const titleBlock = result!.layoutBlocks.find((b) => b.type === 'title');
      expect(titleBlock).toBeDefined();
      expect(titleBlock!.html).toContain('<h1 class="doc-heading');

      const imageBlock = result!.layoutBlocks.find((b) => b.type === 'image');
      expect(imageBlock).toBeDefined();
      expect(imageBlock!.html).toContain('<figure class="doc-figure">');
      expect(imageBlock!.html).toContain('/api/ingest/image?taskId=task_1793621396668_7357z3&name=');
      expect(imageBlock!.html).toContain('<figcaption class="doc-figcaption">');

      const eqBlock = result!.layoutBlocks.find((b) => b.type === 'equation');
      expect(eqBlock).toBeDefined();
      expect(eqBlock!.html).toContain('katex');

      expect(titleBlock!.pageWidth).toBe(1000);
      expect(titleBlock!.pageHeight).toBe(1000);
      expect(titleBlock!.bbox[0]).toBeGreaterThanOrEqual(0);
      expect(titleBlock!.bbox[2]).toBeLessThanOrEqual(1000);
    }
  });

  it('7. should accurately count PDF pages when outline dictionary contains small /Count first', () => {

    const complexPdf = Buffer.from(
      '%PDF-1.5\n' +
      '1 0 obj\n<</Type /Outlines /Count 2 /First 2 0 R /Last 3 0 R>>\nendobj\n' +
      '4 0 obj\n<</Type /Pages /Count 34 /Kids [5 0 R]>>\nendobj\n' +
      '%%EOF'
    );
    const count = taskManager.countPdfPages(complexPdf);
    expect(count).toBe(34);
  });
});
