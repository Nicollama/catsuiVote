// models/Candidate.js
module.exports = (sequelize, DataTypes) => {
  const Candidate = sequelize.define(
    "Candidate",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      electionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "electionId", // match the actual DB column
      },
      
      name: DataTypes.STRING,
      party: DataTypes.STRING,
      position: DataTypes.STRING,
      approved: DataTypes.BOOLEAN,
      rejectionComment: DataTypes.TEXT,
      documents: DataTypes.JSON,
    },
    {
      tableName: "Candidates",
      timestamps: true,
    }
  );

  return Candidate;
};
