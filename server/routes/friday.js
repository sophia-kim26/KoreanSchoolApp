import express from 'express';
import { 
    getAllFridayData, 
    getCalendarDates, 
    saveCalendarDates 
} from '../services/fridayService.js';


const router = express.Router();

router.get('/test', (req, res) => {
  res.json({ message: 'Friday router is working!' });
});

// GET /api/friday/
router.get('/', async (req, res, next) => {
  try {
    console.log('GET /api/friday/ called');
    const result = await getAllFridayData();
    res.json(result);
  } catch (error) {
    console.error('Error in GET /:', error);
    next(error);
  }
});

// GET /api/friday/get-calendar-dates
router.get('/get-calendar-dates', async (req, res, next) => {
  try {
    console.log('GET /api/friday/get-calendar-dates called');
    const result = await getCalendarDates();
    res.json(result);
  } catch (error) {
    console.error('Error in get-calendar-dates route:', error);
    next(error);
  }
});

// POST /api/friday/save-calendar-dates
router.post('/save-calendar-dates', checkJwt, async (req, res, next) => {
  try {
    console.log('POST /api/friday/save-calendar-dates called');
    console.log('Request body:', req.body);
    
    const { dates } = req.body;
    
    if (!dates || !Array.isArray(dates)) {
      console.log('Invalid dates format');
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid dates format. Expected array.' 
      });
    }
    
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