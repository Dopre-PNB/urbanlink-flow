# Arquivos adicionais da entrega

Esta pasta contém os scripts SQL de criação e inserção de dados e o [guia completo para instalar, configurar, executar e usar o UrbanLink Flow](instalacao-e-uso.md).

## Conteúdo

| Finalidade              | MySQL 8                                                                | PostgreSQL                                                                                                                                                            |
| ----------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Criar banco e tabelas   | [01-criar-banco-e-tabelas.sql](sql/mysql/01-criar-banco-e-tabelas.sql) | [00-criar-banco-local.sql](sql/postgresql/00-criar-banco-local.sql) para criar o banco e [01-criar-tabelas.sql](sql/postgresql/01-criar-tabelas.sql) para a estrutura |
| Inserir dados fictícios | [02-inserir-dados.sql](sql/mysql/02-inserir-dados.sql)                 | [02-inserir-dados.sql](sql/postgresql/02-inserir-dados.sql)                                                                                                           |

## Preparação automática

Siga o [guia de instalação e uso](instalacao-e-uso.md) para escolher uma instalação. `npm.cmd run db:setup` lê os scripts de estrutura desta pasta e usa `scripts/seed.js` para preparar os dados apropriados ao ambiente. Os comandos abaixo fazem a preparação manual em uma instalação local.

## MySQL manual no Windows

Use o servidor e o cliente MySQL 8 e uma conta com permissão para criar `urbanlink_flow`, gerar suas tabelas e inserir dados. No PowerShell, execute estes comandos na raiz do projeto. Ajuste porta e usuário para a sua instalação.

```powershell
cmd.exe /d /c 'mysql --host=127.0.0.1 --port=3306 --user=root --password --default-character-set=utf8mb4 < arquivos-adicionais\sql\mysql\01-criar-banco-e-tabelas.sql'
cmd.exe /d /c 'mysql --host=127.0.0.1 --port=3306 --user=root --password --default-character-set=utf8mb4 < arquivos-adicionais\sql\mysql\02-inserir-dados.sql'
```

O cliente solicita a senha. Se `mysql` estiver fora do PATH, adicione a pasta `bin` da instalação ao PATH ou abra e execute os dois arquivos na ordem indicada no MySQL Workbench. A instância criada por `npm.cmd run db:local` usa a porta `3307` e a conta configurada no `.env`. Para um banco com outro nome, use o setup automático com `DB_NAME`.

## PostgreSQL manual no Windows

Use o servidor e o cliente PostgreSQL com credenciais próprias. Execute na raiz do projeto. O arquivo `00` usa `\gexec` do `psql`, e os arquivos `01` e `02` podem ser executados diretamente em um editor SQL conectado ao banco de destino.

```powershell
# Somente se o banco ainda não existir; precisa de permissão CREATEDB.
psql --host=127.0.0.1 --port=5432 --username=postgres --dbname=postgres --file=arquivos-adicionais/sql/postgresql/00-criar-banco-local.sql
psql --host=127.0.0.1 --port=5432 --username=postgres --dbname=urbanlink_flow --set=ON_ERROR_STOP=1 --single-transaction --file=arquivos-adicionais/sql/postgresql/01-criar-tabelas.sql
psql --host=127.0.0.1 --port=5432 --username=postgres --dbname=urbanlink_flow --set=ON_ERROR_STOP=1 --file=arquivos-adicionais/sql/postgresql/02-inserir-dados.sql
```

No Render, o setup usa o banco lógico já provisionado. O comando `npm run start:render` prepara as tabelas e cadastra o administrador inicial definido nas variáveis privadas. **Use os arquivos `02-inserir-dados.sql` somente em desenvolvimento**, pois eles incluem contas com senhas de demonstração. [Guia de publicação](../docs/publicacao-github-render.md)

## Dados inseridos e reexecução

Os dois scripts de inserção produzem os mesmos registros de `scripts/seed.js` em desenvolvimento:

- Administrador: `admin@urbanlink.local` / `Admin@123`.
- Operador: `operador@urbanlink.local` / `Operador@123`.
- Van de 800 kg (`ULF1A01`) e caminhão leve de 1.500 kg (`ULF2B02`).
- Via Central (8 km) e Via Parque (12 km), do Centro de Distribuição ao Mercado Central, com coordenadas fictícias para visualização.
- Uma entrega pendente de 100 kg, prazo de 20 minutos, agendada para a data de execução em São Paulo (UTC−03:00).

As senhas são armazenadas como hashes bcrypt de custo 12. Os IDs são gerados pelo banco e os relacionamentos são resolvidos pelo e-mail e pela placa; nenhum ID fixo é imposto. Simulações ficam inicialmente vazias e são criadas pelo fluxo de uso da aplicação. Os scripts verificam a existência dos registros e preservam seus valores ao serem executados novamente. Execute a carga com apenas um processo por vez. A criação de tabelas usa `IF NOT EXISTS`: não funciona como migração de uma estrutura antiga.

Após preparar o banco, configure o `.env` e execute `npm.cmd start`. Entre com uma conta demonstrativa para seguir o roteiro. [Guia de instalação e uso](instalacao-e-uso.md) · [Roteiro de apresentação](../docs/roteiro-apresentacao.md)
