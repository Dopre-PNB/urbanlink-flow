# Publicação no GitHub e no Render

O [GitHub](https://github.com/Dopre-PNB/urbanlink-flow) guarda o código. Um único Web Service no Render serve as seis páginas HTML/CSS/JavaScript e a API Node.js/Express. A publicação usa PostgreSQL no próprio Render, escolhido pelo responsável pelo projeto para manter aplicação e banco no plano Free. O ambiente local continua usando MySQL, conforme as aulas.

```text
Navegador → Render Free (site + API) → Render PostgreSQL Free
                         ↑                rede interna
                    GitHub / main
```

## 1. Entender os limites gratuitos

- O Web Service Free hiberna após 15 minutos sem acessos e pode demorar cerca de um minuto para reativar. Abra o site antes da apresentação.
- O PostgreSQL Free tem 1 GB de armazenamento e expira após 30 dias. A hibernação do site não prolonga esse prazo. Exporte os dados antes da expiração se precisar preservá-los.
- A conta utilizada não tem forma de pagamento cadastrada. Quando limites gratuitos aplicáveis forem atingidos, o serviço pode ser suspenso. Não adicione cartão, selecione plano pago ou aumente recursos para contornar uma suspensão.
- Esta configuração não inclui disco pago, banco MySQL hospedado ou atualização para planos pagos.

Os limites e a data de expiração devem ser conferidos no painel antes da apresentação. Referência: [regras do Render Free](https://render.com/docs/free).

## 2. Manter o código no GitHub

O repositório é [Dopre-PNB/urbanlink-flow](https://github.com/Dopre-PNB/urbanlink-flow), branch `main`. O conteúdo de `urbanlink-flow`, incluindo `package.json` e `render.yaml`, fica na raiz do repositório. Os PDFs dos materiais de aula ficam fora dele.

Antes de enviar uma alteração, confira os arquivos modificados, execute as verificações apropriadas e faça um commit descritivo. Depois, dentro da pasta do projeto:

```powershell
git push origin main
```

O `.gitignore` exclui `.env`, suas variações privadas, `.local`, dependências e resultados de execução. Somente `.env.example` contém o modelo sem credenciais reais. Senhas de demonstração documentadas no projeto são locais; a inicialização em produção não cria essas contas.

## 3. Configurar os serviços no Render

Use os recursos existentes quando já estiverem criados. Não aplique outro Blueprint para duplicar o site ou o banco. `render.yaml` registra a configuração para uma nova instalação; o caminho **New → Blueprint** permite reproduzi-la conectando a branch `main`. Confira se todos os recursos estão no plano **Free** antes de criar.

Para criar ou conferir manualmente o banco, use **New → Postgres**:

| Campo   | Valor                            |
| ------- | -------------------------------- |
| Name    | `urbanlink-flow-db`              |
| Region  | Virginia, a mesma região do site |
| Plan    | Free                             |
| Storage | 1 GB incluído no plano gratuito  |

Depois de o banco ficar disponível, use a **Internal Database URL** na variável `DATABASE_URL` do Web Service. Mantenha essa conexão dentro da rede do Render. O PostgreSQL já existe quando o projeto inicia; o setup prepara somente as tabelas e os dados iniciais necessários.

Para criar ou conferir o site em **New → Web Service**:

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
| `DATABASE_URL`           | Internal Database URL do PostgreSQL do projeto                                         |
| `DB_SSL`                 | `false` para a conexão interna entre estes serviços do Render                          |
| `JWT_SECRET`             | Chave aleatória com pelo menos 32 caracteres; gerada pelo Blueprint                    |
| `INITIAL_ADMIN_EMAIL`    | E-mail escolhido para o acesso de administrador                                        |
| `INITIAL_ADMIN_PASSWORD` | Senha inicial; pelo menos 8 caracteres e no máximo 72 bytes; diferente das senhas demo |
| `INITIAL_ADMIN_NAME`     | Opcional; padrão `Administrador UrbanLink`                                             |

A presença de `DATABASE_URL` seleciona PostgreSQL. As variáveis `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASSWORD` pertencem à configuração MySQL usada quando não há `DATABASE_URL`. Elas não precisam ser preenchidas na publicação PostgreSQL. A configuração `.env` do MySQL local não precisa ser alterada.

`DB_SSL=false` acima se aplica à URL interna do Render. Para uma conexão PostgreSQL externa com TLS, use `DB_SSL=true` e um certificado válido; configure `DB_SSL_CA` se o provedor exigir uma autoridade certificadora própria. Não desative a verificação de certificado para contornar um erro externo.

Em produção, os atalhos de demonstração ficam ocultos e nenhum veículo, rota, entrega ou operador de demonstração é criado. O primeiro acesso usa as credenciais configuradas acima. O administrador cadastra o operador e os dados da apresentação pela plataforma.

Quando já existe um administrador, reiniciar ou publicar novamente preserva usuários e senhas. Alterar `INITIAL_ADMIN_PASSWORD` não redefine uma senha existente: use a edição de usuários da plataforma. As variáveis `INITIAL_ADMIN_*` podem ser removidas após o primeiro acesso.

## 5. Conferir a publicação

O endereço configurado para o site é [urbanlink-flow.onrender.com](https://urbanlink-flow.onrender.com). A existência do endereço não confirma que uma implantação foi concluída; verifique o status e os passos abaixo:

1. Aguarde a implantação ficar **Live** no painel.
2. Abra `/api/health`; o retorno esperado é `{"status":"ok","banco":"conectado"}`.
3. Abra o login e confira que os botões de demonstração estão ocultos. Entre com o administrador inicial.
4. Cadastre operador, veículo e rotas do roteiro. Confira as permissões e execute uma entrega/simulação.
5. Confira `/api/docs` e abra o site no celular.
6. Depois de uma nova publicação, confirme que os registros permanecem no banco.

O Render pode publicar automaticamente alterações enviadas à branch conectada. O navegador usa o mesmo endereço para as páginas e a API. Os scripts físicos `database/schema.sql` e `database/schema-postgres.sql` representam as mesmas entidades em MySQL e PostgreSQL, respectivamente.

## Se a inicialização falhar

- **Banco indisponível:** confira se o PostgreSQL está disponível e dentro do prazo gratuito, se `DATABASE_URL` contém a URL interna completa e se os dois serviços estão na mesma região.
- **Erro de certificado:** para acesso externo, mantenha `DB_SSL=true` e configure a CA correta quando exigida. Para esta conexão interna do Render, confira `DB_SSL=false`.
- **Configuração MySQL solicitada no Render:** confira se `DATABASE_URL` foi cadastrada no Web Service. Sem ela, o projeto usa MySQL.
- **Administrador inicial ausente:** preencha `INITIAL_ADMIN_EMAIL` e `INITIAL_ADMIN_PASSWORD` se o banco ainda não tem administrador.
- **Nenhuma porta detectada:** confira `HOST=0.0.0.0`, o comando de início e os logs de conexão com o banco.
- **Banco expirado ou serviço suspenso:** confira o motivo no painel. Não altere para plano pago; preserve o requisito de custo zero e prepare um novo ambiente gratuito quando permitido.

Os testes automatizados de API/interface usam contas e registros de demonstração em ambiente de teste. Eles não são um comando de inicialização no Render e não devem ser apontados para um banco com dados reais. Registre as verificações efetivamente executadas em `docs/resultados-testes.md`.
