const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

async function testLogin() {
    try {
        // We'll use a mocked request or just hit the local server if it's running.
        // Since npm run dev is running for backend, we can try localhost:5000 (usually)
        // Let's check server.js for port.
        const res = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'daxp.yiion@gmail.com',
            password: 'password123' // Assuming this is the password from previous context if known, 
            // or just checking if the code structured correctly.
        });

        const user = res.data.user;
        console.log('User object in response:', JSON.stringify(user, null, 2));

        if (user.mobile && user.status) {
            console.log('SUCCESS: mobile and status found in login response.');
        } else {
            console.log('FAILURE: mobile or status missing.');
        }
    } catch (err) {
        console.error('Error during login test:', err.message);
        if (err.response) {
            console.error('Response data:', err.response.data);
        }
    }
}

testLogin();
