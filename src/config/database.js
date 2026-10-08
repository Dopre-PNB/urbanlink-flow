const { Sequelize } = require('sequelize');
require('./mysql-options'); // Carrega o .env também no modo PostgreSQL.
const postgres = Boolean(process.env.DATABASE_URL);
const connection = postgres
  ? require('./postgres-options')()
  : require('./mysql-options')().connection;

const sequelize = new Sequelize(connection.database, connection.user, connection.password, {
  host: connection.host,
  port: connection.port,
  dialect: postgres ? 'postgres' : 'mysql',
  dialectOptions: postgres
    ? { ssl: connection.ssl }
    : connection.ssl
      ? { ssl: connection.ssl }
      : {},
  logging: false,
  timezone: '-03:00',
  pool: { max: 10, min: 0, acquire: 15000, idle: 10000 },
  define: { timestamps: true, freezeTableName: true }
});
module.exports = sequelize;
