const { Op } = require('sequelize');
const { sequelize, Veiculo, Entrega } = require('../models');
const v = require('./validacao');
const { operadorBusca } = require('./consultaTexto');
function validar(body, current) {
  v.objeto(body);
  return {
    nome: v.texto(v.valor(body, 'nome', current), 'Nome do veículo', 100),
    placa: v.texto(v.valor(body, 'placa', current), 'Placa', 15).toUpperCase(),
    capacidade_kg: v.numero(v.valor(body, 'capacidade_kg', current), 'Capacidade'),
    status: v.opcao(
      v.valor(body, 'status', current, 'disponivel'),
      ['disponivel', 'manutencao'],
      'Status do veículo'
    )
  };
}
async function comOcupacao(records, transaction) {
  if (!records.length) return [];
  const entregas = await Entrega.findAll({
    where: { status: 'em_andamento', veiculo_id: { [Op.in]: records.map((record) => record.id) } },
    attributes: ['veiculo_id'],
    transaction,
    raw: true
  });
  const ativos = new Set(entregas.map((record) => record.veiculo_id));
  return records.map((record) => ({ ...record.toJSON(), ocupado: ativos.has(record.id) }));
}
async function listar(query) {
  const page = v.paginacao(query);
  const busca = v.busca(query.busca);
  const where = busca
    ? {
        [Op.or]: [
          { nome: { [operadorBusca]: `%${busca}%` } },
          { placa: { [operadorBusca]: `%${busca}%` } }
        ]
      }
    : {};
  const result = await Veiculo.findAndCountAll({
    where,
    order: [['id', 'ASC']],
    limit: page.limit,
    offset: page.offset
  });
  return {
    dados: await comOcupacao(result.rows),
    total: result.count,
    pagina: page.pagina,
    limite: page.limite
  };
}
async function obter(id) {
  const record = await Veiculo.findByPk(id);
  if (!record) v.falhar(404, 'Veículo não encontrado.');
  return (await comOcupacao([record]))[0];
}
async function criar(body) {
  const record = await Veiculo.create(validar(body));
  return obter(record.id);
}
async function atualizar(id, body) {
  v.objeto(body);
  await sequelize.transaction(async (transaction) => {
    const record = await Veiculo.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!record) v.falhar(404, 'Veículo não encontrado.');
    const dados = validar(body, record);
    const ativas = await Entrega.findAll({
      where: { veiculo_id: id, status: 'em_andamento' },
      transaction
    });
    if (ativas.length && dados.status === 'manutencao')
      v.falhar(409, 'Veículo em uso não pode entrar em manutenção.');
    if (ativas.some((entrega) => entrega.peso_kg > dados.capacidade_kg))
      v.falhar(409, 'A capacidade não pode ser menor que a carga da entrega em andamento.');
    await record.update(dados, { transaction });
  });
  return obter(id);
}
async function excluir(id) {
  await sequelize.transaction(async (transaction) => {
    const record = await Veiculo.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!record) v.falhar(404, 'Veículo não encontrado.');
    if (await Entrega.count({ where: { veiculo_id: id }, transaction }))
      v.falhar(409, 'Veículo possui entregas vinculadas. Preserve o histórico.');
    await record.destroy({ transaction });
  });
}
module.exports = { listar, obter, criar, atualizar, excluir, comOcupacao };
