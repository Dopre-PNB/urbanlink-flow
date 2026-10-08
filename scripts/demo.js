// Uma entrada para preparar o MySQL exclusivo, os dados e o servidor.
const path = require('node:path');
const fs = require('node:fs');
const net = require('node:net');
const { spawn, spawnSync } = require('node:child_process');
const dotenv = require('dotenv');
const localMysql = require('./local-mysql');
const project = path.resolve(__dirname, '..');

async function main() {
  const envFile = path.join(project, '.env');
  let env = fs.existsSync(envFile) ? dotenv.parse(fs.readFileSync(envFile)) : null;
  const ownsLocal =
    !env ||
    (fs.existsSync(path.join(project, '.local/mysql-config.json')) &&
      env?.DB_PORT === '3307' &&
      env?.DB_HOST === '127.0.0.1');
  if (ownsLocal) {
    await localMysql.start();
    env = dotenv.parse(fs.readFileSync(envFile));
  }
  const port = Number(env.PORT || 3000);
  const host = env.HOST || '127.0.0.1';
  await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', () =>
      reject(
        new Error(
          `A porta ${port} já está em uso. Feche a execução anterior ou ajuste PORT no .env.`
        )
      )
    );
    probe.listen(port, host, () => probe.close(resolve));
  });
  const setup = spawnSync(process.execPath, [path.join(project, 'scripts/setup.js')], {
    cwd: project,
    stdio: 'inherit',
    windowsHide: true
  });
  if (setup.status !== 0 || setup.error)
    throw new Error('Não foi possível preparar o banco. Verifique a configuração do .env.');
  const app = spawn(process.execPath, [path.join(project, 'src/app.js')], {
    cwd: project,
    stdio: 'inherit',
    windowsHide: true
  });
  const stop = () => {
    if (!app.killed) app.kill('SIGTERM');
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  // O processo pai permanece ativo enquanto o servidor está em funcionamento.
  await new Promise((resolve, reject) => {
    app.once('error', reject);
    app.once('exit', (code) =>
      code === 0 || app.killed
        ? resolve()
        : reject(new Error(`O servidor encerrou com código ${code}.`))
    );
  });
  process.removeListener('SIGINT', stop);
  process.removeListener('SIGTERM', stop);
  if (ownsLocal) await localMysql.stop();
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
