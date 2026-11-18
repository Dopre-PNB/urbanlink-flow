# Conferência da entrega — UrbanLink Flow

Este índice relaciona cada requisito aos arquivos do repositório e registra a pendência que impede considerar a entrega totalmente concluída. Revisão em **18/11/2026**.

| Requisito                               | Local de conferência                                                                                                  | Situação                                                                                             |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1. Link do GitHub e códigos organizados | [Dopre-PNB/urbanlink-flow](https://github.com/Dopre-PNB/urbanlink-flow), com `src/`, `public/`, `scripts/` e `tests/` | Repositório público identificado; arquivos da revisão preparados para atualização.                   |
| 2. Site publicado e funcionando         | [urbanlink-flow.onrender.com](https://urbanlink-flow.onrender.com)                                                    | **Pendente:** tela de inicialização do Render; `/api/health` sem resposta em 25 segundos na revisão. |
| 3. README completo                      | [README.md](../README.md)                                                                                             | Nome, descrição, objetivo, funcionalidades, tecnologias, endereço e modelagem documentados.          |
| 4. Modelagem na pasta de documentação   | [Modelo conceitual](modelo-conceitual.md), [modelo lógico](modelo-logico.md), [DER](der.md) e [diagramas](diagramas/) | Arquivos disponíveis em `docs/`.                                                                     |
| 5. Pasta de arquivos adicionais         | [arquivos-adicionais/](../arquivos-adicionais/README.md)                                                              | SQL de criação/inserção para MySQL e PostgreSQL e acesso às instruções de instalação/uso.            |

## Arquivos para avaliação

- [Instalar, configurar, executar e utilizar o sistema](instalacao-e-uso.md).
- [Modelagem conceitual](modelo-conceitual.md), com entidades, regras e cardinalidades.
- [Modelagem lógica](modelo-logico.md), com tabelas, atributos, tipos, PKs e FKs.
- [Diagrama Entidade-Relacionamento](der.md), com arquivos visuais e fontes editáveis.
- [Estrutura SQL MySQL](../database/schema.sql) e [dados SQL MySQL](../database/seed.sql).
- [Estrutura SQL PostgreSQL](../database/schema-postgres.sql) e [dados SQL PostgreSQL](../database/seed-postgres.sql).
- [Entradas SQL e ordem de execução](../arquivos-adicionais/README.md).
- [Resultados de testes](resultados-testes.md) e [roteiro de apresentação](roteiro-apresentacao.md).

## Concluir o requisito de publicação

A última verificação completa registrada da hospedagem é de 08/10/2026. O PostgreSQL gratuito original tinha expiração prevista para 07/11/2026. O estado atual do recurso e a causa da indisponibilidade precisam ser confirmados no Render; a data prevista não substitui essa conferência.

Após corrigir a publicação, confirme a resposta `{"status":"ok","banco":"conectado"}` em `/api/health`, faça login, cadastre uma entrega de teste, compare e salve uma simulação, atualize o estado e confira o painel. O responsável deve fornecer credenciais ao avaliador por canal privado: as contas demonstrativas documentadas são locais e não são criadas em produção.

Registre a nova verificação em [resultados-testes.md](resultados-testes.md) e atualize a situação neste índice, no README e no [guia de publicação](publicacao-github-render.md). Até lá, não apresente o link como sistema funcional validado.
