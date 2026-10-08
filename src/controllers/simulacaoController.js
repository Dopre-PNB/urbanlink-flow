const service = require('../services/simulacaoService');
module.exports = {
  ...require('./crudController')(service),
  async prever(req, res) {
    res.json({ dados: await service.prever(req.body) });
  }
};
