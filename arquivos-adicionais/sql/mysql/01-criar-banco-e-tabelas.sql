-- Estrutura física UrbanLink Flow. Executar novamente preserva tabelas e dados.
CREATE DATABASE IF NOT EXISTS urbanlink_flow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE urbanlink_flow;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  tipo ENUM('administrador','operador') NOT NULL DEFAULT 'operador',
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id), UNIQUE KEY uk_usuario_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS veiculos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  placa VARCHAR(15) NOT NULL,
  capacidade_kg DECIMAL(10,2) NOT NULL,
  status ENUM('disponivel','manutencao') NOT NULL DEFAULT 'disponivel',
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id), UNIQUE KEY uk_veiculo_placa (placa),
  CONSTRAINT ck_veiculo_capacidade CHECK (capacidade_kg > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS rotas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  origem VARCHAR(150) NOT NULL,
  destino VARCHAR(150) NOT NULL,
  distancia_km DECIMAL(10,2) NOT NULL,
  pontos JSON NOT NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id), UNIQUE KEY uk_rota_nome (nome),
  KEY idx_rota_origem_destino (origem,destino),
  CONSTRAINT ck_rota_distancia CHECK (distancia_km > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS entregas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  descricao VARCHAR(200) NOT NULL,
  origem VARCHAR(150) NOT NULL,
  destino VARCHAR(150) NOT NULL,
  peso_kg DECIMAL(10,2) NOT NULL,
  prazo_min DECIMAL(10,2) NOT NULL,
  data_agendada DATE NOT NULL,
  status ENUM('pendente','em_andamento','concluida','cancelada') NOT NULL DEFAULT 'pendente',
  usuario_id INT UNSIGNED NOT NULL,
  veiculo_id INT UNSIGNED NOT NULL,
  rota_id INT UNSIGNED NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_entrega_status (status), KEY idx_entrega_data (data_agendada),
  KEY idx_entrega_veiculo_status (veiculo_id,status),
  CONSTRAINT fk_entrega_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_entrega_veiculo FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_entrega_rota FOREIGN KEY (rota_id) REFERENCES rotas(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_entrega_peso CHECK (peso_kg > 0),
  CONSTRAINT ck_entrega_prazo CHECK (prazo_min > 0),
  CONSTRAINT ck_entrega_inicio CHECK (status <> 'em_andamento' OR rota_id IS NOT NULL)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS simulacoes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  entrega_id INT UNSIGNED NOT NULL,
  cenario ENUM('normal','lento') NOT NULL,
  velocidade_kmh INT UNSIGNED NOT NULL,
  prazo_min DECIMAL(10,2) NOT NULL,
  rota_id INT UNSIGNED NOT NULL,
  resultados JSON NOT NULL,
  usuario_id INT UNSIGNED NOT NULL,
  atualizado_por_id INT UNSIGNED NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id), KEY idx_simulacao_entrega_data (entrega_id,updatedAt),
  CONSTRAINT fk_simulacao_entrega FOREIGN KEY (entrega_id) REFERENCES entregas(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_simulacao_rota FOREIGN KEY (rota_id) REFERENCES rotas(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_simulacao_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_simulacao_atualizador FOREIGN KEY (atualizado_por_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_simulacao_velocidade CHECK (velocidade_kmh IN (20,30)),
  CONSTRAINT ck_simulacao_prazo CHECK (prazo_min > 0)
) ENGINE=InnoDB;
