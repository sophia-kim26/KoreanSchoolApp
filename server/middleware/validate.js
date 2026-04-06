import { isIPv4 } from 'net';
import { z } from 'zod';

// allowed IP addresses or network ranges
const ALLOWED_IPS = [
  '127.0.0.1',        // localhost for testing
  '::1',              // localhost IPv6
  '69.121.204.146',   // my home IP
  '173.70.27.192' // sophia's home IP
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

const errorResponse = (res, error) => {
  console.warn('Validation failed:', error.format ? JSON.stringify(error.format(), null, 2) : error.message);

  return res.status(400).json({
    error: 'Invalid request data.'
  });
};

const validateWithSchema = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return errorResponse(res, parsed.error);
  }
  req.body = parsed.data;
  next();
};

const dateString = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/);

const clockInSchema = z.object({
  ta_id: z.coerce.number().int().positive()
}).strip();

const createAccountSchema = z.object({
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().min(1).max(100),
  email: z.string().trim().min(1).max(100),
  ta_code: z.string().trim().min(1).max(20),
  session_day: z.string().trim().min(1).max(20),
  korean_name: z.string().trim().max(100).optional(),
  classroom: z.string().trim().max(50).optional()
}).strip();

const signInSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  ta_code: z.string().trim().min(1).max(20)
}).strip();

const shiftCreateSchema = z.object({
  ta_id: z.coerce.number().int().positive(),
  clock_in: z.string().trim().min(1),
  clock_out: z.string().trim().min(1).optional(),
  notes: z.string().trim().max(1000).optional()
}).strip();

const shiftUpdateSchema = z.object({
  clock_in: z.string().trim().min(1).optional(),
  clock_out: z.string().trim().min(1).optional(),
  notes: z.string().trim().max(1000).optional(),
  elapsed_time: z.coerce.number().int().nonnegative().optional(),
  attendance: z.string().trim().min(1).max(20).optional()
}).strip().refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required'
});

const parentCreateSchema = z.object({
  english_name: z.string().trim().min(1).max(100),
  korean_name: z.string().trim().max(100).optional(),
  phone: z.string().trim().min(1).max(50),
  email: z.string().trim().email().optional()
}).strip();

const parentUpdateSchema = z.object({
  english_name: z.string().trim().max(100).optional(),
  korean_name: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(50).optional(),
  email: z.string().trim().email().optional()
}).strip().refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required'
});

const classroomSchema = z.object({
  classroom: z.string().trim().min(1).max(50).optional()
}).strip();

const calendarDatesSchema = z.object({
  dates: z.array(dateString)
}).strip();

export const validateClockIn = validateWithSchema(clockInSchema);
export const validateCreateAccount = validateWithSchema(createAccountSchema);
export const validateSignIn = validateWithSchema(signInSchema);
export const validateShift = validateWithSchema(shiftCreateSchema);
export const validateShiftUpdate = validateWithSchema(shiftUpdateSchema);
export const validateParentCreate = validateWithSchema(parentCreateSchema);
export const validateParentUpdate = validateWithSchema(parentUpdateSchema);
export const validateClassroom = validateWithSchema(classroomSchema);
export const validateCalendarDates = validateWithSchema(calendarDatesSchema);
