// src/services/api.js
import axios from "axios";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true
});

// Request interceptor
api.interceptors.request.use((config) => {
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

api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't tried to refresh the token yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(token => {
                        originalRequest.headers['Authorization'] = 'Bearer ' + token;
                        return api(originalRequest);
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

                const request = {userId : localStorage.getItem('userId'), refreshToken : refreshToken};
                const response = await api.post('/auth/refresh', { request });

                if (response.data.data) {
                    const { accessToken , refreshToken: newRefreshToken } = response.data.data;
                    localStorage.setItem('accessToken', accessToken);
                    localStorage.setItem('refreshToken', newRefreshToken);

                    api.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken;
                    originalRequest.headers['Authorization'] = 'Bearer ' + accessToken;

                    processQueue(null, token);
                    return api(originalRequest);
                } else {
                    throw new Error('Refresh token failed');
                }
            } catch (err) {
                processQueue(err, null);
                // Clear auth data and redirect to login
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');

                // In client components this works, in server it won't
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;