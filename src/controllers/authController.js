const service = require('../services/authService');
module.exports = {
  async login(req, res) {
    res.json(await service.login(req.body, req.ip));
  },
  async me(req, res) {
    res.json({ dados: service.dadosUsuario(req.usuario) });
  }
};
