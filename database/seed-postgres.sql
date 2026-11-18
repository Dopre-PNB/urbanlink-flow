-- Dados fictícios de demonstração LOCAL (PostgreSQL). Não executar em produção.
-- Estrutura necessária: database/schema-postgres.sql. Conecte-se ao banco desejado.
-- Equivale ao seed de desenvolvimento: 2 usuários, 2 veículos, 2 rotas e 1 entrega.
-- As senhas locais são Admin@123 e Operador@123; os valores abaixo são hashes bcrypt.
-- Reexecutar preserva registros existentes, inclusive senhas e status das entregas.
BEGIN;

INSERT INTO usuarios (nome, email, senha_hash, tipo)
VALUES
  ('Administrador UrbanLink', 'admin@urbanlink.local',
   '$2b$12$PWJVOEm8h.Fl7hFrbAx6MO7lqNu.vm.3ke0MWN.woAYmbVHGtfufW', 'administrador'),
  ('Operador UrbanLink', 'operador@urbanlink.local',
   '$2b$12$wj.BNXCqZHZzhqf16rX2juDICtYCacWU423vPVenyVSV9aJZKQIUy', 'operador')
ON CONFLICT DO NOTHING;

INSERT INTO veiculos (nome, placa, capacidade_kg, status)
VALUES ('Van de entregas', 'ULF1A01', 800, 'disponivel'),
       ('Caminhão leve', 'ULF2B02', 1500, 'disponivel')
ON CONFLICT DO NOTHING;

INSERT INTO rotas (nome, origem, destino, distancia_km, pontos)
VALUES
  ('Via Central', 'Centro de Distribuição', 'Mercado Central', 8,
   '[{"lat":-23.5508,"lng":-46.6338},{"lat":-23.5485,"lng":-46.632},{"lat":-23.5453,"lng":-46.6314},{"lat":-23.5418,"lng":-46.6295}]'),
  ('Via Parque', 'Centro de Distribuição', 'Mercado Central', 12,
   '[{"lat":-23.5508,"lng":-46.6338},{"lat":-23.5517,"lng":-46.6409},{"lat":-23.5434,"lng":-46.6413},{"lat":-23.5388,"lng":-46.6355},{"lat":-23.5418,"lng":-46.6295}]')
ON CONFLICT DO NOTHING;

INSERT INTO entregas
  (descricao, origem, destino, peso_kg, prazo_min, data_agendada, status,
   usuario_id, veiculo_id, rota_id)
SELECT 'Entrega de demonstração ao Mercado Central', 'Centro de Distribuição',
       'Mercado Central', 100, 20,
       (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date,
       'pendente', u.id, v.id, NULL
FROM usuarios u CROSS JOIN veiculos v
WHERE LOWER(u.email) = 'operador@urbanlink.local' AND LOWER(v.placa) = 'ulf1a01'
  AND NOT EXISTS (
    SELECT 1 FROM entregas
    WHERE descricao = 'Entrega de demonstração ao Mercado Central'
      AND origem = 'Centro de Distribuição' AND destino = 'Mercado Central'
  );

-- Simulações são geradas pelo usuário na tela Simulação, sem histórico inventado.
COMMIT;
