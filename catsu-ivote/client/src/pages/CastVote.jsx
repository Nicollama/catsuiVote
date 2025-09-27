// CastVote.jsx remains the same as previously provided
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import { Dialog } from "@headlessui/react";

export default function CastVote() {
  const location = useLocation();
  const navigate = useNavigate();
  const candidate = location.state?.candidate;

  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [approved, setApproved] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkVoteStatus = async () => {
      if (!candidate) {
        setLoadingStatus(false);
        return;
      }
      try {
        const res = await api.get(`/vote/status?position=${candidate.position}`);
        setAlreadyVoted(res.data.hasVoted);
        setApproved(res.data.approved);
      } catch (err) {
        console.error("Failed to check vote status:", err);
        setError("Unable to check your voting status.");
      } finally {
        setLoadingStatus(false);
      }
    };
    checkVoteStatus();
  }, [candidate]);

  const handleConfirmVote = async () => {
    setLoading(true);
    setError("");
    try {
      await api.post("/vote", { candidateId: candidate.id });
      setSuccess(true);
      setAlreadyVoted(true);
      setTimeout(() => navigate("/thank-you"), 2000);
    } catch (err) {
      const msg = err.response?.data?.error;
      setError(msg || "Failed to cast vote. Please try again.");
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  if (loadingStatus) return <p className="text-center mt-10">Checking your voting status...</p>;
  if (!candidate) return <p className="text-center mt-10">No candidate selected</p>;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      {alreadyVoted ? (
        <h2 className="text-xl font-semibold text-center text-green-600">
          You have already voted for the position of {candidate.position} ✅
        </h2>
      ) : !approved ? (
        <h2 className="text-xl font-semibold text-center text-yellow-600">
          Your registration is pending approval. You cannot vote yet.
        </h2>
      ) : (
        <>
          <h2 className="text-xl font-semibold mb-4">Confirm Your Vote</h2>
          <p className="mb-6">
            Candidate: <span className="font-bold">{candidate.name}</span> ({candidate.position})
          </p>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            onClick={() => setConfirmOpen(true)}
            disabled={loading}
          >
            Cast Vote
          </button>

          <Dialog
            open={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            className="relative z-50"
          >
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
              <div className="bg-white p-6 rounded shadow-lg max-w-sm">
                <Dialog.Title className="text-lg font-bold mb-2">Confirm Vote</Dialog.Title>
                <Dialog.Description className="mb-4">
                  Are you sure you want to vote for <span className="font-semibold">{candidate.name}</span>?
                </Dialog.Description>
                <div className="flex justify-end gap-3">
                  <button className="px-4 py-2 bg-gray-300 rounded" onClick={() => setConfirmOpen(false)}>Cancel</button>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                    onClick={handleConfirmVote}
                    disabled={loading}
                  >
                    {loading ? "Submitting..." : "Confirm"}
                  </button>
                </div>
              </div>
            </div>
          </Dialog>
        </>
      )}

      {error && <p className="mt-4 text-red-600 font-semibold text-center">{error}</p>}
      {success && <p className="mt-4 text-green-600 font-semibold text-center">Vote cast successfully! Redirecting...</p>}
    </div>
  );
}