const bcrypt = require('bcrypt');
const v = require('../services/validacao');

function validarAdministradorInicial(env) {
  const nome = v.texto(
    env.INITIAL_ADMIN_NAME ?? 'Administrador UrbanLink',
    'INITIAL_ADMIN_NAME',
    100
  );
  const email = v.texto(env.INITIAL_ADMIN_EMAIL, 'INITIAL_ADMIN_EMAIL', 150).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    v.falhar(400, 'INITIAL_ADMIN_EMAIL deve ser um e-mail válido.');
  const senha = env.INITIAL_ADMIN_PASSWORD;
  if (typeof senha !== 'string' || senha.length < 8 || Buffer.byteLength(senha, 'utf8') > 72)
    v.falhar(400, 'INITIAL_ADMIN_PASSWORD deve ter pelo menos 8 caracteres e no máximo 72 bytes.');
  if (['Admin@123', 'Operador@123'].includes(senha))
    v.falhar(400, 'INITIAL_ADMIN_PASSWORD não pode usar uma senha da demonstração local.');
  return { nome, email, senha };
}

async function criarAdministradorInicial({ sequelize, Usuario }, env = process.env) {
  return sequelize.transaction(async (transaction) => {
    const administrador = await Usuario.findOne({
      where: { tipo: 'administrador' },
      attributes: ['id'],
      transaction
    });
    // O cadastro inicial não altera contas nem senhas já existentes.
    if (administrador) return false;
    const dados = validarAdministradorInicial(env);
    const existente = await Usuario.findOne({
      where: { email: dados.email },
      attributes: ['id'],
      transaction
    });
    if (existente)
      v.falhar(
        409,
        'INITIAL_ADMIN_EMAIL já pertence a uma conta existente. Escolha outro e-mail para o administrador inicial.'
      );
    await Usuario.create(
      {
        nome: dados.nome,
        email: dados.email,
        tipo: 'administrador',
        senha_hash: await bcrypt.hash(dados.senha, 12)
      },
      { transaction }
    );
    return true;
  });
}

module.exports = { criarAdministradorInicial, validarAdministradorInicial };
