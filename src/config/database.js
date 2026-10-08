const { Sequelize } = require('sequelize');
const { connection } = require('./mysql-options')();

const sequelize = new Sequelize(connection.database, connection.user, connection.password, {
  host: connection.host,
  port: connection.port,
  dialect: 'mysql',
  dialectOptions: connection.ssl ? { ssl: connection.ssl } : {},
  logging: false,
  timezone: '-03:00',
  pool: { max: 10, min: 0, acquire: 15000, idle: 10000 },
  define: { timestamps: true, freezeTableName: true }
});
module.exports = sequelize;
