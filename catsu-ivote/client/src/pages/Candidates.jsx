// src/pages/Candidates.jsx
import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { AuthContext } from "../contexts/AuthContext";

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const res = await api.get("/candidates"); // fetch approved candidates
        setCandidates(res.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load candidates");
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, []);

  if (loading) return <p style={{ textAlign: "center", marginTop: "50px" }}>Loading candidates...</p>;
  if (error) return <p style={{ textAlign: "center", marginTop: "50px", color: "red" }}>{error}</p>;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f6f8", padding: "40px", fontFamily: "Arial, sans-serif" }}>
      
      {/* Header */}
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "30px",
        backgroundColor: "#fff",
        padding: "15px 25px",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <img src="/logo.png" alt="iVote Logo" style={{ height: "50px" }} />
          <h1 style={{ fontSize: "1.8rem", color: "#007bff", margin: 0 }}>Candidates</h1>
        </div>
        <button
          onClick={() => { logout(); navigate("/login"); }}
          style={{
            padding: "8px 16px",
            backgroundColor: "#ff4d4f",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "background 0.2s"
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "#d9363e"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "#ff4d4f"}
        >
          Logout
        </button>
      </header>

      {/* Candidate Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "25px"
      }}>
        {candidates.map((c) => (
          <div
            key={c.id}
            style={{
              padding: "25px",
              borderRadius: "12px",
              border: "1px solid #e0e6ed",
              background: "#fff",
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
              cursor: "pointer",
              transition: "all 0.2s ease-in-out",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div>
              <h2 style={{ fontSize: "1.25rem", color: "#007bff", marginBottom: "10px" }}>{c.name}</h2>
              <p style={{ fontSize: "0.95rem", color: "#555", lineHeight: "1.5", marginBottom: "5px" }}>{c.position}</p>
              {c.party && (
                <p style={{ fontSize: "0.9rem", color: "#888", fontStyle: "italic" }}>
                  Party: {c.party}
                </p>
              )}
            </div>
            <button
              onClick={() => navigate("/vote", { state: { candidate: c } })}
              style={{
                marginTop: "20px",
                padding: "10px",
                backgroundColor: "#007bff",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "background 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = "#0056b3"}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "#007bff"}
            >
              Vote
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
