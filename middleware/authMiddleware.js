const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn(`Auth failed: Missing or malformed header. Authorization: ${authHeader ? 'present' : 'missing'}`);
    res.status(401);
    throw new Error('Not authorized - No token provided');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized - User not found');
    }
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    res.status(401);
    throw new Error('Not authorized - Invalid or expired token');
  }
});

const allowRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    res.status(403);
    throw new Error('Forbidden');
  }
  next();
};

module.exports = { protect, allowRoles };
