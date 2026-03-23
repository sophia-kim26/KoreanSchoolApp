import express from 'express';
import { checkJwt } from '../middleware/protect.js';
import { validateCalendarDates } from '../middleware/validate.js';

import { 
    getAllSaturdayData, 
    getCalendarDates, 
    saveCalendarDates 
} from '../services/saturdayService.js';


const router = express.Router();

// GET /api/saturday/
router.get('/', async (req, res, next) => {
  try {
    console.log('GET /api/saturday/ called');
    const result = await getAllSaturdayData();
    res.json(result);
  } catch (error) {
    console.error('Error in GET /:', error);
    next(error);
  }
});

// GET /api/saturday/get-calendar-dates
router.get('/get-calendar-dates', async (req, res, next) => {
  try {
    console.log('GET /api/saturday/get-calendar-dates called');
    const result = await getCalendarDates();
    res.json(result);
  } catch (error) {
    console.error('Error in get-calendar-dates route:', error);
    next(error);
  }
});

// POST /api/saturday/save-calendar-dates
router.post('/save-calendar-dates', async (req, res, next) => {
  try {
    console.log('POST /api/saturday/save-calendar-dates called');
    console.log('Request body:', req.body);
    
    const { dates } = req.body;
    console.log('Saving dates:', dates);
    const result = await saveCalendarDates(dates);
    console.log('Save result:', result);
    
    res.json({ 
        success: true, 
        message: `Saved ${result.count} dates` 
    });
  } catch (error) {
    console.error('Error in save-calendar-dates route:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
