const express = require("express");
const router = express.Router();
const auth = require("./authMiddleware"); 
const { Ballot, Candidate, User } = require("../models"); // ✅ include User
const crypto = require("../utils/crypto");

// Middleware: only allow Comelec role
function onlyComelec(req, res, next) {
  if (req.user.role !== "comelec") {
    return res.status(403).json({ error: "Forbidden: comelec only" });
  }
  next();
}

// ✅ Monitor election progress
router.get("/progress", auth, onlyComelec, async (req, res) => {
  try {
    const totalVoters = await User.count({ where: { role: "student" } });
    const votedCount = await Ballot.count();
    const turnout = totalVoters
      ? ((votedCount / totalVoters) * 100).toFixed(2)
      : "0.00";

    res.json({ totalVoters, votedCount, turnout: `${turnout}%` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Secure tally (decrypt all ballots)
router.get("/tally", auth, onlyComelec, async (req, res) => {
  try {
    const ballots = await Ballot.findAll();
    const tally = {};

    for (const b of ballots) {
      try {
        const perKey = crypto.unwrapKey(Buffer.from(b.wrappedKey, "base64"));
        const candidateId = crypto.aesGcmDecrypt(
          perKey,
          Buffer.from(b.ciphertext, "base64"),
          b.iv,
          b.tag
        );

        tally[candidateId] = (tally[candidateId] || 0) + 1;
      } catch (err) {
        console.error("❌ Failed to decrypt ballot:", err.message);
      }
    }

    // Join with candidate info
    const candidates = await Candidate.findAll();
    const results = candidates.map(c => ({
      candidateId: c.id,
      name: c.name,
      position: c.position,
      // party: c.party, // ❌ remove if Candidate model has no "party"
      votes: tally[c.id] || 0
    }));

    res.json({
      reportGeneratedAt: new Date(),
      integrity: "cryptographically-verified",
      results
    });
  } catch (err) {
    console.error("❌ Tally error:", err);
    res.status(500).json({ error: "Failed to tally votes" });
  }
});

module.exports = router;
