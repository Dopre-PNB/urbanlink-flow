const path = require('node:path');
const fs = require('node:fs/promises');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const mysql = require('mysql2/promise');
const mysqlOptions = require('../src/config/mysql-options');
async function setup() {
  if (process.env.DATABASE_URL) {
    await setupPostgres();
  } else {
    await setupMySQL();
  }
  const { sequelize } = require('../src/models');
  try {
    await require('./seed')();
  } finally {
    await sequelize.close();
  }
}
async function setupPostgres() {
  const { Client } = require('pg');
  const client = new Client(require('../src/config/postgres-options')());
  await client.connect();
  try {
    const sql = await fs.readFile(path.join(__dirname, '../database/schema-postgres.sql'), 'utf8');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Estrutura do banco PostgreSQL criada ou verificada.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}
async function setupMySQL() {
  const { connection: options, createDatabase } = mysqlOptions();
  const nome = options.database;
  const connection = await mysql.createConnection({
    ...options,
    database: createDatabase ? undefined : nome,
    multipleStatements: true
  });
  try {
    let sql = (await fs.readFile(path.join(__dirname, '../database/schema.sql'), 'utf8')).replace(
      /\burbanlink_flow\b/g,
      nome
    );
    // Provedores gerenciados já entregam o banco criado e podem bloquear CREATE DATABASE.
    if (!createDatabase) sql = sql.replace(/^CREATE DATABASE[^\n]*\n/m, '');
    await connection.query(sql);
    // Upgrade reversível para bancos criados pela primeira versão: preservar ordem de edições.
    for (const tabela of ['usuarios', 'veiculos', 'rotas', 'entregas', 'simulacoes']) {
      const [colunas] = await connection.execute(
        'SELECT DATETIME_PRECISION FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME IN (?, ?)',
        [nome, tabela, 'createdAt', 'updatedAt']
      );
      if (colunas.some((coluna) => coluna.DATETIME_PRECISION !== 3)) {
        await connection.query(
          `ALTER TABLE ${tabela} MODIFY createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), MODIFY updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`
        );
      }
    }
    console.log('Estrutura do banco MySQL criada ou verificada.');
  } finally {
    await connection.end();
  }
}
setup().catch((error) => {
  console.error('Falha na preparação do banco:', error.message);
  process.exitCode = 1;
});
