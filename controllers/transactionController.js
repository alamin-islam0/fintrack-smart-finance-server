const asyncHandler = require('express-async-handler');
const Transaction = require('../models/Transaction');

const buildMonthKey = (dateValue) => {
  const d = new Date(dateValue);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const getTransactions = asyncHandler(async (req, res) => {
  const query = { user: req.user._id };

  if (req.query.category) query.category = req.query.category;
  if (req.query.type) query.type = req.query.type;
  if (req.query.search) query.$or = [{ category: { $regex: req.query.search, $options: 'i' } }, { note: { $regex: req.query.search, $options: 'i' } }];

  if (req.query.startDate || req.query.endDate) {
    query.date = {};
    if (req.query.startDate) query.date.$gte = new Date(req.query.startDate);
    if (req.query.endDate) query.date.$lte = new Date(req.query.endDate);
  }

  const sort = req.query.sort || '-date';
  const items = await Transaction.find(query).sort(sort);
  res.json(items);
});

const createTransaction = asyncHandler(async (req, res) => {
  const payload = req.validated;
  const created = await Transaction.create({ ...payload, user: req.user._id, date: new Date(payload.date) });
  res.status(201).json(created);
});

const updateTransaction = asyncHandler(async (req, res) => {
  const trx = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
  if (!trx) {
    res.status(404);
    throw new Error('Transaction not found');
  }

  Object.assign(trx, { ...req.validated, date: new Date(req.validated.date) });
  await trx.save();
  res.json(trx);
});

const deleteTransaction = asyncHandler(async (req, res) => {
  const trx = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!trx) {
    res.status(404);
    throw new Error('Transaction not found');
  }
  res.json({ message: 'Deleted' });
});

const summary = asyncHandler(async (req, res) => {
  const rows = await Transaction.find({ user: req.user._id });
  const totalIncome = rows.filter((r) => r.type === 'income').reduce((a, r) => a + r.amount, 0);
  const totalExpense = rows.filter((r) => r.type === 'expense').reduce((a, r) => a + r.amount, 0);
  const balance = totalIncome - totalExpense;

  res.json({
    totalIncome,
    totalExpense,
    balance,
    totalBalance: balance
  });
});

const trends = asyncHandler(async (req, res) => {
  const rows = await Transaction.find({ user: req.user._id }).sort('date');
  const bucket = new Map();

  for (const row of rows) {
    const key = buildMonthKey(row.date);
    if (!bucket.has(key)) {
      bucket.set(key, { monthKey: key, income: 0, expense: 0, total: 0 });
    }

    const item = bucket.get(key);
    if (row.type === 'income') item.income += row.amount;
    if (row.type === 'expense') item.expense += row.amount;
    item.total = item.income - item.expense;
  }

  const result = Array.from(bucket.values()).map((item) => {
    const [year, month] = item.monthKey.split('-').map(Number);
    return {
      ...item,
      label: new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short' })
    };
  });

  res.json(result);
});

module.exports = {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  summary,
  trends
};
