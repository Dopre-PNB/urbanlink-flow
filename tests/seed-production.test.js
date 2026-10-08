'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const {
  criarAdministradorInicial,
  validarAdministradorInicial
} = require('../src/config/initial-admin');

const ambiente = {
  INITIAL_ADMIN_EMAIL: ' Responsavel@Example.com ',
  INITIAL_ADMIN_PASSWORD: 'SenhaExclusiva!42'
};

function bancoSimulado(registros = []) {
  const gravados = [...registros];
  const transaction = {};
  return {
    gravados,
    sequelize: { transaction: async (fn) => fn(transaction) },
    Usuario: {
      findOne: async ({ where, transaction: recebida }) => {
        assert.equal(recebida, transaction);
        return gravados.find((registro) =>
          Object.entries(where).every(([chave, valor]) => registro[chave] === valor)
        );
      },
      create: async (dados, { transaction: recebida }) => {
        assert.equal(recebida, transaction);
        const criado = { id: gravados.length + 1, ...dados };
        gravados.push(criado);
        return criado;
      }
    }
  };
}

test('produção: primeiro acesso cria apenas administrador com senha protegida e é idempotente', async () => {
  const banco = bancoSimulado();
  assert.equal(await criarAdministradorInicial(banco, ambiente), true);
  assert.equal(banco.gravados.length, 1);
  const administrador = banco.gravados[0];
  assert.equal(administrador.nome, 'Administrador UrbanLink');
  assert.equal(administrador.email, 'responsavel@example.com');
  assert.equal(administrador.tipo, 'administrador');
  assert.equal('senha' in administrador, false);
  assert.notEqual(administrador.senha_hash, ambiente.INITIAL_ADMIN_PASSWORD);
  assert.equal(
    await bcrypt.compare(ambiente.INITIAL_ADMIN_PASSWORD, administrador.senha_hash),
    true
  );
  const original = structuredClone(banco.gravados);
  assert.equal(await criarAdministradorInicial(banco, {}), false);
  assert.deepEqual(banco.gravados, original);
});

test('produção: administrador existente dispensa credenciais iniciais e preserva todas as contas', async () => {
  const existentes = [
    { id: 1, email: 'outro@example.com', tipo: 'administrador', senha_hash: 'hash-existente' },
    { id: 2, email: 'operador@example.com', tipo: 'operador' }
  ];
  const banco = bancoSimulado(existentes);
  assert.equal(await criarAdministradorInicial(banco, {}), false);
  assert.deepEqual(banco.gravados, existentes);
});

test('produção: e-mail de operador existente não recebe promoção automática', async () => {
  const existentes = [{ id: 1, email: 'responsavel@example.com', tipo: 'operador' }];
  const banco = bancoSimulado(existentes);
  await assert.rejects(criarAdministradorInicial(banco, ambiente), (erro) => erro.status === 409);
  assert.deepEqual(banco.gravados, existentes);
});

test('produção: credenciais ausentes, inválidas ou de demonstração falham antes de gravar', async () => {
  const entradasInvalidas = [
    {},
    { ...ambiente, INITIAL_ADMIN_EMAIL: undefined },
    { ...ambiente, INITIAL_ADMIN_EMAIL: 'email-invalido' },
    { ...ambiente, INITIAL_ADMIN_EMAIL: `${'a'.repeat(145)}@example.com` },
    { ...ambiente, INITIAL_ADMIN_NAME: '' },
    { ...ambiente, INITIAL_ADMIN_NAME: 'a'.repeat(101) },
    { ...ambiente, INITIAL_ADMIN_PASSWORD: undefined },
    { ...ambiente, INITIAL_ADMIN_PASSWORD: '1234567' },
    { ...ambiente, INITIAL_ADMIN_PASSWORD: 'a'.repeat(73) },
    { ...ambiente, INITIAL_ADMIN_PASSWORD: 'á'.repeat(37) },
    { ...ambiente, INITIAL_ADMIN_PASSWORD: 'Admin@123' },
    { ...ambiente, INITIAL_ADMIN_PASSWORD: 'Operador@123' }
  ];
  for (const entrada of entradasInvalidas) {
    const banco = bancoSimulado();
    await assert.rejects(criarAdministradorInicial(banco, entrada), (erro) => erro.status === 400);
    assert.deepEqual(banco.gravados, []);
  }
});

test('produção: validação aceita nome configurado e limites de senha do cadastro de usuários', () => {
  const dados = validarAdministradorInicial({
    ...ambiente,
    INITIAL_ADMIN_NAME: '  Responsável pela plataforma  ',
    INITIAL_ADMIN_PASSWORD: 'á'.repeat(36)
  });
  assert.equal(dados.nome, 'Responsável pela plataforma');
  assert.equal(Buffer.byteLength(dados.senha, 'utf8'), 72);
  assert.equal(
    validarAdministradorInicial({ ...ambiente, INITIAL_ADMIN_PASSWORD: '12345678' }).senha,
    '12345678'
  );
});

test('produção: o comando seed não executa cadastros da demonstração nem imprime a senha', async (t) => {
  const banco = bancoSimulado();
  const modelsPath = require.resolve('../src/models');
  const seedPath = require.resolve('../scripts/seed');
  const cacheAnterior = require.cache[modelsPath];
  const seedAnterior = require.cache[seedPath];
  const ambienteAnterior = Object.fromEntries(
    ['NODE_ENV', 'INITIAL_ADMIN_NAME', 'INITIAL_ADMIN_EMAIL', 'INITIAL_ADMIN_PASSWORD'].map(
      (chave) => [chave, process.env[chave]]
    )
  );
  const mensagens = [];
  t.mock.method(console, 'log', (mensagem) => mensagens.push(mensagem));
  const naoCriarDemonstracao = {
    findOrCreate: async () => assert.fail('Produção não deve cadastrar dados da demonstração.')
  };
  try {
    require.cache[modelsPath] = {
      exports: {
        ...banco,
        Veiculo: naoCriarDemonstracao,
        Rota: naoCriarDemonstracao,
        Entrega: naoCriarDemonstracao
      }
    };
    delete require.cache[seedPath];
    process.env.NODE_ENV = 'production';
    delete process.env.INITIAL_ADMIN_NAME;
    process.env.INITIAL_ADMIN_EMAIL = ambiente.INITIAL_ADMIN_EMAIL;
    process.env.INITIAL_ADMIN_PASSWORD = ambiente.INITIAL_ADMIN_PASSWORD;
    await require('../scripts/seed')();
    assert.equal(banco.gravados.length, 1);
    assert.equal(banco.gravados[0].email, 'responsavel@example.com');
    assert.equal(mensagens.join(' ').includes(ambiente.INITIAL_ADMIN_PASSWORD), false);
  } finally {
    if (cacheAnterior) require.cache[modelsPath] = cacheAnterior;
    else delete require.cache[modelsPath];
    if (seedAnterior) require.cache[seedPath] = seedAnterior;
    else delete require.cache[seedPath];
    for (const [chave, valor] of Object.entries(ambienteAnterior)) {
      if (valor === undefined) delete process.env[chave];
      else process.env[chave] = valor;
    }
  }
});
