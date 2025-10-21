require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/auth');
const testsRouter = require('./src/routes/tests');

const app = express();

// Security
app.use(helmet());

// CORS (simple + preflight handler)
app.use(cors());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// DB
connectDB().catch((err) => {
  console.error('Failed to connect to the database on startup:', err);
  process.exit(1);
});

// Health
app.get('/api/health', (_req, res) => res.status(200).json({ ok: true }));

// Root
app.get('/', (_req, res) => {
  res.json({ message: 'API Server is running', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tests', testsRouter);

// Error handler
app.use((err, _req, res, _next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// 404 catch-all
app.use((req, res) => res.status(404).json({ error: 'Endpoint not found' }));

// Start
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;