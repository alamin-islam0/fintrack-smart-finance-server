const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getBills, createBill, updateBill, deleteBill } = require('../controllers/billController');

const router = express.Router();

router.use(protect);
router.get('/', getBills);
router.post('/', createBill);
router.put('/:id', updateBill);
router.delete('/:id', deleteBill);

module.exports = router;
