import express from 'express';
import { getUserProfile, getUsers } from '../Controllers/userController.js';
import { protect, admin } from '../Middlewares/authMiddleware.js';

const router = express.Router();

// Get the logged in user's profile
// Requires valid JWT token
router.get('/profile', protect, getUserProfile);

// Get all users
// Requires valid JWT token AND 'admin' role
router.get('/', protect, admin, getUsers);

export default router;
