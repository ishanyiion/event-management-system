const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config({ override: true });

const secret = process.env.JWT_SECRET;
console.log('JWT_SECRET from .env:', secret);

const testPayload = { id: 1, role: 'ADMIN' };
const token = jwt.sign(testPayload, secret, { expiresIn: '1d' });
console.log('Generated Test Token:', token);

try {
    const decoded = jwt.verify(token, secret);
    console.log('Verification Success:', decoded);
} catch (err) {
    console.error('Verification Failed:', err.message);
}
