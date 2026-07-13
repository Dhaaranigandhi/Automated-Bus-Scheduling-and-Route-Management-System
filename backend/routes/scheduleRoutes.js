const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes (for passenger search & timetables)
router.get('/', scheduleController.getAllSchedules);
router.get('/:id', scheduleController.getScheduleById);

// Protected routes (admin privileges required)
router.post('/', authMiddleware, scheduleController.createSchedule);
router.put('/:id', authMiddleware, scheduleController.updateSchedule);
router.delete('/:id', authMiddleware, scheduleController.deleteSchedule);

module.exports = router;
