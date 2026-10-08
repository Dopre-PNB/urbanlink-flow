const { Op } = require('sequelize');
const sequelize = require('../config/database');

// MySQL usa a collation sem distinção de maiúsculas; PostgreSQL precisa de ILIKE.
const operadorBusca = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
function igualSemMaiusculas(value) {
  if (sequelize.getDialect() !== 'postgres') return value;
  return { [Op.iLike]: value.replace(/[\\%_]/g, '\\$&') };
}

module.exports = { operadorBusca, igualSemMaiusculas };
