"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMonthlyReport = exports.getDashboardStats = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const getDashboardStats = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // 1. Today's Trips
        const todayTripsCount = await prisma_1.default.trip.count({
            where: {
                date: {
                    gte: today,
                },
            },
        });
        // 2. Running/Delayed Buses
        const runningBusesCount = await prisma_1.default.bus.count({
            where: { status: 'RUNNING' },
        });
        const delayedTripsCount = await prisma_1.default.trip.count({
            where: {
                status: 'DELAYED',
                date: { gte: today },
            },
        });
        // 3. Driver Availability
        const availableDriversCount = await prisma_1.default.driver.count({
            where: { availabilityStatus: 'AVAILABLE' },
        });
        const totalDriversCount = await prisma_1.default.driver.count();
        // 4. Fuel Consumption & Costs
        const fuelStats = await prisma_1.default.fuelLog.aggregate({
            _sum: {
                cost: true,
                fuelQuantity: true,
            },
        });
        // 5. Maintenance alerts (Pending/Scheduled)
        const maintenanceAlertsCount = await prisma_1.default.maintenance.count({
            where: {
                status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
            },
        });
        // 6. Complaints
        const openComplaintsCount = await prisma_1.default.complaint.count({
            where: {
                status: { in: ['SUBMITTED', 'IN_INVESTIGATION'] },
            },
        });
        // 7. Attendance Metrics
        const driverAttendanceCount = await prisma_1.default.attendance.count({
            where: {
                date: { gte: today },
                driverId: { not: null },
            },
        });
        const passengerAttendanceCount = await prisma_1.default.attendance.count({
            where: {
                date: { gte: today },
                passengerId: { not: null },
            },
        });
        // 8. Recent Audit Logs
        const recentAuditLogs = await prisma_1.default.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 6,
            include: {
                user: { select: { name: true, email: true } },
            },
        });
        // 9. Total fleet summary
        const totalBuses = await prisma_1.default.bus.count();
        const activeBuses = await prisma_1.default.bus.count({ where: { status: 'AVAILABLE' } });
        const maintenanceBuses = await prisma_1.default.bus.count({ where: { status: 'MAINTENANCE' } });
        res.status(200).json({
            success: true,
            stats: {
                todayTrips: todayTripsCount,
                runningBuses: runningBusesCount,
                delayedBuses: delayedTripsCount,
                driverAvailability: {
                    available: availableDriversCount,
                    total: totalDriversCount,
                },
                fuel: {
                    totalCost: Number(fuelStats._sum.cost || 0),
                    totalLiters: Number(fuelStats._sum.fuelQuantity || 0),
                },
                maintenanceAlerts: maintenanceAlertsCount,
                openComplaints: openComplaintsCount,
                attendance: {
                    drivers: driverAttendanceCount,
                    passengers: passengerAttendanceCount,
                },
                fleet: {
                    total: totalBuses,
                    active: activeBuses,
                    maintenance: maintenanceBuses,
                },
            },
            recentAuditLogs,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getDashboardStats = getDashboardStats;
const getMonthlyReport = async (req, res, next) => {
    try {
        // Generate mock datasets grouping logs by months for charts
        // In production, this would execute group-by aggregates
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
        const tripTrends = [120, 150, 180, 220, 260, 310, 340];
        const fuelTrends = [800, 950, 1100, 1050, 1300, 1250, 1400];
        const maintenanceTrends = [200, 450, 150, 300, 500, 100, 250];
        res.status(200).json({
            success: true,
            report: {
                labels: months,
                trips: tripTrends,
                fuelCosts: fuelTrends,
                maintenanceCosts: maintenanceTrends,
            },
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getMonthlyReport = getMonthlyReport;
