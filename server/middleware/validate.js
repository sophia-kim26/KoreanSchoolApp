// Allowed IP addresses or network ranges
const ALLOWED_IPS = [
  '127.0.0.1',           // localhost for testing
  '::1',                 // localhost IPv6
  '69.121.204.146',      // my public ip address last night
  '168.229.254.66'      // bca byod ip address
  // Add Korean School's IP when I know it but for next time add bca ip
];

// Get client IP from request
const getClientIP = (req) => {
  // Check various headers in order of preference
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         req.ip;
};

// IP address checking
export const validateLocation = (req, res, next) => {
  const clientIP = getClientIP(req);
    
  // Check if IP is in allowed list
  const isAllowed = ALLOWED_IPS.some(allowedIP => {
    // Handle some IPv6 localhost variations
    if (clientIP === '::ffff:127.0.0.1' && allowedIP === '127.0.0.1') return true;
    if (clientIP === '::1' && allowedIP === '127.0.0.1') return true;
    return clientIP === allowedIP;
  });

  if (!isAllowed) {
    return res.status(403).json({ 
      error: `Clock-in not allowed from this location. Please connect to the Korean School network.` 
    });
  }

  next();
};

export const validateClockIn = (req, res, next) => {
  const { ta_id } = req.body;
  if (!ta_id) {
    return res.status(400).json({ error: 'TA ID is required' });
  }
  next();
};

export const validateCreateAccount = (req, res, next) => {
  const { first_name, last_name, email, ta_code, session_day, classroom} = req.body;
  
  if (!first_name || !last_name || !email || !ta_code || !session_day) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  next();
};

export const validateShift = (req, res, next) => {
  const { ta_id, clock_in } = req.body;
  
  if (!ta_id || !clock_in) {
    return res.status(400).json({ error: 'TA ID and clock in time are required' });
  }
  
  next();
};