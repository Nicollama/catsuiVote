"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Ballots", "ciphertext", {
      type: Sequelize.TEXT,
      allowNull: true, // ✅ allow null for existing rows
    });
    await queryInterface.addColumn("Ballots", "iv", {
      type: Sequelize.STRING,
      allowNull: true, // ✅
    });
    await queryInterface.addColumn("Ballots", "tag", {
      type: Sequelize.STRING,
      allowNull: true, // ✅
    });
    await queryInterface.addColumn("Ballots", "wrappedKey", {
      type: Sequelize.TEXT,
      allowNull: true, // ✅
    });
    await queryInterface.addColumn("Ballots", "voteHash", {
      type: Sequelize.STRING,
      allowNull: true, // ✅
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Ballots", "ciphertext");
    await queryInterface.removeColumn("Ballots", "iv");
    await queryInterface.removeColumn("Ballots", "tag");
    await queryInterface.removeColumn("Ballots", "wrappedKey");
    await queryInterface.removeColumn("Ballots", "voteHash");
  },
};
