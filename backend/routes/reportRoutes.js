const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

// Protected route (only logged in admins should see stats)
router.get('/dashboard-stats', authMiddleware, reportController.getDashboardStats);

module.exports = router;
