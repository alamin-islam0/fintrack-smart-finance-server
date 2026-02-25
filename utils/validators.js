const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  photoUrl: z.string().url().optional().or(z.literal('')),
  password: z.string().min(6)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const transactionSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['income', 'expense']),
  category: z.string().min(2),
  date: z.string(),
  note: z.string().optional()
});

const goalSchema = z.object({
  title: z.string().min(2),
  targetAmount: z.number().positive(),
  currentAmount: z.number().nonnegative().optional(),
  deadline: z.string().optional(),
  contribution: z.number().positive().optional()
});

const profileSchema = z.object({
  name: z.string().min(2),
  photoUrl: z.string().url().optional().or(z.literal(''))
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6)
});

module.exports = {
  registerSchema,
  loginSchema,
  transactionSchema,
  goalSchema,
  profileSchema,
  passwordSchema
};
