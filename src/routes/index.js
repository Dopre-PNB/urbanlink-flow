const express = require('express');
const { autenticar, administrador } = require('../middlewares/autenticacao');
const sequelize = require('../config/database');
const auth = require('../controllers/authController');
const painel = require('../controllers/painelController');
const simulacao = require('../controllers/simulacaoController');
const router = express.Router();

router.get('/health', async (req, res) => {
  try { await sequelize.authenticate(); res.json({ status: 'ok', banco: 'conectado' }); }
  catch { res.status(503).json({ mensagem: 'Banco de dados indisponível.' }); }
});
router.post('/login', auth.login);
router.get('/me', autenticar, auth.me);
router.get('/painel', autenticar, painel.obter);
router.post('/simulacoes/prever', autenticar, simulacao.prever);
function crud(path, controller, restrito) {
  const route = express.Router();
  route.use(autenticar);
  if (restrito === 'todos') route.use(administrador);
  route.get('/', controller.listar);
  route.get('/:id', controller.obter);
  const escrever = restrito === 'escrita' ? [administrador] : [];
  route.post('/', ...escrever, controller.criar);
  route.put('/:id', ...escrever, controller.atualizar);
  route.delete('/:id', ...(restrito === 'todos' ? [] : [administrador]), controller.excluir);
  router.use(path, route);
}
crud('/usuarios', require('../controllers/usuarioController'), 'todos');
crud('/veiculos', require('../controllers/veiculoController'), 'escrita');
crud('/rotas', require('../controllers/rotaController'), 'escrita');
crud('/entregas', require('../controllers/entregaController'));
crud('/simulacoes', simulacao);
module.exports = router;
