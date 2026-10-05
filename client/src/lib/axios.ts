import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Đã xảy ra lỗi khi gọi máy chủ.';
    console.error('[API Error]:', message);
    return Promise.reject(new Error(message));
  }
);

export default api;
