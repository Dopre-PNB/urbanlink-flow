const { Op } = require('sequelize');
const { Entrega, Veiculo, Simulacao } = require('../models');
const { incluir } = require('./entregaService');
async function obter() {
  const [contagens, totalVeiculos, ocupados, disponiveis, simulacoes, ultimas] = await Promise.all([
    Entrega.findAll({
      attributes: ['status', [Entrega.sequelize.fn('COUNT', Entrega.sequelize.col('id')), 'total']],
      group: ['status'],
      raw: true
    }),
    Veiculo.count(),
    Entrega.findAll({ where: { status: 'em_andamento' }, attributes: ['veiculo_id'], raw: true }),
    Veiculo.findAll({ where: { status: 'disponivel' }, attributes: ['id'], raw: true }),
    Simulacao.findAll({
      attributes: ['id', 'entrega_id', 'rota_id', 'resultados', 'updatedAt'],
      order: [
        ['updatedAt', 'DESC'],
        ['id', 'DESC']
      ]
    }),
    Entrega.findAll({
      include: incluir,
      order: [
        ['updatedAt', 'DESC'],
        ['id', 'DESC']
      ],
      limit: 5
    })
  ]);
  const counts = Object.fromEntries(contagens.map((item) => [item.status, Number(item.total)]));
  const ativos = new Set(ocupados.map((item) => item.veiculo_id));
  const ultimaPorEntrega = new Map();
  for (const simulacao of simulacoes)
    if (!ultimaPorEntrega.has(simulacao.entrega_id))
      ultimaPorEntrega.set(simulacao.entrega_id, simulacao);
  const recomendacoes = [...ultimaPorEntrega.values()]
    .map((simulacao) =>
      simulacao.resultados.find((resultado) => resultado.rota_id === simulacao.rota_id)
    )
    .filter(Boolean);
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  return {
    total_entregas: total,
    pendentes: counts.pendente || 0,
    em_andamento: counts.em_andamento || 0,
    concluidas: counts.concluida || 0,
    canceladas: counts.cancelada || 0,
    veiculos_disponiveis: disponiveis.filter((item) => !ativos.has(item.id)).length,
    total_veiculos: totalVeiculos,
    tempo_medio_min: recomendacoes.length
      ? Math.round(
          (recomendacoes.reduce((sum, item) => sum + item.tempo_min, 0) / recomendacoes.length) *
            100
        ) / 100
      : 0,
    dentro_prazo_percentual: recomendacoes.length
      ? Math.round(
          (recomendacoes.filter((item) => item.dentro_prazo).length / recomendacoes.length) * 10000
        ) / 100
      : 0,
    ultimas_entregas: ultimas
  };
}
module.exports = { obter };
