"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add the column as nullable first
    await queryInterface.addColumn("Candidates", "electionId", {
      type: Sequelize.INTEGER,
      allowNull: true, // temporarily allow null
      references: {
        model: "ElectionStates",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    // 2. Backfill existing candidates with the latest election
    await queryInterface.sequelize.query(`
      UPDATE "Candidates"
      SET "electionId" = (
        SELECT "id" FROM "ElectionStates" 
        ORDER BY "createdAt" DESC LIMIT 1
      )
      WHERE "electionId" IS NULL;
    `);

    // 3. Change column to non-nullable
    await queryInterface.changeColumn("Candidates", "electionId", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "ElectionStates",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Candidates", "electionId");
  },
};
