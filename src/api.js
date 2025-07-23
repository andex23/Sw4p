// src/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

/**
 * Handles API response and error handling
 * @param {Response} response - Fetch API response
 * @returns {Promise} - Resolved with JSON data or rejected with error
 */
async function handleResponse(response) {
  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
    } catch (e) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  }
  return response.json();
}

/**
 * Fetches list of supported currencies
 * @returns {Promise} - Promise with currencies data
 */
export async function fetchCurrencies() {
  try {
    console.log('[Sw4p] Connecting to server...');
    const response = await fetch(`${API_BASE_URL}/rates/currencies`);
    console.log('[Sw4p] Connection established. Downloading currency list...');
    return handleResponse(response);
  } catch (error) {
    console.error('[Sw4p] Error: Failed to fetch currencies:', error);
    throw error;
  }
}

/**
 * Gets exchange rate for a currency pair
 * @param {String} fromCurrency - Source currency code
 * @param {String} toCurrency - Target currency code
 * @returns {Promise} - Promise with exchange rate data
 */
export async function getExchangeRate(fromCurrency, toCurrency) {
  try {
    console.log(`[Sw4p] Fetching exchange rate for ${fromCurrency}/${toCurrency}...`);
    const response = await fetch(`${API_BASE_URL}/rates/${fromCurrency}/${toCurrency}`);
    const data = await handleResponse(response);
    console.log(`[Sw4p] Exchange rate received: 1 ${fromCurrency} = ${data.rate} ${toCurrency}`);
    console.log(`[Sw4p] USD Price: ${fromCurrency} = $${data.fromUsdPrice}, ${toCurrency} = $${data.toUsdPrice}`);
    return data;
  } catch (error) {
    console.error(`[Sw4p] Error: Failed to fetch exchange rate:`, error);
    throw error;
  }
}

/**
 * Calculates a currency swap
 * @param {String} fromCurrency - Source currency code
 * @param {String} toCurrency - Target currency code
 * @param {Number} amount - Amount to swap
 * @param {String} depositAddress - Address where user sends funds
 * @param {String} receivingAddress - Address where user receives converted funds
 * @param {Number} feePercentage - The fee percentage to apply (default 1.7)
 * @returns {Promise} - Promise with swap calculation result
 */
export async function calculateSwap(fromCurrency, toCurrency, amount, depositAddress, receivingAddress, feePercentage = 1.7) {
  try {
    console.log(`[Sw4p] Initiating swap: ${amount} ${fromCurrency} to ${toCurrency}`);
    console.log(`[Sw4p] Validating wallet addresses...`);
    
    // Get the exchange rate
    const rateData = await getExchangeRate(fromCurrency, toCurrency);
    
    // Calculate raw converted amount
    const rawConvertedAmount = parseFloat(amount) * rateData.rate;
    
    // Apply fee
    const fee = rawConvertedAmount * (feePercentage / 100);
    const calculatedAmount = rawConvertedAmount - fee;
    
    console.log(`[Sw4p] Processing transaction...`);
    console.log(`[Sw4p] Fee (${feePercentage}%): ${fee.toFixed(8)} ${toCurrency}`);
    
    // Submit swap request
    const response = await fetch(`${API_BASE_URL}/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fromCurrency,
        toCurrency,
        amount,
        depositAddress,
        receivingAddress,
        calculatedAmount,
        feeAmount: fee,
        feePercentage,
        fromUsdPrice: rateData.fromUsdPrice,
        toUsdPrice: rateData.toUsdPrice
      })
    });
    
    const result = await handleResponse(response);
    console.log(`[Sw4p] Swap request submitted successfully!`);
    return result;
  } catch (error) {
    console.error(`[Sw4p] Error: Swap calculation failed:`, error);
    throw error;
  }
}

/**
 * Get transaction history
 * @returns {Promise} - Promise with transaction history
 */
export async function getTransactionHistory() {
  try {
    const response = await fetch(`${API_BASE_URL}/swap/history`);
    return handleResponse(response);
  } catch (error) {
    console.error(`[Sw4p] Error: Failed to fetch transaction history:`, error);
    throw error;
  }
}