import express from 'express';
import { getAllFridayData } from '../services/fridayService.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    console.log('Friday route hit!');
    const result = await getAllFridayData();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;