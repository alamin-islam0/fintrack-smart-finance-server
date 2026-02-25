const asyncHandler = require('express-async-handler');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

const getBudgets = asyncHandler(async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const budgets = await Budget.find({ user: req.user._id, month }).sort('category');

  const expenses = await Transaction.find({
    user: req.user._id,
    type: 'expense',
    date: {
      $gte: new Date(`${month}-01T00:00:00.000Z`),
      $lt: new Date(new Date(`${month}-01T00:00:00.000Z`).setMonth(new Date(`${month}-01T00:00:00.000Z`).getMonth() + 1))
    }
  });

  const spentByCategory = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  const enriched = budgets.map((b) => {
    const spent = spentByCategory[b.category] || 0;
    return {
      ...b.toObject(),
      spent,
      remaining: b.limitAmount - spent,
      usagePercent: b.limitAmount ? Math.round((spent / b.limitAmount) * 100) : 0,
      status: spent > b.limitAmount ? 'over' : spent > b.limitAmount * 0.8 ? 'warning' : 'safe'
    };
  });

  res.json(enriched);
});

const createBudget = asyncHandler(async (req, res) => {
  const { category, month, limitAmount } = req.body;
  if (!category || !month || !limitAmount) {
    res.status(400);
    throw new Error('category, month and limitAmount are required');
  }

  const budget = await Budget.create({ user: req.user._id, category, month, limitAmount });
  res.status(201).json(budget);
});

const updateBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.findOne({ _id: req.params.id, user: req.user._id });
  if (!budget) {
    res.status(404);
    throw new Error('Budget not found');
  }

  budget.category = req.body.category || budget.category;
  budget.month = req.body.month || budget.month;
  budget.limitAmount = req.body.limitAmount || budget.limitAmount;
  await budget.save();

  res.json(budget);
});

const deleteBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!budget) {
    res.status(404);
    throw new Error('Budget not found');
  }
  res.json({ message: 'Budget deleted' });
});

module.exports = { getBudgets, createBudget, updateBudget, deleteBudget };
