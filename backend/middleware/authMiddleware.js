const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. Authorization token missing.' 
    });
  }

  // Expecting format: Bearer <token>
  const tokenParts = authHeader.split(' ');
  if (tokenParts[0] !== 'Bearer' || !tokenParts[1]) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid authorization format. Use Bearer <token>.' 
    });
  }

  const token = tokenParts[1];

  try {
    const secret = process.env.JWT_SECRET || 'smart_bus_secret_key_2026_poppins';
    const decoded = jwt.verify(token, secret);
    
    // Attach decoded admin details to the request object
    req.admin = {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Session expired or invalid token. Please log in again.' 
    });
  }
};
