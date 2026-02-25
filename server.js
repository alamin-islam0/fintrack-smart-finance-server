require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const goalRoutes = require('./routes/goalRoutes');
const insightRoutes = require('./routes/insightRoutes');
const adminRoutes = require('./routes/adminRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const billRoutes = require('./routes/billRoutes');
const publicRoutes = require('./routes/publicRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const seedAdmin = require('./utils/seedAdmin');
const seedCategories = require('./utils/seedCategories');

const app = express();

connectDB().catch((err) => {
  console.error('Failed to start server - MongoDB connection failed:', err);
  process.exit(1);
});

seedAdmin().catch((err) => {
  console.error('Admin seed skipped due to error:', err.message);
});

seedCategories().catch((err) => {
  console.error('Category seed skipped due to error:', err.message);
});

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ message: 'FinTrack API Server', version: '1.0.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/public', publicRoutes);

app.use(notFound);
app.use(errorHandler);

const basePort = Number(process.env.PORT) || 5000;

function startServer(port) {
  const server = app.listen(port, () => console.log(`Server running on port ${port}`));

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      console.warn(`Port ${port} is busy, retrying on ${nextPort}...`);
      startServer(nextPort);
      return;
    }
    throw error;
  });
}

startServer(basePort);
