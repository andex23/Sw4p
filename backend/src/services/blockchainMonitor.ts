import axios from 'axios';
import { getDatabaseClient } from './database';
import obiexClient from './obiexClient';
import crypto from 'crypto';

interface BlockchainTransaction {
  txid: string;
  confirmations: number;
  amount: number;
  address: string;
}

interface BitcoinTransaction {
  txid: string;
  confirmations: number;
  vout: Array<{
    value: number;
    scriptPubKey: {
      addresses: string[];
    };
  }>;
}

/**
 * Blockchain monitoring service for automatic deposit detection
 */
export class BlockchainMonitor {
  private static instance: BlockchainMonitor;
  private isMonitoring = false;
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): BlockchainMonitor {
    if (!BlockchainMonitor.instance) {
      BlockchainMonitor.instance = new BlockchainMonitor();
    }
    return BlockchainMonitor.instance;
  }

  /**
   * Start monitoring a deposit address for transactions
   */
  async startMonitoring(intentId: string, address: string, currency: string, network: string): Promise<void> {
    if (this.monitoringIntervals.has(intentId)) {
      console.log(`🔍 Already monitoring ${intentId} at address ${address}`);
      return;
    }

    console.log(`🔍 Starting blockchain monitoring for ${currency} address: ${address}`);
    console.log(`🔍 Intent ID: ${intentId}, Network: ${network}`);

    // Start monitoring with 30-second intervals
    const interval = setInterval(async () => {
      try {
        await this.checkForDeposits(intentId, address, currency, network);
      } catch (error) {
        console.error(`❌ Error monitoring ${intentId}:`, error);
      }
    }, 30000); // Check every 30 seconds

    this.monitoringIntervals.set(intentId, interval);
    this.isMonitoring = true;
  }

  /**
   * Stop monitoring a specific deposit
   */
  stopMonitoring(intentId: string): void {
    const interval = this.monitoringIntervals.get(intentId);
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(intentId);
      console.log(`🛑 Stopped monitoring ${intentId}`);
    }
  }

  /**
   * Check for deposits on the blockchain
   */
  private async checkForDeposits(intentId: string, address: string, currency: string, network: string): Promise<void> {
    console.log(`🔍 Checking ${currency} address ${address} for deposits...`);

    try {
      let transactions: BlockchainTransaction[] = [];

      if (currency === 'BTC' && network === 'BTC') {
        transactions = await this.getBitcoinTransactions(address);
      } else if (currency === 'ETH' && network === 'ETH') {
        transactions = await this.getEthereumTransactions(address);
      } else {
        // For other currencies, we'll need to implement specific APIs
        console.log(`⚠️ Blockchain monitoring not implemented for ${currency} on ${network}`);
        return;
      }

      if (transactions.length > 0) {
        console.log(`✅ Found ${transactions.length} transaction(s) for ${address}`);
        
        for (const tx of transactions) {
          if (tx.confirmations >= 2) {
            await this.processConfirmedDeposit(intentId, tx, currency);
          } else {
            console.log(`⏳ Transaction ${tx.txid} has ${tx.confirmations} confirmations, waiting for 2+...`);
          }
        }
      } else {
        console.log(`🔍 No transactions found for ${address}`);
      }
    } catch (error) {
      console.error(`❌ Error checking blockchain for ${address}:`, error);
    }
  }

  /**
   * Get Bitcoin transactions for an address
   */
  private async getBitcoinTransactions(address: string): Promise<BlockchainTransaction[]> {
    try {
      // Using Blockstream API for Bitcoin
      const response = await axios.get(`https://blockstream.info/api/address/${address}/txs`);
      
      const transactions: BlockchainTransaction[] = [];
      
      for (const tx of response.data) {
        // Calculate total amount received by this address
        let totalReceived = 0;
        
        for (const vout of tx.vout) {
          if (vout.scriptpubkey_address === address) {
            totalReceived += vout.value / 100000000; // Convert satoshis to BTC
          }
        }

        if (totalReceived > 0) {
          transactions.push({
            txid: tx.txid,
            confirmations: tx.status.block_height ? (await this.getCurrentBlockHeight()) - tx.status.block_height + 1 : 0,
            amount: totalReceived,
            address: address
          });
        }
      }

      return transactions;
    } catch (error) {
      console.error('❌ Error fetching Bitcoin transactions:', error);
      return [];
    }
  }

  /**
   * Get Ethereum transactions for an address
   */
  private async getEthereumTransactions(address: string): Promise<BlockchainTransaction[]> {
    try {
      // Using Etherscan API for Ethereum
      const apiKey = 'YourEtherscanApiKey'; // You'd need to get an API key
      const response = await axios.get(`https://api.etherscan.io/api`, {
        params: {
          module: 'account',
          action: 'txlist',
          address: address,
          startblock: 0,
          endblock: 99999999,
          sort: 'desc',
          apikey: apiKey
        }
      });

      if (response.data.status === '1') {
        return response.data.result
          .filter((tx: any) => tx.to.toLowerCase() === address.toLowerCase())
          .map((tx: any) => ({
            txid: tx.hash,
            confirmations: parseInt(tx.confirmations),
            amount: parseFloat(tx.value) / 1e18, // Convert wei to ETH
            address: address
          }));
      }

      return [];
    } catch (error) {
      console.error('❌ Error fetching Ethereum transactions:', error);
      return [];
    }
  }

  /**
   * Get current Bitcoin block height
   */
  private async getCurrentBlockHeight(): Promise<number> {
    try {
      const response = await axios.get('https://blockstream.info/api/blocks/tip/height');
      return response.data;
    } catch (error) {
      console.error('❌ Error getting current block height:', error);
      return 0;
    }
  }

  /**
   * Process a confirmed deposit
   */
  private async processConfirmedDeposit(intentId: string, tx: BlockchainTransaction, currency: string): Promise<void> {
    const db = getDatabaseClient();
    
    // Check if we've already processed this transaction
    const [existingTx] = await db.$queryRaw<Array<{ txHash: string }>>`
      SELECT txHash FROM Transaction WHERE txHash = ${tx.txid} LIMIT 1
    `;

    if (existingTx) {
      console.log(`⏭️ Transaction ${tx.txid} already processed, skipping...`);
      return;
    }

    console.log(`✨ Processing confirmed deposit for intent ${intentId}`);
    console.log(`Transaction: ${tx.txid}, Amount: ${tx.amount} ${currency}`);

    try {
      // Get the deposit intent
      const [intent] = await db.$queryRaw<Array<{
        id: string;
        currency: string;
        targetCurrency: string | null;
        targetNetwork: string | null;
      }>>`
        SELECT id, currency, targetCurrency, targetNetwork
        FROM DepositIntent
        WHERE id = ${intentId}
        LIMIT 1
      `;

      if (!intent) {
        throw new Error(`Deposit intent ${intentId} not found`);
      }

      // Update deposit intent status
      await db.depositIntent.update({
        where: { id: intentId },
        data: { 
          status: 'CONFIRMED'
        }
      });

      // Record the deposit transaction
      const depositTxId = crypto.randomUUID();
      await db.$executeRaw`
        INSERT INTO Transaction (id, txHash, amount, currency, type, status, depositIntentId, createdAt, updatedAt)
        VALUES (${depositTxId}, ${tx.txid}, ${tx.amount}, ${currency}, 'DEPOSIT', 'CONFIRMED', ${intentId}, datetime('now'), datetime('now'))
      `;

      // Automatically execute the swap if target currency is specified
      if (intent.targetCurrency && intent.targetNetwork) {
        console.log(`🔄 Initiating automatic swap to ${intent.targetCurrency}`);
        
        try {
          // Get current quote
          const quote = await obiexClient.createQuote(
            currency,
            intent.targetCurrency,
            'SELL',
            tx.amount
          );

          // Execute trade immediately
          const trade = await obiexClient.trade(
            currency,
            intent.targetCurrency,
            'SELL',
            tx.amount,
            quote.id
          );

          // Record the swap transaction
          const swapTxId = crypto.randomUUID();
          await db.$executeRaw`
            INSERT INTO Transaction (id, txHash, amount, currency, type, status, depositIntentId, createdAt, updatedAt)
            VALUES (${swapTxId}, ${trade.transactionId}, ${trade.amountReceived}, ${intent.targetCurrency}, 'SWAP', 'COMPLETED', ${intentId}, datetime('now'), datetime('now'))
          `;

          console.log(`✅ Automatic swap completed: ${trade.transactionId}`);
        } catch (error) {
          console.error('❌ Error executing automatic swap:', error);
          // Update intent status to indicate swap failed
          await db.depositIntent.update({
            where: { id: intentId },
            data: { status: 'SWAP_FAILED' }
          });
        }
      }

      // Stop monitoring this intent since we've processed it
      this.stopMonitoring(intentId);
    } catch (error) {
      console.error(`❌ Error processing confirmed deposit:`, error);
    }
  }

  /**
   * Get monitoring status
   */
  getMonitoringStatus(): { isMonitoring: boolean; activeMonitors: number } {
    return {
      isMonitoring: this.isMonitoring,
      activeMonitors: this.monitoringIntervals.size
    };
  }

  /**
   * Stop all monitoring
   */
  stopAllMonitoring(): void {
    for (const [intentId, interval] of this.monitoringIntervals) {
      clearInterval(interval);
      console.log(`🛑 Stopped monitoring ${intentId}`);
    }
    this.monitoringIntervals.clear();
    this.isMonitoring = false;
  }
}

export default BlockchainMonitor.getInstance(); 