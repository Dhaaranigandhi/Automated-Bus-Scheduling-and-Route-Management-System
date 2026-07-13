const { pool } = require('../config/db');

// Get all schedules (with optional filters for source, destination, bus, route, and status)
exports.getAllSchedules = async (req, res) => {
  const { source, destination, busId, routeId, status } = req.query;
  
  let sql = `
    SELECT 
      s.ScheduleID,
      s.DepartureTime,
      s.ArrivalTime,
      s.Status AS ScheduleStatus,
      b.BusID,
      b.BusNumber,
      b.DriverName,
      b.DriverContact,
      b.Capacity,
      b.BusType,
      b.Status AS BusStatus,
      r.RouteID,
      r.Source,
      r.Destination,
      r.Distance
    FROM Schedule s
    INNER JOIN Bus b ON s.BusID = b.BusID
    INNER JOIN Route r ON s.RouteID = r.RouteID
    WHERE 1=1
  `;
  const params = [];

  if (source) {
    sql += ' AND r.Source LIKE ?';
    params.push(`%${source}%`);
  }

  if (destination) {
    sql += ' AND r.Destination LIKE ?';
    params.push(`%${destination}%`);
  }

  if (busId) {
    sql += ' AND s.BusID = ?';
    params.push(parseInt(busId, 10));
  }

  if (routeId) {
    sql += ' AND s.RouteID = ?';
    params.push(parseInt(routeId, 10));
  }

  if (status) {
    sql += ' AND s.Status = ?';
    params.push(status);
  }

  sql += ' ORDER BY s.DepartureTime ASC';

  try {
    const [rows] = await pool.query(sql, params);
    
    // Format response to group data cleanly
    const schedules = rows.map(row => ({
      scheduleId: row.ScheduleID,
      departureTime: row.DepartureTime,
      arrivalTime: row.ArrivalTime,
      status: row.ScheduleStatus,
      bus: {
        busId: row.BusID,
        busNumber: row.BusNumber,
        driverName: row.DriverName,
        driverContact: row.DriverContact,
        capacity: row.Capacity,
        busType: row.BusType,
        status: row.BusStatus
      },
      route: {
        routeId: row.RouteID,
        source: row.Source,
        destination: row.Destination,
        distance: row.Distance
      }
    }));

    return res.status(200).json({
      success: true,
      schedules
    });
  } catch (error) {
    console.error('[Schedule Get All Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve schedules.'
    });
  }
};

// Get schedule by ID
exports.getScheduleById = async (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      s.ScheduleID,
      s.DepartureTime,
      s.ArrivalTime,
      s.Status AS ScheduleStatus,
      b.BusID,
      b.BusNumber,
      b.DriverName,
      b.DriverContact,
      b.Capacity,
      b.BusType,
      b.Status AS BusStatus,
      r.RouteID,
      r.Source,
      r.Destination,
      r.Distance
    FROM Schedule s
    INNER JOIN Bus b ON s.BusID = b.BusID
    INNER JOIN Route r ON s.RouteID = r.RouteID
    WHERE s.ScheduleID = ?
  `;

  try {
    const [rows] = await pool.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found.'
      });
    }

    const row = rows[0];
    const schedule = {
      scheduleId: row.ScheduleID,
      departureTime: row.DepartureTime,
      arrivalTime: row.ArrivalTime,
      status: row.ScheduleStatus,
      bus: {
        busId: row.BusID,
        busNumber: row.BusNumber,
        driverName: row.DriverName,
        driverContact: row.DriverContact,
        capacity: row.Capacity,
        busType: row.BusType,
        status: row.BusStatus
      },
      route: {
        routeId: row.RouteID,
        source: row.Source,
        destination: row.Destination,
        distance: row.Distance
      }
    };

    return res.status(200).json({
      success: true,
      schedule
    });
  } catch (error) {
    console.error('[Schedule Get By ID Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve schedule details.'
    });
  }
};

// Create a schedule
exports.createSchedule = async (req, res) => {
  const { busId, routeId, departureTime, arrivalTime, status } = req.body;

  // Validation
  if (!busId || !routeId || !departureTime || !arrivalTime) {
    return res.status(400).json({
      success: false,
      message: 'Please fill in all required fields (BusID, RouteID, DepartureTime, ArrivalTime).'
    });
  }

  try {
    // 1. Verify bus exists
    const [busRows] = await pool.query('SELECT Status FROM Bus WHERE BusID = ?', [busId]);
    if (busRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'The selected bus does not exist.'
      });
    }

    // 2. Verify route exists
    const [routeRows] = await pool.query('SELECT RouteID FROM Route WHERE RouteID = ?', [routeId]);
    if (routeRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'The selected route does not exist.'
      });
    }

    // 3. Insert Schedule
    const scheduleStatus = status || 'Active';
    const [result] = await pool.query(
      'INSERT INTO Schedule (BusID, RouteID, DepartureTime, ArrivalTime, Status) VALUES (?, ?, ?, ?, ?)',
      [busId, routeId, departureTime, arrivalTime, scheduleStatus]
    );

    return res.status(201).json({
      success: true,
      message: 'Schedule successfully created.',
      scheduleId: result.insertId
    });
  } catch (error) {
    console.error('[Schedule Create Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create schedule.'
    });
  }
};

// Update an existing schedule
exports.updateSchedule = async (req, res) => {
  const { id } = req.params;
  const { busId, routeId, departureTime, arrivalTime, status } = req.body;

  if (!busId || !routeId || !departureTime || !arrivalTime || !status) {
    return res.status(400).json({
      success: false,
      message: 'Please fill in all required fields (BusID, RouteID, DepartureTime, ArrivalTime, Status).'
    });
  }

  try {
    // 1. Verify schedule exists
    const [scheduleRows] = await pool.query('SELECT ScheduleID FROM Schedule WHERE ScheduleID = ?', [id]);
    if (scheduleRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found.'
      });
    }

    // 2. Verify bus exists
    const [busRows] = await pool.query('SELECT Status FROM Bus WHERE BusID = ?', [busId]);
    if (busRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'The selected bus does not exist.'
      });
    }

    // 3. Verify route exists
    const [routeRows] = await pool.query('SELECT RouteID FROM Route WHERE RouteID = ?', [routeId]);
    if (routeRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'The selected route does not exist.'
      });
    }

    // 4. Update
    await pool.query(
      'UPDATE Schedule SET BusID = ?, RouteID = ?, DepartureTime = ?, ArrivalTime = ?, Status = ? WHERE ScheduleID = ?',
      [busId, routeId, departureTime, arrivalTime, status, id]
    );

    return res.status(200).json({
      success: true,
      message: 'Schedule details updated successfully.'
    });
  } catch (error) {
    console.error('[Schedule Update Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update schedule details.'
    });
  }
};

// Delete a schedule
exports.deleteSchedule = async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await pool.query('SELECT ScheduleID FROM Schedule WHERE ScheduleID = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found.'
      });
    }

    await pool.query('DELETE FROM Schedule WHERE ScheduleID = ?', [id]);
    return res.status(200).json({
      success: true,
      message: 'Schedule deleted successfully.'
    });
  } catch (error) {
    console.error('[Schedule Delete Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete schedule.'
    });
  }
};
