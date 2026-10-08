// Verifica o fluxo real pelo navegador, usando dados temporários e MySQL.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const output = path.resolve(__dirname, '../output/verificacao');
const results = [];
const created = { simulacoes: [], entregas: [], rotas: [], veiculos: [], usuarios: [] };
let adminToken;

async function request(resource, method = 'GET', body, token = adminToken) {
  const response = await fetch(`${base}/api${resource}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000)
  });
  const data = await response.json();
  assert.ok(response.ok, `${method} ${resource}: ${response.status} ${data.mensagem || ''}`);
  return data;
}

async function record(name, action) {
  const start = Date.now();
  try {
    await action();
    results.push({ caso: name, resultado: 'Passou', duracao_ms: Date.now() - start });
    console.log(`PASSOU: ${name}`);
  } catch (error) {
    results.push({ caso: name, resultado: 'Falhou', detalhe: error.message });
    throw error;
  }
}

async function noOverflow(page, name) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1
  );
  assert.equal(overflow, false, `A página ${name} excede a largura da tela.`);
}

async function screenshot(page, file) {
  await page.screenshot({ path: path.join(output, `${file}.png`), fullPage: true });
}

async function login(page, profile) {
  await page.goto(`${base}/login.html`);
  await page.locator(`[data-demo="${profile}"]`).click();
  await page.getByRole('button', { name: 'Entrar na plataforma' }).click();
  await page.waitForURL('**/painel.html');
  await page.locator('#app-header .user-area').waitFor();
}

async function main() {
  await fs.mkdir(output, { recursive: true });
  adminToken = (
    await request('/login', 'POST', { email: 'admin@urbanlink.local', senha: 'Admin@123' }, null)
  ).token;
  const runId = Date.now().toString(36);
  const origin = `Centro de verificação ${runId}`;
  const destination = `Mercado de verificação ${runId}`;
  const vehicle = (
    await request('/veiculos', 'POST', {
      nome: `Van de verificação ${runId}`,
      placa: `V${runId}`.slice(0, 15),
      capacidade_kg: 500,
      status: 'disponivel'
    })
  ).dados;
  created.veiculos.push(vehicle.id);
  for (const [name, distance, middle] of [
    ['Central', 8, -46.632],
    ['Parque', 12, -46.641]
  ]) {
    const route = (
      await request('/rotas', 'POST', {
        nome: `${name} verificação ${runId}`,
        origem: origin,
        destino: destination,
        distancia_km: distance,
        pontos: [
          { lat: -23.5508, lng: -46.6338 },
          { lat: -23.546, lng: middle },
          { lat: -23.5418, lng: -46.6295 }
        ]
      })
    ).dados;
    created.rotas.push(route.id);
  }
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch {
    try {
      browser = await chromium.launch({ headless: true });
    } catch {
      throw new Error(
        'Instale Google Chrome ou execute npx.cmd playwright install chromium para verificar a interface.'
      );
    }
  }
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'pt-BR'
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  let deliveryId, deliveryDate;
  const description = `Entrega de verificação ${runId}`;
  try {
    await record('Página inicial: imagens, navegação e visual em computador', async () => {
      await page.goto(base);
      await page.getByRole('heading', { level: 1 }).waitFor();
      assert.match(await page.title(), /UrbanLink/);
      assert.ok(
        await page
          .locator('.home-logo')
          .first()
          .evaluate((img) => img.complete && img.naturalWidth > 0)
      );
      await noOverflow(page, 'Início desktop');
      await screenshot(page, 'inicio-desktop');
    });
    await record('Página protegida redireciona visitante ao login', async () => {
      await page.goto(`${base}/entregas.html`);
      await page.waitForURL('**/login.html');
      await screenshot(page, 'login-desktop');
    });
    await record('Login inválido apresenta mensagem e mantém visitante fora', async () => {
      await page.locator('#email').fill('operador@urbanlink.local');
      await page.locator('#senha').fill('senha-invalida-123');
      await page.getByRole('button', { name: 'Entrar na plataforma' }).click();
      await page.locator('#login-form .form-error:not([hidden])').waitFor();
      assert.match(page.url(), /login\.html$/);
    });
    await record('Administrador entra e acessa cadastros', async () => {
      await login(page, 'administrador');
      await page.getByRole('link', { name: 'Cadastros', exact: true }).waitFor();
      await screenshot(page, 'painel-desktop');
      await page.goto(`${base}/cadastros.html`);
      await page.locator('#new-record').waitFor();
      await page.locator('#records [data-edit]').first().waitFor();
      await page.locator('[data-resource="usuarios"]').click();
      await page.getByText('admin@urbanlink.local', { exact: true }).waitFor();
      await screenshot(page, 'cadastros-desktop');
    });
    await record('Nova entrega é criada pelo formulário e reaparece na tabela', async () => {
      await page.goto(`${base}/entregas.html`);
      await page.locator('#app-header .user-area').waitFor();
      await page.locator('#deliveries [data-edit]').first().waitFor();
      await page.locator('#new-delivery').click();
      await page.locator('#delivery-dialog[open]').waitFor();
      const form = page.locator('#delivery-form');
      await form.locator('[name="descricao"]').fill(description);
      await form.locator('[name="origem"]').fill(origin);
      await form.locator('[name="destino"]').fill(destination);
      await form.locator('[name="peso_kg"]').fill('100');
      await form.locator('[name="prazo_min"]').fill('20');
      deliveryDate = await form.locator('[name="data_agendada"]').inputValue();
      await form.locator('[name="veiculo_id"]').selectOption(String(vehicle.id));
      await form.getByRole('button', { name: 'Salvar entrega' }).click();
      await page.locator('#delivery-dialog').waitFor({ state: 'hidden' });
      await page.locator('#deliveries').getByText(description, { exact: false }).waitFor();
      deliveryId = (await request(`/entregas?busca=${encodeURIComponent(description)}`)).dados[0]
        .id;
      created.entregas.push(deliveryId);
      await screenshot(page, 'entregas-desktop');
    });
    await record('Filtros de busca, status e data mostram a entrega correta', async () => {
      await page.locator('#busca').fill(description);
      await page.locator('#status-filter').selectOption('pendente');
      await page.locator('#data-filter').fill(deliveryDate);
      let done = page.waitForResponse(
        (r) => r.url().includes('/api/entregas?') && r.request().method() === 'GET'
      );
      await page.locator('#filters button[type="submit"]').click();
      await done;
      await page.locator('#deliveries').getByText(description, { exact: false }).waitFor();
      assert.equal(await page.locator('#deliveries tr').count(), 1);
      await page.locator('#status-filter').selectOption('concluida');
      done = page.waitForResponse(
        (r) => r.url().includes('/api/entregas?') && r.request().method() === 'GET'
      );
      await page.locator('#filters button[type="submit"]').click();
      await done;
      await page
        .locator('#deliveries')
        .getByText('Nenhuma entrega encontrada.', { exact: true })
        .waitFor();
      await page.locator('#clear-filters').click();
      await page.locator('#deliveries').getByText(description, { exact: false }).waitFor();
    });
    await record('Simulação normal mostra 16 e 24 minutos e cumprimento de prazo', async () => {
      await page.goto(`${base}/simulacao.html?entrega=${deliveryId}`);
      await page.locator('#delivery-select').waitFor();
      await page.locator('#delivery-select').selectOption(String(deliveryId));
      await page.locator('#scenario').selectOption('normal');
      await page.locator('#preview-form button[type="submit"]').click();
      await page.locator('#route-results .route-card').first().waitFor();
      assert.equal(await page.locator('#route-results .route-card').count(), 2);
      const text = await page.locator('#route-results').innerText();
      assert.match(text, /16/);
      assert.match(text, /24/);
      assert.match(text, /Dentro do prazo/i);
      await screenshot(page, 'simulacao-normal-desktop');
    });
    await record('Seleção permanece travada enquanto a previsão está sendo calculada', async () => {
      const pattern = '**/api/simulacoes/prever';
      await page.route(pattern, async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await route.continue();
      });
      try {
        const done = page.waitForResponse(
          (r) => r.url().endsWith('/api/simulacoes/prever') && r.request().method() === 'POST'
        );
        await page.locator('#preview-form button[type="submit"]').click();
        assert.equal(await page.locator('#delivery-select').isDisabled(), true);
        assert.equal(await page.locator('#scenario').isDisabled(), true);
        await done;
        await page.waitForFunction(() => document.querySelector('#scenario')?.disabled === false);
        assert.equal(await page.locator('#scenario').inputValue(), 'normal');
        assert.match(await page.locator('#route-results').innerText(), /16/);
      } finally {
        await page.unroute(pattern);
      }
    });
    await record('Cenário lento mostra 24 e 36 minutos e prazo ultrapassado', async () => {
      await page.locator('#scenario').selectOption('lento');
      const done = page.waitForResponse(
        (r) => r.url().endsWith('/api/simulacoes/prever') && r.request().method() === 'POST'
      );
      await page.locator('#preview-form button[type="submit"]').click();
      await done;
      await page.waitForFunction(() =>
        document.querySelector('#route-results')?.textContent.includes('36')
      );
      const text = await page.locator('#route-results').innerText();
      assert.match(text, /24/);
      assert.match(text, /36/);
      assert.match(text, /Fora do prazo/i);
      await screenshot(page, 'simulacao-lenta-desktop');
    });
    await record('Salvar persiste a simulação e confirmar escolhe a rota da entrega', async () => {
      const done = page.waitForResponse(
        (r) => r.url().endsWith('/api/simulacoes') && r.request().method() === 'POST'
      );
      await page.locator('#save-simulation').click();
      const response = await done;
      const saved = (await response.json()).dados;
      created.simulacoes.push(saved.id);
      await page.waitForFunction(
        () => document.querySelector('#save-simulation')?.textContent === 'Simulação salva'
      );
      await page.locator('#confirm-route').click();
      await page.locator('#toast').filter({ hasText: /Rota/i }).waitFor();
      assert.equal((await request(`/entregas/${deliveryId}`)).dados.rota_id, created.rotas[0]);
      assert.equal((await request(`/simulacoes/${saved.id}`)).dados.cenario, 'lento');
    });
    await record('Histórico permite consultar e recalcular a simulação pela tela', async () => {
      const id = created.simulacoes[0];
      await page.locator(`[data-view="${id}"]`).click();
      await page.waitForFunction(() =>
        document.querySelector('#result-summary')?.textContent.includes('Resultado salvo')
      );
      await page.locator(`[data-scenario="${id}"]`).click();
      await page.locator('#new-scenario').selectOption('normal');
      await page.locator('#scenario-form button[type="submit"]').click();
      await page.locator('#scenario-dialog').waitFor({ state: 'hidden' });
      assert.equal((await request(`/simulacoes/${id}`)).dados.cenario, 'normal');
      await page.waitForFunction(() =>
        document.querySelector('#route-results')?.textContent.includes('16')
      );
    });
    await record('Fluxo de status inicia e conclui a entrega e libera o veículo', async () => {
      await page.goto(`${base}/entregas.html`);
      const button = page.locator(`[data-status="${deliveryId}"]`);
      await button.click();
      await page.locator('#new-status').selectOption('em_andamento');
      await page.locator('#status-form button[type="submit"]').click();
      await page.locator('#status-dialog').waitFor({ state: 'hidden' });
      await page
        .locator('#deliveries tr')
        .filter({ hasText: description })
        .locator('.badge.em_andamento')
        .waitFor();
      assert.equal((await request(`/entregas/${deliveryId}`)).dados.status, 'em_andamento');
      assert.equal((await request(`/veiculos/${vehicle.id}`)).dados.ocupado, true);
      await button.click();
      await page.locator('#new-status').selectOption('concluida');
      await page.locator('#status-form button[type="submit"]').click();
      await page.locator('#status-dialog').waitFor({ state: 'hidden' });
      assert.equal((await request(`/entregas/${deliveryId}`)).dados.status, 'concluida');
      assert.equal((await request(`/veiculos/${vehicle.id}`)).dados.ocupado, false);
    });
    await record('Histórico exclui somente a simulação selecionada após confirmação', async () => {
      const id = created.simulacoes[0];
      await page.goto(`${base}/simulacao.html`);
      await page.locator(`[data-delete="${id}"]`).click();
      await page.locator('#confirm-form button[type="submit"]').click();
      await page.locator('#confirm-dialog').waitFor({ state: 'hidden' });
      assert.equal(
        (
          await fetch(`${base}/api/simulacoes/${id}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
          })
        ).status,
        404
      );
      created.simulacoes = created.simulacoes.filter((value) => value !== id);
    });
    for (const resource of ['veiculos', 'rotas', 'usuarios']) {
      await record(`Formulário administrativo: criar, editar e excluir ${resource}`, async () => {
        await page.goto(`${base}/cadastros.html`);
        await page.locator('#records [data-edit]').first().waitFor();
        if (resource !== 'veiculos') {
          const ready = page.waitForResponse(
            (r) => r.url().includes(`/api/${resource}?`) && r.request().method() === 'GET'
          );
          await page.locator(`[data-resource="${resource}"]`).click();
          await ready;
        }
        await page.locator('#new-record').click();
        await page.locator('#record-dialog[open]').waitFor();
        const form = page.locator('#record-form');
        const name = `Cadastro ${resource} ${runId}`;
        await form.locator('[name="nome"]').fill(name);
        if (resource === 'veiculos') {
          await form.locator('[name="placa"]').fill(`GUI${runId}`.slice(0, 12));
          await form.locator('[name="capacidade_kg"]').fill('700');
        } else if (resource === 'usuarios') {
          await form.locator('[name="email"]').fill(`gui-${runId}@urbanlink.local`);
          await form.locator('[name="senha"]').fill('Verificacao@123');
        } else {
          await form.locator('[name="origem"]').fill(`Origem GUI ${runId}`);
          await form.locator('[name="destino"]').fill(`Destino GUI ${runId}`);
          await form.locator('[name="distancia_km"]').fill('10');
          await form.locator('[data-point-lat]').nth(0).fill('-23.55');
          await form.locator('[data-point-lng]').nth(0).fill('-46.63');
          await form.locator('[data-point-lat]').nth(1).fill('-23.56');
          await form.locator('[data-point-lng]').nth(1).fill('-46.64');
        }
        const posted = page.waitForResponse(
          (r) => r.url().endsWith(`/api/${resource}`) && r.request().method() === 'POST'
        );
        await form.getByRole('button', { name: 'Salvar cadastro' }).click();
        const added = (await (await posted).json()).dados;
        assert.ok(added?.id);
        created[resource].push(added.id);
        await page.locator('#record-dialog').waitFor({ state: 'hidden' });
        await page.locator(`[data-edit="${added.id}"]`).click();
        await form.locator('[name="nome"]').fill(`${name} atualizado`);
        await form.getByRole('button', { name: 'Salvar cadastro' }).click();
        await page.locator('#record-dialog').waitFor({ state: 'hidden' });
        assert.equal((await request(`/${resource}/${added.id}`)).dados.nome, `${name} atualizado`);
        await page.locator(`[data-delete="${added.id}"]`).click();
        await page.locator('#confirm-form button[type="submit"]').click();
        await page.locator('#confirm-dialog').waitFor({ state: 'hidden' });
        assert.equal(
          (
            await fetch(`${base}/api/${resource}/${added.id}`, {
              headers: { Authorization: `Bearer ${adminToken}` }
            })
          ).status,
          404
        );
        created[resource] = created[resource].filter((value) => value !== added.id);
      });
    }
    await record(
      'Indisponibilidade do mapa-base preserva as previsões e os percursos',
      async () => {
        await context.route('**/*.tile.openstreetmap.org/**', (route) => route.abort());
        await page.goto(`${base}/simulacao.html?entrega=${deliveryId}`);
        await page.locator('#delivery-select').selectOption(String(deliveryId));
        await page.locator('#preview-form button[type="submit"]').click();
        await page.locator('#route-results .route-card').first().waitFor();
        await page.locator('#map-status').filter({ hasText: 'indisponível' }).waitFor();
        assert.equal(await page.locator('#route-results .route-card').count(), 2);
        assert.ok((await page.locator('#route-map .leaflet-overlay-pane path').count()) > 0);
        await screenshot(page, 'mapa-sem-internet');
        await context.unroute('**/*.tile.openstreetmap.org/**');
      }
    );
    await record('Seis páginas cabem em celular e tablet', async () => {
      for (const device of [
        { name: 'celular', width: 390, height: 844 },
        { name: 'tablet', width: 768, height: 1024 }
      ]) {
        await page.setViewportSize({ width: device.width, height: device.height });
        for (const name of ['index', 'painel', 'entregas', 'simulacao', 'cadastros']) {
          await page.goto(`${base}/${name}.html`);
          if (name !== 'index') await page.locator('#app-header .user-area').waitFor();
          await noOverflow(page, `${name} ${device.name}`);
          await screenshot(page, `${name}-${device.name}`);
        }
        const guest = await context.newPage();
        await guest.setViewportSize({ width: device.width, height: device.height });
        await guest.goto(`${base}/login.html`);
        await noOverflow(guest, `login ${device.name}`);
        await screenshot(guest, `login-${device.name}`);
        await guest.close();
      }
    });
    await record('Operador usa a mesma tela de login e não acessa administração', async () => {
      const operatorContext = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        locale: 'pt-BR'
      });
      const operatorPage = await operatorContext.newPage();
      await login(operatorPage, 'operador');
      assert.equal(
        await operatorPage.getByRole('link', { name: 'Cadastros', exact: true }).count(),
        0
      );
      await operatorPage.goto(`${base}/cadastros.html`);
      await operatorPage.waitForURL('**/painel.html');
      await operatorPage.goto(`${base}/entregas.html`);
      await operatorPage.locator('#deliveries tr').first().waitFor();
      assert.equal(await operatorPage.locator('[data-delete]').count(), 0);
      await screenshot(operatorPage, 'operador-desktop');
      await operatorPage.getByRole('button', { name: 'Sair', exact: true }).click();
      await operatorPage.waitForURL('**/login.html');
      await operatorContext.close();
    });
    await record('API documentada carrega no navegador', async () => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`${base}/api/docs`);
      await page.locator('.swagger-ui .info .title').waitFor();
      assert.match(await page.locator('.swagger-ui .info .title').innerText(), /UrbanLink/);
    });
    await record('JavaScript executa o fluxo sem exceções', async () =>
      assert.deepEqual(errors, [])
    );
  } finally {
    await browser.close();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (adminToken)
      for (const resource of ['simulacoes', 'entregas', 'rotas', 'veiculos', 'usuarios']) {
        for (const id of created[resource]) {
          try {
            await request(`/${resource}/${id}`, 'DELETE');
          } catch (error) {
            console.error('Falha na limpeza do dado temporário:', error.message);
            process.exitCode = 1;
          }
        }
      }
    await fs.mkdir(output, { recursive: true });
    await fs.writeFile(
      path.join(output, 'resultado-interface.json'),
      JSON.stringify({ executado_em: new Date().toISOString(), casos: results }, null, 2)
    );
    console.log(
      `${results.filter((r) => r.resultado === 'Passou').length}/${results.length} casos da interface passaram. Evidências em output/verificacao.`
    );
  });
