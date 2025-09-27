const express = require("express");
const router = express.Router();
const { Ballot, Candidate, User, ElectionState } = require("../models");
const auth = require("./authMiddleware");
const nodeCrypto = require("crypto");
const { aesGcmEncrypt, wrapKey } = require("../utils/crypto");

// --------------------
// Cast a vote
// --------------------
router.post("/", auth, async (req, res) => {
  try {
    const { candidateId } = req.body;
    const userId = req.user.id;

    if (!candidateId) {
      return res.status(400).json({ error: "Candidate ID is required" });
    }

    // Fetch user and verify eligibility
    const user = await User.findByPk(userId);
    if (!user) return res.status(403).json({ error: "You are not registered to vote." });
    if (!user.approved) return res.status(403).json({ error: "Your registration is pending approval." });
    if (user.role !== "student") return res.status(403).json({ error: "Only students can vote." });

    // Find active election
    const election = await ElectionState.findOne({ where: { votingOpen: true } });
    if (!election) {
      return res.status(403).json({ error: "Voting is not open yet." });
    }

    // Verify candidate exists and is approved
    const candidate = await Candidate.findByPk(candidateId);
    if (!candidate) return res.status(404).json({ error: "Candidate not found." });
    if (!candidate.approved) return res.status(403).json({ error: "Candidate is not approved." });

    // Check if user already voted for this position in this election
    const alreadyVoted = await Ballot.findOne({
      where: { userId, electionId: election.id },
      include: [{
        model: Candidate,
        where: { position: candidate.position },
        required: true,
      }],
    });

    if (alreadyVoted) {
      return res.status(400).json({ error: `You already voted for ${candidate.position}.` });
    }

    // Encrypt vote
    const perKey = nodeCrypto.randomBytes(32);
    const { ciphertext, iv, tag } = aesGcmEncrypt(perKey, String(candidateId));
    const wrappedKey = wrapKey(perKey);

    const voteHash = nodeCrypto.createHash("sha256").update(ciphertext).digest("hex");

    const ballot = await Ballot.create({
      userId,
      candidateId,
      electionId: election.id, // ✅ link ballot to election
      ciphertext: ciphertext.toString("base64"),
      iv,
      tag,
      wrappedKey: wrappedKey.toString("base64"),
      voteHash,
    });

    res.json({ message: "Vote cast successfully ✅", ballotId: ballot.id });

  } catch (err) {
    console.error("❌ Vote error:", err.message);
    console.error(err.stack);
    res.status(500).json({ error: err.message });
  }
});

// --------------------
// Check voting status
// --------------------
router.get("/status", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { position } = req.query;

    const user = await User.findByPk(userId);
    if (!user) return res.status(403).json({ error: "You are not registered to vote." });

    // Find active election
    const election = await ElectionState.findOne({ where: { votingOpen: true } });

    let hasVoted = false;
    if (election) {
      if (position) {
        const existingVote = await Ballot.findOne({
          where: { userId, electionId: election.id },
          include: [{ model: Candidate, where: { position }, required: true }],
        });
        hasVoted = !!existingVote;
      } else {
        const anyVote = await Ballot.findOne({ where: { userId, electionId: election.id } });
        hasVoted = !!anyVote;
      }
    }

    res.json({
      hasVoted,
      approved: user.approved,
      role: user.role,
      votingOpen: election ? election.votingOpen : false,
      electionId: election ? election.id : null,
    });

  } catch (err) {
    console.error("❌ Status check error:", err.message);
    console.error(err.stack);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
