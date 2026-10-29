const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Application = sequelize.define(
  "Application",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    job_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "jobs",
        key: "id",
      },
    },
    candidate_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "candidates",
        key: "id",
      },
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "companies",
        key: "id",
      },
    },
    status: {
      type: DataTypes.ENUM(
        "submitted",
        "reviewing",
        "shortlisted",
        "rejected",
        "hired",
        "withdrawn"
      ),
      allowNull: false,
      defaultValue: "submitted",
    },
    ai_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "applications",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["job_id", "candidate_id"],
      },
    ],
  }
);

module.exports = Application;