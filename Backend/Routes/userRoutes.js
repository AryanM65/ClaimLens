import express from 'express';
import multer from 'multer';
import { 
  getUserProfile, 
  updateUserProfile, 
  getUsers, 
  getUserHistory, 
  banUser,
  uploadProfilePicture 
} from '../Controllers/userController.js';
import { protect, admin } from '../Middlewares/authMiddleware.js';

const router = express.Router();

// Multer memory storage configuration
const upload = multer({ storage: multer.memoryStorage() });

// Get the logged in user's profile
router.get('/profile', protect, getUserProfile);

// Update the logged in user's profile
router.put('/profile', protect, updateUserProfile);

// Upload profile picture to Cloudinary
router.post('/profile-picture', protect, upload.single('profilePicture'), uploadProfilePicture);

// Get user's personal analyzed reports history
router.get('/history', protect, getUserHistory);

// Get all users (Admin only)
router.get('/', protect, admin, getUsers);

// Ban or unban a user by ID (Admin only)
router.put('/:id/ban', protect, admin, banUser);

export default router;

