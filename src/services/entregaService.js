const { Op } = require('sequelize');
const { sequelize, Entrega, Veiculo, Rota, Usuario, Simulacao } = require('../models');
const v = require('./validacao');
const incluir = [
  { model: Veiculo, as: 'veiculo' },
  { model: Rota, as: 'rota' },
  { model: Usuario, as: 'usuario', attributes: ['id', 'nome'] }
];
const camposGerais = [
  'descricao',
  'origem',
  'destino',
  'peso_kg',
  'prazo_min',
  'data_agendada',
  'veiculo_id',
  'rota_id'
];
const transicoes = {
  pendente: ['pendente', 'em_andamento', 'cancelada'],
  em_andamento: ['em_andamento', 'concluida', 'cancelada'],
  concluida: ['concluida'],
  cancelada: ['cancelada']
};
function validar(body, current) {
  v.objeto(body);
  v.semAutoria(body);
  const value = (key) => (body[key] === undefined ? current?.[key] : body[key]);
  const rota = value('rota_id');
  const dados = {
    descricao: v.texto(value('descricao'), 'Descrição', 200),
    origem: v.texto(value('origem'), 'Origem'),
    destino: v.texto(value('destino'), 'Destino'),
    peso_kg: v.numero(value('peso_kg'), 'Peso'),
    prazo_min: v.numero(value('prazo_min'), 'Prazo'),
    data_agendada: v.data(value('data_agendada')),
    veiculo_id: v.id(value('veiculo_id'), 'Veículo'),
    rota_id: rota === null || rota === undefined ? null : v.id(rota, 'Rota'),
    status: v.opcao(
      value('status') === undefined ? 'pendente' : value('status'),
      Object.keys(transicoes),
      'Status da entrega'
    )
  };
  if (v.corresponde(dados.origem, dados.destino))
    v.falhar(400, 'Origem e destino devem ser diferentes.');
  if (current) {
    if (!transicoes[current.status].includes(dados.status))
      v.falhar(409, 'Essa mudança de status não é permitida.');
    if (current.status !== 'pendente' && camposGerais.some((key) => dados[key] !== current[key]))
      v.falhar(409, 'Os dados da entrega só podem ser editados enquanto ela está pendente.');
  } else if (!['pendente', 'em_andamento'].includes(dados.status))
    v.falhar(400, 'Uma nova entrega deve estar pendente ou em andamento.');
  if (dados.status === 'em_andamento' && !dados.rota_id)
    v.falhar(400, 'Escolha uma rota antes de iniciar a entrega.');
  return dados;
}
async function validarVinculos(dados, current, transaction) {
  // Bloqueios em ordem fixa: duas requisições não podem ocupar o mesmo veículo.
  const ids = [...new Set([current?.veiculo_id, dados.veiculo_id].filter(Boolean))].sort(
    (a, b) => a - b
  );
  const veiculos = await Veiculo.findAll({
    where: { id: { [Op.in]: ids } },
    order: [['id', 'ASC']],
    transaction,
    lock: transaction.LOCK.UPDATE
  });
  const veiculo = veiculos.find((record) => record.id === dados.veiculo_id);
  if (!veiculo) v.falhar(404, 'Veículo não encontrado.');
  if (['pendente', 'em_andamento'].includes(dados.status)) {
    if (veiculo.status !== 'disponivel')
      v.falhar(409, 'O veículo está em manutenção. Escolha um veículo disponível.');
    if (dados.peso_kg > veiculo.capacidade_kg)
      v.falhar(400, 'O peso da entrega excede a capacidade do veículo.');
  }
  if (['pendente', 'em_andamento'].includes(dados.status)) {
    const where = { veiculo_id: dados.veiculo_id, status: 'em_andamento' };
    if (current) where.id = { [Op.ne]: current.id };
    const ativa = await Entrega.findOne({ where, transaction, lock: transaction.LOCK.UPDATE });
    if (ativa) v.falhar(409, 'Esse veículo já possui uma entrega em andamento.');
  }
  if (dados.rota_id) {
    const rota = await Rota.findByPk(dados.rota_id, { transaction, lock: transaction.LOCK.SHARE });
    if (!rota) v.falhar(404, 'Rota não encontrada.');
    if (!v.corresponde(rota.origem, dados.origem) || !v.corresponde(rota.destino, dados.destino))
      v.falhar(400, 'A rota deve ter a mesma origem e destino da entrega.');
  }
}
async function listar(query) {
  const page = v.paginacao(query);
  const busca = v.busca(query.busca);
  const where = {};
  if (query.status !== undefined)
    where.status = v.opcao(query.status, Object.keys(transicoes), 'Status da entrega');
  if (query.data !== undefined) where.data_agendada = v.data(query.data);
  if (busca) {
    where[Op.or] = ['descricao', 'origem', 'destino'].map((key) => ({
      [key]: { [Op.like]: `%${busca}%` }
    }));
    if (/^(?:ULF-)?\d+$/i.test(busca))
      where[Op.or].push({ id: Number(busca.replace(/^ULF-/i, '')) });
  }
  const result = await Entrega.findAndCountAll({
    where,
    include: incluir,
    distinct: true,
    order: [['id', 'DESC']],
    limit: page.limit,
    offset: page.offset
  });
  return { dados: result.rows, total: result.count, pagina: page.pagina, limite: page.limite };
}
async function obter(id) {
  const record = await Entrega.findByPk(id, { include: incluir });
  if (!record) v.falhar(404, 'Entrega não encontrada.');
  return record;
}
async function criar(body, actor) {
  const dados = validar(body);
  const createdId = await sequelize.transaction(async (transaction) => {
    await validarVinculos(dados, null, transaction);
    const record = await Entrega.create({ ...dados, usuario_id: actor.id }, { transaction });
    return record.id;
  });
  return obter(createdId);
}
async function atualizar(id, body) {
  v.objeto(body);
  const preview = await Entrega.findByPk(id);
  if (!preview) v.falhar(404, 'Entrega não encontrada.');
  const previsto = validar(body, preview);
  await sequelize.transaction(async (transaction) => {
    const ids = [...new Set([preview.veiculo_id, previsto.veiculo_id])].sort((a, b) => a - b);
    await Veiculo.findAll({
      where: { id: { [Op.in]: ids } },
      order: [['id', 'ASC']],
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    const record = await Entrega.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!record) v.falhar(404, 'Entrega não encontrada.');
    if (record.veiculo_id !== preview.veiculo_id)
      v.falhar(
        409,
        'A entrega foi alterada por outra operação. Atualize a página e tente novamente.'
      );
    const dados = validar(body, record);
    await validarVinculos(dados, record, transaction);
    await record.update(dados, { transaction });
  });
  return obter(id);
}
async function excluir(id) {
  const preview = await Entrega.findByPk(id);
  if (!preview) v.falhar(404, 'Entrega não encontrada.');
  await sequelize.transaction(async (transaction) => {
    await Veiculo.findByPk(preview.veiculo_id, { transaction, lock: transaction.LOCK.UPDATE });
    const record = await Entrega.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!record) v.falhar(404, 'Entrega não encontrada.');
    if (record.veiculo_id !== preview.veiculo_id)
      v.falhar(
        409,
        'A entrega foi alterada por outra operação. Atualize a página e tente novamente.'
      );
    if (await Simulacao.count({ where: { entrega_id: id }, transaction }))
      v.falhar(409, 'Entrega possui simulações vinculadas. Preserve o histórico.');
    await record.destroy({ transaction });
  });
}
module.exports = { listar, obter, criar, atualizar, excluir, incluir };
