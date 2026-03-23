import express from 'express';
import { checkJwt } from '../middleware/protect.js';
import { validateClassroom } from '../middleware/validate.js';

import { getAllTAsWithStatus, deactivateTA, updateClassroom, getTAById } from '../services/taService.js';

// tas.js - should be protected (only admins manage TAs)


const router = express.Router();

// GET /api/tas - replaces /api/data
router.get('/', async (req, res, next) => {
    try {
        const result = await getAllTAsWithStatus();
        res.json(result);
    } catch (error) {
        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await getTAById(req.params.id);
    if (!result) return res.status(404).json({ message: 'TA not found' });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/tas/:id/deactivate
router.patch('/:id/deactivate', async (req, res, next) => {
// router.patch('/:id/deactivate', checkJwt, async (req, res, next) => {
    try {
        const result = await deactivateTA(req.params.id);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// PATCH /api/tas/:id/classroom
router.patch('/:id/classroom', checkJwt, async (req, res, next) => {
// router.patch('/:id/classroom', async (req, res, next) => {
  try {
      const { classroom } = req.body;
      if (!classroom) {
          return res.status(400).json({ message: 'Classroom is required' });
      }
      const result = await updateClassroom(req.params.id, classroom);
      res.json(result);
  } catch (error) {
      next(error);
  }
});

// change assigned classroom but this is a duplicate so idk which one to keep
router.patch('/api/tas/:id/classroom', async (req, res, next) => {
// router.patch('/api/tas/:id/classroom', checkJwt, async (req, res, next) => {
  try {
    const { classroom } = req.body;
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE ta_list SET classroom = $1 WHERE id = $2 RETURNING *',
      [classroom, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
