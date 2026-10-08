const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { sequelize, Usuario, Entrega, Simulacao } = require('../models');
const v = require('./validacao');
const publicos = ['id', 'nome', 'email', 'tipo', 'createdAt', 'updatedAt'];
function validar(body, current) {
  v.objeto(body);
  const dados = {
    nome: v.texto(v.valor(body, 'nome', current), 'Nome', 100),
    email: v.texto(v.valor(body, 'email', current), 'E-mail', 150).toLowerCase(),
    tipo: v.opcao(v.valor(body, 'tipo', current, 'operador'), ['administrador', 'operador'], 'Perfil'),
  };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)) v.falhar(400, 'Informe um e-mail válido.');
  if (body.senha !== undefined || !current) {
    if (typeof body.senha !== 'string' || body.senha.length < 8 || Buffer.byteLength(body.senha, 'utf8') > 72) v.falhar(400, 'A senha deve ter pelo menos 8 caracteres e no máximo 72 bytes.');
    dados.senha = body.senha;
  }
  return dados;
}
async function listar(query) {
  const page = v.paginacao(query);
  const busca = v.busca(query.busca);
  const where = busca ? { [Op.or]: [{ nome: { [Op.like]: `%${busca}%` } }, { email: { [Op.like]: `%${busca}%` } }] } : {};
  const result = await Usuario.findAndCountAll({ where, attributes: publicos, order: [['id', 'ASC']], limit: page.limit, offset: page.offset });
  return { dados: result.rows, total: result.count, pagina: page.pagina, limite: page.limite };
}
async function obter(id) {
  const record = await Usuario.findByPk(id, { attributes: publicos });
  if (!record) v.falhar(404, 'Usuário não encontrado.');
  return record;
}
async function criar(body) {
  const dados = validar(body);
  dados.senha_hash = await bcrypt.hash(dados.senha, 12);
  delete dados.senha;
  const record = await Usuario.create(dados);
  return obter(record.id);
}
async function atualizar(id, body, actor) {
  v.objeto(body);
  return sequelize.transaction(async transaction => {
    // Todos os administradores são bloqueados em uma ordem fixa para proteger o último perfil.
    await Usuario.findAll({ where: { tipo: 'administrador' }, attributes: publicos, order: [['id', 'ASC']], transaction, lock: transaction.LOCK.UPDATE });
    const record = await Usuario.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!record) v.falhar(404, 'Usuário não encontrado.');
    const dados = validar(body, record);
    if (record.tipo === 'administrador' && dados.tipo !== 'administrador') {
      if (id === actor.id) v.falhar(409, 'Você não pode remover seu próprio perfil de administrador.');
      const count = await Usuario.count({ where: { tipo: 'administrador' }, transaction });
      if (count <= 1) v.falhar(409, 'É necessário manter pelo menos um administrador.');
    }
    if (dados.senha !== undefined) { dados.senha_hash = await bcrypt.hash(dados.senha, 12); delete dados.senha; }
    await record.update(dados, { transaction });
    return Object.fromEntries(publicos.map(key => [key, record[key]]));
  });
}
async function excluir(id, actor) {
  if (id === actor.id) v.falhar(409, 'Você não pode excluir seu próprio usuário.');
  return sequelize.transaction(async transaction => {
    await Usuario.findAll({ where: { tipo: 'administrador' }, attributes: publicos, order: [['id', 'ASC']], transaction, lock: transaction.LOCK.UPDATE });
    const record = await Usuario.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!record) v.falhar(404, 'Usuário não encontrado.');
    if (record.tipo === 'administrador' && await Usuario.count({ where: { tipo: 'administrador' }, transaction }) <= 1) v.falhar(409, 'É necessário manter pelo menos um administrador.');
    const entrega = await Entrega.count({ where: { usuario_id: id }, transaction });
    const simulacao = await Simulacao.count({ where: { [Op.or]: [{ usuario_id: id }, { atualizado_por_id: id }] }, transaction });
    if (entrega || simulacao) v.falhar(409, 'Usuário possui entregas ou simulações vinculadas. Preserve o histórico.');
    await record.destroy({ transaction });
  });
}
module.exports = { listar, obter, criar, atualizar, excluir };
