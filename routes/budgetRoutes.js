const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getBudgets, createBudget, updateBudget, deleteBudget } = require('../controllers/budgetController');

const router = express.Router();

router.use(protect);
router.get('/', getBudgets);
router.post('/', createBudget);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

module.exports = router;
