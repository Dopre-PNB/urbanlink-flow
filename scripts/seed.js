const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const bcrypt = require('bcrypt');
const { sequelize, Usuario, Veiculo, Rota, Entrega } = require('../src/models');

async function seed() {
  const data = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  await sequelize.transaction(async transaction => {
    async function usuario(email, nome, tipo, senha) {
      let registro = await Usuario.findOne({ where: { email }, transaction });
      if (!registro) registro = await Usuario.create({ email, nome, tipo, senha_hash: await bcrypt.hash(senha, 12) }, { transaction });
      return registro;
    }
    await usuario('admin@urbanlink.local', 'Administrador UrbanLink', 'administrador', 'Admin@123');
    const operador = await usuario('operador@urbanlink.local', 'Operador UrbanLink', 'operador', 'Operador@123');
    const [veiculo] = await Veiculo.findOrCreate({ where: { placa: 'ULF1A01' }, defaults: { nome: 'Van de entregas', capacidade_kg: 800, status: 'disponivel' }, transaction });
    await Veiculo.findOrCreate({ where: { placa: 'ULF2B02' }, defaults: { nome: 'Caminhão leve', capacidade_kg: 1500, status: 'disponivel' }, transaction });
    const origem = 'Centro de Distribuição';
    const destino = 'Mercado Central';
    const inicio = { lat: -23.5508, lng: -46.6338 };
    const fim = { lat: -23.5418, lng: -46.6295 };
    await Rota.findOrCreate({ where: { nome: 'Via Central' }, defaults: { origem, destino, distancia_km: 8, pontos: [inicio, { lat: -23.5485, lng: -46.632 }, { lat: -23.5453, lng: -46.6314 }, fim] }, transaction });
    await Rota.findOrCreate({ where: { nome: 'Via Parque' }, defaults: { origem, destino, distancia_km: 12, pontos: [inicio, { lat: -23.5517, lng: -46.6409 }, { lat: -23.5434, lng: -46.6413 }, { lat: -23.5388, lng: -46.6355 }, fim] }, transaction });
    await Entrega.findOrCreate({ where: { descricao: 'Entrega de demonstração ao Mercado Central', origem, destino }, defaults: { peso_kg: 100, prazo_min: 20, data_agendada: data, veiculo_id: veiculo.id, usuario_id: operador.id, rota_id: null, status: 'pendente' }, transaction });
  });
  console.log('Dados de demonstração disponíveis. Registros existentes foram preservados.');
}
module.exports = seed;
if (require.main === module) {
  seed().catch(error => { console.error('Falha ao criar dados de demonstração:', error.message); process.exitCode = 1; }).finally(() => sequelize.close());
}
