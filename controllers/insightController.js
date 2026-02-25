const asyncHandler = require('express-async-handler');
const Transaction = require('../models/Transaction');
const Tip = require('../models/Tip');

const getInsights = asyncHandler(async (req, res) => {
  const rows = await Transaction.find({ user: req.user._id }).sort('date');

  if (!rows.length) {
    const tips = await Tip.find().sort('-createdAt').limit(5);
    return res.json({
      noData: true,
      tips: tips.length
        ? tips
        : [
            { title: 'Track every expense', content: 'Small recurring costs often create large monthly leakage.' },
            { title: 'Use category budgets', content: 'Set spending caps for food, transport, and entertainment.' }
          ]
    });
  }

  const expenses = rows.filter((t) => t.type === 'expense');
  const income = rows.filter((t) => t.type === 'income');

  const totalExpense = expenses.reduce((a, t) => a + t.amount, 0);
  const totalIncome = income.reduce((a, t) => a + t.amount, 0);
  const savingsRate = totalIncome ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  const byCategory = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  const monthlyBreakdownMap = rows.reduce((acc, t) => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[key]) acc[key] = { monthKey: key, income: 0, expense: 0, balance: 0 };
    if (t.type === 'income') acc[key].income += t.amount;
    if (t.type === 'expense') acc[key].expense += t.amount;
    acc[key].balance = acc[key].income - acc[key].expense;
    return acc;
  }, {});

  const monthlyBreakdown = Object.values(monthlyBreakdownMap).sort((a, b) => a.monthKey.localeCompare(b.monthKey));

  const recommendations = [];
  if (savingsRate < 20) recommendations.push('Increase monthly savings rate to at least 20% for stronger financial resilience.');
  if (topCategory !== 'N/A') recommendations.push(`Review ${topCategory} spending and apply a monthly budget cap.`);
  if (monthlyBreakdown.length >= 2) {
    const last = monthlyBreakdown[monthlyBreakdown.length - 1];
    const prev = monthlyBreakdown[monthlyBreakdown.length - 2];
    if (last.expense > prev.expense) {
      recommendations.push('Expenses increased versus last month; audit recurring subscriptions and discretionary purchases.');
    }
  }

  res.json({
    noData: false,
    spendingTrend: 'Your spending is trend-analyzed from historical monthly transaction behavior.',
    highestExpenseCategory: topCategory,
    savingsRate: Number(savingsRate.toFixed(2)),
    monthlySummary: {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    },
    monthlyBreakdown,
    recommendations
  });
});

module.exports = { getInsights };
