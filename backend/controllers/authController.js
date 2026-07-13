const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Admin Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please provide both email and password.' 
    });
  }

  try {
    // Check if admin exists
    const [rows] = await pool.query('SELECT * FROM Admin WHERE Email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password.' 
      });
    }

    const admin = rows[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, admin.Password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password.' 
      });
    }

    // Generate JWT
    const secret = process.env.JWT_SECRET || 'smart_bus_secret_key_2026_poppins';
    const token = jwt.sign(
      { id: admin.AdminID, name: admin.Name, email: admin.Email },
      secret,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      admin: {
        id: admin.AdminID,
        name: admin.Name,
        email: admin.Email
      }
    });
  } catch (error) {
    console.error('[Auth Error]', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error during login.' 
    });
  }
};

// Admin Profile Check
exports.getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT AdminID, Name, Email FROM Admin WHERE AdminID = ?', 
      [req.admin.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin profile not found.' 
      });
    }

    return res.status(200).json({
      success: true,
      admin: rows[0]
    });
  } catch (error) {
    console.error('[Profile Error]', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error retrieving profile.' 
    });
  }
};
