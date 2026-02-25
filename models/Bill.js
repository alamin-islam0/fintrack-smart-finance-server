const mongoose = require('mongoose');

const billSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    recurring: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    reminderDays: { type: Number, default: 3, min: 0, max: 30 },
    paidAt: { type: Date },
    paymentTransaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }
  },
  { timestamps: true }
);

billSchema.index({ user: 1, status: 1, dueDate: 1 });

module.exports = mongoose.model('Bill', billSchema);
