// routes/studentRoutes.js
const express = require("express");
const router = express.Router();
const { Candidate, User, Vote, Election } = require("../models"); // Make sure Election exists
const auth = require("./authMiddleware");

// -------------------- Voting Summary --------------------
router.get("/voting-summary", auth, async (req, res) => {
  try {
    // Get all approved students
    const students = await User.findAll({ where: { role: "student", approved: true } });

    // Get all votes
    const votes = await Vote.findAll({ attributes: ["userId"] });
    const votedIds = new Set(votes.map(v => v.userId));

    // Map students with status
    const studentStatus = students.map(s => ({
      id: s.id,
      name: s.name,
      studentNumber: s.studentNumber,
      status: votedIds.has(s.id) ? "Voted" : "Not Voted",
    }));

    res.json({ totalVoted: votes.length, students: studentStatus });
  } catch (err) {
    console.error("Voting Summary Error:", err);
    res.status(500).json({ error: "Server error fetching voting summary", details: err.message });
  }
});

// -------------------- My Candidacy --------------------
router.get("/my-candidacy", auth, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ error: "Forbidden: students only" });
    }

    const candidate = await Candidate.findOne({ where: { userId: req.user.id } });
    if (!candidate) return res.status(404).json({ status: "none" });

    res.json({
      id: candidate.id,
      position: candidate.position,
      approved: candidate.approved,
      rejectionComment: candidate.rejectionComment,
    });
  } catch (err) {
    console.error("My Candidacy Error:", err);
    res.status(500).json({ error: "Server error fetching candidacy", details: err.message });
  }
});

// -------------------- Elections --------------------
router.get("/elections", auth, async (req, res) => {
  try {
    const elections = await Election.findAll({
      order: [["startsAt", "DESC"]]
    });

    res.json(elections);
  } catch (err) {
    console.error("Elections Error:", err);
    res.status(500).json({ error: "Server error fetching elections", details: err.message });
  }
});

module.exports = router;
