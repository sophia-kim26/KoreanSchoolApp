import express from 'express';
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
    console.log('Route received ta_id:', req.params.ta_id);
    const result = await getShiftsForTA(parseInt(req.params.ta_id));
    console.log('Route returning:', result.length, 'shifts');
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
    console.log('=== MANUAL SHIFT CREATE REQUEST ===');
    console.log('ta_id:', req.body.ta_id, 'type:', typeof req.body.ta_id);
    console.log('clock_in:', req.body.clock_in);
    console.log('clock_out:', req.body.clock_out);
    console.log('notes:', req.body.notes);    
    const result = await createShift(req.body);
    
    console.log('Shift created successfully:', result);
    console.log('===================================');
    
    res.json(result);
  } catch (error) {
    console.error('=== ERROR CREATING MANUAL SHIFT ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('===================================');
    next(error);
  }
});

// PUT /api/shifts/:id
router.put('/:id', async (req, res, next) => {
  try {
    console.log("=== PUT REQUEST DEBUG ===");
    console.log("Shift ID:", req.params.id);
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    
    // Extract ALL possible fields that might be updated
    const { clock_in, clock_out, notes, elapsed_time, attendance } = req.body;
    
    // Build update object with only the fields that were sent
    const updateData = {};
    if (clock_in !== undefined) updateData.clock_in = clock_in;
    if (clock_out !== undefined) updateData.clock_out = clock_out;
    if (notes !== undefined) updateData.notes = notes;
    if (elapsed_time !== undefined) updateData.elapsed_time = elapsed_time;
    if (attendance !== undefined) updateData.attendance = attendance;
    
    console.log("Update data being sent:", updateData);
    
    const result = await updateShift(req.params.id, updateData);
    
    console.log("Update successful:", result);
    console.log("========================");
    
    res.json(result);
  } catch (error) {
    console.error("Update failed:", error);
    next(error);
  }
});

export default router;