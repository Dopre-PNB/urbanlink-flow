# Fontes e decisões de escopo

Este projeto é orientado pelo Guia do Projeto Final e pelos sete materiais de aula disponíveis na pasta superior. A adaptação ao domínio de logística preserva as camadas e mecanismos ensinados, mantendo um fluxo demonstrável.

| Fonte                                                                   | Aplicação no projeto                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Guia projeto final/EP 190 - URBANLINK - Desenvolvimento de Sistemas.pdf | Plataforma responsiva integrada; autenticação; monitoramento e simulações; API REST com CRUD/documentação; modelos conceitual, lógico e físico; banco relacional; Git e README; mapas, indicadores, regras de logística e qualidade. |
| Materiais de Aula/Modulo1_Criando_Projeto_do_Zero (1).pdf               | Node.js, Express, mysql2, Sequelize, dotenv e organização inicial.                                                                                                                                                                   |
| Materiais de Aula/Modulo2_Arquitetura_do_Sistema (1).pdf                | Separação entre routes, middlewares, controllers, services, models e config.                                                                                                                                                         |
| Materiais de Aula/Modulo3_Gestao_Usuarios_Perfis_Seguranca (2) (2).pdf  | Senhas protegidas, JWT e distinção de permissões por perfil.                                                                                                                                                                         |
| Materiais de Aula/modulo4_estoque (2).pdf                               | Entidades relacionadas, autoria e regras de operação adaptadas de estoque para entregas.                                                                                                                                             |
| Materiais de Aula/modulo5_completando_requisitos (1).pdf                | Paginação, filtros, usuário vindo da sessão e exclusões restritas.                                                                                                                                                                   |
| Materiais de Aula/modulo6_requisitos.pdf                                | Identificação de RF, RNF e RN com critérios testáveis.                                                                                                                                                                               |
| Materiais de Aula/modulo7_testes.pdf                                    | Plano de testes, matriz, resultados e casos normais, de erro e de limite.                                                                                                                                                            |

## Escolhas didáticas acordadas

O design fornecido pelo usuário orienta azul, logo, cards, arredondamentos e a página inicial. As páginas internas usam fundo claro para leitura de tabelas e formulários. Agenda vira filtro por data; Mapa fica na simulação; o convite de download vira acesso à plataforma, pois a entrega é web.

Uma tela de login atende a duas funções: administrador e operador. Duas contas iniciais bastam para apresentar permissões. Administração de usuários substitui cadastro público. O servidor lê o perfil atual no banco, independentemente de controles visuais.

A otimização demonstrada consiste em selecionar a melhor alternativa de um conjunto de rotas já cadastradas. Cenários mudam uma velocidade média fixa. A implementação não promete um algoritmo de roteamento urbano, acesso a tráfego real ou distância exata pelas ruas. Com velocidades iguais nas alternativas, a menor distância também terá o menor tempo nos dois cenários; o cenário serve para avaliar impacto no prazo, não para inverter a recomendação.

O termo monitoramento é concretizado com atualização manual do status e consulta periódica do painel a cada 30 segundos. Esta é uma decisão de escopo didático. O Guia não define protocolo de atualização nem algoritmo específico; esta implementação deve ser apresentada com os limites explicitados e submetida à avaliação como simulação acadêmica.

## Fora do escopo acordado

GPS/tráfego ao vivo, aplicativo nativo, pagamentos, notificações, inteligência artificial, geocodificação, recuperação de senha por e-mail e cadastro público. Nenhum desses recursos é necessário ao fluxo combinado. A entrega usa MySQL real; armazenamento em arquivo ou memória não substitui o banco.
