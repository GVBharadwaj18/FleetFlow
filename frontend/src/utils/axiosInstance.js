// utils/axiosInstance.js
import axios from "axios";

const getBaseURL = () => {
  if (import.meta.env.VITE_BACKEND_URL) return import.meta.env.VITE_BACKEND_URL;
  return "http://localhost:5000";
};

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  withCredentials: false,
  timeout: 8000,
});

axiosInstance.interceptors.request.use((config) => {
  const auth = localStorage.getItem("auth");
  const token = auth ? JSON.parse(auth).token : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
