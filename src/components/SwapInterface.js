import React, { useState, useEffect, useCallback } from 'react';

const SwapInterface = () => {
  const [currentStep, setCurrentStep] = useState('form'); // 'form', 'terms', 'pending', 'success'
  const [depositAddress, setDepositAddress] = useState('');
  const [intentId, setIntentId] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [formData, setFormData] = useState({
    fromCurrency: 'BTC',
    toCurrency: 'ETH',
    amount: '',
    userId: 'user-123' // In production, get from authentication
  });

  const handleError = (error) => {
    let errorMessage = 'An unexpected error occurred';
    
    // Handle uniform API error format
    if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    setError(errorMessage);
    console.error('API Error:', error);
    setLoading(false);
  };

  const generateDepositAddress = async () => {
    console.log('🔵 BUTTON CLICKED - Starting generateDepositAddress');
    console.log('🔵 Current formData:', formData);
    console.log('🔵 Current step:', currentStep);
    
    setLoading(true);
    setError('');
    
    try {
      console.log('🔵 Making API call...');
      const requestData = {
        currency: formData.fromCurrency,
        network: formData.fromCurrency === 'BTC' ? 'bitcoin' : 'ethereum',
        userId: formData.userId
      };
      console.log('🔵 Request data:', requestData);
      
      const response = await fetch('http://localhost:5001/api/obiex/deposit-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      console.log('🔵 Response status:', response.status);
      const result = await response.json();
      console.log('🔵 Response data:', result);
      
      if (result.success) {
        console.log('🟢 SUCCESS - Setting up pending state...');
        setDepositAddress(result.data.address);
        setIntentId(result.data.intentId);
        setApprovalStatus(result.data.status);
        console.log('🟢 About to set step to pending...');
        setCurrentStep('pending');
        console.log('🟢 Step set to pending!');
      } else {
        console.error('🔴 API returned error:', result);
        handleError(result);
      }
    } catch (err) {
      console.error('🔴 Network/JS error:', err);
      handleError(err);
    } finally {
      console.log('🔵 Finally block - setting loading to false');
      setLoading(false);
    }
  };

  const checkApprovalStatus = useCallback(async () => {
    if (!intentId) return;
    
    try {
      const response = await fetch(`http://localhost:5001/api/obiex/deposit-status/${intentId}`);
      const result = await response.json();
      
      if (result.success && result.deposit) {
        setApprovalStatus(result.deposit.status);
        
        if (result.deposit.status === 'APPROVED') {
          setCurrentStep('success');
        } else if (result.deposit.status === 'REJECTED') {
          setError('Your deposit has been rejected. Please contact support.');
          setCurrentStep('form');
        }
      }
    } catch (err) {
      console.error('Error checking approval status:', err);
    }
  }, [intentId]);



  const restartProcess = () => {
    setCurrentStep('form');
    setDepositAddress('');
    setIntentId('');
    setApprovalStatus('');
    setError('');
    setTransactionId('');
    setFormData({...formData, amount: ''});
  };

  // Debug state changes
  useEffect(() => {
    console.log('🔄 STATE CHANGE - currentStep:', currentStep);
  }, [currentStep]);

  useEffect(() => {
    console.log('🔄 STATE CHANGE - intentId:', intentId);
  }, [intentId]);

  useEffect(() => {
    console.log('🔄 STATE CHANGE - approvalStatus:', approvalStatus);
  }, [approvalStatus]);

  // Check approval status every 10 seconds when pending
  useEffect(() => {
    if (currentStep === 'pending' && intentId && approvalStatus === 'PENDING') {
      const interval = setInterval(checkApprovalStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [currentStep, intentId, approvalStatus, checkApprovalStatus]);

  // Loading/Pulse Animation Component
  const PulseAnimation = () => (
    <div style={{
      display: 'inline-block',
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      backgroundColor: '#3b82f6',
      animation: 'pulse 2s ease-in-out infinite',
      margin: '20px auto',
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
          .pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `}
      </style>
    </div>
  );

  // Form Step Component
  const FormStep = () => (
    <div>
      <h2>🔄 Currency Swap</h2>
      
      <div style={{ marginBottom: '16px' }}>
        <label>From Currency:</label>
        <select 
          value={formData.fromCurrency}
          onChange={(e) => setFormData({...formData, fromCurrency: e.target.value})}
          style={{ width: '100%', padding: '8px', margin: '4px 0' }}
        >
          <option value="BTC">Bitcoin (BTC)</option>
          <option value="ETH">Ethereum (ETH)</option>
          <option value="USDT">Tether (USDT)</option>
        </select>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label>To Currency:</label>
        <select 
          value={formData.toCurrency}
          onChange={(e) => setFormData({...formData, toCurrency: e.target.value})}
          style={{ width: '100%', padding: '8px', margin: '4px 0' }}
        >
          <option value="ETH">Ethereum (ETH)</option>
          <option value="BTC">Bitcoin (BTC)</option>
          <option value="USDT">Tether (USDT)</option>
        </select>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label>Amount:</label>
        <input 
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({...formData, amount: e.target.value})}
          placeholder="Enter amount"
          style={{ width: '100%', padding: '8px', margin: '4px 0' }}
        />
      </div>

      <button 
        onClick={() => setCurrentStep('terms')}
        disabled={!formData.amount || formData.fromCurrency === formData.toCurrency}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: (!formData.amount || formData.fromCurrency === formData.toCurrency) ? '#9ca3af' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '16px',
          cursor: (!formData.amount || formData.fromCurrency === formData.toCurrency) ? 'not-allowed' : 'pointer'
        }}
      >
        Continue to Terms & Conditions
      </button>
    </div>
  );

  // Terms Step Component
  const TermsStep = () => (
    <div>
      <h2>📋 Terms & Conditions</h2>
      
      <div style={{
        backgroundColor: '#f9fafb',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        marginBottom: '20px',
        maxHeight: '300px',
        overflowY: 'auto'
      }}>
        <h4>Swap Agreement</h4>
        <p><strong>Amount:</strong> {formData.amount} {formData.fromCurrency}</p>
        <p><strong>Receiving:</strong> ~{(parseFloat(formData.amount) * 0.95).toFixed(6)} {formData.toCurrency}</p>
        
        <div style={{ marginTop: '16px', fontSize: '14px', color: '#374151' }}>
          <h5>Important Terms:</h5>
          <ul>
            <li>All transactions require confirmation before execution</li>
            <li>Processing time: 5-30 minutes after confirmation</li>
            <li>Network fees will be deducted from the final amount</li>
            <li>Exchange rates are locked for 30 minutes after confirmation</li>
            <li>Deposits cannot be cancelled once submitted</li>
            <li>You must send the exact currency to the provided address</li>
          </ul>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '12px' }}>
        <button 
          onClick={() => setCurrentStep('form')}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Back
        </button>
        
        <button 
          onClick={generateDepositAddress}
          disabled={loading}
          style={{
            flex: 2,
            padding: '12px',
            backgroundColor: loading ? '#9ca3af' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Processing...' : 'I Agree - Start Swap'}
        </button>
      </div>
    </div>
  );

  // Pending Step Component
  const PendingStep = () => (
    <div style={{ textAlign: 'center' }}>
      <h2>⏳ Processing Your Swap</h2>
      
      <PulseAnimation />
      
      <div className="pulse" style={{
        backgroundColor: '#e0f2fe',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #29b6f6',
        marginBottom: '20px'
      }}>
        <h3 style={{ color: '#0277bd', marginBottom: '8px' }}>Waiting for Confirmation</h3>
        <p style={{ color: '#0277bd', margin: '0' }}>
          Your transaction is being processed. This usually takes a few minutes.
        </p>
      </div>

      {depositAddress && (
        <div style={{
          backgroundColor: '#fff3cd',
          color: '#856404',
          padding: '16px',
          borderRadius: '8px',
          border: '2px solid #ffd700',
          marginBottom: '16px',
          textAlign: 'left'
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>📤 Send Payment</h3>
          <div style={{ marginBottom: '12px' }}>
            <strong>Amount to Send:</strong>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#d63384' }}>
              {formData.amount} {formData.fromCurrency}
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
              onClick={() => navigator.clipboard.writeText(depositAddress)}
            >
              📋 Copy Address
            </button>
          </div>
          <div style={{ fontSize: '12px', color: '#6c757d' }}>
            ⚠️ Send exactly {formData.amount} {formData.fromCurrency} to complete the swap
          </div>
        </div>
      )}

      <div style={{
        backgroundColor: '#eff6ff',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #3b82f6',
        textAlign: 'left'
      }}>
        <h4 style={{ color: '#1d4ed8', margin: '0 0 8px 0' }}>What happens next?</h4>
        <div style={{ color: '#1e40af', fontSize: '14px' }}>
          <div className="pulse">🔍 Processing your transaction...</div>
          <div style={{ opacity: '0.6' }}>✅ Confirmation & automatic swap execution</div>
          <div style={{ opacity: '0.6' }}>🎉 Completion confirmation</div>
        </div>
      </div>

      <button 
        onClick={() => setCurrentStep('form')}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#6b7280',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        Cancel & Start Over
      </button>
    </div>
  );

  // Success Step Component
  const SuccessStep = () => (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
      <h2 style={{ color: '#10b981' }}>Swap Completed Successfully!</h2>
      
      <div style={{
        backgroundColor: '#ecfdf5',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #10b981',
        marginBottom: '20px'
      }}>
        <h3 style={{ color: '#047857', marginBottom: '16px' }}>Transaction Details</h3>
        <div style={{ color: '#065f46', textAlign: 'left' }}>
          <p><strong>From:</strong> {formData.amount} {formData.fromCurrency}</p>
          <p><strong>To:</strong> ~{(parseFloat(formData.amount) * 0.95).toFixed(6)} {formData.toCurrency}</p>
          <p><strong>Transaction ID:</strong> {transactionId}</p>
          <p><strong>Status:</strong> ✅ Completed</p>
        </div>
      </div>

      <div style={{
        backgroundColor: '#f0f9ff',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #0ea5e9',
        marginBottom: '20px'
      }}>
        <h4 style={{ color: '#0c4a6e', margin: '0 0 8px 0' }}>What's Next?</h4>
        <p style={{ color: '#0c4a6e', fontSize: '14px', margin: '0' }}>
          Your {formData.toCurrency} will be credited to your account within 10-30 minutes. 
          You'll receive a confirmation email once the transfer is complete.
        </p>
      </div>

      <button 
        onClick={restartProcess}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '16px',
          cursor: 'pointer'
        }}
      >
        Make Another Swap
      </button>
    </div>
  );

  const renderCurrentStep = () => {
    console.log('🎭 RENDER - Current step:', currentStep);
    console.log('🎭 RENDER - intentId:', intentId);
    console.log('🎭 RENDER - approvalStatus:', approvalStatus);
    
    switch (currentStep) {
      case 'form':
        console.log('🎭 Rendering FormStep');
        return <FormStep />;
      case 'terms':
        console.log('🎭 Rendering TermsStep');
        return <TermsStep />;
      case 'pending':
        console.log('🎭 Rendering PendingStep - THIS IS THE WAITING SCREEN!');
        return <PendingStep />;
      case 'success':
        console.log('🎭 Rendering SuccessStep');
        return <SuccessStep />;
      default:
        console.log('🎭 Rendering default FormStep');
        return <FormStep />;
    }
  };

  return (
    <div className="swap-interface" style={{ 
      maxWidth: '500px', 
      margin: '0 auto', 
      padding: '24px',
      minHeight: '500px'
    }}>
      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '16px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {renderCurrentStep()}
    </div>
  );
};

export default SwapInterface; 