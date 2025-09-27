module.exports = (sequelize, DataTypes) => {
    const SystemLog = sequelize.define("SystemLog", {
      action: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      adminId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    }, {
      timestamps: true, // adds createdAt & updatedAt automatically
    });
  
    return SystemLog;
  };
  