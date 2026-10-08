const { Op } = require('sequelize');
const { sequelize, Entrega, Rota, Simulacao, Usuario } = require('../models');
const v = require('./validacao');
const incluir = [
  { model: Entrega, as: 'entrega', attributes: ['id', 'descricao', 'codigo'] },
  { model: Usuario, as: 'usuario', attributes: ['id', 'nome'] },
  { model: Usuario, as: 'atualizado_por', attributes: ['id', 'nome'] }
];
function entrada(body) {
  v.objeto(body);
  v.semAutoria(body);
  return {
    entrega_id: v.id(body.entrega_id, 'Entrega'),
    cenario: v.opcao(body.cenario, ['normal', 'lento'], 'Cenário')
  };
}
async function calcular(entregaId, cenario, transaction) {
  const entrega = await Entrega.findByPk(entregaId, {
    transaction,
    ...(transaction ? { lock: transaction.LOCK.SHARE } : {})
  });
  if (!entrega) v.falhar(404, 'Entrega não encontrada.');
  const rotas = await Rota.findAll({
    where: { origem: entrega.origem, destino: entrega.destino },
    order: [['id', 'ASC']],
    transaction,
    ...(transaction ? { lock: transaction.LOCK.SHARE } : {})
  });
  const alternativas = rotas.filter(
    (rota) =>
      v.corresponde(rota.origem, entrega.origem) && v.corresponde(rota.destino, entrega.destino)
  );
  if (!alternativas.length)
    v.falhar(409, 'Cadastre uma rota com a mesma origem e destino da entrega para simular.');
  const velocidade = cenario === 'normal' ? 30 : 20;
  const resultados = calcularResultados(alternativas, velocidade, entrega.prazo_min);
  return {
    entrega_id: entrega.id,
    cenario,
    velocidade_kmh: velocidade,
    prazo_min: entrega.prazo_min,
    recomendada_id: resultados[0].rota_id,
    resultados
  };
}
function calcularResultados(rotas, velocidade, prazo) {
  return rotas
    .map((rota) => {
      const tempo =
        Math.round(((rota.distancia_km / velocidade) * 60 + Number.EPSILON) * 100) / 100;
      return {
        rota_id: rota.id,
        nome: rota.nome,
        origem: rota.origem,
        destino: rota.destino,
        distancia_km: rota.distancia_km,
        tempo_min: tempo,
        dentro_prazo: tempo <= prazo,
        pontos: rota.pontos
      };
    })
    .sort((a, b) => a.tempo_min - b.tempo_min || a.rota_id - b.rota_id);
}
async function prever(body) {
  const dados = entrada(body);
  return calcular(dados.entrega_id, dados.cenario);
}
async function obter(id) {
  const record = await Simulacao.findByPk(id, { include: incluir });
  if (!record) v.falhar(404, 'Simulação não encontrada.');
  return record;
}
async function listar(query) {
  const page = v.paginacao(query);
  const where = {};
  if (query.entrega_id !== undefined) where.entrega_id = v.idParametro(query.entrega_id, 'Entrega');
  const busca = v.busca(query.busca);
  if (busca) {
    where[Op.or] = [
      { '$entrega.descricao$': { [Op.like]: `%${busca}%` } },
      { cenario: { [Op.like]: `%${busca}%` } }
    ];
    if (/^(?:ULF-)?\d+$/i.test(busca))
      where[Op.or].push({ entrega_id: Number(busca.replace(/^ULF-/i, '')) });
  }
  const result = await Simulacao.findAndCountAll({
    where,
    include: incluir,
    distinct: true,
    order: [
      ['updatedAt', 'DESC'],
      ['id', 'DESC']
    ],
    limit: page.limit,
    offset: page.offset
  });
  return { dados: result.rows, total: result.count, pagina: page.pagina, limite: page.limite };
}
async function criar(body, actor) {
  const dados = entrada(body);
  const createdId = await sequelize.transaction(async (transaction) => {
    const result = await calcular(dados.entrega_id, dados.cenario, transaction);
    const record = await Simulacao.create(
      { ...result, rota_id: result.recomendada_id, usuario_id: actor.id, atualizado_por_id: null },
      { transaction }
    );
    return record.id;
  });
  return obter(createdId);
}
async function atualizar(id, body, actor) {
  v.objeto(body);
  v.semAutoria(body);
  const cenario = v.opcao(body.cenario, ['normal', 'lento'], 'Cenário');
  await sequelize.transaction(async (transaction) => {
    const record = await Simulacao.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!record) v.falhar(404, 'Simulação não encontrada.');
    if (body.entrega_id !== undefined && v.id(body.entrega_id, 'Entrega') !== record.entrega_id)
      v.falhar(400, 'A entrega de uma simulação não pode ser alterada.');
    const result = await calcular(record.entrega_id, cenario, transaction);
    await record.update(
      {
        cenario: result.cenario,
        velocidade_kmh: result.velocidade_kmh,
        prazo_min: result.prazo_min,
        resultados: result.resultados,
        rota_id: result.recomendada_id,
        atualizado_por_id: actor.id
      },
      { transaction }
    );
  });
  return obter(id);
}
async function excluir(id) {
  const record = await obter(id);
  await record.destroy();
}
module.exports = { listar, obter, criar, atualizar, excluir, prever, calcular, calcularResultados };
