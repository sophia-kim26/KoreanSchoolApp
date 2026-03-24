import express from 'express';
import { checkJwt } from '../middleware/protect.js';
import { getAllParents, getParentById, getParentsByTAId, createParent, updateParent, deleteParent } from '../services/parentService.js';

const router = express.Router();

// ✅ PROTECTED — full parent list is sensitive, admin only
router.get('/', checkJwt, async (req, res, next) => {
  try {
    const result = await getAllParents();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ✅ PROTECTED — individual parent record, admin only
router.get('/:id', checkJwt, async (req, res, next) => {
  try {
    const result = await getParentById(req.params.id);
    if (!result) return res.status(404).json({ error: 'Parent not found' });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ✅ PUBLIC — TAs need to see their assigned parents (contact info for their students)
router.get('/ta/:taId', async (req, res, next) => {
  try {
    const result = await getParentsByTAId(req.params.taId);
    if (!result) return res.status(404).json({ error: 'No parents found for this TA' });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ✅ PROTECTED — all writes are admin only
router.post('/', checkJwt, async (req, res, next) => {
  try {
    const { english_name, korean_name, phone, email } = req.body;
    const result = await createParent({ english_name, korean_name, phone, email });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', checkJwt, async (req, res, next) => {
  try {
    const { english_name, korean_name, phone, email } = req.body;
    const result = await updateParent(req.params.id, { english_name, korean_name, phone, email });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', checkJwt, async (req, res, next) => {
  try {
    const result = await deleteParent(req.params.id);
    res.json({ message: 'Parent deleted successfully', parent: result });
  } catch (error) {
    next(error);
  }
});

export default router;