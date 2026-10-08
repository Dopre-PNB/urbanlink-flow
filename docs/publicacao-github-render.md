# Publicação no GitHub e no Render

O GitHub guarda o código. Um único Web Service no Render serve as páginas HTML/CSS/JavaScript e a API Node.js/Express. O banco continua sendo MySQL, conforme os materiais de aula, e precisa de uma instância hospedada separadamente.

```text
Navegador → Render (site + API) → MySQL hospedado
                  ↑
             GitHub / main
```

## 1. Preparar o MySQL

Use MySQL 8 ou superior e um banco dedicado ao projeto. Anote host, porta, nome do banco, usuário e senha fornecidos pelo serviço. O usuário precisa consultar e alterar dados e criar/alterar as tabelas desse banco. O setup é idempotente: cria o que está faltando e preserva os dados existentes.

O projeto aceita um MySQL gerenciado externo com TLS. Se o provedor fornecer um certificado CA próprio, cadastre seu conteúdo PEM em `DB_SSL_CA` no Render; são aceitas quebras de linha reais ou representadas por `\n`. A conexão verifica o certificado e o nome do servidor.

Também é possível manter o MySQL no próprio Render usando um serviço privado e disco persistente. Essa alternativa usa recursos pagos e exige administrar o banco. Não instale o MySQL dentro do Web Service da aplicação nem envie a pasta `.local` para o GitHub. Veja a [orientação oficial de MySQL no Render](https://render.com/docs/deploy-mysql).

Este repositório não provisiona nem contrata um serviço de banco. A escolha do provedor e a criação da instância precedem a publicação.

## 2. Enviar o projeto ao GitHub

O repositório Git local fica em `urbanlink-flow`. Envie o conteúdo dessa pasta, com `package.json` e `render.yaml` na raiz do repositório. Os PDFs dos materiais de aula ficam fora desse repositório.

1. Crie um repositório vazio no GitHub, público ou privado conforme a entrega acadêmica. Evite inicializá-lo com outro README, pois este projeto já tem histórico Git.
2. Conecte o repositório local ao endereço criado e envie a branch `main`.
3. Confira se os arquivos `package.json`, `package-lock.json`, `render.yaml`, `src`, `public` e `database` aparecem no GitHub.

Exemplo no terminal, dentro de `urbanlink-flow`, substituindo o endereço pelo repositório real:

```powershell
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

O `.gitignore` exclui `.env`, variações privadas de `.env`, `.local`, dependências e resultados de execução. Só `.env.example` contém o modelo sem credenciais reais. As senhas de demonstração presentes no código/README são locais; a inicialização em produção não cria essas contas.

## 3. Criar o serviço no Render

O caminho preparado é **New → Blueprint**, conectando o repositório e a branch `main`. O Render lê `render.yaml`, configura o serviço Node e solicita as variáveis marcadas para preenchimento. O arquivo gera `JWT_SECRET` automaticamente e seleciona a instância gratuita para a aplicação. Confira o resumo de recursos antes de criar.

Se preferir criar por **New → Web Service**, use:

| Campo             | Valor                                                   |
| ----------------- | ------------------------------------------------------- |
| Language          | Node                                                    |
| Branch            | main                                                    |
| Root Directory    | Vazio quando `package.json` está na raiz do repositório |
| Build Command     | `npm ci --omit=dev`                                     |
| Start Command     | `npm run start:render`                                  |
| Health Check Path | `/api/health`                                           |

O arquivo `.node-version` seleciona Node 24. O comando de início prepara as tabelas, cria o primeiro administrador quando necessário e então inicia a aplicação. Isso dispensa shell remoto e comando de pré-deploy. Não utilize `npm run demo` na hospedagem: esse comando prepara a instância MySQL local do Windows.

Referências: [publicar Express](https://render.com/docs/deploy-node-express-app), [formato do Blueprint](https://render.com/docs/blueprint-spec) e [verificação de funcionamento](https://render.com/docs/health-checks).

## 4. Configurar as variáveis de ambiente

Insira senhas apenas na configuração do serviço; não as coloque em commits ou no chat.

| Variável                 | Valor na hospedagem                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------- |
| `NODE_ENV`               | `production`                                                                           |
| `HOST`                   | `0.0.0.0`                                                                              |
| `PORT`                   | Deixe o Render fornecer                                                                |
| `DB_HOST`                | Endereço do MySQL hospedado, sem `https://`                                            |
| `DB_PORT`                | Porta informada pelo provedor, frequentemente `3306`                                   |
| `DB_NAME`                | Banco existente dedicado ao projeto; letras, números e sublinhado, começando por letra |
| `DB_USER`                | Usuário com acesso ao banco                                                            |
| `DB_PASSWORD`            | Senha desse usuário                                                                    |
| `DB_CREATE_DATABASE`     | `false`                                                                                |
| `DB_SSL`                 | `true` para a conexão externa com TLS                                                  |
| `DB_SSL_CA`              | Opcional: certificado CA PEM fornecido pelo provedor                                   |
| `JWT_SECRET`             | Chave aleatória com pelo menos 32 caracteres; gerada pelo Blueprint                    |
| `INITIAL_ADMIN_EMAIL`    | E-mail escolhido para seu acesso de administrador                                      |
| `INITIAL_ADMIN_PASSWORD` | Sua senha inicial; pelo menos 8 caracteres, no máximo 72 bytes; não use as senhas demo |
| `INITIAL_ADMIN_NAME`     | Opcional; padrão `Administrador UrbanLink`                                             |

Se o MySQL for um serviço privado do Render sem TLS, use o host interno, a mesma região da aplicação e `DB_SSL=false`, conforme a configuração efetiva desse banco. Para um provedor que filtre conexões por IP, permita os endereços de saída do Web Service indicados pelo Render.

Em produção, os atalhos de demonstração ficam ocultos e nenhum veículo, rota, entrega ou operador de demonstração é criado. O primeiro acesso usa as credenciais configuradas acima; depois, o administrador cadastra o operador e os dados para apresentação pela plataforma.

Quando já existe um administrador no banco, reiniciar ou publicar novamente preserva usuários e senhas. Alterar `INITIAL_ADMIN_PASSWORD` não redefine uma senha existente: utilize a edição de usuários da plataforma. Você pode remover as variáveis `INITIAL_ADMIN_*` após o primeiro acesso. Use um banco novo para publicar; importar o banco da demonstração local também importaria as contas de demonstração.

## 5. Conferir a publicação

1. Aguarde o serviço ficar disponível no endereço HTTPS fornecido pelo Render.
2. Abra `/api/health`; o retorno esperado é `{"status":"ok","banco":"conectado"}`.
3. Abra a página de login: os botões de demonstração devem estar ocultos. Entre com seu administrador inicial.
4. Cadastre um operador, um veículo e as duas rotas do roteiro de apresentação. Confira o acesso do operador e execute uma entrega/simulação.
5. Confira `/api/docs` e abra o site no celular.
6. Faça uma nova publicação e confirme que os registros permanecem no banco.

O Render pode publicar automaticamente as alterações enviadas à branch conectada. O código não depende de `localhost` no navegador: páginas e API utilizam o mesmo endereço.

A instância gratuita da aplicação suspende após 15 minutos sem acessos e pode levar cerca de um minuto para reativar. Abra o site antes da apresentação. O banco tem disponibilidade e custos próprios, conforme o provedor. Veja as [limitações do plano gratuito](https://render.com/docs/free).

## Se a inicialização falhar

- **Banco indisponível:** confira endereço, porta, usuário, senha e permissão de acesso a partir do Render.
- **Erro de certificado:** mantenha `DB_SSL=true` para o banco externo e configure a CA correta em `DB_SSL_CA` quando exigida.
- **Banco desconhecido:** crie/selecione o banco no provedor e use seu nome em `DB_NAME`; a configuração de produção não cria a instância do banco.
- **Administrador inicial ausente:** preencha `INITIAL_ADMIN_EMAIL` e `INITIAL_ADMIN_PASSWORD` se o banco ainda não tem administrador.
- **Nenhuma porta detectada:** confirme `HOST=0.0.0.0`, o comando de início e os logs de conexão com o banco.

Os testes automatizados de API/interface do repositório usam o ambiente local de demonstração. Execute-os localmente; eles não são um comando de inicialização no Render e não devem ser apontados para um banco de uso real.
