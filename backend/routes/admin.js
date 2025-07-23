// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const { transactions } = require('./swap');

// Admin authentication middleware
const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Get all transactions with geo compliance data
router.get('/transactions', authenticate, (req, res) => {
  // Format transactions for admin view including geo compliance
  const formattedTransactions = transactions.map(tx => ({
    id: tx.id,
    fromAmount: tx.fromAmount,
    fromCurrency: tx.fromCurrency,
    toAmount: tx.toAmount,
    toCurrency: tx.toCurrency,
    feeAmount: tx.feeAmount,
    receivingAddress: tx.receivingAddress,
    status: tx.status,
    timestamp: tx.timestamp,
    txHash: tx.txHash,
    // Include geo compliance data for admin
    geoCompliance: tx.geoCompliance || {
      country: 'UNKNOWN',
      riskLevel: 'unknown',
      isHighRisk: false,
      isMonitoring: false
    }
  }));
  
  res.json({ 
    success: true, 
    transactions: formattedTransactions,
    totalCount: transactions.length,
    highRiskCount: transactions.filter(tx => tx.geoCompliance?.isHighRisk).length,
    monitoringCount: transactions.filter(tx => tx.geoCompliance?.isMonitoring).length
  });
});


// Update transaction status
router.post('/transactions/:id/update', authenticate, (req, res) => {
  const { id } = req.params;
  const { status, txHash } = req.body;
  
  const transaction = transactions.find(t => t.id === id);
  if (!transaction) {
    return res.status(404).json({ success: false, error: 'Transaction not found' });
  }
  
  // Update the transaction
  transaction.status = status;
  if (txHash) transaction.txHash = txHash;
  transaction.completedAt = new Date();
  
  res.json({ success: true, transaction });
});

module.exports = router;