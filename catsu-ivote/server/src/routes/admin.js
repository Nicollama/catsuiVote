// src/routes/admin.js
const express = require("express");
const router = express.Router();
const { User, Candidate, ElectionState, SystemLog, Ballot } = require("../models");
const auth = require("./authMiddleware");

// ----------------------
// Middleware: Only admins
// ----------------------
const onlyAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admins only" });
  }
  next();
};

// ----------------------
// Reject candidate with mandatory comment
// ----------------------
router.post("/reject-candidate/:id", auth, onlyAdmin, async (req, res) => {
  try {
    const candidateId = req.params.id;
    const { comment } = req.body;

    if (!comment?.trim()) {
      return res.status(400).json({ error: "Comment is required when rejecting a candidate." });
    }

    const candidate = await Candidate.findByPk(candidateId);
    if (!candidate) return res.status(404).json({ error: "Candidate not found." });

    candidate.approved = false;
    candidate.rejectionComment = comment;
    await candidate.save();

    await SystemLog.create({ action: `Rejected candidate ${candidate.name}`, adminId: req.user.id });

    res.json({ success: true, message: "Candidate rejected with comment." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error." });
  }
});

// ----------------------
// Voting summary
// ----------------------
router.get("/voting-summary", auth, onlyAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "studentNumber"],
      where: { approved: true, role: "student" },
      order: [["studentNumber", "ASC"]],
    });

    const ballots = await Ballot.findAll({ attributes: ["userId"] });
    const votedUserIds = new Set(ballots.map((b) => b.userId));

    const students = users.map((u) => ({
      id: u.id,
      studentNumber: u.studentNumber || "N/A",
      name: u.name,
      status: votedUserIds.has(u.id) ? "Voted" : "Not Voted",
    }));

    const totalVoted = students.filter((s) => s.status === "Voted").length;

    res.json({ totalStudents: students.length, totalVoted, students });
  } catch (err) {
    console.error("Voting summary error:", err);
    res.status(500).json({ error: "Failed to fetch voting summary" });
  }
});

// ----------------------
// Voting state
// ----------------------
router.get("/voting-state", auth, onlyAdmin, async (req, res) => {
  try {
    const state = await ElectionState.findOne({ order: [["createdAt", "DESC"]] });
    if (!state) return res.json({ votingOpen: false, state: null });

    const now = new Date();
    const isOpen = now >= state.startsAt && now <= state.endsAt;

    res.json({
      votingOpen: isOpen,
      state: {
        ...state.dataValues,
        startsAt: state.startsAt,
        endsAt: state.endsAt,
      },
    });
  } catch (err) {
    console.error("Fetch voting state error:", err);
    res.status(500).json({ error: "Failed to fetch voting state" });
  }
});

// ----------------------
// Set voting period
// ----------------------
// ----------------------
// POST /admin/set-voting-period
router.post("/set-voting-period", auth, onlyAdmin, async (req, res) => {
  try {
    const { electionId, startsAt, endsAt } = req.body;
    if (!electionId || !startsAt || !endsAt) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (new Date(startsAt) >= new Date(endsAt)) {
      return res.status(400).json({ error: "Start date must be before end date" });
    }

    const election = await ElectionState.findByPk(electionId);
    if (!election) return res.status(404).json({ error: "Election not found" });

    election.startsAt = new Date(startsAt);
    election.endsAt = new Date(endsAt);
    await election.save();

    res.json({ message: "Voting period updated", startsAt: election.startsAt, endsAt: election.endsAt });
  } catch (err) {
    console.error("❌ /set-voting-period error:", err);
    res.status(500).json({ error: "Failed to update voting period" });
  }
});


// ----------------------
// Get all elections
// ----------------------
router.get("/elections", auth, onlyAdmin, async (req, res) => {
  try {
    const elections = await ElectionState.findAll({ order: [["startsAt", "DESC"]] });
    res.json(elections);
  } catch (err) {
    console.error("Fetch elections error:", err);
    res.status(500).json({ error: "Failed to fetch elections" });
  }
});

// ----------------------
// Pending users
// ----------------------
router.get("/pending-users", auth, onlyAdmin, async (req, res) => {
  try {
    const users = await User.findAll({ where: { approved: false } });
    res.json(users);
  } catch (err) {
    console.error("Fetch pending users error:", err);
    res.status(500).json({ error: "Failed to fetch pending users" });
  }
});

router.post("/approve-user/:id", auth, onlyAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.approved) return res.status(400).json({ error: "User is already approved" });

    user.approved = true;
    await user.save();

    await SystemLog.create({ action: `Approved user ${user.name}`, adminId: req.user.id });

    res.json({ message: `User ${user.name} approved` });
  } catch (err) {
    console.error("Approve user error:", err);
    res.status(500).json({ error: "Failed to approve user" });
  }
});

router.post("/reject-user/:id", auth, onlyAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.approved) return res.status(400).json({ error: "Cannot reject an approved user" });

    await user.destroy();
    await SystemLog.create({ action: `Rejected user ${user.name}`, adminId: req.user.id });

    res.json({ message: `User ${user.name} rejected` });
  } catch (err) {
    console.error("Reject user error:", err);
    res.status(500).json({ error: "Failed to reject user" });
  }
});

// ----------------------
// Candidate approval
// ----------------------
router.post("/approve-candidate/:id", auth, onlyAdmin, async (req, res) => {
  try {
    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) return res.status(404).json({ error: "Candidate not found" });
    if (candidate.approved) return res.status(400).json({ error: "Candidate is already approved" });

    candidate.approved = true;
    await candidate.save();

    await SystemLog.create({ action: `Approved candidate ${candidate.name}`, adminId: req.user.id });

    res.json({ message: `Candidate ${candidate.name} approved` });
  } catch (err) {
    console.error("Approve candidate error:", err);
    res.status(500).json({ error: "Failed to approve candidate" });
  }
});

router.delete("/candidates/:id", auth, onlyAdmin, async (req, res) => {
  try {
    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) return res.status(404).json({ error: "Candidate not found" });

    const ballots = await Ballot.count({ where: { candidateId: candidate.id } });
    if (ballots > 0) return res.status(400).json({ error: "Cannot delete candidate with existing votes" });

    await candidate.destroy();
    await SystemLog.create({ action: `Deleted candidate ${candidate.name}`, adminId: req.user.id });

    res.json({ message: `Candidate ${candidate.name} deleted successfully` });
  } catch (err) {
    console.error("Delete candidate error:", err);
    res.status(500).json({ error: "Failed to delete candidate" });
  }
});

// ----------------------
// System logs
// ----------------------
router.get("/logs", auth, onlyAdmin, async (req, res) => {
  try {
    const logs = await SystemLog.findAll({ order: [["createdAt", "DESC"]] });
    res.json(logs);
  } catch (err) {
    console.error("Fetch logs error:", err);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// ----------------------
// Generate report
// ----------------------
router.post("/generate-report", auth, onlyAdmin, async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalCandidates = await Candidate.count();
    const totalVotes = await Ballot.count();
    const votingState = await ElectionState.findOne({ order: [["createdAt", "DESC"]] });

    await SystemLog.create({ action: "Generated report", adminId: req.user.id });

    res.json({
      hash: `Users:${totalUsers}-Candidates:${totalCandidates}-Votes:${totalVotes}-VotingOpen:${votingState?.votingOpen}`,
    });
  } catch (err) {
    console.error("Generate report error:", err);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// ----------------------
// Fetch all candidates
// ----------------------
router.get("/candidates", auth, onlyAdmin, async (req, res) => {
  try {
    const candidates = await Candidate.findAll({
      attributes: ["id", "name", "party", "position", "approved", "documents"],
      order: [["position", "ASC"], ["name", "ASC"]],
    });
    res.json(candidates);
  } catch (err) {
    console.error("Fetch candidates error:", err);
    res.status(500).json({ error: "Failed to fetch candidates" });
  }
});

// ----------------------
// Election results
// ----------------------
router.get("/results", auth, onlyAdmin, async (req, res) => {
  try {
    const { electionId } = req.query;
    if (!electionId) return res.status(400).json({ error: "electionId is required" });

    const electionIdInt = parseInt(electionId, 10);
    if (isNaN(electionIdInt)) return res.status(400).json({ error: "Invalid electionId" });

    const election = await ElectionState.findByPk(electionIdInt);
    if (!election) return res.status(404).json({ error: "Election not found" });

    const ballots = await Ballot.findAll({
      where: { electionId: electionIdInt },
      include: [{ model: Candidate, attributes: ["id", "name", "position", "party"] }],
    });

    if (!ballots.length) return res.json({ positionResults: {}, winners: {} });

    const voteCounts = {};
    ballots.forEach((b) => {
      const candidate = b.Candidate;
      if (!candidate) return;
      if (!voteCounts[candidate.id]) voteCounts[candidate.id] = { ...candidate.dataValues, votes: 0 };
      voteCounts[candidate.id].votes += 1;
    });

    const positionResults = {};
    Object.values(voteCounts).forEach((c) => {
      if (!positionResults[c.position]) positionResults[c.position] = [];
      positionResults[c.position].push(c);
    });

    const winners = {};
    Object.keys(positionResults).forEach((position) => {
      const sorted = positionResults[position].sort((a, b) => b.votes - a.votes);
      winners[position] = sorted[0];
      positionResults[position] = sorted.map((c, i) => ({
        id: c.id,
        name: c.name,
        party: c.party,
        votes: c.votes,
        status: i === 0 ? "Winner" : "—",
      }));
    });

    res.json({ positionResults, winners });
  } catch (err) {
    console.error("Election results error:", err);
    res.status(500).json({ error: "Failed to fetch election results" });
  }
});

module.exports = router;
