# Diagramas do banco de dados

- [Modelo conceitual](modelo-conceitual.svg): entidades do domínio e cardinalidades.
- [DER](der.svg): tabelas, atributos, chaves e relacionamentos implementados.

Os arquivos SVG podem ser abertos em qualquer navegador, ampliados e incluídos em apresentações. A cardinalidade indicada junto ao nome de uma entidade informa quantos registros dessa entidade se associam a um registro da entidade oposta. Os documentos [conceitual](../modelo-conceitual.md), [lógico](../modelo-logico.md) e [DER](../der.md) apresentam o detalhamento e uma representação Mermaid editável.

Para alterar a apresentação visual dos SVGs, edite [gerar-diagramas.mjs](gerar-diagramas.mjs) e execute na raiz do projeto:

```powershell
node docs/diagramas/gerar-diagramas.mjs
```

O gerador utiliza somente recursos nativos do Node.js e não altera o banco de dados.
