// src/api.js
import axios from "axios";
import { logout } from "./contexts/AuthContext"; // optional: if you want auto-logout on 401

const api = axios.create({
  baseURL: "http://localhost:4000/api",
});

// Add token to every request if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Optional: Auto-logout if token is invalid/expired
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token invalid or expired
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login"; // force redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;
