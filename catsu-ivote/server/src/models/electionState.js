"use strict";

module.exports = (sequelize, DataTypes) => {
  const ElectionState = sequelize.define(
    "ElectionState",
    {
      votingOpen: { 
        type: DataTypes.BOOLEAN, 
        allowNull: false, 
        defaultValue: false 
      },
      startsAt: { 
        type: DataTypes.DATE, 
        allowNull: false,
        validate: { isDate: true },
      },
      endsAt: { 
        type: DataTypes.DATE, 
        allowNull: false,
        validate: {
          isDate: true,
          isAfterStart(value) {
            if (this.startsAt && value <= this.startsAt) {
              throw new Error("endsAt must be after startsAt");
            }
          },
        },
      },
    },
    {
      tableName: "ElectionStates",
    }
  );

  ElectionState.associate = (models) => {
    ElectionState.hasMany(models.Ballot, { foreignKey: "electionId" });
    models.Ballot.belongsTo(ElectionState, { foreignKey: "electionId" });
  };

  return ElectionState;
};
