'use strict';
(async () => {
  const {
    $,
    $$,
    api,
    auth,
    all,
    escape,
    number,
    date,
    badge,
    params,
    pagination,
    empty,
    dialog,
    formError,
    busy,
    toast,
    confirmDelete,
    showPageError,
    clearPageError
  } = UL;
  if (!(await auth())) return;
  const deliveryModal = dialog('#delivery-dialog'),
    statusModal = dialog('#status-dialog');
  let page = 1,
    rows = [],
    vehicles = [],
    routes = [],
    editing = null,
    statusId = null,
    loading = false;
  if (new URLSearchParams(location.search).has('agenda')) {
    $('#page-title').textContent = 'Agenda de entregas';
    const today = new Date();
    $('#data-filter').value =
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }
  async function load(next = page) {
    if (loading) return;
    loading = true;
    page = next;
    try {
      const query = () =>
        `/entregas?${params({ pagina: page, limite: 10, busca: $('#busca').value.trim(), status: $('#status-filter').value, data: $('#data-filter').value })}`;
      let result = await api(query());
      if (page > 1 && !result.dados.length) {
        page = Math.max(1, Math.ceil(result.total / result.limite));
        result = await api(query());
      }
      clearPageError();
      rows = result.dados;
      $('#deliveries').innerHTML = rows.length
        ? rows
            .map(
              (item) =>
                `<tr><td class="description"><strong>${escape(item.codigo)}</strong>${escape(item.descricao)}<small>${escape(item.usuario?.nome || '—')}</small></td><td class="description">${escape(item.origem)} → ${escape(item.destino)}<small>${escape(item.rota?.nome || 'Rota a escolher')}</small></td><td>${escape(item.veiculo?.nome || '—')}<small>${number(item.peso_kg, 2)} kg</small></td><td>${date(item.data_agendada)}<small>${number(item.prazo_min)} min de prazo</small></td><td>${badge(item.status)}</td><td><div class="actions">${item.status === 'pendente' ? `<button class="btn secondary small" data-edit="${item.id}" type="button">Editar</button><a class="btn secondary small" href="/simulacao.html?entrega=${item.id}">Simular</a>` : ''}${['pendente', 'em_andamento'].includes(item.status) ? `<button class="btn secondary small" data-status="${item.id}" type="button">Status</button>` : ''}${UL.user.tipo === 'administrador' ? `<button class="btn danger small" type="button" data-delete="${item.id}">Excluir</button>` : ''}</div></td></tr>`
            )
            .join('')
        : empty(6, 'Nenhuma entrega encontrada.', 'Cadastre uma entrega ou ajuste os filtros.');
      pagination($('#pagination'), result, load);
      $$('[data-edit]').forEach((el) =>
        el.addEventListener('click', () => openDelivery(Number(el.dataset.edit)))
      );
      $$('[data-status]').forEach((el) =>
        el.addEventListener('click', () => openStatus(Number(el.dataset.status)))
      );
      $$('[data-delete]').forEach((el) =>
        el.addEventListener('click', () => {
          const item = rows.find((row) => row.id === Number(el.dataset.delete));
          confirmDelete('entregas', item.id, `a entrega ${item.codigo}`, () => load(page));
        })
      );
    } catch (error) {
      showPageError(error.message);
    } finally {
      loading = false;
    }
  }
  async function resources() {
    const [v, r] = await Promise.all([all('/veiculos'), all('/rotas')]);
    vehicles = v;
    routes = r;
    $('#origens').innerHTML = [...new Set(routes.map((r) => r.origem))]
      .map((v) => `<option value="${escape(v)}"></option>`)
      .join('');
    $('#destinos').innerHTML = [...new Set(routes.map((r) => r.destino))]
      .map((v) => `<option value="${escape(v)}"></option>`)
      .join('');
  }
  function routeOptions(selected = '') {
    const origin = $('#origem').value.trim().toLocaleLowerCase(),
      destination = $('#destino').value.trim().toLocaleLowerCase();
    $('#rota').innerHTML =
      '<option value="">Escolher depois na simulação</option>' +
      routes
        .filter(
          (r) =>
            r.origem.toLocaleLowerCase() === origin && r.destino.toLocaleLowerCase() === destination
        )
        .map(
          (r) =>
            `<option value="${r.id}">${escape(r.nome)} · ${number(r.distancia_km, 2)} km</option>`
        )
        .join('');
    $('#rota').value = selected ? String(selected) : '';
  }
  async function openDelivery(id = null) {
    const button = $('#new-delivery');
    busy(button, true, 'Carregando…');
    try {
      await resources();
      editing = id;
      const item = id ? rows.find((r) => r.id === id) : null;
      const form = $('#delivery-form');
      form.reset();
      formError(form, '');
      $('#delivery-title').textContent = id ? `Editar ${item.codigo}` : 'Nova entrega';
      $('#veiculo').innerHTML =
        '<option value="">Selecione um veículo</option>' +
        vehicles
          .filter((v) => (v.status === 'disponivel' && !v.ocupado) || v.id === item?.veiculo_id)
          .map(
            (v) =>
              `<option value="${v.id}">${escape(v.nome)} · ${number(v.capacidade_kg, 2)} kg${v.ocupado ? ' · em operação' : ''}</option>`
          )
          .join('');
      if (item) {
        [
          'descricao',
          'origem',
          'destino',
          'peso_kg',
          'prazo_min',
          'data_agendada',
          'veiculo_id'
        ].forEach((name) => (form.elements[name].value = item[name] ?? ''));
      } else {
        const today = new Date();
        form.elements.data_agendada.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      }
      routeOptions(item?.rota_id);
      deliveryModal.showModal();
    } catch (error) {
      toast(error.message, true);
    } finally {
      busy(button, false);
    }
  }
  $('#origem').addEventListener('input', () => routeOptions());
  $('#destino').addEventListener('input', () => routeOptions());
  $('#new-delivery').addEventListener('click', () => openDelivery());
  $('#delivery-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget,
      button = $('button[type=submit]', form);
    formError(form, '');
    busy(button, true);
    const body = {
      descricao: form.elements.descricao.value.trim(),
      origem: form.elements.origem.value.trim(),
      destino: form.elements.destino.value.trim(),
      peso_kg: Number(form.elements.peso_kg.value),
      prazo_min: Number(form.elements.prazo_min.value),
      data_agendada: form.elements.data_agendada.value,
      veiculo_id: Number(form.elements.veiculo_id.value),
      rota_id: form.elements.rota_id.value ? Number(form.elements.rota_id.value) : null
    };
    try {
      await api(`/entregas${editing ? `/${editing}` : ''}`, {
        method: editing ? 'PUT' : 'POST',
        body
      });
      deliveryModal.close();
      toast(
        editing ? 'Entrega atualizada.' : 'Entrega cadastrada. Agora você pode simular o percurso.'
      );
      await load(editing ? page : 1);
    } catch (error) {
      formError(form, error.message);
    } finally {
      busy(button, false);
    }
  });
  function openStatus(id) {
    const item = rows.find((r) => r.id === id);
    statusId = id;
    $('#status-summary').textContent = `${item.codigo} · ${item.descricao}`;
    $('#new-status').innerHTML =
      '<option value="">Selecione a próxima etapa</option>' +
      (item.status === 'pendente'
        ? `<option value="em_andamento" ${!item.rota_id ? 'disabled' : ''}>Iniciar entrega</option><option value="cancelada">Cancelar entrega</option>`
        : '<option value="concluida">Concluir entrega</option><option value="cancelada">Cancelar entrega</option>');
    $('#status-help').textContent =
      item.status === 'pendente' && !item.rota_id
        ? 'Escolha uma rota na simulação antes de iniciar a entrega.'
        : 'Entregas concluídas ou canceladas não retornam às etapas anteriores.';
    formError($('#status-form'), '');
    statusModal.showModal();
  }
  $('#status-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget,
      button = $('button[type=submit]', form);
    busy(button, true);
    formError(form, '');
    try {
      await api(`/entregas/${statusId}`, {
        method: 'PUT',
        body: { status: $('#new-status').value }
      });
      statusModal.close();
      toast('Status da entrega atualizado.');
      await load();
    } catch (error) {
      formError(form, error.message);
    } finally {
      busy(button, false);
    }
  });
  $('#filters').addEventListener('submit', (event) => {
    event.preventDefault();
    load(1);
  });
  $('#clear-filters').addEventListener('click', () => {
    $('#filters').reset();
    load(1);
  });
  await load();
})();
