import { isIPv4 } from 'net';

// allowed IP addresses or network ranges
const ALLOWED_IPS = [
  '127.0.0.1',        // localhost for testing
  '::1',              // localhost IPv6
  '69.121.204.146',   // my home IP
];

// cIDR ranges
const ALLOWED_CIDR_RANGES = [
  '168.229.254.0/24',  // BCA BYOD network (covers .0 - .255, includes .66 and .67)
  // '192.168.1.0/24', // add korean school ip address when i actually find out
];

// check if the user's IP falls within a CIDR range
const ipInCIDR = (ip, cidr) => {
  // Only handle IPv4
  if (!isIPv4(ip)) return false;

  const [range, bits] = cidr.split('/');
  const mask = ~(2 ** (32 - parseInt(bits)) - 1);

  const ipNum = ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
  const rangeNum = range.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);

  return (ipNum & mask) === (rangeNum & mask);
};

// Get client IP from request
const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         req.ip;
};

// Strip IPv6 prefix from IPv4 addresses (e.g. ::ffff:168.229.254.66 → 168.229.254.66)
const normalizeIP = (ip) => {
  if (ip?.startsWith('::ffff:')) return ip.substring(7);
  return ip;
};

// IP address checking
export const validateLocation = (req, res, next) => {
  const rawIP = getClientIP(req);
  const clientIP = normalizeIP(rawIP);

  // Check exact IP matches
  const isExactMatch = ALLOWED_IPS.some(allowedIP => {
    if (clientIP === '::1' && allowedIP === '127.0.0.1') return true;
    return clientIP === allowedIP;
  });

  // Check CIDR range matches
  const isCIDRMatch = ALLOWED_CIDR_RANGES.some(cidr => ipInCIDR(clientIP, cidr));

  if (!isExactMatch && !isCIDRMatch) {
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
  const { first_name, last_name, email, ta_code, session_day } = req.body;
  
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