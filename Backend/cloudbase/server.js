const http = require('node:http');
const cloudbase = require('@cloudbase/node-sdk');

const { CLOUDBASE_ENV_ID, CLOUDBASE_APIKEY } = process.env;
const configured = Boolean(CLOUDBASE_ENV_ID && CLOUDBASE_APIKEY);
const db = configured
  ? cloudbase.init({ env: CLOUDBASE_ENV_ID, accessKey: CLOUDBASE_APIKEY }).database()
  : null;
const origins = new Set([
  'https://clgg.github.io',
  'http://127.0.0.1:8765',
  'http://localhost:8765',
]);

function headers(req) {
  const origin = req.headers.origin;
  const result = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '600',
  };
  if (!origin) {
    result['Access-Control-Allow-Origin'] = '*';
    return result;
  }
  if (origins.has(origin)) {
    result['Access-Control-Allow-Origin'] = origin;
    result.Vary = 'Origin';
  }
  return result;
}

async function body(req) {
  let raw = '';
  for await (const chunk of req.setEncoding('utf8')) {
    raw += chunk;
    if (Buffer.byteLength(raw) > 8192) {
      const error = new Error('请求过大');
      error.status = 413;
      throw error;
    }
  }
  if (!raw) return {};
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('bad');
    return value;
  } catch (error) {
    if (error.status) throw error;
    const invalid = new Error('请求格式有误');
    invalid.status = 400;
    throw invalid;
  }
}

async function handle(req, reply) {
  const send = (status, value) => {
    if (reply.writableEnded) return;
    reply.writeHead(status, headers(req));
    reply.end(JSON.stringify(value));
  };
  try {
    if (req.method === 'OPTIONS') {
      reply.writeHead(204, headers(req));
      reply.end();
      return;
    }
    if (req.method !== 'POST') return send(405, { error: '请使用 POST' });
    const input = await body(req);
    if (input.action === 'ping') return send(200, { ok: true, project: 'gobeginner' });
    if (!configured || !db) return send(503, { error: '围棋服务尚未配置' });
    return send(400, { error: '请求参数有误' });
  } catch (error) {
    if (!error.status) console.error('Go request failed');
    return send(error.status || 503, { error: error.status ? error.message : '服务暂不可用，请稍后重试' });
  }
}

if (require.main === module) {
  http.createServer(handle).listen(9000, '0.0.0.0');
}

module.exports = { handle, db, configured };
