import express from 'express';
import { createAccount, signIn } from '../services/taService.js';
import { validateCreateAccount } from '../middleware/validate.js';
import { loginLimiter, createAccountLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Create account endpoint with rate limiting
router.post('/create-account', createAccountLimiter, validateCreateAccount, async (req, res, next) => {
  try {
    const result = await createAccount(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Sign in endpoint with rate limiting
router.post('/signin', async (req, res, next) => {
  try {
    const result = await signIn(req.body.ta_code);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;