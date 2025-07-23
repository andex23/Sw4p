import { Router, Request, Response } from 'express';
import { verifyWebhookSignature } from '../middleware/webhookVerification';

const router: Router = Router();

/**
 * Webhook endpoint for Obiex notifications
 */
router.post('/obiex', verifyWebhookSignature, (req: Request, res: Response) => {
  const event = JSON.parse(req.body.toString());
  
  console.log('📨 Received Obiex webhook:', event);

  if (event.type === 'DEPOSIT') {
    console.log('💰 Processing deposit webhook:', {
      hash: event.hash,
      currency: event.currency,
      amount: event.amount,
      status: event.status,
      address: event.address,
      reference: event.reference
    });

    if (event.status === 'CONFIRMED') {
      console.log('✅ Deposit confirmed:', {
        amount: `${event.amount} ${event.currency}`,
        address: event.address,
        txHash: event.hash,
        reference: event.reference
      });
    }
  }

  res.json({ received: true });
});

export default router; 