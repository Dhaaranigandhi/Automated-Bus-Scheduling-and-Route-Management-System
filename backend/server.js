const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnection } = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const busRoutes = require('./routes/busRoutes');
const routeRoutes = require('./routes/routeRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static assets (highly convenient for single-port execution)
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/reports', reportRoutes);

// Fallback: serve index.html for undefined non-API requests
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Database connection & Server initialization
async function startServer() {
  console.log('[Server] Initializing Smart Bus Scheduling System...');
  const isDbConnected = await testConnection();
  
  if (!isDbConnected) {
    console.warn('[Warning] Running server without active database connection. Some API endpoints will fail.');
  }

  app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(`[Server] Server is running on port ${PORT}`);
    console.log(`[Server] Local URL: http://localhost:${PORT}`);
    console.log(`================================================================`);
  });
}

startServer();
