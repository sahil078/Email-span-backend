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
  'https://email-spam-frontend-six.vercel.app', // Deployed frontend
  'http://localhost:3000', // Local development
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`🚫 Blocked by CORS: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);


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
