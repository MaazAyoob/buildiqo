const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config(); // cwd fallback

const { ensurePlatformOwner } = require('../routes/auth');

async function runAdminSeed(options = {}) {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/buildiqo';
  const maskedUri = mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');

  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD environment variables must be defined to seed the administrator account.');
  }

  const timeoutMs = process.env.NODE_ENV === 'production' ? 10000 : 5000;
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: timeoutMs });
  console.log(`[Admin Seed] Connected to database: ${maskedUri}`);

  try {
    const result = await ensurePlatformOwner(options);
    return result;
  } finally {
    await mongoose.disconnect();
    console.log('[Admin Seed] Disconnected from database.');
  }
}

// Standalone execution support
if (require.main === module) {
  runAdminSeed()
    .then((result) => {
      console.log('[Admin Seed] Operation result:', JSON.stringify(result));
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Admin Seed] Error:', err.message);
      process.exit(1);
    });
}

module.exports = { runAdminSeed };
