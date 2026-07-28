import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cron from 'node-cron';
import cookieParser from 'cookie-parser';

// Configs & Middlewares
dotenv.config();
import logger from './config/logger';
import { errorHandler } from './middlewares/error';
import { setupLocationTracking } from './sockets/tracking';

// Routes
import authRoutes from './routes/authRoutes';
import busRoutes from './routes/busRoutes';
import driverRoutes from './routes/driverRoutes';
import routeRoutes from './routes/routeRoutes';
import scheduleRoutes from './routes/scheduleRoutes';
import tripRoutes from './routes/tripRoutes';
import maintenanceRoutes from './routes/maintenanceRoutes';
import fuelRoutes from './routes/fuelRoutes';
import complaintRoutes from './routes/complaintRoutes';
import settingRoutes from './routes/settingRoutes';
import reportRoutes from './routes/reportRoutes';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// App Configurations
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Log HTTP transactions
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

// API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/fuel', fuelRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/reports', reportRoutes);

// Base Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

import { gpsSimulator } from './services/gpsSimulator';

// Setup WebSockets Live Trackers
setupLocationTracking(io);
gpsSimulator.startSimulation(io);

// Global Error Handler
app.use(errorHandler);

// Node-Cron Routine: Run daily check for vehicle inspection alerts at midnight
cron.schedule('0 0 * * *', () => {
  logger.info('[Cron Job] Executing daily vehicle inspection alerts checker...');
  // Inspect schedules, flag permits close to expiry dates, write to notifications
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`================================================================`);
  logger.info(`TransitFlow API Server is running on port ${PORT}`);
  logger.info(`Local URL: http://localhost:${PORT}`);
  logger.info(`================================================================`);
});

export default server;
