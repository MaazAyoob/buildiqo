const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Enforce fail-fast security policy for JWT secret in production
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL CONFIGURATION ERROR: JWT_SECRET environment variable is required in production. Server halted.');
    process.exit(1);
  } else {
    console.warn('WARNING: JWT_SECRET is not set in environment. Authentication endpoints will require it.');
  }
}

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const leadRoutes = require('./routes/leads');
const paymentRoutes = require('./routes/payments');
const subscriptionRoutes = require('./routes/subscriptions');
const pricingRoutes = require('./routes/pricing');
const { seedMaterials } = require('./scripts/seedMaterials');

const app = express();
const PORT = process.env.PORT || 5000;

// Configurable CORS allowlist
const rawFrontendOrigins = process.env.FRONTEND_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000';
const allowedOrigins = rawFrontendOrigins.split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Non-browser / server-to-server requests
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy: Origin ${origin} not allowed`));
  },
  credentials: true
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/pricing', pricingRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Buildiqo.AI Backend is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'pending_connection'
  });
});

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/buildiqo';

async function startServer() {
  try {
    // Attempt connecting to configured Mongo URI with 2s timeout
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    console.log('Connected to MongoDB successfully at:', mongoUri);
  } catch (err) {
    console.warn(`Direct MongoDB connection to ${mongoUri} failed (${err.message}).`);
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('Starting internal in-memory MongoDB engine for local development...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const memServer = await MongoMemoryServer.create();
        const memUri = memServer.getUri();
        await mongoose.connect(memUri);
        console.log('Connected to local dev MongoDB engine at:', memUri);
      } catch (memErr) {
        console.error('In-memory MongoDB startup failed:', memErr.message);
      }
    }
  }

  if (mongoose.connection.readyState === 1) {
    try {
      await seedMaterials();
      if (typeof authRoutes.ensurePlatformOwner === 'function') {
        await authRoutes.ensurePlatformOwner();
      }
    } catch (seedErr) {
      console.warn('Material / admin auto-seed check skipped or non-fatal error:', seedErr.message);
    }
  }

  app.listen(PORT, () => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'Database connected' : 'Database pending';
    console.log(`Buildiqo.AI Server running on port ${PORT} (${dbStatus})`);
  });
}

startServer();
