import express from 'express';
import { createAccount, signIn } from '../services/taService.js';
import { validateCreateAccount } from '../middleware/validate.js';

const router = express.Router();

router.post('/create-account', validateCreateAccount, async (req, res, next) => {
  try {
    const result = await createAccount(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/signin', async (req, res, next) => {
  try {
    const result = await signIn(req.body.ta_code);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;