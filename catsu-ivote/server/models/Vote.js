"use strict";

module.exports = (sequelize, DataTypes) => {
  const Voter = sequelize.define("Voter", {
    studentId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    hasVoted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });

  return Voter;
};
