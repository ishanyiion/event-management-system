const express = require('express');
const { register, login, getMe, updateProfile, changePassword, sendOtp, resetPasswordWithOtp } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getMe);
router.put('/profile', auth, updateProfile);
router.put('/profile/password', auth, changePassword);
router.post('/sent-otp', sendOtp);
router.post('/reset-password-otp', resetPasswordWithOtp);

module.exports = router;
