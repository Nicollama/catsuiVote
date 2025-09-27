// src/routes/candidate.js
const express = require("express");
const router = express.Router();
const { Candidate } = require("../models");
const auth = require("./authMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ----------------------------
// Multer setup for file uploads
// ----------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/candidate-docs");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage });
const BASE_URL = process.env.SERVER_URL || "http://localhost:4000";

// ----------------------------
// Helper: Compute candidate status
// ----------------------------
function computeStatus(candidate) {
  if (candidate.approved === true) return { status: "approved", approved: true };
  if (candidate.approved === false && candidate.rejectionComment) return { status: "rejected", approved: false };
  return { status: "pending", approved: null };
}

// ----------------------------
// Student: Submit candidacy
// ----------------------------
router.post("/", auth, upload.array("documents", 10), async (req, res) => {
  try {
    if (!req.user || req.user.role !== "student") {
      return res.status(403).json({ error: "Forbidden: students only" });
    }

    const { name, party, position, electionId } = req.body;
    if (!name || !position || !electionId) {
      return res.status(400).json({ error: "Name, position, and electionId are required" });
    }

    const documents = req.files.map((file) => file.filename);

    const candidate = await Candidate.create({
      userId: req.user.id,
      electionId,
      name: name.trim(),
      party: party?.trim() || null,
      position: position.trim(),
      approved: false, // pending by default
      rejectionComment: null,
      documents,
    });

    res.json({ message: "Candidate submitted, pending approval", candidate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ----------------------------
// Student: Reapply candidacy
// ----------------------------
router.post("/reapply", auth, async (req, res) => {
  try {
    const { id } = req.body;
    const candidate = await Candidate.findByPk(id);

    if (!candidate) return res.status(404).json({ message: "Candidacy not found." });

    candidate.approved = null; // pending
    candidate.rejectionComment = null;
    await candidate.save();

    res.status(200).json({ message: "Reapplied successfully", candidate });
  } catch (err) {
    console.error("Error in /candidates/reapply:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
});

// ----------------------------
// Student: Get own candidacy status (final safe version)
// ----------------------------
router.get("/my-candidacy", auth, async (req, res) => {
  try {
    // 1️⃣ Check authentication
    if (!req.user) {
      console.warn("Unauthorized access attempt to /my-candidacy");
      return res.status(403).json({ error: "Forbidden: user not authenticated" });
    }

    if (req.user.role !== "student") {
      console.warn(`User ${req.user.id} with role ${req.user.role} tried to access /my-candidacy`);
      return res.status(403).json({ error: "Forbidden: students only" });
    }

    // 2️⃣ Validate electionId query
    let { electionId } = req.query;
    if (!electionId) return res.status(400).json({ error: "Missing electionId query parameter" });

    electionId = parseInt(electionId);
    if (isNaN(electionId)) return res.status(400).json({ error: "Invalid electionId" });

    // 3️⃣ Fetch candidate
    const candidate = await Candidate.findOne({
      where: { userId: req.user.id, electionId },
    });

    if (!candidate) return res.json({ status: "none" });

    // 4️⃣ Map documents safely
    const documents = Array.isArray(candidate.documents)
      ? candidate.documents.map((f) => `${BASE_URL}/uploads/candidate-docs/${f}`)
      : [];

    // 5️⃣ Compute status
    const { status, approved } = computeStatus(candidate);

    // 6️⃣ Return response
    res.json({
      status,
      approved,
      rejectionComment: candidate.rejectionComment || null,
      position: candidate.position || null,
      party: candidate.party || null,
      documents,
    });
  } catch (err) {
    console.error("❌ Error in /my-candidacy:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});


// ----------------------------
// Admin: List pending candidates for a specific election
// ----------------------------
router.get("/pending", auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") return res.status(403).json({ error: "Forbidden: admin only" });

    const { electionId } = req.query;
    if (!electionId) return res.status(400).json({ error: "Missing electionId query parameter" });

    const pending = await Candidate.findAll({
      where: { approved: [false, null], electionId },
      attributes: ["id", "name", "position", "party", "approved", "documents", "rejectionComment"],
      order: [["createdAt", "ASC"]],
    });

    const mapped = pending.map((c) => ({
      ...c.dataValues,
      documents: c.documents?.map((f) => `${BASE_URL}/uploads/candidate-docs/${f}`) || [],
    }));

    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ----------------------------
// Admin: Approve candidate
// ----------------------------
router.put("/:id/approve", auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") return res.status(403).json({ error: "Forbidden: admin only" });

    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) return res.status(404).json({ error: "Candidate not found" });

    candidate.approved = true;
    candidate.rejectionComment = null;
    await candidate.save();

    res.json({ message: "Candidate approved ✅", candidate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ----------------------------
// Admin: Reject candidate
// ----------------------------
router.put("/:id/reject", auth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") return res.status(403).json({ error: "Forbidden: admin only" });

    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) return res.status(404).json({ error: "Candidate not found" });

    const { comment } = req.body;
    if (!comment || comment.trim() === "") return res.status(400).json({ error: "Comment is required when rejecting a candidate." });

    candidate.approved = false;
    candidate.rejectionComment = comment;
    await candidate.save();

    res.json({ message: "Candidate rejected ❌ with comment", candidate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
