const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  deleteAccount,
  refreshToken
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);

// Protected routes
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);
router.delete('/account', authenticateToken, deleteAccount);

module.exports = router; 