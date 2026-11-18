# Publicação no GitHub e no Render

O [GitHub](https://github.com/Dopre-PNB/urbanlink-flow) guarda o código. Um único Web Service no Render serve as seis páginas HTML/CSS/JavaScript e a API Node.js/Express. A publicação usa PostgreSQL no próprio Render e mantém custo zero. O ambiente local continua usando MySQL, conforme as aulas.

## Situação na revisão de entrega — 18/11/2026

**Restauração verificada em 18/11/2026 às 16h44 (Brasília).** O endereço [urbanlink-flow.onrender.com](https://urbanlink-flow.onrender.com) está publicado, e `/api/health` retornou HTTP 200 com banco conectado. A publicação do commit `3baa90e` ficou **Live** no Render. A conferência inicial havia encontrado o banco original `urbanlink-flow-db` expirado e suspenso, com expiração prevista para 07/11/2026. O recurso antigo permanece intocado; esta restauração usa um banco lógico novo e não recupera os dados antigos.

O responsável autorizou reutilizar a instância PostgreSQL gratuita ativa `nexa-play-db-7ida`, em Virginia, com PostgreSQL 18. A aplicação UrbanLink usa nela o banco lógico separado `urbanlink_flow` e o usuário SQL próprio `urbanlink_flow_user`. As tabelas e credenciais da aplicação Nexa não são reutilizadas. A URL de conexão UrbanLink fica somente nas variáveis privadas do Web Service.

A instância compartilhada expira em **17/12/2026 às 21h41, horário de Brasília (UTC−03:00)**. Criar outro banco lógico não reinicia esse prazo. A suíte de testes da API foi executada contra a publicação: **32 testes aprovados, nenhuma falha**, com registros temporários removidos ao final. Administrador e operador privados autenticaram, e o banco recebeu dois veículos, duas rotas e uma entrega pendente de 100 kg com prazo de 20 minutos para avaliação. As evidências e o alcance da verificação estão em [resultados dos testes](resultados-testes.md).

```text
Navegador → urbanlink-flow (Web Service Free)
                         ↑               ↓ rede interna
                    GitHub / main   nexa-play-db-7ida (PostgreSQL 18 Free)
                                         ├─ urbanlink_flow / urbanlink_flow_user
                                         └─ banco da aplicação Nexa, preservado
```

## 1. Entender os limites gratuitos

- O Web Service Free hiberna após 15 minutos sem acessos e pode demorar cerca de um minuto para reativar. Abra o site antes da apresentação.
- O Render permite somente uma instância PostgreSQL Free ativa por workspace. É permitido criar bancos lógicos adicionais dentro dela; isso não cria uma segunda instância.
- Os bancos lógicos UrbanLink e Nexa compartilham o mesmo limite de 1 GB, capacidade de processamento, memória, conexões e prazo de validade. A separação de bancos não fornece recursos físicos independentes.
- A instância atual expira em **17/12/2026 às 21h41 (Brasília)**. O plano gratuito não inclui backups gerenciados. Exporte os dados antes dessa data; hibernação, nova publicação ou criação de outro banco lógico não prolongam a validade.
- A conta utilizada não tem forma de pagamento cadastrada. Quando limites gratuitos aplicáveis forem atingidos, o serviço pode ser suspenso. Não adicione cartão, selecione plano pago ou aumente recursos para contornar uma suspensão.
- Esta configuração não inclui disco pago, banco MySQL hospedado ou atualização para planos pagos.

Os limites e a data de expiração devem ser conferidos no painel antes da apresentação. Referências: [regras do Render Free](https://render.com/docs/free) e [vários bancos na mesma instância](https://render.com/docs/postgresql-creating-connecting#adding-multiple-databases-to-a-single-instance).

## 2. Manter o código no GitHub

O repositório é [Dopre-PNB/urbanlink-flow](https://github.com/Dopre-PNB/urbanlink-flow), branch `main`. O conteúdo de `urbanlink-flow`, incluindo `package.json` e `render.yaml`, fica na raiz do repositório. Os PDFs dos materiais de aula ficam fora dele.

Antes de enviar uma alteração, confira os arquivos modificados, execute as verificações apropriadas e faça um commit descritivo. Depois, dentro da pasta do projeto:

```powershell
git push origin main
```

O `.gitignore` exclui `.env`, suas variações privadas, `.local`, dependências e resultados de execução. Somente `.env.example` contém o modelo sem credenciais reais. Senhas de demonstração documentadas no projeto são locais; a inicialização em produção não cria essas contas.

## 3. Configurar os serviços no Render

Use o Web Service e a instância já existentes. Não aplique outro Blueprint para duplicar recursos e não crie outra instância PostgreSQL para esta configuração. O `render.yaml` contém apenas o serviço web e os campos de ambiente: não há uma seção `databases` para criar ou alterar a instância compartilhada.

Confira a conexão da restauração:

| Campo                          | Valor                                                         |
| ------------------------------ | ------------------------------------------------------------- |
| Instância PostgreSQL existente | `nexa-play-db-7ida`                                           |
| Versão                         | PostgreSQL 18                                                 |
| Região                         | Virginia, a mesma região do site                              |
| Plano                          | Free                                                          |
| Banco lógico da UrbanLink      | `urbanlink_flow`                                              |
| Usuário SQL da UrbanLink       | `urbanlink_flow_user`, com acesso próprio para esta aplicação |
| Armazenamento                  | 1 GB compartilhado com os demais bancos da instância          |
| Validade da instância          | 17/12/2026 às 21h41 (Brasília)                                |

O banco lógico e o usuário são preparados uma vez pela administração da instância, antes de iniciar o projeto. O usuário de execução não precisa criar bancos nem outros usuários: o setup prepara as tabelas no banco ao qual ele já se conecta.

`DATABASE_URL` é um segredo preenchido manualmente e aponta para o host interno da instância, o usuário `urbanlink_flow_user` e o banco final `urbanlink_flow`. Não copie diretamente a URL padrão mostrada para o Nexa e não use `fromDatabase.connectionString`: ambos podem selecionar o banco ou usuário padrão da outra aplicação. O `render.yaml` usa `sync: false` para esse campo. Em um serviço existente, confira o valor nas configurações privadas; uma atualização do Blueprint não solicita novamente valores com `sync: false`.

O usuário UrbanLink é criado diretamente por SQL, sem trocar a credencial padrão da instância. A criação de uma credencial pelo painel/API do Render muda o usuário padrão e pode afetar referências de outros serviços. Veja [gerenciamento de credenciais PostgreSQL](https://render.com/docs/postgresql-credentials).

Confira o Web Service existente:

| Campo             | Valor                             |
| ----------------- | --------------------------------- |
| Name              | `urbanlink-flow`                  |
| Language          | Node                              |
| Region            | Virginia, a mesma região do banco |
| Plan              | Free                              |
| Repository        | `Dopre-PNB/urbanlink-flow`        |
| Branch            | `main`                            |
| Root Directory    | Vazio                             |
| Build Command     | `npm ci --omit=dev`               |
| Start Command     | `npm run start:render`            |
| Health Check Path | `/api/health`                     |

O arquivo `.node-version` seleciona Node 24. `npm run start:render` executa o setup idempotente, cria o primeiro administrador quando necessário e então inicia a aplicação. As publicações seguintes preservam as tabelas e os registros existentes. Não use `npm run demo` na hospedagem: esse comando prepara a instância MySQL local do Windows.

Referências: [publicar Express](https://render.com/docs/deploy-node-express-app), [PostgreSQL no Render](https://render.com/docs/postgresql), [Blueprint](https://render.com/docs/blueprint-spec) e [verificação de funcionamento](https://render.com/docs/health-checks).

## 4. Configurar as variáveis de ambiente

Insira senhas apenas nas configurações privadas do serviço. Não coloque a URL de conexão, senhas ou chaves em commits ou no chat.

| Variável                 | Valor na hospedagem                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------- |
| `NODE_ENV`               | `production`                                                                           |
| `HOST`                   | `0.0.0.0`                                                                              |
| `PORT`                   | Deixe o Render fornecer                                                                |
| `DATABASE_URL`           | URL interna privada com usuário `urbanlink_flow_user` e banco `urbanlink_flow`         |
| `DB_SSL`                 | `false` para a conexão interna entre estes serviços do Render                          |
| `JWT_SECRET`             | Chave aleatória com pelo menos 32 caracteres; gerada pelo Blueprint                    |
| `INITIAL_ADMIN_EMAIL`    | E-mail escolhido para o acesso de administrador                                        |
| `INITIAL_ADMIN_PASSWORD` | Senha inicial; pelo menos 8 caracteres e no máximo 72 bytes; diferente das senhas demo |
| `INITIAL_ADMIN_NAME`     | Opcional; padrão `Administrador UrbanLink`                                             |

A presença de `DATABASE_URL` seleciona PostgreSQL. As variáveis `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASSWORD` pertencem à configuração MySQL usada quando não há `DATABASE_URL`. Elas não precisam ser preenchidas na publicação PostgreSQL. A configuração `.env` do MySQL local não precisa ser alterada.

`DB_SSL=false` acima se aplica à URL interna do Render. Para uma conexão PostgreSQL externa com TLS, use `DB_SSL=true` e um certificado válido; configure `DB_SSL_CA` se o provedor exigir uma autoridade certificadora própria. Não desative a verificação de certificado para contornar um erro externo.

Em produção, os atalhos de demonstração ficam ocultos e o setup não cria veículo, rota, entrega ou operador de demonstração. O banco lógico novo recebe a estrutura e somente o administrador inicial configurado acima. Os dados de avaliação são cadastrados depois pela plataforma/API com autenticação. Contas e senhas de avaliação são fornecidas por canal privado; não execute os arquivos `database/seed*.sql` no banco publicado.

Quando já existe um administrador, reiniciar ou publicar novamente preserva usuários e senhas. Alterar `INITIAL_ADMIN_PASSWORD` não redefine uma senha existente: use a edição de usuários da plataforma. As variáveis `INITIAL_ADMIN_*` podem ser removidas após o primeiro acesso.

## 5. Conferir a publicação

A restauração de 18/11/2026 foi validada com publicação **Live**, saúde HTTP 200 e 32 testes da API aprovados, conforme os [resultados registrados](resultados-testes.md). Para conferir novamente após alterações e preparar uma apresentação:

1. Aguarde a implantação ficar **Live** no painel.
2. Abra `/api/health`; o retorno esperado é `{"status":"ok","banco":"conectado"}`.
3. Abra o login e confira que os botões de demonstração estão ocultos. Entre com o administrador configurado no ambiente privado.
4. Cadastre operador, veículo e rotas do roteiro. Confira as permissões e execute uma entrega/simulação.
5. Confira `/api/docs` e abra o site no celular.
6. Confira que a conexão utiliza `urbanlink_flow` e o usuário próprio; depois de uma nova publicação, confirme que os registros UrbanLink permanecem no banco.
7. Registre a data e os resultados dos testes e confirme que a aplicação Nexa continua usando sua configuração existente.

O Render pode publicar automaticamente alterações enviadas à branch conectada. O navegador usa o mesmo endereço para as páginas e a API. Os scripts físicos `database/schema.sql` e `database/schema-postgres.sql` representam as mesmas entidades em MySQL e PostgreSQL, respectivamente.

## 6. Exportar antes da expiração

Exporte o banco lógico UrbanLink antes de **17/12/2026 às 21h41 (Brasília)**. Faça também uma exportação separada dos outros bancos caso seja responsável por eles; um arquivo do banco UrbanLink não inclui os dados do Nexa. O plano gratuito não fornece backups gerenciados nem garante recuperação após o prazo de exclusão descrito pelo Render. A [documentação oficial de backups](https://render.com/docs/postgresql-backups#exporting-with-pg_dump) orienta usar `pg_dump` localmente e repetir a exportação para cada banco lógico.

Use um cliente `pg_dump` compatível com PostgreSQL 18 e a conexão externa privada correspondente ao banco `urbanlink_flow`, com TLS. Informe a conexão por variável de ambiente privada, sem incluí-la no histórico dos comandos ou em arquivos versionados. No PowerShell, com `URBANLINK_BACKUP_URL` já definida de forma privada:

```powershell
New-Item -ItemType Directory -Force -Path '.local/backups' | Out-Null
$backupStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
pg_dump --format=custom --file=".local/backups/urbanlink-flow-$backupStamp.dump" --dbname=$env:URBANLINK_BACKUP_URL
```

Confira o término sem erro e guarde uma cópia do arquivo em local privado. A pasta `.local` é ignorada pelo Git. A exportação não prolonga a hospedagem: antes da expiração, o responsável precisa escolher um novo destino gratuito e testar a restauração, preservando o requisito de custo zero.

## Se a inicialização falhar

- **Banco indisponível:** confira a validade da instância `nexa-play-db-7ida`, a região e a URL interna privada do banco `urbanlink_flow`. O recurso antigo `urbanlink-flow-db` está expirado e não é o destino desta restauração.
- **Tabelas ou dados de outro projeto:** pare a preparação e confira o nome final do banco e o usuário de `DATABASE_URL`. Não execute o setup sobre o banco lógico do Nexa.
- **Erro de certificado:** para acesso externo, mantenha `DB_SSL=true` e configure a CA correta quando exigida. Para esta conexão interna do Render, confira `DB_SSL=false`.
- **Configuração MySQL solicitada no Render:** confira se `DATABASE_URL` foi cadastrada no Web Service. Sem ela, o projeto usa MySQL.
- **Administrador inicial ausente:** preencha `INITIAL_ADMIN_EMAIL` e `INITIAL_ADMIN_PASSWORD` se o banco ainda não tem administrador.
- **Nenhuma porta detectada:** confira `HOST=0.0.0.0`, o comando de início e os logs de conexão com o banco.
- **Banco expirado ou serviço suspenso:** confira o motivo no painel. Não altere para plano pago; preserve o requisito de custo zero e prepare um novo ambiente gratuito quando permitido.

Os testes automatizados de API/interface devem usar um ambiente controlado e registros temporários. Para contas próprias, as variáveis `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`, `TEST_OPERATOR_EMAIL` e `TEST_OPERATOR_PASSWORD` substituem as contas de demonstração. Eles não são um comando de inicialização no Render. Registre as verificações efetivamente executadas em `docs/resultados-testes.md`.
