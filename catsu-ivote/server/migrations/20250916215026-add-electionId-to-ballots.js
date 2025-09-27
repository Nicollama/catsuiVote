"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1) Add nullable electionId column first (so migration won't fail if ballots exist)
    await queryInterface.addColumn("Ballots", "electionId", {
      type: Sequelize.INTEGER,
      allowNull: true, // start nullable
      references: {
        model: "ElectionStates", // table name (plural). Adjust if your table name differs.
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    // 2) Ensure there is at least one ElectionState row to reference.
    //    If none exists, insert a default (closed) election.
    const [existingElections] = await queryInterface.sequelize.query(
      `SELECT id FROM "ElectionStates" ORDER BY "createdAt" DESC LIMIT 1;`
    );

    let electionId;
    if (!existingElections || existingElections.length === 0) {
      // create a default election record (closed)
      await queryInterface.bulkInsert(
        "ElectionStates",
        [{
          votingOpen: false,
          startsAt: new Date(),
          endsAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }],
        {}
      );

      const [newElections] = await queryInterface.sequelize.query(
        `SELECT id FROM "ElectionStates" ORDER BY "createdAt" DESC LIMIT 1;`
      );
      electionId = newElections[0].id;
    } else {
      electionId = existingElections[0].id;
    }

    // 3) Update existing Ballots to point to that election
    await queryInterface.sequelize.query(
      `UPDATE "Ballots" SET "electionId" = ${electionId} WHERE "electionId" IS NULL;`
    );

    // 4) Make electionId NOT NULL and ensure FK enforced
    await queryInterface.changeColumn("Ballots", "electionId", {
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
    // Revert: remove the column
    await queryInterface.removeColumn("Ballots", "electionId");
  },
};
