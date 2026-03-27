import express from 'express';
import { checkJwt, checkAnyJwt } from '../middleware/protect.js';
import { validateCalendarDates } from '../middleware/validate.js';

import { 
    getAllSaturdayData, 
    getCalendarDates, 
    saveCalendarDates 
} from '../services/saturdayService.js';


const router = express.Router();

function routeError(next, err, publicMsg) {
  console.error(publicMsg, err);
  next(new Error(publicMsg));
}

// GET /api/saturday/
router.get('/', checkJwt, async (req, res, next) => {
  try {
    console.log('GET /api/saturday/ called');
    const result = await getAllSaturdayData();
    res.json(result);
  } catch (error) {
    routeError(next, error, 'Unable to load Saturday data');
  }
});

// GET /api/saturday/get-calendar-dates
router.get('/get-calendar-dates', checkAnyJwt, async (req, res, next) => {
  try {
    console.log('GET /api/saturday/get-calendar-dates called');
    const result = await getCalendarDates();
    res.json(result);
  } catch (error) {
    routeError(next, error, 'Unable to load Saturday calendar dates');
  }
});

// POST /api/saturday/save-calendar-dates
router.post('/save-calendar-dates', checkJwt, validateCalendarDates, async (req, res, next) => {
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
    routeError(next, error, 'Unable to save Saturday calendar dates');
  }
});

export default router;
