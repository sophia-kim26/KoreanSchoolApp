import express from 'express';
import { createAccount, signIn, resetPin } from '../services/taService.js';
import { validateCreateAccount } from '../middleware/validate.js';
import { loginLimiter, createAccountLimiter, createAccountLimiterVp } from '../middleware/rateLimiter.js';
import { checkJwt } from '../middleware/protect.js';

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
router.post('/create-account-vp', createAccountLimiterVp, validateCreateAccount, async (req, res, next) => {
  try {
    const result = await createAccount(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/signin
router.post('/signin', async (req, res, next) => {
  try {
    const { email, ta_code } = req.body;
    
    if (!email || !ta_code) {
      return res.status(400).json({
        success: false,
        error: 'Email and PIN are required'
      });
    }

    const result = await signIn(email, ta_code);
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