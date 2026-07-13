const { pool } = require('../config/db');

// Get Dashboard KPIs and Recent Activity list
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Fetch counts in parallel
    const [busCountRows] = await pool.query('SELECT COUNT(*) AS total, SUM(CASE WHEN Status = "Active" THEN 1 ELSE 0 END) as active, SUM(CASE WHEN Status = "Inactive" THEN 1 ELSE 0 END) as inactive FROM Bus');
    const [routeCountRows] = await pool.query('SELECT COUNT(*) AS total FROM Route');
    const [scheduleCountRows] = await pool.query('SELECT COUNT(*) AS total, SUM(CASE WHEN Status = "Active" THEN 1 ELSE 0 END) as active FROM Schedule');
    const [driverCountRows] = await pool.query('SELECT COUNT(DISTINCT DriverName) AS total FROM Bus WHERE DriverName IS NOT NULL AND DriverName != ""');
    const [todaysTripsRows] = await pool.query('SELECT COUNT(*) AS total FROM Schedule WHERE Status IN ("Active", "Pending", "Completed")');

    const stats = {
      buses: {
        total: busCountRows[0].total || 0,
        active: busCountRows[0].active || 0,
        inactive: busCountRows[0].inactive || 0
      },
      routes: {
        total: routeCountRows[0].total || 0
      },
      schedules: {
        total: scheduleCountRows[0].total || 0,
        active: scheduleCountRows[0].active || 0
      },
      drivers: {
        total: driverCountRows[0].total || 0
      },
      todaysTrips: {
        total: todaysTripsRows[0].total || 0
      }
    };

    // 2. Fetch recent entries for Recent Activities feed
    const [recentBuses] = await pool.query('SELECT BusID, BusNumber, DriverName, Status FROM Bus ORDER BY BusID DESC LIMIT 3');
    const [recentRoutes] = await pool.query('SELECT RouteID, Source, Destination, Distance FROM Route ORDER BY RouteID DESC LIMIT 3');
    const [recentSchedules] = await pool.query(`
      SELECT 
        s.ScheduleID, s.DepartureTime, s.Status,
        b.BusNumber, r.Source, r.Destination 
      FROM Schedule s
      INNER JOIN Bus b ON s.BusID = b.BusID
      INNER JOIN Route r ON s.RouteID = r.RouteID
      ORDER BY s.ScheduleID DESC LIMIT 3
    `);

    // 3. Assemble and normalize recent activity records
    const activities = [];

    recentBuses.forEach(b => {
      activities.push({
        id: `bus-${b.BusID}`,
        type: 'bus',
        title: 'New Bus Added',
        description: `Bus ${b.BusNumber} assigned to driver ${b.DriverName}.`,
        status: b.Status,
        rawId: b.BusID
      });
    });

    recentRoutes.forEach(r => {
      activities.push({
        id: `route-${r.RouteID}`,
        type: 'route',
        title: 'New Route Defined',
        description: `${r.Source} to ${r.Destination} (${r.Distance} km).`,
        status: 'Active',
        rawId: r.RouteID
      });
    });

    recentSchedules.forEach(s => {
      activities.push({
        id: `schedule-${s.ScheduleID}`,
        type: 'schedule',
        title: 'New Schedule Assigned',
        description: `Bus ${s.BusNumber} scheduled from ${s.Source} to ${s.Destination} at ${s.DepartureTime}.`,
        status: s.Status,
        rawId: s.ScheduleID
      });
    });

    // Sort by rawId descending (since they are generated sequentially, larger rawId means newer)
    // We append type weights or sort by the ID number
    activities.sort((a, b) => b.rawId - a.rawId);

    // Take top 5 activities
    const recentActivities = activities.slice(0, 5);

    return res.status(200).json({
      success: true,
      stats,
      recentActivities
    });
  } catch (error) {
    console.error('[Dashboard Stats Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard statistics.'
    });
  }
};
