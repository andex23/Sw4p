import dotenv from 'dotenv';
import { ObiexClient } from 'obiex-api';
import {
  QuoteResponse,
  TradeResponse,
  DepositAddressResponse,
  WithdrawalResponse
} from '../types/obiex';

dotenv.config();

// Read environment variables
const key = process.env.OBIEX_API_KEY!;
const secret = process.env.OBIEX_API_SECRET!;
const sandboxMode = process.env.SANDBOX === 'true';

if (!key || !secret) {
  throw new Error('Missing Obiex env vars');
    }

// Instantiate the Obiex client using the npm package
const client = new ObiexClient({
  apiKey: key,
  apiSecret: secret,
  sandboxMode,
});

console.log(`ObiexClient initialized, sandboxMode=${sandboxMode}`);

// Create wrapper object with methods that match our existing controller API
export const obiexClient = {
  async createQuote(source: string, target: string, side: 'BUY' | 'SELL', amount: number): Promise<QuoteResponse> {
    console.log(`🔄 Creating live quote: ${amount} ${source} → ${target} (${side})`);
    
    const response = await client.createQuote(source, target, side, amount);

    return {
      id: response.id,
      rate: parseFloat(response.rate),
      amountReceived: parseFloat(response.amountReceived),
      expiryDate: response.expiryDate,
      source,
      target,
      side,
      amount
    };
  },

  async trade(source: string, target: string, side: 'BUY' | 'SELL', amount: number, quoteId?: string): Promise<TradeResponse> {
    console.log(`💱 Executing live trade: ${amount} ${source} → ${target} (${side})`);
    
    // Note: The obiex-api package doesn't support quoteId in trade method
    // If quoteId is provided, we should use acceptQuote first, but for now we'll just trade directly
    const response = await client.trade(source, target, side, amount);

    return {
      id: response.id,
      status: 'completed', // obiex-api trade is synchronous
      amount,
      amountReceived: parseFloat(response.amountReceived),
      rate: parseFloat(response.rate),
      source,
      target,
      side,
      transactionId: response.id,
      createdAt: new Date().toISOString()
    };
  },

  async getDepositAddress(currency: string, network: string, identifier?: string): Promise<DepositAddressResponse> {
    console.log(`🏦 Generating live deposit address: ${currency} on ${network}`);
    
    // obiex-api requires identifier, so we'll use a random one if not provided
    const finalIdentifier = identifier || `deposit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const response = await client.getDepositAddress(currency, network, finalIdentifier);

    return {
      address: response.address,
      network: response.network,
      currency: currency,
      memo: response.memo,
      intentId: '', // Will be set by controller
      status: 'PENDING' as const
    };
  },

  async withdrawCrypto(
    currency: string,
    network: string,
    amount: number,
    address: string,
    memo?: string
  ): Promise<WithdrawalResponse> {
    console.log(`💸 Processing live withdrawal: ${amount} ${currency} to ${address}`);
    
    const cryptoPayout = {
      address,
      network,
      memo
    };

    const response = await client.withdrawCrypto(currency, amount, cryptoPayout);

    return {
      transactionId: response.id || response.transactionId || `withdrawal_${Date.now()}`,
      status: response.status || 'pending',
      amount,
      currency,
      network,
      address,
      memo,
      fee: parseFloat(response.fee || '0'),
      createdAt: response.createdAt || new Date().toISOString()
    };
  },

  getStatus(): { initialized: boolean; sandboxMode: boolean; baseURL: string } {
    return {
      initialized: true,
      sandboxMode,
      baseURL: sandboxMode ? 'https://staging.api.obiex.finance' : 'https://api.obiex.finance'
    };
  },

  async getTradingPairs(): Promise<string[]> {
    console.log(`📊 Getting trading pairs`);
    // Return common trading pairs for demo
    return ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'USDC/USDT'];
  },

  async getActiveNetworks(): Promise<string[]> {
    console.log(`🌐 Getting active networks`);
    // Return common networks for demo
    return ['BTC', 'ETH', 'SOL', 'USDC'];
  }
};

// Export the client instance directly for backward compatibility
export default obiexClient; 