const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) return 'Password must be at least 8 characters long';
    if (!hasUpperCase) return 'Password must contain at least one uppercase letter';
    if (!hasSpecialChar) return 'Password must contain at least one special character';
    return null;
};

const register = async (req, res) => {
    const { name, email, password, role, mobile } = req.body;

    // Validate mobile number (10 digits)
    if (mobile && !/^\d{10}$/.test(mobile)) {
        return res.status(400).json({ message: 'Mobile number must be exactly 10 digits' });
    }

    try {
        // Check if user exists
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const passwordError = validatePassword(password);
        if (passwordError) {
            return res.status(400).json({ message: passwordError });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = await db.query(
            'INSERT INTO users (name, email, password_hash, role, mobile) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, mobile',
            [name, email, hashedPassword, role || 'CLIENT', mobile]
        );

        res.status(201).json(newUser.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = userResult.rows[0];

        if (user.status === 'BLOCKED') {
            return res.status(403).json({ message: 'Your account has been blocked. Please contact support.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                mobile: user.mobile,
                status: user.status
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getMe = async (req, res) => {
    try {
        const userResult = await db.query(
            'SELECT id, name, email, role, status, mobile FROM users WHERE id = $1',
            [req.user.id]
        );
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = userResult.rows[0];
        if (user.status === 'BLOCKED') {
            return res.status(403).json({ message: 'Account blocked' });
        }

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { name, mobile } = req.body;
        const userId = req.user.id;

        // Validate mobile number (10 digits)
        if (mobile && !/^\d{10}$/.test(mobile)) {
            return res.status(400).json({ message: 'Mobile number must be exactly 10 digits' });
        }

        const result = await db.query(
            'UPDATE users SET name = $1, mobile = $2 WHERE id = $3 RETURNING id, name, email, role, mobile',
            [name, mobile, userId]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        // Get user for password check
        const userRes = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length === 0) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, userRes.rows[0].password_hash);
        if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });

        // Hash new password
        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            return res.status(400).json({ message: passwordError });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, userId]);

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const sendOtp = async (req, res) => {
    try {
        const { mobile } = req.body;

        // Validate mobile number (10 digits)
        if (!mobile || !/^\d{10}$/.test(mobile)) {
            return res.status(400).json({ message: 'Invalid mobile number. Must be 10 digits.' });
        }
        // Check if user exists
        const userRes = await db.query('SELECT * FROM users WHERE mobile = $1', [mobile]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ message: 'User with this mobile number not found' });
        }

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 10 * 60000); // 10 minutes

        // Save to DB
        await db.query('UPDATE users SET otp = $1, otp_expires = $2 WHERE mobile = $3', [otp, expires, mobile]);

        // Log to console (Simulation)
        console.log(`=========================================`);
        console.log(`OTP for ${mobile}: ${otp}`);
        console.log(`=========================================`);

        res.json({ message: 'OTP sent successfully to your mobile number' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const resetPasswordWithOtp = async (req, res) => {
    try {
        const { mobile, otp, newPassword } = req.body;

        // Validate mobile number (10 digits)
        if (!mobile || !/^\d{10}$/.test(mobile)) {
            return res.status(400).json({ message: 'Invalid mobile number. Must be 10 digits.' });
        }

        const userRes = await db.query('SELECT * FROM users WHERE mobile = $1', [mobile]);
        if (userRes.rows.length === 0) return res.status(404).json({ message: 'User not found' });

        const user = userRes.rows[0];

        // Verify OTP
        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (new Date() > new Date(user.otp_expires)) {
            return res.status(400).json({ message: 'OTP expired' });
        }

        // Hash new password
        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            return res.status(400).json({ message: passwordError });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and clear OTP
        await db.query(
            'UPDATE users SET password_hash = $1, otp = NULL, otp_expires = NULL WHERE id = $2',
            [hashedPassword, user.id]
        );

        res.json({ message: 'Password reset successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { register, login, getMe, updateProfile, changePassword, sendOtp, resetPasswordWithOtp };
