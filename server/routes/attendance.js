import express from 'express';

import { clockIn, clockOut } from '../services/shiftService.js';
import { validateClockIn } from '../middleware/validate.js';

const router = express.Router();

// POST /api/attendance/clock-in
router.post('/clock-in', validateClockIn, async (req, res, next) => {
  try {
    const result = await clockIn(req.body.ta_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/attendance/clock-out/:ta_id
router.post('/clock-out/:ta_id', async (req, res, next) => {
  try {
    const result = await clockOut(req.params.ta_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;