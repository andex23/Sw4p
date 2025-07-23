import React from 'react';
import SwapApprovalFlow from '../components/SwapApprovalFlow';

interface SwapPageProps {
  fromCurrency?: string;
  toCurrency?: string;
  amount?: string;
  userId?: string;
}

const SwapPage: React.FC<SwapPageProps> = ({
  fromCurrency = 'BTC',
  toCurrency = 'ETH', 
  amount = '0.001',
  userId = 'user-123'
}) => {
  return (
    <div style={{
      padding: '20px',
      maxWidth: '600px',
      margin: '0 auto',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    }}>
      <SwapApprovalFlow 
        fromCurrency={fromCurrency}
        toCurrency={toCurrency}
        amount={amount}
        userId={userId}
      />
    </div>
  );
};

export default SwapPage; 