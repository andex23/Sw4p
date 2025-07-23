// backend/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const ratesRoutes = require('./routes/rates');
const { router: swapRoutes } = require('./routes/swap');
const adminRoutes = require('./routes/admin');
const obiexRoutes = require('./dist/routes/obiex').default;
const newAdminRoutes = require('./dist/routes/admin').default;
const { geoipAnalysis } = require('./middleware/geoip');
const { errorHandler } = require('./dist/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Trust proxy for accurate IP detection (important for GeoIP)
app.set('trust proxy', true);

// GeoIP Analysis Middleware (before all routes)
app.use(geoipAnalysis);

// Routes
app.use('/api/rates', ratesRoutes);
app.use('/api/swap', swapRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', newAdminRoutes); // New admin approval routes
app.use('/api/obiex', obiexRoutes);

// Serve admin panel
app.use(express.static(path.join(__dirname, 'public')));

// Root route
app.get('/', (req, res) => {
  res.send('Sw4p API is running');
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server with fallback ports
const startServer = (port) => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Admin panel available at http://localhost:${port}/admin.html`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is already in use, trying port ${port + 1}`);
      startServer(port + 1);
    } else {
      console.error(err);
    }
  });
};

startServer(PORT);