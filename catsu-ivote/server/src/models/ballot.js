module.exports = (sequelize, DataTypes) => {
  const Ballot = sequelize.define("Ballot", {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    candidateId: { type: DataTypes.INTEGER, allowNull: false },

    // 🔑 Link to election period
    electionId: { type: DataTypes.INTEGER, allowNull: false },

    // 🔐 Encrypted vote fields
    ciphertext: { type: DataTypes.TEXT, allowNull: false },
    iv: { type: DataTypes.STRING, allowNull: false },
    tag: { type: DataTypes.STRING, allowNull: false },
    wrappedKey: { type: DataTypes.TEXT, allowNull: false },

    // 📝 Audit trail
    voteHash: { type: DataTypes.STRING, allowNull: false },
  });

  Ballot.associate = (models) => {
    Ballot.belongsTo(models.User, { foreignKey: "userId" });
    Ballot.belongsTo(models.Candidate, { foreignKey: "candidateId" });

    // ✅ Link ballots to an election
    Ballot.belongsTo(models.ElectionState, { foreignKey: "electionId" });
    models.ElectionState.hasMany(Ballot, { foreignKey: "electionId" });
  };

  return Ballot;
};
