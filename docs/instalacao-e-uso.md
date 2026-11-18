# Instalação e uso — UrbanLink Flow

Este guia explica como obter o código, configurar o banco, iniciar a aplicação e testar as funcionalidades. O servidor Express entrega as páginas e a API no mesmo endereço; não é necessário iniciar um servidor separado para o front-end.

## 1. Requisitos e código-fonte

- Node.js de versão 22 a 24, com npm. O arquivo `.node-version` indica a versão 24.
- Git para clonar o repositório, ou o código-fonte extraído de um ZIP do GitHub.
- MySQL 8 ou superior para a instalação local descrita a seguir. A alternativa PostgreSQL exige um banco já criado e acessível.
- Navegador atualizado. O mapa-base do OpenStreetMap precisa de acesso à internet.

No PowerShell, escolha a pasta onde deseja guardar o projeto e execute:

```powershell
git clone https://github.com/Dopre-PNB/urbanlink-flow.git
Set-Location urbanlink-flow
node --version
npm.cmd ci
```

Execute os próximos comandos sempre na pasta que contém `package.json`. `npm ci` instala as versões registradas no `package-lock.json`, incluindo as ferramentas usadas nos testes. Em outros sistemas, os comandos `npm.cmd` podem ser escritos como `npm`.

## 2. Escolher uma forma de instalação

| Situação                                                                           | Procedimento                  |
| ---------------------------------------------------------------------------------- | ----------------------------- |
| Windows com o executável do MySQL instalado e sem configuração anterior do projeto | Instância dedicada, seção 3.  |
| MySQL já em funcionamento, local ou em outro servidor                              | Configuração manual, seção 4. |
| PostgreSQL local ou hospedado                                                      | Conexão PostgreSQL, seção 5.  |

As opções usam o mesmo código e as mesmas entidades. A variável `DATABASE_URL`, quando preenchida, seleciona PostgreSQL; quando vazia ou ausente, o sistema usa MySQL.

## 3. Instância MySQL dedicada no Windows

Essa opção usa o MySQL já instalado no computador e prepara uma instância exclusiva do projeto em `127.0.0.1:3307`. Ela não instala o MySQL nem altera o serviço de banco já existente.

Antes da primeira execução, não copie `.env.example` para `.env`: o comando abaixo gera a configuração e as senhas locais automaticamente. Se o projeto já tiver um `.env` próprio, use a seção 4 ou preserve-o antes de optar por uma nova configuração.

```powershell
npm.cmd run demo
```

O comando prepara a instância, executa a criação das tabelas e dos dados de demonstração e inicia o servidor. Mantenha o terminal aberto. Acesse [http://localhost:3000](http://localhost:3000).

O caminho padrão do servidor MySQL é `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe`. Caso a instalação esteja em outro local, indique o caminho real antes de executar `demo` pela primeira vez:

```powershell
$env:MYSQLD_PATH = 'C:\caminho\da\instalacao\bin\mysqld.exe'
npm.cmd run demo
```

Para executar as etapas separadamente:

```powershell
npm.cmd run db:local
npm.cmd run db:setup
npm.cmd start
```

Encerre o servidor com `Ctrl+C`. Quando tiver iniciado o banco separadamente, encerre a instância exclusiva depois de parar a aplicação:

```powershell
npm.cmd run db:stop
```

Os dados são preservados em `.local/mysql-data`; a configuração fica em `.env` e `.local/mysql-config.json`. Esses arquivos são privados e ignorados pelo Git. Nas próximas execuções, `demo` reutiliza a configuração e os registros existentes.

## 4. Configuração manual com MySQL

Com o MySQL já iniciado, crie uma cópia do exemplo apenas se ainda não existir `.env`:

```powershell
if (-not (Test-Path -LiteralPath '.env')) { Copy-Item -LiteralPath '.env.example' -Destination '.env' }
```

Edite `.env` com os valores reais da sua instalação. Exemplo para um servidor local:

```dotenv
PORT=3000
HOST=127.0.0.1
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=urbanlink_flow
DB_USER=urbanlink_app
DB_PASSWORD=senha_da_conta_mysql
DATABASE_URL=
DB_CREATE_DATABASE=true
DB_SSL=false
JWT_SECRET=substitua_por_uma_chave_aleatoria_com_32_ou_mais_caracteres
```

O usuário MySQL precisa existir. Com `DB_CREATE_DATABASE=true`, precisa de permissão para criar o banco informado, além de criar tabelas, índices e executar consultas e alterações nesse banco. O script não cria contas MySQL na instalação manual.

Se o provedor já entregou o banco criado, preencha `DB_NAME` com o nome recebido e use `DB_CREATE_DATABASE=false`. O nome deve começar com letra, ter até 64 caracteres e conter somente letras, números ou sublinhado. Para conexão externa que use TLS, configure `DB_SSL=true`; se necessário, informe o certificado CA em `DB_SSL_CA`. A validação do certificado permanece habilitada.

Prepare a estrutura e inicie o sistema:

```powershell
npm.cmd run db:setup
npm.cmd start
```

`db:setup` executa o esquema MySQL e a carga inicial correspondente ao ambiente. As tabelas existentes e os registros de demonstração já encontrados são preservados. `npm start` apenas inicia a aplicação: ele não cria tabelas. Para reiniciar automaticamente o servidor durante alterações no código, use `npm.cmd run dev`.

## 5. Configuração com PostgreSQL

Crie primeiro o banco PostgreSQL no servidor ou no provedor escolhido. O setup deste projeto cria as tabelas dentro do banco conectado; ele não cria o banco PostgreSQL.

No `.env`, preencha a URL completa com os dados reais. O exemplo abaixo serve para um PostgreSQL local sem TLS:

```dotenv
PORT=3000
HOST=127.0.0.1
NODE_ENV=development
DATABASE_URL=postgresql://usuario:senha@127.0.0.1:5432/urbanlink_flow
DB_SSL=false
JWT_SECRET=substitua_por_uma_chave_aleatoria_com_32_ou_mais_caracteres
```

Caracteres especiais no usuário ou na senha da URL precisam ser codificados para URL. Para conexão externa com TLS, use `DB_SSL=true` e, quando exigido pelo provedor, configure `DB_SSL_CA` com a CA válida. O projeto aceita quebras de linha reais ou `\n` no certificado. A conexão interna do Render documentada para este projeto usa `DB_SSL=false`.

As opções MySQL `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASSWORD` não selecionam a conexão enquanto `DATABASE_URL` estiver preenchida. A conta PostgreSQL precisa ter permissão de criação das tabelas e de leitura/escrita no banco.

```powershell
npm.cmd run db:setup
npm.cmd start
```

O setup seleciona automaticamente `database/schema-postgres.sql`. Em desenvolvimento, cria as mesmas contas e os mesmos exemplos disponíveis na instalação MySQL.

## 6. Variáveis e inicialização em produção

| Variável                                                  | Finalidade                                                                              |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `PORT`                                                    | Porta HTTP; padrão `3000`. No Render, é fornecida pelo serviço.                         |
| `HOST`                                                    | Endereço de escuta; local `127.0.0.1`, hospedagem `0.0.0.0`.                            |
| `NODE_ENV`                                                | `development` para a demonstração local; `production` para a publicação.                |
| `DATABASE_URL`                                            | Conexão PostgreSQL; preenchida, tem prioridade sobre MySQL.                             |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Dados MySQL, usados na ausência de `DATABASE_URL`.                                      |
| `DB_CREATE_DATABASE`                                      | Permite criar o banco MySQL: `true` ou `false`; não cria banco PostgreSQL.              |
| `DB_SSL`                                                  | `true` ou `false`, conforme o tipo de conexão e o provedor.                             |
| `DB_SSL_CA`                                               | Certificado CA opcional para conexão TLS.                                               |
| `JWT_SECRET`                                              | Chave de assinatura das sessões, com pelo menos 32 caracteres.                          |
| `INITIAL_ADMIN_NAME`                                      | Nome do primeiro administrador; padrão `Administrador UrbanLink`.                       |
| `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD`           | Primeiro acesso de administrador em produção, quando ainda não existe um administrador. |

Em produção, use `NODE_ENV=production`, configure as credenciais iniciais nas variáveis privadas da hospedagem e execute `npm run start:render`, que prepara a estrutura antes de iniciar o servidor. A senha inicial deve ter pelo menos 8 caracteres e no máximo 72 bytes; as senhas da demonstração abaixo são recusadas nessa inicialização.

O ambiente de produção não insere contas de demonstração, veículos, rotas ou entregas. O administrador inicial cadastra o operador e os dados necessários pela interface/API autenticada. Quando um administrador já existe, as variáveis `INITIAL_ADMIN_*` não redefinem sua senha; a alteração é feita em **Cadastros → Usuários**.

### Configuração da publicação em 18/11/2026

A restauração de [urbanlink-flow.onrender.com](https://urbanlink-flow.onrender.com) foi **verificada em 18/11/2026 às 16h44 (Brasília)**: publicação **Live**, `/api/health` com HTTP 200 e banco conectado, e **32 testes da API aprovados, sem falhas**. Os testes criaram registros temporários e removeram seus próprios IDs. Consulte as evidências em [resultados dos testes](resultados-testes.md).

O banco original `urbanlink-flow-db` expirou e permanece suspenso, sem alteração ou recuperação de seus dados. A nova configuração usa o banco lógico separado `urbanlink_flow` e o usuário SQL próprio `urbanlink_flow_user` na instância existente `nexa-play-db-7ida` (PostgreSQL 18, Virginia, Free). O banco lógico e as credenciais da aplicação Nexa são preservados.

O `render.yaml` configura somente o serviço web. A variável `DATABASE_URL` usa `sync: false` e recebe a conexão interna correta nas configurações privadas do Web Service. Não use a URL padrão do Nexa: confira que a conexão seleciona o banco `urbanlink_flow` e seu usuário próprio antes de preparar tabelas. O setup de produção cria as tabelas e o primeiro administrador. A preparação da avaliação cadastrou depois, pela API autenticada, operador privado, dois veículos, duas rotas e uma entrega pendente de 100 kg com prazo de 20 minutos. O acesso de administrador e operador foi conferido; as credenciais são fornecidas por canal privado, sem contas de demonstração em produção.

O Render permite uma única instância PostgreSQL Free ativa por workspace, mas admite bancos lógicos adicionais nessa instância. Todos compartilham 1 GB, recursos e validade. A instância atual expira em **17/12/2026 às 21h41, horário de Brasília (UTC−03:00)**; criar o banco UrbanLink não renova o prazo. Não crie outro Blueprint para duplicar recursos nem altere para plano pago. Exporte os dados para local privado antes da expiração e planeje a restauração em outro destino gratuito. O procedimento de exportação e os detalhes estão em [Publicação no GitHub e no Render](publicacao-github-render.md). Referências: [limites gratuitos](https://render.com/docs/free) e [bancos adicionais na mesma instância](https://render.com/docs/postgresql-creating-connecting#adding-multiple-databases-to-a-single-instance).

## 7. Acesso e utilização

Após iniciar, abra [http://localhost:3000](http://localhost:3000) e acesse a plataforma. Em uma instalação de desenvolvimento preparada pelo setup, use:

| Perfil        | E-mail                     | Senha          |
| ------------- | -------------------------- | -------------- |
| Administrador | `admin@urbanlink.local`    | `Admin@123`    |
| Operador      | `operador@urbanlink.local` | `Operador@123` |

Essas contas pertencem à demonstração local. Na versão publicada, use uma conta fornecida pelo responsável pelo sistema. Não existe cadastro público de usuários. Os perfis usam a mesma tela de login, e a API aplica as permissões.

### Cadastros pelo administrador

1. Abra **Cadastros** e a aba **Veículos**. Cadastre nome, placa, capacidade de carga e disponibilidade.
2. Na aba **Rotas**, informe nome, origem, destino, distância em quilômetros e os pontos do percurso. Para comparar duas alternativas, elas precisam ter a mesma origem e o mesmo destino da entrega.
3. Na aba **Usuários**, cadastre o operador com nome, e-mail, senha e perfil. A senha deve ter ao menos 8 caracteres e no máximo 72 bytes.

O administrador também executa as operações de entrega e simulação. Exclusões exigem perfil de administrador e podem ser bloqueadas quando houver registros vinculados. O sistema preserva o último administrador e impede que alguém exclua seu próprio usuário.

### Entrega e simulação pelo operador

1. Abra **Entregas → + Nova entrega**. Informe descrição, origem, destino, peso, prazo em minutos, data e um veículo disponível com capacidade suficiente. A rota pode ser escolhida depois.
2. Abra **Simulação e mapa**, selecione a entrega e escolha circulação normal ou lenta. Clique em **Simular percurso**.
3. Compare as alternativas e clique em **Salvar simulação** para registrar o resultado no histórico. Salvar a simulação não altera automaticamente a rota da entrega.
4. Clique em **Usar rota recomendada na entrega** enquanto a entrega estiver pendente.
5. Volte a **Entregas** e atualize o status para **Em andamento** e depois **Concluída**, ou cancele conforme a operação.
6. Consulte o **Painel**, os filtros de status/data e o histórico de simulações.

Uma entrega precisa de rota para iniciar. Um veículo em manutenção, com capacidade insuficiente ou já ocupado por uma entrega em andamento não pode ser alocado a outra operação ativa. Os dados gerais da entrega só podem ser editados enquanto ela está pendente. Entregas concluídas ou canceladas não retornam às etapas anteriores; crie uma nova entrega para repetir a apresentação.

Na carga inicial, a entrega demonstrativa tem 100 kg e prazo de 20 minutos. A Via Central tem 8 km e a Via Parque, 12 km: no cenário normal, a 30 km/h, as previsões são 16 e 24 minutos; no lento, a 20 km/h, são 24 e 36 minutos. O mapa ilustra os pontos cadastrados e não fornece rastreamento GPS nem trânsito em tempo real. Os indicadores de prazo e tempo do painel vêm das previsões salvas, não da duração real da viagem.

## 8. Conferir a instalação e executar testes

Com o servidor em execução, abra [http://localhost:3000/api/health](http://localhost:3000/api/health). O retorno esperado é:

```json
{ "status": "ok", "banco": "conectado" }
```

A documentação interativa da API fica em [http://localhost:3000/api/docs](http://localhost:3000/api/docs), e a especificação OpenAPI em [http://localhost:3000/api/openapi.json](http://localhost:3000/api/openapi.json). Nas rotas protegidas, use o token retornado pelo login no cabeçalho `Authorization: Bearer <token>`; a sessão dura oito horas.

Em outro terminal, na pasta do projeto e com as dependências de desenvolvimento instaladas:

```powershell
npm.cmd test
npm.cmd run test:ui
```

Os testes de API e interface usam as contas locais por padrão, criam registros temporários e removem os IDs que criaram. Execute-os em um ambiente de teste controlado. Se a aplicação estiver em outra porta, ajuste antes dos testes:

```powershell
$env:TEST_BASE_URL = 'http://127.0.0.1:3001'
```

Para contas próprias, configure `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`, `TEST_OPERATOR_EMAIL` e `TEST_OPERATOR_PASSWORD` no ambiente do terminal. Ambas as contas precisam existir com os perfis correspondentes. Não publique as credenciais.

A verificação da interface usa Chrome instalado, com alternativa ao Chromium do Playwright. Caso nenhum esteja disponível:

```powershell
npx.cmd playwright install chromium
```

As capturas e o relatório de interface são gerados em `output/verificacao/`. Confira os resultados efetivamente registrados em [Resultados dos testes](resultados-testes.md).

## 9. Problemas comuns

| Sintoma                                     | O que conferir                                                                                                                                           |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm` bloqueado pela política do PowerShell | Use `npm.cmd`, como nos comandos deste guia.                                                                                                             |
| `mysqld` não encontrado                     | Instale o MySQL ou configure `MYSQLD_PATH`; para banco já existente, use a instalação manual.                                                            |
| Já existe um `.env`                         | Preserve a configuração existente. `db:local` não substitui um `.env` ao preparar uma instância nova.                                                    |
| Porta 3307 em uso                           | Use a instância MySQL já existente com seus dados no `.env`, ou libere a porta do processo que você iniciou.                                             |
| Porta HTTP em uso                           | Encerre a execução anterior ou altere `PORT` no `.env`; use a nova porta ao abrir o site e testar.                                                       |
| Banco indisponível ou conexão recusada      | Confira se o banco está ativo e se servidor, porta, usuário, senha e nome do banco estão corretos. Na instância dedicada, veja `.local/mysql-error.log`. |
| Permissão negada ao preparar o banco        | Confira os privilégios da conta. Em banco MySQL já criado pelo provedor, use `DB_CREATE_DATABASE=false`.                                                 |
| Tabelas inexistentes                        | Execute `npm.cmd run db:setup` antes de `npm.cmd start`.                                                                                                 |
| Erro de certificado                         | Confira `DB_SSL` e a CA correta para a conexão utilizada; a configuração TLS valida o certificado.                                                       |
| Erro de `JWT_SECRET`                        | Defina uma chave com pelo menos 32 caracteres e reinicie o servidor.                                                                                     |
| Login demo recusado em produção             | Use a conta inicial configurada na hospedagem ou outra criada pelo administrador. As contas locais não são criadas em produção.                          |
| Muitas tentativas de login                  | Aguarde 15 minutos e confirme as credenciais antes de tentar novamente.                                                                                  |
| Nenhuma rota para simular                   | Cadastre uma rota com origem e destino iguais aos da entrega; a comparação desconsidera maiúsculas e espaços nas extremidades.                           |
| Mapa-base não carrega                       | Confira a conexão com a internet. Os cálculos dependem dos dados cadastrados, sem consulta ao trânsito ao vivo.                                          |

Os esquemas SQL de criação ficam em `database/`. Os modelos do banco e os demais documentos estão em `docs/`. Para a demonstração guiada, consulte o [roteiro de apresentação](roteiro-apresentacao.md).
