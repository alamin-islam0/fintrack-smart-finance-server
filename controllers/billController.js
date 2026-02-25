const asyncHandler = require('express-async-handler');
const Bill = require('../models/Bill');

const getBills = asyncHandler(async (req, res) => {
  const status = req.query.status;
  const query = { user: req.user._id };
  if (status) query.status = status;

  const bills = await Bill.find(query).sort('dueDate');
  res.json(bills);
});

const createBill = asyncHandler(async (req, res) => {
  const { title, amount, dueDate, recurring } = req.body;
  if (!title || !amount || !dueDate) {
    res.status(400);
    throw new Error('title, amount and dueDate are required');
  }

  const bill = await Bill.create({
    user: req.user._id,
    title,
    amount,
    dueDate,
    recurring: Boolean(recurring),
    status: 'pending'
  });

  res.status(201).json(bill);
});

const updateBill = asyncHandler(async (req, res) => {
  const bill = await Bill.findOne({ _id: req.params.id, user: req.user._id });
  if (!bill) {
    res.status(404);
    throw new Error('Bill not found');
  }

  bill.title = req.body.title || bill.title;
  bill.amount = req.body.amount || bill.amount;
  bill.dueDate = req.body.dueDate || bill.dueDate;
  bill.recurring = typeof req.body.recurring === 'boolean' ? req.body.recurring : bill.recurring;
  bill.status = req.body.status || bill.status;

  await bill.save();
  res.json(bill);
});

const deleteBill = asyncHandler(async (req, res) => {
  const bill = await Bill.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!bill) {
    res.status(404);
    throw new Error('Bill not found');
  }
  res.json({ message: 'Bill deleted' });
});

module.exports = { getBills, createBill, updateBill, deleteBill };
