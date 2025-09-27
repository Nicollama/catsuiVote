// src/routes/auth.js
const express = require("express");
const router = express.Router();
const { User } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");

// ----------------------
// Register a student
// ----------------------
router.post("/register", async (req, res) => {
  try {
    const { studentNumber, email, name, password } = req.body;

    if (!studentNumber || !email || !name || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingEmail = await User.findOne({ where: { email: normalizedEmail } });
    if (existingEmail) return res.status(400).json({ error: "Email already registered" });

    // Check if studentNumber already exists
    const existingStudent = await User.findOne({ where: { studentNumber } });
    if (existingStudent) return res.status(400).json({ error: "Student number already exists" });

    // Create user
    const user = await User.create({
      studentNumber,
      email: normalizedEmail,
      name,
      passwordHash: password, // raw password, model hook hashes it
      role: "student",
      approved: false, // force pending state
    });

    // Generate TOTP secret for student
    const secret = speakeasy.generateSecret({ name: `iVote (${user.email})` });
    user.totpSecretEnc = secret.base32;   // ✅ save in totpSecretEnc
    await user.save();

    // Generate QR code for authenticator app
    const qrUrl = await qrcode.toDataURL(secret.otpauth_url);

    res.json({
      message: "Student registered ✅",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentNumber: user.studentNumber,
      },
      totpQr: qrUrl,
      totpSecretEnc: secret.base32, // show once for setup
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ----------------------
// Login (Step 1)
// ----------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid email or password" });

    // If student → ask for OTP
    if (user.role === "student") {
      return res.status(200).json({
        otpRequired: true,
        message: "TOTP required",
        userId: user.id
      });
    }

    // If admin/comelec → issue JWT directly
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || "dev_jwt",
      { expiresIn: "8h" }
    );

    res.json({
      otpRequired: false,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ----------------------
// Verify OTP (Step 2)
// ----------------------
router.post("/login/verify", async (req, res) => {
  try {
    const { userId, totp } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.status(401).json({ error: "User not found" });

    const verified = speakeasy.totp.verify({
      secret: user.totpSecretEnc,   // ✅ consistent
      encoding: "base32",
      token: totp,
      window: 1,
    });

    if (!verified) return res.status(401).json({ error: "Invalid TOTP code" });

    // Sign JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || "dev_jwt",
      { expiresIn: "8h" }
    );

    res.json({
      otpRequired: false,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentNumber: user.studentNumber || null,
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
