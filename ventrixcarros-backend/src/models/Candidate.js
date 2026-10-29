const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Candidate = sequelize.define(
  "Candidate",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    experience: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    current_role: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    expected_salary: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    resume_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    skills: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    ai_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    },
  },
  {
    tableName: "candidates",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Candidate;