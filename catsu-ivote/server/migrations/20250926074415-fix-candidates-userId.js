"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Delete ballots referencing orphan candidates
    await queryInterface.sequelize.query(`
      DELETE FROM "Ballots" 
      WHERE "candidateId" IN (
        SELECT "id" FROM "Candidates" WHERE "userId" IS NULL
      );
    `);

    // 2. Delete orphan candidates
    await queryInterface.sequelize.query(`
      DELETE FROM "Candidates" WHERE "userId" IS NULL;
    `);

    // 3. Make userId required and add foreign key constraint
    await queryInterface.changeColumn("Candidates", "userId", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "NO ACTION",
    });
  },

  async down(queryInterface, Sequelize) {
    // Rollback: make userId nullable again
    await queryInterface.changeColumn("Candidates", "userId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "NO ACTION",
    });
  },
};
