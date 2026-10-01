import { describe, it, expect, vi } from 'vitest';
import handler, { GET, POST, OPTIONS } from '../../api/translate.ts';

describe('Vercel Serverless Function api/translate.ts Suite', () => {
  it('OPTIONS 请求应正确返回 204 与 CORS 跨域响应头 (Node.js)', async () => {
    let statusCode = 0;
    const headers: Record<string, string> = {};
    let ended = false;

    const req = {
      method: 'OPTIONS',
      headers: {},
    };

    const res = {
      writeHead: (status: number, h: Record<string, string>) => {
        statusCode = status;
        Object.assign(headers, h);
      },
      end: () => {
        ended = true;
      },
    };

    await handler(req, res);
    expect(statusCode).toBe(204);
    expect(headers['Access-Control-Allow-Origin']).toBe('*');
    expect(headers['Access-Control-Allow-Methods']).toContain('POST');
    expect(ended).toBe(true);
  });

  it('GET 请求应返回 200 健康探测与提供商列表 (Node.js)', async () => {
    let statusCode = 0;
    let responseBody = '';

    const req = {
      method: 'GET',
      headers: {},
    };

    const res = {
      writeHead: (status: number, _h: any) => {
        statusCode = status;
      },
      end: (data: string) => {
        responseBody = data;
      },
    };

    await handler(req, res);
    expect(statusCode).toBe(200);
    const parsed = JSON.parse(responseBody);
    expect(parsed.ok).toBe(true);
    expect(parsed.status).toBe('ready');
    expect(parsed.defaultProvider).toBe('google');
    expect(Array.isArray(parsed.providers)).toBe(true);
  });

  it('POST 请求缺少 text 时应返回 400 (Node.js)', async () => {
    let statusCode = 0;
    let responseBody = '';

    const req = {
      method: 'POST',
      body: {},
      headers: { 'content-type': 'application/json' },
    };

    const res = {
      writeHead: (status: number, _h: any) => {
        statusCode = status;
      },
      end: (data: string) => {
        responseBody = data;
      },
    };

    await handler(req, res);
    expect(statusCode).toBe(400);
    const parsed = JSON.parse(responseBody);
    expect(parsed.ok).toBe(false);
    expect(parsed.error).toContain('缺少有效');
  });

  it('Web 标准 Request GET 与 OPTIONS 应能正确执行', async () => {
    const optReq = new Request('https://astrolib.cloud/api/translate', { method: 'OPTIONS' });
    const optRes = await OPTIONS(optReq);
    expect(optRes.status).toBe(204);
    expect(optRes.headers.get('Access-Control-Allow-Origin')).toBe('*');

    const getReq = new Request('https://astrolib.cloud/api/translate', { method: 'GET' });
    const getRes = await GET(getReq);
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    expect(getData.ok).toBe(true);
    expect(getData.defaultProvider).toBe('google');
  });

  it('Web 标准 Request POST 应成功执行翻译调用', async () => {
    const postReq = new Request('https://astrolib.cloud/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Algorithms with numbers',
        provider: 'google',
        preserveStructure: true,
      }),
    });

    const postRes = await POST(postReq);
    expect(postRes.status).toBe(200);
    const data = await postRes.json();
    expect(data.ok).toBe(true);
    expect(typeof data.translatedText).toBe('string');
  });
});
