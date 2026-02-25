const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const SavingsGoal = require('../models/SavingsGoal');
const Tip = require('../models/Tip');

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').sort('-createdAt');
  res.json(users);
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'user'].includes(role)) {
    res.status(400);
    throw new Error('role must be admin or user');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.role = role;
  await user.save();

  res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, photoUrl: user.photoUrl });
});

const deleteUser = asyncHandler(async (req, res) => {
  if (String(req.user._id) === String(req.params.id)) {
    res.status(400);
    throw new Error('You cannot delete your own account');
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  await Promise.all([
    Transaction.deleteMany({ user: user._id }),
    SavingsGoal.deleteMany({ user: user._id })
  ]);

  res.json({ message: 'User deleted' });
});

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort('name');
  res.json(categories);
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, type } = req.body;
  if (!name || !type) {
    res.status(400);
    throw new Error('name and type are required');
  }

  const normalizedName = name.trim();
  const exists = await Category.findOne({ name: normalizedName, type });
  if (exists) {
    res.status(400);
    throw new Error('Category already exists');
  }

  const category = await Category.create({ name: normalizedName, type });
  res.status(201).json(category);
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  category.name = req.body.name || category.name;
  category.type = req.body.type || category.type;
  await category.save();
  res.json(category);
});

const deleteCategory = asyncHandler(async (req, res) => {
  const deleted = await Category.findByIdAndDelete(req.params.id);
  if (!deleted) {
    res.status(404);
    throw new Error('Category not found');
  }
  res.json({ message: 'Category deleted' });
});

const getReports = asyncHandler(async (req, res) => {
  const [users, transactions, goals, tips] = await Promise.all([
    User.find().select('createdAt'),
    Transaction.find().select('amount type category date'),
    SavingsGoal.find().select('targetAmount currentAmount'),
    Tip.countDocuments()
  ]);

  const totalUsers = users.length;
  const totalTransactions = transactions.length;
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);

  const categoryStats = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const monthly = transactions.reduce((acc, t) => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[key]) acc[key] = { monthKey: key, income: 0, expense: 0 };
    if (t.type === 'income') acc[key].income += t.amount;
    if (t.type === 'expense') acc[key].expense += t.amount;
    return acc;
  }, {});

  const savingsSummary = goals.reduce(
    (acc, g) => {
      acc.target += g.targetAmount;
      acc.current += g.currentAmount;
      return acc;
    },
    { target: 0, current: 0 }
  );

  res.json({
    totalUsers,
    totalTransactions,
    totalTips: tips,
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    categoryStats,
    monthlyStats: Object.values(monthly).sort((a, b) => a.monthKey.localeCompare(b.monthKey)),
    savingsSummary
  });
});

const getAllTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find().populate('user', 'name email').sort('-date');
  res.json(transactions);
});

const addTip = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    res.status(400);
    throw new Error('title and content are required');
  }
  const tip = await Tip.create({ title, content });
  res.status(201).json(tip);
});

module.exports = {
  getUsers,
  updateUserRole,
  deleteUser,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getReports,
  getAllTransactions,
  addTip
};
