import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middlewares/auth';

export const getDashboardStats = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Today's Trips
    const todayTripsCount = await prisma.trip.count({
      where: {
        date: {
          gte: today,
        },
      },
    });

    // 2. Running/Delayed Buses
    const runningBusesCount = await prisma.bus.count({
      where: { status: 'RUNNING' },
    });

    const delayedTripsCount = await prisma.trip.count({
      where: {
        status: 'DELAYED',
        date: { gte: today },
      },
    });

    // 3. Driver Availability
    const availableDriversCount = await prisma.driver.count({
      where: { availabilityStatus: 'AVAILABLE' },
    });

    const totalDriversCount = await prisma.driver.count();

    // 4. Fuel Consumption & Costs
    const fuelStats = await prisma.fuelLog.aggregate({
      _sum: {
        cost: true,
        fuelQuantity: true,
      },
    });

    // 5. Maintenance alerts (Pending/Scheduled)
    const maintenanceAlertsCount = await prisma.maintenance.count({
      where: {
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      },
    });

    // 6. Complaints
    const openComplaintsCount = await prisma.complaint.count({
      where: {
        status: { in: ['SUBMITTED', 'IN_INVESTIGATION'] },
      },
    });

    // 7. Attendance Metrics
    const driverAttendanceCount = await prisma.attendance.count({
      where: {
        date: { gte: today },
        driverId: { not: null },
      },
    });

    const passengerAttendanceCount = await prisma.attendance.count({
      where: {
        date: { gte: today },
        passengerId: { not: null },
      },
    });

    // 8. Recent Audit Logs
    const recentAuditLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    // 9. Total fleet summary
    const totalBuses = await prisma.bus.count();
    const activeBuses = await prisma.bus.count({ where: { status: 'AVAILABLE' } });
    const maintenanceBuses = await prisma.bus.count({ where: { status: 'MAINTENANCE' } });

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
  } catch (err) {
    next(err);
  }
};

export const getMonthlyReport = async (req: AuthRequest, res: Response, next: any) => {
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
  } catch (err) {
    next(err);
  }
};
