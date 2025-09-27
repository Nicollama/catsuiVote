// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // ---------------------------
  // Load user & token at start
  // ---------------------------
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");

    if (savedUser && savedToken) {
      try {
        const decoded = jwtDecode(savedToken);

        if (decoded.exp * 1000 > Date.now()) {
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
        } else {
          // Token expired → try refresh
          refreshToken();
        }
      } catch (err) {
        console.error("Invalid token:", err);
        logout();
      }
    }
  }, []);

  // ---------------------------
  // Refresh token
  // ---------------------------
  const refreshToken = useCallback(async () => {
    try {
      const res = await axios.post("/api/auth/refresh", {}, { withCredentials: true });
      const newToken = res.data.token;

      if (newToken) {
        const decoded = jwtDecode(newToken);
        setToken(newToken);
        localStorage.setItem("token", newToken);

        if (!user) {
          // if user is not set, reload it from token payload
          setUser({
            id: decoded.userId,
            role: decoded.role,
          });
          localStorage.setItem("user", JSON.stringify({
            id: decoded.userId,
            role: decoded.role,
          }));
        }
      }
    } catch (err) {
      console.error("Refresh token failed:", err);
      logout();
    }
  }, [user]);

  // ---------------------------
  // Auto refresh before expiry
  // ---------------------------
  useEffect(() => {
    if (!token) return;

    const decoded = jwtDecode(token);
    const expiresAt = decoded.exp * 1000;
    const timeout = expiresAt - Date.now() - 60_000; // refresh 1 min before expiry

    if (timeout > 0) {
      const id = setTimeout(() => refreshToken(), timeout);
      return () => clearTimeout(id);
    }
  }, [token, refreshToken]);

  // ---------------------------
  // Login
  // ---------------------------
  const login = (user, token) => {
    setToken(token);
    setUser(user);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  };

  // ---------------------------
  // Logout
  // ---------------------------
  const logout = async () => {
    try {
      await axios.post("/api/auth/logout", {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout failed:", err);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};
