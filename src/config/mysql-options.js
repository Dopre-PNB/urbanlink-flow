const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../../.env'), quiet: true });

function booleanOption(value, fallback, name) {
  if (value === undefined || value === '') return fallback;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`${name} deve ser true ou false.`);
}

// O setup e o Sequelize precisam usar a mesma conexão, inclusive o certificado TLS.
function mysqlOptions(env = process.env) {
  const production = env.NODE_ENV === 'production';
  if (production) {
    for (const key of ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']) {
      if (!env[key]) throw new Error(`Configure ${key} nas variáveis de ambiente da hospedagem.`);
    }
  }
  const database = env.DB_NAME || 'urbanlink_flow';
  if (!/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(database))
    throw new Error('DB_NAME inválido. Use letras, números e sublinhado.');
  const port = Number(env.DB_PORT || 3306);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('DB_PORT deve ser uma porta entre 1 e 65535.');

  const sslEnabled = booleanOption(env.DB_SSL, production, 'DB_SSL');
  const ssl = sslEnabled ? { rejectUnauthorized: true, verifyIdentity: true } : undefined;
  if (ssl && env.DB_SSL_CA) ssl.ca = env.DB_SSL_CA.replace(/\\n/g, '\n');
  return {
    connection: {
      host: env.DB_HOST || '127.0.0.1',
      port,
      database,
      user: env.DB_USER || 'urbanlink_app',
      password: env.DB_PASSWORD || '',
      ...(ssl ? { ssl } : {})
    },
    createDatabase: booleanOption(env.DB_CREATE_DATABASE, !production, 'DB_CREATE_DATABASE')
  };
}

module.exports = mysqlOptions;
