// src/pages/StudentDashboard.jsx
import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { AuthContext } from "../contexts/AuthContext";
import StudentCandidates from "./StudentCandidates";

// Reusable Card Component
const Card = ({ title, children }) => (
  <div
    style={{
      background: "#fff",
      padding: "20px",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      marginBottom: "20px",
    }}
  >
    <h2 style={{ marginBottom: "15px", color: "#007bff" }}>{title}</h2>
    {children}
  </div>
);

export default function StudentDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("Candidates");

  const [candidates, setCandidates] = useState([]);
  const [results, setResults] = useState({});
  const [winners, setWinners] = useState({});
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [myCandidacy, setMyCandidacy] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const statusStyle = (bgColor, textColor) => ({
    backgroundColor: bgColor,
    color: textColor,
    padding: "4px 10px",
    borderRadius: "6px",
    fontWeight: "bold",
    fontSize: "0.9rem",
  });

  const handleApiError = (err) => {
    console.error(err);
    if (err.response?.status === 401) {
      logout();
      navigate("/login");
    }
  };

  // -----------------------------
  // Fetch approved candidates for a specific election
  // -----------------------------
 // Fetch approved candidates for a specific election
const fetchCandidates = async (electionId) => {
  if (!electionId) return;
  try {
    const res = await api.get("/candidates", { params: { electionId } });
    // Only approved candidates should be returned from the API
    setCandidates(res.data || []);
  } catch (err) {
    handleApiError(err);
  }
};

  // -----------------------------
  // Fetch student’s own candidacy for a specific election
  // -----------------------------
  const fetchMyCandidacy = async (electionId) => {
    if (!electionId) return;
    try {
      const res = await api.get("/candidates/my-candidacy", { params: { electionId } });
      if (res.data) {
        let status = "pending";
        if (res.data.approved === true) status = "approved";
        else if (res.data.approved === false) status = "rejected";

        setMyCandidacy({
          ...res.data,
          status,
          rejectionComment: res.data.rejectionComment || null,
        });
      } else {
        setMyCandidacy(null);
      }
    } catch (err) {
      if (err.response?.status === 404) setMyCandidacy(null);
      else handleApiError(err);
    }
  };

  // -----------------------------
  // Fetch elections
  // -----------------------------
  const fetchElections = async () => {
    try {
      const res = await api.get("/elections");
      const sorted = res.data
        .map((e) => ({
          ...e,
          startsAt: new Date(e.startsAt),
          isVotingOpen: e.votingOpen === true,
        }))
        .sort((a, b) => b.startsAt - a.startsAt);

      setElections(sorted);

      if (sorted.length > 0) {
        const firstElection = sorted[0];
        setSelectedElection(firstElection.id);

        // Fetch candidates and my candidacy for this election
        fetchCandidates(firstElection.id);
        fetchMyCandidacy(firstElection.id);

        // Fetch results if voting is closed
        if (!firstElection.isVotingOpen) fetchResults(firstElection.id);
        else {
          setResults({});
          setWinners({});
        }
      }
    } catch (err) {
      handleApiError(err);
    }
  };

  // -----------------------------
  // Fetch results
  // -----------------------------
  const fetchResults = async (electionId) => {
    if (!electionId) return;
    try {
      const res = await api.get("/results", { params: { electionId } });
      setResults(res.data.positionResults || {});
      setWinners(res.data.winners || {});
      setSelectedElection(electionId);
    } catch (err) {
      handleApiError(err);
    }
  };

  // -----------------------------
  // Initial load
  // -----------------------------
  useEffect(() => {
    fetchElections();
  }, []);

  // -----------------------------
  // Render content
  // -----------------------------
  const renderContent = () => {
    const activeElection = elections.find((el) => el.id === selectedElection);

    switch (activeTab) {
      case "Candidates":
        if (candidates.length === 0)
          return (
            <Card title="Approved Candidates">
              <p>No candidates yet.</p>
            </Card>
          );

        return (
          <Card title="Approved Candidates">
            {activeElection?.isVotingOpen ? (
              <p>Voting is currently open. Check back after it ends.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f1f1f1" }}>
                    <th style={{ padding: "8px" }}>Name</th>
                    <th style={{ padding: "8px" }}>Position</th>
                    <th style={{ padding: "8px" }}>Party</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c) => (
                    <tr key={c.id} style={{ borderTop: "1px solid #eee" }}>
                      <td style={{ padding: "8px" }}>{c.name}</td>
                      <td style={{ padding: "8px" }}>{c.position}</td>
                      <td style={{ padding: "8px" }}>{c.party || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        );

      case "Results":
        if (!activeElection)
          return (
            <Card title="Election Results">
              <p>No active election found.</p>
            </Card>
          );

        if (activeElection.isVotingOpen)
          return (
            <Card title="Election Results">
              <p>Results will be available after the election ends.</p>
            </Card>
          );

        if (Object.keys(results).length === 0)
          return (
            <Card title="Election Results">
              <p>No results yet for this election.</p>
            </Card>
          );

        return (
          <Card title="Election Results">
            <select
              value={selectedElection || ""}
              onChange={(e) => {
                const id = parseInt(e.target.value);
                setSelectedElection(id);
                fetchResults(id);
                fetchCandidates(id);
                fetchMyCandidacy(id);
              }}
              style={{ marginBottom: "15px", padding: "6px", borderRadius: "6px" }}
            >
              {elections.map((el) => (
                <option key={el.id} value={el.id}>
                  {el.name || `Election ${el.id}`}
                </option>
              ))}
            </select>

            {Object.keys(results).map((pos) => (
              <div key={pos} style={{ marginBottom: "20px" }}>
                <h3>{pos}</h3>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f1f1f1" }}>
                      <th style={{ padding: "8px" }}>Candidate</th>
                      <th style={{ padding: "8px" }}>Party</th>
                      <th style={{ padding: "8px", textAlign: "center" }}>Votes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results[pos]?.map((c) => (
                      <tr key={c.id}>
                        <td style={{ padding: "8px" }}>{c.name}</td>
                        <td style={{ padding: "8px" }}>{c.party || "-"}</td>
                        <td style={{ padding: "8px", textAlign: "center" }}>{c.votes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {winners[pos] && (
                  <p style={{ fontWeight: "bold", color: "green" }}>
                    Winner: {winners[pos].name} ({winners[pos].party || "-"})
                  </p>
                )}
              </div>
            ))}
          </Card>
        );

        case "RegisterCandidacy":
          return (
            <Card title="My Candidacy Status">
              {/* Show form if no candidacy or position is missing */}
              {!myCandidacy || !myCandidacy.position ? (
                <StudentCandidates
                  electionId={selectedElection}
                  onSubmitSuccess={async () => {
                    await fetchMyCandidacy(selectedElection);
                    setShowForm(false);
                    setActiveTab("RegisterCandidacy");
                  }}
                />
              ) : (
                <>
                  <p>
                    <strong>Position:</strong> {myCandidacy.position} <br />
                    <strong>Status:</strong>{" "}
                    {myCandidacy.status === "pending" && (
                      <span style={statusStyle("#ffc107", "#000")}>Pending</span>
                    )}
                    {myCandidacy.status === "approved" && (
                      <span style={statusStyle("#28a745", "#fff")}>Approved</span>
                    )}
                    {myCandidacy.status === "rejected" && (
                      <span style={statusStyle("#dc3545", "#fff")}>Rejected</span>
                    )}
                  </p>
        
                  {/* Show rejection comment if available */}
                  {myCandidacy.status === "rejected" && myCandidacy.rejectionComment && (
                    <p style={{ color: "#dc3545", marginTop: "10px" }}>
                      <strong>Admin Comments:</strong> {myCandidacy.rejectionComment}
                    </p>
                  )}
        
                  {/* Reapply button */}
                  {myCandidacy.status === "rejected" && !showForm && (
                    <button
                      onClick={() => setShowForm(true)}
                      style={{
                        marginTop: "10px",
                        padding: "8px 16px",
                        background: "#ffc107",
                        color: "#000",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      Reapply
                    </button>
                  )}
        
                  {/* Show form if reapplying */}
                  {showForm && (
                    <StudentCandidates
                      electionId={selectedElection}
                      onSubmitSuccess={async () => {
                        await fetchMyCandidacy(selectedElection);
                        setShowForm(false);
                        setActiveTab("RegisterCandidacy");
                      }}
                    />
                  )}
                </>
              )}
            </Card>
          );
        
        
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
        background: "#f4f6f8",
      }}
    >
      <aside
        style={{
          width: sidebarOpen ? "220px" : "60px",
          background: "#343a40",
          color: "#fff",
          transition: "width 0.3s",
          paddingTop: "20px",
        }}
      >
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            fontSize: "1.5rem",
            cursor: "pointer",
            marginLeft: sidebarOpen ? "180px" : "10px",
          }}
        >
          ☰
        </button>
        <nav
          style={{
            marginTop: "30px",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            paddingLeft: sidebarOpen ? "20px" : "5px",
          }}
        >
          <span style={{ cursor: "pointer" }} onClick={() => setActiveTab("Candidates")}>
            👤 Candidates
          </span>
          <span style={{ cursor: "pointer" }} onClick={() => setActiveTab("Results")}>
            📊 Results
          </span>
          <span
            style={{ cursor: "pointer" }}
            onClick={() => setActiveTab("RegisterCandidacy")}
          >
            📝 Register Candidacy
          </span>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            style={{
              marginTop: "auto",
              background: "#dc3545",
              color: "#fff",
              border: "none",
              padding: "10px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Logout
          </button>
        </nav>
      </aside>

      <main style={{ flexGrow: 1, padding: "30px", maxWidth: "1000px", margin: "0 auto" }}>
        {renderContent()}
      </main>
    </div>
  );
}
