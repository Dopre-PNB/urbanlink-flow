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

Resultado da execução final após estabilizar o banco: **18 testes aprovados, 0 falhas**, incluindo dez subtestes HTTP reais, um contêiner desses subtestes e sete testes de serviço. A última execução, após a organização final do código, durou aproximadamente 5,7 segundos. O executor conta o contêiner como um teste; há 17 verificações/grupos independentes.

Na primeira execução, o teste de login sem senha esperava 400; a API corretamente respondeu 401 genérico para credenciais inválidas. A expectativa foi corrigida conforme a regra de autenticação, e a suíte completa foi executada novamente com aprovação. Cadastro de usuário sem senha continua sendo validado como 400 e foi testado.

## Interface e documentação

Comando executado: `npm.cmd run test:ui`. Resultado final: **21 cenários aprovados, 0 falhas**, no Google Chrome em modo de teste, com a aplicação e o MySQL reais.

Foram verificados: página inicial e imagens; redirecionamento de visitante; login inválido e válido; os dois perfis; criação de entrega por formulário; filtros de busca, status e data; comparação normal e lenta; bloqueio da seleção durante uma resposta deliberadamente atrasada; salvar, consultar, recalcular e excluir a simulação; confirmar a rota; iniciar e concluir a entrega; liberação do veículo; criar, editar e excluir usuários, veículos e rotas pelas telas; funcionamento das previsões e linhas do mapa com o mapa-base indisponível; acesso ao Swagger; saída da sessão; ausência de exceções JavaScript.

As seis páginas foram verificadas em computador (1440 px), tablet (768 px) e celular (390 px). As tabelas mantêm rolagem dentro do próprio painel em telas pequenas. Capturas inspecionadas confirmaram legibilidade, hierarquia visual, imagens do Figma, formulários e comparação de percursos.

Evidências: `output/verificacao/resultado-interface.json` e capturas PNG na mesma pasta. Os registros temporários criados pelos testes foram removidos por seus próprios IDs; a entrega, as rotas, os veículos e as contas de demonstração foram preservados. CT26 aprovado.

Também foram conferidos o JSON OpenAPI, suas 211 referências internas, as 30 operações em 15 caminhos e os links da documentação. A auditoria de dependências de produção retornou zero vulnerabilidades conhecidas. Uma amostra de cinco consultas à listagem local de entregas registrou 7, 17, 16, 9 e 4 ms; essa medição não constitui promessa de capacidade sob carga.

## Limitações da evidência

Os testes confirmam uma operação didática local, não capacidade de produção sob carga. Não validam GPS ou tráfego real, pois esses recursos estão fora do escopo. Proteção do último administrador é verificada no serviço com contagem controlada para não alterar as contas globais. A disponibilidade do mapa-base depende de acesso externo ao OpenStreetMap.

## Defeitos

Nenhum defeito bloqueante aberto foi identificado na verificação final.

Durante a revisão, foi corrigida uma corrida de interface: alterar a entrega/cenário enquanto a previsão estava em processamento podia misturar a seleção com os resultados. A interface passou a bloquear os controles durante as operações e a capturar os dados antes da requisição. O cenário com resposta atrasada passou após a correção, assim como a suíte completa. Também foram corrigidos o resultado aberto após excluir uma simulação, a paginação ao remover o último registro de uma página e a marcação HTML da opção de filtro Pendente. Busca, status e data passaram no cenário de navegador acrescentado para essa correção.
