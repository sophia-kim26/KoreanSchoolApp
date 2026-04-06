import { expressjwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import jwt from 'jsonwebtoken';

const domain = process.env.AUTH0_DOMAIN;
const audience = process.env.AUTH0_AUDIENCE;

if (!domain || !audience) {
  throw new Error('Missing AUTH0_DOMAIN or AUTH0_AUDIENCE environment variables.');
}

// VP/admin routes — Auth0 RS256
export const checkJwt = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksUri: `https://${domain}/.well-known/jwks.json`
  }),
  audience,
  issuer: `https://${domain}/`,
  algorithms: ['RS256']
});

// TA routes — your own HS256 tokens
export const checkTAJwt = expressjwt({
  secret: process.env.TA_JWT_SECRET,
  algorithms: ['HS256']
});

// Routes accessible by either VP (Auth0) or TA (custom token)
export const checkAnyJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No authorization token was found' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.TA_JWT_SECRET);
    req.auth = decoded;
    return next(); // TA token valid — done
  } catch {
    // Not a TA token, fall through to Auth0
  }

  checkJwt(req, res, next);
};