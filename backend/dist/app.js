"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const node_cron_1 = __importDefault(require("node-cron"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
// Configs & Middlewares
dotenv_1.default.config();
const logger_1 = __importDefault(require("./config/logger"));
const error_1 = require("./middlewares/error");
const tracking_1 = require("./sockets/tracking");
// Routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const busRoutes_1 = __importDefault(require("./routes/busRoutes"));
const driverRoutes_1 = __importDefault(require("./routes/driverRoutes"));
const routeRoutes_1 = __importDefault(require("./routes/routeRoutes"));
const scheduleRoutes_1 = __importDefault(require("./routes/scheduleRoutes"));
const tripRoutes_1 = __importDefault(require("./routes/tripRoutes"));
const maintenanceRoutes_1 = __importDefault(require("./routes/maintenanceRoutes"));
const fuelRoutes_1 = __importDefault(require("./routes/fuelRoutes"));
const complaintRoutes_1 = __importDefault(require("./routes/complaintRoutes"));
const settingRoutes_1 = __importDefault(require("./routes/settingRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
    },
});
// App Configurations
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: 'http://localhost:5173', credentials: true }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
// Log HTTP transactions
app.use((req, res, next) => {
    logger_1.default.http(`${req.method} ${req.url} - IP: ${req.ip}`);
    next();
});
// API Routes Mounting
app.use('/api/auth', authRoutes_1.default);
app.use('/api/buses', busRoutes_1.default);
app.use('/api/drivers', driverRoutes_1.default);
app.use('/api/routes', routeRoutes_1.default);
app.use('/api/schedules', scheduleRoutes_1.default);
app.use('/api/trips', tripRoutes_1.default);
app.use('/api/maintenance', maintenanceRoutes_1.default);
app.use('/api/fuel', fuelRoutes_1.default);
app.use('/api/complaints', complaintRoutes_1.default);
app.use('/api/settings', settingRoutes_1.default);
app.use('/api/reports', reportRoutes_1.default);
// Base Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date() });
});
const gpsSimulator_1 = require("./services/gpsSimulator");
// Setup WebSockets Live Trackers
(0, tracking_1.setupLocationTracking)(io);
gpsSimulator_1.gpsSimulator.startSimulation(io);
// Global Error Handler
app.use(error_1.errorHandler);
// Node-Cron Routine: Run daily check for vehicle inspection alerts at midnight
node_cron_1.default.schedule('0 0 * * *', () => {
    logger_1.default.info('[Cron Job] Executing daily vehicle inspection alerts checker...');
    // Inspect schedules, flag permits close to expiry dates, write to notifications
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    logger_1.default.info(`================================================================`);
    logger_1.default.info(`TransitFlow API Server is running on port ${PORT}`);
    logger_1.default.info(`Local URL: http://localhost:${PORT}`);
    logger_1.default.info(`================================================================`);
});
exports.default = server;
