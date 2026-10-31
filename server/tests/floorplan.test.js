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

// Service-to-service authentication secret
process.env.FLOORPLAN_SERVICE_TOKEN = process.env.FLOORPLAN_SERVICE_TOKEN || 'secure_service_token_xyz';

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

test('3. Non-CAD/PDF file extension (.txt) rejected with 400', async () => {
  const form = new FormData();
  form.append('file', new Blob(['not cad'], { type: 'text/plain' }), 'floorplan.txt');

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
  assert.match(data.error, /Supported floor plan formats/i);
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

test('5. Empty DWG file rejected with 400', async () => {
  const form = new FormData();
  form.append('file', new Blob([], { type: 'application/acad' }), 'empty.dwg');

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

test('6. Non-supported executable (.exe) rejected with 400', async () => {
  const form = new FormData();
  form.append('file', new Blob(['binary'], { type: 'application/octet-stream' }), 'malware.exe');

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
});

test('7. Valid DXF upload returns normalized room extraction', async () => {
  const sampleDxfText = `0\nSECTION\n2\nENTITIES\n0\nLWPOLYLINE\n8\nWALLS\n70\n1\n10\n0\n20\n0\n10\n16\n20\n0\n10\n16\n20\n18\n10\n0\n20\n18\n0\nTEXT\n8\nROOM_LABELS\n1\nLiving Room\n0\nENDSEC\n0\nEOF`;
  const form = new FormData();
  form.append('file', new Blob([sampleDxfText], { type: 'application/dxf' }), 'test_plan.dxf');

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
  assert.ok(data.rooms.length > 0);
  const living = data.rooms.find(r => r.name.toLowerCase().includes('living'));
  assert.ok(living, 'Living Room should be extracted');
  assert.equal(living.confidence, 'HIGH');
});

test('8. Valid PNG image upload returns normalized extraction with ESTIMATED confidence', async () => {
  const pngHeader = Buffer.alloc(32);
  pngHeader.writeUInt8(0x89, 0); pngHeader.write('PNG', 1);
  pngHeader.writeUInt32BE(1920, 16); pngHeader.writeUInt32BE(1080, 20);

  const form = new FormData();
  form.append('file', new Blob([pngHeader], { type: 'image/png' }), 'architectural_plan.png');

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
  assert.equal(data.confidence, 'ESTIMATED');
  assert.equal(data.uncertain_measurements, true);
  assert.ok(data.rooms.length >= 3);
});

test('9. Valid SVG upload returns normalized room extraction with HIGH confidence', async () => {
  const sampleSvg = '<svg viewBox="0 0 1000 800"><rect x="50" y="50" width="300" height="200" id="living" /><text x="60" y="80">Living Room</text></svg>';
  const form = new FormData();
  form.append('file', new Blob([sampleSvg], { type: 'image/svg+xml' }), 'plan.svg');

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
  assert.equal(data.source.file_type, 'SVG');
  assert.equal(data.confidence, 'HIGH');
  assert.ok(data.rooms.length > 0);
});

test('10. Valid Vector PDF upload returns normalized room extraction', async () => {
  const pdfVector = '%PDF-1.4\n1 0 obj\n<< /Type /Page >>\nendobj\nstream\n100 100 200 300 re\n200 200 150 150 re\n300 300 180 200 re\nBT /F1 12 Tf (Living Room) Tj ET\nendstream\nendobj\n%%EOF';
  const form = new FormData();
  form.append('file', new Blob([pdfVector], { type: 'application/pdf' }), 'vector_plan.pdf');

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
  assert.equal(data.source.file_type, 'VECTOR_PDF');
  assert.ok(data.rooms.length > 0);
});

test('11. Scanned / Raster PDF upload returns normalized extraction with ESTIMATED confidence', async () => {
  const pdfScanned = '%PDF-1.4\n1 0 obj\n<< /Type /Page /Subtype /Image /Width 1800 /Height 1200 >>\nendobj\n%%EOF';
  const form = new FormData();
  form.append('file', new Blob([pdfScanned], { type: 'application/pdf' }), 'scanned_blueprint.pdf');

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
  assert.equal(data.source.file_type, 'SCANNED_PDF');
  assert.equal(data.confidence, 'ESTIMATED');
  assert.equal(data.requires_scale_calibration, true);
  assert.ok(data.rooms.length >= 3);
});

test('12. DWG binary upload returns 422 with honest ODA converter status', async () => {
  const dwgHeader = Buffer.from('AC1018_autocad_binary_drawing_data');
  const form = new FormData();
  form.append('file', new Blob([dwgHeader], { type: 'application/acad' }), 'drawing.dwg');

  const res = await fetch(`${baseUrl}/api/floorplan/extract`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${validToken}`
    },
    body: form
  });

  assert.equal(res.status, 422);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.equal(data.isDwg, true);
  assert.match(data.error, /ODA File Converter runtime which is not installed/i);
});
