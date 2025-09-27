const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    studentNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM("student", "admin","comelec"),
      allowNull: false
    },
    totpSecretEnc: {
      type: DataTypes.STRING,
      allowNull: true
    },
    approved: { 
      type: DataTypes.BOOLEAN, 
      defaultValue: false }, // ✅ new
  });

  User.associate = (models) => {
    User.hasMany(models.Ballot, { foreignKey: "userId" });
  };

  // Automatically hash password before creating user
  User.beforeCreate(async (user, options) => {
    if (user.passwordHash) {
      user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
    }
    // normalize email
    if (user.email) {
      user.email = user.email.toLowerCase().trim();
    }
  });

  // Automatically hash password before updating if changed
  User.beforeUpdate(async (user, options) => {
    if (user.changed('passwordHash')) {
      user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
    }
    if (user.changed('email')) {
      user.email = user.email.toLowerCase().trim();
    }
  });

  // Hash password helper (optional, can be used manually)
  User.hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
  };

  return User;
};
