require("dotenv").config(); // loads .env
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: console.log,
  }
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ DB connected");

    // 1️⃣ Check if electionId column exists
    const [columns] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Candidates';
    `);

    const hasElectionId = columns.some(col => col.column_name === "electionId");

    if (!hasElectionId) {
      console.log("🚨 'electionId' column not found. Adding it...");

      await sequelize.query(`
        ALTER TABLE "Candidates"
        ADD COLUMN "electionId" INTEGER
        REFERENCES "ElectionStates"(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE;
      `);

      console.log("✅ 'electionId' column added.");
    } else {
      console.log("✅ 'electionId' column already exists.");
    }

    // 2️⃣ Backfill null electionId rows with latest election
    await sequelize.query(`
      UPDATE "Candidates"
      SET "electionId" = (
        SELECT "id" FROM "ElectionStates"
        ORDER BY "createdAt" DESC LIMIT 1
      )
      WHERE "electionId" IS NULL;
    `);
    console.log("✅ Null electionId rows backfilled with latest election.");

    // 3️⃣ Make electionId NOT NULL
    await sequelize.query(`
      ALTER TABLE "Candidates"
      ALTER COLUMN "electionId" SET NOT NULL;
    `);
    console.log("✅ 'electionId' column set to NOT NULL.");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error fixing Candidates table:", err);
    process.exit(1);
  }
})();
