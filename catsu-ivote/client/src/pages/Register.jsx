import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ studentNumber: "", email: "", name: "", password: "" });
  const [qrUrl, setQrUrl] = useState(null);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setQrUrl(null);
    setUser(null);

    try {
      const res = await axios.post("http://localhost:4000/api/auth/register", form);
      setUser(res.data.user);
      setQrUrl(res.data.totpQr);
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "50px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ width: "400px", padding: "30px", border: "1px solid #ddd", borderRadius: "10px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
        <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#333" }}>Student Registration</h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <input type="text" name="studentNumber" placeholder="Student Number" value={form.studentNumber} onChange={handleChange} required style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} />
          <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} />
          <input type="text" name="name" placeholder="Name" value={form.name} onChange={handleChange} required style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} />
          <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} />
          <button type="submit" style={{ padding: "12px", borderRadius: "5px", border: "none", backgroundColor: "#007bff", color: "#fff", fontWeight: "bold", cursor: "pointer" }}>Register</button>
        </form>

        {message && <p style={{ marginTop: "20px", textAlign: "center", color: qrUrl ? "green" : "red" }}>{message}</p>}

        {qrUrl && (
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <p>Scan this QR code with your Authenticator app:</p>
            <img src={qrUrl} alt="TOTP QR Code" style={{ width: "200px", height: "200px" }} />
          </div>
        )}

        <p style={{ marginTop: "20px", textAlign: "center", color: "#555" }}>
          Already have an account?{" "}
          <button
            type="button"
            style={{ color: "#007bff", fontWeight: "bold", cursor: "pointer", background: "none", border: "none", padding: 0 }}
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}
