const mongoose = require('mongoose');

const billSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    recurring: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bill', billSchema);
