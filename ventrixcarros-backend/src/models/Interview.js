const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Interview = sequelize.define(
  "Interview",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    application_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "applications",
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
    interviewer: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    interview_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    interview_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    mode: {
      type: DataTypes.ENUM("online", "in_person", "phone"),
      allowNull: false,
    },
    meeting_link: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("scheduled", "completed", "cancelled"),
      allowNull: false,
      defaultValue: "scheduled",
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "interviews",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Interview;