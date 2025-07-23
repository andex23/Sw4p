import { createInterface } from 'readline';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface TestCredentials {
  apiKey: string;
  apiSecret: string;
  sandboxMode: boolean;
  btcTestAddress?: string;
}

/**
 * Load Obiex credentials from environment or prompt user
 */
export async function loadObiexCredentials(): Promise<TestCredentials> {
  const envApiKey = process.env.OBIEX_API_KEY;
  const envApiSecret = process.env.OBIEX_API_SECRET;
  const envSandboxMode = process.env.OBIEX_SANDBOX_MODE;
  const envBtcAddress = process.env.BTC_TEST_ADDRESS;

  if (envApiKey && envApiSecret) {
    console.log('✅ Using credentials from .env file');
    return {
      apiKey: envApiKey,
      apiSecret: envApiSecret,
      sandboxMode: envSandboxMode?.toLowerCase() === 'true',
      btcTestAddress: envBtcAddress
    };
  }

  console.log('\n🔐 Obiex API credentials not found in .env file');
  console.log('Please provide your credentials for testing:');
  
  return await promptForCredentials();
}

/**
 * Prompt user for API credentials interactively
 */
async function promptForCredentials(): Promise<TestCredentials> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query: string): Promise<string> => {
    return new Promise(resolve => rl.question(query, resolve));
  };

  try {
    const apiKey = await question('Enter your Obiex API Key: ');
    const apiSecret = await question('Enter your Obiex API Secret: ');
    const sandboxInput = await question('Use sandbox mode? (Y/n): ');
    const btcAddress = await question('BTC test address for withdrawals (optional): ');
    
    rl.close();

    const sandboxMode = !sandboxInput.toLowerCase().startsWith('n');

    console.log(`\n✅ Using ${sandboxMode ? 'sandbox' : 'production'} mode for tests`);
    
    if (!sandboxMode) {
      console.log('⚠️  WARNING: Running tests in PRODUCTION mode with real funds!');
      const confirm = await question('Type "CONFIRM" to proceed: ');
      if (confirm !== 'CONFIRM') {
        throw new Error('Production test cancelled by user');
      }
    }

    return {
      apiKey,
      apiSecret,
      sandboxMode,
      btcTestAddress: btcAddress || undefined
    };
  } catch (error) {
    rl.close();
    throw new Error('Failed to get credentials from user input');
  }
}

/**
 * Validate required environment variables for tests
 */
export function validateTestEnvironment(): void {
  const required = ['OBIEX_API_KEY', 'OBIEX_API_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.log(`⚠️  Missing environment variables: ${missing.join(', ')}`);
    console.log('Tests will prompt for credentials interactively');
  }
}

/**
 * Sleep utility for test delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format currency amounts for display
 */
export function formatCurrency(amount: number, currency: string): string {
  if (currency === 'BTC') {
    return `${amount.toFixed(8)} ${currency}`;
  } else if (currency === 'ETH') {
    return `${amount.toFixed(6)} ${currency}`;
  } else {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/**
 * Format rate for display
 */
export function formatRate(rate: number, sourceCurrency: string, targetCurrency: string): string {
  return `1 ${sourceCurrency} = ${formatCurrency(rate, targetCurrency)}`;
} 