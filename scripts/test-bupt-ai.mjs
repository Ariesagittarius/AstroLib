import https from 'node:https';
import dns from 'node:dns';

const BUPT_GATEWAY_HOST = 'myai.bupt.edu.cn';
const BUPT_CAMPUS_IP = '10.3.19.2';
const BUPT_BASE_URL = `https://${BUPT_GATEWAY_HOST}/llm-gw/v1`;

function customLookup(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (hostname === BUPT_GATEWAY_HOST) {
    if (options && options.all) {
      return callback(null, [{ address: BUPT_CAMPUS_IP, family: 4 }]);
    }
    return callback(null, BUPT_CAMPUS_IP, 4);
  }
  return dns.lookup(hostname, options, callback);
}

const directAgent = new https.Agent({ lookup: customLookup, keepAlive: true });

import fs from 'node:fs';

function parseArgs() {
  const args = process.argv.slice(2);
  let key = process.env.BUPT_API_KEY || '';
  if (!key && fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf-8');
    const match = envContent.match(/^BUPT_API_KEY\s*=\s*(.+)$/m);
    if (match) key = match[1].trim();
  }
  let model = 'deepseek-v4-flash';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--key' && args[i + 1]) {
      key = args[i + 1];
      i++;
    } else if (args[i] === '--model' && args[i + 1]) {
      model = args[i + 1];
      i++;
    }
  }
  return { key, model };
}

async function makeRequest(path, { method = 'GET', headers = {}, body = null, stream = false } = {}) {
  const url = `${BUPT_BASE_URL}${path}`;
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const req = https.request(url, {
      agent: directAgent,
      method,
      headers: {
        'Host': BUPT_GATEWAY_HOST,
        'Content-Type': 'application/json',
        ...headers,
      },
    }, (res) => {
      const status = res.statusCode;
      const resHeaders = res.headers;

      if (stream) {
        resolve({ status, headers: resHeaders, stream: res, startTime });
        return;
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - startTime;
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {}
        resolve({ status, headers: resHeaders, data, json, duration });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('='.repeat(70));
  console.log('北京邮电大学「人人有算力」AI 网关真实环境连通性与功能测试');
  console.log('='.repeat(70));

  const { key, model } = parseArgs();
  console.log(`[配置] 目标 Base URL : ${BUPT_BASE_URL}`);
  console.log(`[配置] 校内直连 IP  : ${BUPT_CAMPUS_IP} (SNI: ${BUPT_GATEWAY_HOST})`);
  console.log(`[配置] 测试模型 ID  : ${model}`);
  console.log(`[配置] API Key 状态  : ${key ? `已配置 (前缀: ${key.slice(0, 7)}...)` : '未提供 (进入网络连通性与鉴权格式探针模式)'}`);
  console.log('-'.repeat(70));

  console.log('▶ [Step 1/4] 正在探测网关网络连通性与 CORS 预检...');
  try {
    const optRes = await new Promise((resolve, reject) => {
      const req = https.request(`${BUPT_BASE_URL}/chat/completions`, {
        agent: directAgent,
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:4321',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'authorization,content-type',
        },
      }, (res) => {
        resolve({
          status: res.statusCode,
          allowOrigin: res.headers['access-control-allow-origin'],
          allowMethods: res.headers['access-control-allow-methods'],
        });
      });
      req.on('error', reject);
      req.end();
    });
    console.log(`  ✓ 网关响应状态码: ${optRes.status}`);
    console.log(`  ✓ 跨域头 Access-Control-Allow-Origin: ${optRes.allowOrigin || '无'}`);
    console.log(`  ✓ 允许方法: ${optRes.allowMethods || '无'}`);
  } catch (err) {
    console.error(`  ✗ 网关探测失败: ${err.message}`);
    return;
  }

  console.log('\n▶ [Step 2/4] 正在探测鉴权机制与 LiteLLM 虚拟密钥识别...');
  try {
    const probeRes = await makeRequest('/models', {
      headers: { Authorization: key ? `Bearer ${key}` : 'Bearer test' },
    });
    if (probeRes.status === 401) {
      if (probeRes.json?.error?.message?.includes('LiteLLM Virtual Key expected')) {
        console.log('  ✓ 成功触发网关底层 LiteLLM 鉴权响应:');
        console.log(`    "${probeRes.json.error.message}"`);
        console.log('  ✓ 结论：网关连通完全正常，且确为 LiteLLM Virtual Key 驱动！');
      } else {
        console.log(`  ✓ 收到 401 响应: ${probeRes.data}`);
      }
    } else if (probeRes.status === 200) {
      console.log('  ✓ 鉴权成功！获取到可用模型列表:');
      const models = probeRes.json?.data || [];
      console.log(`    共 ${models.length} 个模型可用:`);
      for (const m of models.slice(0, 10)) {
        console.log(`    - ${m.id} (owned_by: ${m.owned_by || 'bupt'})`);
      }
      if (models.length > 10) console.log(`    ... 还有 ${models.length - 10} 个模型`);
    } else {
      console.log(`  ! 收到状态码 ${probeRes.status}: ${probeRes.data}`);
    }
  } catch (err) {
    console.error(`  ✗ 探测请求失败: ${err.message}`);
    return;
  }

  if (!key) {
    console.log('\n' + '='.repeat(70));
    console.log('💡 提示：当前未传入真实 API Key，网络连通性测试已全部通过！');
    console.log('若要测试真实对话与流式推理，请运行：');
    console.log('  node scripts/test-bupt-ai.mjs --key <YOUR_BUPT_API_KEY>');
    console.log('='.repeat(70));
    return;
  }

  console.log(`\n▶ [Step 3/4] 正在发起真实单轮对话补全 (模型: ${model})...`);
  try {
    const chatRes = await makeRequest('/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: {
        model,
        messages: [
          { role: 'user', content: '请用两句话简要介绍北京邮电大学的学科特色。' }
        ],
        stream: false,
      },
    });

    if (chatRes.status === 200) {
      console.log(`  ✓ 调用成功！耗时: ${chatRes.duration}ms`);
      const reply = chatRes.json?.choices?.[0]?.message?.content;
      console.log(`  ✓ 模型回复:\n${reply}\n`);
      if (chatRes.json?.usage) {
        console.log(`  ✓ Token 消耗: Prompt: ${chatRes.json.usage.prompt_tokens}, Completion: ${chatRes.json.usage.completion_tokens}, Total: ${chatRes.json.usage.total_tokens}`);
      }
    } else {
      console.error(`  ✗ 补全失败 (HTTP ${chatRes.status}): ${chatRes.data}`);
    }
  } catch (err) {
    console.error(`  ✗ 请求异常: ${err.message}`);
  }

  console.log(`\n▶ [Step 4/4] 正在测试 SSE 流式输出与首字延迟 (TTFT)...`);
  try {
    const { status, stream, startTime } = await makeRequest('/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: {
        model,
        messages: [
          { role: 'user', content: '请推导特征多项式与特征值的定义。' }
        ],
        stream: true,
      },
      stream: true,
    });

    if (status !== 200) {
      let errText = '';
      stream.on('data', c => errText += c);
      await new Promise(r => stream.on('end', r));
      console.error(`  ✗ 流式连接失败 (HTTP ${status}): ${errText}`);
      return;
    }

    let ttft = 0;
    let chunkCount = 0;
    let totalChars = 0;
    process.stdout.write('  [流式输出] ');

    await new Promise((resolve, reject) => {
      stream.on('data', (chunk) => {
        if (!ttft) {
          ttft = Date.now() - startTime;
        }
        chunkCount++;
        const text = chunk.toString('utf-8');
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && !line.includes('[DONE]')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              const delta = parsed.choices?.[0]?.delta?.content || '';
              if (delta) {
                totalChars += delta.length;
                process.stdout.write(delta);
              }
            } catch {}
          }
        }
      });
      stream.on('end', () => {
        console.log('\n');
        const totalDuration = Date.now() - startTime;
        console.log(`  ✓ 首字延迟 (TTFT): ${ttft}ms`);
        console.log(`  ✓ 总耗时: ${totalDuration}ms, 收到分片: ${chunkCount}, 生成字符: ${totalChars}`);
        resolve();
      });
      stream.on('error', reject);
    });
  } catch (err) {
    console.error(`  ✗ 流式请求异常: ${err.message}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('测试执行完毕。');
  console.log('='.repeat(70));
}

runTests().catch(console.error);
