const express = require('express');
const { getGoals, createGoal, updateGoal, deleteGoal } = require('../controllers/goalController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { goalSchema } = require('../utils/validators');

const router = express.Router();

router.get('/', optionalProtect, getGoals);
router.use(protect);
router.post('/', validate(goalSchema), createGoal);
router.put('/:id', validate(goalSchema), updateGoal);
router.delete('/:id', deleteGoal);

module.exports = router;
