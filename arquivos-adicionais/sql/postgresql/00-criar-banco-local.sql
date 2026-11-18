-- Opcional: execute pelo psql conectado ao banco postgres, com permissão CREATEDB.
-- Não usar no Render: o serviço de banco já disponibiliza o banco criado.
\set ON_ERROR_STOP on
SELECT 'CREATE DATABASE urbanlink_flow'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'urbanlink_flow')
\gexec
