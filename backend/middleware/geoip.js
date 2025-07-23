const geoip = require('geoip-lite');

// High-risk jurisdictions for compliance monitoring
// Based on FATF guidance and common compliance frameworks
const HIGH_RISK_COUNTRIES = [
  'IR', // Iran
  'KP', // North Korea
  'CU', // Cuba
  'SY', // Syria
  'BY', // Belarus
  'MM', // Myanmar
  'AF', // Afghanistan
  'IQ', // Iraq
  'LB', // Lebanon
  'LY', // Libya
  'SO', // Somalia
  'SS', // South Sudan
  'SD', // Sudan
  'YE', // Yemen
  'CF', // Central African Republic
  'CD', // Democratic Republic of Congo
  'ER', // Eritrea
  'GW', // Guinea-Bissau
  'HT', // Haiti
  'ML', // Mali
  'NI', // Nicaragua
  'RU', // Russia (due to sanctions)
  'VE', // Venezuela
];

// Additional monitoring countries (not high-risk but worth noting)
const MONITORING_COUNTRIES = [
  'CN', // China
  'PK', // Pakistan
  'BD', // Bangladesh
  'TH', // Thailand
  'TT', // Trinidad and Tobago
  'JM', // Jamaica
  'PH', // Philippines
  'TR', // Turkey
];

/**
 * GeoIP Analysis Middleware
 * Analyzes user location for compliance monitoring without blocking access
 */
function geoipAnalysis(req, res, next) {
  try {
    // Get client IP address
    const clientIP = getClientIP(req);
    
    // Skip analysis for localhost/development
    if (isLocalhost(clientIP)) {
      req.geoInfo = {
        ip: clientIP,
        country: 'LOCAL',
        region: 'localhost',
        city: 'localhost',
        isHighRisk: false,
        isMonitoring: false,
        riskLevel: 'low'
      };
      return next();
    }

    // Perform GeoIP lookup
    const geo = geoip.lookup(clientIP);
    
    if (!geo) {
      req.geoInfo = {
        ip: clientIP,
        country: 'UNKNOWN',
        region: 'unknown',
        city: 'unknown',
        isHighRisk: false,
        isMonitoring: false,
        riskLevel: 'unknown'
      };
      console.log(`[GeoIP] Unable to determine location for IP: ${clientIP}`);
      return next();
    }

    // Analyze risk level
    const countryCode = geo.country;
    const isHighRisk = HIGH_RISK_COUNTRIES.includes(countryCode);
    const isMonitoring = MONITORING_COUNTRIES.includes(countryCode);
    
    let riskLevel = 'low';
    if (isHighRisk) {
      riskLevel = 'high';
    } else if (isMonitoring) {
      riskLevel = 'medium';
    }

    // Attach geo information to request
    req.geoInfo = {
      ip: clientIP,
      country: countryCode,
      region: geo.region,
      city: geo.city,
      timezone: geo.timezone,
      coordinates: [geo.ll[0], geo.ll[1]], // [latitude, longitude]
      isHighRisk,
      isMonitoring,
      riskLevel
    };

    // Log high-risk or monitoring jurisdictions
    if (isHighRisk || isMonitoring) {
      console.log(`[GeoIP] ${riskLevel.toUpperCase()} RISK ACCESS:`, {
        ip: clientIP,
        country: countryCode,
        region: geo.region,
        city: geo.city,
        riskLevel,
        timestamp: new Date().toISOString(),
        userAgent: req.headers['user-agent']
      });
    }

    next();
  } catch (error) {
    console.error('[GeoIP] Error in geoip analysis:', error);
    
    // Continue without blocking on error
    req.geoInfo = {
      ip: getClientIP(req),
      country: 'ERROR',
      region: 'error',
      city: 'error',
      isHighRisk: false,
      isMonitoring: false,
      riskLevel: 'unknown',
      error: error.message
    };
    
    next();
  }
}

/**
 * Extract client IP address from request
 */
function getClientIP(req) {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         'unknown';
}

/**
 * Check if IP is localhost/development
 */
function isLocalhost(ip) {
  const localhostPatterns = [
    '127.0.0.1',
    '::1',
    'localhost',
    '0.0.0.0',
    '::',
    'unknown'
  ];
  
  return localhostPatterns.some(pattern => ip.includes(pattern)) || 
         ip.startsWith('192.168.') || 
         ip.startsWith('10.') || 
         ip.startsWith('172.');
}

/**
 * Get risk assessment for a country code
 */
function getRiskAssessment(countryCode) {
  if (HIGH_RISK_COUNTRIES.includes(countryCode)) {
    return {
      level: 'high',
      description: 'High-risk jurisdiction according to FATF guidance'
    };
  }
  
  if (MONITORING_COUNTRIES.includes(countryCode)) {
    return {
      level: 'medium',
      description: 'Enhanced monitoring jurisdiction'
    };
  }
  
  return {
    level: 'low',
    description: 'Standard risk jurisdiction'
  };
}

module.exports = {
  geoipAnalysis,
  getRiskAssessment,
  HIGH_RISK_COUNTRIES,
  MONITORING_COUNTRIES
}; 