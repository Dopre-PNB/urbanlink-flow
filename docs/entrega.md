# Conferência da entrega — UrbanLink Flow

Este índice relaciona os cinco requisitos aos arquivos e links da entrega, revisados em **18/11/2026**.

| Requisito                                  | Local de conferência                                                                                                  | Situação                                                                                           |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1. GitHub com todos os códigos organizados | [Dopre-PNB/urbanlink-flow](https://github.com/Dopre-PNB/urbanlink-flow), com `src/`, `public/`, `scripts/` e `tests/` | Repositório público atualizado.                                                                    |
| 2. Site publicado e funcionando            | [urbanlink-flow.onrender.com](https://urbanlink-flow.onrender.com)                                                    | Publicação ativa, API conectada ao banco e 21 cenários de interface aprovados.                     |
| 3. README completo                         | [README.md](../README.md)                                                                                             | Nome, descrição, objetivo, funcionalidades, tecnologias, site e modelagem documentados.            |
| 4. Modelagem na pasta de documentação      | [Modelo conceitual](modelo-conceitual.md), [modelo lógico](modelo-logico.md), [DER](der.md) e [diagramas](diagramas/) | Documentos, diagramas SVG e fontes editáveis disponíveis em `docs/`.                               |
| 5. Pasta de arquivos adicionais            | [arquivos-adicionais/](../arquivos-adicionais/README.md)                                                              | SQL de criação/inserção para MySQL e PostgreSQL, ordem de execução e instruções de instalação/uso. |

## Arquivos para avaliação

- [Instalar, configurar, executar e utilizar o sistema](../arquivos-adicionais/instalacao-e-uso.md).
- [Modelo conceitual](modelo-conceitual.md), com entidades, regras e cardinalidades.
- [Modelo lógico](modelo-logico.md), com tabelas, atributos, tipos, PKs e FKs.
- [Diagrama Entidade-Relacionamento](der.md), com arquivos visuais e fontes editáveis.
- [Criação do banco e das tabelas MySQL](../arquivos-adicionais/sql/mysql/01-criar-banco-e-tabelas.sql) e [dados SQL MySQL](../arquivos-adicionais/sql/mysql/02-inserir-dados.sql).
- [Criação do banco PostgreSQL](../arquivos-adicionais/sql/postgresql/00-criar-banco-local.sql), [tabelas PostgreSQL](../arquivos-adicionais/sql/postgresql/01-criar-tabelas.sql) e [dados SQL PostgreSQL](../arquivos-adicionais/sql/postgresql/02-inserir-dados.sql).
- [Scripts SQL e ordem de execução](../arquivos-adicionais/README.md).
- [Resultados de testes](resultados-testes.md) e [roteiro de apresentação](roteiro-apresentacao.md).

## Acessar o sistema publicado

O responsável deve fornecer as credenciais privadas ao avaliador por um canal privado. O site não possui cadastro público e as contas de demonstração documentadas no README são somente locais. Na hospedagem, estão disponíveis um administrador e um operador privado, dois veículos, duas rotas e uma entrega pendente de exemplo.

Para avaliar, entre com o operador, abra a entrega demonstrativa, compare os cenários normal e lento, salve a simulação, confirme a rota, atualize o estado da entrega e confira o painel. Use o administrador para testar os cadastros. O [guia de uso](../arquivos-adicionais/instalacao-e-uso.md) detalha as ações.

## Validação e disponibilidade

Em 18/11/2026, o Render confirmou a publicação ativa e `/api/health` retornou `{"status":"ok","banco":"conectado"}`. A suíte de API e serviços aprovou **32 testes** na instalação local e na execução voltada ao site publicado. A suíte de interface aprovou **21 cenários** no site publicado, incluindo login, cadastros, entregas, simulações, filtros e uso em telas menores. [Resultados dos testes](resultados-testes.md)

A hospedagem permanece gratuita. O banco lógico UrbanLink usa usuário próprio em uma instância PostgreSQL compartilhada, autorizada pelo responsável, sem acesso às tabelas do outro projeto. O banco antigo expirado foi preservado, mas os seus dados não foram migrados. A instância atual expira em **17/12/2026 às 21h41 (Brasília)**. Exporte os dados e defina um novo destino antes dessa data; veja o [guia de publicação](publicacao-github-render.md).
