import express from 'express';
import { 
  createDispute, 
  getUserDisputes, 
  getDisputesByReport, 
  getAllDisputes, 
  resolveDispute 
} from '../Controllers/disputeController.js';
import { protect, admin } from '../Middlewares/authMiddleware.js';

const router = express.Router();

// Private: POST a new claim dispute
router.post('/create-dispute', protect, createDispute);

// Private: GET all disputes submitted by the logged-in user
router.get('/get-user-disputes', protect, getUserDisputes);

// Private/Admin: GET all disputes filed against a specific ad report
router.get('/report/:reportId', protect, admin, getDisputesByReport);

// Private/Admin: GET all disputes globally across the platform
router.get('/admin/all', protect, admin, getAllDisputes);

// Private/Admin: PUT resolve or reject a claim dispute
router.put('/:id/resolve', protect, admin, resolveDispute);

export default router;
