import express from 'express';
import { checkJwt } from '../middleware/protect.js';

import { 
  getAllParents, 
  getParentById, 
  getParentsByTAId,
  createParent,
  updateParent,
  deleteParent
} from '../services/parentService.js';

const router = express.Router();

// GET /api/parents - get all parents
router.get('/', async (req, res, next) => {
  try {
    const result = await getAllParents();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/parents/:id - get a specific parent by ID
router.get('/:id', async (req, res, next) => {
  try {
    const result = await getParentById(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Parent not found' });
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/parents/ta/:taId - get parents for a specific TA
router.get('/ta/:taId', async (req, res, next) => {
  try {
    const result = await getParentsByTAId(req.params.taId);
    if (!result) {
      return res.status(404).json({ error: 'No parents found for this TA' });
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/parents - create a new parent
router.post('/', async (req, res, next) => {
  try {
    const { english_name, korean_name, phone, email } = req.body;
    
    if (!english_name || !phone) {
      return res.status(400).json({ 
        error: 'English name and phone are required' 
      });
    }
    
    const result = await createParent({ 
      english_name, 
      korean_name, 
      phone, 
      email 
    });
    
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// PUT /api/parents/:id - update a parent
router.put('/:id', async (req, res, next) => {
  try {
    const { english_name, korean_name, phone, email } = req.body;
    
    const result = await updateParent(req.params.id, {
      english_name,
      korean_name,
      phone,
      email
    });
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/parents/:id - delete a parent
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await deleteParent(req.params.id);
    res.json({ 
      message: 'Parent deleted successfully', 
      parent: result 
    });
  } catch (error) {
    next(error);
  }
});

export default router;