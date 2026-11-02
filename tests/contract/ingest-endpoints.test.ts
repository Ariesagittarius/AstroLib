/**
 * tests/contract/ingest-endpoints.test.ts
 * ============================================================================
 * MinerU 文档摄取服务端中间件接口契约测试 (/api/ingest/*)
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import { ingestDevServerPlugin } from '../../src/server/plugins/doc-ingestion/dev-server-plugin.mjs';
import { Readable } from 'node:stream';
import fs from 'node:fs';
import path from 'node:path';
import { TaskManager } from '../../src/server/plugins/doc-ingestion/task-manager.ts';

describe('Ingest Dev Server Plugin Contract Tests', () => {
  const plugin = ingestDevServerPlugin();
  let middleware: any = null;

  plugin.configureServer({
    middlewares: {
      use: (fn: any) => {
        middleware = fn;
      },
    },
  });

  function createMockReqRes(options: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    bodyBuffer?: Buffer;
  }) {
    const stream = new Readable();
    if (options.bodyBuffer) {
      stream.push(options.bodyBuffer);
    }
    stream.push(null);

    const req = Object.assign(stream, {
      method: options.method,
      url: options.url,
      headers: options.headers || {},
    });

    let statusCode = 200;
    const resHeaders: Record<string, string> = {};
    let responseData = '';
    let isEnded = false;

    const res = {
      writeHead: (status: number, h?: Record<string, string>) => {
        statusCode = status;
        if (h) Object.assign(resHeaders, h);
      },
      end: (chunk?: string | Buffer) => {
        if (chunk) responseData += chunk.toString();
        isEnded = true;
      },
      pipe: () => {},
    };

    return { req, res, getStatus: () => statusCode, getHeaders: () => resHeaders, getBody: () => responseData, isEnded: () => isEnded };
  }

  it('1. OPTIONS 请求应正确返回 204 与跨域响应头', async () => {
    const { req, res, getStatus, getHeaders, isEnded } = createMockReqRes({
      method: 'OPTIONS',
      url: '/api/ingest/health',
    });

    await middleware(req, res, () => {});
    expect(getStatus()).toBe(204);
    expect(getHeaders()['Access-Control-Allow-Origin']).toBe('*');
    expect(isEnded()).toBe(true);
  });

  it('2. GET /api/ingest/health 应返回健康状态与双通道环境', async () => {
    const { req, res, getStatus, getBody } = createMockReqRes({
      method: 'GET',
      url: '/api/ingest/health',
    });

    await middleware(req, res, () => {});
    expect(getStatus()).toBe(200);

    const data = JSON.parse(getBody());
    expect(data.status).toBe('ok');
    expect(data.api).toBeDefined();
    expect(data.local).toBeDefined();
  });

  it('3. POST /api/ingest/upload 应正常解析 PDF 并创建任务', async () => {
    const sampleBuffer = Buffer.from('%PDF-1.4\n<</Type /Pages /Count 12>>\n%%EOF');
    const { req, res, getStatus, getBody } = createMockReqRes({
      method: 'POST',
      url: '/api/ingest/upload',
      headers: {
        'x-file-name': encodeURIComponent('contract_test.pdf'),
        'x-page-ranges': '1-5',
      },
      bodyBuffer: sampleBuffer,
    });

    await middleware(req, res, () => {});
    expect(getStatus()).toBe(200);

    const data = JSON.parse(getBody());
    expect(data.success).toBe(true);
    expect(data.task.fileName).toBe('contract_test.pdf');
    expect(data.task.pageCount).toBe(12);
    expect(data.task.pageRanges).toBe('1-5');

    const createdTaskId = data.task.taskId;

    // 测试根据 taskId 查询状态
    const statusReq = createMockReqRes({
      method: 'GET',
      url: `/api/ingest/status?taskId=${createdTaskId}`,
    });
    await middleware(statusReq.req, statusReq.res, () => {});
    expect(statusReq.getStatus()).toBe(200);
    const statusData = JSON.parse(statusReq.getBody());
    expect(statusData.task.taskId).toBe(createdTaskId);

    // 清理创建的临时测试目录
    const taskDir = path.join(TaskManager.getInstance().getBaseDir(), createdTaskId);
    fs.rmSync(taskDir, { recursive: true, force: true });
  });

  it('4. 请求非摄取前缀应透传至 next()', async () => {
    let nextCalled = false;
    const { req, res } = createMockReqRes({
      method: 'GET',
      url: '/other/path',
    });

    await middleware(req, res, () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(true);
  });
});
