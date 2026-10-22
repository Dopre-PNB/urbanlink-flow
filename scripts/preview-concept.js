// Prévia local independente: não precisa iniciar o banco nem a API.
const path = require('node:path');
const express = require('express');
const app = express();
const port = Number(process.env.CONCEPT_PORT || 4173);
app.disable('x-powered-by');
app.get('/', (req, res) => res.redirect('/conceito/'));
app.use(express.static(path.join(__dirname, '../public')));
const server = app.listen(port, '127.0.0.1', () => {
  console.log(`Conceito UrbanLink Flow: http://127.0.0.1:${port}/conceito/`);
});
process.on('SIGINT', () => server.close(() => process.exit(0)));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
