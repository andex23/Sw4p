// backend/routes/swap.js
const express = require('express');
const router = express.Router();
const { sendTransactionNotification } = require('../services/emailService');

// In-memory store for transactions (in production, use a database)
const transactions = [];  // Changed 'let' to 'const' for clarity


// Submit a new swap request
router.post('/', async (req, res) => {
  try {
    const { fromCurrency, toCurrency, amount, depositAddress, receivingAddress, calculatedAmount, feeAmount } = req.body;
    
    // Generate a unique transaction ID
    const transactionId = 'TX' + Math.random().toString(36).substring(2, 15).toUpperCase();
    
    // Get GeoIP information from middleware
    const geoInfo = req.geoInfo || {};
    
    // Create transaction record with geo information
    const transaction = {
      id: transactionId,
      fromCurrency,
      toCurrency,
      fromAmount: parseFloat(amount),
      toAmount: parseFloat(calculatedAmount),
      feeAmount: parseFloat(feeAmount || 0),
      depositAddress,
      receivingAddress,
      status: 'pending',
      timestamp: new Date(),
      exchangeRate: parseFloat(calculatedAmount) / parseFloat(amount),
      // GeoIP compliance data
      geoCompliance: {
        clientIP: geoInfo.ip,
        country: geoInfo.country,
        region: geoInfo.region,
        city: geoInfo.city,
        riskLevel: geoInfo.riskLevel,
        isHighRisk: geoInfo.isHighRisk,
        isMonitoring: geoInfo.isMonitoring,
        timestamp: new Date().toISOString()
      }
    };

    // Enhanced logging for high-risk transactions
    if (geoInfo.isHighRisk) {
      console.log(`[COMPLIANCE] HIGH-RISK TRANSACTION:`, {
        transactionId,
        country: geoInfo.country,
        amount: `${amount} ${fromCurrency}`,
        ip: geoInfo.ip,
        timestamp: new Date().toISOString()
      });
    } else if (geoInfo.isMonitoring) {
      console.log(`[COMPLIANCE] MONITORING JURISDICTION TRANSACTION:`, {
        transactionId,
        country: geoInfo.country,
        amount: `${amount} ${fromCurrency}`,
        ip: geoInfo.ip,
        timestamp: new Date().toISOString()
      });
    }
    
    // Save to our in-memory store (replace with database in production)
    transactions.push(transaction);
    
    // Send email notification
    try {
      await sendTransactionNotification(transaction);
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Continue processing even if email fails
    }
    
    // Return success response (without exposing geo data to client)
    res.json({
      success: true,
      swap: {
        id: transaction.id,
        transactionId: transaction.id,
        fromCurrency: transaction.fromCurrency,
        toCurrency: transaction.toCurrency,
        fromAmount: transaction.fromAmount,
        toAmount: transaction.toAmount,
        exchangeRate: transaction.exchangeRate,
        timestamp: transaction.timestamp,
        status: transaction.status
      },
      message: 'Swap request submitted successfully.'
    });
  } catch (error) {
    console.error('Error processing swap:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process swap request'
    });
  }
});

// Get transaction status
router.get('/status/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Find transaction in our store
    const transaction = transactions.find(t => t.id === id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    res.json({
      success: true,
      ...transaction
    });
  } catch (error) {
    console.error('Error fetching transaction status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction status'
    });
  }
});

module.exports = { 
  router,
  transactions 
};