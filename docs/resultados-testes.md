# Resultados da verificação

Data: 08/10/2026. Ambiente local Windows, aplicação em `http://127.0.0.1:3000`, MySQL dedicado na porta 3307 e dados preparados com `db:setup`.

## API e serviços

Comando executado: `npm.cmd test`.

| Verificação                                                       | Resultado                                                                                                                                                          |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Login válido/inválido e ausência de senha/token                   | Aprovado.                                                                                                                                                          |
| Perfis e atualização de autorização pelo banco                    | Aprovado.                                                                                                                                                          |
| CRUD de usuários, veículos, rotas, entregas e simulações          | Aprovado; consultas confirmam persistência e exclusões.                                                                                                            |
| Capacidade, manutenção, unicidade, autoria, transições e vínculos | Aprovado.                                                                                                                                                          |
| Disputa simultânea pelo mesmo veículo                             | Aprovado: uma resposta 200 e outra 409.                                                                                                                            |
| Previsão normal/lenta                                             | Aprovado: 16/24 e 24/36 minutos; prever não cria histórico.                                                                                                        |
| Salvar/recalcular histórico e conservar autor/editor              | Aprovado; mudar uma rota mantém o retrato já salvo e afeta novas previsões.                                                                                        |
| Igualdade com prazo, paginação e filtros                          | Aprovado.                                                                                                                                                          |
| Indicadores do painel                                             | Aprovado para contagens, intervalos e coerência via API; teste de serviço confirma última previsão por entrega e exclusão de veículos ocupados da disponibilidade. |
| Unidades de cálculo/desempate/arredondamento                      | Aprovado.                                                                                                                                                          |
| Proteção do último administrador                                  | Aprovado em teste de serviço com consultas substituídas; nenhuma conta real rebaixada/excluída.                                                                    |
| Limpeza dos registros exclusivos de teste                         | Aprovado; remoção por IDs próprios e consulta posterior 404.                                                                                                       |

Resultado da execução após preparar a hospedagem: **28 testes aprovados, 0 falhas**, incluindo dez subtestes HTTP reais, um contêiner desses subtestes, sete testes de serviço, quatro testes de configuração de hospedagem e seis testes de administrador inicial. A execução durou aproximadamente 9 segundos. O executor conta o contêiner como um teste; há 27 verificações/grupos independentes.

Na primeira execução, o teste de login sem senha esperava 400; a API corretamente respondeu 401 genérico para credenciais inválidas. A expectativa foi corrigida conforme a regra de autenticação, e a suíte completa foi executada novamente com aprovação. Cadastro de usuário sem senha continua sendo validado como 400 e foi testado.

## Interface e documentação

Comando executado: `npm.cmd run test:ui`. Resultado final: **21 cenários aprovados, 0 falhas**, no Google Chrome em modo de teste, com a aplicação e o MySQL reais.

Foram verificados: página inicial e imagens; redirecionamento de visitante; login inválido e válido; os dois perfis; criação de entrega por formulário; filtros de busca, status e data; comparação normal e lenta; bloqueio da seleção durante uma resposta deliberadamente atrasada; salvar, consultar, recalcular e excluir a simulação; confirmar a rota; iniciar e concluir a entrega; liberação do veículo; criar, editar e excluir usuários, veículos e rotas pelas telas; funcionamento das previsões e linhas do mapa com o mapa-base indisponível; acesso ao Swagger; saída da sessão; ausência de exceções JavaScript.

As seis páginas foram verificadas em computador (1440 px), tablet (768 px) e celular (390 px). As tabelas mantêm rolagem dentro do próprio painel em telas pequenas. Capturas inspecionadas confirmaram legibilidade, hierarquia visual, imagens do Figma, formulários e comparação de percursos.

Evidências: `output/verificacao/resultado-interface.json` e capturas PNG na mesma pasta. Os registros temporários criados pelos testes foram removidos por seus próprios IDs; a entrega, as rotas, os veículos e as contas de demonstração foram preservados. CT26 aprovado.

Também foram conferidos o JSON OpenAPI, suas 211 referências internas, as 30 operações em 15 caminhos e os links da documentação. A auditoria de dependências de produção retornou zero vulnerabilidades conhecidas. Uma amostra de cinco consultas à listagem local de entregas registrou 7, 17, 16, 9 e 4 ms; essa medição não constitui promessa de capacidade sob carga.

## Preparação para GitHub e Render

Foram executadas mais **seis verificações integradas aprovadas**, usando um banco descartável no MySQL local e a aplicação com `NODE_ENV=production`:

1. Preparação das tabelas em banco previamente criado, com `DB_CREATE_DATABASE=false`.
2. Criação apenas do administrador configurado; ausência de usuários e operações de demonstração.
3. Inicialização em `0.0.0.0`, porta fornecida por variável e resposta saudável da API.
4. Login com administrador inicial e recusa das duas credenciais de demonstração.
5. Chrome confirma botões de demonstração ocultos em produção e funcionais localmente; arquivos privados retornam 404.
6. Nova preparação e reinicialização preservam o veículo cadastrado e a senha original do administrador, mesmo com outra senha inicial nas variáveis.

O banco e o usuário exclusivos dessa verificação foram removidos ao final; os dados locais de apresentação foram preservados. Evidências em `output/verificacao/resultado-hospedagem.json` e `output/verificacao/login-producao.png`. A conexão TLS foi verificada por testes de configuração, incluindo CA e verificação de identidade; uma conexão TLS com o provedor real depende da escolha e configuração desse serviço. Nenhuma publicação no GitHub ou no Render foi feita nesta etapa.

## Adaptação ao PostgreSQL gratuito do Render

Em 08/10/2026, após incluir o suporte a PostgreSQL por `DATABASE_URL`, a suíte completa foi executada novamente contra a aplicação local na porta 3001 e o MySQL exclusivo do projeto: **32 testes aprovados, zero falhas**. A contagem inclui quatro novos testes de configuração PostgreSQL, validação de TLS, leitura da URL e tratamento de conflitos de transação. A compatibilidade com o MySQL local foi preservada.

O banco `urbanlink-flow-db` foi criado no plano Free, PostgreSQL 18, região Virginia, com expiração informada pelo Render em **07/11/2026**. A conexão interna foi configurada na aplicação, com acesso externo ao banco bloqueado. A auditoria de dependências retornou zero vulnerabilidades conhecidas.

Na publicação em `https://urbanlink-flow.onrender.com`, o Render confirmou **Live** e `/api/health` respondeu `{"status":"ok","banco":"conectado"}`. Entre 23:50 e 23:52 UTC de 08/10/2026, foram executados **32 testes de API/serviços aprovados** (aproximadamente 32 segundos) e **21 cenários de interface aprovados** (aproximadamente 49 segundos), sem falhas. As requisições HTTP e os formulários usaram a API hospedada e o PostgreSQL real do Render; os testes unitários mantiveram seu ambiente local.

Foram verificados login e perfis, os cinco cadastros, persistência, filtros, capacidade e disputa por veículo, cenários normal/lento, histórico e alterações de status, mapa, documentação e as seis páginas em computador/tablet/celular. Somente registros criados pelos testes foram removidos; o operador temporário também foi excluído e o administrador inicial foi preservado. O relatório sem credenciais está em `output/verificacao/resultado-render.json`, e o comprovante visual do Render em `output/verificacao/render-live.png`. Esses arquivos de execução são ignorados pelo Git.

## Refinamento visual em HTML e CSS

As seis páginas receberam uma apresentação mais formal, com tipografia consistente, paleta azul-marinho, cartões discretos, formulários padronizados e navegação lateral no computador. A página inicial e o login mantêm as imagens fornecidas no Figma. No celular, a navegação interna passa a um menu expansível e as tabelas continuam com rolagem dentro do próprio painel.

A suíte de interface foi executada novamente contra a aplicação local na porta 3001: **21 cenários aprovados, zero falhas**. Foram preservados login, perfis, cadastros, entregas, filtros, simulações, histórico e mapa. As seis páginas foram verificadas em 1440, 768 e 390 px, sem rolagem horizontal da página. A alteração se limita à apresentação em HTML/CSS; não adiciona dependências ou serviços pagos.

## Limitações da evidência atual

Os testes confirmam a operação didática local e publicada; não medem capacidade sob carga. Não validam GPS ou tráfego real, pois esses recursos estão fora do escopo. Proteção do último administrador é verificada no serviço com contagem controlada para não alterar as contas globais. A disponibilidade do mapa-base depende de acesso externo ao OpenStreetMap.

## Defeitos

Nenhum defeito bloqueante aberto foi identificado na verificação final.

Durante a revisão, foi corrigida uma corrida de interface: alterar a entrega/cenário enquanto a previsão estava em processamento podia misturar a seleção com os resultados. A interface passou a bloquear os controles durante as operações e a capturar os dados antes da requisição. O cenário com resposta atrasada passou após a correção, assim como a suíte completa. Também foram corrigidos o resultado aberto após excluir uma simulação, a paginação ao remover o último registro de uma página e a marcação HTML da opção de filtro Pendente. Busca, status e data passaram no cenário de navegador acrescentado para essa correção.
