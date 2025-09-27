// scripts/seedAdmin.js
const { User } = require("../models");

async function createAdmin() {
  try {
    // Check if admin already exists
    const existing = await User.findOne({ where: { email: "admin@example.com" } });
    if (existing) {
      console.log("✅ Admin already exists:", existing.email);
      return process.exit(0);
    }

    const admin = await User.create({
      name: "Super Admin",
      email: "admin@testing.com",
      passwordHash: "Mabuhay@Pilipinas", // ⚠️ raw password (no hashing)
      role: "admin",
      approved: true,
      studentNumber: "ADMIN001",
    });

    console.log("✅ Admin created:", admin.email);
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to create admin:", err);
    process.exit(1);
  }
}

createAdmin();
