import express from 'express';
import { checkJwt } from '../middleware/protect.js';

import { 
  getAllShifts, 
  createShift, 
  updateShift,
  getActiveShift,
  getShiftsForTA
} from '../services/shiftService.js';
import { validateShift, validateLocation } from '../middleware/validate.js';

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
    const result = await getShiftsForTA(parseInt(req.params.ta_id));
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

// POST /api/shifts - ADD validateLocation middleware
router.post('/', validateShift, validateLocation, async (req, res, next) => {
  try {
    const result = await createShift(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/shifts/manual - Create shift without validation (for manual entry by VP)
router.post('/manual', async (req, res, next) => {
  try {
    const result = await createShift(req.body);

    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    next(error);
  }
});

// PUT /api/shifts/:id
router.put('/:id', checkJwt, async (req, res, next) => {
  try {
    
    // Extract ALL possible fields that might be updated
    const { clock_in, clock_out, notes, elapsed_time, attendance } = req.body;
    
    // Build update object with only the fields that were sent
    const updateData = {};
    if (clock_in !== undefined) updateData.clock_in = clock_in;
    if (clock_out !== undefined) updateData.clock_out = clock_out;
    if (notes !== undefined) updateData.notes = notes;
    if (elapsed_time !== undefined) updateData.elapsed_time = elapsed_time;
    if (attendance !== undefined) updateData.attendance = attendance;
        
    const result = await updateShift(req.params.id, updateData);
    
    res.json(result);
  } catch (error) {
    console.error("Update failed:", error);
    next(error);
  }
});

export default router;