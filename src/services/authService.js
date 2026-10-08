const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
const v = require('./validacao');
const tentativas = new Map();
function dadosUsuario(usuario) { return { id: usuario.id, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo }; }
async function login(body, ip) {
  v.objeto(body);
  const email = v.texto(body.email, 'E-mail', 150).toLowerCase();
  if (typeof body.senha !== 'string' || !body.senha || Buffer.byteLength(body.senha, 'utf8') > 72) v.falhar(401, 'E-mail ou senha incorretos.');
  const key = `${ip}:${email}`;
  const now = Date.now();
  let tentativa = tentativas.get(key);
  if (tentativa && now - tentativa.inicio > 15 * 60 * 1000) { tentativas.delete(key); tentativa = null; }
  if (tentativa?.quantidade >= 10) v.falhar(429, 'Muitas tentativas de login. Aguarde 15 minutos.');
  const usuario = await Usuario.scope('comSenha').findOne({ where: { email } });
  const hashFalso = '$2b$12$C6UzMDM.H6dfI/f/IKxGhuPOww2cjDXJKvU3nDZQpYDPA1VUXXVnq';
  const correta = await bcrypt.compare(body.senha, usuario?.senha_hash || hashFalso);
  if (!usuario || !correta) {
    if (tentativas.size > 10000) tentativas.clear();
    tentativas.set(key, { inicio: tentativa?.inicio || now, quantidade: (tentativa?.quantidade || 0) + 1 });
    v.falhar(401, 'E-mail ou senha incorretos.');
  }
  tentativas.delete(key);
  const token = jwt.sign({}, process.env.JWT_SECRET, { subject: String(usuario.id), expiresIn: '8h', algorithm: 'HS256' });
  return { token, usuario: dadosUsuario(usuario) };
}
module.exports = { login, dadosUsuario };
