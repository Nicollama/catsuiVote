const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const { ElectionState, Candidate, Vote, User } = require("../models");
const auth = require("./authMiddleware");

// ----------------------------
// List all elections (admin/students)
// ----------------------------
router.get("/elections", auth, async (req, res) => {
  try {
    const elections = await ElectionState.findAll({ order: [["startsAt", "DESC"]], raw: true });
    const now = new Date();

    const formattedElections = elections.map(el => ({
      ...el,
      votingOpen: el.startsAt <= now && el.endsAt >= now
    }));

    res.json(formattedElections);
  } catch (err) {
    console.error("❌ /elections error:", err);
    res.status(500).json({ error: "Failed to fetch elections" });
  }
});

// ----------------------------
// Approved candidates (students only)
// ----------------------------
router.get("/candidates", auth, async (req, res) => {
  try {
    const now = new Date();
    const openElection = await ElectionState.findOne({
      where: { startsAt: { [Op.lte]: now }, endsAt: { [Op.gte]: now } }
    });

    if (!openElection) return res.json([]);

    const candidates = await Candidate.findAll({
      where: { electionId: openElection.id },
      attributes: ["id", "name", "position", "party", "approved", "documents"],
      raw: true
    });

    res.json(candidates);
  } catch (err) {
    console.error("❌ /candidates error:", err);
    res.status(500).json({ error: "Failed to fetch candidates" });
  }
});

// ----------------------------
// Results for a given election
// ----------------------------

// GET /results
router.get("/results", async (req, res) => {
    try {
      const electionId = req.query.electionId;
  
      // 1️⃣ Find the specified election, or active one if no ID
      let election;
      if (electionId) {
        election = await ElectionState.findByPk(electionId);
      } else {
        election = await ElectionState.findOne({
          where: {
            startsAt: { [Op.lte]: new Date() },
            endsAt: { [Op.gte]: new Date() },
          },
          order: [["startsAt", "DESC"]],
        });
      }
  
      if (!election) {
        return res.json({ candidates: [] }); // no election => empty list
      }
  
      // 2️⃣ Fetch approved candidates for that election
      const candidates = await Candidate.findAndCountAll({
        where: {
          electionId: election.id,
          approved: true,
        },
        order: [["position", "ASC"], ["name", "ASC"]],
      });
  
      res.json({
        electionId: election.id,
        electionStartsAt: election.startsAt,
        electionEndsAt: election.endsAt,
        total: candidates.count,
        candidates: candidates.rows,
      });
    } catch (err) {
      console.error("❌ /results error:", err);
      res.status(500).json({ error: "Something went wrong" });
    }
  });

// ----------------------------
// Voting summary
// ----------------------------
router.get("/voting-summary", auth, async (req, res) => {
  try {
    const students = await User.findAll({
      where: { role: "student" },
      attributes: ["id", "name", "studentNumber"],
      raw: true
    });

    const votes = await Vote.findAll({ attributes: ["userId"], raw: true });
    const votedStudentIds = votes.map(v => v.userId);

    const studentsWithStatus = students.map(s => ({
      ...s,
      status: votedStudentIds.includes(s.id) ? "Voted" : "Not Voted"
    }));

    res.json({ totalVoted: votes.length, students: studentsWithStatus });
  } catch (err) {
    console.error("❌ /voting-summary error:", err);
    res.status(500).json({ error: "Failed to fetch voting summary" });
  }
});

module.exports = router;
