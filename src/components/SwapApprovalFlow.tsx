import React, { useState, useEffect, useCallback } from 'react';
import '../styles/spinner.css';

interface SwapApprovalFlowProps {
  userId?: string;
  fromCurrency?: string;
  toCurrency?: string;
  amount?: string;
}

type FlowState = 'INIT' | 'WAITING' | 'CONFIRMED';

const SwapApprovalFlow: React.FC<SwapApprovalFlowProps> = ({
  userId = 'user-123',
  fromCurrency = 'BTC',
  toCurrency = 'ETH',
  amount = '0.001'
}) => {
  const [state, setState] = useState<FlowState>('INIT');
  const [intentId, setIntentId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Handle API errors consistently
  const handleError = (error: any) => {
    let errorMessage = 'An unexpected error occurred';
    
    if (error?.error?.message) {
      errorMessage = error.error.message;
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    setError(errorMessage);
    console.error('SwapApprovalFlow Error:', error);
  };

  // Start swap by creating deposit intent
  const startSwap = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:5001/api/obiex/deposit-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currency: fromCurrency,
          network: fromCurrency === 'BTC' ? 'bitcoin' : 'ethereum',
          userId: userId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setIntentId(result.data.intentId);
        setState('WAITING');
      } else {
        handleError(result);
      }
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // Check deposit status
  const checkDepositStatus = useCallback(async () => {
    if (!intentId) return;
    
    try {
      const response = await fetch(`http://localhost:5001/api/obiex/deposit-status/${intentId}`);
      const result = await response.json();
      
      if (result.success) {
        if (result.status === 'APPROVED') {
          setState('CONFIRMED');
        } else if (result.status === 'REJECTED') {
          handleError('Your transaction has been rejected. Please contact support.');
          setState('INIT');
        }
        // If still PENDING, keep polling
      } else {
        handleError(result);
      }
    } catch (err) {
      console.error('Error checking deposit status:', err);
      // Don't show error for polling failures, just continue polling
    }
  }, [intentId]);

  // Poll for approval status every 5 seconds when waiting
  useEffect(() => {
    if (state === 'WAITING' && intentId) {
      const interval = setInterval(checkDepositStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [state, intentId, checkDepositStatus]);

  // Reset to initial state
  const resetFlow = () => {
    setState('INIT');
    setIntentId('');
    setError('');
    setLoading(false);
  };

  // Render different states
  const renderInit = () => (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>🔄 Currency Swap</h2>
      <p>Ready to swap {amount} {fromCurrency} to {toCurrency}?</p>
      
      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '16px',
          border: '1px solid #fecaca'
        }}>
          {error}
        </div>
      )}
      
      <button
        onClick={startSwap}
        disabled={loading}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: loading ? '#9ca3af' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          minWidth: '120px'
        }}
      >
        {loading ? 'Starting...' : 'Start Swap'}
      </button>
    </div>
  );

  const renderWaiting = () => (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>⏳ Waiting for Confirmation</h2>
      
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
            {amount} {fromCurrency}
          </div>
        </div>
        <div style={{ fontSize: '12px', color: '#6c757d' }}>
          ⚠️ Send exactly {amount} {fromCurrency} to your provided deposit address
        </div>
      </div>
      
      <div style={{
        backgroundColor: '#f9fafb',
        padding: '12px',
        borderRadius: '6px',
        border: '1px solid #e5e7eb',
        fontSize: '14px',
        color: '#6b7280'
      }}>
        Intent ID: <code style={{ fontFamily: 'monospace' }}>{intentId}</code>
      </div>
      
      <button
        onClick={resetFlow}
        style={{
          marginTop: '20px',
          padding: '8px 16px',
          backgroundColor: '#6b7280',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        Cancel
      </button>
    </div>
  );

  const renderConfirmed = () => (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
      <h2 style={{ color: '#10b981', marginBottom: '16px' }}>Swap Confirmed!</h2>
      
      <div style={{
        backgroundColor: '#ecfdf5',
        color: '#047857',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #10b981',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 8px 0' }}>Your swap has been approved!</h3>
        <p style={{ margin: '0', fontSize: '14px' }}>
          Your {fromCurrency} to {toCurrency} swap is now being processed.
        </p>
      </div>
      
      <button
        onClick={resetFlow}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Start New Swap
      </button>
    </div>
  );

  // Render current state
  switch (state) {
    case 'INIT':
      return renderInit();
    case 'WAITING':
      return renderWaiting();
    case 'CONFIRMED':
      return renderConfirmed();
    default:
      return renderInit();
  }
};

export default SwapApprovalFlow; 