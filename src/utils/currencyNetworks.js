/**
 * Currency to Network mapping for Obiex API
 * Based on actual API testing results
 */

export const getCurrencyNetwork = (currency) => {
  const networkMap = {
    // Cryptocurrencies with their own networks
    'BTC': 'BTC',
    'ETH': 'ETH',
    'SOL': 'SOL',
    'TRX': 'TRX',
    'LTC': 'LTC',
    'BCH': 'BCH',
    'DOGE': 'DOGE',
    'DOT': 'DOT',
    'ADA': 'ADA', // May not be supported yet
    'XRP': 'XRP', // May not be supported yet
    'AVAX': 'AVAX',
    'TON': 'TON',
    'SUI': 'SUI',
    
    // Tokens on Ethereum network
    'USDT': 'ETH', // USDT on Ethereum
    'USDC': 'ETH', // USDC on Ethereum
    'DAI': 'ETH',
    'LINK': 'ETH',
    'AAVE': 'ETH',
    'MANA': 'ETH',
    'SAND': 'ETH',
    'APE': 'ETH',
    'SHIB': 'ETH',
    'PEPE': 'ETH',
    'FLOKI': 'ETH',
    'WLD': 'ETH',
    'EIGEN': 'ETH',
    'MEME': 'ETH',
    
    // Tokens on BSC network
    'BNB': 'BSC',
    
    // Tokens on Polygon network  
    'POL': 'POL',
    
    // Tokens on Arbitrum
    'ARB': 'ARB',
    
    // Other tokens
    'AXS': 'ETH', // Axie Infinity on Ethereum
    'LUNA': 'LUNA', // Terra Luna
    'PNUT': 'SOL', // Peanut on Solana
    'ACT': 'SOL', // ACT on Solana
    'TRUMP': 'SOL', // TRUMP token on Solana
    
    // Fiat/Stablecoins
    'NGNX': 'ETH', // Nigerian Naira on Ethereum
    'CNGN': 'ETH', // Celo Nigerian Naira
    'GHS': 'ETH', // Ghana Cedi
    'XAF': 'ETH', // Central African Franc
  };
  
  return networkMap[currency] || currency;
};

/**
 * Get display name for currency network
 */
export const getNetworkDisplayName = (currency) => {
  const network = getCurrencyNetwork(currency);
  
  const displayNames = {
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum',
    'SOL': 'Solana', 
    'TRX': 'TRON',
    'BSC': 'Binance Smart Chain',
    'POL': 'Polygon',
    'ARB': 'Arbitrum',
    'AVAX': 'Avalanche',
    'TON': 'TON',
    'SUI': 'Sui',
    'LTC': 'Litecoin',
    'BCH': 'Bitcoin Cash',
    'DOGE': 'Dogecoin',
    'DOT': 'Polkadot',
    'ADA': 'Cardano',
    'XRP': 'XRP Ledger',
    'LUNA': 'Terra'
  };
  
  return displayNames[network] || network;
};

/**
 * Check if a currency is supported for deposit address generation
 */
export const isCurrencySupported = (currency) => {
  const supportedCurrencies = [
    'BTC', 'ETH', 'SOL', 'TRX', 'LTC', 'BCH', 'DOGE', 'AVAX', 'TON', 'SUI',
    'USDT', 'USDC', 'DAI', 'LINK', 'AAVE', 'MANA', 'SAND', 'APE', 'SHIB', 
    'PEPE', 'FLOKI', 'WLD', 'EIGEN', 'MEME', 'BNB', 'POL', 'ARB', 'AXS',
    'LUNA', 'PNUT', 'ACT', 'TRUMP', 'NGNX', 'CNGN', 'GHS', 'XAF'
  ];
  
  return supportedCurrencies.includes(currency);
}; 