import { expressjwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';


export const checkJwt = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksUri: `https://${process.env.VITE_AUTH0_DOMAIN}/.well-known/jwks.json`
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.VITE_AUTH0_DOMAIN}/`,
  algorithms: ['RS256']
});

// New TA middleware — for TA routes (clock in/out, shifts, etc.)
export const checkTAJwt = expressjwt({
  secret: process.env.TA_JWT_SECRET,
  algorithms: ['HS256']
});