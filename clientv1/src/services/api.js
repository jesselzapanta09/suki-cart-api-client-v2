import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Accept': 'application/json',
    },
});

// Request interceptor to attach JWT token from localStorage
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // Set Content-Type to application/json only for non-FormData requests
        if (config.data && !(config.data instanceof FormData)) {
            config.headers['Content-Type'] = 'application/json';
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle errors and extract response data
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response) {
            const err = new Error(error.response.data?.message ?? 'Request failed');
            err.status = error.response.status;
            err.errors = error.response.data?.errors ?? {};
            err.data = error.response.data ?? {};
            return Promise.reject(err);
        }
        return Promise.reject(error);
    }
);

export default api;
