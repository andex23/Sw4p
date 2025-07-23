import { ethers } from 'ethers';

// Supported wallet types
export const WALLET_TYPES = {
  METAMASK: 'metamask',
  TRUST_WALLET: 'trust',
  COINBASE: 'coinbase',
  PHANTOM: 'phantom',
  SOLFLARE: 'solflare',
  EXODUS: 'exodus',
  WALLETCONNECT: 'walletconnect'
};

// Supported networks
export const NETWORKS = {
  ETHEREUM: 'ethereum',
  BSC: 'bsc',
  POLYGON: 'polygon',
  SOLANA: 'solana',
  BITCOIN: 'bitcoin'
};

// Network configurations
const NETWORK_CONFIGS = {
  ethereum: {
    chainId: '0x1',
    chainName: 'Ethereum Mainnet',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.infura.io/v3/'],
    blockExplorerUrls: ['https://etherscan.io/']
  },
  bsc: {
    chainId: '0x38',
    chainName: 'BNB Smart Chain',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: ['https://bsc-dataseed.binance.org/'],
    blockExplorerUrls: ['https://bscscan.com/']
  },
  polygon: {
    chainId: '0x89',
    chainName: 'Polygon Mainnet',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    rpcUrls: ['https://polygon-rpc.com/'],
    blockExplorerUrls: ['https://polygonscan.com/']
  }
};

// Token contract addresses for different networks
const TOKEN_CONTRACTS = {
  ethereum: {
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    USDC: '0xA0b86a33E6441e1dd5B2336Ed39b85e3dd93CB88'
  },
  bsc: {
    USDT: '0x55d398326f99059fF775485246999027B3197955',
    USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'
  },
  polygon: {
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    USDC: '0x2791Bca1f2de4661ED88A30c99A7a9449Aa84174'
  }
};

class WalletService {
  constructor() {
    this.currentWallet = null;
    this.currentNetwork = null;
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.solanaConnection = null;
  }

  // Detect available wallets
  async detectWallets() {
    const availableWallets = [];

    // Ethereum-based wallets
    if (window.ethereum) {
      if (window.ethereum.isMetaMask) {
        availableWallets.push({ type: WALLET_TYPES.METAMASK, name: 'MetaMask', network: 'ethereum' });
      }
      if (window.ethereum.isTrust) {
        availableWallets.push({ type: WALLET_TYPES.TRUST_WALLET, name: 'Trust Wallet', network: 'ethereum' });
      }
      if (window.ethereum.isCoinbaseWallet) {
        availableWallets.push({ type: WALLET_TYPES.COINBASE, name: 'Coinbase Wallet', network: 'ethereum' });
      }
    }

    // Solana wallets
    if (window.solana && window.solana.isPhantom) {
      availableWallets.push({ type: WALLET_TYPES.PHANTOM, name: 'Phantom', network: 'solana' });
    }
    if (window.solflare) {
      availableWallets.push({ type: WALLET_TYPES.SOLFLARE, name: 'Solflare', network: 'solana' });
    }
    if (window.exodus && window.exodus.solana) {
      availableWallets.push({ type: WALLET_TYPES.EXODUS, name: 'Exodus', network: 'solana' });
    }

    return availableWallets;
  }

  // Connect to Ethereum-based wallet
  async connectEthereumWallet(walletType) {
    try {
      if (!window.ethereum) {
        throw new Error('No Ethereum wallet detected. Please install MetaMask or another Ethereum wallet.');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your wallet.');
      }

      // Setup provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      this.account = accounts[0];
      this.currentWallet = walletType;
      this.currentNetwork = NETWORKS.ETHEREUM;

      // Get network info
      const network = await this.provider.getNetwork();
      console.log('Connected to network:', network.name);

      // Setup event listeners
      this.setupEthereumEventListeners();

      return {
        success: true,
        account: this.account,
        network: network.name,
        chainId: network.chainId.toString()
      };
    } catch (error) {
      console.error('Error connecting to Ethereum wallet:', error);
      throw error;
    }
  }

  // Connect to Solana wallet
  async connectSolanaWallet(walletType) {
    try {
      let wallet;

      switch (walletType) {
        case WALLET_TYPES.PHANTOM:
          if (!window.solana || !window.solana.isPhantom) {
            throw new Error('Phantom wallet not detected. Please install Phantom.');
          }
          wallet = window.solana;
          break;
        case WALLET_TYPES.SOLFLARE:
          if (!window.solflare) {
            throw new Error('Solflare wallet not detected. Please install Solflare.');
          }
          wallet = window.solflare;
          break;
        case WALLET_TYPES.EXODUS:
          if (!window.exodus || !window.exodus.solana) {
            throw new Error('Exodus wallet not detected. Please install Exodus.');
          }
          wallet = window.exodus.solana;
          break;
        default:
          throw new Error('Unsupported Solana wallet type');
      }

      // Connect to wallet
      const response = await wallet.connect();
      this.account = response.publicKey.toString();
      this.currentWallet = walletType;
      this.currentNetwork = NETWORKS.SOLANA;

      // Setup Solana connection
      const { Connection, clusterApiUrl } = await import('@solana/web3.js');
      this.solanaConnection = new Connection(clusterApiUrl('mainnet-beta'));

      console.log('Connected to Solana wallet:', this.account);

      return {
        success: true,
        account: this.account,
        network: 'solana',
        publicKey: response.publicKey.toString()
      };
    } catch (error) {
      console.error('Error connecting to Solana wallet:', error);
      throw error;
    }
  }

  // Generic connect function
  async connectWallet(walletType) {
    try {
      const wallets = await this.detectWallets();
      const wallet = wallets.find(w => w.type === walletType);

      if (!wallet) {
        throw new Error(`${walletType} wallet not available`);
      }

      if (wallet.network === 'solana') {
        return await this.connectSolanaWallet(walletType);
      } else {
        return await this.connectEthereumWallet(walletType);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  // Disconnect wallet
  async disconnectWallet() {
    try {
      if (this.currentNetwork === NETWORKS.SOLANA) {
        // Disconnect Solana wallet
        if (window.solana && window.solana.disconnect) {
          await window.solana.disconnect();
        }
      }

      // Reset state
      this.currentWallet = null;
      this.currentNetwork = null;
      this.provider = null;
      this.signer = null;
      this.account = null;
      this.solanaConnection = null;

      return { success: true };
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      throw error;
    }
  }

  // Get wallet balance
  async getBalance(currency = 'native') {
    try {
      if (!this.account) {
        throw new Error('No wallet connected');
      }

      if (this.currentNetwork === NETWORKS.SOLANA) {
        return await this.getSolanaBalance(currency);
      } else {
        return await this.getEthereumBalance(currency);
      }
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  }

  // Get Ethereum balance
  async getEthereumBalance(currency) {
    try {
      if (currency === 'native' || currency === 'ETH') {
        const balance = await this.provider.getBalance(this.account);
        return ethers.formatEther(balance);
      } else {
        // Get token balance
        const network = await this.provider.getNetwork();
        const networkName = this.getNetworkName(network.chainId);
        const tokenAddress = TOKEN_CONTRACTS[networkName]?.[currency];

        if (!tokenAddress) {
          throw new Error(`Token ${currency} not supported on ${networkName}`);
        }

        const tokenContract = new ethers.Contract(
          tokenAddress,
          ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'],
          this.provider
        );

        const balance = await tokenContract.balanceOf(this.account);
        const decimals = await tokenContract.decimals();
        return ethers.formatUnits(balance, decimals);
      }
    } catch (error) {
      console.error('Error getting Ethereum balance:', error);
      throw error;
    }
  }

  // Get Solana balance
  async getSolanaBalance(currency) {
    try {
      const { PublicKey, LAMPORTS_PER_SOL } = await import('@solana/web3.js');
      const publicKey = new PublicKey(this.account);

      if (currency === 'native' || currency === 'SOL') {
        const balance = await this.solanaConnection.getBalance(publicKey);
        return (balance / LAMPORTS_PER_SOL).toString();
      } else {
        // Token balance would require SPL token handling
        throw new Error('Token balance checking not implemented for Solana yet');
      }
    } catch (error) {
      console.error('Error getting Solana balance:', error);
      throw error;
    }
  }

  // Send Ethereum transaction
  async sendEthereumTransaction(to, amount, currency = 'ETH') {
    try {
      if (!this.signer) {
        throw new Error('No signer available');
      }

      let tx;
      if (currency === 'ETH') {
        // Send native ETH
        tx = await this.signer.sendTransaction({
          to: to,
          value: ethers.parseEther(amount)
        });
      } else {
        // Send token
        const network = await this.provider.getNetwork();
        const networkName = this.getNetworkName(network.chainId);
        const tokenAddress = TOKEN_CONTRACTS[networkName]?.[currency];

        if (!tokenAddress) {
          throw new Error(`Token ${currency} not supported on ${networkName}`);
        }

        const tokenContract = new ethers.Contract(
          tokenAddress,
          ['function transfer(address to, uint256 amount) returns (bool)', 'function decimals() view returns (uint8)'],
          this.signer
        );

        const decimals = await tokenContract.decimals();
        const amountBN = ethers.parseUnits(amount, decimals);
        tx = await tokenContract.transfer(to, amountBN);
      }

      return {
        success: true,
        txHash: tx.hash,
        txId: tx.hash
      };
    } catch (error) {
      console.error('Error sending Ethereum transaction:', error);
      throw error;
    }
  }

  // Send Solana transaction
  async sendSolanaTransaction(to, amount) {
    try {
      const { 
        PublicKey, 
        Transaction, 
        SystemProgram, 
        LAMPORTS_PER_SOL 
      } = await import('@solana/web3.js');

      const fromPublicKey = new PublicKey(this.account);
      const toPublicKey = new PublicKey(to);
      const lamports = parseFloat(amount) * LAMPORTS_PER_SOL;

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromPublicKey,
          toPubkey: toPublicKey,
          lamports: lamports
        })
      );

      // Get recent blockhash
      const { blockhash } = await this.solanaConnection.getRecentBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPublicKey;

      // Sign and send transaction
      const signedTransaction = await window.solana.signTransaction(transaction);
      const signature = await this.solanaConnection.sendRawTransaction(signedTransaction.serialize());

      return {
        success: true,
        txHash: signature,
        txId: signature
      };
    } catch (error) {
      console.error('Error sending Solana transaction:', error);
      throw error;
    }
  }

  // Generic send transaction
  async sendTransaction(to, amount, currency) {
    try {
      if (!this.account) {
        throw new Error('No wallet connected');
      }

      if (this.currentNetwork === NETWORKS.SOLANA) {
        return await this.sendSolanaTransaction(to, amount);
      } else {
        return await this.sendEthereumTransaction(to, amount, currency);
      }
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  }

  // Switch network (Ethereum only)
  async switchNetwork(networkName) {
    try {
      if (!window.ethereum) {
        throw new Error('No Ethereum wallet detected');
      }

      const config = NETWORK_CONFIGS[networkName];
      if (!config) {
        throw new Error(`Network ${networkName} not supported`);
      }

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: config.chainId }]
      });

      this.currentNetwork = networkName;
      return { success: true };
    } catch (error) {
      if (error.code === 4902) {
        // Network not added to wallet, try to add it
        return await this.addNetwork(networkName);
      }
      throw error;
    }
  }

  // Add network to wallet
  async addNetwork(networkName) {
    try {
      const config = NETWORK_CONFIGS[networkName];
      if (!config) {
        throw new Error(`Network ${networkName} not supported`);
      }

      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [config]
      });

      this.currentNetwork = networkName;
      return { success: true };
    } catch (error) {
      console.error('Error adding network:', error);
      throw error;
    }
  }

  // Setup Ethereum event listeners
  setupEthereumEventListeners() {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          this.disconnectWallet();
        } else {
          this.account = accounts[0];
        }
      });

      window.ethereum.on('chainChanged', (chainId) => {
        window.location.reload(); // Reload on network change
      });

      window.ethereum.on('disconnect', () => {
        this.disconnectWallet();
      });
    }
  }

  // Helper function to get network name from chain ID
  getNetworkName(chainId) {
    const chainIdStr = chainId.toString();
    switch (chainIdStr) {
      case '1': return 'ethereum';
      case '56': return 'bsc';
      case '137': return 'polygon';
      default: return 'ethereum';
    }
  }

  // Get current wallet info
  getWalletInfo() {
    return {
      wallet: this.currentWallet,
      network: this.currentNetwork,
      account: this.account,
      connected: !!this.account
    };
  }
}

// Export singleton instance
export const walletService = new WalletService();
export default walletService; 