function tratarErro(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') return res.status(400).json({ mensagem: 'JSON inválido.' });
  if (error.type === 'entity.too.large') return res.status(413).json({ mensagem: 'Os dados enviados excedem o tamanho permitido.' });
  if (error.code === 'ENOENT') return res.status(404).json({ mensagem: 'Arquivo não encontrado.' });
  if (error.status && error.status >= 400 && error.status < 500) return res.status(error.status).json({ mensagem: error.message });
  if (error.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ mensagem: 'Já existe um registro com esse e-mail, placa ou nome.' });
  if (error.name === 'SequelizeForeignKeyConstraintError') return res.status(409).json({ mensagem: 'O registro possui vínculos. Confira os dados ou preserve o histórico relacionado.' });
  if (error.name === 'SequelizeValidationError') return res.status(400).json({ mensagem: 'Confira os campos informados.' });
  if (error.original?.code === 'ER_LOCK_DEADLOCK' || error.original?.code === 'ER_LOCK_WAIT_TIMEOUT') return res.status(409).json({ mensagem: 'Outra operação está atualizando esses dados. Tente novamente.' });
  console.error('Falha interna:', error.name || 'Erro');
  return res.status(500).json({ mensagem: 'Não foi possível concluir a operação. Tente novamente.' });
}
module.exports = tratarErro;
