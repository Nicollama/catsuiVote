module.exports = (sequelize, DataTypes) => {
  const Voter = sequelize.define("Voter", {
    studentId: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, defaultValue: "student" },
    approved: { type: DataTypes.BOOLEAN, defaultValue: false },
  });

  Voter.associate = (models) => {
    Voter.hasOne(models.Ballot, { foreignKey: "voterId" });
  };

  return Voter;
};