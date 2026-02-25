const Category = require('../models/Category');

const DEFAULT_CATEGORIES = [
  { name: 'Salary', type: 'income' },
  { name: 'Freelance', type: 'income' },
  { name: 'Investment', type: 'income' },
  { name: 'Bonus', type: 'income' },
  { name: 'Food', type: 'expense' },
  { name: 'Transport', type: 'expense' },
  { name: 'Housing', type: 'expense' },
  { name: 'Utilities', type: 'expense' },
  { name: 'Health', type: 'expense' },
  { name: 'Entertainment', type: 'expense' },
  { name: 'Shopping', type: 'expense' },
  { name: 'Education', type: 'expense' }
];

async function seedCategories() {
  const count = await Category.countDocuments();
  if (count > 0) return;

  await Category.insertMany(DEFAULT_CATEGORIES);
  console.log(`Seeded ${DEFAULT_CATEGORIES.length} default categories`);
}

module.exports = seedCategories;
