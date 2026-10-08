const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const timestamps = {
  createdAt: { type: DataTypes.DATE(3), allowNull: false },
  updatedAt: { type: DataTypes.DATE(3), allowNull: false },
};

const decimal = (name, precision = 10, scale = 2) => ({
  type: DataTypes.DECIMAL(precision, scale), allowNull: false,
  get() { const value = this.getDataValue(name); return value === null ? null : Number(value); },
});
const Usuario = sequelize.define('usuarios', {
  ...timestamps,
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  nome: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  senha_hash: { type: DataTypes.STRING(255), allowNull: false },
  tipo: { type: DataTypes.ENUM('administrador', 'operador'), allowNull: false, defaultValue: 'operador' },
}, { defaultScope: { attributes: { exclude: ['senha_hash'] } }, scopes: { comSenha: { attributes: { include: ['senha_hash'] } } } });

const Veiculo = sequelize.define('veiculos', {
  ...timestamps,
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  nome: { type: DataTypes.STRING(100), allowNull: false },
  placa: { type: DataTypes.STRING(15), allowNull: false, unique: true },
  capacidade_kg: decimal('capacidade_kg'),
  status: { type: DataTypes.ENUM('disponivel', 'manutencao'), allowNull: false, defaultValue: 'disponivel' },
});
const Rota = sequelize.define('rotas', {
  ...timestamps,
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  nome: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  origem: { type: DataTypes.STRING(150), allowNull: false },
  destino: { type: DataTypes.STRING(150), allowNull: false },
  distancia_km: decimal('distancia_km'),
  pontos: { type: DataTypes.JSON, allowNull: false },
});
const Entrega = sequelize.define('entregas', {
  ...timestamps,
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  descricao: { type: DataTypes.STRING(200), allowNull: false },
  origem: { type: DataTypes.STRING(150), allowNull: false },
  destino: { type: DataTypes.STRING(150), allowNull: false },
  peso_kg: decimal('peso_kg'),
  prazo_min: decimal('prazo_min'),
  data_agendada: { type: DataTypes.DATEONLY, allowNull: false },
  status: { type: DataTypes.ENUM('pendente', 'em_andamento', 'concluida', 'cancelada'), allowNull: false, defaultValue: 'pendente' },
  usuario_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  veiculo_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  rota_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  codigo: { type: DataTypes.VIRTUAL, get() { return `ULF-${String(this.id).padStart(4, '0')}`; } },
});
const Simulacao = sequelize.define('simulacoes', {
  ...timestamps,
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  entrega_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  cenario: { type: DataTypes.ENUM('normal', 'lento'), allowNull: false },
  velocidade_kmh: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  prazo_min: decimal('prazo_min'),
  rota_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  resultados: { type: DataTypes.JSON, allowNull: false },
  usuario_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  atualizado_por_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  recomendada_id: { type: DataTypes.VIRTUAL, get() { return this.rota_id; } },
});

Entrega.belongsTo(Usuario, { as: 'usuario', foreignKey: 'usuario_id', onDelete: 'RESTRICT' });
Entrega.belongsTo(Veiculo, { as: 'veiculo', foreignKey: 'veiculo_id', onDelete: 'RESTRICT' });
Entrega.belongsTo(Rota, { as: 'rota', foreignKey: 'rota_id', onDelete: 'RESTRICT' });
Simulacao.belongsTo(Entrega, { as: 'entrega', foreignKey: 'entrega_id', onDelete: 'RESTRICT' });
Simulacao.belongsTo(Usuario, { as: 'usuario', foreignKey: 'usuario_id', onDelete: 'RESTRICT' });
Simulacao.belongsTo(Usuario, { as: 'atualizado_por', foreignKey: 'atualizado_por_id', onDelete: 'RESTRICT' });
Simulacao.belongsTo(Rota, { as: 'rota', foreignKey: 'rota_id', onDelete: 'RESTRICT' });
module.exports = { sequelize, Usuario, Veiculo, Rota, Entrega, Simulacao };
