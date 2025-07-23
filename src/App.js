// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import './RetroApp.css';
import { fetchCurrencies, getExchangeRate } from './api';
import WalletConnect from './components/WalletConnect';
import DepositApproval from './components/DepositApproval';
import walletService from './services/walletService';

function App() {
  const [currencies, setCurrencies] = useState([]);
  const [fromCurrency, setFromCurrency] = useState('');
  const [toCurrency, setToCurrency] = useState('');
  const [amount, setAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState(null);
  const [calculatedAmount, setCalculatedAmount] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  // Removed unused error state
  const [statusError, setStatusError] = useState(''); // Error for status tab
  const [swapError, setSwapError] = useState(''); // Error for swap tab
  const [swapResult, setSwapResult] = useState(null);
  const [depositAddress, setDepositAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [activeTab, setActiveTab] = useState('swap'); // 'swap' or 'status' or 'wallet' or 'admin'
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [connectionCount] = useState(3);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [fromUsdPrice, setFromUsdPrice] = useState(null);
  const [toUsdPrice, setToUsdPrice] = useState(null);
  const [fromAmountUsd, setFromAmountUsd] = useState(null);
  const [toAmountUsd, setToAmountUsd] = useState(null);

  // Custom Alert State
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  
  // Custom Confirmation Dialog State
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [confirmCallback, setConfirmCallback] = useState(null);
  
  // Help Dialog State
  const [showHelpDialog, setShowHelpDialog] = useState(false);

  // Fee calculation is done inline where needed

  // For checking transaction status
  const [txId, setTxId] = useState('');
  const [txCheckResult, setTxCheckResult] = useState(null);

  // Wallet state
  const [connectedWallet, setConnectedWallet] = useState(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendAmount, setSendAmount] = useState('');
  const [sendAddress, setSendAddress] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [autoCloseCountdown, setAutoCloseCountdown] = useState(3);

  // Window state for minimize/restore
  const [isMinimized, setIsMinimized] = useState(false);

  // Waiting popup state for transaction confirmation
  const [showWaitingDialog, setShowWaitingDialog] = useState(false);
  const [intentId, setIntentId] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('');

  // Get network label for currency
  const getCurrencyNetworkLabel = (currency) => {
    const networkLabels = {
      'BTC': '(Bitcoin)',
      'ETH': '(ERC-20)',
      'USDT': '(ERC-20/TRC-20)',
      'USDC': '(ERC-20)',
      'XRP': '(XRP Ledger)',
      'BNB': '(BEP-20)',
      'SOL': '(Solana)',
      'TRX': '(TRC-20)',
      'DOGE': '(Dogecoin)',
      'ADA': '(Cardano)',
      'WBTC': '(ERC-20)',
      'STETH': '(ERC-20)',
      'HYPE': '(ERC-20)',
      'WSTETH': '(ERC-20)',
      'SUI': '(Sui)',
      'BCH': '(Bitcoin Cash)',
      'LINK': '(ERC-20)',
      'LEO': '(ERC-20)',
      'AVAX': '(AVAX C-Chain)',
      'XLM': '(Stellar)',
      'USDS': '(ERC-20)',
      'WEETH': '(ERC-20)',
      'SHIB': '(ERC-20)',
      'TON': '(TON)',
      'WETH': '(ERC-20)',
      'HBAR': '(Hedera)',
      'LTC': '(Litecoin)',
      'WBT': '(ERC-20)',
      'BSC-USD': '(BEP-20)',
      'XMR': '(Monero)'
    };
    return networkLabels[currency] || '';
  };

  // Show custom alert instead of browser alert
  const showCustomAlert = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
  };

  // Show custom confirmation dialog
  const showCustomConfirm = (message, callback) => {
    setConfirmationMessage(message);
    setConfirmCallback(() => callback);
    setShowConfirmationDialog(true);
  };
  
  // Handle opening the help dialog
  const handleOpenHelp = () => {
    setShowHelpDialog(true);
  };

  // Calculate fee percentage based on USD transaction value
  const calculateFeePercentage = (usdValue) => {
    if (usdValue <= 50) return 11;
    if (usdValue <= 79) return 9.62;
    if (usdValue <= 100) return 8.26;
    if (usdValue <= 120) return 7.46;
    if (usdValue <= 150) return 6;
    if (usdValue <= 199) return 4.86;
    if (usdValue <= 300) return 3.48;
    if (usdValue <= 350) return 3;
    if (usdValue <= 400) return 2.79;
    if (usdValue <= 500) return 2.0;
    if (usdValue <= 700) return 1.86;
    if (usdValue <= 1000) return 1.77;
    if (usdValue <= 1500) return 1.5;
    if (usdValue <= 2000) return 1.39;
    if (usdValue <= 3000) return 1.26;
    if (usdValue <= 4000) return 1.2;
    if (usdValue <= 5000) return 1.16;
    return 1.16; // Default for higher values
  };

  // Update time periodically to simulate a real application
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Hide HTML taskbar when React app is running
  useEffect(() => {
    const htmlTaskbar = document.getElementById('taskbar');
    if (htmlTaskbar) {
      htmlTaskbar.style.display = 'none';
    }
  }, []);

  // Clear errors when changing tabs
  useEffect(() => {
    setStatusError('');
    setSwapError('');
  }, [activeTab]);

  // Define checkDepositStatus with useCallback to fix the dependency issue
  const checkDepositStatus = useCallback(async () => {
    if (!intentId) return;
    
    try {
      const response = await fetch(`http://localhost:5001/api/obiex/deposit-status/${intentId}`);
      const data = await response.json();
      
      if (data.success && data.deposit) {
        setApprovalStatus(data.deposit.status);
        
        if (data.deposit.status === 'APPROVED') {
          setShowWaitingDialog(false);
          setSwapResult({
            fromCurrency,
            toCurrency,
            amount,
            calculatedAmount,
            timestamp: new Date().toISOString(),
            exchangeRate,
            depositAddress,
            toAddress
          });
          setShowSuccessDialog(true);
        }
      }
    } catch (error) {
      console.error('Error checking deposit status:', error);
    }
  }, [intentId, fromCurrency, toCurrency, amount, calculatedAmount, exchangeRate, depositAddress, toAddress]);

  // Poll for approval status every 5 seconds when waiting dialog is shown
  useEffect(() => {
    if (showWaitingDialog && intentId && approvalStatus === 'PENDING') {
      const interval = setInterval(checkDepositStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [showWaitingDialog, intentId, approvalStatus, checkDepositStatus]);

  // Function to handle starting a new transaction
  const handleNewTransaction = () => {
    setAmount('');
    setCalculatedAmount(null);
    setFromAmountUsd(null);
    setToAmountUsd(null);
    setToAddress('');
    setSwapError('');
    setStatusError('');
    setShowConfirmDialog(false);
    setShowSuccessDialog(false);
    setSwapResult(null);
    // Reset to default tab
    setActiveTab('swap');
    // Close the file menu
    setShowFileMenu(false);
  };

  // Function to handle application close
  const handleCloseWindow = () => {
    showCustomConfirm('Are you sure you want to close Sw4p?', () => {
      document.body.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: #008080; color: white;
          display: flex; flex-direction: column;
          justify-content: center; align-items: center;
          font-family: 'MS Sans Serif', Arial, sans-serif;">
          <img src="/images/banner.png" alt="Sw4p Banner" style="width: 100%; max-width: 1000px; height: auto; margin-bottom: 10px; background: transparent;">
          <p style="font-size: 1em; margin-top: 5px; text-align: center;"> 
            v0.1 Alpha<br>               
            Copyright © 2025 Sw4p Inc.<br>     
            All Rights Reserved 
          </p>                     
          <div style="background: #000080; padding: 20px; border: 2px outset #d4d0c8; margin-bottom: 20px;">
            <h2>It is now safe to turn off your computer.</h2>
          </div>
          <button onclick="window.location.reload()" style="padding: 10px 20px; background: #d4d0c8; 
            color: black; border: 2px outset #d4d0c8; font-family: 'MS Sans Serif', Arial, sans-serif;
            cursor: pointer; font-weight: bold;">
            Restart Sw4p
          </button>
        </div>
      `;
      
      // Log the banner to console as well
      console.log(`
 ███████╗██╗    ██╗██╗  ██╗██████╗ 
 ██╔════╝██║    ██║██║  ██║██╔══██╗
 ███████╗██║ █╗ ██║███████║██████╔╝
 ╚════██║██║███╗██║╚════██║██╔═══╝ 
 ███████║╚███╔███╔╝     ██║██║     
 ╚══════╝ ╚══╝╚══╝      ╚═╝╚═╝     
                                   
           v0.1 Alpha               
     Copyright © 2025 Sw4p Inc.     
        All Rights Reserved         
      `);
    });
  };

  // Toggle file menu function
  const toggleFileMenu = () => {
    setShowFileMenu(!showFileMenu);
  };

  // Close menu when clicking elsewhere
  const closeMenus = () => {
    setShowFileMenu(false);
  };

  // Handle minimize button click
  const handleMinimize = () => {
    setIsMinimized(true);
  };

  // Handle restore from taskbar
  const handleRestore = () => {
    setIsMinimized(false);
  };

  // Fetch available currencies on component mount
  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        setIsLoading(true);
        const data = await fetchCurrencies();
        setCurrencies(data.currencies);
        // Set default currencies if available
        if (data.currencies.length >= 2) {
          const btc = data.currencies.find(c => c.code === 'BTC');
          const eth = data.currencies.find(c => c.code === 'ETH');
          setFromCurrency(btc ? btc.code : data.currencies[0].code);
          setToCurrency(eth ? eth.code : data.currencies[1].code);
        }
      } catch (err) {
        setSwapError('Failed to load currencies. Please try again later.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadCurrencies();
  }, []);

  // Generate deposit address for the chosen fromCurrency
  useEffect(() => {
    if (!fromCurrency) {
      setDepositAddress('');
      return;
    }

    // Generate fresh deposit address from backend API
    const generateDepositAddress = async () => {
      try {
        setIsLoading(true);
        
        // Map currencies to their primary networks
        const getNetworkForCurrency = (currency) => {
          const networkMap = {
            'BTC': 'BTC',
            'ETH': 'ETH',
            'USDT': 'ETH',     // USDT primarily on Ethereum
            'USDC': 'ETH',     // USDC primarily on Ethereum
            'XRP': 'XRP',
            'BNB': 'BSC',      // BNB on Binance Smart Chain
            'SOL': 'SOL',
            'TRX': 'TRON',     // TRON network
            'DOGE': 'DOGE',
            'ADA': 'ADA',
            'WBTC': 'ETH',     // Wrapped Bitcoin on Ethereum
            'STETH': 'ETH',    // Lido Staked Ether on Ethereum
            'HYPE': 'ETH',     // Assuming on Ethereum
            'WSTETH': 'ETH',   // Wrapped stETH on Ethereum
            'SUI': 'SUI',
            'BCH': 'BCH',
            'LINK': 'ETH',     // Chainlink on Ethereum
            'LEO': 'ETH',      // LEO Token on Ethereum
            'AVAX': 'AVAX',
            'XLM': 'XLM',
            'USDS': 'ETH',     // USDS on Ethereum
            'WEETH': 'ETH',    // Wrapped eETH on Ethereum
            'SHIB': 'ETH',     // Shiba Inu on Ethereum
            'TON': 'TON',
            'WETH': 'ETH',     // Wrapped ETH on Ethereum
            'HBAR': 'HBAR',
            'LTC': 'LTC',
            'WBT': 'ETH',      // WhiteBIT Coin on Ethereum
            'BSC-USD': 'BSC',  // Binance Bridged USDT on BSC
            'XMR': 'XMR'
          };
          return networkMap[currency] || currency;
        };

        const network = getNetworkForCurrency(fromCurrency);
        
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/obiex/deposit-address`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: 100, // Default amount for address generation
            currency: fromCurrency,
            network: network,
            targetCurrency: toCurrency || 'USD',
            userId: `user_${Date.now()}` // Generate unique user ID
          })
        });

        const data = await response.json();
        
        if (data.success) {
          setDepositAddress(data.data.address);
          console.log(`Generated fresh ${fromCurrency} deposit address on ${network}:`, data.data.address);
        } else {
          console.error('Failed to generate deposit address:', data.error);
          setDepositAddress(`Error generating ${fromCurrency} address`);
        }
      } catch (error) {
        console.error('Error generating deposit address:', error);
        setDepositAddress(`Error generating ${fromCurrency} address`);
      } finally {
        setIsLoading(false);
      }
    };

    generateDepositAddress();
  }, [fromCurrency, toCurrency]);

  // Define updateExchangeRate with useCallback
  const updateExchangeRate = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getExchangeRate(fromCurrency, toCurrency);
      setExchangeRate(data.rate);
      setFromUsdPrice(data.fromUsdPrice);
      setToUsdPrice(data.toUsdPrice);
      setSwapError('');
    } catch (err) {
      setSwapError('Unable to fetch current exchange rate. Please try again.');
      setExchangeRate(null);
      setFromUsdPrice(null);
      setToUsdPrice(null);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [fromCurrency, toCurrency]);

  // Update exchange rate when currencies change
  useEffect(() => {
    if (fromCurrency && toCurrency) {
      updateExchangeRate();
    }
  }, [fromCurrency, toCurrency, updateExchangeRate]);

  // Auto-clear form after successful transaction
  useEffect(() => {
    if (showSuccessDialog) {
      setAutoCloseCountdown(3);
      
      const countdownInterval = setInterval(() => {
        setAutoCloseCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            handleReset();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(countdownInterval);
    }
  }, [showSuccessDialog]);

  // Handle desktop icon clicks to restore window
  useEffect(() => {
    const handleDesktopIconClick = (event) => {
      if (isMinimized && event.target.closest('#cryptoswap-icon')) {
        handleRestore();
      }
    };

    if (isMinimized) {
      document.addEventListener('click', handleDesktopIconClick);
      return () => document.removeEventListener('click', handleDesktopIconClick);
    }
  }, [isMinimized]);

  // Update calculated amount and USD values when amount or exchange rate changes
  useEffect(() => {
    if (amount && exchangeRate) {
      // Calculate USD value of the transaction
      const usdValue = fromUsdPrice ? parseFloat(amount) * fromUsdPrice : 0;
      
      // Determine fee percentage based on USD value
      const dynamicFeePercentage = calculateFeePercentage(usdValue);
      
      // Calculate raw converted amount
      const rawConverted = parseFloat(amount) * exchangeRate;
      
      // Calculate fee
      const fee = rawConverted * (dynamicFeePercentage / 100);
      
      // Final amount after fee
      const finalAmount = rawConverted - fee;
      setCalculatedAmount(finalAmount.toFixed(8));
      
      // Calculate USD values if we have the prices
      if (fromUsdPrice) {
        setFromAmountUsd(usdValue.toFixed(2));
      }
      
      if (toUsdPrice) {
        if (finalAmount) {
          const usdValue = finalAmount * toUsdPrice;
          setToAmountUsd(usdValue.toFixed(2));
        }
      }
    } else {
      setCalculatedAmount(null);
      setFromAmountUsd(null);
      setToAmountUsd(null);
    }
  }, [amount, exchangeRate, fromUsdPrice, toUsdPrice]);

  // Check transaction status - Now handles different ID formats
  const checkTransactionStatus = async () => {
    if (!txId) {
      setStatusError('Please enter a transaction ID');
      return;
    }
    
    try {
      setIsLoading(true);
      // Send transaction ID exactly as entered (no case conversion)
      // This allows the backend to handle any format of transaction ID
      const normalizedTxId = txId.trim();
      
      // Use both a direct query and a normalized lowercase query to improve search
      let response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/swap/status/${normalizedTxId}`
      );
      
      // If first attempt fails, try with lowercase
      if (!response.ok) {
        response = await fetch(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/swap/status/${normalizedTxId.toLowerCase()}`
        );
        
        // If still fails, try with uppercase
        if (!response.ok) {
          response = await fetch(
            `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/swap/status/${normalizedTxId.toUpperCase()}`
          );
        }
      }
      
      const data = await response.json();
      
      if (data.success) {
        setTxCheckResult(data);
        setStatusError('');
      } else {
        setStatusError(data.error || 'Transaction not found');
        setTxCheckResult(null);
      }
    } catch (err) {
      setStatusError('Failed to check transaction status');
      setTxCheckResult(null);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and decimals
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleCurrencySwap = () => {
    // Only swap if both currencies are selected
    if (fromCurrency && toCurrency) {
      setFromCurrency(toCurrency);
      setToCurrency(fromCurrency);
    }
  };

  const [hasAgreedToWarning, setHasAgreedToWarning] = useState(false);

  const handleProceedToConfirm = () => {
    // Check if exchange rate is valid
    if (!exchangeRate || parseFloat(exchangeRate) <= 0) {
      setSwapError('Cannot proceed without a valid exchange rate. Please try again later.');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setSwapError('Please enter a valid amount');
      showCustomAlert('Please enter a valid amount');
      return;
    }
    
    // Check maximum transaction value (10K USD)
    if (fromUsdPrice && parseFloat(amount) * fromUsdPrice > 10000) {
      setSwapError('Maximum transaction limit is 10,000 USD per transaction');
      showCustomAlert('Maximum transaction limit is 10,000 USD per transaction');
      return;
    }
    
    if (!fromCurrency || !toCurrency) {
      setSwapError('Please select currencies');
      showCustomAlert('Please select currencies');
      return;
    }
    
    if (!toAddress) {
      setSwapError('Please enter your receiving wallet address');
      showCustomAlert('Please enter your receiving wallet address');
      return;
    }
    
    if (toAddress.length < 26) {
      setSwapError('Please enter a valid wallet address');
      showCustomAlert('Please enter a valid wallet address');
      return;
    }
    
    // Calculate to ensure we have a valid amount
    const calculatedValue = parseFloat(calculatedAmount);
    if (isNaN(calculatedValue) || calculatedValue <= 0) {
      setSwapError('Cannot complete transaction. The converted amount is invalid.');
      return;
    }
    
    setSwapError('');
    setShowConfirmDialog(true);
  };

  const handleConfirmSwap = async () => {
    // Double-check that exchange rate is valid before proceeding
    if (!exchangeRate || parseFloat(exchangeRate) <= 0) {
      setSwapError('Cannot complete transaction without a valid exchange rate.');
      setShowConfirmDialog(false);
      return;
    }
    
    // Check maximum transaction value again (10K USD)
    if (fromUsdPrice && parseFloat(amount) * fromUsdPrice > 10000) {
      setSwapError('Maximum transaction limit is 10,000 USD per transaction');
      setShowConfirmDialog(false);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // First, create a deposit intent
      const response = await fetch('http://localhost:5001/api/obiex/deposit-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currency: fromCurrency,
          network: fromCurrency === 'BTC' ? 'bitcoin' : 'ethereum',
          userId: 'user-123'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Store the intent ID and show waiting dialog
        setIntentId(result.data.intentId);
        setApprovalStatus('PENDING');
      setShowConfirmDialog(false);
        setShowWaitingDialog(true);
      } else {
        throw new Error(result.error?.message || 'Failed to create deposit intent');
      }
    } catch (err) {
      setSwapError('Swap initialization failed. Please try again.');
      showCustomAlert('Swap initialization failed. Please try again.');
      console.error(err);
      setShowConfirmDialog(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setShowSuccessDialog(false);
    setShowWaitingDialog(false);
    setIntentId('');
    setApprovalStatus('');
    setAmount('');
    setCalculatedAmount(null);
    setFromAmountUsd(null);
    setToAmountUsd(null);
    setAutoCloseCountdown(3);
  };
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        showCustomAlert('Copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        showCustomAlert('Failed to copy: ' + err);
      });
  };

  const handleClearAll = () => {
    setAmount('');
    setToAddress('');
    setCalculatedAmount(null);
    setFromAmountUsd(null);
    setToAmountUsd(null);
  };

  // Format numbers for display
  const formatNumber = (number, decimals = 8) => {
    if (!number) return '0';
    const parsed = parseFloat(number);
    if (isNaN(parsed)) return '0';
    if (parsed < 0.00001) {
      return parsed.toFixed(8);
    }
    return parsed.toString();
  };

  // Custom Alert Dialog Component
  const renderAlertDialog = () => {
    if (!showAlert) return null;
    return (
      <div className="retro-dialog-overlay">
        <div className="retro-dialog retro-alert">
          <div className="retro-dialog-title">
            <span>Sw4p Alert</span>
            <button className="retro-close-button" onClick={() => setShowAlert(false)}>X</button>
          </div>
          <div className="retro-dialog-content">
            <div className="retro-alert-icon">!</div>
            <div className="retro-alert-message">{alertMessage}</div>
          </div>
          <div className="retro-dialog-buttons">
            <button className="retro-button" onClick={() => setShowAlert(false)}>OK</button>
          </div>
        </div>
      </div>
    );
  };

  // Custom Confirmation Dialog Component
  const renderConfirmationDialog = () => {
    if (!showConfirmationDialog) return null;
    return (
      <div className="retro-dialog-overlay">
        <div className="retro-dialog retro-alert">
          <div className="retro-dialog-title">
            <span>Confirm</span>
            <button className="retro-close-button" onClick={() => setShowConfirmationDialog(false)}>X</button>
          </div>
          <div className="retro-dialog-content">
            <div className="retro-confirm-message">{confirmationMessage}</div>
          </div>
          <div className="retro-dialog-buttons">
            <button className="retro-button" onClick={() => {
              setShowConfirmationDialog(false);
            }}>Cancel</button>
            <button className="retro-button" onClick={() => {
              setShowConfirmationDialog(false);
              if (confirmCallback) {
                confirmCallback();
              }
            }}>OK</button>
          </div>
        </div>
      </div>
    );
  };
  
  // Help Dialog Component
  const renderHelpDialog = () => {
    if (!showHelpDialog) return null;
    return (
      <div className="retro-dialog-overlay">
        <div className="retro-dialog retro-help-dialog">
          <div className="retro-dialog-title">
            <span>Sw4p Help</span>
            <button className="retro-close-button" onClick={() => setShowHelpDialog(false)}>X</button>
          </div>
          <div className="retro-dialog-content retro-help-content">
            <h3 className="retro-help-header">How to Use Sw4p</h3>
            
            <div className="retro-help-section">
              <h4>Step 1: Select Currencies</h4>
              <p>Choose the cryptocurrency you want to exchange and the one you want to receive.</p>
            </div>
            
            <div className="retro-help-section">
              <h4>Step 2: Enter Amount</h4>
              <p>Enter the amount you wish to exchange. The system will calculate what you'll receive.</p>
              <p className="retro-help-note">Note: There is a 10,000 USD limit per transaction.</p>
            </div>
            
            <div className="retro-help-section">
              <h4>Step 3: Enter Receiving Address</h4>
              <p>Enter the wallet address where you'd like to receive your exchanged cryptocurrency.</p>
            </div>
            
            <div className="retro-help-section">
              <h4>Step 4: Review and Confirm</h4>
              <p>Carefully review all transaction details before confirming.</p>
            </div>
            
            <div className="retro-help-section">
              <h4>Step 5: Send Funds</h4>
              <p>Once confirmed, send your funds to the provided deposit address.</p>
            </div>
            
            <div className="retro-help-section">
              <h4>Transaction Status</h4>
              <p>Check your transaction status anytime using the "Check Status" tab and your Transaction ID.</p>
            </div>
            
            <div className="retro-help-separator"></div>
            
            <div className="retro-help-support">
              <h4>Need Help?</h4>
              <p>If you encounter any issues, please contact our support team:</p>
              <p className="retro-help-email">support@sw4p.io</p>
            </div>
          </div>
          <div className="retro-dialog-buttons">
            <button className="retro-button" onClick={() => setShowHelpDialog(false)}>Close</button>
          </div>
        </div>
      </div>
    );
  };

  // Waiting for Confirmation Dialog
  const renderWaitingDialog = () => {
    if (!showWaitingDialog) return null;
    
    return (
      <div className="retro-dialog-overlay">
        <div className="retro-dialog">
          <div className="retro-dialog-title">
            <span>⏳ Waiting for Confirmation</span>
            <button className="retro-close-button" onClick={() => setShowWaitingDialog(false)}>X</button>
          </div>
          <div className="retro-dialog-content" style={{ textAlign: 'center', padding: '20px' }}>
            {/* Pulse Animation */}
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
              margin: '20px auto',
              animation: 'pulse 2s ease-in-out infinite',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              color: 'white'
            }}>
              🔄
              <style>
                {`
                  @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 1; }
                  }
                `}
              </style>
            </div>
            
            <div style={{
              backgroundColor: '#e0f2fe',
              color: '#0277bd',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #29b6f6',
              marginBottom: '16px'
            }}>
              <h3 style={{ margin: '0 0 8px 0' }}>Waiting for Confirmation...</h3>
              <p style={{ margin: '0', fontSize: '14px' }}>
                Your transaction is being processed. This usually takes a few minutes.
              </p>
            </div>

            {/* Send Instructions */}
            <div style={{
              backgroundColor: '#fff3cd',
              color: '#856404',
              padding: '16px',
              borderRadius: '8px',
              border: '2px solid #ffd700',
              marginBottom: '16px'
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>📤 Send Payment</h3>
              <div style={{ marginBottom: '12px' }}>
                <strong>Amount to Send:</strong>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#d63384' }}>
                  {formatNumber(amount)} {fromCurrency}
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Send to Address:</strong>
                <div style={{
                  backgroundColor: '#fff',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  wordBreak: 'break-all',
                  marginTop: '4px'
                }}>
                  {depositAddress}
                </div>
                <button
                  style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                  onClick={() => copyToClipboard(depositAddress)}
                >
                  📋 Copy Address
                </button>
              </div>
              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                ⚠️ Send exactly {formatNumber(amount)} {fromCurrency} to complete the swap
              </div>
            </div>
            
            <div className="retro-dialog-row">
              <span>You'll receive:</span>
              <span className="retro-highlight">{calculatedAmount ? formatNumber(calculatedAmount) : '0.0'} {toCurrency}</span>
            </div>
            <div className="retro-dialog-row">
              <span>Status:</span>
              <span className="retro-highlight">{approvalStatus || 'PENDING'}</span>
            </div>
          </div>
          <div className="retro-dialog-buttons">
            <button className="retro-button" onClick={() => setShowWaitingDialog(false)}>Cancel</button>
          </div>
        </div>
      </div>
    );
  };

  const renderConfirmDialog = () => {
    if (!showConfirmDialog) return null;
    return (
      <div className="retro-dialog-overlay">
        <div className="retro-dialog">
          <div className="retro-dialog-title">
            <span>Confirm Swap</span>
            <button className="retro-close-button" onClick={() => setShowConfirmDialog(false)}>X</button>
          </div>
          <div className="retro-dialog-content">
            <div className="retro-dialog-row">
              <span>You send:</span>
              <span className="retro-highlight">
                {formatNumber(amount)} {fromCurrency}
              </span>
            </div>
            {fromAmountUsd && (
              <div className="retro-dialog-row">
                <span>USD Value:</span>
                <span>${fromAmountUsd}</span>
              </div>
            )}
            <div className="retro-dialog-row">
              <span>Deposit address:</span>
              <span className="retro-address">{depositAddress}</span>
            </div>
            
            <div className="retro-dialog-row">
              <span>You receive:</span>
              <span className="retro-highlight">
                {calculatedAmount ? formatNumber(calculatedAmount) : '0.0'} {toCurrency}
              </span>
            </div>
            {toAmountUsd && (
              <div className="retro-dialog-row">
                <span>USD Value:</span>
                <span>${toAmountUsd}</span>
              </div>
            )}
            <div className="retro-dialog-row">
              <span>Receiving address:</span>
              <span className="retro-address">{toAddress}</span>
            </div>
            <div className="retro-dialog-row">
              <span>Exchange rate:</span>
              <span>
                1 {fromCurrency} = {formatNumber(exchangeRate)} {toCurrency}
              </span>
            </div>
            <div className="retro-warning">
              WARNING: Please verify all information above is correct.
              Cryptocurrency transactions cannot be reversed once confirmed.
            </div>
            <div className="retro-checkbox-label">
              <input
                type="checkbox"
                checked={hasAgreedToWarning}
                onChange={(e) => setHasAgreedToWarning(e.target.checked)}
                disabled={isLoading}
              />
              I understand that cryptocurrency transactions cannot be reversed once confirmed and I have verified all transaction details.
            </div>
          </div>
          <div className="retro-dialog-buttons">
            <button
              className="retro-button"
              onClick={handleConfirmSwap}
              disabled={isLoading || !hasAgreedToWarning}
            >
              Confirm Swap
            </button>
            <button
              className="retro-button"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSuccessDialog = () => {
    if (!showSuccessDialog || !swapResult) return null;
    
    return (
      <div className="retro-dialog-overlay">
        <div className="retro-dialog">
          <div className="retro-dialog-title">
            <span>Swap Completed ✓</span>
            <button className="retro-close-button" onClick={handleReset}>X</button>
          </div>
          <div className="retro-dialog-content">
            <div className="retro-success-icon">✓</div>
            <div className="retro-dialog-row">
              <span>You sent:</span>
              <span className="retro-highlight">
                {formatNumber(swapResult.fromAmount)} {swapResult.fromCurrency}
              </span>
            </div>
            {fromAmountUsd && (
              <div className="retro-dialog-row">
                <span>USD Value:</span>
                <span>${fromAmountUsd}</span>
              </div>
            )}
            <div className="retro-dialog-row">
              <span>Deposit address:</span>
              <span className="retro-address">{swapResult.depositAddress}</span>
            </div>

            {/* REMOVED: Fee display */}

            <div className="retro-dialog-row">
              <span>You received:</span>
              <span className="retro-highlight">
                {formatNumber(swapResult.toAmount)} {swapResult.toCurrency}
              </span>
            </div>
            {toAmountUsd && (
              <div className="retro-dialog-row">
                <span>USD Value:</span>
                <span>${toAmountUsd}</span>
              </div>
            )}
            <div className="retro-dialog-row">
              <span>Receiving address:</span>
              <span className="retro-address">{swapResult.receivingAddress}</span>
            </div>
            <div className="retro-dialog-row">
              <span>Exchange rate:</span>
              <span>
                1 {swapResult.fromCurrency} = {formatNumber(swapResult.exchangeRate)}{' '}
                {swapResult.toCurrency}
              </span>
            </div>
            <div className="retro-dialog-row">
              <span>Transaction ID:</span>
              <span className="retro-address">{swapResult.transactionId}</span>
            </div>
            <div className="retro-dialog-row">
              <span>Time:</span>
              <span>{new Date(swapResult.timestamp).toLocaleString()}</span>
            </div>
          </div>
          <div className="retro-dialog-buttons">
            <button className="retro-button" onClick={handleReset}>Close</button>
            <div style={{
              fontSize: '11px',
              color: '#666',
              marginTop: '8px',
              textAlign: 'center'
            }}>
              Auto-closing in {autoCloseCountdown} seconds...
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleWalletConnected = (walletResult) => {
    setConnectedWallet(walletResult);
    console.log('Wallet connected:', walletResult);
  };

  const handleWalletDisconnected = () => {
    setConnectedWallet(null);
    console.log('Wallet disconnected');
  };

  const handleSendFunds = async () => {
    if (!connectedWallet) {
      showCustomAlert('Please connect your wallet first');
      return;
    }

    setShowSendModal(true);
  };

  const executeSendTransaction = async () => {
    if (!sendAmount || !sendAddress) {
      showCustomAlert('Please enter amount and address');
      return;
    }

    setIsSending(true);
    try {
      const result = await walletService.sendTransaction(
        sendAddress,
        sendAmount,
        fromCurrency
      );

      if (result.success) {
        showCustomAlert(`Transaction sent! Hash: ${result.txHash.slice(0, 10)}...`);
        setShowSendModal(false);
        setSendAmount('');
        setSendAddress('');
      }
    } catch (error) {
      console.error('Error sending transaction:', error);
      showCustomAlert(`Transaction failed: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Admin panel detection (simple check for demo)
  const isAdmin = () => {
    return localStorage.getItem('adminToken') || window.location.search.includes('admin=true');
  };

  return (
    <div className={`retro-app ${isMinimized ? 'minimized' : ''}`} onClick={closeMenus}>
      <div className={`retro-window ${isMinimized ? 'minimized' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="retro-title-bar">
          <div className="retro-title">Sw4p v0.1</div>
          <div className="retro-window-controls">
            <button className="retro-minimize" onClick={handleMinimize}>_</button>
            <button className="retro-maximize">□</button>
            <button className="retro-close" onClick={handleCloseWindow}>X</button>
          </div>
        </div>
        {!isMinimized && (
          <div className="retro-menu-bar">
            <div
              className="retro-menu-item"
              onClick={(e) => {
                e.stopPropagation();
                toggleFileMenu();
              }}
            >
              File
              {showFileMenu && (
                <div className="retro-dropdown-menu">
                  <div className="retro-menu-option" onClick={handleNewTransaction}>
                    New Transaction
                  </div>
                  <div className="retro-menu-separator"></div>
                  <div className="retro-menu-option" onClick={handleCloseWindow}>
                    Exit
                  </div>
                </div>
              )}
            </div>
            <div className="retro-menu-item">Options</div>
            <div className="retro-menu-item" onClick={handleOpenHelp}>Help</div>
          </div>
        )}
        {!isMinimized && (
          <div className="retro-content">
          <div className="retro-sidebar">
            <button className="retro-icon-button retro-swap-icon" title="Swap Currencies"></button>
            <button className="retro-icon-button retro-address-icon" title="Address Book"></button>
          </div>
          <div className="retro-main">
            <div className="retro-tabs">
              <button
                className={`retro-tab ${activeTab === 'swap' ? 'retro-active-tab' : ''}`}
                onClick={() => handleTabChange('swap')}
              >
                Swap Currencies
              </button>
              <button
                className={`retro-tab ${activeTab === 'wallet' ? 'retro-active-tab' : ''}`}
                onClick={() => handleTabChange('wallet')}
              >
                Wallet
              </button>
                          <button
              className={`retro-tab ${activeTab === 'status' ? 'retro-active-tab' : ''}`}
              onClick={() => handleTabChange('status')}
            >
              Check Status
            </button>
            {isAdmin() && (
              <button
                className={`retro-tab ${activeTab === 'admin' ? 'retro-active-tab' : ''}`}
                onClick={() => handleTabChange('admin')}
              >
                🔐 Admin Panel
              </button>
            )}
          </div>

            {/* WALLET TAB */}
            {activeTab === 'wallet' && (
              <div className="retro-tab-content">
                <WalletConnect 
                  onWalletConnected={handleWalletConnected}
                  onWalletDisconnected={handleWalletDisconnected}
                />
              </div>
            )}

            {/* ADMIN TAB */}
            {activeTab === 'admin' && isAdmin() && (
              <div className="retro-tab-content">
                <DepositApproval />
              </div>
            )}

                      {/* SWAP TAB */}
          {activeTab === 'swap' && activeTab !== 'admin' && (
              <div className="retro-tab-content">
                {/* Wallet Status Display */}
                {connectedWallet && (
                  <div className="retro-wallet-status">
                    <div className="retro-wallet-status-text">
                      🟢 Wallet Connected: {connectedWallet.account?.slice(0, 8)}...{connectedWallet.account?.slice(-6)}
                      <span className="retro-wallet-network"> ({connectedWallet.network})</span>
                    </div>
                    <button 
                      className="retro-button retro-send-funds-btn"
                      onClick={handleSendFunds}
                    >
                      Send Funds
                    </button>
                  </div>
                )}
                
                <div className="retro-form-row">
                  <div className="retro-form-group">
                    <label className="retro-label">From Currency: </label>
                    <div className="retro-select-wrapper">
                      <select
                        className="retro-select"
                        value={fromCurrency}
                        onChange={(e) => {
                          const selectedCurrency = e.target.value;
                          setFromCurrency(selectedCurrency);
                          // If same as toCurrency, clear the toCurrency
                          if (selectedCurrency === toCurrency) {
                            setToCurrency('');
                          }
                        }}
                        disabled={isLoading}
                      >
                        <option value="">Select</option>
                        {currencies.map(currency => (
                          <option 
                            key={currency.code} 
                            value={currency.code}
                          >
                            {currency.code} {getCurrencyNetworkLabel(currency.code)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="retro-form-group">
                    <label className="retro-label">Amount: </label>
                    <div className="retro-input-with-usd">
                      <input
                        type="text"
                        className="retro-input"
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="0.0"
                        disabled={isLoading}
                      />
                      {fromAmountUsd && (
                        <span className="retro-usd-value-inline">≈ ${fromAmountUsd} USD</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="retro-form-row">
                  <label className="retro-label">
                    Your Deposit Address (Send {fromCurrency} here):
                  </label>
                  <div className="retro-address-container">
                    <input
                      type="text"
                      className="retro-input"
                      value={depositAddress}
                      readOnly
                    />
                    <button
                      className="retro-button"
                      onClick={() => copyToClipboard(depositAddress)}
                    >
                      Copy to Clipboard
                    </button>
                  </div>
                </div>
                <div className="retro-swap-icon-container">
                  <button
                    className="retro-swap-direction-button"
                    onClick={handleCurrencySwap}
                    disabled={isLoading || !fromCurrency || !toCurrency}
                  >
                    ⇅
                  </button>
                </div>
                <div className="retro-form-row">
                  <div className="retro-form-group">
                    <label className="retro-label">To Currency: </label>
                    <div className="retro-select-wrapper">
                      <select
                        className="retro-select"
                        value={toCurrency}
                        onChange={(e) => {
                          const selectedCurrency = e.target.value;
                          setToCurrency(selectedCurrency);
                          // If same as fromCurrency, clear the fromCurrency
                          if (selectedCurrency === fromCurrency) {
                            setFromCurrency('');
                          }
                        }}
                        disabled={isLoading}
                      >
                        <option value="">Select</option>
                        {currencies.map(currency => (
                          <option 
                            key={currency.code} 
                            value={currency.code}
                          >
                            {currency.code} {getCurrencyNetworkLabel(currency.code)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="retro-form-group">
                    <label className="retro-label">You Receive: </label>
                    <div className="retro-input-with-usd">
                      <input
                        type="text"
                        className="retro-input retro-readonly"
                        value={calculatedAmount ? formatNumber(calculatedAmount) : '0.0'}
                        readOnly
                      />
                      {toAmountUsd && (
                        <span className="retro-usd-value-inline">≈ ${toAmountUsd} USD</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="retro-form-row">
                  <label className="retro-label">
                    Your {toCurrency} Wallet Address (To Receive):
                  </label>
                  <input
                    type="text"
                    className="retro-input"
                    value={toAddress}
                    onChange={(e) => setToAddress(e.target.value)}
                    placeholder={`Enter your ${toCurrency} wallet address here`}
                    disabled={isLoading}
                  />
                </div>
                <div className="retro-form-row">
                  <div className="retro-exchange-rate">
                    Exchange Rate: 1 {fromCurrency} ={' '}
                    {exchangeRate ? formatNumber(exchangeRate) : '0.0'} {toCurrency}
                    {fromUsdPrice && toUsdPrice && (
                      <div>
                        USD Prices: 1 {fromCurrency} = ${formatNumber(fromUsdPrice)} | 1{' '}
                        {toCurrency} = ${formatNumber(toUsdPrice)}
                      </div>
                    )}
                    {/* REMOVED: Fee info from the UI */}
                  </div>
                </div>
                {swapError && <div className="retro-error">{swapError}</div>}
                <div className="retro-form-buttons">
                  <button
                    className="retro-button"
                    onClick={handleProceedToConfirm}
                    disabled={isLoading || !fromCurrency || !toCurrency || !amount || amount <= 0 || !exchangeRate}
                  >
                    Review Swap
                  </button>
                  <button
                    className="retro-button"
                    onClick={handleClearAll}
                    disabled={isLoading}
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}

            {/* STATUS TAB */}
            {activeTab === 'status' && (
              <div className="retro-tab-content">
                <div className="retro-form-row">
                  <label className="retro-label">Enter Transaction ID:</label>
                  <div className="retro-status-check">
                    <input
                      type="text"
                      className="retro-input"
                      value={txId}
                      onChange={(e) => setTxId(e.target.value)}
                      placeholder="TX12345AB..."
                    />
                    <button
                      className="retro-button"
                      onClick={checkTransactionStatus}
                      disabled={isLoading}
                    >
                      Check Status
                    </button>
                  </div>
                </div>

                {txCheckResult && (
                  <div className="retro-transaction-result">
                    <h3>Transaction Details</h3>
                    <div className="retro-transaction-details">
                      <div className="retro-detail-row">
                        <span className="retro-detail-label">Status:</span>
                        <span className={`retro-status-${txCheckResult.status}`}>
                          {txCheckResult.status}
                        </span>
                      </div>
                      <div className="retro-detail-row">
                        <span className="retro-detail-label">From:</span>
                        <span>
                          {txCheckResult.fromAmount} {txCheckResult.fromCurrency}
                        </span>
                      </div>
                      <div className="retro-detail-row">
                        <span className="retro-detail-label">To:</span>
                        <span>
                          {txCheckResult.toAmount} {txCheckResult.toCurrency}
                        </span>
                      </div>

                      {/* REMOVED: Fee display in status tab */}

                      <div className="retro-detail-row">
                        <span className="retro-detail-label">Created:</span>
                        <span>{new Date(txCheckResult.timestamp).toLocaleString()}</span>
                      </div>
                      {txCheckResult.status === 'completed' && (
                        <>
                          <div className="retro-detail-row">
                            <span className="retro-detail-label">Completed:</span>
                            <span>{new Date(txCheckResult.completedAt).toLocaleString()}</span>
                          </div>
                          <div className="retro-detail-row">
                            <span className="retro-detail-label">Transaction Hash:</span>
                            <span className="retro-tx-hash">{txCheckResult.txHash}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {statusError && <div className="retro-error">{statusError}</div>}
              </div>
            )}
          </div>
        </div>
        )}
        
        {/* Taskbar - always visible */}
        <div className="retro-taskbar">
          <div className="retro-taskbar-start">
            <button 
              className={`retro-taskbar-button ${isMinimized ? 'retro-taskbar-button-active' : ''}`}
              onClick={handleRestore}
            >
              📊 Sw4p v0.1
            </button>
          </div>
          <div className="retro-taskbar-end">
            <div className="retro-taskbar-time">
              {currentTime.getHours()}:{currentTime.getMinutes().toString().padStart(2, '0')}
            </div>
          </div>
        </div>
        
        {!isMinimized && (
          <div className="retro-status-bar">
            <div className="retro-status-text">
              Ready - Connected to {connectionCount} nodes - Last updated:{' '}
              {currentTime.toLocaleDateString()}{' '}
              {currentTime.getHours()}:
              {currentTime.getMinutes().toString().padStart(2, '0')}
            </div>
            <div className="retro-status-version">v0.1 Alpha</div>
          </div>
        )}
      </div>

      {/* Render all dialogs */}
      {renderAlertDialog()}
      {renderConfirmationDialog()}
      {renderConfirmDialog()}
      {renderSuccessDialog()}
      {renderHelpDialog()}
      {renderWaitingDialog()}

      {/* Send Transaction Modal */}
      {showSendModal && (
        <div className="retro-send-modal">
          <div className="retro-send-modal-content">
            <h3>Send {fromCurrency}</h3>
            <div className="retro-send-form">
              <div className="retro-form-row">
                <label>Amount:</label>
                <input
                  type="number"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  className="retro-input"
                  placeholder="Enter amount"
                />
              </div>
              <div className="retro-form-row">
                <label>To Address:</label>
                <input
                  type="text"
                  value={sendAddress}
                  onChange={(e) => setSendAddress(e.target.value)}
                  className="retro-input"
                  placeholder="Enter recipient address"
                />
              </div>
              <div className="retro-send-buttons">
                <button 
                  className="retro-button"
                  onClick={() => setShowSendModal(false)}
                  disabled={isSending}
                >
                  Cancel
                </button>
                <button 
                  className="retro-button"
                  onClick={executeSendTransaction}
                  disabled={isSending || !sendAmount || !sendAddress}
                >
                  {isSending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;


