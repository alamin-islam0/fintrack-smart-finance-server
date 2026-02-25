const express = require('express');
const { getGoals, createGoal, updateGoal, deleteGoal } = require('../controllers/goalController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { goalSchema } = require('../utils/validators');

const router = express.Router();

router.use(protect);
router.get('/', getGoals);
router.post('/', validate(goalSchema), createGoal);
router.put('/:id', validate(goalSchema), updateGoal);
router.delete('/:id', deleteGoal);

module.exports = router;
