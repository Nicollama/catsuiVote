// src/pages/StudentCandidates.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function StudentCandidates() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", party: "", position: "" });
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // ✅ Merge new files with existing ones
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };

  // Remove a file from the list
  const removeFile = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!form.name || !form.position) {
      setMessage("Name and position are required");
      return;
    }

    if (files.length === 0) {
      setMessage("Please upload at least one form");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("party", form.party);
      formData.append("position", form.position);

      // Append all selected files
      files.forEach((file) => formData.append("documents", file));

      const res = await api.post("/candidates", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage(res.data.message);
      setForm({ name: "", party: "", position: "" });
      setFiles([]);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "Submission failed");
    }
  };

  const downloadButtonStyle = {
    display: "inline-block",
    margin: "5px 5px 0 0",
    padding: "10px 20px",
    backgroundColor: "#007bff",
    color: "#fff",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "bold",
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f6f8", padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <header style={{ marginBottom: "30px", textAlign: "center" }}>
        <img src="/logo.png" alt="iVote Logo" style={{ height: "50px", marginBottom: "15px" }} />
        <h1 style={{ fontSize: "2rem", color: "#007bff", margin: 0 }}>Register Candidacy</h1>
        <p style={{ color: "#555" }}>Download, fill out the forms, and upload them below</p>
      </header>

      {/* Downloadable Forms */}
      <div style={{
        maxWidth: "500px",
        margin: "0 auto 20px auto",
        padding: "15px 25px",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        textAlign: "center"
      }}>
        <p style={{ marginBottom: "10px" }}>Download the official candidacy registration forms:</p>
        <a href="/forms/Certificate-of-Candidacy.docx" download style={downloadButtonStyle}>Certificate of Candidacy</a>
        <a href="/forms/Certificate-of-Recommendation" download style={downloadButtonStyle}>Certificate of Recommendation</a>
        <a href="/forms/COMELEC-FORM-NO 1" download style={downloadButtonStyle}>Comelec form No 1.</a>
      </div>

      {/* Submission Form */}
      <form onSubmit={handleSubmit} style={{
        maxWidth: "500px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "15px",
        background: "#fff",
        padding: "25px",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
      }}>
        <input
          name="name"
          placeholder="Candidate Name"
          value={form.name}
          onChange={handleChange}
          required
          style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
        />
        <input
          name="party"
          placeholder="Party (optional)"
          value={form.party}
          onChange={handleChange}
          style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
        />
        <input
          name="position"
          placeholder="Position"
          value={form.position}
          onChange={handleChange}
          required
          style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
        />
        
        <input
          type="file"
          name="documents"
          multiple
          onChange={handleFileChange}
        />

        {/* Display selected files */}
        {files.length > 0 && (
          <div style={{ marginTop: "10px" }}>
            <p style={{ marginBottom: "5px", fontWeight: "bold" }}>Selected files:</p>
            {files.map((file, index) => (
              <div key={index} style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                <span>{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  style={{ color: "red", cursor: "pointer", background: "none", border: "none" }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <button type="submit" style={{
          padding: "12px",
          borderRadius: "8px",
          border: "none",
          backgroundColor: "#007bff",
          color: "#fff",
          fontWeight: "bold",
          cursor: "pointer"
        }}>Submit</button>

        {message && <p style={{ textAlign: "center", color: message.toLowerCase().includes("failed") ? "red" : "green", marginTop: "10px" }}>{message}</p>}
      </form>
    </div>
  );
}
