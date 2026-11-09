const { Sequelize } = require("sequelize");

const useTls = String(process.env.DB_SSL).toLowerCase() === "true";

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 4000),
    dialect: "mysql",
    logging: false,
    dialectOptions: useTls
      ? {
          ssl: {
            minVersion: "TLSv1.2",
            rejectUnauthorized: true,
          },
        }
      : {},
  }
);

module.exports = sequelize;