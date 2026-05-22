import express from 'express';
import { checkJwt, checkAnyJwt } from '../middleware/protect.js';
import { getAllTAsWithStatus, deactivateTA, updateClassroom, getTAById, updateTA } from '../services/taService.js';

const router = express.Router();

// ✅ PUBLIC — TAs need to load the TA list and their own profile for the clock-in UI
router.get('/', checkAnyJwt, async (req, res, next) => {
  try {
    const result = await getAllTAsWithStatus();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', checkAnyJwt, async (req, res, next) => {
  try {
    const result = await getTAById(req.params.id);
    if (!result) return res.status(404).json({ message: 'TA not found' });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ✅ PROTECTED — admin-only actions
router.patch('/:id/deactivate', checkJwt, async (req, res, next) => {
  try {
    const result = await deactivateTA(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/classroom', checkJwt, async (req, res, next) => {
  try {
    const { classroom } = req.body;
    if (!classroom) return res.status(400).json({ message: 'Classroom is required' });
    const result = await updateClassroom(req.params.id, classroom);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ✅ PROTECTED — update TA profile fields
router.patch('/:id', checkJwt, async (req, res, next) => {
  try {
    const { phone, high_school, grade, age, gender, address, emergency_phone, notes } = req.body;
    const result = await updateTA(req.params.id, { phone, high_school, grade, age, gender, address, emergency_phone, notes });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
