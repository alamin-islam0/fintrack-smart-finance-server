const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const Category = require('../models/Category');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  const categories = await Category.find().sort('name');
  res.json(categories);
});

module.exports = router;
