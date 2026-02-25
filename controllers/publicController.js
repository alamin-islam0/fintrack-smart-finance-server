const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');

function getPeriodRange(period) {
  const now = new Date();
  if (period === 'yearly') {
    return {
      start: new Date(now.getFullYear(), 0, 1),
      end: new Date(now.getFullYear() + 1, 0, 1),
      prevStart: new Date(now.getFullYear() - 1, 0, 1),
      prevEnd: new Date(now.getFullYear(), 0, 1)
    };
  }

  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    prevStart: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    prevEnd: new Date(now.getFullYear(), now.getMonth(), 1)
  };
}

function percentChange(current, prev) {
  if (!prev) return current ? 100 : 0;
  return ((current - prev) / Math.abs(prev)) * 100;
}

function fallbackOverview(period) {
  return {
    period,
    metrics: {
      totalBalance: 12450,
      monthlySavings: 2100,
      netWorth: 85200,
      totalBalanceChange: 5.2,
      monthlySavingsChange: 12.4,
      netWorthChange: 3.1
    },
    distribution: [
      { category: 'Housing & Rent', amount: 2400, percentage: 55 },
      { category: 'Food & Dining', amount: 850, percentage: 28 },
      { category: 'Entertainment', amount: 420, percentage: 17 }
    ]
  };
}

const getLandingOverview = asyncHandler(async (req, res) => {
  const period = req.query.period === 'yearly' ? 'yearly' : 'monthly';
  const { start, end, prevStart, prevEnd } = getPeriodRange(period);

  if (mongoose.connection.readyState !== 1) {
    return res.json(fallbackOverview(period));
  }

  let allRows = [];
  try {
    allRows = await Transaction.find().select('amount type date category');
  } catch (error) {
    console.error('Overview query failed:', error.message);
    return res.json(fallbackOverview(period));
  }

  if (!allRows.length) {
    return res.json(fallbackOverview(period));
  }

  const totalIncome = allRows.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const totalExpense = allRows.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const totalBalance = totalIncome - totalExpense;

  const currentRows = allRows.filter((t) => {
    const d = new Date(t.date);
    return d >= start && d < end;
  });
  const prevRows = allRows.filter((t) => {
    const d = new Date(t.date);
    return d >= prevStart && d < prevEnd;
  });

  const currentSavings =
    currentRows.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0) -
    currentRows.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);

  const prevSavings =
    prevRows.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0) -
    prevRows.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);

  const currentNetWorth = totalBalance + currentSavings * (period === 'yearly' ? 1 : 12);
  const prevNetWorth = totalBalance + prevSavings * (period === 'yearly' ? 1 : 12);

  const expenseByCategory = currentRows
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const totalPeriodExpense = Object.values(expenseByCategory).reduce((a, v) => a + v, 0);
  const distribution = Object.entries(expenseByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalPeriodExpense ? Math.round((amount / totalPeriodExpense) * 100) : 0
    }));

  res.json({
    period,
    metrics: {
      totalBalance,
      monthlySavings: currentSavings,
      netWorth: currentNetWorth,
      totalBalanceChange: Number(percentChange(totalBalance, totalBalance - prevSavings).toFixed(1)),
      monthlySavingsChange: Number(percentChange(currentSavings, prevSavings).toFixed(1)),
      netWorthChange: Number(percentChange(currentNetWorth, prevNetWorth).toFixed(1))
    },
    distribution
  });
});

module.exports = { getLandingOverview };
