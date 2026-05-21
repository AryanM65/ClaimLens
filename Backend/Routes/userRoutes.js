import express from 'express';
import { getUserProfile, getUsers, getUserHistory, banUser } from '../Controllers/userController.js';
import { protect, admin } from '../Middlewares/authMiddleware.js';

const router = express.Router();

// Get the logged in user's profile
router.get('/profile', protect, getUserProfile);

// Get user's personal analyzed reports history
router.get('/history', protect, getUserHistory);

// Get all users (Admin only)
router.get('/', protect, admin, getUsers);

// Ban or unban a user by ID (Admin only)
router.put('/:id/ban', protect, admin, banUser);

export default router;

