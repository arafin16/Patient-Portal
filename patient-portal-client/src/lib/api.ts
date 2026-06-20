import axios from 'axios';

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// কোনো রিকোয়েস্ট পাঠানোর আগে এটি চেক করবে ব্রাউজারে টোকেন আছে কিনা, থাকলে তা হেদারে যুক্ত করবে
API.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default API;