const express = require('express');
const axios = require('axios');
const router = express.Router();

// Import the Obiex client
const obiexClient = require('../dist/services/obiexClient').default;

// Currency code to CoinGecko ID mapping for fallback
const currencyIdMap = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'USDT': 'tether',
  'USDC': 'usd-coin',
  'BNB': 'binancecoin',
  'XRP': 'ripple',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'SHIB': 'shiba-inu',
  'DOT': 'polkadot',
  'AVAX': 'avalanche-2',
  'MATIC': 'polygon',
  'LTC': 'litecoin',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'ATOM': 'cosmos',
  'XLM': 'stellar',
  'NEAR': 'near',
  'ALGO': 'algorand',
  'ICP': 'internet-computer',
  'FIL': 'filecoin',
  'VET': 'vechain',
  'MANA': 'decentraland',
  'SAND': 'the-sandbox',
  'AXS': 'axie-infinity'
};

// Cache for currency data
let currencyCache = {
  data: null,
  timestamp: null
};

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Get supported currencies from Obiex
router.get('/currencies', async (req, res) => {
  try {
    // Check if we have valid cached data
    if (currencyCache.data && currencyCache.timestamp && (Date.now() - currencyCache.timestamp < CACHE_DURATION)) {
      console.log('Returning cached currency data');
      return res.json({ success: true, currencies: currencyCache.data });
    }

    // Get trade pairs from Obiex to determine supported currencies
    console.log('Fetching supported currencies from Obiex...');
    
    // For now, we'll use a comprehensive list of supported currencies
    // In the future, we can fetch this dynamically from Obiex API
    const supportedCurrencies = [
      { code: 'BTC', name: 'Bitcoin', usdPrice: null },
      { code: 'ETH', name: 'Ethereum', usdPrice: null },
      { code: 'USDT', name: 'Tether', usdPrice: null },
      { code: 'USDC', name: 'USD Coin', usdPrice: null },
      { code: 'SOL', name: 'Solana', usdPrice: null },
      { code: 'TRX', name: 'TRON', usdPrice: null },
      { code: 'BNB', name: 'BNB', usdPrice: null },
      { code: 'DOGE', name: 'Dogecoin', usdPrice: null },
      { code: 'ADA', name: 'Cardano', usdPrice: null },
      { code: 'XRP', name: 'XRP', usdPrice: null },
      { code: 'LINK', name: 'Chainlink', usdPrice: null },
      { code: 'SHIB', name: 'Shiba Inu', usdPrice: null },
      { code: 'PEPE', name: 'Pepe', usdPrice: null },
      { code: 'AVAX', name: 'Avalanche', usdPrice: null },
      { code: 'TON', name: 'TON', usdPrice: null },
      { code: 'SUI', name: 'Sui', usdPrice: null },
      { code: 'LTC', name: 'Litecoin', usdPrice: null },
      { code: 'BCH', name: 'Bitcoin Cash', usdPrice: null },
      { code: 'DOT', name: 'Polkadot', usdPrice: null },
      { code: 'MANA', name: 'Decentraland', usdPrice: null },
      { code: 'SAND', name: 'The Sandbox', usdPrice: null },
      { code: 'APE', name: 'ApeCoin', usdPrice: null },
      { code: 'FLOKI', name: 'FLOKI', usdPrice: null },
      { code: 'WLD', name: 'Worldcoin', usdPrice: null },
      { code: 'EIGEN', name: 'EigenLayer', usdPrice: null },
      { code: 'MEME', name: 'MEME', usdPrice: null },
      { code: 'POL', name: 'Polygon', usdPrice: null },
      { code: 'ARB', name: 'Arbitrum', usdPrice: null },
      { code: 'AXS', name: 'Axie Infinity', usdPrice: null },
      { code: 'LUNA', name: 'Terra', usdPrice: null },
      { code: 'PNUT', name: 'Peanut', usdPrice: null },
      { code: 'ACT', name: 'ACT', usdPrice: null },
      { code: 'TRUMP', name: 'TRUMP', usdPrice: null },
      { code: 'NGNX', name: 'NGNX', usdPrice: null },
      { code: 'CNGN', name: 'CNGN', usdPrice: null },
      { code: 'GHS', name: 'GHS', usdPrice: null },
      { code: 'XAF', name: 'XAF', usdPrice: null },
      { code: 'AAVE', name: 'Aave', usdPrice: null },
      { code: 'DAI', name: 'Dai', usdPrice: null }
    ];

    // Update cache
    currencyCache = {
      data: supportedCurrencies,
      timestamp: Date.now()
    };
    
    console.log(`✅ Fetched ${supportedCurrencies.length} supported currencies from Obiex`);
    res.json({ success: true, currencies: supportedCurrencies });
  } catch (error) {
    console.error('Error fetching currencies from Obiex:', error);
    
    // If we have cached data, return it even if expired
    if (currencyCache.data) {
      console.log('Returning expired cached data due to API error');
      return res.json({ success: true, currencies: currencyCache.data });
    }

    // If no cache and API error, return error
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch currencies from Obiex. Please try again later.',
      details: error.message
    });
  }
});

// Get exchange rate for a pair using Obiex with CoinGecko fallback
router.get('/:fromCurrency/:toCurrency', async (req, res) => {
  try {
    const { fromCurrency, toCurrency } = req.params;
    console.log(`🔄 Getting exchange rate for ${fromCurrency} to ${toCurrency}`);
    
    // Try Obiex first
    try {
      console.log(`📞 Trying Obiex createQuote with:`, {
        source: fromCurrency.toUpperCase(),
        target: toCurrency.toUpperCase(),
        side: 'SELL',
        amount: 1
      });
      
      // Create quote using Obiex API
      const quote = await obiexClient.createQuote(
        fromCurrency.toUpperCase(), 
        toCurrency.toUpperCase(), 
        'SELL', 
        1
      );
      
      console.log(`✅ Obiex quote received: ${quote.rate} ${toCurrency} per ${fromCurrency}`);
      
      // Calculate USD prices based on the rate
      const fromUsdPrice = quote.rate * 1; // Placeholder - would need USD conversion
      const toUsdPrice = 1; // Placeholder - would need USD conversion
      
      return res.json({
        success: true,
        rate: quote.rate,
        fromUsdPrice: fromUsdPrice,
        toUsdPrice: toUsdPrice,
        timestamp: new Date(),
        quoteId: quote.id,
        expiryDate: quote.expiryDate,
        source: 'Obiex'
      });
    } catch (obiexError) {
      console.log(`⚠️ Obiex failed, falling back to CoinGecko: ${obiexError.message}`);
      
      // Fallback to CoinGecko
      const fromId = currencyIdMap[fromCurrency.toUpperCase()] || fromCurrency.toLowerCase();
      const toId = currencyIdMap[toCurrency.toUpperCase()] || toCurrency.toLowerCase();
      
      console.log(`📞 Using CoinGecko fallback: ${fromId} to ${toId}`);
      
      // Get prices in USD from CoinGecko
      const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
        params: {
          ids: `${fromId},${toId}`,
          vs_currencies: 'usd'
        },
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Sw4p/1.0'
        }
      });

      if (!response.data[fromId] || !response.data[toId]) {
        throw new Error(`Currency not found in CoinGecko. Used ${fromId} and ${toId} as IDs.`);
      }

      // Calculate the exchange rate
      const fromUsd = response.data[fromId].usd;
      const toUsd = response.data[toId].usd;
      const rate = fromUsd / toUsd;

      console.log(`✅ CoinGecko rate received: ${rate} ${toCurrency} per ${fromCurrency}`);

      res.json({
        success: true,
        rate,
        fromUsdPrice: fromUsd,
        toUsdPrice: toUsd,
        timestamp: new Date(),
        source: 'CoinGecko (fallback)'
      });
    }
  } catch (error) {
    console.error('❌ Error fetching exchange rate:', error);
    
    let errorMessage = 'Failed to fetch exchange rate';
    if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

module.exports = router;