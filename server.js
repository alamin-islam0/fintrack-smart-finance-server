require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const goalRoutes = require("./routes/goalRoutes");
const insightRoutes = require("./routes/insightRoutes");
const adminRoutes = require("./routes/adminRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const billRoutes = require("./routes/billRoutes");
const publicRoutes = require("./routes/publicRoutes");
const { getLandingOverview } = require("./controllers/publicController");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const seedAdmin = require("./utils/seedAdmin");
const seedCategories = require("./utils/seedCategories");

const app = express();

app.use(helmet());
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(morgan("dev"));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.get("/", (req, res) => {
  res.json({ message: "FinTrack API Server", version: "1.0.0" });
});

app.get("/api", (req, res) => {
  res.json({ 
    message: "FinTrack API services are running", 
    status: "active",
    endpoints: [
      "/api/auth",
      "/api/transactions",
      "/api/goals",
      "/api/insights",
      "/api/categories",
      "/api/budgets",
      "/api/bills",
      "/api/public",
      "/api/health"
    ]
  });
});

// Ensure DB is ready before handling API routes that require MongoDB.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    return next();
  } catch (error) {
    console.error("Database unavailable:", error.message);
    return res.status(503).json({
      message: "Database is temporarily unavailable. Please try again shortly."
    });
  }
});

// Compatibility aliases for frontend clients using older paths
app.get("/overview", getLandingOverview);
app.get("/api/overview", getLandingOverview);

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/insights", insightRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/public", publicRoutes);

app.use(notFound);
app.use(errorHandler);

const basePort = Number(process.env.PORT) || 5000;

async function initializeDatabase() {
  await connectDB();

  // Only seed if not in production to avoid slow startup on Vercel.
  if (process.env.NODE_ENV !== 'production') {
    await seedAdmin().catch((err) => {
      console.error('Admin seed skipped:', err.message);
    });

    await seedCategories().catch((err) => {
      console.error('Category seed skipped:', err.message);
    });
  }
}

function startServer(port) {
  const server = app.listen(port, () =>
    console.log(`Server running on port ${port}`),
  );

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      const nextPort = port + 1;
      console.warn(`Port ${port} is busy, retrying on ${nextPort}...`);
      startServer(nextPort);
      return;
    }
    throw error;
  });
}

if (require.main === module) {
  initializeDatabase()
    .then(() => startServer(basePort))
    .catch((error) => {
      console.error("Failed to initialize database:", error.message);
      process.exit(1);
    });
}

module.exports = app;
