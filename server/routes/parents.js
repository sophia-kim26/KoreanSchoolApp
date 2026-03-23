import express from 'express';
import { validateParentCreate, validateParentUpdate } from '../middleware/validate.js';

import { 
  getAllParents, 
  getParentById, 
  getParentsByTAId,
  createParent,
  updateParent,
  deleteParent
} from '../services/parentService.js';

const router = express.Router();

// GET /api/parents
router.get('/', async (req, res, next) => {
  try {
    const result = await getAllParents();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/parents/:id
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

// GET /api/parents/ta/:taId
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

// POST /api/parents
router.post('/', validateParentCreate, async (req, res, next) => {
  try {
    const { english_name, korean_name, phone, email } = req.body;
    const result = await createParent({ english_name, korean_name, phone, email });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// PUT /api/parents/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { english_name, korean_name, phone, email } = req.body;
    const result = await updateParent(req.params.id, { english_name, korean_name, phone, email });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/parents/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await deleteParent(req.params.id);
    res.json({ message: 'Parent deleted successfully', parent: result });
  } catch (error) {
    next(error);
  }
});

export default router;