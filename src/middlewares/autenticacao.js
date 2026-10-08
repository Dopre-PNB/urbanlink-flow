const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
const { falhar } = require('../services/validacao');
async function autenticar(req, res, next) {
  try {
    const authorization = req.get('Authorization') || '';
    if (!/^Bearer \S+$/.test(authorization)) falhar(401, 'Entre na plataforma para continuar.');
    let payload;
    try {
      payload = jwt.verify(authorization.slice(7), process.env.JWT_SECRET, {
        algorithms: ['HS256']
      });
    } catch {
      falhar(401, 'Sessão inválida ou expirada. Entre novamente.');
    }
    if (typeof payload.sub !== 'string' || !/^[1-9]\d*$/.test(payload.sub))
      falhar(401, 'Sessão inválida.');
    const usuario = await Usuario.findByPk(Number(payload.sub));
    if (!usuario) falhar(401, 'Usuário não está mais disponível. Entre novamente.');
    req.usuario = usuario;
    next();
  } catch (error) {
    next(error);
  }
}
function administrador(req, res, next) {
  if (req.usuario.tipo !== 'administrador')
    return next(
      Object.assign(new Error('Esta ação é permitida apenas para administradores.'), {
        status: 403
      })
    );
  next();
}
module.exports = { autenticar, administrador };
