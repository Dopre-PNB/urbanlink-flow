const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const express = require('express');
const sequelize = require('./config/database');
const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store');
  next();
});
app.use(express.json({ limit: '128kb' }));
app.get('/js/config.js', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res
    .type('application/javascript')
    .send(
      `window.UL_CONFIG = ${JSON.stringify({ demonstracao: process.env.NODE_ENV !== 'production' })};`
    );
});
app.get('/api/openapi.json', (req, res) =>
  res.sendFile(path.join(__dirname, '../docs/openapi.json'))
);
const swaggerPath = require('swagger-ui-dist').getAbsoluteFSPath();
app.use('/api/docs/assets', express.static(swaggerPath));
app.get('/api/docs/init.js', (req, res) =>
  res
    .type('application/javascript')
    .send(
      "window.addEventListener('load', () => { window.ui = SwaggerUIBundle({ url: '/api/openapi.json', dom_id: '#swagger-ui', deepLinking: true, persistAuthorization: false }); });"
    )
);
app.get('/api/docs', (req, res) =>
  res
    .type('html')
    .send(
      '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>API UrbanLink Flow</title><link rel="stylesheet" href="/api/docs/assets/swagger-ui.css"></head><body><div id="swagger-ui"></div><script src="/api/docs/assets/swagger-ui-bundle.js"></script><script src="/api/docs/init.js"></script></body></html>'
    )
);
app.use('/api', require('./routes'));
app.use('/api', (req, res) => res.status(404).json({ mensagem: 'Endpoint não encontrado.' }));
app.use('/vendor/leaflet', express.static(path.join(__dirname, '../node_modules/leaflet/dist')));
app.use(express.static(path.join(__dirname, '../public')));
app.use((req, res) => res.status(404).type('text').send('Página não encontrada.'));
app.use(require('./middlewares/erros'));
app.sequelize = sequelize;
module.exports = app;

if (require.main === module) {
  const start = async () => {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
      throw new Error('Configure JWT_SECRET com pelo menos 32 caracteres no ambiente.');
    await sequelize.authenticate();
    const port = Number(process.env.PORT || 3000);
    const host =
      process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
    const server = app.listen(port, host, () =>
      console.log(`UrbanLink Flow disponível em http://${host}:${port}`)
    );
    const encerrar = () =>
      server.close(async () => {
        await sequelize.close();
        process.exit(0);
      });
    process.on('SIGINT', encerrar);
    process.on('SIGTERM', encerrar);
  };
  start().catch((error) => {
    console.error('Não foi possível iniciar a plataforma:', error.message);
    process.exitCode = 1;
  });
}
