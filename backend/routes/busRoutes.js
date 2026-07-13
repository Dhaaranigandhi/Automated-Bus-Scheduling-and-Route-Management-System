const express = require('express');
const router = express.Router();
const busController = require('../controllers/busController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes (for passenger search & admin lookup)
router.get('/', busController.getAllBuses);
router.get('/:id', busController.getBusById);

// Protected routes (admin privileges required)
router.post('/', authMiddleware, busController.createBus);
router.put('/:id', authMiddleware, busController.updateBus);
router.delete('/:id', authMiddleware, busController.deleteBus);

module.exports = router;
