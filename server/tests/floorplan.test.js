const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { app } = require('../index');

let server = null;
let baseUrl = '';

// Test JWT token
const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_min_32_characters_long_for_security';
process.env.JWT_SECRET = JWT_SECRET;

const validToken = jwt.sign(
  { id: 'usr_test_123', email: 'architect@buildiqo.ai', role: 'Architect', isAdmin: false },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const SAMPLE_DXF_PATH = path.resolve(__dirname, '../../floorplan-service/tests/fixtures/sample_floorplan.dxf');

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
    await new Promise((resolve) => server.close(resolve));
  }
});

test('1. Unauthenticated extraction request returns 401', async () => {
  const form = new FormData();
  form.append('file', new Blob(['dummy content'], { type: 'application/dxf' }), 'test.dxf');

  const res = await fetch(`${baseUrl}/api/floorplan/extract`, {
    method: 'POST',
    body: form
  });

  assert.equal(res.status, 401, `Expected 401 for unauthenticated request, got ${res.status}`);
  const data = await res.json();
  assert.equal(data.success, false);
});

test('2. Invalid bearer token returns 401', async () => {
  const form = new FormData();
  form.append('file', new Blob(['dummy content'], { type: 'application/dxf' }), 'test.dxf');

  const res = await fetch(`${baseUrl}/api/floorplan/extract`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer invalid_garbage_token'
    },
    body: form
  });

  assert.equal(res.status, 401);
});

test('3. Non-DXF file extension rejected with 400', async () => {
  const form = new FormData();
  form.append('file', new Blob(['not cad'], { type: 'application/pdf' }), 'floorplan.pdf');

  const res = await fetch(`${baseUrl}/api/floorplan/extract`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${validToken}`
    },
    body: form
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.error, /\.dxf/i);
});

test('4. Empty DXF file rejected with 400', async () => {
  const form = new FormData();
  form.append('file', new Blob([], { type: 'application/dxf' }), 'empty.dxf');

  const res = await fetch(`${baseUrl}/api/floorplan/extract`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${validToken}`
    },
    body: form
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /empty/i);
});

test('5. Valid DXF upload with valid token returns normalized room extraction', async () => {
  if (!fs.existsSync(SAMPLE_DXF_PATH)) {
    test.skip('sample_floorplan.dxf fixture not found');
    return;
  }

  const dxfBuffer = fs.readFileSync(SAMPLE_DXF_PATH);
  const form = new FormData();
  form.append('file', new Blob([dxfBuffer], { type: 'application/dxf' }), 'sample_floorplan.dxf');

  const res = await fetch(`${baseUrl}/api/floorplan/extract`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${validToken}`
    },
    body: form
  });

  assert.equal(res.status, 200, `Expected 200, received ${res.status}`);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.rooms), 'Expected rooms array');
  assert.equal(data.source.file_type, 'DXF');
  assert.equal(data.source.units, 'feet');
  assert.equal(data.total_usable_carpet_sqft, 604);

  // Verify room schema fields
  const living = data.rooms.find(r => r.name === 'Living Room');
  assert.ok(living, 'Living Room should be extracted');
  assert.equal(living.type, 'living');
  assert.equal(living.area_sqft, 288);
  assert.equal(living.area_method, 'POLYGON_AREA');
  assert.equal(living.dimension_method, 'MIN_ROTATED_BOUNDING_BOX');
  assert.equal(living.confidence, 'HIGH');
  assert.ok(living.geometry, 'Geometry should be populated');
  assert.equal(living.geometry.width, 16);
  assert.equal(living.geometry.length, 18);
});

test('6. Valid DXF with generic MIME (application/octet-stream) accepted', async () => {
  if (!fs.existsSync(SAMPLE_DXF_PATH)) {
    test.skip('sample_floorplan.dxf fixture not found');
    return;
  }

  const dxfBuffer = fs.readFileSync(SAMPLE_DXF_PATH);
  const form = new FormData();
  form.append('file', new Blob([dxfBuffer], { type: 'application/octet-stream' }), 'sample.dxf');

  const res = await fetch(`${baseUrl}/api/floorplan/extract`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${validToken}`
    },
    body: form
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
});
