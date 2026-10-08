const { test } = require('node:test');
const assert = require('node:assert/strict');
const postgresOptions = require('../src/config/postgres-options');
const tratarErro = require('../src/middlewares/erros');

const url = 'postgresql://usuario:senha%40exemplo@db.example.invalid:5433/urbanlink';

test('PostgreSQL: separa campos da URL e mantém TLS verificado por padrão', () => {
  const config = postgresOptions({ DATABASE_URL: url });
  assert.equal(config.host, 'db.example.invalid');
  assert.equal(config.port, 5433);
  assert.equal(config.database, 'urbanlink');
  assert.equal(config.user, 'usuario');
  assert.equal(config.password, 'senha@exemplo');
  assert.deepEqual(config.ssl, { rejectUnauthorized: true });
});

test('PostgreSQL: conexão interna pode desativar TLS explicitamente; externa aceita CA', () => {
  assert.equal(postgresOptions({ DATABASE_URL: url, DB_SSL: 'false' }).ssl, false);
  assert.deepEqual(
    postgresOptions({ DATABASE_URL: url, DB_SSL: 'true', DB_SSL_CA: 'linha1\\nlinha2' }).ssl,
    { rejectUnauthorized: true, ca: 'linha1\nlinha2' }
  );
  assert.deepEqual(postgresOptions({ DATABASE_URL: `${url}?sslmode=no-verify` }).ssl, {
    rejectUnauthorized: true
  });
});

test('PostgreSQL: recusa configuração incompleta ou outro banco sem expor credenciais', () => {
  for (const DATABASE_URL of [
    undefined,
    'mysql://segredo@host/banco',
    'postgres://host/banco',
    'postgres://user@host'
  ]) {
    assert.throws(
      () => postgresOptions({ DATABASE_URL }),
      (error) => !error.message.includes('segredo')
    );
  }
  assert.throws(() => postgresOptions({ DATABASE_URL: url, DB_SSL: 'talvez' }), /DB_SSL/);
});

test('PostgreSQL: conflitos de transação retornam 409 e permitem tentar novamente', () => {
  for (const code of ['40001', '40P01', '55P03']) {
    let status;
    let payload;
    const response = {
      status(value) {
        status = value;
        return this;
      },
      json(value) {
        payload = value;
        return this;
      }
    };
    tratarErro({ original: { code } }, {}, response, () => {});
    assert.equal(status, 409);
    assert.match(payload.mensagem, /Tente novamente/);
  }
});
