'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');

const base = (process.env.TEST_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');

async function request(method, path, token, payload) {
  const response = await fetch(`${base}/api${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(payload !== undefined ? { 'Content-Type': 'application/json' } : {})
    },
    ...(payload !== undefined ? { body: JSON.stringify(payload) } : {}),
    signal: AbortSignal.timeout(15000)
  });
  const content = await response.text();
  let body;
  try {
    body = JSON.parse(content);
  } catch {
    assert.fail(`Resposta não JSON em ${method} ${path}: ${content.slice(0, 150)}`);
  }
  return { status: response.status, body };
}

function expectStatus(result, expected, context = '') {
  assert.equal(result.status, expected, `${context}: ${JSON.stringify(result.body)}`);
  return result.body;
}

function withoutSecrets(value) {
  const text = JSON.stringify(value);
  assert.doesNotMatch(text, /"(?:senha|senha_hash|password)"\s*:/i);
  assert.doesNotMatch(text, /\$2[aby]\$\d{2}\$/);
}

test(
  'API real: acesso, CRUD, regras e simulações com registros isolados',
  { timeout: 120000 },
  async (t) => {
    const marker = `test-${randomUUID().slice(0, 8)}`;
    const cleanup = { simulacoes: [], entregas: [], rotas: [], veiculos: [], usuarios: [] };
    const today = new Date().toISOString().slice(0, 10);
    let adminToken, operatorToken, operatorId;
    let ownAdmin, ownAdminToken, ownOperator, ownOperatorToken;
    let vehicle, vehicleMaintenance, routeA, routeB, routeLimit;
    let delivery, secondDelivery, saved;
    const origin = `${marker} origem`,
      destination = `${marker} destino`;
    const points = [
      { lat: -23.55, lng: -46.63 },
      { lat: -23.56, lng: -46.62 }
    ];

    async function create(resource, payload, token = adminToken) {
      const body = expectStatus(
        await request('POST', `/${resource}`, token, payload),
        201,
        `criar ${resource}`
      );
      assert.ok(body.dados?.id, `ID de ${resource}`);
      cleanup[resource].push(body.dados.id);
      return body.dados;
    }

    const deliveryPayload = (extra = {}) => ({
      descricao: `${marker} carga`,
      origem: origin,
      destino: destination,
      peso_kg: 100,
      prazo_min: 20,
      data_agendada: today,
      veiculo_id: vehicle.id,
      ...extra
    });

    try {
      await t.test('01: login válido e inválido; dados públicos sem senha', async () => {
        expectStatus(await request('GET', '/health'), 200, 'banco ativo');
        const adm = expectStatus(
          await request('POST', '/login', null, {
            email: 'admin@urbanlink.local',
            senha: 'Admin@123'
          }),
          200,
          'login administrador'
        );
        adminToken = adm.token;
        assert.equal(adm.usuario.tipo, 'administrador');
        withoutSecrets(adm);
        const op = expectStatus(
          await request('POST', '/login', null, {
            email: 'operador@urbanlink.local',
            senha: 'Operador@123'
          }),
          200,
          'login operador'
        );
        operatorToken = op.token;
        operatorId = op.usuario.id;
        assert.equal(op.usuario.tipo, 'operador');
        withoutSecrets(op);
        expectStatus(
          await request('POST', '/login', null, {
            email: 'operador@urbanlink.local',
            senha: 'senha-incorreta'
          }),
          401,
          'senha incorreta'
        );
        expectStatus(
          await request('POST', '/login', null, { email: 'operador@urbanlink.local' }),
          401,
          'credenciais incompletas'
        );
        const me = expectStatus(await request('GET', '/me', operatorToken), 200).dados;
        assert.equal(me.id, operatorId);
        withoutSecrets(me);
      });

      await t.test('02: token ausente/inválido e proteção por perfil', async () => {
        expectStatus(await request('GET', '/veiculos'), 401, 'sem token');
        expectStatus(await request('GET', '/veiculos', 'token-invalido'), 401, 'token inválido');
        expectStatus(
          await request('GET', '/usuarios', operatorToken),
          403,
          'operador consulta usuários'
        );
        expectStatus(
          await request('POST', '/veiculos', operatorToken, {
            nome: `${marker} proibido`,
            placa: `${marker}-X`,
            capacidade_kg: 500
          }),
          403,
          'operador escreve veículo'
        );
      });

      await t.test('03: usuários, e-mail único, edição e autorização atual no banco', async () => {
        ownAdmin = await create('usuarios', {
          nome: `${marker} administrador`,
          email: `${marker}-admin@example.local`,
          senha: 'Test@1234',
          tipo: 'administrador'
        });
        ownOperator = await create('usuarios', {
          nome: `${marker} operador`,
          email: `${marker}-operador@example.local`,
          senha: 'Test@1234',
          tipo: 'operador'
        });
        withoutSecrets(ownAdmin);
        withoutSecrets(ownOperator);
        expectStatus(
          await request('POST', '/usuarios', adminToken, {
            nome: `${marker} duplicado`,
            email: ownOperator.email,
            senha: 'Test@1234',
            tipo: 'operador'
          }),
          409,
          'e-mail duplicado'
        );
        expectStatus(
          await request('POST', '/usuarios', adminToken, {
            nome: `${marker} sem senha`,
            email: `${marker}-no@example.local`,
            tipo: 'operador'
          }),
          400,
          'senha ausente em cadastro'
        );
        expectStatus(
          await request('POST', '/usuarios', adminToken, {
            nome: `${marker} senha curta`,
            email: `${marker}-short@example.local`,
            senha: '1234567',
            tipo: 'operador'
          }),
          400,
          'senha abaixo do limite'
        );
        ownAdminToken = expectStatus(
          await request('POST', '/login', null, {
            email: ownAdmin.email,
            senha: 'Test@1234'
          }),
          200
        ).token;
        ownOperatorToken = expectStatus(
          await request('POST', '/login', null, {
            email: ownOperator.email,
            senha: 'Test@1234'
          }),
          200
        ).token;
        expectStatus(
          await request('DELETE', `/usuarios/${ownAdmin.id}`, ownAdminToken),
          409,
          'excluir própria conta'
        );
        expectStatus(
          await request('PUT', `/usuarios/${ownAdmin.id}`, adminToken, { tipo: 'operador' }),
          200,
          'demover conta criada pelo teste'
        );
        expectStatus(
          await request('GET', '/usuarios', ownAdminToken),
          403,
          'token anterior não mantém perfil antigo'
        );
        const updated = expectStatus(
          await request('PUT', `/usuarios/${ownAdmin.id}`, adminToken, {
            tipo: 'administrador',
            nome: `${marker} administrador editado`
          }),
          200
        ).dados;
        assert.equal(updated.nome, `${marker} administrador editado`);
        withoutSecrets(
          expectStatus(await request('GET', `/usuarios/${ownOperator.id}`, adminToken), 200)
        );
      });

      await t.test('04: veículos, capacidade, placa única e consultas', async () => {
        vehicle = await create('veiculos', {
          nome: `${marker} furgão`,
          placa: `T${marker.slice(-6)}A`,
          capacidade_kg: 500,
          status: 'disponivel'
        });
        vehicleMaintenance = await create('veiculos', {
          nome: `${marker} oficina`,
          placa: `T${marker.slice(-6)}B`,
          capacidade_kg: 500,
          status: 'manutencao'
        });
        expectStatus(
          await request('POST', '/veiculos', adminToken, {
            nome: `${marker} ruim`,
            placa: `T${marker.slice(-6)}C`,
            capacidade_kg: 0
          }),
          400,
          'capacidade zero'
        );
        expectStatus(
          await request('POST', '/veiculos', adminToken, {
            nome: `${marker} repetido`,
            placa: vehicle.placa,
            capacidade_kg: 500
          }),
          409,
          'placa única'
        );
        const edited = expectStatus(
          await request('PUT', `/veiculos/${vehicle.id}`, adminToken, {
            nome: `${marker} furgão editado`
          }),
          200
        ).dados;
        assert.equal(edited.nome, `${marker} furgão editado`);
        const found = expectStatus(
          await request('GET', `/veiculos/${vehicle.id}`, operatorToken),
          200
        ).dados;
        assert.equal(Number(found.capacidade_kg), 500);
        assert.equal(found.ocupado, false);
        expectStatus(
          await request('GET', '/veiculos/999999999', operatorToken),
          404,
          'veículo inexistente'
        );
      });

      await t.test('05: rotas, pontos, unicidade e edição', async () => {
        routeA = await create('rotas', {
          nome: `${marker} A`,
          origem: origin,
          destino: destination,
          distancia_km: 8,
          pontos: points
        });
        routeB = await create('rotas', {
          nome: `${marker} B`,
          origem: origin,
          destino: destination,
          distancia_km: 12,
          pontos: [{ lat: -23.55, lng: -46.63 }, { lat: -23.57, lng: -46.64 }, points[1]]
        });
        routeLimit = await create('rotas', {
          nome: `${marker} limite`,
          origem: origin,
          destino: destination,
          distancia_km: 10,
          pontos: points
        });
        expectStatus(
          await request('POST', '/rotas', adminToken, {
            nome: `${marker} inválida`,
            origem: origin,
            destino: destination,
            distancia_km: 8,
            pontos: [points[0]]
          }),
          400,
          'mínimo de pontos'
        );
        expectStatus(
          await request('POST', '/rotas', adminToken, {
            nome: routeA.nome,
            origem: origin,
            destino: destination,
            distancia_km: 8,
            pontos: points
          }),
          409,
          'nome único'
        );
        const edited = expectStatus(
          await request('PUT', `/rotas/${routeB.id}`, adminToken, { nome: `${marker} B editada` }),
          200
        ).dados;
        assert.equal(edited.nome, `${marker} B editada`);
        const found = expectStatus(
          await request('GET', `/rotas/${routeA.id}`, operatorToken),
          200
        ).dados;
        assert.equal(Number(found.distancia_km), 8);
        assert.equal(found.pontos.length, 2);
      });

      await t.test('06: entregas, autoria, capacidade e relações', async () => {
        expectStatus(
          await request('POST', '/entregas', operatorToken, deliveryPayload({ peso_kg: 501 })),
          400,
          'carga excedente'
        );
        expectStatus(
          await request(
            'POST',
            '/entregas',
            operatorToken,
            deliveryPayload({ veiculo_id: vehicleMaintenance.id })
          ),
          409,
          'veículo em manutenção'
        );
        expectStatus(
          await request('POST', '/entregas', operatorToken, deliveryPayload({ peso_kg: 0 })),
          400,
          'peso zero'
        );
        expectStatus(
          await request(
            'POST',
            '/entregas',
            operatorToken,
            deliveryPayload({ origem: `${marker} outra`, rota_id: routeA.id })
          ),
          400,
          'rota incompatível'
        );
        expectStatus(
          await request(
            'POST',
            '/entregas',
            operatorToken,
            deliveryPayload({ usuario_id: ownAdmin.id })
          ),
          400,
          'não aceitar autoria fornecida pelo cliente'
        );
        delivery = await create('entregas', deliveryPayload(), operatorToken);
        secondDelivery = await create(
          'entregas',
          deliveryPayload({ descricao: `${marker} segunda` }),
          operatorToken
        );
        assert.equal(delivery.usuario_id, operatorId, 'autor deriva do token');
        assert.match(delivery.codigo, /^ULF-\d+$/);
        expectStatus(
          await request('DELETE', `/veiculos/${vehicle.id}`, adminToken),
          409,
          'preservar veículo vinculado'
        );
        expectStatus(
          await request('DELETE', `/entregas/${delivery.id}`, operatorToken),
          403,
          'operador não exclui'
        );
        expectStatus(
          await request('PUT', `/entregas/${delivery.id}`, operatorToken, { prazo_min: 0 }),
          400,
          'prazo zero'
        );
        const found = expectStatus(
          await request('GET', `/entregas/${delivery.id}`, operatorToken),
          200
        ).dados;
        assert.equal(found.veiculo.id, vehicle.id);
        assert.equal(found.usuario.id, operatorId);
        withoutSecrets(found);
      });

      await t.test('07: estados, disputa por veículo e liberação após conclusão', async () => {
        expectStatus(
          await request('PUT', `/entregas/${delivery.id}`, operatorToken, {
            status: 'em_andamento'
          }),
          400,
          'não inicia sem rota'
        );
        expectStatus(
          await request('PUT', `/entregas/${delivery.id}`, operatorToken, { status: 'concluida' }),
          409,
          'não pula estado'
        );
        expectStatus(
          await request('PUT', `/entregas/${delivery.id}`, operatorToken, { rota_id: routeA.id }),
          200,
          'escolher rota'
        );
        expectStatus(
          await request('PUT', `/entregas/${secondDelivery.id}`, operatorToken, {
            rota_id: routeA.id
          }),
          200,
          'escolher segunda rota'
        );
        const competing = await Promise.all([
          request('PUT', `/entregas/${delivery.id}`, operatorToken, { status: 'em_andamento' }),
          request('PUT', `/entregas/${secondDelivery.id}`, ownOperatorToken, {
            status: 'em_andamento'
          })
        ]);
        assert.deepEqual(
          competing.map((r) => r.status).sort(),
          [200, 409],
          'somente uma entrega inicia'
        );
        const winner = competing[0].status === 200 ? delivery : secondDelivery;
        const loser = competing[0].status === 200 ? secondDelivery : delivery;
        assert.equal(
          expectStatus(await request('GET', `/veiculos/${vehicle.id}`, operatorToken), 200).dados
            .ocupado,
          true
        );
        expectStatus(
          await request('PUT', `/veiculos/${vehicle.id}`, adminToken, { status: 'manutencao' }),
          409,
          'ocupado não entra em manutenção'
        );
        expectStatus(
          await request('PUT', `/veiculos/${vehicle.id}`, adminToken, { capacidade_kg: 50 }),
          409,
          'ocupado mantém capacidade'
        );
        expectStatus(
          await request('PUT', `/entregas/${winner.id}`, operatorToken, {
            descricao: `${marker} alteração tardia`
          }),
          409,
          'dados gerais após início'
        );
        expectStatus(
          await request('PUT', `/entregas/${winner.id}`, operatorToken, { status: 'concluida' }),
          200,
          'concluir'
        );
        expectStatus(
          await request('PUT', `/entregas/${winner.id}`, operatorToken, { status: 'pendente' }),
          409,
          'estado terminal não retrocede'
        );
        assert.equal(
          expectStatus(await request('GET', `/veiculos/${vehicle.id}`, operatorToken), 200).dados
            .ocupado,
          false
        );
        expectStatus(
          await request('PUT', `/entregas/${loser.id}`, operatorToken, { status: 'cancelada' }),
          200,
          'cancelar pendente'
        );
      });

      await t.test('08: previsão dos dois cenários, igualdade com prazo e validação', async () => {
        const before = expectStatus(
          await request('GET', `/simulacoes?entrega_id=${delivery.id}`, operatorToken),
          200
        ).total;
        const normal = expectStatus(
          await request('POST', '/simulacoes/prever', operatorToken, {
            entrega_id: delivery.id,
            cenario: 'normal'
          }),
          200
        ).dados;
        const lento = expectStatus(
          await request('POST', '/simulacoes/prever', operatorToken, {
            entrega_id: delivery.id,
            cenario: 'lento'
          }),
          200
        ).dados;
        assert.equal(normal.recomendada_id, routeA.id);
        assert.equal(normal.velocidade_kmh, 30);
        assert.equal(lento.velocidade_kmh, 20);
        const nA = normal.resultados.find((r) => r.rota_id === routeA.id),
          nB = normal.resultados.find((r) => r.rota_id === routeB.id);
        const lA = lento.resultados.find((r) => r.rota_id === routeA.id),
          lB = lento.resultados.find((r) => r.rota_id === routeB.id);
        assert.deepEqual(
          [nA.tempo_min, nB.tempo_min, lA.tempo_min, lB.tempo_min],
          [16, 24, 24, 36]
        );
        assert.deepEqual(
          [nA.dentro_prazo, nB.dentro_prazo, lA.dentro_prazo, lB.dentro_prazo],
          [true, false, false, false]
        );
        const boundary = normal.resultados.find((r) => r.rota_id === routeLimit.id);
        assert.equal(boundary.tempo_min, 20);
        assert.equal(boundary.dentro_prazo, true, 'igualdade com prazo é aceita');
        assert.equal(
          expectStatus(
            await request('GET', `/simulacoes?entrega_id=${delivery.id}`, operatorToken),
            200
          ).total,
          before,
          'prever não grava'
        );
        expectStatus(
          await request('POST', '/simulacoes/prever', operatorToken, {
            entrega_id: delivery.id,
            cenario: 'chuva'
          }),
          400,
          'cenário não cadastrado'
        );
        expectStatus(
          await request('POST', '/simulacoes/prever', operatorToken, {
            entrega_id: 999999999,
            cenario: 'normal'
          }),
          404,
          'entrega inexistente'
        );
      });

      await t.test('09: simulação persistida, autoria, atualização e vínculos', async () => {
        expectStatus(
          await request('POST', '/simulacoes', operatorToken, {
            entrega_id: delivery.id,
            cenario: 'normal',
            usuario_id: ownAdmin.id
          }),
          400,
          'não aceitar autoria na simulação'
        );
        saved = await create(
          'simulacoes',
          { entrega_id: delivery.id, cenario: 'normal' },
          operatorToken
        );
        assert.equal(saved.usuario_id, operatorId);
        assert.equal(saved.rota_id, routeA.id);
        const found = expectStatus(
          await request('GET', `/simulacoes/${saved.id}`, operatorToken),
          200
        ).dados;
        assert.equal(found.id, saved.id);
        assert.equal(found.resultados.find((r) => r.rota_id === routeA.id).tempo_min, 16);
        expectStatus(
          await request('PUT', `/rotas/${routeB.id}`, adminToken, { distancia_km: 14 }),
          200,
          'alterar somente rota própria do teste'
        );
        const historical = expectStatus(
          await request('GET', `/simulacoes/${saved.id}`, operatorToken),
          200
        ).dados;
        assert.equal(
          historical.resultados.find((r) => r.rota_id === routeB.id).tempo_min,
          24,
          'retrato salvo conserva o cálculo original'
        );
        const fresh = expectStatus(
          await request('POST', '/simulacoes/prever', operatorToken, {
            entrega_id: delivery.id,
            cenario: 'normal'
          }),
          200
        ).dados;
        assert.equal(
          fresh.resultados.find((r) => r.rota_id === routeB.id).tempo_min,
          28,
          'nova previsão usa cadastro atualizado'
        );
        expectStatus(
          await request('PUT', `/simulacoes/${saved.id}`, ownOperatorToken, {
            cenario: 'lento',
            usuario_id: ownAdmin.id
          }),
          400,
          'não aceitar mudança de autoria'
        );
        const updated = expectStatus(
          await request('PUT', `/simulacoes/${saved.id}`, ownOperatorToken, { cenario: 'lento' }),
          200
        ).dados;
        assert.equal(updated.usuario_id, operatorId, 'autor original preservado');
        assert.equal(updated.atualizado_por_id, ownOperator.id, 'editor autenticado registrado');
        assert.equal(updated.resultados.find((r) => r.rota_id === routeA.id).tempo_min, 24);
        assert.equal(updated.resultados.find((r) => r.rota_id === routeB.id).tempo_min, 42);
        expectStatus(
          await request('PUT', `/simulacoes/${saved.id}`, operatorToken, {
            entrega_id: secondDelivery.id,
            cenario: 'normal'
          }),
          400,
          'não trocar entrega do histórico'
        );
        expectStatus(
          await request('DELETE', `/simulacoes/${saved.id}`, operatorToken),
          403,
          'operador não exclui histórico'
        );
        expectStatus(
          await request('DELETE', `/rotas/${routeA.id}`, adminToken),
          409,
          'rota vinculada'
        );
        expectStatus(
          await request('DELETE', `/entregas/${delivery.id}`, adminToken),
          409,
          'entrega com histórico'
        );
        expectStatus(
          await request('DELETE', `/usuarios/${ownOperator.id}`, adminToken),
          409,
          'editor vinculado'
        );
        const filtered = expectStatus(
          await request('GET', `/simulacoes?entrega_id=${delivery.id}`, operatorToken),
          200
        );
        assert.ok(filtered.dados.some((s) => s.id === saved.id));
        assert.ok(filtered.dados.every((s) => s.entrega_id === delivery.id));
        withoutSecrets(filtered);
      });

      await t.test('10: filtros, paginação e consistência dos indicadores', async () => {
        const page = expectStatus(
          await request(
            'GET',
            `/entregas?busca=${encodeURIComponent(marker)}&pagina=1&limite=1`,
            operatorToken
          ),
          200
        );
        assert.equal(page.pagina, 1);
        assert.equal(page.limite, 1);
        assert.equal(page.dados.length, 1);
        assert.equal(page.total, 2);
        const filtered = expectStatus(
          await request(
            'GET',
            `/entregas?busca=${encodeURIComponent(marker)}&status=concluida&data=${today}`,
            operatorToken
          ),
          200
        );
        assert.equal(filtered.total, 1);
        assert.ok(
          filtered.dados.every((d) => d.status === 'concluida' && d.data_agendada === today)
        );
        expectStatus(
          await request('GET', '/entregas?pagina=0', operatorToken),
          400,
          'página abaixo do limite'
        );
        expectStatus(
          await request('GET', '/entregas?limite=101', operatorToken),
          400,
          'limite acima de 100'
        );
        const dashboard = expectStatus(await request('GET', '/painel', operatorToken), 200).dados;
        assert.equal(
          dashboard.total_entregas,
          dashboard.pendentes + dashboard.em_andamento + dashboard.concluidas + dashboard.canceladas
        );
        assert.ok(dashboard.veiculos_disponiveis <= dashboard.total_veiculos);
        assert.ok(dashboard.tempo_medio_min >= 0);
        assert.ok(
          dashboard.dentro_prazo_percentual >= 0 && dashboard.dentro_prazo_percentual <= 100
        );
        assert.ok(Array.isArray(dashboard.ultimas_entregas));
      });
    } finally {
      if (adminToken) {
        const failures = [];
        for (const resource of ['simulacoes', 'entregas', 'rotas', 'veiculos', 'usuarios']) {
          for (const id of [...cleanup[resource]].reverse()) {
            try {
              const result = await request('DELETE', `/${resource}/${id}`, adminToken);
              if (![200, 404].includes(result.status))
                failures.push(`${resource}/${id}: ${result.status} ${JSON.stringify(result.body)}`);
              else if (result.status === 200)
                expectStatus(
                  await request('GET', `/${resource}/${id}`, adminToken),
                  404,
                  'exclusão persistida'
                );
            } catch (error) {
              failures.push(`${resource}/${id}: ${error.message}`);
            }
          }
        }
        assert.deepEqual(
          failures,
          [],
          `Limpeza de registros exclusivos do teste: ${failures.join('; ')}`
        );
      }
    }
  }
);
