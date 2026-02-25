const asyncHandler = require('express-async-handler');
const Bill = require('../models/Bill');
const Transaction = require('../models/Transaction');

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(dateValue = new Date()) {
  const d = new Date(dateValue);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(dateValue, days) {
  return new Date(startOfDay(dateValue).getTime() + days * DAY_MS);
}

function nextMonthDate(dateValue) {
  const current = new Date(dateValue);
  const next = new Date(current);
  next.setMonth(next.getMonth() + 1);
  return next;
}

function withReminderMeta(bill) {
  const billObj = bill.toObject ? bill.toObject() : bill;
  const due = startOfDay(billObj.dueDate);
  const today = startOfDay();
  const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / DAY_MS);
  const reminderDays = typeof billObj.reminderDays === 'number' ? billObj.reminderDays : 3;

  let reminderStatus = 'upcoming';
  if (billObj.status === 'paid') reminderStatus = 'paid';
  else if (daysUntilDue < 0) reminderStatus = 'overdue';
  else if (daysUntilDue === 0) reminderStatus = 'due_today';
  else if (daysUntilDue <= reminderDays) reminderStatus = 'due_soon';

  return {
    ...billObj,
    reminder: {
      reminderDays,
      daysUntilDue,
      status: reminderStatus,
      needsReminder: billObj.status === 'pending' && daysUntilDue <= reminderDays
    }
  };
}

async function createExpenseFromPaidBill(bill, userId, body) {
  if (bill.paymentTransaction) return;
  if (body.createExpenseTransaction === false) return;

  const expense = await Transaction.create({
    user: userId,
    amount: bill.amount,
    type: 'expense',
    category: body.expenseCategory || 'Bills',
    date: bill.paidAt || new Date(),
    note: body.expenseNote || `Bill paid: ${bill.title}`
  });

  bill.paymentTransaction = expense._id;
}

async function createNextRecurringBillIfNeeded(bill, userId, body) {
  if (!bill.recurring) return;
  if (body.generateNextRecurring === false) return;

  const nextDueDate = nextMonthDate(bill.dueDate);
  const existing = await Bill.findOne({
    user: userId,
    title: bill.title,
    amount: bill.amount,
    dueDate: nextDueDate,
    status: 'pending'
  });

  if (existing) return;

  await Bill.create({
    user: userId,
    title: bill.title,
    amount: bill.amount,
    dueDate: nextDueDate,
    recurring: true,
    status: 'pending',
    reminderDays: bill.reminderDays
  });
}

const getBills = asyncHandler(async (req, res) => {
  const status = req.query.status;
  const query = { user: req.user._id };
  if (status) query.status = status;

  const bills = await Bill.find(query).sort('dueDate');
  res.json(bills.map(withReminderMeta));
});

const getBillReminders = asyncHandler(async (req, res) => {
  const days = Number(req.query.days);
  const horizonDays = Number.isFinite(days) && days >= 0 ? Math.min(days, 60) : 7;
  const today = startOfDay();
  const horizon = addDays(today, horizonDays);

  const bills = await Bill.find({
    user: req.user._id,
    status: 'pending',
    dueDate: { $lte: horizon }
  }).sort('dueDate');

  res.json({
    windowDays: horizonDays,
    total: bills.length,
    items: bills.map(withReminderMeta)
  });
});

const createBill = asyncHandler(async (req, res) => {
  const { title, amount, dueDate, recurring, reminderDays } = req.body;
  if (!title || !amount || !dueDate) {
    res.status(400);
    throw new Error('title, amount and dueDate are required');
  }

  const parsedDueDate = new Date(dueDate);
  if (Number.isNaN(parsedDueDate.getTime())) {
    res.status(400);
    throw new Error('dueDate must be a valid date');
  }

  const bill = await Bill.create({
    user: req.user._id,
    title: String(title).trim(),
    amount,
    dueDate: parsedDueDate,
    recurring: Boolean(recurring),
    status: 'pending',
    reminderDays: Number.isFinite(Number(reminderDays)) ? Number(reminderDays) : 3
  });

  res.status(201).json(withReminderMeta(bill));
});

const updateBill = asyncHandler(async (req, res) => {
  const bill = await Bill.findOne({ _id: req.params.id, user: req.user._id });
  if (!bill) {
    res.status(404);
    throw new Error('Bill not found');
  }

  const previousStatus = bill.status;

  if (typeof req.body.title === 'string') bill.title = req.body.title.trim() || bill.title;
  if (typeof req.body.amount === 'number') bill.amount = req.body.amount;
  if (typeof req.body.dueDate !== 'undefined') {
    const parsedDueDate = new Date(req.body.dueDate);
    if (Number.isNaN(parsedDueDate.getTime())) {
      res.status(400);
      throw new Error('dueDate must be a valid date');
    }
    bill.dueDate = parsedDueDate;
  }
  bill.recurring = typeof req.body.recurring === 'boolean' ? req.body.recurring : bill.recurring;
  bill.status = req.body.status || bill.status;
  if (typeof req.body.reminderDays === 'number') {
    bill.reminderDays = req.body.reminderDays;
  }

  if (previousStatus !== 'paid' && bill.status === 'paid') {
    bill.paidAt = new Date();
    await createExpenseFromPaidBill(bill, req.user._id, req.body);
    await createNextRecurringBillIfNeeded(bill, req.user._id, req.body);
  }

  await bill.save();
  res.json(withReminderMeta(bill));
});

const deleteBill = asyncHandler(async (req, res) => {
  const bill = await Bill.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!bill) {
    res.status(404);
    throw new Error('Bill not found');
  }
  res.json({ message: 'Bill deleted' });
});

module.exports = { getBills, getBillReminders, createBill, updateBill, deleteBill };
