const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PlatformSetting = sequelize.define(
  "PlatformSetting",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      defaultValue: 1,
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {
        platformName: "VentrixCarros",
        defaultLanguage: "English",
        timezone: "Asia/Kolkata",
        notifications: {
          newCompanyAlerts: true,
          paymentAlerts: true,
          supportAlerts: true,
        },
        security: {
          twoFactorAuth: true,
          loginAlerts: true,
          sessionTimeoutMinutes: 30,
        },
        platform: {
          aiRecruitmentEnabled: true,
          allowNewRegistrations: true,
          maintenanceMode: false,
        },
      },
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "platform_settings",
    timestamps: true,
    underscored: true,
  }
);

module.exports = PlatformSetting;