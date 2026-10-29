const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Job = sequelize.define(
  "Job",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "companies",
        key: "id",
      },
    },
    title: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    job_type: {
      type: DataTypes.ENUM("full_time", "part_time", "contract", "internship"),
      allowNull: false,
      defaultValue: "full_time",
    },
    experience_required: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    salary_range: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    skills: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    status: {
      type: DataTypes.ENUM("draft", "active", "closed"),
      allowNull: false,
      defaultValue: "draft",
    },
  },
  {
    tableName: "jobs",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Job;