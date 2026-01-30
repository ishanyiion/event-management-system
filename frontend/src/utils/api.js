import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// Add a request interceptor to include the auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['x-auth-token'] = token;
    }
    return config;
});

// Add a response interceptor to handle expired tokens
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Check if we are already on login page to avoid infinite loop
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login?msg=Session expired. Please login again.';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
