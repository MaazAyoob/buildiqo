const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const http = require('http');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load environment variables for testing
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test_jwt_secret_key_for_admin_seed_verification_982347982';
}

const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { ensurePlatformOwner } = require('../routes/auth');
const { app } = require('../index');

let mongoServer = null;
let server = null;
let baseUrl = '';

const TEST_ADMIN_EMAIL = 'admin.seed.test@buildiqo.ai';
const TEST_ADMIN_PASSWORD = 'TestAdminSecret#2026';

test.before(async () => {
  // Set up in-memory MongoDB
  const { MongoMemoryServer } = require('mongodb-memory-server');
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Set up test HTTP server
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
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

test('1. Admin seed skips gracefully when environment variables are missing', async () => {
  const origEmail = process.env.SEED_ADMIN_EMAIL;
  const origPassword = process.env.SEED_ADMIN_PASSWORD;
  delete process.env.SEED_ADMIN_EMAIL;
  delete process.env.SEED_ADMIN_PASSWORD;

  const result = await ensurePlatformOwner();
  assert.equal(result.seeded, false);
  assert.ok(result.reason.includes('not configured'));

  process.env.SEED_ADMIN_EMAIL = origEmail;
  process.env.SEED_ADMIN_PASSWORD = origPassword;
});

test('2. Admin seed creates the account when missing and hashes the password', async () => {
  process.env.SEED_ADMIN_EMAIL = TEST_ADMIN_EMAIL;
  process.env.SEED_ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;

  const result = await ensurePlatformOwner();
  assert.equal(result.seeded, true);
  assert.equal(result.created, true);
  assert.equal(result.email, TEST_ADMIN_EMAIL);

  // Query MongoDB directly to verify stored document
  const user = await User.findOne({ email: TEST_ADMIN_EMAIL });
  assert.ok(user, 'Admin user should exist in database');
  assert.equal(user.isAdmin, true);
  assert.equal(user.role, 'Platform Owner & Super Admin');

  // Verify password is hashed with bcrypt and not plaintext
  assert.notEqual(user.password, TEST_ADMIN_PASSWORD);
  const isMatch = await bcrypt.compare(TEST_ADMIN_PASSWORD, user.password);
  assert.equal(isMatch, true, 'Bcrypt compare should match plain password');

  // Verify enterprise subscription was created
  const sub = await Subscription.findOne({ userId: user._id });
  assert.ok(sub, 'Subscription should exist for platform owner');
  assert.equal(sub.planId, 'enterprise');
  assert.equal(sub.status, 'active');
});

test('3. Admin seed is idempotent and does NOT overwrite existing password by default', async () => {
  process.env.SEED_ADMIN_EMAIL = TEST_ADMIN_EMAIL;
  process.env.SEED_ADMIN_PASSWORD = 'DifferentAttemptedPassword#999';

  const beforeUser = await User.findOne({ email: TEST_ADMIN_EMAIL });
  const originalPasswordHash = beforeUser.password;

  // Run seed again with a different password
  const result = await ensurePlatformOwner();
  assert.equal(result.seeded, true);
  assert.equal(result.created, false);
  assert.equal(result.updated, false);

  // Verify no duplicate users were created
  const count = await User.countDocuments({ email: TEST_ADMIN_EMAIL });
  assert.equal(count, 1, 'Should not create duplicate users');

  // Verify original password hash was preserved (not overwritten)
  const afterUser = await User.findOne({ email: TEST_ADMIN_EMAIL });
  assert.equal(afterUser.password, originalPasswordHash, 'Password should not be overwritten');
});

test('4. Login succeeds after seeding with admin credentials', async () => {
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      emailOrPhone: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD
    })
  });

  assert.equal(loginRes.status, 200, 'Login should succeed with HTTP 200');
  const body = await loginRes.json();
  assert.equal(body.success, true);
  assert.ok(body.token, 'Should return JWT token');
  assert.equal(body.user.email, TEST_ADMIN_EMAIL);
  assert.equal(body.user.isAdmin, true);
  assert.equal(body.subscription.planId, 'enterprise');
});
