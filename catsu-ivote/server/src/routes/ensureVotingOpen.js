// middleware/checkVotingOpen.js
const { ElectionState } = require("../models");

module.exports = async (req, res, next) => {
  try {
    const now = new Date();

    // Find an election where voting is open and current time is within start/end
    const election = await ElectionState.findOne({
      where: {
        votingOpen: true,
        startsAt: { [Op.lte]: now },
        endsAt: { [Op.gte]: now },
      },
      order: [["startsAt", "DESC"]],
    });

    if (!election) {
      return res.status(403).json({ error: "Voting is currently closed ❌" });
    }

    // Attach election info to request for later use
    req.election = election;
    next();
  } catch (err) {
    console.error("Voting check error:", err);
    res.status(500).json({ error: "Error checking election state" });
  }
};
