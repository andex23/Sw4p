// tests/obiex.e2e.test.ts

import "dotenv/config";
import { describe, test, expect, beforeAll } from 'vitest';
import obiexClient from '../backend/src/services/obiexClient';

/**
 * Live End-to-End Tests for Obiex API Integration
 * 
 * These tests make REAL API calls to Obiex servers using your credentials.
 * Ensure OBIEX_API_KEY and OBIEX_API_SECRET are set in .env
 * 
 * WARNING: These tests make real API calls that may affect your account.
 * Run with caution in production.
 */

const TEST_TIMEOUT = 60000; // 60 seconds for API calls (matches client timeout)

describe('🔥 Obiex Live API Integration Tests', () => {
  beforeAll(() => {
    // Verify environment variables are set
    if (!process.env.OBIEX_API_KEY || !process.env.OBIEX_API_SECRET) {
      throw new Error(
        'Missing required environment variables. Please set OBIEX_API_KEY and OBIEX_API_SECRET in .env file'
      );
    }

    console.log('🚀 Test Environment:', {
      baseURL: 'https://api.obiex.finance/v1',
      initialized: true
    });
  });

  test('✅ Client should be properly initialized', () => {
    expect(obiexClient).toBeDefined();
    expect(typeof obiexClient.getTradingPairs).toBe('function');
    expect(typeof obiexClient.getActiveNetworks).toBe('function');
    expect(typeof obiexClient.getDepositAddress).toBe('function');
    expect(typeof obiexClient.createQuote).toBe('function');
    expect(typeof obiexClient.trade).toBe('function');
    
    console.log('📊 Client Status:', {
      initialized: true,
      mode: 'production'
    });
  }, TEST_TIMEOUT);

  test('📊 Should fetch trading pairs successfully', async () => {
    const pairs = await obiexClient.getTradingPairs();
    
    expect(pairs).toBeDefined();
    expect(Array.isArray(pairs)).toBe(true);
    expect(pairs.length).toBeGreaterThan(0);
    
    console.log('📈 Trading Pairs:', {
      total: pairs.length,
      sample: pairs.slice(0, 3).map(p => `${p.source.code}→${p.target.code}`)
    });
  }, TEST_TIMEOUT);

  test('🌐 Should fetch active networks successfully', async () => {
    const networks = await obiexClient.getActiveNetworks();
    
    expect(networks).toBeDefined();
    expect(Array.isArray(networks)).toBe(true);
    expect(networks.length).toBeGreaterThan(0);
    
    console.log('🌐 Active Networks:', {
      total: networks.length,
      sample: networks.slice(0, 3).map(n => `${n.currency}/${n.network}`)
    });
  }, TEST_TIMEOUT);

  test('🏦 Should generate a live BTC deposit address', async () => {
    const depositAddress = await obiexClient.getDepositAddress('BTC', 'BTC', 'test-user-123');
    
    expect(depositAddress).toBeDefined();
    expect(depositAddress.address).toBeDefined();
    expect(typeof depositAddress.address).toBe('string');
    expect(depositAddress.address.length).toBeGreaterThan(10);
    expect(depositAddress.currency).toBe('BTC');
    expect(depositAddress.network).toBe('BTC');
    expect(depositAddress.reference).toBeDefined();

    console.log('🏦 Live Deposit Address:', {
      currency: depositAddress.currency,
      network: depositAddress.network,
      address: depositAddress.address,
      memo: depositAddress.memo,
      reference: depositAddress.reference
    });
  }, TEST_TIMEOUT);

  test('🏦 Should generate a live USDT deposit address', async () => {
    const depositAddress = await obiexClient.getDepositAddress('USDT', 'TRX', 'test-user-123');
    
    expect(depositAddress).toBeDefined();
    expect(depositAddress.address).toBeDefined();
    expect(depositAddress.currency).toBe('USDT');
    expect(depositAddress.network).toBe('TRX');
    expect(depositAddress.reference).toBeDefined();

    console.log('🏦 Live USDT Deposit:', {
      currency: depositAddress.currency,
      network: depositAddress.network,
      address: depositAddress.address,
      reference: depositAddress.reference
    });
  }, TEST_TIMEOUT);

  test('💱 Should create a live BTC → USDT quote', async () => {
    const quote = await obiexClient.createQuote('BTC', 'USDT', 'SELL', 0.001);
    
    // Validate quote structure
    expect(quote).toBeDefined();
    expect(quote.id).toBeDefined();
    expect(typeof quote.id).toBe('string');
    expect(quote.rate).toBeGreaterThan(0);
    expect(quote.amountReceived).toBeGreaterThan(0);
    expect(quote.sourceId).toBeDefined();
    expect(quote.targetId).toBeDefined();
    expect(quote.side).toBe('SELL');
    expect(quote.amount).toBe(0.001);
    expect(new Date(quote.expiryDate)).toBeInstanceOf(Date);

    console.log('📈 Live Quote:', {
      id: quote.id,
      rate: `$${quote.rate.toLocaleString()}`,
      amountReceived: `${quote.amountReceived.toFixed(2)} USDT`,
      expires: new Date(quote.expiryDate).toLocaleString()
    });

    // Test executing the quote
    const trade = await obiexClient.trade(quote.id);
    expect(trade).toBeDefined();
    expect(trade.status).toBeDefined();
    expect(['PENDING', 'APPROVED', 'PROCESSING', 'SUCCESSFUL']).toContain(trade.status);

    console.log('💱 Live Trade Executed:', {
      id: trade.id,
      status: trade.status,
      transactionId: trade.transactionId
    });
  }, TEST_TIMEOUT);

  test('💸 Should initiate a live withdrawal', async () => {
    const withdrawal = await obiexClient.withdrawCrypto(
      'BTC',
      'BTC',
      0.001,
      'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' // Production BTC address
    );
    
    expect(withdrawal).toBeDefined();
    expect(withdrawal.transactionId).toBeDefined();
    expect(withdrawal.status).toBeDefined();
    expect(['PENDING', 'APPROVED', 'PROCESSING', 'SUCCESSFUL']).toContain(withdrawal.status);

    console.log('💸 Live Withdrawal:', {
      transactionId: withdrawal.transactionId,
      status: withdrawal.status,
      reference: withdrawal.reference
    });
  }, TEST_TIMEOUT);

  test('❌ Should handle invalid currency pairs gracefully', async () => {
    await expect(
      obiexClient.createQuote('INVALID', 'ALSO_INVALID', 'BUY', 100)
    ).rejects.toThrow();
  }, TEST_TIMEOUT);

  test('❌ Should handle insufficient parameters', async () => {
    await expect(
      obiexClient.createQuote('', '', 'BUY', 0)
    ).rejects.toThrow();
  }, TEST_TIMEOUT);
});

// Summary test to display final results
describe('📊 Test Summary', () => {
  test('Should display environment info', () => {
    console.log('\n🎯 Test Environment Summary:');
    console.log('================================');
    console.log('Base URL: https://api.obiex.finance/v1');
    console.log('Client Ready: ✅');
    console.log('================================\n');
    
    expect(obiexClient).toBeDefined();
  });
}); 