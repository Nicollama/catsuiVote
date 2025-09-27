'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove the old voterId column
    await queryInterface.removeColumn('Ballots', 'voterId');

    // Ensure userId exists and is not null
    await queryInterface.changeColumn('Ballots', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Restore voterId if we rollback
    await queryInterface.addColumn('Ballots', 'voterId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    // Revert userId changes if needed
    await queryInterface.changeColumn('Ballots', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },
};
