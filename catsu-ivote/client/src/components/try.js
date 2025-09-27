import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children, roles }) {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Block unapproved students
  if (user.role === "student" && !user.approved) {
    return <Navigate to="/pending-approval" />;
  }

  // Role-based check
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
}
