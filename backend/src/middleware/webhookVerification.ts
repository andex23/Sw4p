import { Request, Response, NextFunction } from 'express';
import { createHmac } from 'crypto';

const SIGNATURE_SECRET = process.env.OBIEX_SIGNATURE_SECRET || '04a7c82687de2ab1b5c319b89cfe3570a672c546cafdbef124e58c2919170182';

export const verifyWebhookSignature = (req: Request, res: Response, next: NextFunction): Response | void => {
  const signature = req.headers['x-obiex-signature'];
  
  if (!signature || typeof signature !== 'string') {
    console.log('Missing x-obiex-signature header in webhook request');
    return res.status(401).json({ error: 'Missing signature' });
  }

  // Get raw body from the request (added by express.raw() middleware)
  const rawBody = req.body.toString();
  
  // Calculate HMAC SHA512 signature
  const computedSignature = createHmac('sha512', SIGNATURE_SECRET)
    .update(rawBody)
    .digest('hex');

  // Debug signature verification
  console.log('Webhook signature verification:', {
    received: signature,
    computed: computedSignature,
    bodyLength: rawBody.length
  });

  // Compare signatures
  if (signature !== computedSignature) {
    console.log('Webhook signature verification failed', {
      received: signature,
      computed: computedSignature,
      bodyLength: rawBody.length
    });
    return res.status(401).json({ error: 'Invalid signature' });
  }

  console.log('✅ Webhook signature verified successfully');
  next();
}; 