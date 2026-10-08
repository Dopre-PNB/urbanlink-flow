const service = require('../services/painelService');
module.exports = {
  async obter(req, res) {
    res.json({ dados: await service.obter() });
  }
};
