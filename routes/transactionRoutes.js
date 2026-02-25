const express = require('express');
const {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  summary,
  trends
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { transactionSchema } = require('../utils/validators');

const router = express.Router();

router.use(protect);
router.get('/', getTransactions);
router.get('/summary', summary);
router.get('/trends', trends);
router.post('/', validate(transactionSchema), createTransaction);
router.put('/:id', validate(transactionSchema), updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
