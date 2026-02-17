import express from 'express';
import { getAllTAsWithStatus, deactivateTA, updateClassroom } from '../services/taService.js';

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

// PATCH /api/tas/:id/deactivate
router.patch('/:id/deactivate', async (req, res, next) => {
    try {
        const result = await deactivateTA(req.params.id);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// PATCH /api/tas/:id/classroom
router.patch('/:id/classroom', async (req, res, next) => {
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

export default router;