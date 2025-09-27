require("dotenv").config();
const { Sequelize, DataTypes } = require("sequelize");
const bcrypt = require("bcrypt");

// Connect to DB
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false,
  }
);

// Import models
const UserModel = require("../models/user"); 
const CandidateModel = require("../models/candidate");
const BallotModel = require("../models/ballot");

// Initialize models
const User = UserModel(sequelize, DataTypes);
const Candidate = CandidateModel(sequelize, DataTypes);
const Ballot = BallotModel(sequelize, DataTypes);

async function seed() {
  try {
    await sequelize.sync({ force: true }); // drops & recreates tables

    // --- Admin ---
    //const adminPassword = await bcrypt.hash("admin123", 10);
    await User.create({
      studentNumber: "ADMIN001",
      email: "admin@test.com",
      name: "Administrator",
      passwordHash: "Mabuhay@Pilipinas",
      role: "admin",
      totpSecretEnc: null,
      approved: true,
    });

    // --- Sample Students ---
    //const studentPassword = await bcrypt.hash("student123", 10);

    const student1 = await User.create({
      studentNumber: "2025001",
      email: "student1@test.com",
      name: "John Doe",
      passwordHash: "studentPassword",
      role: "student",
      totpSecretEnc: null,
      approved: true,
    });

    const student2 = await User.create({
      studentNumber: "2025002",
      email: "student2@test.com",
      name: "Jane Smith",
      passwordHash: "studentPassword",
      role: "student",
      totpSecretEnc: null,
      approved: true,
    });

    // --- Sample Candidates ---
    const candidate1 = await Candidate.create({ name: "Alice", position: "President", approved: true });
    const candidate2 = await Candidate.create({ name: "Bob", position: "Vice President", approved: false });
    const candidate3 = await Candidate.create({ name: "Charlie", position: "Secretary", approved: true });

    // --- Sample Ballots (dummy encrypted fields) ---
    await Ballot.create({
      userId: student1.id,
      candidateId: candidate1.id,
      ciphertext: "dummy_ciphertext_1",
      iv: "dummy_iv_1",
      tag: "dummy_tag_1",
      wrappedKey: "dummy_wrappedKey_1",
      voteHash: "dummy_voteHash_1",
    });

    await Ballot.create({
      userId: student2.id,
      candidateId: candidate3.id,
      ciphertext: "dummy_ciphertext_2",
      iv: "dummy_iv_2",
      tag: "dummy_tag_2",
      wrappedKey: "dummy_wrappedKey_2",
      voteHash: "dummy_voteHash_2",
    });

    console.log("✅ Seeding completed with users, candidates, and ballots");
    process.exit(0);

  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

seed();
