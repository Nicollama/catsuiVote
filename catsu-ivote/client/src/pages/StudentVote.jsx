import { useEffect, useState } from "react";
import api from "../api";
import LogoutButton from "../components/LogoutButton";

export default function StudentVote() {
  const [candidates, setCandidates] = useState([]);
  const [selectedVotes, setSelectedVotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const res = await api.get("/candidates");
        setCandidates(res.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load candidates");
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading candidates...</p>;
  if (error) return <p className="text-center mt-10 text-red-600">{error}</p>;

  // Group candidates by position
  const grouped = candidates.reduce((acc, c) => {
    if (!acc[c.position]) acc[c.position] = [];
    acc[c.position].push(c);
    return acc;
  }, {});

  const handleVote = (position, candidateId) => {
    setSelectedVotes((prev) => ({ ...prev, [position]: candidateId }));
  };

  const submitVotes = async () => {
    try {
      await api.post("/vote", { votes: selectedVotes });
      setSuccess("Your votes have been submitted successfully!");
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit votes");
      setSuccess("");
    }
  };

  return (
    <div className="p-6">
      {/* Header with Logout */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cast Your Vote</h1>
        <LogoutButton />
      </div>

      {success && <p className="text-green-600 mb-4">{success}</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {/* Voting Form */}
      {Object.keys(grouped).map((position) => (
        <section key={position} className="mb-8">
          <h2 className="text-xl font-semibold mb-3">{position}</h2>
          <ul className="space-y-2">
            {grouped[position].map((c) => (
              <li
                key={c.id}
                className={`p-3 border rounded cursor-pointer ${
                  selectedVotes[position] === c.id
                    ? "bg-blue-100 border-blue-500"
                    : "bg-white"
                }`}
                onClick={() => handleVote(position, c.id)}
              >
                <span className="font-bold">{c.name}</span>{" "}
                {c.party && <span className="italic">({c.party})</span>}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {/* Submit Button */}
      <button
        onClick={submitVotes}
        disabled={Object.keys(selectedVotes).length === 0}
        className="bg-green-500 text-white px-4 py-2 rounded mt-4 disabled:opacity-50"
      >
        Submit Votes
      </button>
    </div>
  );
}
