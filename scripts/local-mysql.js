// Instância de desenvolvimento isolada. Não altera o serviço MySQL do computador.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');
const mysql = require('mysql2/promise');

const project = path.resolve(__dirname, '..');
const local = path.join(project, '.local');
const configFile = path.join(local, 'mysql-config.json');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function readConfig() {
  return fs.existsSync(configFile) ? JSON.parse(fs.readFileSync(configFile, 'utf8')) : null;
}

function connection(config, user = 'root', password = config.rootPassword) {
  return mysql.createConnection({ host: '127.0.0.1', port: config.port, user, password, connectTimeout: 1500 });
}

async function running(config) {
  try {
    const conn = await connection(config);
    await conn.ping();
    await conn.end();
    return true;
  } catch { return false; }
}

function findBinary() {
  const candidates = [process.env.MYSQLD_PATH, 'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqld.exe'].filter(Boolean);
  const located = candidates.find(candidate => fs.existsSync(candidate));
  if (!located) throw new Error('Informe MYSQLD_PATH com o caminho do mysqld, ou configure um MySQL existente no .env.');
  return located;
}

async function start() {
  let config = readConfig();
  if (config && await running(config)) {
    console.log(`MySQL exclusivo do projeto já está disponível na porta ${config.port}.`);
    return;
  }
  fs.mkdirSync(local, { recursive: true });
  const envFile = path.join(project, '.env');
  if (!config) {
    if (fs.existsSync(envFile)) throw new Error('Já existe um .env. Para preservar sua configuração, use o MySQL indicado nele ou renomeie esse arquivo antes de preparar a instância local.');
    const binary = findBinary();
    const net = require('node:net');
    await new Promise((resolve, reject) => {
      const probe = net.createServer();
      probe.once('error', () => reject(new Error('A porta 3307 está em uso. Configure seu MySQL existente no .env.')));
      probe.listen(3307, '127.0.0.1', () => probe.close(resolve));
    });
    config = {
      binary, port: 3307, datadir: path.join(local, 'mysql-data'),
      rootPassword: crypto.randomBytes(24).toString('hex'),
      appPassword: crypto.randomBytes(24).toString('hex'), initialized: false
    };
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2), { mode: 0o600 });
  }
  const basedir = path.dirname(path.dirname(config.binary));
  if (!fs.existsSync(path.join(config.datadir, 'mysql'))) {
    fs.mkdirSync(config.datadir, { recursive: true });
    console.log('Preparando o banco exclusivo da demonstração...');
    const init = spawnSync(config.binary, ['--no-defaults', '--initialize-insecure', `--basedir=${basedir}`, `--datadir=${config.datadir}`], {
      windowsHide: true, encoding: 'utf8', timeout: 120000
    });
    if (init.error || init.status !== 0) throw new Error(`Falha ao inicializar MySQL. Consulte .local/mysql-error.log. ${init.error?.message || init.stderr || ''}`);
  }
  const logFile = path.join(local, 'mysql-error.log');
  const child = spawn(config.binary, [
    '--no-defaults', `--basedir=${basedir}`, `--datadir=${config.datadir}`,
    `--port=${config.port}`, '--bind-address=127.0.0.1', '--mysqlx=OFF',
    `--log-error=${logFile}`, `--pid-file=${path.join(local, 'mysql.pid')}`,
    '--character-set-server=utf8mb4', '--collation-server=utf8mb4_unicode_ci'
  ], { detached: true, stdio: 'ignore', windowsHide: true });
  child.on('error', error => console.error('Não foi possível iniciar o banco:', error.message));
  child.unref();
  let conn;
  for (let attempt = 0; attempt < 80; attempt++) {
    try { conn = await connection(config, 'root', config.initialized ? config.rootPassword : ''); break; }
    catch { await wait(500); }
  }
  if (!conn) throw new Error('O banco não respondeu. Consulte .local/mysql-error.log.');
  try {
    if (!config.initialized) {
      // Valores aleatórios contêm apenas hexadecimal, nunca são exibidos no terminal.
      await conn.query(`ALTER USER 'root'@'localhost' IDENTIFIED BY '${config.rootPassword}'`);
      await conn.query(`CREATE USER IF NOT EXISTS 'urbanlink_app'@'localhost' IDENTIFIED BY '${config.appPassword}'`);
      await conn.query("GRANT ALL PRIVILEGES ON urbanlink_flow.* TO 'urbanlink_app'@'localhost'");
      config.initialized = true;
      fs.writeFileSync(configFile, JSON.stringify(config, null, 2), { mode: 0o600 });
    }
  } finally { await conn.end(); }
  if (!fs.existsSync(envFile)) {
    fs.writeFileSync(envFile, [
      'PORT=3000', 'DB_HOST=127.0.0.1', `DB_PORT=${config.port}`,
      'DB_NAME=urbanlink_flow', 'DB_USER=urbanlink_app', `DB_PASSWORD=${config.appPassword}`,
      `JWT_SECRET=${crypto.randomBytes(48).toString('hex')}`, ''
    ].join('\n'), { mode: 0o600 });
  }
  console.log(`MySQL exclusivo do projeto disponível na porta ${config.port}. Configuração salva no .env.`);
}

async function stop() {
  const config = readConfig();
  if (!config) { console.log('Nenhuma instância exclusiva foi configurada.'); return; }
  if (!await running(config)) { console.log('A instância exclusiva já está parada.'); return; }
  const conn = await connection(config);
  try { await conn.query('SHUTDOWN'); }
  catch (error) { if (!['PROTOCOL_CONNECTION_LOST', 'ECONNRESET'].includes(error.code)) throw error; }
  finally { await conn.end().catch(() => {}); }
  console.log('Instância exclusiva do projeto encerrada. Os dados foram preservados.');
}

if (require.main === module) {
  (process.argv[2] === 'stop' ? stop() : start()).catch(error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { start, stop };
