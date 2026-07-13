const { pool } = require('../config/db');

// Get all buses (with search & status filters)
exports.getAllBuses = async (req, res) => {
  const { search, status } = req.query;
  let sql = 'SELECT * FROM Bus WHERE 1=1';
  const params = [];

  if (search) {
    sql += ' AND (BusNumber LIKE ? OR DriverName LIKE ? OR BusType LIKE ?)';
    const searchWildcard = `%${search}%`;
    params.push(searchWildcard, searchWildcard, searchWildcard);
  }

  if (status) {
    sql += ' AND Status = ?';
    params.push(status);
  }

  sql += ' ORDER BY BusID DESC';

  try {
    const [rows] = await pool.query(sql, params);
    return res.status(200).json({
      success: true,
      buses: rows
    });
  } catch (error) {
    console.error('[Bus Get All Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve buses.'
    });
  }
};

// Get single bus by ID
exports.getBusById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query('SELECT * FROM Bus WHERE BusID = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found.'
      });
    }

    return res.status(200).json({
      success: true,
      bus: rows[0]
    });
  } catch (error) {
    console.error('[Bus Get By ID Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve bus details.'
    });
  }
};

// Create a new bus
exports.createBus = async (req, res) => {
  const { busNumber, driverName, driverContact, capacity, busType, status } = req.body;

  // Validation
  if (!busNumber || !driverName || !driverContact || !capacity || !busType) {
    return res.status(400).json({
      success: false,
      message: 'Please fill in all required fields (BusNumber, DriverName, DriverContact, Capacity, BusType).'
    });
  }

  try {
    // Check if BusNumber already exists
    const [existing] = await pool.query('SELECT BusID FROM Bus WHERE BusNumber = ?', [busNumber]);
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Bus number ${busNumber} is already registered.`
      });
    }

    const busStatus = status || 'Active';
    const [result] = await pool.query(
      'INSERT INTO Bus (BusNumber, DriverName, DriverContact, Capacity, BusType, Status) VALUES (?, ?, ?, ?, ?, ?)',
      [busNumber, driverName, driverContact, capacity, busType, busStatus]
    );

    return res.status(201).json({
      success: true,
      message: 'Bus successfully added.',
      busId: result.insertId
    });
  } catch (error) {
    console.error('[Bus Create Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add new bus.'
    });
  }
};

// Update an existing bus
exports.updateBus = async (req, res) => {
  const { id } = req.params;
  const { busNumber, driverName, driverContact, capacity, busType, status } = req.body;

  if (!busNumber || !driverName || !driverContact || !capacity || !busType || !status) {
    return res.status(400).json({
      success: false,
      message: 'Please fill in all required fields (BusNumber, DriverName, DriverContact, Capacity, BusType, Status).'
    });
  }

  try {
    // Check if bus exists
    const [existingBus] = await pool.query('SELECT BusID FROM Bus WHERE BusID = ?', [id]);
    if (existingBus.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found.'
      });
    }

    // Check if BusNumber is taken by another bus
    const [existingNumber] = await pool.query('SELECT BusID FROM Bus WHERE BusNumber = ? AND BusID != ?', [busNumber, id]);
    if (existingNumber.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Bus number ${busNumber} is already in use by another bus.`
      });
    }

    await pool.query(
      'UPDATE Bus SET BusNumber = ?, DriverName = ?, DriverContact = ?, Capacity = ?, BusType = ?, Status = ? WHERE BusID = ?',
      [busNumber, driverName, driverContact, capacity, busType, status, id]
    );

    return res.status(200).json({
      success: true,
      message: 'Bus details updated successfully.'
    });
  } catch (error) {
    console.error('[Bus Update Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update bus details.'
    });
  }
};

// Delete a bus
exports.deleteBus = async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await pool.query('SELECT BusID FROM Bus WHERE BusID = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found.'
      });
    }

    await pool.query('DELETE FROM Bus WHERE BusID = ?', [id]);
    return res.status(200).json({
      success: true,
      message: 'Bus deleted successfully.'
    });
  } catch (error) {
    console.error('[Bus Delete Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete bus. It might be associated with an active schedule.'
    });
  }
};
