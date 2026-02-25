const express = require('express');
const { getLandingOverview } = require('../controllers/publicController');

const router = express.Router();

router.get('/overview', getLandingOverview);

module.exports = router;
