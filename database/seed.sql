-- Dados fictícios de demonstração LOCAL (MySQL 8). Não executar em produção.
-- Estrutura necessária: database/schema.sql. Equivale ao seed de desenvolvimento.
-- As senhas locais são Admin@123 e Operador@123; os valores abaixo são hashes bcrypt.
-- Reexecutar preserva registros existentes, inclusive senhas e status das entregas.
SET NAMES utf8mb4;
USE urbanlink_flow;
START TRANSACTION;

INSERT INTO usuarios (nome, email, senha_hash, tipo)
SELECT 'Administrador UrbanLink', 'admin@urbanlink.local',
       '$2b$12$PWJVOEm8h.Fl7hFrbAx6MO7lqNu.vm.3ke0MWN.woAYmbVHGtfufW', 'administrador'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'admin@urbanlink.local');

INSERT INTO usuarios (nome, email, senha_hash, tipo)
SELECT 'Operador UrbanLink', 'operador@urbanlink.local',
       '$2b$12$wj.BNXCqZHZzhqf16rX2juDICtYCacWU423vPVenyVSV9aJZKQIUy', 'operador'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'operador@urbanlink.local');

INSERT INTO veiculos (nome, placa, capacidade_kg, status)
SELECT 'Van de entregas', 'ULF1A01', 800, 'disponivel'
WHERE NOT EXISTS (SELECT 1 FROM veiculos WHERE placa = 'ULF1A01');

INSERT INTO veiculos (nome, placa, capacidade_kg, status)
SELECT 'Caminhão leve', 'ULF2B02', 1500, 'disponivel'
WHERE NOT EXISTS (SELECT 1 FROM veiculos WHERE placa = 'ULF2B02');

INSERT INTO rotas (nome, origem, destino, distancia_km, pontos)
SELECT 'Via Central', 'Centro de Distribuição', 'Mercado Central', 8,
       '[{"lat":-23.5508,"lng":-46.6338},{"lat":-23.5485,"lng":-46.632},{"lat":-23.5453,"lng":-46.6314},{"lat":-23.5418,"lng":-46.6295}]'
WHERE NOT EXISTS (SELECT 1 FROM rotas WHERE nome = 'Via Central');

INSERT INTO rotas (nome, origem, destino, distancia_km, pontos)
SELECT 'Via Parque', 'Centro de Distribuição', 'Mercado Central', 12,
       '[{"lat":-23.5508,"lng":-46.6338},{"lat":-23.5517,"lng":-46.6409},{"lat":-23.5434,"lng":-46.6413},{"lat":-23.5388,"lng":-46.6355},{"lat":-23.5418,"lng":-46.6295}]'
WHERE NOT EXISTS (SELECT 1 FROM rotas WHERE nome = 'Via Parque');

INSERT INTO entregas
  (descricao, origem, destino, peso_kg, prazo_min, data_agendada, status,
   usuario_id, veiculo_id, rota_id)
SELECT 'Entrega de demonstração ao Mercado Central', 'Centro de Distribuição',
       'Mercado Central', 100, 20,
       DATE(UTC_TIMESTAMP() - INTERVAL 3 HOUR), 'pendente', u.id, v.id, NULL
FROM usuarios u CROSS JOIN veiculos v
WHERE u.email = 'operador@urbanlink.local' AND v.placa = 'ULF1A01'
  AND NOT EXISTS (
    SELECT 1 FROM entregas
    WHERE descricao = 'Entrega de demonstração ao Mercado Central'
      AND origem = 'Centro de Distribuição' AND destino = 'Mercado Central'
  );

-- Simulações são geradas pelo usuário na tela Simulação, sem histórico inventado.
COMMIT;
