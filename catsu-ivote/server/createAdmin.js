// createAdmin.js
require("dotenv").config();
const { User, sequelize } = require("./src/models");

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected...");

    const adminEmail = "admin@ivote.com";
    const existing = await User.findOne({ where: { email: adminEmail } });

    if (existing) {
      console.log("⚠️ Admin already exists:", existing.email);
    } else {
      const admin = await User.create({
        studentNumber: "0000001",
        email: adminEmail,
        name: "System Admin",
        passwordHash: "Mabuhay@Pilipinas", // will be hashed automatically
        role: "admin",
      });
      console.log("✅ Admin created:", admin.email);
    }
  } catch (err) {
    console.error("❌ Error creating admin:", err);
  } finally {
    await sequelize.close();
    process.exit();
  }
})();
