const { idParametro } = require('../services/validacao');
module.exports = service => ({
  async listar(req, res) { res.json(await service.listar(req.query)); },
  async obter(req, res) { res.json({ dados: await service.obter(idParametro(req.params.id)) }); },
  async criar(req, res) { res.status(201).json({ dados: await service.criar(req.body, req.usuario) }); },
  async atualizar(req, res) { res.json({ dados: await service.atualizar(idParametro(req.params.id), req.body, req.usuario) }); },
  async excluir(req, res) { await service.excluir(idParametro(req.params.id), req.usuario); res.json({ mensagem: 'Registro excluído com sucesso.' }); },
});
