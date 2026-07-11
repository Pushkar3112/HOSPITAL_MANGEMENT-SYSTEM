const express = require('express');
const router = express.Router();
const {
    getAllUsers, getUserById, toggleUserStatus, verifyDoctor,
    getDashboardStats, getAllAppointments, deleteUser,
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// All routes require ADMIN role
router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserById);
router.patch('/users/:userId/toggle-status', toggleUserStatus);
router.delete('/users/:userId', deleteUser);
router.patch('/doctors/:doctorId/verify', verifyDoctor);
router.get('/appointments', getAllAppointments);

module.exports = router;
