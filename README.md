# SW4P - Crypto Swap Platform

A modern cryptocurrency swap platform with Express/TypeScript backend and React frontend, integrating with the Obiex API for live trading capabilities.

## 🚀 Features

- **Live Crypto Trading**: Real-time quotes and trade execution via Obiex API
- **Deposit Address Generation**: Generate deposit addresses for funding swaps
- **Withdrawal Management**: Process crypto withdrawals with security controls
- **Webhook Integration**: Real-time transaction notifications from Obiex
- **Health Monitoring**: Comprehensive API health checks and status monitoring
- **TypeScript Backend**: Fully typed API with comprehensive error handling
- **End-to-End Testing**: Live API integration tests with Vitest

## 📋 Current Status

### ✅ Working Features
- **Public API Endpoints**: Trading pairs, active networks, health checks
- **Webhook Processing**: Verified HMAC SHA512 signature verification
- **Error Handling**: Comprehensive error classification (401, 403, 404, 429, 5xx)
- **Authentication**: HMAC SHA256 signature generation for API requests
- **Testing**: Complete e2e test suite for all API endpoints

### 🔄 In Progress
- **Protected Endpoints**: Awaiting Obiex support to enable broker, trading, and withdrawal permissions
- **Node.js Upgrade**: Current Node v18.20.8, recommended v20.18.0+ for Solana packages

## 🛠️ Quick Start

### Prerequisites
- Node.js v18.20.8+ (v20.18.0+ recommended)
- npm or yarn

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd sw4p-new
   npm install --legacy-peer-deps
   cd backend && npm install --legacy-peer-deps
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your Obiex API credentials
   ```

3. **Start development servers:**
   ```bash
   npm run dev
   ```

This starts:
- React frontend on http://localhost:3000
- Backend API on http://localhost:5001
- Admin panel at http://localhost:5001/admin.html

## 🔧 Environment Configuration

### Required Environment Variables

Create a `.env` file in the project root:

```bash
# Obiex API Configuration
OBIEX_API_KEY=your_obiex_api_key_here
OBIEX_API_SECRET=your_obiex_api_secret_here
OBIEX_SIGNATURE_SECRET=your_webhook_signature_secret_here

# Server Configuration
PORT=5001
NODE_ENV=development
```

### API Credentials Setup

The application supports two methods for API credentials:

**Method 1: Environment Variables (Recommended)**
```bash
OBIEX_API_KEY=your_key_here
OBIEX_API_SECRET=your_secret_here
```

**Method 2: Interactive Prompt**
If credentials aren't set, the app will prompt on first startup.

## 📡 API Endpoints

### Public Endpoints (Working)

#### Health Check
```http
GET /api/obiex/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "public": "healthy",
    "protected": "degraded"
  },
  "details": {
    "trading_pairs": 86,
    "active_networks": 15,
    "missing_permissions": ["broker", "trading", "withdrawal"]
  }
}
```

#### Trading Pairs
```http
GET /api/obiex/trades/pairs
```

#### Active Networks
```http
GET /api/obiex/currencies/networks/active
```

### Protected Endpoints (Awaiting Permissions)

#### Generate Deposit Address
```http
POST /api/obiex/addresses/broker
Content-Type: application/json

{
  "currency": "BTC",
  "network": "BTC",
  "purpose": "user_123"
}
```

#### Create Quote
```http
POST /api/obiex/trades/quote
Content-Type: application/json

{
  "sourceId": "e56bb82c-3a87-4bc8-b537-53b25ad517af",
  "targetId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "side": "SELL",
  "amount": 0.001
}
```

#### Execute Trade
```http
POST /api/obiex/trades/quote/{quoteId}
```

#### Withdraw Crypto
```http
POST /api/obiex/wallets/ext/debit/crypto
Content-Type: application/json

{
  "currency": "BTC",
  "network": "BTC",
  "amount": 0.001,
  "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  "memo": "withdrawal_memo"
}
```

### Webhook Endpoints

#### Obiex Webhook Receiver
```http
POST /api/webhooks/obiex
Content-Type: application/json
X-Obiex-Signature: {hmac_sha512_signature}
```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Obiex Integration Tests
```bash
npm run test:obiex
```

### Test Coverage
The e2e tests verify:
- ✅ Public endpoints (trading pairs, networks)
- ⏳ Protected endpoints (awaiting permissions)
- ✅ Webhook signature verification
- ✅ Error handling and classification
- ✅ Authentication flow

### Example Test Output
```
🔥 Obiex Live API Integration Tests
✅ Client should be properly initialized
📊 Should fetch trading pairs successfully (86 pairs available)
🌐 Should fetch active networks successfully (15 networks available)
❌ Should handle protected endpoints gracefully (401 - permissions required)
```

## 📁 Project Structure

```
sw4p-new/
├── backend/                      # Express/TypeScript backend
│   ├── src/
│   │   ├── services/
│   │   │   └── obiexClient.ts   # Obiex API client with auth
│   │   ├── middleware/
│   │   │   └── webhookVerification.ts  # Webhook signature verification
│   │   ├── routes/
│   │   │   └── health.ts        # Health check endpoints
│   │   └── controllers/         # Request handlers
│   ├── dist/                    # Compiled JavaScript
│   └── index.js                 # Main server file
├── tests/
│   └── obiex.e2e.test.ts       # Live API integration tests
├── src/                         # React frontend
├── public/                      # Static assets
└── package.json                 # Root dependencies
```

## 🔐 Security Features

### API Authentication
- HMAC SHA256 signature generation
- Automatic timestamp and nonce handling
- Request/response interceptors for error classification

### Webhook Security
- HMAC SHA512 signature verification
- Raw body parsing for signature validation
- Environment-based signature secret

### Error Handling
- Comprehensive error classification (401, 403, 404, 429, 5xx)
- Detailed error messages for debugging
- Graceful degradation for missing permissions

## 🚨 Production Considerations

### Required Permissions
Contact Obiex support to enable:
- **Broker permissions**: For deposit address generation
- **Trading permissions**: For quote creation and trade execution
- **Withdrawal permissions**: For crypto withdrawals

### Security Checklist
- [ ] Enable HTTPS in production
- [ ] Implement rate limiting
- [ ] Add admin approval workflow for withdrawals
- [ ] Set up monitoring and alerting
- [ ] Configure proper logging
- [ ] Implement address whitelist verification

### Node.js Upgrade
Current: Node v18.20.8
Recommended: Node v20.18.0+ (for Solana packages)

## 🐛 Troubleshooting

### Common Issues

**401 Authentication Errors:**
- Verify API credentials are correct
- Check if permissions are enabled in Obiex dashboard
- Ensure timestamp is within acceptable range

**Webhook Signature Failures:**
- Verify `OBIEX_SIGNATURE_SECRET` matches Obiex webhook configuration
- Check that raw body parsing is enabled
- Ensure Content-Type is application/json

**Dependency Conflicts:**
```bash
npm install --legacy-peer-deps
```

**TypeScript Compilation Errors:**
```bash
cd backend
npx tsc --noEmit
```

## 📊 API Status

### Current API Health
- **Public Endpoints**: ✅ Healthy (86 trading pairs, 15 networks)
- **Protected Endpoints**: ⚠️ Degraded (awaiting permissions)
- **Webhooks**: ✅ Healthy (verified signature processing)
- **Authentication**: ✅ Healthy (HMAC SHA256 working)

### Known Limitations
- Protected endpoints return 401 until permissions are enabled
- Node.js version may cause Solana package warnings
- Some peer dependency conflicts (resolved with --legacy-peer-deps)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues related to:
- **Obiex API**: Check the [official Obiex documentation](https://docs.obiex.finance)
- **Application bugs**: Create an issue in this repository
- **Security concerns**: Contact the development team directly
