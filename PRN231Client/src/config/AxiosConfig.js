// src/config/AxiosConfig.js
import axios from "axios";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
console.log(API_URL);
const http = axios.create({
    baseURL: API_URL,
    withCredentials: true
});

// Request interceptor
http.interceptors.request.use((config) => {
    // Get token from localStorage (client-side only)
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Response interceptor with token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

const handleLogout = () => {
    // Clear auth data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');

    // Show toast notification
    if (typeof window !== 'undefined') {
        // Set a flag to show the message after redirect
        sessionStorage.setItem('auth_error', 'Your session has expired. Please log in again.');

        // Redirect to login
        window.location.href = '/login';
    }
};

http.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        

        // Check if error is 401 and not "Invalid credentials" message
        const isInvalidCredentials = error.response?.data?.message === "Invalid username or password";
        console.log(isInvalidCredentials);

        // Only attempt refresh i   f it's a 401 error, not for invalid credentials, and not already retrying
        if (error.response?.status === 401 && !isInvalidCredentials && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(token => {
                        originalRequest.headers['Authorization'] = 'Bearer ' + token;
                        return http(originalRequest);
                    })
                    .catch(err => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                const request = {userId: localStorage.getItem('userId'), refreshToken};
                const response = await http.post('/api/auth/refresh', request);

                if (response.data.data) {
                    const { accessToken, refreshToken: newRefreshToken } = response.data.data;
                    localStorage.setItem('accessToken', accessToken);
                    localStorage.setItem('refreshToken', newRefreshToken);

                    http.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken;
                    originalRequest.headers['Authorization'] = 'Bearer ' + accessToken;

                    processQueue(null, accessToken);
                    return http(originalRequest);
                } else {
                    throw new Error('Refresh token failed');
                }
            } catch (err) {
                processQueue(err, null);
                handleLogout();
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default http;