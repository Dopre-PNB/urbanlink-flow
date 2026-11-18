# Modelo lógico — UrbanLink Flow

O modelo relacional contém cinco tabelas e sete chaves estrangeiras. É comum ao MySQL local e ao PostgreSQL usado na hospedagem. O [DER](der.md) e o [diagrama SVG](diagramas/der.svg) apresentam as mesmas entidades e relações. As fontes físicas são [schema.sql](../database/schema.sql) e [schema-postgres.sql](../database/schema-postgres.sql); os modelos da aplicação estão em [src/models/index.js](../src/models/index.js).

## Convenções

`PK`: chave primária; `FK`: chave estrangeira; `UQ`: valor único. Todos os campos são obrigatórios, exceto os dois indicados com **Sim** em **Nulo?**. Identificadores são inteiros gerados automaticamente. `Decimal(10,2)` representa dez dígitos totais, sendo dois decimais; o SQL usa `DECIMAL` no MySQL e `NUMERIC` no PostgreSQL.

Todas as tabelas possuem `createdAt` e `updatedAt`: `DATETIME(3)` no MySQL e `TIMESTAMPTZ(3)` no PostgreSQL. O script MySQL atualiza `updatedAt` automaticamente; no PostgreSQL, o Sequelize faz isso nas gravações da aplicação. Gravações SQL manuais no PostgreSQL devem atualizar esse campo explicitamente.

## usuarios

| Atributo   | Tipo lógico      | Nulo? | Chaves / regra                                   |
| ---------- | ---------------- | ----- | ------------------------------------------------ |
| id         | Inteiro gerado   | Não   | PK                                               |
| nome       | Texto(100)       | Não   | Nome do usuário                                  |
| email      | Texto(150)       | Não   | UQ                                               |
| senha_hash | Texto(255)       | Não   | Hash bcrypt; senha em texto não é persistida     |
| tipo       | Domínio de texto | Não   | `administrador` ou `operador`; padrão `operador` |
| createdAt  | Data e hora      | Não   | Criação                                          |
| updatedAt  | Data e hora      | Não   | Última atualização                               |

## veiculos

| Atributo      | Tipo lógico      | Nulo? | Chaves / regra                                    |
| ------------- | ---------------- | ----- | ------------------------------------------------- |
| id            | Inteiro gerado   | Não   | PK                                                |
| nome          | Texto(100)       | Não   | Nome de identificação                             |
| placa         | Texto(15)        | Não   | UQ; API converte para maiúsculas                  |
| capacidade_kg | Decimal(10,2)    | Não   | Maior que zero                                    |
| status        | Domínio de texto | Não   | `disponivel` ou `manutencao`; padrão `disponivel` |
| createdAt     | Data e hora      | Não   | Criação                                           |
| updatedAt     | Data e hora      | Não   | Última atualização                                |

## rotas

| Atributo     | Tipo lógico    | Nulo? | Chaves / regra                               |
| ------------ | -------------- | ----- | -------------------------------------------- |
| id           | Inteiro gerado | Não   | PK                                           |
| nome         | Texto(100)     | Não   | UQ                                           |
| origem       | Texto(150)     | Não   | Origem do percurso                           |
| destino      | Texto(150)     | Não   | Destino do percurso                          |
| distancia_km | Decimal(10,2)  | Não   | Maior que zero                               |
| pontos       | JSON           | Não   | Lista ordenada de coordenadas `{ lat, lng }` |
| createdAt    | Data e hora    | Não   | Criação                                      |
| updatedAt    | Data e hora    | Não   | Última atualização                           |

## entregas

| Atributo      | Tipo lógico      | Nulo?   | Chaves / regra                                                            |
| ------------- | ---------------- | ------- | ------------------------------------------------------------------------- |
| id            | Inteiro gerado   | Não     | PK                                                                        |
| descricao     | Texto(200)       | Não     | Identificação da carga/operação                                           |
| origem        | Texto(150)       | Não     | Origem solicitada                                                         |
| destino       | Texto(150)       | Não     | Destino solicitado                                                        |
| peso_kg       | Decimal(10,2)    | Não     | Maior que zero                                                            |
| prazo_min     | Decimal(10,2)    | Não     | Maior que zero                                                            |
| data_agendada | Data             | Não     | Formato `AAAA-MM-DD`                                                      |
| status        | Domínio de texto | Não     | `pendente`, `em_andamento`, `concluida` ou `cancelada`; padrão `pendente` |
| usuario_id    | Inteiro          | Não     | FK → `usuarios.id`; autor                                                 |
| veiculo_id    | Inteiro          | Não     | FK → `veiculos.id`                                                        |
| rota_id       | Inteiro          | **Sim** | FK → `rotas.id`; rota escolhida                                           |
| createdAt     | Data e hora      | Não     | Criação                                                                   |
| updatedAt     | Data e hora      | Não     | Última atualização                                                        |

## simulacoes

| Atributo          | Tipo lógico      | Nulo?   | Chaves / regra                                         |
| ----------------- | ---------------- | ------- | ------------------------------------------------------ |
| id                | Inteiro gerado   | Não     | PK                                                     |
| entrega_id        | Inteiro          | Não     | FK → `entregas.id`                                     |
| cenario           | Domínio de texto | Não     | `normal` ou `lento`                                    |
| velocidade_kmh    | Inteiro          | Não     | 20 ou 30                                               |
| prazo_min         | Decimal(10,2)    | Não     | Maior que zero; prazo considerado no cálculo           |
| rota_id           | Inteiro          | Não     | FK → `rotas.id`; rota recomendada                      |
| resultados        | JSON             | Não     | Retrato das alternativas ordenadas pelo tempo estimado |
| usuario_id        | Inteiro          | Não     | FK → `usuarios.id`; autor original                     |
| atualizado_por_id | Inteiro          | **Sim** | FK → `usuarios.id`; último atualizador                 |
| createdAt         | Data e hora      | Não     | Criação                                                |
| updatedAt         | Data e hora      | Não     | Última atualização                                     |

Cada item de `resultados` contém `rota_id`, `nome`, `origem`, `destino`, `distancia_km`, `tempo_min`, `dentro_prazo` e `pontos`. Identificadores dentro desse JSON não são FKs: o vínculo relacional da rota recomendada é `simulacoes.rota_id`.

## Relacionamentos

| Chave estrangeira            | Referência  | Cardinalidade por registro de origem             |
| ---------------------------- | ----------- | ------------------------------------------------ |
| entregas.usuario_id          | usuarios.id | Cada entrega tem exatamente 1 autor              |
| entregas.veiculo_id          | veiculos.id | Cada entrega tem exatamente 1 veículo            |
| entregas.rota_id             | rotas.id    | Cada entrega tem 0 ou 1 rota escolhida           |
| simulacoes.entrega_id        | entregas.id | Cada simulação tem exatamente 1 entrega          |
| simulacoes.rota_id           | rotas.id    | Cada simulação tem exatamente 1 rota recomendada |
| simulacoes.usuario_id        | usuarios.id | Cada simulação tem exatamente 1 autor            |
| simulacoes.atualizado_por_id | usuarios.id | Cada simulação tem 0 ou 1 último atualizador     |

No sentido inverso, cada registro referenciado admite `0..N` registros dependentes. Todas as FKs usam `ON DELETE RESTRICT` e `ON UPDATE RESTRICT`: um vínculo existente impede excluir ou alterar o identificador referenciado.

## Integridade: banco e aplicação

| Regra                                               | Onde é aplicada                                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| PKs, FKs, nulabilidade e unicidade                  | Scripts SQL e modelos Sequelize                                                                        |
| Capacidade, distância, peso e prazo positivos       | `CHECK` no SQL e validação da API                                                                      |
| Domínios de perfil, status e cenário                | `ENUM` no MySQL; `CHECK` no PostgreSQL; validação da API                                               |
| Velocidade em 20 ou 30 km/h                         | `CHECK` no SQL; serviço escolhe conforme o cenário                                                     |
| Entrega em andamento exige rota                     | `CHECK` no SQL e validação da API                                                                      |
| Veículo com no máximo uma entrega em andamento      | Serviço de entregas, em transação com bloqueio do veículo; não há índice SQL exclusivo para essa regra |
| Peso compatível com capacidade e veículo disponível | Serviços de entregas e veículos                                                                        |
| Rota e entrega com mesma origem/destino             | Serviços de entregas e simulações                                                                      |
| Pontos com 2 a 30 coordenadas válidas               | Validação da API; SQL exige JSON não nulo                                                              |
| Autoria definida pela sessão autenticada            | Serviços de entregas e simulações                                                                      |

Os índices únicos de e-mail, placa e nome da rota evitam duplicidade. O MySQL utiliza a collation `utf8mb4_unicode_ci` do banco criado pelo script; o PostgreSQL inclui índices únicos adicionais em `LOWER(email)`, `LOWER(placa)` e `LOWER(nome)` para ignorar maiúsculas/minúsculas. Índices de origem/destino, status, data, veículo/status e entrega/data de atualização atendem às consultas frequentes. O PostgreSQL também declara índices explícitos nas demais FKs; o InnoDB cria os índices necessários para suas FKs.

## Organização e dados derivados

Usuários, veículos e rotas são referenciados por identificadores, evitando repetir credenciais, placas e perfis nas entregas. Origem e destino da entrega registram a solicitação; os campos da rota descrevem o percurso. O JSON de resultados é uma cópia deliberada dos dados usados no cálculo, preservando a previsão até sua próxima edição.

`codigo` da entrega (`ULF-0001`), `ocupado` do veículo e `recomendada_id` da simulação são valores derivados/virtuais da API, não colunas físicas. `recomendada_id` expõe o identificador persistido em `simulacoes.rota_id`. Os indicadores do painel são calculados por consulta, sem tabela adicional.
