import { Router, Request, Response } from 'express';
import obiexClient from '../services/obiexClient';

const router: Router = Router();

interface HealthStatus {
  server: string;
  obiex: {
    baseUrl: string;
    publicEndpoints: {
      tradingPairs: boolean;
      activeNetworks: boolean;
    };
    permissions: {
      broker: boolean;
      trading: boolean;
      withdrawal: boolean;
    };
    errors: string[];
  };
  status?: string;
  message?: string;
  timestamp: string;
}

/**
 * Health check endpoint that verifies API connectivity and permissions
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const status: HealthStatus = {
      server: 'ok',
      obiex: {
        baseUrl: 'https://api.obiex.finance/v1',
        publicEndpoints: {
          tradingPairs: false,
          activeNetworks: false,
        },
        permissions: {
          broker: false,
          trading: false,
          withdrawal: false,
        },
        errors: [],
      },
      timestamp: new Date().toISOString(),
    };

    // Check public endpoints
    try {
      const pairs = await obiexClient.getTradingPairs();
      status.obiex.publicEndpoints.tradingPairs = pairs && pairs.length > 0;
    } catch (error) {
      if (error instanceof Error) {
        status.obiex.errors.push(`Trading pairs error: ${error.message}`);
      } else {
        status.obiex.errors.push('Trading pairs error: Unknown error');
      }
    }

    try {
      const networks = await obiexClient.getActiveNetworks();
      status.obiex.publicEndpoints.activeNetworks = networks && networks.length > 0;
    } catch (error) {
      if (error instanceof Error) {
        status.obiex.errors.push(`Active networks error: ${error.message}`);
      } else {
        status.obiex.errors.push('Active networks error: Unknown error');
      }
    }

    // Check broker permissions (deposit addresses)
    try {
      await obiexClient.getDepositAddress('BTC', 'BTC', 'health-check');
      status.obiex.permissions.broker = true;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Broker permissions required')) {
          status.obiex.errors.push('Broker permissions not enabled');
        } else {
          status.obiex.errors.push(`Broker check error: ${error.message}`);
        }
      } else {
        status.obiex.errors.push('Broker check error: Unknown error');
      }
    }

    // Check trading permissions
    try {
      await obiexClient.createQuote('BTC', 'USDT', 'SELL', 0.001);
      status.obiex.permissions.trading = true;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Trading permissions required')) {
          status.obiex.errors.push('Trading permissions not enabled');
        } else {
          status.obiex.errors.push(`Trading check error: ${error.message}`);
        }
      } else {
        status.obiex.errors.push('Trading check error: Unknown error');
      }
    }

    // Check withdrawal permissions
    try {
      await obiexClient.withdrawCrypto(
        'BTC',
        'BTC',
        0.001,
        'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
      );
      status.obiex.permissions.withdrawal = true;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Withdrawal permissions required')) {
          status.obiex.errors.push('Withdrawal permissions not enabled');
        } else {
          status.obiex.errors.push(`Withdrawal check error: ${error.message}`);
        }
      } else {
        status.obiex.errors.push('Withdrawal check error: Unknown error');
      }
    }

    // Set overall status
    const hasPublicAccess = status.obiex.publicEndpoints.tradingPairs || status.obiex.publicEndpoints.activeNetworks;
    const hasErrors = status.obiex.errors.length > 0;

    res.json({
      ...status,
      status: hasPublicAccess ? 'degraded' : 'error',
      message: hasPublicAccess 
        ? 'API connected but some permissions are missing'
        : 'API connection failed',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router; 