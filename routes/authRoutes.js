const express = require('express');
const { register, login, me, updateProfile, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema, profileSchema, passwordSchema } = require('../utils/validators');

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', protect, me);
router.put('/profile', protect, validate(profileSchema), updateProfile);
router.put('/change-password', protect, validate(passwordSchema), changePassword);

module.exports = router;
