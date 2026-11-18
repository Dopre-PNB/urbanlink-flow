# Arquivos adicionais da entrega

Esta pasta reúne os pontos de entrada SQL e as instruções para instalar e utilizar o UrbanLink Flow. Os arquivos em `sql/` referenciam os scripts canônicos de `database/`, os mesmos utilizados pela aplicação, evitando versões diferentes da estrutura do banco. Mantenha as duas pastas no repositório ao copiar ou entregar o projeto.

## Conteúdo

| Finalidade                            | MySQL 8                                                                                                       | PostgreSQL                                                                                                                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Criar banco e tabelas                 | [01-criar-banco-e-tabelas.sql](sql/mysql/01-criar-banco-e-tabelas.sql) → [schema.sql](../database/schema.sql) | [00-criar-banco-local.sql](sql/postgresql/00-criar-banco-local.sql), opcional, e [01-criar-tabelas.sql](sql/postgresql/01-criar-tabelas.sql) → [schema-postgres.sql](../database/schema-postgres.sql) |
| Inserir dados fictícios               | [02-inserir-dados.sql](sql/mysql/02-inserir-dados.sql) → [seed.sql](../database/seed.sql)                     | [02-inserir-dados.sql](sql/postgresql/02-inserir-dados.sql) → [seed-postgres.sql](../database/seed-postgres.sql)                                                                                      |
| Instalar, configurar, executar e usar | [Guia de instalação e uso](../docs/instalacao-e-uso.md)                                                       | [Guia de instalação e uso](../docs/instalacao-e-uso.md)                                                                                                                                               |
| Documentação da entrega               | [README principal](../README.md)                                                                              | [Modelagem e DER](../docs/der.md)                                                                                                                                                                     |

## Preparação automática

Para instalar e usar a demonstração no Windows, instale Node.js 22 a 24 e MySQL 8, abra o PowerShell na raiz do projeto e execute:

```powershell
npm.cmd ci
npm.cmd run demo
```

Mantenha esse terminal aberto, acesse [http://localhost:3000](http://localhost:3000) e entre como `admin@urbanlink.local` / `Admin@123` ou `operador@urbanlink.local` / `Operador@123`. Abra Entregas para escolher a entrega demonstrativa, Simulação para comparar os cenários e Painel para consultar os indicadores. O administrador também gerencia usuários, veículos e rotas em Cadastros.

O comando usa o MySQL já instalado no computador e uma instância dedicada na porta 3307. Configuração manual, outro caminho do MySQL, PostgreSQL, variáveis de ambiente e encerramento estão detalhados no [guia de instalação e uso](../docs/instalacao-e-uso.md). Preserve um `.env` existente.

A opção recomendada para instalar a aplicação é seguir o [guia de instalação e uso](../docs/instalacao-e-uso.md) e executar `npm.cmd run db:setup`. Esse comando seleciona MySQL ou PostgreSQL pela configuração e já cria a estrutura e os dados apropriados ao ambiente; não é necessário executar os SQL manualmente depois.

Os SQL desta pasta são uma alternativa para avaliação acadêmica, inspeção e preparação manual do banco. Os comandos `SOURCE`, `\ir` e `\gexec` pertencem aos clientes `mysql` e `psql`, respectivamente. Para executar em outro editor SQL, abra os arquivos canônicos de `database/` indicados na tabela.

## MySQL manual no Windows

Requisitos: servidor e cliente MySQL 8; usuário com permissão para criar `urbanlink_flow` e suas tabelas. Abra o PowerShell **na raiz do repositório**. Ajuste a porta e o usuário conforme a sua instalação. As senhas serão solicitadas pelo cliente:

```powershell
mysql --host=127.0.0.1 --port=3306 --user=root --password --default-character-set=utf8mb4 --execute="source arquivos-adicionais/sql/mysql/01-criar-banco-e-tabelas.sql"
mysql --host=127.0.0.1 --port=3306 --user=root --password --default-character-set=utf8mb4 --execute="source arquivos-adicionais/sql/mysql/02-inserir-dados.sql"
```

Se o comando `mysql` não estiver no PATH, use o caminho completo do executável, por exemplo `& 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe'`, seguido dos mesmos argumentos. Na instância isolada criada por `npm.cmd run db:local`, a porta padrão é `3307`; utilize a conta configurada para essa instância, sem alterar a senha existente. O script MySQL usa o nome `urbanlink_flow`; para outro nome, prefira `npm.cmd run db:setup`, que aplica `DB_NAME` automaticamente.

## PostgreSQL manual no Windows

Requisitos: servidor e cliente PostgreSQL, com credenciais próprias. Na raiz do repositório:

```powershell
# Somente se o banco ainda não existir; precisa de permissão CREATEDB.
psql --host=127.0.0.1 --port=5432 --username=postgres --dbname=postgres --file=arquivos-adicionais/sql/postgresql/00-criar-banco-local.sql
psql --host=127.0.0.1 --port=5432 --username=postgres --dbname=urbanlink_flow --file=arquivos-adicionais/sql/postgresql/01-criar-tabelas.sql
psql --host=127.0.0.1 --port=5432 --username=postgres --dbname=urbanlink_flow --file=arquivos-adicionais/sql/postgresql/02-inserir-dados.sql
```

No Render, o banco já é criado pelo provedor. Use o procedimento de [publicação](../docs/publicacao-github-render.md) e `npm run start:render`; o modo de produção cria apenas o administrador inicial definido nas variáveis privadas. **Não execute os scripts `02-inserir-dados.sql` nem os arquivos `seed*.sql` no banco publicado**, pois eles criam contas demonstrativas com senhas conhecidas.

## Dados inseridos e reexecução

Os dois scripts de inserção produzem os mesmos registros de `scripts/seed.js` em desenvolvimento:

- Administrador: `admin@urbanlink.local` / `Admin@123`.
- Operador: `operador@urbanlink.local` / `Operador@123`.
- Van de 800 kg (`ULF1A01`) e caminhão leve de 1.500 kg (`ULF2B02`).
- Via Central (8 km) e Via Parque (12 km), do Centro de Distribuição ao Mercado Central, com coordenadas fictícias para visualização.
- Uma entrega pendente de 100 kg, prazo de 20 minutos, agendada para a data de execução em São Paulo (UTC−03:00).

As senhas são armazenadas como hashes bcrypt de custo 12. Os IDs são gerados pelo banco e os relacionamentos são resolvidos pelo e-mail e pela placa; nenhum ID fixo é imposto. Simulações ficam inicialmente vazias e são criadas pelo fluxo de uso da aplicação. Os scripts verificam a existência dos registros e preservam seus valores ao serem executados novamente. Execute a carga com apenas um processo por vez. A criação de tabelas usa `IF NOT EXISTS`: não funciona como migração de uma estrutura antiga.

Após preparar manualmente o banco, ajuste o `.env` conforme o guia e execute `npm.cmd start`. Entre com uma conta demonstrativa e siga o [roteiro de apresentação](../docs/roteiro-apresentacao.md).
