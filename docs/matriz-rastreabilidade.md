# Matriz de rastreabilidade

## Guia → entrega

| Exigência do Guia                           | Implementação/documento                                                   | Verificação                                           |
| ------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------- |
| Interface em computador, tablet e celular   | Seis HTML em public/; public/css/styles.css                               | CT26; navegador e imagens                             |
| Autenticação e interação funcional          | public/login.html; authService; middleware autenticacao                   | CT01–CT04, CT07                                       |
| Visualização de informações e monitoramento | painel.html; entregas.html; painelService                                 | CT17, CT24, CT26                                      |
| Simulação de cenários e regras de logística | simulacao.html; simulacaoService; entregaService                          | CT11–CT21, CT25                                       |
| Otimização/recomendação                     | Seleção da melhor rota compatível por tempo, com desempate por ID         | CT18, CT19, CT25; limites em fontes-e-escopo.md       |
| Dados e mapas                               | Leaflet, pontos das rotas, indicadores de previsão                        | CT18, CT24, CT26                                      |
| API REST e CRUD                             | src/routes/index.js; controllers/services; docs/openapi.json; `/api/docs` | CT05, CT09–CT10, CT12, CT21 e limpeza                 |
| API documentada                             | OpenAPI com métodos, schemas, códigos e perfis                            | Validação JSON/referências; acesso HTTP               |
| Modelo conceitual                           | docs/modelo-conceitual.md                                                 | Entidades e cardinalidades conferidas                 |
| Modelo lógico                               | docs/modelo-logico.md                                                     | Atributos, PK/FK e domínios conferidos                |
| Modelo físico e banco normalizado           | database/schema.sql; models Sequelize; MySQL real                         | Setup/seed; CT13, CT22; consultas após criação/edição |
| Integração front/back/banco                 | fetch da mesma origem; Express; Sequelize/MySQL                           | Teste HTTP real + fluxo em navegador                  |
| Segurança                                   | JWT/bcrypt/RBAC; autoria do token; validação e vínculos                   | CT02–CT08, CT11–CT17, CT21–CT22                       |
| Desempenho e usabilidade                    | Paginação, índices, formulários, atualização de painel                    | CT23–CT26                                             |
| Repositório Git e README                    | README.md; .gitignore; histórico de commits                               | Conferência do repositório e comandos                 |

## Requisito → componentes → casos

| Requisito           | Componentes                                           | Casos                           |
| ------------------- | ----------------------------------------------------- | ------------------------------- |
| RF01/RNF03          | login.html, authService, autenticacao                 | CT01–CT03                       |
| RF02/RN01/RN02/RN15 | usuarioService, autenticação/perfis                   | CT04–CT08, CT12, CT21           |
| RF03                | cadastros.html/aba usuários, usuarioService           | CT05–CT08, CT22                 |
| RF04/RN03–RN06      | cadastros.html/aba veículos, veiculoService           | CT09, CT11, CT13, CT15–CT16     |
| RF05/RN03/RN10      | cadastros.html/aba rotas, rotaService                 | CT10, CT13                      |
| RF06/RF13/RN07–RN09 | entregas.html, entregaService                         | CT11–CT17                       |
| RF07/RNF07          | Listagens de services e filtros da interface          | CT23                            |
| RF08/RF09/RN11–RN13 | simulacaoService, simulacao.html                      | CT18–CT20, CT25                 |
| RF10/RN14/RN15/RN16 | simulacaoService e relações MySQL                     | CT21–CT22                       |
| RF11                | simulacao.html/Leaflet e pontos de rotas              | CT10, CT26                      |
| RF12                | Confirmar rota na simulação; PUT de entrega           | CT14, CT26                      |
| RF14/RN17           | painelService, painel.html                            | CT24, CT26                      |
| RF15/RNF06/RNF08    | README, OpenAPI, SQL, scripts, Git                    | Setup e conferência documental  |
| RNF01/RNF02         | HTML/CSS responsivo, rótulos e mensagens              | CT26                            |
| RNF04/RN16          | SQL, modelos, transações e regras dos services        | CT13, CT15, CT22                |
| RNF05               | config/models/services/controllers/routes/middlewares | Inspeção da estrutura           |
| RNF09               | Middleware de erros, mensagens de formulário          | CT02–CT04, CT11, CT20, CT23     |
| RNF10               | Plano, casos, testes e resultados                     | CT01–CT26; resultados-testes.md |

## Materiais de aula → componentes

| Material                            | Evidência                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------ |
| Módulo 1: projeto do zero           | package.json, app.js, config/database.js, .env.example, .gitignore             |
| Módulo 2: arquitetura               | Separação src/routes, middlewares, controllers, services, models, config       |
| Módulo 3: usuários/perfis/segurança | bcrypt, JWT, middleware, CRUD de usuários                                      |
| Módulo 4: operação/estoque          | Associações das cinco entidades; capacidade/ocupação adaptadas à logística     |
| Módulo 5: requisitos adicionais     | Paginação, busca/filtros, autoria autenticada, exclusões administrativas       |
| Módulo 6: requisitos                | requisitos.md: RF, RNF, RN e critérios observáveis                             |
| Módulo 7: testes                    | 26 casos planejados, integração real, unidades de limites, matriz e resultados |
