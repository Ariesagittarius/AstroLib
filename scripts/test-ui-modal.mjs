import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9222;
const TARGET_URL = 'http://localhost:4321/collections/math/engineering_analysis/22_%E6%B1%82%E5%AF%BC%E7%9A%84%E5%9F%BA%E6%9C%AC%E6%B3%95%E5%88%99/';

console.log('🚀 启动 Headless Edge 浏览器进行真实 UI / Stacking Context 验证...');

const proc = spawn(EDGE_PATH, [
  `--remote-debugging-port=${PORT}`,
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank',
], { stdio: 'ignore' });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTest() {
  try {

    let versionData = null;
    for (let i = 0; i < 20; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
        if (res.ok) {
          versionData = await res.json();
          break;
        }
      } catch {}
      await sleep(300);
    }

    if (!versionData) {
      throw new Error('无法连接至 Headless Edge 调试端口');
    }

    console.log(`✅ 已成功连接至 Edge 浏览器: ${versionData['User-Agent']}`);

    const newPageRes = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(TARGET_URL)}`, { method: 'PUT' });
    const target = await newPageRes.json();
    const wsUrl = target.webSocketDebuggerUrl;

    const ws = new WebSocket(wsUrl);
    let idCounter = 1;
    const pendingPromises = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = (msg.params.args || []).map(a => a.value || a.description || '').join(' ');
        console.log(`[Browser Console]`, text);
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        console.error(`[Browser Exception]`, msg.params.exceptionDetails);
      }
      if (msg.id && pendingPromises.has(msg.id)) {
        const { resolve, reject } = pendingPromises.get(msg.id);
        pendingPromises.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };

    await new Promise((resolve) => { ws.onopen = resolve; });

    function send(method, params = {}) {
      const id = idCounter++;
      return new Promise((resolve, reject) => {
        pendingPromises.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('DOM.enable');

    console.log('⏳ 正在加载页面并等待客户端水合 (Hydration)...');
    await sleep(3500);

    const portalCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.getElementById('chapter-export-modal');
        const trigger = document.querySelector('[data-chapter-export-trigger]');
        return {
          modalExists: !!modal,
          parentIsBody: modal ? modal.parentElement === document.body : false,
          triggerExists: !!trigger,
          zIndex: modal ? window.getComputedStyle(modal).zIndex : null,
          position: modal ? window.getComputedStyle(modal).position : null,
        };
      })()`,
      returnByValue: true,
    });

    console.log('--- [UI 检查 1] DOM Portal 与层级 ---');
    console.log('Portal 挂载检查结果:', portalCheck.result.value);

    console.log('\n--- [UI 检查 2] 模拟点击触发导出弹窗 ---');
    const openResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const trigger = document.querySelector('[data-chapter-export-trigger]');
        if (trigger) trigger.click();
        const modal = document.getElementById('chapter-export-modal');
        return {
          opened: modal ? modal.classList.contains('open') : false,
          modalDisplay: modal ? window.getComputedStyle(modal).display : null,
          ariaHidden: modal ? modal.getAttribute('aria-hidden') : null,
        };
      })()`,
      returnByValue: true,
    });
    console.log('打开状态:', openResult.result.value);
    await sleep(500);

    console.log('\n--- [UI 检查 3] Stacking Context 与大纲栏防穿透 ---');
    const penetrationCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.getElementById('chapter-export-modal');
        // 获取弹窗中心点
        const rect = modal.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const topElAtCenter = document.elementFromPoint(centerX, centerY);
        const modalContainsCenter = modal.contains(topElAtCenter);

        // 获取右侧区域坐标点 (查看在遮罩层开启时，右侧最上层元素是否为 modal 或其内部元素)
        const rightX = window.innerWidth - 80;
        const rightY = 200;
        const topElAtRight = document.elementFromPoint(rightX, rightY);
        const modalCoversRight = modal.contains(topElAtRight);

        return {
          topElAtCenterTag: topElAtCenter ? topElAtCenter.tagName : null,
          topElAtCenterClass: topElAtCenter ? topElAtCenter.className : null,
          modalContainsCenter,
          topElAtRightTag: topElAtRight ? topElAtRight.tagName : null,
          topElAtRightClass: topElAtRight ? topElAtRight.className : null,
          modalCoversRight,
        };
      })()`,
      returnByValue: true,
    });
    console.log('穿透检测结果:', penetrationCheck.result.value);

    console.log('\n--- [UI 检查 4] Escape 按键关闭交互 ---');
    const escapeResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.getElementById('chapter-export-modal');
        const evt = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
        document.dispatchEvent(evt);
        return {
          closed: modal ? !modal.classList.contains('open') : false,
          ariaHidden: modal ? modal.getAttribute('aria-hidden') : null,
        };
      })()`,
      returnByValue: true,
    });
    console.log('Escape 关闭结果:', escapeResult.result.value);

    console.log('\n--- [UI 检查 5] Alt+X 快捷键呼出 ---');
    const altXResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.getElementById('chapter-export-modal');
        const evt = new KeyboardEvent('keydown', { key: 'x', altKey: true, bubbles: true, cancelable: true });
        document.dispatchEvent(evt);
        return {
          reopened: modal ? modal.classList.contains('open') : false,
        };
      })()`,
      returnByValue: true,
    });
    console.log('Alt+X 呼出结果:', altXResult.result.value);

    const desktopScreenshot = await send('Page.captureScreenshot', { format: 'png' });
    const desktopImgBuffer = Buffer.from(desktopScreenshot.data, 'base64');
    const artifactDir = 'C:\\Users\\白羊欣存\\.gemini\\antigravity\\brain\\8f575f5c-18cc-41a4-b74f-ee32f88d123f';
    const desktopScreenshotPath = path.join(artifactDir, 'chapter_export_modal_desktop.png');
    fs.writeFileSync(desktopScreenshotPath, desktopImgBuffer);
    console.log(`\n📸 桌面端真实浏览器渲染截图已保存至: ${desktopScreenshotPath}`);

    console.log('\n--- [UI 检查 6] 移动端视口 (375x667) 适配性 ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await sleep(500);

    const mobileCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.getElementById('chapter-export-modal');
        const card = modal.querySelector('.chapter-export-dialog');
        const rect = card.getBoundingClientRect();
        return {
          dialogWidth: Math.round(rect.width),
          dialogHeight: Math.round(rect.height),
          fitsViewportWidth: rect.width <= 375,
          hasOverflowX: document.documentElement.scrollWidth > 375,
        };
      })()`,
      returnByValue: true,
    });
    console.log('移动端视口适配检查:', mobileCheck.result.value);

    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    const imgBuffer = Buffer.from(screenshot.data, 'base64');
    const screenshotPath = path.join(artifactDir, 'chapter_export_modal_mobile.png');
    fs.writeFileSync(screenshotPath, imgBuffer);
    console.log(`\n📸 移动端真实浏览器渲染截图已保存至: ${screenshotPath}`);

    ws.close();
  } catch (err) {
    console.error('测试异常:', err);
    process.exitCode = 1;
  } finally {
    proc.kill();
  }
}

runTest();
