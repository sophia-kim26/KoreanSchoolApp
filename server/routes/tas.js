import express from 'express';
import { getAllTAsWithStatus, deactivateTA } from '../services/taService.js';

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

export default router;