import { expressjwt } from 'express-jwt';

import jwksRsa from 'jwks-rsa';


const checkJwt = expressjwt({

  secret: jwksRsa.expressJwtSecret({

    cache: true,

    rateLimit: true,

    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`

  }),

  audience: process.env.AUTH0_AUDIENCE,

  issuer: `https://${process.env.AUTH0_DOMAIN}/`,

  algorithms: ['RS256']


});
