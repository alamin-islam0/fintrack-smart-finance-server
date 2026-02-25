const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now }
  },
  { _id: false }
);

const savingsGoalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, default: 0 },
    deadline: { type: Date },
    contributions: [contributionSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('SavingsGoal', savingsGoalSchema);
