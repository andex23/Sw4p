import React, { useState, useEffect, useCallback } from 'react';
import walletService from '../services/walletService';

const WalletConnect = ({ onWalletConnected, onWalletDisconnected }) => {
  const [availableWallets, setAvailableWallets] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState(null);
  const [walletInfo, setWalletInfo] = useState(null);
  const [balance, setBalance] = useState('0');
  const [error, setError] = useState('');

  // Wallet type constants
  const WALLET_TYPES = {
    METAMASK: 'metamask',
    TRUST_WALLET: 'trust',
    COINBASE: 'coinbase',
    PHANTOM: 'phantom',
    SOLFLARE: 'solflare',
    EXODUS: 'exodus',
    WALLETCONNECT: 'walletconnect'
  };

  // Wallet icons/logos mapping
  const walletIcons = {
    [WALLET_TYPES.METAMASK]: '🦊',
    [WALLET_TYPES.TRUST_WALLET]: '🛡️',
    [WALLET_TYPES.COINBASE]: '🪙',
    [WALLET_TYPES.PHANTOM]: '👻',
    [WALLET_TYPES.SOLFLARE]: '🔥',
    [WALLET_TYPES.EXODUS]: '🚀',
    [WALLET_TYPES.WALLETCONNECT]: '🔗'
  };

  const detectWallets = async () => {
    try {
      const wallets = await walletService.detectWallets();
      setAvailableWallets(wallets);
    } catch (error) {
      console.error('Error detecting wallets:', error);
    }
  };

  const updateBalance = async () => {
    try {
      const walletBalance = await walletService.getBalance();
      setBalance(parseFloat(walletBalance).toFixed(4));
    } catch (error) {
      console.error('Error getting balance:', error);
      setBalance('0');
    }
  };

  const checkExistingConnection = useCallback(() => {
    const info = walletService.getWalletInfo();
    if (info.connected) {
      setConnectedWallet(info.wallet);
      setWalletInfo(info);
      updateBalance();
    }
  }, []);

  useEffect(() => {
    detectWallets();
    checkExistingConnection();
  }, [checkExistingConnection]);

  const handleWalletConnect = async (walletType) => {
    setIsConnecting(true);
    setError('');

    try {
      const result = await walletService.connectWallet(walletType);
      
      if (result.success) {
        setConnectedWallet(walletType);
        setWalletInfo(walletService.getWalletInfo());
        updateBalance();
        
        if (onWalletConnected) {
          onWalletConnected(result);
        }
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleWalletDisconnect = async () => {
    try {
      await walletService.disconnectWallet();
      setConnectedWallet(null);
      setWalletInfo(null);
      setBalance('0');
      
      if (onWalletDisconnected) {
        onWalletDisconnected();
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      setError(error.message || 'Failed to disconnect wallet');
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // If wallet is connected, show wallet info
  if (connectedWallet && walletInfo) {
    return (
      <div className="retro-wallet-connected">
        <div className="retro-wallet-info">
          <div className="retro-wallet-header">
            <span className="retro-wallet-icon">
              {walletIcons[connectedWallet] || '💼'}
            </span>
            <div className="retro-wallet-details">
              <div className="retro-wallet-name">
                {availableWallets.find(w => w.type === connectedWallet)?.name || connectedWallet}
              </div>
              <div className="retro-wallet-address">
                {formatAddress(walletInfo.account)}
              </div>
              <div className="retro-wallet-network">
                Network: {walletInfo.network || 'Unknown'}
              </div>
            </div>
          </div>
          
          <div className="retro-wallet-balance">
            <div className="retro-balance-label">Balance:</div>
            <div className="retro-balance-amount">
              {balance} {walletInfo.network === 'solana' ? 'SOL' : 'ETH'}
            </div>
          </div>

          <button 
            className="retro-button retro-disconnect-btn"
            onClick={handleWalletDisconnect}
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  // Show wallet connection options
  return (
    <div className="retro-wallet-connect">
      <div className="retro-wallet-header">
        <h3>Connect Your Wallet</h3>
        <p>Choose a wallet to connect and start swapping</p>
      </div>

      {error && (
        <div className="retro-error-message">
          {error}
        </div>
      )}

      <div className="retro-wallet-options">
        {availableWallets.length === 0 ? (
          <div className="retro-no-wallets">
            <p>No wallets detected. Please install one of the following:</p>
            <ul>
              <li>MetaMask (for Ethereum)</li>
              <li>Trust Wallet (for Ethereum)</li>
              <li>Phantom (for Solana)</li>
              <li>Coinbase Wallet (for Ethereum)</li>
            </ul>
          </div>
        ) : (
          availableWallets.map((wallet) => (
            <button
              key={wallet.type}
              className="retro-wallet-option"
              onClick={() => handleWalletConnect(wallet.type)}
              disabled={isConnecting}
            >
              <span className="retro-wallet-icon">
                {walletIcons[wallet.type] || '💼'}
              </span>
              <div className="retro-wallet-info">
                <div className="retro-wallet-name">{wallet.name}</div>
                <div className="retro-wallet-network">{wallet.network}</div>
              </div>
              {isConnecting && (
                <div className="retro-loading">...</div>
              )}
            </button>
          ))
        )}
      </div>

      <div className="retro-wallet-help">
        <p>Don't have a wallet? Download one:</p>
        <div className="retro-wallet-links">
          <a href="https://metamask.io" target="_blank" rel="noopener noreferrer">
            MetaMask
          </a>
          <a href="https://trustwallet.com" target="_blank" rel="noopener noreferrer">
            Trust Wallet
          </a>
          <a href="https://phantom.app" target="_blank" rel="noopener noreferrer">
            Phantom
          </a>
          <a href="https://www.coinbase.com/wallet" target="_blank" rel="noopener noreferrer">
            Coinbase Wallet
          </a>
        </div>
      </div>
    </div>
  );
};

export default WalletConnect; 