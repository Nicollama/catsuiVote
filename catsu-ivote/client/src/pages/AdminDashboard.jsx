// src/pages/AdminDashboard.jsx
import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { AuthContext } from "../contexts/AuthContext";

// Card Component
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

export default function AdminDashboard() {
  const [votingOpen, setVotingOpen] = useState(false);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [pendingUsers, setPendingUsers] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [results, setResults] = useState({});
  const [winners, setWinners] = useState({});
  const [message, setMessage] = useState("");
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("VotingStatus");

  const [votingSummary, setVotingSummary] = useState({ totalVoted: 0, students: [] });
  const [reportElection, setReportElection] = useState(null);
  const [reportPosition, setReportPosition] = useState("");
  const [filteredResults, setFilteredResults] = useState({});
  const [reportHash, setReportHash] = useState("");

  const { logout, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleApiError = (err) => {
    console.error(err);
    if (err.response?.status === 401) {
      logout();
      navigate("/login");
    } else {
      setMessage(err.response?.data?.error || err.message);
    }
  };

  // ---------------- Helper ----------------
  const formatForInput = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const pad = (n) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleElectionChange = async (id) => {
    setSelectedElection(id);
    await fetchResults(id);
    await fetchVotingState();
  };

  // ---------------- API Calls ----------------
  const fetchVotingState = async () => {
    if (!selectedElection) return;
    try {
      const res = await api.get("/admin/voting-state", { params: { electionId: selectedElection } });
      const startInput = formatForInput(res.data.startsAt);
      const endInput = formatForInput(res.data.endsAt);
      setStartsAt(startInput);
      setEndsAt(endInput);

      const now = new Date();
      const votingOpen = startInput && endInput && now >= new Date(res.data.startsAt) && now <= new Date(res.data.endsAt);
      setVotingOpen(votingOpen);
    } catch (err) {
      handleApiError(err);
    }
  };

  const fetchPendingUsers = async () => {
    try {
      const res = await api.get("/admin/pending-users");
      setPendingUsers(res.data);
    } catch (err) {
      handleApiError(err);
    }
  };

  const fetchCandidates = async () => {
    try {
      const res = await api.get("/admin/candidates");
      setCandidates(res.data);
    } catch (err) {
      handleApiError(err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get("/admin/logs");
      setLogs(res.data);
    } catch (err) {
      handleApiError(err);
    }
  };

  const fetchElections = async () => {
    try {
      const res = await api.get("/admin/elections");
      const sorted = res.data.sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt));
      setElections(sorted);
      if (sorted.length > 0) {
        const firstElection = sorted[0];
        setSelectedElection(firstElection.id);
        setReportElection(firstElection.id);
        fetchResults(firstElection.id);
        fetchVotingState();
      }
    } catch (err) {
      handleApiError(err);
    }
  };

  const fetchResults = async (electionId) => {
    try {
      const res = await api.get("/admin/results", { params: { electionId } });
      setResults(res.data.positionResults || {});
      setWinners(res.data.winners || {});
      setFilteredResults(res.data.positionResults || {});
    } catch (err) {
      handleApiError(err);
    }
  };

  const fetchVotingSummary = async () => {
    try {
      const res = await api.get("/admin/voting-summary");
      setVotingSummary(res.data);
    } catch (err) {
      handleApiError(err);
    }
  };

  // ---------------- Voting Period Actions ----------------
  const saveVotingPeriod = async () => {
    if (!startsAt || !endsAt) return setMessage("Please set both start and end date/time.");
  
    try {
      const startDate = new Date(startsAt);
      const endDate = new Date(endsAt);
      if (startDate > endDate) return setMessage("End date must be after start date.");
  
      const res = await api.post("/admin/set-voting-period", {
        electionId: selectedElection,
        startsAt, // send as local string
        endsAt,
      });
  
      const now = new Date();
      const votingOpenNow = now >= new Date(res.data.startsAt) && now <= new Date(res.data.endsAt);
  
      setVotingOpen(votingOpen);
      setMessage(`Voting period updated. Voting is now ${votingOpen? "OPEN" : "CLOSED"}`);
    } catch (err) {
      handleApiError(err);
    }
  };
  
  
  // ---------------- Reports Functions ----------------
  const applyReportFilters = () => {
    let filtered = { ...results };
    if (reportPosition) filtered = { [reportPosition]: filtered[reportPosition] || [] };
    setFilteredResults(filtered);
  };

  const resetReportFilters = () => {
    setReportElection(selectedElection);
    setReportPosition("");
    setFilteredResults(results);
  };

  const exportExcel = () => { alert("Export Excel functionality triggered"); };
  const exportPDF = () => { alert("Export PDF functionality triggered"); };
  const printReport = () => { window.print(); };
  const generateReport = async () => { alert("Generate report functionality triggered"); };

  // ---------------- Candidate / User Actions ----------------
  const approveCandidate = async (id) => { try { await api.post(`/admin/approve-candidate/${id}`); fetchCandidates(); } catch (err) { handleApiError(err); } };
  const approveUser = async (id) => { try { await api.post(`/admin/approve-user/${id}`); fetchPendingUsers(); } catch (err) { handleApiError(err); } };
  const rejectUser = async (id) => { try { await api.post(`/admin/reject-user/${id}`); fetchPendingUsers(); } catch (err) { handleApiError(err); } };

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    const init = async () => {
      await fetchPendingUsers();
      await fetchCandidates();
      await fetchLogs();
      await fetchElections();
      await fetchVotingSummary();
    };
    init();
  }, [token]);

  // ---------------- Render Sections ----------------
  const renderContent = () => {
    switch (activeTab) {
      case "VotingStatus":
        return (
          <Card title="Voting Status">
            <p style={{ fontWeight: "bold", color: votingOpen ? "green" : "red" }}>
              Voting is currently {votingOpen ? "OPEN" : "CLOSED"}
            </p>
            <div style={{ marginBottom: "10px" }}>
              <label>Start Date/Time: </label>
              <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} style={{ marginLeft: "5px" }} />
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label>End Date/Time: </label>
              <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} style={{ marginLeft: "5px" }} />
            </div>
            <button onClick={saveVotingPeriod} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: "#007bff", color: "#fff", cursor: "pointer", fontWeight: "bold" }}>Save Voting Period</button>
          </Card>
        );

      case "VotingSummary":
        return (
          <Card title="Voting Summary">
            <h3>Total Students Voted: {votingSummary.totalVoted}</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "15px" }}>
              <thead>
                <tr style={{ background: "#f1f1f1" }}>
                  <th style={{ padding: "8px", textAlign: "left" }}>Student Number</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Name</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {votingSummary.students.length > 0 ? votingSummary.students.map((s, i) => (
                  <tr key={i} style={{ borderTop: "1px solid #eee" }}>
                    <td style={{ padding: "8px" }}>{s.studentNumber}</td>
                    <td style={{ padding: "8px" }}>{s.name}</td>
                    <td style={{ padding: "8px", fontWeight: "bold", color: "green" }}>{s.status}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="3" style={{ padding: "10px", textAlign: "center", color: "#777" }}>No students have voted yet.</td></tr>
                )}
              </tbody>
            </table>
          </Card>
        );

      case "PendingUsers":
        return (
          <Card title="Pending Voter Registrations">
            {pendingUsers.length === 0 ? <p style={{ color: "#777", fontStyle: "italic" }}>No pending users.</p> :
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f1f1f1" }}>
                    <th style={{ padding: "8px", textAlign: "left" }}>Student #</th>
                    <th style={{ padding: "8px", textAlign: "left" }}>Name</th>
                    <th style={{ padding: "8px", textAlign: "left" }}>Email</th>
                    <th style={{ padding: "8px", textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map(u => (
                    <tr key={u.id} style={{ borderTop: "1px solid #eee" }}>
                      <td style={{ padding: "8px" }}>{u.studentNumber}</td>
                      <td style={{ padding: "8px" }}>{u.name}</td>
                      <td style={{ padding: "8px" }}>{u.email}</td>
                      <td style={{ padding: "8px", textAlign: "center" }}>
                        <button onClick={() => approveUser(u.id)} style={{ marginRight: "5px", background: "#28a745", color: "#fff", border: "none", borderRadius: "6px", padding: "5px 10px", cursor: "pointer" }}>Approve</button>
                        <button onClick={() => rejectUser(u.id)} style={{ background: "#dc3545", color: "#fff", border: "none", borderRadius: "6px", padding: "5px 10px", cursor: "pointer" }}>Reject</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>}
          </Card>
        );
        case "Candidates":
          return (
            <Card title="Candidates">
              {candidates.length === 0 ? (
                <p style={{ color: "#777", fontStyle: "italic" }}>No candidates registered.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f1f1f1" }}>
                      <th style={{ padding: "8px", textAlign: "left" }}>Name</th>
                      <th style={{ padding: "8px", textAlign: "left" }}>Position</th>
                      <th style={{ padding: "8px", textAlign: "left" }}>Party</th>
                      <th style={{ padding: "8px", textAlign: "left" }}>Forms</th>
                      <th style={{ padding: "8px", textAlign: "center" }}>Status</th>
                      <th style={{ padding: "8px", textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map(c => (
                      <tr
                        key={c.id}
                        style={{
                          borderTop: "1px solid #eee",
                          backgroundColor: c.approved
                            ? "#e6ffe6"
                            : (!c.documents || c.documents.length === 0)
                            ? "#ffe6e6"
                            : "#fff",
                        }}
                      >
                        <td style={{ padding: "8px" }}>{c.name}</td>
                        <td style={{ padding: "8px" }}>{c.position}</td>
                        <td style={{ padding: "8px" }}>{c.party || "-"}</td>
                        <td style={{ padding: "8px" }}>
                          {c.documents && c.documents.length > 0 ? (
                            c.documents.map((doc, index) => (
                              <div key={index}>
                                <a
                                  href={`${process.env.REACT_APP_SERVER_URL || "http://localhost:4000"}/uploads/candidate-docs/${doc}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: "#007bff", textDecoration: "underline" }}
                                >
                                  Form {index + 1}
                                </a>
                              </div>
                            ))
                          ) : (
                            <span style={{ color: "#dc3545", fontStyle: "italic", fontWeight: "bold" }}>
                              No form submitted
                            </span>
                          )}
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            textAlign: "center",
                            fontWeight: "bold",
                            color: c.approved ? "green" : "orange",
                          }}
                        >
                          {c.approved ? "Approved" : "Pending"}
                        </td>
                        <td style={{ padding: "8px", textAlign: "center" }}>
                          <button
                            onClick={() => approveCandidate(c.id)}
                            disabled={c.approved || !c.documents || c.documents.length === 0}
                            style={{
                              marginRight: "5px",
                              background:
                                c.approved || !c.documents || c.documents.length === 0
                                  ? "#6c757d"
                                  : "#28a745",
                              color: "#fff",
                              border: "none",
                              borderRadius: "6px",
                              padding: "5px 10px",
                              cursor:
                                c.approved || !c.documents || c.documents.length === 0
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >
                            {c.approved
                              ? "Approved"
                              : !c.documents || c.documents.length === 0
                              ? "No Form"
                              : "Approve"}
                          </button>
        
                          {/* Reject with comment */}
                          <button
                            onClick={async () => {
                              const comment = prompt("Enter rejection reason for the student:");
                              if (!comment || comment.trim() === "") return alert("Comment is required");
                              try {
                                await api.post(`/admin/reject-candidate/${c.id}`, { comment });
                                fetchCandidates();
                                alert("Candidate rejected and comment sent to student");
                              } catch (err) {
                                handleApiError(err);
                              }
                            }}
                            style={{
                              background: "#dc3545",
                              color: "#fff",
                              border: "none",
                              borderRadius: "6px",
                              padding: "5px 10px",
                              cursor: "pointer",
                            }}
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          );
        
        
        
          case "Results":
            return (
              <Card title="Election Results">
                {elections.length === 0 ? (
                  <p style={{ color: "#777", fontStyle: "italic" }}>No elections available.</p>
                ) : (
                  <>
                    {/* Election selector */}
                    <div style={{ marginBottom: "15px" }}>
                      <label htmlFor="resultsElection" style={{ marginRight: "5px", fontWeight: "bold" }}>Select Election:</label>
                      <select
                        id="resultsElection"
                        value={selectedElection || ""}
                        onChange={(e) => handleElectionChange(parseInt(e.target.value))}
                        style={{ padding: "5px 10px", borderRadius: "6px" }}
                      >
                        {elections.map(el => {
                          const start = el.startsAt ? new Date(el.startsAt).toLocaleString() : "N/A";
                          const end = el.endsAt ? new Date(el.endsAt).toLocaleString() : "Closed";
                          return <option key={el.id} value={el.id}>{el.name} ({start} - {end})</option>
                        })}
                      </select>
                    </div>
          
                    {/* Position-wise results */}
                    {Object.keys(results).length === 0 ? (
                      <p style={{ color: "#777", fontStyle: "italic" }}>No results available.</p>
                    ) : (
                      Object.keys(results).map(pos => (
                        <div key={pos} style={{ marginBottom: "20px" }}>
                          <h3 style={{ marginBottom: "8px" }}>{pos}</h3>
                          <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                              <tr style={{ background: "#f1f1f1" }}>
                                <th style={{ padding: "8px", textAlign: "left" }}>Candidate Name</th>
                                <th style={{ padding: "8px", textAlign: "left" }}>Party</th>
                                <th style={{ padding: "8px", textAlign: "center" }}>Votes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {results[pos].map(c => (
                                <tr key={c.id} style={{ borderTop: "1px solid #eee" }}>
                                  <td style={{ padding: "8px" }}>{c.name}</td>
                                  <td style={{ padding: "8px" }}>{c.party || "-"}</td>
                                  <td style={{ padding: "8px", textAlign: "center" }}>{c.votes}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {/* Winner display */}
                          {winners[pos] && (
                            <p style={{ marginTop: "5px", fontWeight: "bold", color: "green" }}>
                              Winner: {winners[pos].name} ({winners[pos].party || "-"})
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </>
                )}
              </Card>
            );
          
      case "Reports":
        return (
          <Card title="Reports">
            {/* Filters */}
            <div style={{ display: "flex", gap: "15px", marginBottom: "15px", flexWrap: "wrap" }}>
              <div>
                <label htmlFor="reportElection" style={{ marginRight: "5px", fontWeight: "bold" }}>Election:</label>
                <select id="reportElection" value={reportElection || ""} onChange={(e) => { setReportElection(parseInt(e.target.value)); handleElectionChange(parseInt(e.target.value)); }} style={{ padding: "5px 10px", borderRadius: "6px" }}>
                  {elections.map(el => {
                    const start = el.startsAt ? new Date(el.startsAt).toLocaleString() : "N/A";
                    const end = el.endsAt ? new Date(el.endsAt).toLocaleString() : "Closed";
                    return <option key={el.id} value={el.id}>{el.name} ({start} - {end})</option>
                  })}
                </select>
              </div>
              <div>
                <label htmlFor="reportPosition" style={{ marginRight: "5px", fontWeight: "bold" }}>Position:</label>
                <select id="reportPosition" value={reportPosition} onChange={(e) => setReportPosition(e.target.value)} style={{ padding: "5px 10px", borderRadius: "6px" }}>
                  <option value="">All Positions</option>
                  {Object.keys(results).map(pos => <option key={pos} value={pos}>{pos}</option>)}
                </select>
              </div>
              <button onClick={applyReportFilters} style={{ padding: "8px 15px", borderRadius: "6px", border: "none", background: "#007bff", color: "#fff", cursor: "pointer", fontWeight: "bold" }}>Apply Filters</button>
              <button onClick={resetReportFilters} style={{ padding: "8px 15px", borderRadius: "6px", border: "none", background: "#6c757d", color: "#fff", cursor: "pointer", fontWeight: "bold" }}>Reset</button>
            </div>

            {/* Export / Print */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
              <button onClick={exportExcel} style={{ padding: "8px 15px", borderRadius: "6px", border: "none", background: "#28a745", color: "#fff", cursor: "pointer", fontWeight: "bold" }}>Export Excel</button>
              <button onClick={exportPDF} style={{ padding: "8px 15px", borderRadius: "6px", border: "none", background: "#dc3545", color: "#fff", cursor: "pointer", fontWeight: "bold" }}>Export PDF</button>
              <button onClick={printReport} style={{ padding: "8px 15px", borderRadius: "6px", border: "none", background: "#007bff", color: "#fff", cursor: "pointer", fontWeight: "bold" }}>Print</button>
            </div>

            {/* Filtered results */}
            {Object.keys(filteredResults).length === 0 ? <p style={{ color: "#777", fontStyle: "italic" }}>No results available.</p> :
              Object.keys(filteredResults).map(pos => (
                <div key={pos} style={{ marginBottom: "20px" }}>
                  <h3 style={{ marginBottom: "8px" }}>{pos}</h3>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f1f1f1" }}>
                        <th style={{ padding: "8px", textAlign: "left" }}>Name</th>
                        <th style={{ padding: "8px", textAlign: "left" }}>Party</th>
                        <th style={{ padding: "8px", textAlign: "center" }}>Votes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResults[pos].map(c => (
                        <tr key={c.id} style={{ borderTop: "1px solid #eee" }}>
                          <td style={{ padding: "8px" }}>{c.name}</td>
                          <td style={{ padding: "8px" }}>{c.party || "-"}</td>
                          <td style={{ padding: "8px", textAlign: "center" }}>{c.votes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            }

            {/* Final report */}
            <button onClick={generateReport} style={{ padding: "10px 18px", borderRadius:"8px", border:"none", backgroundColor:"#007bff", color:"#fff", cursor:"pointer", fontWeight:"bold" }}>Generate Final Report</button>
            {reportHash && <p style={{ marginTop:"10px", fontSize:"0.9rem", color:"#555" }}>Cryptographic Hash: <span style={{ fontFamily:"monospace" }}>{reportHash}</span></p>}
          </Card>
        );
      default: return null;
    }
  };

  return (
    <div style={{ display: "flex", minHeight:"100vh", fontFamily:"Arial, sans-serif", backgroundColor:"#f4f6f8" }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen?"220px":"60px",
        transition:"width 0.3s",
        background:"#343a40",
        color:"#fff",
        paddingTop:"20px",
        display:"flex",
        flexDirection:"column"
      }}>
        <button onClick={()=>setSidebarOpen(!sidebarOpen)} style={{ background:"none", border:"none", color:"#fff", cursor:"pointer", padding:"10px", fontSize:"1.2rem", marginBottom:"20px" }}>☰</button>
        <nav style={{ display:"flex", flexDirection:"column", gap:"10px", paddingLeft: sidebarOpen?"20px":"0" }}>
          <span style={{ cursor:"pointer", fontWeight: activeTab==="VotingSummary"?"bold":"normal" }} onClick={()=>setActiveTab("VotingSummary")}>📋 Voting Summary</span>
          <span style={{ cursor:"pointer", fontWeight: activeTab==="VotingStatus"?"bold":"normal" }} onClick={()=>setActiveTab("VotingStatus")}>🏠 Voting Status</span>
          <span style={{ cursor:"pointer", fontWeight: activeTab==="PendingUsers"?"bold":"normal" }} onClick={()=>setActiveTab("PendingUsers")}>🧑 Pending Users</span>
          <span style={{ cursor:"pointer", fontWeight: activeTab==="Candidates"?"bold":"normal" }} onClick={()=>setActiveTab("Candidates")}>👤 Candidates</span>
          <span style={{ cursor:"pointer", fontWeight: activeTab==="Results"?"bold":"normal" }} onClick={()=>setActiveTab("Results")}>📊 Results</span>
          <span style={{ cursor:"pointer", fontWeight: activeTab==="Reports"?"bold":"normal" }} onClick={()=>setActiveTab("Reports")}>📄 Reports</span>
          <button onClick={()=>{logout();navigate("/login")}} style={{ marginTop:"auto", padding:"10px", borderRadius:"6px", border:"none", background:"#dc3545", color:"#fff", cursor:"pointer", fontWeight:"bold", marginLeft: sidebarOpen?"20px":"0" }}>Logout</button>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flexGrow:1, padding:"30px", maxWidth:"1000px", margin:"0 auto" }}>
        {renderContent()}
        {message && <p style={{ textAlign:"center", color: message.toLowerCase().includes("fail")?"red":"green", fontWeight:"bold", marginTop:"20px" }}>{message}</p>}
      </main>
    </div>
  );
}