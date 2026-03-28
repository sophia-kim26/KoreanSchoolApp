import express from 'express';
import { getAllShifts, createShift, updateShift, getActiveShift, getShiftsForTA, getShiftById } from '../services/shiftService.js';
import { validateShift, validateLocation } from '../middleware/validate.js';
import { checkJwt, checkTAJwt, checkAnyJwt } from '../middleware/protect.js';

const router = express.Router();

// ✅ PUBLIC — TAs need to read shifts without being "logged in" via Auth0
router.get('/', checkAnyJwt, async (req, res, next) => {
  try {
    const result = await getAllShifts();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/ta/:ta_id', checkAnyJwt, async (req, res, next) => {
  try {
    const result = await getShiftsForTA(parseInt(req.params.ta_id));
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/active/:ta_id', checkAnyJwt, async (req, res, next) => {
  try {
    const result = await getActiveShift(req.params.ta_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ✅ PROTECTED — checkJwt must come BEFORE validateShift/validateLocation
router.post('/', checkTAJwt, validateShift, validateLocation, async (req, res, next) => {
  try {
    const result = await createShift(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ✅ PROTECTED — manual VP entry
router.post('/manual', checkJwt, async (req, res, next) => {
  try {
    const result = await createShift(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ✅ PROTECTED — editing shifts
router.put('/:id', checkAnyJwt, async (req, res, next) => {
  try {
    const shiftId = req.params.id;
    if (req.auth?.ta_id) {
      const shift = await getShiftById(shiftId);
      if (!shift) return res.status(404).json({ error: 'Shift not found' });
      if (shift.ta_id !== req.auth.ta_id) {
        return res.status(403).json({ error: 'Forbidden: cannot edit another TA shift' });
      }
    }
    const { clock_in, clock_out, notes, elapsed_time, attendance } = req.body;
    const updateData = {};
    if (clock_in !== undefined) updateData.clock_in = clock_in;
    if (clock_out !== undefined) updateData.clock_out = clock_out;
    if (notes !== undefined) updateData.notes = notes;
    if (elapsed_time !== undefined) updateData.elapsed_time = elapsed_time;
    if (attendance !== undefined) updateData.attendance = attendance;
    const result = await updateShift(req.params.id, updateData);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
