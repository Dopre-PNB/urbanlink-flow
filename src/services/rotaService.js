const { Op } = require('sequelize');
const { sequelize, Rota, Entrega, Simulacao } = require('../models');
const v = require('./validacao');
const { operadorBusca, igualSemMaiusculas } = require('./consultaTexto');
function validar(body, current) {
  v.objeto(body);
  const dados = {
    nome: v.texto(v.valor(body, 'nome', current), 'Nome da rota', 100),
    origem: v.texto(v.valor(body, 'origem', current), 'Origem'),
    destino: v.texto(v.valor(body, 'destino', current), 'Destino'),
    distancia_km: v.numero(v.valor(body, 'distancia_km', current), 'Distância'),
    pontos: v.pontos(v.valor(body, 'pontos', current))
  };
  if (v.corresponde(dados.origem, dados.destino))
    v.falhar(400, 'Origem e destino devem ser diferentes.');
  return dados;
}
async function listar(query) {
  const page = v.paginacao(query);
  const busca = v.busca(query.busca);
  const where = busca
    ? {
        [Op.or]: ['nome', 'origem', 'destino'].map((key) => ({
          [key]: { [operadorBusca]: `%${busca}%` }
        }))
      }
    : {};
  if (query.origem !== undefined)
    where.origem = igualSemMaiusculas(v.texto(query.origem, 'Origem'));
  if (query.destino !== undefined)
    where.destino = igualSemMaiusculas(v.texto(query.destino, 'Destino'));
  const result = await Rota.findAndCountAll({
    where,
    order: [['id', 'ASC']],
    limit: page.limit,
    offset: page.offset
  });
  return { dados: result.rows, total: result.count, pagina: page.pagina, limite: page.limite };
}
async function obter(id) {
  const record = await Rota.findByPk(id);
  if (!record) v.falhar(404, 'Rota não encontrada.');
  return record;
}
async function criar(body) {
  return Rota.create(validar(body));
}
async function atualizar(id, body) {
  v.objeto(body);
  return sequelize.transaction(async (transaction) => {
    const record = await Rota.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!record) v.falhar(404, 'Rota não encontrada.');
    const dados = validar(body, record);
    const origemMudou = !v.corresponde(record.origem, dados.origem);
    const destinoMudou = !v.corresponde(record.destino, dados.destino);
    if (
      (origemMudou || destinoMudou) &&
      (await Entrega.count({ where: { rota_id: id }, transaction }))
    )
      v.falhar(409, 'Origem e destino de uma rota vinculada a entregas não podem ser alterados.');
    await record.update(dados, { transaction });
    return record;
  });
}
async function excluir(id) {
  await sequelize.transaction(async (transaction) => {
    const record = await Rota.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!record) v.falhar(404, 'Rota não encontrada.');
    const entregas = await Entrega.count({ where: { rota_id: id }, transaction });
    const simulacoes = await Simulacao.count({ where: { rota_id: id }, transaction });
    if (entregas || simulacoes)
      v.falhar(409, 'Rota possui entregas ou simulações vinculadas. Preserve o histórico.');
    await record.destroy({ transaction });
  });
}
module.exports = { listar, obter, criar, atualizar, excluir };
