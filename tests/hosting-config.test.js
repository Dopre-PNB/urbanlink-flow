const { test } = require('node:test');
const assert = require('node:assert/strict');
const mysqlOptions = require('../src/config/mysql-options');

const hosted = {
  NODE_ENV: 'production',
  DB_HOST: 'mysql.example.test',
  DB_PORT: '25060',
  DB_NAME: 'defaultdb',
  DB_USER: 'urbanlink',
  DB_PASSWORD: 'somente_teste'
};

test('hospedagem: usa banco existente e TLS com certificado e identidade verificados', () => {
  const { connection, createDatabase } = mysqlOptions(hosted);
  assert.equal(createDatabase, false);
  assert.equal(connection.database, 'defaultdb');
  assert.equal(connection.port, 25060);
  assert.deepEqual(connection.ssl, { rejectUnauthorized: true, verifyIdentity: true });
});

test('hospedagem: aceita CA do provedor e mantém validação TLS', () => {
  const { connection } = mysqlOptions({ ...hosted, DB_SSL_CA: 'inicio\\ncertificado\\nfim' });
  assert.equal(connection.ssl.ca, 'inicio\ncertificado\nfim');
  assert.equal(connection.ssl.rejectUnauthorized, true);
  assert.equal(connection.ssl.verifyIdentity, true);
});

test('hospedagem: rejeita configurações incompletas antes de conectar', () => {
  assert.throws(() => mysqlOptions({ NODE_ENV: 'production' }), /DB_HOST/);
  assert.throws(() => mysqlOptions({ ...hosted, DB_NAME: 'db;DROP TABLE usuarios' }), /DB_NAME/);
  assert.throws(() => mysqlOptions({ ...hosted, DB_PORT: '0' }), /DB_PORT/);
  assert.throws(() => mysqlOptions({ ...hosted, DB_SSL: 'tru' }), /DB_SSL/);
  assert.throws(() => mysqlOptions({ ...hosted, DB_CREATE_DATABASE: 'tru' }), /DB_CREATE_DATABASE/);
});

test('hospedagem: mantém a demonstração local e aceita banco em rede privada sem TLS', () => {
  const local = mysqlOptions({});
  assert.equal(local.createDatabase, true);
  assert.equal(local.connection.host, '127.0.0.1');
  assert.equal(local.connection.ssl, undefined);
  assert.equal(mysqlOptions({ ...hosted, DB_SSL: 'false' }).connection.ssl, undefined);
});
