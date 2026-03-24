import express from 'express';
import { checkJwt } from '../middleware/protect.js';
import { validateCalendarDates } from '../middleware/validate.js';

import { 
    getAllFridayData, 
    getCalendarDates, 
    saveCalendarDates 
} from '../services/fridayService.js';


const router = express.Router();

function routeError(next, err, publicMsg) {
  console.error(publicMsg, err);
  next(new Error(publicMsg));
}

router.get('/test', (req, res) => {
  res.json({ message: 'Friday router is working!' });
});

// GET /api/friday/
router.get('/', checkJwt, async (req, res, next) => {
  try {
    console.log('GET /api/friday/ called');
    const result = await getAllFridayData();
    res.json(result);
  } catch (error) {
    routeError(next, error, 'Unable to load Friday data');
  }
});

// GET /api/friday/get-calendar-dates
router.get('/get-calendar-dates', checkJwt, async (req, res, next) => {
  try {
    console.log('GET /api/friday/get-calendar-dates called');
    const result = await getCalendarDates();
    res.json(result);
  } catch (error) {
    routeError(next, error, 'Unable to load Friday calendar dates');
  }
});

// POST /api/friday/save-calendar-dates
// router.post('/save-calendar-dates', async (req, res, next) => {
router.post('/save-calendar-dates', checkJwt, validateCalendarDates, async (req, res, next) => {
  try {
    console.log('POST /api/friday/save-calendar-dates called');
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
    routeError(next, error, 'Unable to save Friday calendar dates');
  }
});

export default router;
