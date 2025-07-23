import { Request, Response } from 'express';
import { getDatabaseClient } from '../services/database';
import { createApiError, asyncHandler } from '../middleware/errorHandler';
import { isAdmin } from '../middleware/isAdmin';

/**
 * Get all deposit intents
 * GET /api/admin/deposits
 */
export const getDeposits = asyncHandler(async (req: Request, res: Response) => {
  const db = getDatabaseClient();
  const deposits = await db.depositIntent.findMany({
    orderBy: { createdAt: 'desc' }
  });

  res.status(200).json({
    success: true,
    data: deposits
  });
});

/**
 * Approve a deposit intent
 * POST /api/admin/deposits/:intentId/approve
 */
export const approveDeposit = asyncHandler(async (req: Request, res: Response) => {
  const { intentId } = req.params;

  const db = getDatabaseClient();
  const deposit = await db.depositIntent.findUnique({
    where: { id: intentId }
  });

  if (!deposit) {
    throw createApiError('Deposit intent not found', 404, 'NOT_FOUND');
  }

  if (deposit.status !== 'CONFIRMED') {
    throw createApiError(
      'Cannot approve deposit that is not confirmed',
      400,
      'INVALID_STATUS',
      { currentStatus: deposit.status }
    );
  }

  const updatedDeposit = await db.depositIntent.update({
    where: { id: intentId },
    data: {
      status: 'APPROVED',
      updatedAt: new Date()
    }
  });

  res.status(200).json({
    success: true,
    data: updatedDeposit,
    message: 'Deposit approved successfully'
  });
});

/**
 * Reject a deposit intent
 * POST /api/admin/deposits/:intentId/reject
 */
export const rejectDeposit = asyncHandler(async (req: Request, res: Response) => {
  const { intentId } = req.params;
  const { reason } = req.body;

  if (!reason) {
    throw createApiError(
      'Rejection reason is required',
      400,
      'VALIDATION_ERROR'
    );
  }

  const db = getDatabaseClient();
  const deposit = await db.depositIntent.findUnique({
    where: { id: intentId }
  });

  if (!deposit) {
    throw createApiError('Deposit intent not found', 404, 'NOT_FOUND');
  }

  if (deposit.status !== 'CONFIRMED') {
    throw createApiError(
      'Cannot reject deposit that is not confirmed',
      400,
      'INVALID_STATUS',
      { currentStatus: deposit.status }
    );
  }

  const updatedDeposit = await db.depositIntent.update({
    where: { id: intentId },
    data: {
      status: 'REJECTED',
      rejectionReason: reason,
      updatedAt: new Date()
    }
  });

  res.status(200).json({
    success: true,
    data: updatedDeposit,
    message: 'Deposit rejected successfully'
  });
});

/**
 * Get deposit intent details
 * GET /api/admin/deposits/:id
 */
export const getDepositIntent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabaseClient();

  const depositIntent = await db.depositIntent.findUnique({
    where: { id }
  });

  if (!depositIntent) {
    throw createApiError('Deposit intent not found', 404, 'NOT_FOUND');
  }

  res.json({
    success: true,
    data: depositIntent
  });
});

/**
 * Get admin dashboard statistics
 * GET /api/admin/stats
 */
export const getAdminStats = asyncHandler(async (req: Request, res: Response) => {
  const db = getDatabaseClient();

  const [pending, approved, rejected, total] = await Promise.all([
    db.depositIntent.count({ where: { status: 'PENDING' } }),
    db.depositIntent.count({ where: { status: 'APPROVED' } }),
    db.depositIntent.count({ where: { status: 'REJECTED' } }),
    db.depositIntent.count()
  ]);

  res.json({
    success: true,
    data: {
      deposits: {
        pending,
        approved,
        rejected,
        total
      }
    }
  });
}); 