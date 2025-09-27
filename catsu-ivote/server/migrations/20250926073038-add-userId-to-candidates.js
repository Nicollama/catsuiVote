"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Candidates", "userId", {
      type: Sequelize.INTEGER,
      allowNull: true, // ✅ allow nulls for now so migration won't fail
      references: {
        model: "Users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Candidates", "userId");
  },
};
