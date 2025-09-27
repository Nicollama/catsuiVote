import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TOTPSetup from "./pages/TOTPSetup";
import Candidates from "./pages/Candidates";
import CastVote from "./pages/CastVote";
import PendingApproval from "./pages/PendingApproval";
import AdminDashboard from "./pages/AdminDashboard";
import ComelecDashboard from "./pages/ComelecDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import ThankYou from "./pages/ThankYou";
import StudentDashboard from "./pages/StudentDashboard";
import StudentCandidates from "./pages/StudentCandidates";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/totp-setup" element={<TOTPSetup />} />

        {/* Student routes */}
        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute roles={["student"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidates"
          element={
            <ProtectedRoute roles={["student"]}>
              <Candidates />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vote"
          element={
            <ProtectedRoute roles={["student"]}>
              <CastVote />
            </ProtectedRoute>
          }
        />
        <Route
          path="/thank-you"
          element={
            <ProtectedRoute roles={["student"]}>
              <ThankYou />
            </ProtectedRoute>
          }
        />
        <Route
          path="/register-candidacy"
          element={
            <ProtectedRoute roles={["student"]}>
              <StudentCandidates />
            </ProtectedRoute>
  }
/>

        {/* Pending Approval (maybe public) */}
        <Route path="/pending-approval" element={<PendingApproval />} />

        {/* Admin routes */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Comelec routes */}
        <Route
          path="/comelec-dashboard"
          element={
            <ProtectedRoute roles={["comelec"]}>
              <ComelecDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
