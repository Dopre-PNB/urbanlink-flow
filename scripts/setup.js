const path = require('node:path');
const fs = require('node:fs/promises');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const mysql = require('mysql2/promise');
async function setup() {
  const nome = process.env.DB_NAME || 'urbanlink_flow';
  if (!/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(nome)) throw new Error('DB_NAME inválido. Use letras, números e sublinhado.');
  const connection = await mysql.createConnection({ host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER || 'urbanlink_app', password: process.env.DB_PASSWORD || '', multipleStatements: true });
  try {
    const sql = (await fs.readFile(path.join(__dirname, '../database/schema.sql'), 'utf8')).replace(/\burbanlink_flow\b/g, nome);
    await connection.query(sql);
    // Upgrade reversível para bancos criados pela primeira versão: preservar ordem de edições.
    for (const tabela of ['usuarios', 'veiculos', 'rotas', 'entregas', 'simulacoes']) {
      const [colunas] = await connection.execute('SELECT DATETIME_PRECISION FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME IN (?, ?)', [nome, tabela, 'createdAt', 'updatedAt']);
      if (colunas.some(coluna => coluna.DATETIME_PRECISION !== 3)) {
        await connection.query(`ALTER TABLE ${tabela} MODIFY createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), MODIFY updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`);
      }
    }
    console.log('Estrutura do banco MySQL criada ou verificada.');
  } finally { await connection.end(); }
  const { sequelize } = require('../src/models');
  try { await require('./seed')(); } finally { await sequelize.close(); }
}
setup().catch(error => { console.error('Falha na preparação do banco:', error.message); process.exitCode = 1; });
