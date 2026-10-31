const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const http = require('http');
const mongoose = require('mongoose');

// Load environment variables for testing BEFORE requiring app
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test_jwt_secret_key_for_project_isolation_verification_12345';
}

const { app } = require('../index');
const Project = require('../models/Project');
const User = require('../models/User');

let mongoServer = null;
let server = null;
let baseUrl = '';

test.before(async () => {
  if (mongoose.connection.readyState === 0) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  }

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
  if (mongoServer) {
    await mongoose.disconnect();
    await mongoServer.stop();
  }
});

test('Requirement 2: Full Server-Side Project User Isolation & Security Test', async (t) => {
  const timestamp = Date.now();
  const userAData = {
    name: 'Architect Alice',
    email: `alice_${timestamp}@buildiqo.ai`,
    phone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'Password123!',
    role: 'Architect'
  };

  const userBData = {
    name: 'Builder Bob',
    email: `bob_${timestamp}@buildiqo.ai`,
    phone: `+91 97${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'Password123!',
    role: 'Builder'
  };

  let tokenA = '';
  let userAId = '';
  let tokenB = '';
  let userBId = '';
  let projectAId = '';

  await t.test('1. User A registers successfully and receives JWT', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userAData)
    });
    assert.ok(res.status === 200 || res.status === 201, `Status ${res.status}`);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.token);
    userAId = (data.user?._id || data.user?.id).toString();
    tokenA = data.token;
  });

  await t.test('2. User A creates and saves Project A (55x55 ft G+1)', async () => {
    const projectPayload = {
      name: 'Project A - Alice Villa',
      state: 'Karnataka',
      city: 'Bengaluru',
      tier: 'standard',
      numFloors: 2,
      totalCost: 16062750,
      totalBua: 6050,
      ratePerSqFt: 2250,
      stateSnapshot: {
        projectName: 'Project A - Alice Villa',
        plotWidth: 55,
        plotLength: 55,
        numFloors: 2,
        tier: 'standard'
      }
    };

    const res = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify(projectPayload)
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.project?._id);
    assert.equal(data.project.name, 'Project A - Alice Villa');
    assert.equal(data.project.userId.toString(), userAId);
    projectAId = data.project._id;
  });

  await t.test('3. User A lists projects -> Project A appears in User A dashboard', async () => {
    const res = await fetch(`${baseUrl}/api/projects`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.projects.length, 1);
    assert.equal(data.projects[0]._id, projectAId);
  });

  await t.test('4. User B registers with an independent account', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userBData)
    });
    assert.ok(res.status === 200 || res.status === 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.token);
    userBId = (data.user?._id || data.user?.id).toString();
    assert.notEqual(userBId, userAId);
    tokenB = data.token;
  });

  await t.test('5. User B project list is EMPTY (0 projects, strictly isolated)', async () => {
    const res = await fetch(`${baseUrl}/api/projects`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.projects.length, 0, 'Newly registered User B must see an empty project list');
  });

  await t.test('6. User B cannot retrieve Project A via GET /api/projects/:id (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${projectAId}`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    assert.equal(res.status, 403, 'Must return 403 Forbidden for unauthorized project access');
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.error, /unauthorized/i);
  });

  await t.test('7. User B cannot edit Project A via PUT /api/projects/:id (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${projectAId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenB}`
      },
      body: JSON.stringify({ name: 'Hacked by Bob' })
    });
    assert.equal(res.status, 403);
    const data = await res.json();
    assert.equal(data.success, false);

    // Verify Project A name was not altered
    const verify = await Project.findById(projectAId);
    assert.equal(verify.name, 'Project A - Alice Villa');
  });

  await t.test('8. User B cannot hijack Project A via POST /api/projects with id (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenB}`
      },
      body: JSON.stringify({
        id: projectAId,
        name: 'Bob Hijack Attempt'
      })
    });
    assert.equal(res.status, 403);
    const data = await res.json();
    assert.equal(data.success, false);
  });

  await t.test('9. User B cannot delete Project A via DELETE /api/projects/:id (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${projectAId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    assert.equal(res.status, 403);
    const data = await res.json();
    assert.equal(data.success, false);

    // Verify Project A still exists in DB
    const verify = await Project.findById(projectAId);
    assert.ok(verify, 'Project A must still exist');
  });

  await t.test('10. User B cannot export Project A via GET /api/projects/:id/export/pdf (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${projectAId}/export/pdf`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    assert.equal(res.status, 403);
  });

  await t.test('11. User B cannot export Project A via POST /api/projects/export/pdf with projectId (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/api/projects/export/pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenB}`
      },
      body: JSON.stringify({
        projectId: projectAId,
        state: { projectName: 'Project A - Alice Villa' }
      })
    });
    assert.equal(res.status, 403);
  });

  await t.test('12. User A logs back in -> Project A is still intact and available', async () => {
    // Authenticate as User A
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrPhone: userAData.email,
        password: userAData.password
      })
    });
    assert.equal(loginRes.status, 200);
    const loginData = await loginRes.json();
    const freshTokenA = loginData.token;

    // Fetch projects for User A
    const listRes = await fetch(`${baseUrl}/api/projects`, {
      headers: { 'Authorization': `Bearer ${freshTokenA}` }
    });
    assert.equal(listRes.status, 200);
    const listData = await listRes.json();
    assert.equal(listData.projects.length, 1);
    assert.equal(listData.projects[0]._id, projectAId);
    assert.equal(listData.projects[0].name, 'Project A - Alice Villa');
  });

  await t.test('13. User A can view and export Project A successfully', async () => {
    // GET /api/projects/:id
    const getRes = await fetch(`${baseUrl}/api/projects/${projectAId}`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert.equal(getRes.status, 200);
    const getData = await getRes.json();
    assert.equal(getData.project.name, 'Project A - Alice Villa');

    // GET /api/projects/:id/export/pdf
    const exportRes = await fetch(`${baseUrl}/api/projects/${projectAId}/export/pdf`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert.equal(exportRes.status, 200);
    assert.equal(exportRes.headers.get('content-type'), 'application/pdf');
    const pdfBuf = await exportRes.arrayBuffer();
    assert.ok(pdfBuf.byteLength > 1000, 'PDF buffer must be non-empty');
  });

  await t.test('14. Legacy records with null userId are safely handled and not leaked', async () => {
    // Create an unowned legacy project directly in DB
    const legacyProject = await Project.create({
      name: 'Legacy Unowned Project',
      state: 'Karnataka',
      city: 'Bengaluru',
      tier: 'standard',
      numFloors: 2,
      totalCost: 5000000,
      totalBua: 2000,
      ratePerSqFt: 2250,
      stateSnapshot: {},
      userId: null
    });

    // User A should NOT see it in project list
    const resA = await fetch(`${baseUrl}/api/projects`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert.equal(resA.status, 200);
    const dataA = await resA.json();
    assert.ok(Array.isArray(dataA.projects));
    assert.ok(!dataA.projects.some(p => p._id.toString() === legacyProject._id.toString()));

    // User B should NOT see it in project list
    const resB = await fetch(`${baseUrl}/api/projects`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    assert.equal(resB.status, 200);
    const dataB = await resB.json();
    assert.ok(Array.isArray(dataB.projects));
    assert.ok(!dataB.projects.some(p => p._id.toString() === legacyProject._id.toString()));

    // Non-admin cannot view unowned legacy project
    const getLegacy = await fetch(`${baseUrl}/api/projects/${legacyProject._id}`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert.equal(getLegacy.status, 403);
  });
});
