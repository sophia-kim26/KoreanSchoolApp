import express from 'express';
import { createAccount, signIn, resetPin } from '../services/taService.js';
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

// Create account endpoint without rate limiting
router.post('/create-account-vp', validateCreateAccount, async (req, res, next) => {
  try {
    const result = await createAccount(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Sign in endpoint with rate limiting
router.post('/signin', loginLimiter, async (req, res, next) => {
  try {
    const result = await signIn(req.body.ta_code);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Reset PIN endpoint
router.post('/reset-pin/:ta_id', async (req, res, next) => {
  try {
    const result = await resetPin(req.params.ta_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;