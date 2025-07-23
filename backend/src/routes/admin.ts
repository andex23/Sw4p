import express from 'express';
import { isAdmin } from '../middleware/isAdmin';
import {
  getDeposits,
  approveDeposit,
  rejectDeposit,
  getDepositIntent,
  getAdminStats
} from '../controllers/admin';

const router: express.Router = express.Router();

// All admin routes require admin authentication
router.use(isAdmin);

// Get all deposit intents for admin review
router.get('/deposits', getDeposits);

// Get specific deposit intent details
router.get('/deposits/:id', getDepositIntent);

// Approve a deposit intent
router.post('/deposits/:intentId/approve', approveDeposit);

// Reject a deposit intent
router.post('/deposits/:intentId/reject', rejectDeposit);

// Get admin dashboard statistics
router.get('/stats', getAdminStats);

export default router; 