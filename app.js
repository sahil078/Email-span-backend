require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/auth');
const testsRouter = require('./src/routes/tests');

const app = express();

// -------------------------------
// 🔒 Security Middleware
// -------------------------------
app.use(helmet());

// -------------------------------
// 🌐 CORS Configuration
// -------------------------------
const allowedOrigins = [
  'https://email-spam-frontend-six.vercel.app', // production frontend
  'http://localhost:3000', // local dev
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests directly
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});


// -------------------------------
// 🧩 Body Parsing
// -------------------------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// -------------------------------
// 🗄️ Database Connection
// -------------------------------
connectDB()
  .then(() => console.log('✅ MongoDB connection established'))
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB:', err);
    process.exit(1);
  });

// -------------------------------
// 🩺 Health Check
// -------------------------------
app.get('/api/health', (_req, res) =>
  res.status(200).json({ ok: true, timestamp: new Date().toISOString() })
);

// -------------------------------
// 🏠 Root Route
// -------------------------------
app.get('/', (_req, res) => {
  res.json({
    message: '🚀 API Server is running successfully',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// -------------------------------
// 🚏 API Routes
// -------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/tests', testsRouter);

// -------------------------------
// ❗ Error Handling Middleware
// -------------------------------
app.use((err, _req, res, _next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message:
      process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong, please try again later.',
  });
});

// -------------------------------
// 🚫 404 - Not Found Handler
// -------------------------------
app.use((req, res) => res.status(404).json({ error: 'Endpoint not found' }));

// -------------------------------
// 🚀 Start Server (local only)
// -------------------------------
const PORT = process.env.PORT || 4000;

// Only start listening locally (Vercel handles this automatically)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
  });
}

// Export for serverless platforms (Vercel)
module.exports = app;
