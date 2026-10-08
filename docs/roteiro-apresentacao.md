# Roteiro de apresentação

## Mensagem principal

“A UrbanLink Flow cadastra uma entrega, compara percursos disponíveis, prevê o tempo de transporte e acompanha a operação. O projeto usa dados de demonstração para explicar como cenários de circulação afetam o prazo.”

## Demonstração de 5 a 8 minutos

| Etapa | Mostrar               | Explicação simples                                                                                         |
| ----- | --------------------- | ---------------------------------------------------------------------------------------------------------- |
| 1     | Página inicial        | Identidade visual baseada no Figma. O acesso leva à plataforma.                                            |
| 2     | Login como operador   | Todos entram pela mesma tela; o perfil define as ações disponíveis.                                        |
| 3     | Entrega demonstrativa | Uma carga de 100 kg vai do Centro de Distribuição ao Mercado Central, com prazo de 20 minutos.             |
| 4     | Cenário normal        | 8 km a 30 km/h levam 16 minutos. A alternativa de 12 km leva 24. O sistema recomenda a primeira.           |
| 5     | Cenário lento         | A 20 km/h, os tempos sobem para 24 e 36 minutos. A primeira continua melhor, mas ultrapassa o prazo.       |
| 6     | Mapa e salvar         | Mapa ilustra as duas alternativas. Salvar mantém o resultado no banco; confirmar associa a rota à entrega. |
| 7     | Iniciar e concluir    | Status representa o acompanhamento; um veículo ocupado não inicia outra entrega.                           |
| 8     | Painel                | Contagens mostram os estados; médias representam previsões salvas.                                         |
| 9     | Login administrador   | Apresentar as abas de veículos, rotas e usuários e uma ação que o operador não pode executar.              |

## O cálculo

`Tempo em minutos = distância em quilômetros ÷ velocidade média × 60`.

| Cenário         | Via Central: 8 km | Via Parque: 12 km | Prazo de 20 min     |
| --------------- | ----------------: | ----------------: | ------------------- |
| Normal, 30 km/h |            16 min |            24 min | Via Central atende. |
| Lento, 20 km/h  |            24 min |            36 min | Nenhuma atende.     |

“A simulação compara alternativas cadastradas. As distâncias são estimativas; os pontos do mapa ilustram o trajeto. O cenário lento representa uma hipótese, não uma medição de trânsito.”

## Perguntas prováveis

**Como é escolhida a melhor rota?** Calculamos o tempo de cada alternativa com origem/destino compatíveis e selecionamos o menor. Em empate, usamos o menor ID. Com a mesma velocidade média, a menor distância vence.

**Por que a recomendação não muda no cenário lento?** A velocidade cai igualmente nas alternativas. O objetivo do cenário é demonstrar o impacto no prazo.

**O veículo aparece se movendo?** A operação é acompanhada pela mudança de status. O mapa mostra os percursos cadastrados; não há rastreamento GPS.

**Onde os dados ficam?** No MySQL. A API do servidor valida os dados e aplica regras antes de gravar. O front-end exibe o resultado.

**Como os perfis são protegidos?** O login gera um token temporário. O servidor valida o token e consulta o perfil atual antes das ações. Esconder um botão é apenas conveniência visual.

**O que acontece ao cadastrar uma carga maior que a capacidade?** A API recusa com uma mensagem. Um veículo só transporta uma entrega em andamento por vez.

## Preparação

Deixe a aplicação e o banco ativos. Confira as duas contas e a existência das rotas de 8/12 km. A entrega inicial só é criada uma vez; depois de concluí-la, crie outra entrega pendente para repetir a apresentação. Teste acesso à internet para o mapa-base. Tenha os documentos de modelos e testes disponíveis. Não use resultados de simulação como promessa de duração real.
