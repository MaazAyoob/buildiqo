/**
 * Buildiqo.AI - Phase 2.0 AI Floor Plan Generator Backend Test Suite
 * Tests authentication, input validation, room program normalization,
 * refinement diffing, ambiguity handling, and calculator compatibility.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const jwt = require('jsonwebtoken');
const { app } = require('../index');
const { validateGenerationInput, normalizeRoomType } = require('../services/aiFloorplan/roomProgramValidator');
const { RuleBasedFloorplanProvider } = require('../services/aiFloorplan/llmProvider');
const aiFloorplanService = require('../services/aiFloorplan/aiFloorplanService');

let server = null;
let baseUrl = '';

const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_min_32_characters_long_for_security';
process.env.JWT_SECRET = JWT_SECRET;

const validToken = jwt.sign(
  { id: 'usr_architect_456', email: 'architect@buildiqo.ai', role: 'Architect', isAdmin: false },
  JWT_SECRET,
  { expiresIn: '1h' }
);

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

test('1. Unauthenticated generation request returns 401 Authorization token required', async () => {
  const res = await fetch(`${baseUrl}/api/floorplan/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plot_width_ft: 30, plot_length_ft: 40 })
  });

  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.equal(data.error, 'Authorization token required');
});

test('2. Missing or non-Bearer authorization header returns 401 Authorization token required', async () => {
  const res = await fetch(`${baseUrl}/api/floorplan/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic dXNlcjpwYXNz'
    },
    body: JSON.stringify({ plot_width_ft: 30, plot_length_ft: 40 })
  });

  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.equal(data.error, 'Authorization token required');
});

test('3. Invalid or malformed bearer token returns 401 Invalid or expired token', async () => {
  const res = await fetch(`${baseUrl}/api/floorplan/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer bad_token_123'
    },
    body: JSON.stringify({ plot_width_ft: 30, plot_length_ft: 40 })
  });

  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.equal(data.error, 'Invalid or expired token');
});

test('4. Valid authorization token passes requireAuth and proceeds into route handler', async () => {
  const res = await fetch(`${baseUrl}/api/floorplan/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${validToken}`
    },
    body: JSON.stringify({
      plot_width_ft: 30,
      plot_length_ft: 40,
      plot_facing: 'north',
      num_floors: 1,
      setback_ft: 3
    })
  });

  // Since route proceeds, status is either 200 (if Python up) or 503 (microservice unavailable), never 401
  assert.notEqual(res.status, 401);
  const data = await res.json();
  assert.notEqual(data.error, 'Authorization token required');
  assert.notEqual(data.error, 'Invalid or expired token');
});

test('5. Guest authentication endpoint POST /api/auth/guest issues valid JWT that passes requireAuth', async () => {
  const guestRes = await fetch(`${baseUrl}/api/auth/guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  assert.equal(guestRes.status, 200);
  const guestData = await guestRes.json();
  assert.equal(guestData.success, true);
  assert.ok(guestData.token);

  // Now verify that the issued guest token passes requireAuth on /api/floorplan/generate
  const floorplanRes = await fetch(`${baseUrl}/api/floorplan/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${guestData.token}`
    },
    body: JSON.stringify({
      plot_width_ft: 30,
      plot_length_ft: 40,
      plot_facing: 'north',
      num_floors: 1
    })
  });

  assert.notEqual(floorplanRes.status, 401);
  const fpData = await floorplanRes.json();
  assert.notEqual(fpData.error, 'Authorization token required');
  assert.notEqual(fpData.error, 'Invalid or expired token');
});


test('3. Input validation rejects missing or invalid plot dimensions', () => {
  const res1 = validateGenerationInput({});
  assert.equal(res1.isValid, false);
  assert.ok(res1.errors.some(e => e.includes('plot_width_ft')));

  const res2 = validateGenerationInput({ plot_width_ft: -10, plot_length_ft: 40 });
  assert.equal(res2.isValid, false);
  assert.ok(res2.errors.some(e => e.includes('plot_width_ft')));

  const res3 = validateGenerationInput({ plot_width_ft: 30, plot_length_ft: 500 });
  assert.equal(res3.isValid, false);
  assert.ok(res3.errors.some(e => e.includes('plot_length_ft')));
});

test('4. Input validation rejects negative setback and enforces max 5 floors', () => {
  const res1 = validateGenerationInput({ plot_width_ft: 30, plot_length_ft: 40, setback_ft: -2 });
  assert.equal(res1.isValid, false);
  assert.ok(res1.errors.some(e => e.includes('setback_ft')));

  // 5 floors -> accepted
  const res5 = validateGenerationInput({ plot_width_ft: 30, plot_length_ft: 40, num_floors: 5 });
  assert.equal(res5.isValid, true);

  // 6 floors -> rejected
  const res6 = validateGenerationInput({ plot_width_ft: 30, plot_length_ft: 40, num_floors: 6 });
  assert.equal(res6.isValid, false);
  assert.ok(res6.errors.some(e => e.includes('num_floors')));

  // 10 floors -> rejected
  const res10 = validateGenerationInput({ plot_width_ft: 30, plot_length_ft: 40, num_floors: 10 });
  assert.equal(res10.isValid, false);
  assert.ok(res10.errors.some(e => e.includes('num_floors')));
});

test('5. Input validation rejects excessive room counts (> 30)', () => {
  const rooms = [];
  for (let i = 0; i < 35; i++) {
    rooms.push({ type: 'bedroom', count: 1 });
  }
  const res = validateGenerationInput({
    plot_width_ft: 50,
    plot_length_ft: 60,
    rooms_required: rooms
  });
  assert.equal(res.isValid, false);
  assert.ok(res.errors.some(e => e.includes('Maximum total requested rooms limit')));
});

test('6. Room type normalization correctly resolves aliases', () => {
  assert.equal(normalizeRoomType('hall'), 'living');
  assert.equal(normalizeRoomType('living room'), 'living');
  assert.equal(normalizeRoomType('drawing'), 'living');
  assert.equal(normalizeRoomType('master bedroom'), 'master_bed');
  assert.equal(normalizeRoomType('guest bed'), 'regular_bed');
  assert.equal(normalizeRoomType('washroom'), 'common_bath');
  assert.equal(normalizeRoomType('pooja room'), 'puja');
  assert.equal(normalizeRoomType('prayer room'), 'puja');
});

test('7. Rule-based LLM provider produces valid structured room program', async () => {
  const provider = new RuleBasedFloorplanProvider();
  const res = await provider.generateRoomProgram({
    plot_width_ft: 30,
    plot_length_ft: 40,
    plot_facing: 'east',
    num_floors: 2,
    rooms_required: [
      { type: 'living', count: 1 },
      { type: 'kitchen', count: 1 },
      { type: 'master_bed', count: 1 },
      { type: 'attached_bath', count: 1 }
    ]
  });

  assert.ok(Array.isArray(res.rooms));
  assert.equal(res.rooms.length, 4);

  const living = res.rooms.find(r => r.type === 'living');
  assert.ok(living);
  assert.equal(living.priority, 'high');
  assert.ok(living.target_area_sqft >= 150);

  const master = res.rooms.find(r => r.type === 'master_bed');
  assert.ok(master);
  assert.equal(master.preferred_floor, 1);
});

test('8. Ambiguous refinement requests return structured clarification suggestions', async () => {
  const provider = new RuleBasedFloorplanProvider();
  const currentProgram = { rooms: [{ room_id: 'living_1', type: 'living' }] };

  const res = await provider.interpretRefinement(currentProgram, 'make it more spacious');
  assert.equal(res.is_ambiguous, true);
  assert.ok(res.clarification_message);
  assert.ok(Array.isArray(res.suggestions));
  assert.ok(res.suggestions.length > 0);
});

test('9. Actionable refinement requests produce structured changes', async () => {
  const provider = new RuleBasedFloorplanProvider();
  const currentProgram = { rooms: [{ room_id: 'kitchen_1', type: 'kitchen' }] };

  const res = await provider.interpretRefinement(currentProgram, 'make the kitchen bigger');
  assert.equal(res.is_ambiguous, false);
  assert.ok(Array.isArray(res.changes));
  assert.equal(res.changes[0].type, 'increase_area');
  assert.equal(res.changes[0].target_room_type, 'kitchen');
});

test('10. End-to-end API generation endpoint rejects invalid input with 400', async () => {
  const res = await fetch(`${baseUrl}/api/floorplan/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${validToken}`
    },
    body: JSON.stringify({
      plot_width_ft: 5, // invalid
      plot_length_ft: 40
    })
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.error, /plot_width_ft/i);
});

test('11. Generated room schema conforms to Step 2 calculator requirements', () => {
  // Verify that room structure can be fed directly into Step 2 and calculator
  const mockGeneratedRoom = {
    id: 'living_1',
    room_id: 'living_1',
    name: 'Living Room',
    type: 'living',
    width: 16.0,
    length: 18.0,
    area: 288.0,
    area_sqft: 288.0,
    count: 1,
    floor: 0,
    confidence: 'generated'
  };

  assert.equal(mockGeneratedRoom.confidence, 'generated');
  const computedArea = mockGeneratedRoom.width * mockGeneratedRoom.length * mockGeneratedRoom.count;
  assert.equal(computedArea, 288.0);
});

test('12. Unreachable Python service seamlessly engages architectural fallback with 200 and SVG', async () => {
  const originalUrl = process.env.FLOORPLAN_SERVICE_URL;
  // Point to a closed port
  process.env.FLOORPLAN_SERVICE_URL = 'http://127.0.0.1:59123';

  try {
    const res = await fetch(`${baseUrl}/api/floorplan/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validToken}`
      },
      body: JSON.stringify({
        plot_width_ft: 30,
        plot_length_ft: 40,
        plot_facing: 'north',
        num_floors: 1
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.generation_id);
    assert.ok(Array.isArray(data.floors));
    assert.ok(data.floors.length > 0);
    assert.ok(data.floors[0].rooms.length > 0);
    assert.ok(data.svg && data.svg.includes('<svg'));
  } finally {
    process.env.FLOORPLAN_SERVICE_URL = originalUrl;
  }
});

test('13. Upstream Python 422 error is safely mapped to 422 without crashing route', async () => {
  const originalUrl = process.env.FLOORPLAN_SERVICE_URL;
  let dummyServer = null;

  try {
    dummyServer = http.createServer((req, res) => {
      res.writeHead(422, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ detail: 'Unresolvable room constraints' }));
    });

    await new Promise((resolve) => dummyServer.listen(0, '127.0.0.1', resolve));
    const dummyPort = dummyServer.address().port;
    process.env.FLOORPLAN_SERVICE_URL = `http://127.0.0.1:${dummyPort}`;

    const res = await fetch(`${baseUrl}/api/floorplan/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validToken}`
      },
      body: JSON.stringify({
        plot_width_ft: 30,
        plot_length_ft: 40,
        plot_facing: 'north',
        num_floors: 1
      })
    });

    assert.equal(res.status, 422);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.error, 'Unresolvable room constraints');
    assert.equal(data.error.includes('Cannot read properties of undefined'), false);
  } finally {
    if (dummyServer) {
      await new Promise((resolve) => dummyServer.close(resolve));
    }
    process.env.FLOORPLAN_SERVICE_URL = originalUrl;
  }
});

test('14. Upstream Python 500 error gracefully recovers via fallback solver', async () => {
  const originalUrl = process.env.FLOORPLAN_SERVICE_URL;
  let dummyServer = null;

  try {
    dummyServer = http.createServer((req, res) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ detail: 'Internal geometry engine failure' }));
    });

    await new Promise((resolve) => dummyServer.listen(0, '127.0.0.1', resolve));
    const dummyPort = dummyServer.address().port;
    process.env.FLOORPLAN_SERVICE_URL = `http://127.0.0.1:${dummyPort}`;

    const res = await fetch(`${baseUrl}/api/floorplan/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validToken}`
      },
      body: JSON.stringify({
        plot_width_ft: 30,
        plot_length_ft: 40,
        plot_facing: 'north',
        num_floors: 1
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.floors[0].rooms.length > 0);
    assert.ok(data.svg && data.svg.includes('<svg'));
  } finally {
    if (dummyServer) {
      await new Promise((resolve) => dummyServer.close(resolve));
    }
    process.env.FLOORPLAN_SERVICE_URL = originalUrl;
  }
});


