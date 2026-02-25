const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) return;

  const exists = await User.findOne({ email });
  if (exists) return;

  const hashed = await bcrypt.hash(password, 10);
  await User.create({
    name: process.env.ADMIN_NAME || 'FinTrack Admin',
    email,
    password: hashed,
    role: 'admin',
    photoUrl: process.env.ADMIN_PHOTO_URL || ''
  });

  console.log(`Seeded admin user: ${email}`);
}

module.exports = seedAdmin;
