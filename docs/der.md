# Diagrama Entidade-Relacionamento (DER)

Este DER representa a estrutura implementada do UrbanLink Flow: cinco tabelas, suas chaves e sete relacionamentos. Confira o [modelo conceitual](modelo-conceitual.md) para a visão do domínio e o [modelo lógico](modelo-logico.md) para tipos, nulabilidade e regras de cada atributo.

![DER do UrbanLink Flow com atributos e chaves](diagramas/der.svg)

Arquivo para apresentação: [der.svg](diagramas/der.svg). O SVG é vetorial e pode ser ampliado sem perder definição. A versão Mermaid editável está abaixo.

## Legenda

- `PK`: chave primária; `FK`: chave estrangeira; `UK` / `UQ`: valor único.
- `||`: exatamente um; `o|`: zero ou um; `o{`: zero ou muitos.
- Os dois campos opcionais são `entregas.rota_id` e `simulacoes.atualizado_por_id`.
- Todas as relações usam `ON DELETE RESTRICT` e `ON UPDATE RESTRICT`.

```mermaid
erDiagram
    USUARIOS ||--o{ ENTREGAS : cadastra
    VEICULOS ||--o{ ENTREGAS : transporta
    ROTAS o|--o{ ENTREGAS : escolhida
    ENTREGAS ||--o{ SIMULACOES : possui
    ROTAS ||--o{ SIMULACOES : recomendada
    USUARIOS ||--o{ SIMULACOES : executa
    USUARIOS o|--o{ SIMULACOES : atualiza

    USUARIOS {
        int id PK
        varchar100 nome
        varchar150 email UK
        varchar255 senha_hash
        dominio tipo
        timestamp createdAt
        timestamp updatedAt
    }
    VEICULOS {
        int id PK
        varchar100 nome
        varchar15 placa UK
        decimal10_2 capacidade_kg
        dominio status
        timestamp createdAt
        timestamp updatedAt
    }
    ROTAS {
        int id PK
        varchar100 nome UK
        varchar150 origem
        varchar150 destino
        decimal10_2 distancia_km
        json pontos
        timestamp createdAt
        timestamp updatedAt
    }
    ENTREGAS {
        int id PK
        varchar200 descricao
        varchar150 origem
        varchar150 destino
        decimal10_2 peso_kg
        decimal10_2 prazo_min
        date data_agendada
        dominio status
        int usuario_id FK
        int veiculo_id FK
        int rota_id FK "opcional"
        timestamp createdAt
        timestamp updatedAt
    }
    SIMULACOES {
        int id PK
        int entrega_id FK
        dominio cenario
        int velocidade_kmh
        decimal10_2 prazo_min
        int rota_id FK
        json resultados
        int usuario_id FK
        int atualizado_por_id FK "opcional"
        timestamp createdAt
        timestamp updatedAt
    }
```

Os tipos do diagrama são abreviações de documentação. Os tipos executáveis estão nos scripts [MySQL](../database/schema.sql) e [PostgreSQL](../database/schema-postgres.sql). Em Entregas, `rota_id` é a escolha operacional; em Simulações, é a recomendação calculada. A recomendação não altera automaticamente a rota da entrega: o operador confirma a escolha na aplicação.
