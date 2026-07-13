const { pool } = require('../config/db');

// Get all routes (with optional search)
exports.getAllRoutes = async (req, res) => {
  const { search } = req.query;
  let sql = 'SELECT * FROM Route WHERE 1=1';
  const params = [];

  if (search) {
    sql += ' AND (Source LIKE ? OR Destination LIKE ?)';
    const searchWildcard = `%${search}%`;
    params.push(searchWildcard, searchWildcard);
  }

  sql += ' ORDER BY RouteID DESC';

  try {
    const [rows] = await pool.query(sql, params);
    return res.status(200).json({
      success: true,
      routes: rows
    });
  } catch (error) {
    console.error('[Route Get All Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve routes.'
    });
  }
};

// Get single route by ID
exports.getRouteById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query('SELECT * FROM Route WHERE RouteID = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Route not found.'
      });
    }

    return res.status(200).json({
      success: true,
      route: rows[0]
    });
  } catch (error) {
    console.error('[Route Get By ID Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve route details.'
    });
  }
};

// Create a new route
exports.createRoute = async (req, res) => {
  const { source, destination, distance } = req.body;

  // Validation
  if (!source || !destination || distance === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Please fill in all required fields (Source, Destination, Distance).'
    });
  }

  if (isNaN(parseFloat(distance)) || parseFloat(distance) <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Distance must be a positive number.'
    });
  }

  try {
    // Check duplicate route (same source and destination)
    const [existing] = await pool.query(
      'SELECT RouteID FROM Route WHERE Source = ? AND Destination = ?',
      [source, destination]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `A route from "${source}" to "${destination}" already exists.`
      });
    }

    const [result] = await pool.query(
      'INSERT INTO Route (Source, Destination, Distance) VALUES (?, ?, ?)',
      [source, destination, parseFloat(distance)]
    );

    return res.status(201).json({
      success: true,
      message: 'Route successfully added.',
      routeId: result.insertId
    });
  } catch (error) {
    console.error('[Route Create Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add new route.'
    });
  }
};

// Update an existing route
exports.updateRoute = async (req, res) => {
  const { id } = req.params;
  const { source, destination, distance } = req.body;

  if (!source || !destination || distance === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Please fill in all required fields (Source, Destination, Distance).'
    });
  }

  if (isNaN(parseFloat(distance)) || parseFloat(distance) <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Distance must be a positive number.'
    });
  }

  try {
    // Check if route exists
    const [existingRoute] = await pool.query('SELECT RouteID FROM Route WHERE RouteID = ?', [id]);
    if (existingRoute.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Route not found.'
      });
    }

    // Check duplicate route for another ID
    const [duplicate] = await pool.query(
      'SELECT RouteID FROM Route WHERE Source = ? AND Destination = ? AND RouteID != ?',
      [source, destination, id]
    );

    if (duplicate.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Another route from "${source}" to "${destination}" already exists.`
      });
    }

    await pool.query(
      'UPDATE Route SET Source = ?, Destination = ?, Distance = ? WHERE RouteID = ?',
      [source, destination, parseFloat(distance), id]
    );

    return res.status(200).json({
      success: true,
      message: 'Route details updated successfully.'
    });
  } catch (error) {
    console.error('[Route Update Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update route details.'
    });
  }
};

// Delete a route
exports.deleteRoute = async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await pool.query('SELECT RouteID FROM Route WHERE RouteID = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Route not found.'
      });
    }

    await pool.query('DELETE FROM Route WHERE RouteID = ?', [id]);
    return res.status(200).json({
      success: true,
      message: 'Route deleted successfully.'
    });
  } catch (error) {
    console.error('[Route Delete Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete route. It might be linked to an active schedule.'
    });
  }
};
