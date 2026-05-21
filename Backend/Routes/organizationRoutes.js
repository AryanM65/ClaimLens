import express from 'express';
import {
  registerOrganization,
  verifyOrganization,
  getOrganizations,
  getOrganizationById,
} from '../Controllers/organizationController.js';
import { protect, admin } from '../Middlewares/authMiddleware.js';

const router = express.Router();

// Public: Register a new organization (before any user signs up)
// Admin: Get all registered organizations
router.route('/')
  .post(registerOrganization)
  .get(protect, admin, getOrganizations);

// Public: Get a single organization's profile by ID
router.get('/:id', getOrganizationById);

// Admin: Verify an organization (allows them to file disputes)
router.put('/:id/verify', protect, admin, verifyOrganization);

export default router;
