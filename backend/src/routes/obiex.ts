import { Router, type IRouter } from 'express';
import * as obiexController from '../controllers/obiex';

const router: IRouter = Router();

/**
 * Quote endpoints
 */
router.post('/quote', obiexController.createQuote);

/**
 * Trade endpoints
 */
router.post('/trade', obiexController.executeTrade);

/**
 * Deposit endpoints
 */
router.post('/deposit-address', obiexController.generateDepositAddress);
router.get('/deposit-status/:intentId', obiexController.getDepositStatus);

/**
 * Withdrawal endpoints
 * NOTE: Consider adding authentication/authorization middleware
 */
router.post('/withdraw', obiexController.processWithdrawal);

/**
 * Status and health check endpoints
 */
router.get('/status', obiexController.getStatus);
router.get('/health', obiexController.healthCheck);

export default router; 