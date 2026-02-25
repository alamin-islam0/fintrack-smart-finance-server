# 💰 FinTrack - Smart Finance API

[![Vercel Deployment](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://fintrack-smart-finance-client.vercel.app/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

FinTrack is a robust backend API designed to power modern financial management applications. It provides comprehensive tools for tracking transactions, managing budgets, setting financial goals, and gaining deep insights into spending habits.

---

## 🚀 Key Features

### 📊 Financial Insights & Analytics

- **Spending Trends**: Visualizes income vs. expenses over time.
- **Automated Recommendations**: Generates smart financial advice based on savings rates and top spending categories.
- **Historical Comparison**: Real-time metrics comparing current monthly performance with previous periods.

### 💸 Smart Transaction Management

- **Detailed Tracking**: Support for income/expense types, custom categories, and notes.
- **Powerful Filtering**: Search by keyword, filter by category, or filter by specific date ranges.
- **Balance Calculation**: Instant real-time calculation of total income, expenses, and net balance.

### 🎯 Budgeting & Goals

- **Category Budgets**: Set spending limits for specific categories (e.g., Food, Entertainment).
- **Goal Tracking**: Create and monitor long-term financial goals with automated progress tracking.
- **Bill Management**: Keep track of recurring bills and automatically convert paid bills into expense transactions.

### 🔐 Enterprise-Grade Security

- **JWT Authentication**: Secure stateless authentication using JSON Web Tokens.
- **BCrypt Hashing**: Industry-standard password encryption.
- **Role-Based Access (RBAC)**: Distinct permissions for standard Users and System Admins.
- **Security Middleware**: Protected routes, CORS configuration, and MongoDB sanitization.

### ⚡ Optimized for Performance

- **Serverless Architecture**: Fully optimized for Vercel Serverless Functions.
- **Database Caching**: Intelligent MongoDB connection caching to minimize cold start latency.
- **Seed Utilities**: Automated system data seeding for faster first-run setup.

---

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose ODM)
- **Validation**: Zod (Schema-based validation)
- **Security**: JWT, BcryptJS, Helmet, Morgan, Express-Rate-Limit

---

## ⚙️ Installation & Setup

### Prerequisites

- Node.js (v18+)
- MongoDB Atlas Account or Local MongoDB Instance

### Local Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/alamin-islam0/fintrack-smart-finance-server.git
   cd fintrack-smart-finance-server
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:

   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_key
   CLIENT_URL=http://localhost:3000
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

---

## 🌐 API Endpoints Overview

| Method | Endpoint              | Description                      | Access    |
| :----- | :-------------------- | :------------------------------- | :-------- |
| `POST` | `/api/auth/register`  | Register a new user              | Public    |
| `POST` | `/api/auth/login`     | Authenticate and get token       | Public    |
| `GET`  | `/api/transactions`   | Fetch user transactions          | Protected |
| `GET`  | `/api/insights`       | Get AI-driven financial insights | Protected |
| `GET`  | `/api/budgets`        | Manage monthly category budgets  | Protected |
| `GET`  | `/api/goals`          | View and update financial goals  | Protected |
| `GET`  | `/api/public/landing` | Public landing page metrics      | Public    |

---

## 📦 Deployment (Vercel)

This project is pre-configured for Vercel deployment.

1. Connect your GitHub repository to Vercel.
2. Ensure `vercel.json` is present in the root.
3. Add the environment variables (`MONGO_URI`, `JWT_SECRET`, etc.) in the Vercel Dashboard.
4. Deploy!

---

## 📄 License

This project is licensed under the MIT License.

---

**Live Client Demo**: [FinTrack Client](https://fintrack-smart-finance-client.vercel.app/)  
**Backend Author**: Alamin Islam
