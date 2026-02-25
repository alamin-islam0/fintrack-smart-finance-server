const express = require('express');
const {
  getUsers,
  updateUserRole,
  deleteUser,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getReports,
  getAllTransactions,
  addTip
} = require('../controllers/adminController');
const { protect, allowRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, allowRoles('admin'));
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/transactions', getAllTransactions);
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);
router.get('/reports', getReports);
router.post('/tips', addTip);

module.exports = router;
