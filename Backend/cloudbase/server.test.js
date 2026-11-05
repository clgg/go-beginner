const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { handle } = require('./server');

const page = 'https://clgg.github.io';

function listen() {
  const server = http.createServer(handle);
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

function call(server, { method = 'POST', origin, body, raw } = {}) {
  const { port } = server.address();
  const payload = raw ?? (body == null ? '' : JSON.stringify(body));
  return fetch(`http://127.0.0.1:${port}/gobeginner/dev/v1`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(origin ? { Origin: origin } : {}),
    },
    body: method === 'GET' || method === 'OPTIONS' ? undefined : payload,
  }).then(async (response) => ({
    status: response.status,
    allow: response.headers.get('access-control-allow-origin'),
    json: await response.json().catch(() => null),
  }));
}

describe('gobeginner api', () => {
  let server;
  before(async () => { server = await listen(); });
  after(() => new Promise((resolve) => server.close(resolve)));

  it('answers ping without a session', async () => {
    const result = await call(server, { origin: page, body: { action: 'ping' } });
    assert.equal(result.status, 200);
    assert.deepEqual(result.json, { ok: true, project: 'gobeginner' });
    assert.equal(result.allow, page);
  });

  it('rejects a browser origin outside the lesson site', async () => {
    const result = await call(server, { origin: 'https://example.com', body: { action: 'ping' } });
    assert.equal(result.status, 200);
    assert.equal(result.allow, null);
  });

  it('allows the preflight from the lesson site', async () => {
    const result = await call(server, { method: 'OPTIONS', origin: page });
    assert.equal(result.status, 204);
    assert.equal(result.allow, page);
  });

  it('rejects the wrong method, bad JSON, and an unknown action', async () => {
    assert.equal((await call(server, { method: 'GET' })).status, 405);
    assert.equal((await call(server, { raw: '{' })).status, 400);
    const unknown = await call(server, { body: { action: 'rank' } });
    assert.equal(unknown.status, process.env.CLOUDBASE_ENV_ID && process.env.CLOUDBASE_APIKEY ? 400 : 503);
  });

  it('rejects an oversized body', async () => {
    const result = await call(server, { raw: `{"action":"ping","pad":"${'a'.repeat(9000)}"}` });
    assert.equal(result.status, 413);
  });
});
