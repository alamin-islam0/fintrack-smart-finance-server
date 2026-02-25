const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const register = asyncHandler(async (req, res) => {
  const { name, email, photoUrl, password } = req.validated;
  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    photoUrl: photoUrl || '',
    password: hashed,
    role: 'user'
  });

  const token = generateToken({ id: user._id, role: user.role });
  res.status(201).json({
    token,
    user: { _id: user._id, name: user.name, email: user.email, photoUrl: user.photoUrl, role: user.role }
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated;
  const user = await User.findOne({ email });
  if (!user) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  const token = generateToken({ id: user._id, role: user.role });
  res.json({
    token,
    user: { _id: user._id, name: user.name, email: user.email, photoUrl: user.photoUrl, role: user.role }
  });
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, photoUrl } = req.validated;
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.name = name;
  user.photoUrl = photoUrl || '';
  await user.save();

  res.json({
    user: { _id: user._id, name: user.name, email: user.email, photoUrl: user.photoUrl, role: user.role }
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.validated;
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) {
    res.status(400);
    throw new Error('Current password is incorrect');
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.json({ message: 'Password updated successfully' });
});

module.exports = { register, login, me, updateProfile, changePassword };
