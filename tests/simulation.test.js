'use strict';

const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { calcularResultados } = require('../src/services/simulacaoService');
const usuarioService = require('../src/services/usuarioService');
const painelService = require('../src/services/painelService');
const { sequelize, Usuario, Entrega, Simulacao, Veiculo } = require('../src/models');

after(async () => {
  await sequelize.close();
});

const route = (id, distance) => ({
  id,
  nome: `Percurso ${id}`,
  origem: 'Centro de Distribuição',
  destino: 'Mercado Central',
  distancia_km: distance,
  pontos: [
    { lat: -23.55, lng: -46.63 },
    { lat: -23.56, lng: -46.62 }
  ]
});

test('simulação: exemplos apresentados nos dois cenários', () => {
  const alternatives = [route(1, 8), route(2, 12)];
  const normal = calcularResultados(alternatives, 30, 20);
  const slow = calcularResultados(alternatives, 20, 20);
  assert.deepEqual(
    normal.map((r) => [r.rota_id, r.tempo_min, r.dentro_prazo]),
    [
      [1, 16, true],
      [2, 24, false]
    ]
  );
  assert.deepEqual(
    slow.map((r) => [r.rota_id, r.tempo_min, r.dentro_prazo]),
    [
      [1, 24, false],
      [2, 36, false]
    ]
  );
});

test('simulação: igualdade com prazo é aceita; um minuto acima é recusado', () => {
  const result = calcularResultados([route(1, 10), route(2, 10.5)], 30, 20);
  assert.deepEqual(
    result.map((r) => [r.tempo_min, r.dentro_prazo]),
    [
      [20, true],
      [21, false]
    ]
  );
});

test('simulação: alternativa mais rápida primeiro e desempate por ID', () => {
  const result = calcularResultados([route(8, 12), route(5, 8), route(2, 8)], 30, 30);
  assert.deepEqual(
    result.map((r) => r.rota_id),
    [2, 5, 8]
  );
});

test('simulação: arredondamento a duas casas e preservação dos percursos originais', () => {
  const routes = [route(1, 8.01), route(2, 8.02)];
  const original = structuredClone(routes);
  const result = calcularResultados(routes, 20, 30);
  assert.deepEqual(
    result.map((r) => r.tempo_min),
    [24.03, 24.06]
  );
  assert.deepEqual(routes, original);
  assert.deepEqual(result[0].pontos, original[0].pontos);
});

test('segurança: o último administrador não pode ser rebaixado, sem alterar contas reais', async (t) => {
  let wrote = false;
  const record = {
    id: 42,
    nome: 'Administrador de teste',
    email: 'teste@example.local',
    tipo: 'administrador',
    update: async () => {
      wrote = true;
    }
  };
  const tx = { LOCK: { UPDATE: 'UPDATE' } };
  t.mock.method(sequelize, 'transaction', async (fn) => fn(tx));
  t.mock.method(Usuario, 'findAll', async () => [record]);
  t.mock.method(Usuario, 'findByPk', async () => record);
  t.mock.method(Usuario, 'count', async () => 1);
  await assert.rejects(
    usuarioService.atualizar(42, { tipo: 'operador' }, { id: 1 }),
    (error) => error.status === 409
  );
  assert.equal(wrote, false);
});

test('segurança: o último administrador não pode ser excluído, sem alterar contas reais', async (t) => {
  let removed = false;
  const record = {
    id: 42,
    tipo: 'administrador',
    destroy: async () => {
      removed = true;
    }
  };
  const tx = { LOCK: { UPDATE: 'UPDATE' } };
  t.mock.method(sequelize, 'transaction', async (fn) => fn(tx));
  t.mock.method(Usuario, 'findAll', async () => [record]);
  t.mock.method(Usuario, 'findByPk', async () => record);
  t.mock.method(Usuario, 'count', async () => 1);
  t.mock.method(Entrega, 'count', async () => 0);
  t.mock.method(Simulacao, 'count', async () => 0);
  await assert.rejects(usuarioService.excluir(42, { id: 1 }), (error) => error.status === 409);
  assert.equal(removed, false);
});

test('painel: cada entrega contribui só com sua última previsão e veículos ocupados não contam como disponíveis', async (t) => {
  t.mock.method(Entrega, 'findAll', async (options) => {
    if (options.group)
      return [
        { status: 'pendente', total: 1 },
        { status: 'em_andamento', total: 1 },
        { status: 'concluida', total: 1 }
      ];
    if (options.raw) return [{ veiculo_id: 7 }];
    return [];
  });
  t.mock.method(Veiculo, 'count', async () => 3);
  t.mock.method(Veiculo, 'findAll', async () => [{ id: 7 }, { id: 8 }]);
  t.mock.method(Simulacao, 'findAll', async () => [
    {
      id: 3,
      entrega_id: 10,
      rota_id: 1,
      resultados: [{ rota_id: 1, tempo_min: 24, dentro_prazo: false }]
    },
    {
      id: 2,
      entrega_id: 11,
      rota_id: 2,
      resultados: [{ rota_id: 2, tempo_min: 30, dentro_prazo: true }]
    },
    {
      id: 1,
      entrega_id: 10,
      rota_id: 1,
      resultados: [{ rota_id: 1, tempo_min: 16, dentro_prazo: true }]
    }
  ]);
  const result = await painelService.obter();
  assert.equal(result.total_entregas, 3);
  assert.equal(result.veiculos_disponiveis, 1);
  assert.equal(
    result.tempo_medio_min,
    27,
    'média das previsões atuais 24 e 30; não inclui a anterior 16'
  );
  assert.equal(result.dentro_prazo_percentual, 50);
});
