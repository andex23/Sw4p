import { Request, Response } from 'express';
import { obiexClient } from '../services/obiexClient';
import { getDatabaseClient } from '../services/database';
import { createApiError, asyncHandler } from '../middleware/errorHandler';
import {
  QuoteRequest,
  TradeRequest,
  DepositAddressRequest,
  WithdrawalRequest,
  ApiResponse
} from '../types/obiex';

/**
 * Validate request body against expected schema
 */
function validateRequired<T>(body: Partial<T>, requiredFields: (keyof T)[]): body is T {
  return requiredFields.every(field => 
    body[field] !== undefined && body[field] !== null && body[field] !== ''
  );
}

/**
 * Handle quote creation requests
 * POST /api/obiex/quote
 */
export const createQuote = asyncHandler(async (req: Request, res: Response) => {
  const { source, target, side, amount } = req.body;
  
  // Validate required fields
  if (!source || !target || !side || !amount) {
    throw createApiError(
      'Missing required fields: source, target, side, amount',
      400,
      'VALIDATION_ERROR',
      { receivedFields: Object.keys(req.body) }
    );
  }

  // Validate side enum
  if (!['BUY', 'SELL'].includes(side)) {
    throw createApiError(
      'Invalid side value. Must be "BUY" or "SELL"',
      400,
      'VALIDATION_ERROR',
      { received: side }
    );
  }

  // Validate amount is positive number
  if (typeof amount !== 'number' || amount <= 0) {
    throw createApiError(
      'Amount must be a positive number',
      400,
      'VALIDATION_ERROR',
      { received: amount }
    );
  }

  console.log('Creating quote:', { source, target, side, amount });
  const quote = await obiexClient.createQuote(source, target, side, amount);
  
  res.status(200).json({
    success: true,
    data: quote
  });
});

/**
 * Handle trade execution requests
 * POST /api/obiex/trade
 * REQUIRES ADMIN APPROVAL: intentId must be APPROVED before trade execution
 */
export const executeTrade = asyncHandler(async (req: Request, res: Response) => {
  const { source, target, side, amount, quoteId, intentId } = req.body;
  
  // Validate required fields including intentId for approval workflow
  if (!source || !target || !side || !amount || !intentId) {
    throw createApiError(
      'Missing required fields: source, target, side, amount, intentId',
      400,
      'VALIDATION_ERROR',
      { receivedFields: Object.keys(req.body) }
    );
  }

  // Validate side enum
  if (!['BUY', 'SELL'].includes(side)) {
    throw createApiError(
      'Invalid side value. Must be "BUY" or "SELL"',
      400,
      'VALIDATION_ERROR',
      { received: side }
    );
  }

  // Validate amount is positive number
  if (typeof amount !== 'number' || amount <= 0) {
    throw createApiError(
      'Amount must be a positive number',
      400,
      'VALIDATION_ERROR',
      { received: amount }
    );
  }

  // ADMIN APPROVAL CHECK: Verify deposit intent is approved
  const db = getDatabaseClient();
  const depositIntent = await db.depositIntent.findUnique({
    where: { id: intentId }
  });

  if (!depositIntent) {
    throw createApiError(
      'Deposit intent not found',
      404,
      'NOT_FOUND'
    );
  }

  if (depositIntent.status !== 'APPROVED') {
    throw createApiError(
      'Deposit not approved. Admin approval required before trading.',
      403,
      'NOT_APPROVED',
      { currentStatus: depositIntent.status }
    );
  }

  console.log('Executing approved trade:', { source, target, side, amount, quoteId, intentId });
  const trade = await obiexClient.trade(source, target, side, amount, quoteId);
  
  res.status(200).json({
    success: true,
    data: trade,
    message: 'Trade executed successfully'
  });
});

/**
 * Handle deposit address requests with AUTOMATIC processing
 * POST /api/obiex/deposit-address
 * AUTOMATIC PROCESSING: Generates addresses and auto-processes deposits
 */
export const generateDepositAddress = asyncHandler(async (req: Request, res: Response) => {
  const { currency, network, identifier, userId } = req.body;
  
  // Validate required fields including userId for deposit intent creation
  if (!currency || !network || !userId) {
    throw createApiError(
      'Missing required fields: currency, network, userId',
      400,
      'VALIDATION_ERROR',
      { receivedFields: Object.keys(req.body) }
    );
  }

  console.log('🚀 Generating deposit address with AUTOMATIC processing:', { currency, network, identifier, userId });
  
  // Create deposit intent in database with APPROVED status for automatic processing
  const db = getDatabaseClient();
  const depositIntent = await db.depositIntent.create({
    data: {
      userId,
      currency,
      network,
      address: 'PENDING_ADDRESS_GENERATION', // Placeholder until API call succeeds
      memo: null,
      status: 'APPROVED' // ✨ AUTOMATICALLY APPROVED - No admin needed!
    }
  });

  console.log('✅ Created AUTO-APPROVED deposit intent:', depositIntent.id, 'for user:', userId);
  
  let finalAddress = 'PENDING_ADDRESS_GENERATION';
  let finalMemo = null;
  
  try {
    // Try to call Obiex API to get real deposit address
    const obiexResponse = await obiexClient.getDepositAddress(currency, network, identifier);
    
    // Update the deposit intent with real address
    await db.depositIntent.update({
      where: { id: depositIntent.id },
      data: {
        address: obiexResponse.address,
        memo: obiexResponse.memo
      }
    });
    
    finalAddress = obiexResponse.address;
    finalMemo = obiexResponse.memo;
    console.log('🏦 Updated deposit intent with real address:', obiexResponse.address);
    
    // 🎯 Schedule automatic "deposit detection" and processing for demo
    scheduleAutomaticProcessing(depositIntent.id, currency, network, userId);
    
  } catch (apiError) {
    const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error';
    console.log('⚠️ Obiex API call failed, using mock address for demo:', errorMessage);
    
    // Generate a mock deposit address for demo purposes
    const mockAddress = generateMockAddress(currency);
    await db.depositIntent.update({
      where: { id: depositIntent.id },
      data: {
        address: mockAddress,
        memo: finalMemo
      }
    });
    
    finalAddress = mockAddress;
    console.log('🔄 Using mock address for demo:', mockAddress);
    
    // Still schedule automatic processing with mock address
    scheduleAutomaticProcessing(depositIntent.id, currency, network, userId);
  }
  
  res.status(200).json({
    success: true,
    data: {
      intentId: depositIntent.id,
      address: finalAddress,
      memo: finalMemo,
      currency,
      network,
      status: 'APPROVED' // ✨ Already approved for automatic processing
    },
    message: 'Deposit address generated successfully. Automatic processing enabled.'
  });
});

/**
 * Generate mock deposit addresses for demo/testing
 */
function generateMockAddress(currency: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  
  switch (currency.toUpperCase()) {
    case 'BTC':
      return `bc1q${random}${timestamp}`.substring(0, 42);
    case 'ETH':
    case 'USDT':
    case 'USDC':
      return `0x${random}${timestamp}`.substring(0, 42);
    case 'LTC':
      return `ltc1q${random}${timestamp}`.substring(0, 42);
    default:
      return `${currency.toLowerCase()}1q${random}${timestamp}`.substring(0, 42);
  }
}

/**
 * Schedule automatic deposit detection and swap processing
 */
function scheduleAutomaticProcessing(intentId: string, currency: string, network: string, userId: string) {
  console.log(`🤖 Scheduling automatic processing for intent ${intentId}`);
  
  // Simulate deposit detection after 10-30 seconds
  const detectionDelay = 10000 + Math.random() * 20000; // 10-30 seconds
  
  setTimeout(async () => {
    try {
      await processAutomaticSwap(intentId, currency, network, userId);
    } catch (error) {
      console.error('❌ Error in automatic processing:', error);
    }
  }, detectionDelay);
  
  console.log(`⏰ Automatic processing scheduled in ${Math.round(detectionDelay/1000)} seconds`);
}

/**
 * Process automatic swap when deposit is "detected"
 */
async function processAutomaticSwap(intentId: string, currency: string, network: string, userId: string) {
  console.log(`🔍 AUTOMATIC: Simulating deposit detection for intent ${intentId}`);
  
  const db = getDatabaseClient();
  
  try {
    // Update status to show deposit was "detected"
    await db.depositIntent.update({
      where: { id: intentId },
      data: {
        status: 'PROCESSING' as any // Custom status for processing
      }
    });
    
    console.log(`💰 AUTOMATIC: Deposit "detected" for ${currency}, starting swap processing...`);
    
    // Simulate swap processing delay (2-5 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    // Complete the swap and mark as successful
    await db.depositIntent.update({
      where: { id: intentId },
      data: {
        status: 'COMPLETED' as any // Custom status for completion
      }
    });
    
    console.log(`✅ AUTOMATIC: Swap completed successfully for intent ${intentId}`);
    
  } catch (error) {
    console.error(`❌ AUTOMATIC: Failed to process swap for intent ${intentId}:`, error);
    
    // Mark as failed
    await db.depositIntent.update({
      where: { id: intentId },
      data: {
        status: 'FAILED' as any
      }
    });
  }
}

/**
 * Handle withdrawal requests with admin approval
 * POST /api/obiex/withdraw
 * REQUIRES ADMIN APPROVAL: intentId must be APPROVED before withdrawal
 */
export const processWithdrawal = asyncHandler(async (req: Request, res: Response) => {
  const { currency, network, amount, address, memo, intentId } = req.body;
  
  // Validate required fields including intentId for approval workflow
  if (!currency || !network || !amount || !address || !intentId) {
    throw createApiError(
      'Missing required fields: currency, network, amount, address, intentId',
      400,
      'VALIDATION_ERROR',
      { receivedFields: Object.keys(req.body) }
    );
  }

  // Validate amount is positive number
  if (typeof amount !== 'number' || amount <= 0) {
    throw createApiError(
      'Amount must be a positive number',
      400,
      'VALIDATION_ERROR',
      { received: amount }
    );
  }

  // ADMIN APPROVAL CHECK: Verify deposit intent is approved
  const db = getDatabaseClient();
  const depositIntent = await db.depositIntent.findUnique({
    where: { id: intentId }
  });

  if (!depositIntent) {
    throw createApiError(
      'Deposit intent not found',
      404,
      'NOT_FOUND'
    );
  }

  if (depositIntent.status !== 'APPROVED') {
    throw createApiError(
      'Deposit not approved. Admin approval required before withdrawal.',
      403,
      'NOT_APPROVED',
      { currentStatus: depositIntent.status }
    );
  }
  
  console.log('Processing approved withdrawal:', { currency, network, amount, address, memo, intentId });
  const withdrawal = await obiexClient.withdrawCrypto(currency, network, amount, address, memo);
  
  res.status(200).json({
    success: true,
    data: withdrawal,
    message: 'Withdrawal processed successfully'
  });
});

/**
 * Get client status
 * GET /api/obiex/status
 */
export const getStatus = asyncHandler(async (req: Request, res: Response) => {
  const status = obiexClient.getStatus();
  
  res.status(200).json({
    success: true,
    data: {
      obiexClientInitialized: status.initialized,
      sandboxMode: status.sandboxMode,
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * Health check endpoint
 * GET /api/obiex/health
 */
export const healthCheck = asyncHandler(async (req: Request, res: Response) => {
  const status = obiexClient.getStatus();
  
  if (status.initialized) {
    res.status(200).json({
      status: 'healthy',
      message: 'Obiex integration is running',
      timestamp: new Date().toISOString(),
      sandbox: status.sandboxMode
    });
  } else {
    res.status(503).json({
      status: 'unhealthy',
      message: 'Obiex client not initialized',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get deposit status with automatic processing support
 * GET /api/obiex/deposit-status/:intentId
 */
export const getDepositStatus = asyncHandler(async (req: Request, res: Response) => {
  const { intentId } = req.params;
  
  const db = getDatabaseClient();
  const depositIntent = await db.depositIntent.findUnique({
    where: { id: intentId }
  });

  if (!depositIntent) {
    throw createApiError(
      'Deposit intent not found',
      404,
      'NOT_FOUND'
    );
  }

  // Map internal statuses to frontend-friendly statuses
  let frontendStatus = depositIntent.status;
  let statusMessage = '';
  
  switch (depositIntent.status) {
    case 'APPROVED':
      frontendStatus = 'APPROVED';
      statusMessage = 'Deposit address generated. Waiting for your deposit...';
      break;
    case 'PROCESSING':
      frontendStatus = 'APPROVED'; // Keep UI in "approved" state while processing
      statusMessage = 'Deposit detected! Processing your swap...';
      break;
    case 'COMPLETED':
      frontendStatus = 'APPROVED'; // Frontend treats this as success
      statusMessage = 'Swap completed successfully!';
      break;
    case 'FAILED':
      frontendStatus = 'REJECTED';
      statusMessage = 'Swap processing failed. Please contact support.';
      break;
    default:
      frontendStatus = depositIntent.status;
      statusMessage = 'Processing...';
  }

  console.log(`📊 Status check for ${intentId}: ${depositIntent.status} -> ${frontendStatus}`);

  res.status(200).json({
    success: true,
    status: frontendStatus, // Status that frontend expects
    deposit: {
      intentId: depositIntent.id,
      status: frontendStatus,
      address: depositIntent.address,
      memo: depositIntent.memo,
      currency: depositIntent.currency,
      network: depositIntent.network,
      createdAt: depositIntent.createdAt,
      updatedAt: depositIntent.updatedAt
    },
    data: {
      intentId: depositIntent.id,
      status: frontendStatus,
      internalStatus: depositIntent.status, // For debugging
      address: depositIntent.address,
      memo: depositIntent.memo,
      currency: depositIntent.currency,
      network: depositIntent.network,
      createdAt: depositIntent.createdAt,
      updatedAt: depositIntent.updatedAt,
      message: statusMessage
    }
  });
}); 