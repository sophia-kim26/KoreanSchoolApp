import express from 'express';
import { checkJwt, checkAnyJwt } from '../middleware/protect.js';
import { getAllTAsWithStatus, deactivateTA, updateClassroom, getTAById } from '../services/taService.js';

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

// ❌ REMOVED — this was a duplicate with a wrong path and used `pool` directly
// which would crash since pool isn't imported here. The route above handles it.

export default router;
