# Requisitos da UrbanLink Flow

## Objetivo e escopo

Planejar uma entrega, comparar duas ou mais rotas cadastradas para a mesma origem/destino, estimar o tempo em dois cenários de circulação e acompanhar o status até a conclusão. A plataforma possui seis páginas, uma tela de login e os perfis administrador e operador.

O escopo é uma operação logística didática: distâncias e trajetos de demonstração, sem aquisição de tráfego ou posição em tempo real. A atualização do status representa o acompanhamento da operação. Todo dado funcional é persistido no MySQL.

## Requisitos funcionais

| ID   | Requisito                              | Critério observável                                                                                          |
| ---- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| RF01 | Autenticar por e-mail e senha.         | Credenciais válidas abrem a sessão; inválidas recebem 401. Todos usam uma tela.                              |
| RF02 | Aplicar perfis administrador/operador. | Escrita de usuários, veículos e rotas e exclusões exigem administrador no servidor.                          |
| RF03 | Gerenciar usuários.                    | Administrador pode criar, listar, consultar, editar e excluir usuário sem vínculos.                          |
| RF04 | Gerenciar veículos.                    | Administrador realiza CRUD; ambos consultam capacidade, disponibilidade e ocupação.                          |
| RF05 | Gerenciar rotas.                       | Administrador realiza CRUD de nome, origem, destino, distância e pontos do mapa.                             |
| RF06 | Gerenciar entregas.                    | Ambos criam, listam, consultam e atualizam; administrador exclui. Veículo, rota e autor ficam vinculados.    |
| RF07 | Filtrar e paginar.                     | Entregas aceitam busca, status e data; listas aceitam página e limite; limite máximo 100.                    |
| RF08 | Prever cenários de circulação.         | Cenário normal usa 30 km/h e lento usa 20 km/h, sem gravar ao prever.                                        |
| RF09 | Recomendar percurso e verificar prazo. | Menor tempo vence; tela compara alternativas e informa dentro/fora do prazo.                                 |
| RF10 | Persistir simulações.                  | Usuário pode salvar, consultar e recalcular uma simulação; administrador exclui; histórico conserva autoria. |
| RF11 | Visualizar mapa.                       | Origem, destino e pontos intermediários da rota selecionada aparecem em um mapa.                             |
| RF12 | Confirmar uma rota.                    | A recomendação só é associada à entrega após confirmação explícita do operador.                              |
| RF13 | Acompanhar estados.                    | Entrega passa de pendente a em andamento e a concluída; cancelamento é permitido antes da conclusão.         |
| RF14 | Exibir indicadores.                    | Painel mostra contagens por estado, veículos disponíveis e indicadores da última simulação de cada entrega.  |
| RF15 | Documentar e reproduzir a instalação.  | README, OpenAPI, script SQL e dados iniciais permitem instalar e demonstrar localmente.                      |

## Requisitos não funcionais

| ID    | Requisito                           | Critério de verificação                                                                                                     |
| ----- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| RNF01 | Interface responsiva.               | Telas utilizáveis nas larguras de celular, tablet e computador, sem cortes que impeçam ações.                               |
| RNF02 | Interface básica e compreensível.   | HTML/CSS e JavaScript nativos; mensagens em português; formulários com rótulos.                                             |
| RNF03 | Segurança de acesso.                | Hash bcrypt, JWT com validade, conferência do perfil no banco, proteção de endpoints e ausência de senha/hash nos retornos. |
| RNF04 | Persistência e integridade.         | MySQL relacional com PK/FK, campos obrigatórios, unicidade e transações nas disputas por veículo.                           |
| RNF05 | Organização em camadas.             | Routes/middlewares/controllers/services/models/config conforme os materiais de aula.                                        |
| RNF06 | API REST documentada.               | OpenAPI 3 acessível na aplicação, com métodos, corpos, respostas e permissões.                                              |
| RNF07 | Desempenho adequado à demonstração. | Listas paginadas; consultas com índices; painel atualiza a cada 30 s e pausa em aba oculta. Sem prometer SLA não medido.    |
| RNF08 | Versionamento e configuração.       | Git com histórico; `.env` para configuração e `.gitignore` para segredos, dependências e instância local.                   |
| RNF09 | Erros legíveis.                     | API devolve `{ mensagem }` e códigos HTTP; erros internos não expõem detalhes do banco.                                     |
| RNF10 | Verificação rastreável.             | Casos previstos antes da execução; matriz RF/RN/teste e resultados registrados.                                             |

## Regras de negócio

| ID   | Regra                                                                                                                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| RN01 | Apenas administrador cadastra usuários. E-mail é único; senha tem no mínimo oito caracteres.                                                     |
| RN02 | Usuário não pode excluir a própria conta nem remover o próprio perfil administrativo. O último administrador não pode ser removido ou rebaixado. |
| RN03 | Placa do veículo e nome da rota são únicos. Capacidade, distância, peso e prazo devem ser positivos.                                             |
| RN04 | Um veículo em manutenção não pode ser associado a uma nova entrega. A capacidade deve suportar a carga.                                          |
| RN05 | Apenas uma entrega pode estar em andamento por veículo. O início verifica ocupação em transação.                                                 |
| RN06 | Veículo ocupado não pode entrar em manutenção nem ter capacidade reduzida abaixo da carga ativa.                                                 |
| RN07 | Rota escolhida deve ter a mesma origem e destino da entrega. Uma entrega não inicia sem rota.                                                    |
| RN08 | Estados permitidos: pendente → em andamento/cancelada; em andamento → concluída/cancelada. Estados terminais não retrocedem.                     |
| RN09 | Alteração de descrição, peso, prazo, data, veículo ou rota ocorre somente enquanto a entrega está pendente.                                      |
| RN10 | Rotas têm de 2 a 30 pontos com latitude entre -90 e 90 e longitude entre -180 e 180.                                                             |
| RN11 | Tempo estimado = distância / velocidade × 60, arredondado para duas casas. Velocidade normal 30; lenta 20 km/h.                                  |
| RN12 | São comparadas apenas rotas compatíveis com origem/destino da entrega; menor tempo é recomendado e menor ID desempata.                           |
| RN13 | Tempo menor ou igual ao prazo atende ao prazo. Ausência de rota compatível impede a simulação.                                                   |
| RN14 | Salvar simulação guarda um retrato dos resultados. Recalcular mantém o autor original e registra quem atualizou.                                 |
| RN15 | O autor de entregas/simulações vem da sessão autenticada; o cliente não pode definir `usuario_id`.                                               |
| RN16 | Relações existentes bloqueiam exclusão de usuário, veículo, rota ou entrega, evitando perda de integridade. Exclua dependentes primeiro.         |
| RN17 | Painel usa a última simulação por entrega para tempo médio e percentual no prazo. Esses valores são previsões.                                   |

## Dados de demonstração

Uma entrega de 100 kg, prazo 20 minutos, Centro de Distribuição → Mercado Central, com duas alternativas: Via Central 8 km e Via Parque 12 km. Normal: 16/24 minutos; lento: 24/36 minutos. Duas contas de perfis diferentes permitem demonstrar permissões.
