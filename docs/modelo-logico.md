# Modelo lógico

Banco MySQL `urbanlink_flow`. O script [../database/schema.sql](../database/schema.sql) é a autoridade para tipos físicos, tamanho de campos, nomes de constraints e índices. Abaixo estão os atributos e relações esperados pela API.

| Tabela     | Atributos principais                                                                                                             | Chaves                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| usuarios   | id, nome, email, senha_hash, tipo, createdAt, updatedAt                                                                          | PK id; UNIQUE email                                                                                      |
| veiculos   | id, nome, placa, capacidade_kg, status, createdAt, updatedAt                                                                     | PK id; UNIQUE placa                                                                                      |
| rotas      | id, nome, origem, destino, distancia_km, pontos, createdAt, updatedAt                                                            | PK id; UNIQUE nome                                                                                       |
| entregas   | id, descricao, origem, destino, peso_kg, prazo_min, data_agendada, status, veiculo_id, rota_id, usuario_id, createdAt, updatedAt | PK id; FK veiculo_id → veiculos.id; FK rota_id → rotas.id; FK usuario_id → usuarios.id                   |
| simulacoes | id, entrega_id, cenario, velocidade_kmh, prazo_min, rota_id, resultados, usuario_id, atualizado_por_id, createdAt, updatedAt     | PK id; FK entrega_id → entregas.id; FK rota_id → rotas.id; FK usuario_id/atualizado_por_id → usuarios.id |

`rota_id` de entrega é nulo antes da escolha. `atualizado_por_id` de simulação pode ser nulo antes de uma atualização. A origem, destino e os pontos das alternativas são guardados no retrato JSON de resultados para preservar o cálculo salvo. Esse retrato tem função histórica; cadastro atual de rota continua na tabela rotas. `recomendada_id` é a representação de `rota_id` no retorno da previsão. O código `ULF-0001` da entrega e a ocupação do veículo são derivados no retorno, sem duplicação necessária no banco.

## Domínios

- Usuário.tipo: administrador, operador.
- Veículo.status: disponivel, manutencao.
- Entrega.status: pendente, em_andamento, concluida, cancelada.
- Simulação.cenario: normal, lento.
- Capacidade, distância, peso e prazo: números positivos.
- Pontos: array JSON de 2 a 30 pares lat/lng válidos.
- Agendamento: data; criação/atualização: timestamps.

## Integridade e normalização

Usuários, veículos e rotas são cadastrados uma vez e referenciados por chave estrangeira. Entregas não repetem nome/placa de veículo nem perfil do usuário. O serviço utiliza transação e bloqueio do veículo para impedir início concorrente de entregas. Exclusões de registros com vínculos recebem conflito 409, em vez de remover o histórico em cascata.

O JSON de pontos representa a sequência de um percurso visual. O JSON de resultados representa um retrato histórico da previsão, não substitui as tabelas ou o banco relacional. Os atributos escalares e relacionamentos ficam nas cinco tabelas normalizadas. Índices de placa/e-mail/nome garantem unicidade; índices de status/data/associações apoiam consultas do painel e filtros.
