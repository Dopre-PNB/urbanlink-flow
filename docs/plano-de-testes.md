# Plano de testes

## Objetivo

Verificar o fluxo completo: autenticar, cadastrar dados, planejar uma entrega, comparar percursos, guardar a simulação, confirmar a rota, iniciar/concluir e consultar os indicadores. Verificar também recusas de acesso, dados inválidos, conflitos e limites.

Os resultados esperados abaixo definem o comportamento antes da execução. O registro de execução fica em [resultados-testes.md](resultados-testes.md).

## Ambiente e estratégia

- Node.js 22+, MySQL 8+, servidor Express ativo e banco criado por `npm.cmd run db:setup`.
- Integração HTTP real, sem substituir a API ou o banco, usando `npm.cmd test`.
- Cada execução cria usuários, veículos, rotas, entregas e simulações com marcador UUID. Somente esses IDs são removidos, em ordem de dependência.
- Os grupos são serializados; o teste de disputa inicia duas requisições paralelas intencionalmente. As contas e os registros demonstrativos não são editados.
- Fórmula, desempate e proteção do último administrador têm testes de serviço. A proteção do último administrador usa substitutos de consultas em memória para simular a contagem 1; não reduz as contas reais do banco.
- Interface validada em navegador com `npm.cmd run test:ui`, incluindo celular, tablet e computador. Revisão visual complementa as verificações automatizadas.

## Casos e resultados esperados

| Caso | Tipo          | Preparação/ação                                                                                              | Resultado esperado                                                                                                                                      | Evidência automatizada               |
| ---- | ------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| CT01 | Normal        | Login com cada conta demonstrativa.                                                                          | 200, token e perfil corretos; consulta `/me` retorna o usuário.                                                                                         | API grupo 01                         |
| CT02 | Erro          | Senha incorreta ou ausente no login.                                                                         | 401 com mensagem genérica; sessão não é emitida.                                                                                                        | API grupo 01                         |
| CT03 | Erro          | Consultar endpoint protegido sem token ou com token inválido.                                                | 401.                                                                                                                                                    | API grupo 02                         |
| CT04 | Erro          | Operador tenta consultar usuários ou criar veículo.                                                          | 403, mesmo enviando requisição diretamente.                                                                                                             | API grupo 02                         |
| CT05 | Normal/erro   | Criar/consultar/editar usuário; repetir e-mail e omitir senha de criação.                                    | CRUD válido; e-mail repetido 409; criação sem senha 400; nenhum retorno tem senha/hash.                                                                 | API grupo 03                         |
| CT06 | Limite        | Cadastrar senha com sete caracteres e outra com oito ou mais.                                                | Sete recebe 400; senha válida é aceita.                                                                                                                 | API grupo 03                         |
| CT07 | Erro          | Excluir a própria conta ou usar token de administrador após seu perfil ser alterado por outro administrador. | Exclusão 409; token antigo não conserva o privilégio e recebe 403.                                                                                      | API grupo 03                         |
| CT08 | Erro          | Tentar rebaixar ou excluir o único administrador.                                                            | Serviço recusa 409 antes de gravar/remover.                                                                                                             | Unidade: último administrador        |
| CT09 | Normal/erro   | CRUD de veículos; capacidade zero; repetir placa.                                                            | Dados válidos persistem; capacidade zero 400; placa repetida 409.                                                                                       | API grupo 04 e limpeza               |
| CT10 | Normal/limite | CRUD de rotas; uma rota com 2 pontos e tentativa com 1 ponto.                                                | Duas coordenadas aceitas; uma recusada 400; nome único 409.                                                                                             | API grupo 05 e limpeza               |
| CT11 | Erro          | Entrega de 501 kg em veículo de 500 kg; veículo em manutenção; peso/prazo zero.                              | Capacidade/peso/prazo inválidos 400; manutenção 409.                                                                                                    | API grupo 06                         |
| CT12 | Normal/erro   | Criar entrega; informar autor manualmente; rota de outra origem.                                             | Criação válida associa autor da sessão; autoria manual e rota incompatível recebem 400.                                                                 | API grupo 06                         |
| CT13 | Erro          | Excluir veículo ou rota com entrega vinculada; operador tenta excluir entrega.                               | Vínculo recebe 409; perfil recebe 403.                                                                                                                  | API grupos 06/09                     |
| CT14 | Normal/erro   | Iniciar entrega sem rota; saltar para conclusão; confirmar rota e iniciar.                                   | Sem rota 400; transição inválida 409; rota confirmada permite início.                                                                                   | API grupo 07                         |
| CT15 | Conflito      | Iniciar simultaneamente duas entregas no mesmo veículo.                                                      | Exatamente uma resposta 200 e outra 409; somente uma entrega ativa.                                                                                     | API grupo 07                         |
| CT16 | Erro          | Veículo ocupado entra em manutenção ou perde capacidade; dados gerais da entrega são alterados após início.  | 409; dados protegidos.                                                                                                                                  | API grupo 07                         |
| CT17 | Normal/erro   | Concluir a entrega ativa e tentar voltar a pendente.                                                         | Conclusão 200 libera ocupação; retorno recebe 409.                                                                                                      | API grupo 07                         |
| CT18 | Normal        | Prever 8/12 km no cenário normal e lento, prazo 20 min.                                                      | Normal 16/24 min; lento 24/36 min; recomendação da rota 8 km; prever não grava histórico.                                                               | API grupo 08; unidade                |
| CT19 | Limite        | Rota de 10 km, normal 30 km/h, prazo 20 min.                                                                 | Exatamente 20 min, dentro do prazo.                                                                                                                     | API grupo 08; unidade                |
| CT20 | Erro          | Cenário desconhecido ou entrega inexistente.                                                                 | 400 e 404, respectivamente.                                                                                                                             | API grupo 08                         |
| CT21 | Normal/erro   | Salvar simulação, mudar uma distância na rota, consultar histórico, prever novamente, recalcular e excluir.  | Retrato salvo conserva o valor original; nova previsão usa a distância nova; PUT preserva autor e registra editor; entrega imutável; exclusão só admin. | API grupo 09 e limpeza               |
| CT22 | Erro          | Excluir entrega com histórico ou usuário associado à atualização.                                            | 409 preserva os relacionamentos.                                                                                                                        | API grupo 09                         |
| CT23 | Normal/limite | Buscar entregas do teste com limite 1; filtrar status e data; página 0 ou limite 101.                        | Listagem paginada e filtrada; parâmetros fora do limite recebem 400.                                                                                    | API grupo 10                         |
| CT24 | Normal        | Consultar painel e conferir cenário controlado com duas entregas e uma previsão anterior.                    | Contagens coerentes; ocupado não disponível; média usa só as previsões atuais 24/30 = 27; percentual 50%, ignorando a antiga.                           | API grupo 10; unidade de painel      |
| CT25 | Limite        | Rotas com tempos iguais e IDs fora de ordem; distância com decimais.                                         | Menor ID desempata; resultado tem duas casas; entrada permanece intacta.                                                                                | Unidades de simulação                |
| CT26 | Interface     | Abrir seis páginas, entrar, simular e conferir layouts em 390/768/1440 px.                                   | Formulários e ações utilizáveis; sem erro de JavaScript ou corte horizontal impeditivo; navegação/perfis coerentes.                                     | Teste de navegador + inspeção visual |

## Critérios de aprovação

Todos os testes automatizados essenciais aprovados; sem defeito aberto que impeça login, CRUD, simulação, associação de rota ou conclusão; documentação coerente com implementação. O mapa-base exige rede e sua indisponibilidade não invalida as regras locais, mas deve ser informada na execução. Não são medidos tráfego, GPS ou tempo real de viagem. Desempenho é observado no contexto da demonstração, sem promessa de carga que não tenha sido testada.

## Registro de defeitos

| Campo            | Conteúdo a registrar quando houver defeito                |
| ---------------- | --------------------------------------------------------- |
| Identificador    | DEF-001, DEF-002...                                       |
| Caso e requisito | CT/RF/RN relacionados.                                    |
| Ambiente         | Versões, navegador e endereço de teste.                   |
| Reprodução       | Dados próprios de teste e passos.                         |
| Esperado/obtido  | Resultado esperado e resultado observado.                 |
| Evidência        | Mensagem, resposta HTTP ou imagem sem segredo/token.      |
| Situação         | Aberto, corrigido e revalidado, ou limitação documentada. |

Uma divergência de expectativa do teste não é automaticamente um defeito da plataforma. Confirme a regra prevista, ajuste quando a expectativa estava incorreta e repita o caso. Nunca registre aprovação sem executar.
