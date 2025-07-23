export interface ObiexCredentials {
  apiKey: string;
  apiSecret: string;
  sandboxMode: boolean;
}

export interface QuoteRequest {
  source: string;
  target: string;
  side: 'BUY' | 'SELL';
  amount: number;
}

export interface QuoteResponse {
  id: string;
  rate: number;
  amountReceived: number;
  expiryDate: string;
  source: string;
  target: string;
  side: 'BUY' | 'SELL';
  amount: number;
}

export interface TradeRequest {
  source: string;
  target: string;
  side: 'BUY' | 'SELL';
  amount: number;
  quoteId?: string;
  intentId: string;
}

export interface TradeResponse {
  id: string;
  status: string;
  amount: number;
  amountReceived: number;
  rate: number;
  source: string;
  target: string;
  side: 'BUY' | 'SELL';
  transactionId?: string;
  createdAt: string;
}

export interface DepositAddressRequest {
  currency: string;
  network: string;
  identifier?: string;
  userId: string;
}

export interface DepositAddressResponse {
  address: string;
  memo?: string;
  network: string;
  currency: string;
  intentId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface WithdrawalRequest {
  currency: string;
  network: string;
  amount: number;
  address: string;
  memo?: string;
  intentId: string;
}

export interface WithdrawalResponse {
  transactionId: string;
  status: string;
  amount: number;
  currency: string;
  network: string;
  address: string;
  memo?: string;
  fee?: number;
  createdAt: string;
}

export interface ObiexError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ObiexError;
}

export interface ObiexClientConfig {
  apiKey: string;
  apiSecret: string;
  sandboxMode?: boolean;
  baseUrl?: string;
}

// Extended interfaces for better type safety
export interface QuoteRequestWithValidation extends QuoteRequest {
  // Add validation fields if needed
  userId?: string;
  sessionId?: string;
}

export interface TradeRequestWithValidation extends TradeRequest {
  // Add validation fields if needed
  userId?: string;
  sessionId?: string;
} 