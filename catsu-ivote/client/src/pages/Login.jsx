// src/pages/Login.jsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { AuthContext } from "../contexts/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [form, setForm] = useState({ email: "", password: "", totp: "", userId: null });
  const [otpRequired, setOtpRequired] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      // 🔐 OTP Verification
      if (otpRequired) {
        const res = await api.post("/auth/login/verify", {
          userId: form.userId,
          totp: form.totp,
        });
        const { token, user } = res.data;

        login(user, token);


        // Debugging
        console.log("✅ Saved user:", user);
        console.log("✅ Saved token:", token);
        console.log("✅ LocalStorage user:", localStorage.getItem("user"));
        console.log("✅ LocalStorage token:", localStorage.getItem("token"));

        if (user.role === "admin") navigate("/admin-dashboard");
        else if (user.role === "comelec") navigate("/comelec-dashboard");
        else navigate("/student-dashboard");
        return;
      }

      // 🔑 Normal login
      const res = await api.post("/auth/login", {
        email: form.email,
        password: form.password,
      });

      console.log("🔎 Login response:", res.data);

      if (res.data.otpRequired) {
        setOtpRequired(true);
        setForm({ ...form, userId: res.data.userId });
        setMessage("Please enter the 6-digit OTP from your Authenticator app.");
        return;
      }

      const { token, user } = res.data;
      if (!token || !user) {
        setMessage("Invalid response from server");
        return;
      }

      login(user, token);


      // Debugging
      console.log("✅ Saved user:", user);
      console.log("✅ Saved token:", token);
      console.log("✅ LocalStorage user:", localStorage.getItem("user"));
      console.log("✅ LocalStorage token:", localStorage.getItem("token"));

      if (user.role === "admin") navigate("/admin-dashboard");
      else if (user.role === "comelec") navigate("/comelec-dashboard");
      else navigate("/student-dashboard");

    } catch (err) {
      setMessage(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      backgroundColor: "#f4f6f8",
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{
        width: "400px",
        padding: "40px",
        borderRadius: "12px",
        backgroundColor: "#fff",
        boxShadow: "0 6px 20px rgba(0,0,0,0.1)"
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <img src="/logo.png" alt="iVote Logo" style={{ height: "60px" }} />
          <h2 style={{ marginTop: "10px", color: "#007bff" }}>Welcome Back</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {!otpRequired && (
            <>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                required
                style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "1rem" }}
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
                style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "1rem" }}
              />
            </>
          )}

          {otpRequired && (
            <input
              type="text"
              name="totp"
              placeholder="Enter 6-digit OTP"
              value={form.totp}
              onChange={handleChange}
              required
              style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "1rem" }}
            />
          )}

          <button
            type="submit"
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#007bff",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "1rem",
              cursor: "pointer",
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#0056b3"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#007bff"}
          >
            {otpRequired ? "Verify OTP" : "Login"}
          </button>
        </form>

        {/* Messages */}
        {message && (
          <p style={{ marginTop: "20px", textAlign: "center", color: otpRequired ? "green" : "red" }}>
            {message}
          </p>
        )}

        {!otpRequired && (
          <p style={{ marginTop: "20px", textAlign: "center", color: "#555" }}>
            Don't have an account?{" "}
            <button
              type="button"
              style={{ color: "#007bff", fontWeight: "bold", cursor: "pointer", background: "none", border: "none", padding: 0 }}
              onClick={() => navigate("/register")}
            >
              Register
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
