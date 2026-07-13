const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes (for passenger search & admin lookup)
router.get('/', routeController.getAllRoutes);
router.get('/:id', routeController.getRouteById);

// Protected routes (admin privileges required)
router.post('/', authMiddleware, routeController.createRoute);
router.put('/:id', authMiddleware, routeController.updateRoute);
router.delete('/:id', authMiddleware, routeController.deleteRoute);

module.exports = router;
