const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../../.env'), quiet: true });

function postgresOptions(env = process.env) {
  let url;
  try {
    url = new URL(env.DATABASE_URL);
  } catch {
    throw new Error('Configure DATABASE_URL com a conexão PostgreSQL da hospedagem.');
  }
  if (!['postgres:', 'postgresql:'].includes(url.protocol))
    throw new Error('DATABASE_URL deve usar o protocolo postgres ou postgresql.');
  const database = decodeURIComponent(url.pathname.slice(1));
  if (!url.hostname || !url.username || !database || database.includes('/'))
    throw new Error('DATABASE_URL deve conter servidor, usuário e nome do banco.');
  const port = Number(url.port || 5432);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('A porta PostgreSQL deve estar entre 1 e 65535.');
  if (env.DB_SSL !== undefined && env.DB_SSL !== '' && !['true', 'false'].includes(env.DB_SSL))
    throw new Error('DB_SSL deve ser true ou false.');
  // A conexão interna do Render usa DB_SSL=false. A externa valida o certificado TLS.
  const sslEnabled = env.DB_SSL === undefined || env.DB_SSL === '' ? true : env.DB_SSL === 'true';
  const ssl = sslEnabled ? { rejectUnauthorized: true } : false;
  if (ssl && env.DB_SSL_CA) ssl.ca = env.DB_SSL_CA.replace(/\\n/g, '\n');
  return {
    host: url.hostname,
    port,
    database,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    // Parseamos os campos explicitamente para que sslmode na URL não desative a validação.
    ssl
  };
}

module.exports = postgresOptions;
