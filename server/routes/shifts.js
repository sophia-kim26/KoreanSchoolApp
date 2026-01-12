import express from 'express';
import { 
  getAllShifts, 
  createShift, 
  updateShift,
  getActiveShift,
  getShiftsForTA
} from '../services/shiftService.js';
import { validateShift } from '../middleware/validate.js';

const router = express.Router();

// GET /api/shifts
router.get('/', async (req, res, next) => {
  try {
    const result = await getAllShifts();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/shifts/ta/:ta_id - get all shifts for a specific TA
router.get('/ta/:ta_id', async (req, res, next) => {
  try {
    const result = await getShiftsForTA(req.params.ta_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/shifts/active/:ta_id
router.get('/active/:ta_id', async (req, res, next) => {
  try {
    const result = await getActiveShift(req.params.ta_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/shifts
router.post('/', validateShift, async (req, res, next) => {
  try {
    const result = await createShift(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// PUT /api/shifts/:id
router.put('/:id', async (req, res, next) => {
  try {
    const result = await updateShift(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;