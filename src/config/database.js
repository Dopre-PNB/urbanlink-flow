const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../../.env'), quiet: true });
const { Sequelize } = require('sequelize');

const databaseName = process.env.DB_NAME || 'urbanlink_flow';
const sequelize = new Sequelize(
  databaseName,
  process.env.DB_USER || 'urbanlink_app',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    logging: false,
    timezone: '-03:00',
    pool: { max: 10, min: 0, acquire: 15000, idle: 10000 },
    define: { timestamps: true, freezeTableName: true }
  }
);
module.exports = sequelize;
