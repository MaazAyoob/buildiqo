const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { app, allowedOrigins } = require('../index');

let server = null;
let baseUrl = '';

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
});

test('A. OPTIONS /api/auth/login from https://buildiqo-frontend.onrender.com returns 2xx', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://buildiqo-frontend.onrender.com',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type, Authorization'
    }
  });

  assert.ok(res.status >= 200 && res.status < 300, `Expected 2xx status, received ${res.status}`);
});

test('B. Response contains Access-Control-Allow-Origin: https://buildiqo-frontend.onrender.com', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://buildiqo-frontend.onrender.com',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type, Authorization'
    }
  });

  const allowOrigin = res.headers.get('access-control-allow-origin');
  assert.equal(allowOrigin, 'https://buildiqo-frontend.onrender.com');
});

test('C. Required CORS methods are allowed (GET, POST, PUT, PATCH, DELETE, OPTIONS)', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://buildiqo-frontend.onrender.com',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type, Authorization'
    }
  });

  const allowMethods = res.headers.get('access-control-allow-methods') || '';
  const methods = allowMethods.split(',').map(m => m.trim());
  ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'].forEach(m => {
    assert.ok(methods.includes(m), `Expected ${m} to be in allowed methods: ${allowMethods}`);
  });
});

test('D. Required request headers are allowed (Content-Type, Authorization)', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://buildiqo-frontend.onrender.com',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type, Authorization'
    }
  });

  const allowHeaders = (res.headers.get('access-control-allow-headers') || '').toLowerCase();
  assert.ok(allowHeaders.includes('content-type'), 'Expected content-type in allowed headers');
  assert.ok(allowHeaders.includes('authorization'), 'Expected authorization in allowed headers');
});

test('E. OPTIONS does not require authentication', async () => {
  // Sending OPTIONS with no Authorization header to protected route /api/me or /api/auth/login
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://buildiqo-frontend.onrender.com',
      'Access-Control-Request-Method': 'POST'
    }
  });

  assert.ok(res.status >= 200 && res.status < 300, `Expected 2xx without auth, got ${res.status}`);
});

test('F. An unauthorized / random origin is not allowed and does not crash with 500', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://malicious-unauthorized-site.com',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type, Authorization'
    }
  });

  // Must not be 500
  assert.notEqual(res.status, 500, 'Preflight from unauthorized origin must NOT return 500');
  const allowOrigin = res.headers.get('access-control-allow-origin');
  assert.notEqual(allowOrigin, 'https://malicious-unauthorized-site.com', 'Unauthorized origin must not be allowed');
  assert.notEqual(allowOrigin, '*', 'Wildcard origin must not be returned');
});

test('G. Local development CORS continues to work (http://localhost:3000 & http://127.0.0.1:3000)', async () => {
  for (const origin of ['http://localhost:3000', 'http://127.0.0.1:3000']) {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });

    assert.ok(res.status >= 200 && res.status < 300, `Expected 2xx for ${origin}`);
    assert.equal(res.headers.get('access-control-allow-origin'), origin);
  }
});
