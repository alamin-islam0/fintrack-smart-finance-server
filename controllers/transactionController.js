const asyncHandler = require('express-async-handler');
const Transaction = require('../models/Transaction');

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
  const limit = Number(req.query.limit);
  const parsedLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 500) : null;

  let dbQuery = Transaction.find(query).sort(sort).lean();
  if (parsedLimit) {
    dbQuery = dbQuery.limit(parsedLimit);
  }

  const items = await dbQuery;
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
  const [row] = await Transaction.aggregate([
    { $match: { user: req.user._id } },
    {
      $group: {
        _id: null,
        totalIncome: {
          $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] }
        },
        totalExpense: {
          $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] }
        }
      }
    }
  ]);

  const totalIncome = row?.totalIncome || 0;
  const totalExpense = row?.totalExpense || 0;
  const balance = totalIncome - totalExpense;

  res.json({
    totalIncome,
    totalExpense,
    balance,
    totalBalance: balance
  });
});

const trends = asyncHandler(async (req, res) => {
  const rows = await Transaction.aggregate([
    { $match: { user: req.user._id } },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        income: {
          $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] }
        },
        expense: {
          $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] }
        }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const result = rows.map((item) => {
    const year = item._id.year;
    const month = item._id.month;
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;

    return {
      monthKey,
      income: item.income,
      expense: item.expense,
      total: item.income - item.expense,
      label: new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short' })
    };
  });

  res.json(result);
});

const dashboardData = asyncHandler(async (req, res) => {
  const requestedLimit = Number(req.query.recentLimit);
  const recentLimit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 20) : 6;

  const [summaryRows, trendRows, recentTransactions, categoryRows] = await Promise.all([
    Transaction.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] }
          },
          totalExpense: {
            $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] }
          },
          transactionCount: { $sum: 1 }
        }
      }
    ]),
    Transaction.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          income: {
            $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] }
          },
          expense: {
            $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]),
    Transaction.find({ user: req.user._id }).sort('-date').limit(recentLimit).lean(),
    Transaction.aggregate([
      { $match: { user: req.user._id, type: 'expense' } },
      {
        $group: {
          _id: '$category',
          value: { $sum: '$amount' }
        }
      },
      { $sort: { value: -1 } }
    ])
  ]);

  const totals = summaryRows[0] || { totalIncome: 0, totalExpense: 0, transactionCount: 0 };
  const balance = totals.totalIncome - totals.totalExpense;

  const trendsData = trendRows.map((item) => {
    const year = item._id.year;
    const month = item._id.month;
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;

    return {
      monthKey,
      income: item.income,
      expense: item.expense,
      total: item.income - item.expense,
      label: new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short' })
    };
  });

  const categoryBreakdown = categoryRows.map((item) => ({
    name: item._id,
    value: item.value
  }));

  res.json({
    summary: {
      totalIncome: totals.totalIncome,
      totalExpense: totals.totalExpense,
      balance,
      totalBalance: balance
    },
    trends: trendsData,
    recentTransactions,
    categoryBreakdown,
    transactionCount: totals.transactionCount
  });
});

module.exports = {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  summary,
  trends,
  dashboardData
};
