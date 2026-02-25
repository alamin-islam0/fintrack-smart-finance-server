const asyncHandler = require('express-async-handler');
const SavingsGoal = require('../models/SavingsGoal');

const getGoals = asyncHandler(async (req, res) => {
  const goals = await SavingsGoal.find({ user: req.user._id }).sort('-createdAt');
  res.json(goals);
});

const createGoal = asyncHandler(async (req, res) => {
  const { title, targetAmount, currentAmount, deadline, contribution } = req.validated;
  const goal = await SavingsGoal.create({
    user: req.user._id,
    title,
    targetAmount,
    currentAmount: currentAmount || 0,
    deadline: deadline ? new Date(deadline) : undefined,
    contributions: contribution ? [{ amount: contribution }] : []
  });

  res.status(201).json(goal);
});

const updateGoal = asyncHandler(async (req, res) => {
  const goal = await SavingsGoal.findOne({ _id: req.params.id, user: req.user._id });
  if (!goal) {
    res.status(404);
    throw new Error('Goal not found');
  }

  const { title, targetAmount, currentAmount, deadline, contribution } = req.validated;
  if (title) goal.title = title;
  if (targetAmount) goal.targetAmount = targetAmount;
  if (typeof currentAmount === 'number') goal.currentAmount = currentAmount;
  if (deadline) goal.deadline = new Date(deadline);
  if (contribution) {
    goal.currentAmount += contribution;
    goal.contributions.push({ amount: contribution });
  }

  await goal.save();
  res.json(goal);
});

const deleteGoal = asyncHandler(async (req, res) => {
  const goal = await SavingsGoal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!goal) {
    res.status(404);
    throw new Error('Goal not found');
  }
  res.json({ message: 'Goal deleted' });
});

module.exports = { getGoals, createGoal, updateGoal, deleteGoal };
