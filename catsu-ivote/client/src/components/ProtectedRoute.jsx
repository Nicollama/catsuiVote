// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { jwtDecode } from "jwt-decode";

export default function ProtectedRoute({ roles, children }) {
  const { user } = useContext(AuthContext);

  let authUser = user;
  const token = localStorage.getItem("token");

  if (!authUser && localStorage.getItem("user")) {
    try {
      authUser = JSON.parse(localStorage.getItem("user"));
    } catch {
      authUser = null;
    }
  }

  if (!token) return <Navigate to="/login" replace />;

  try {
    const decoded = jwtDecode(token);
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return <Navigate to="/login" replace />;
    }
  } catch {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(authUser?.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
