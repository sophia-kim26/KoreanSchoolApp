import express from 'express';
<<<<<<< HEAD
import { checkJwt } from '../middleware/protect.js';
=======
import { validateParentCreate, validateParentUpdate } from '../middleware/validate.js';
>>>>>>> b6ae2625b6b16271e4ed78004efdf2e37402e560

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
router.get('/', checkJwt, async (req, res, next) => {
  try {
    const result = await getAllParents();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/parents/:id - get a specific parent by ID
router.get('/:id', checkJwt, async (req, res, next) => {
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
router.get('/ta/:taId', checkJwt, async (req, res, next) => {
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
<<<<<<< HEAD
router.post('/', checkJwt, async (req, res, next) => {
=======
router.post('/', validateParentCreate, async (req, res, next) => {
>>>>>>> b6ae2625b6b16271e4ed78004efdf2e37402e560
  try {
    const { english_name, korean_name, phone, email } = req.body;
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
router.put('/:id', checkJwt, async (req, res, next) => {
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
router.delete('/:id', checkJwt, async (req, res, next) => {
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
