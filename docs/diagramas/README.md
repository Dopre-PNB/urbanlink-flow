# Diagramas do banco de dados

- [Modelo conceitual](modelo-conceitual.svg): entidades do domínio e cardinalidades.
- [Modelo lógico](modelo-logico.svg): tabelas, atributos, tipos e chaves.
- [DER](der.svg): tabelas, atributos, chaves e relacionamentos implementados.

Os arquivos SVG podem ser ampliados no navegador e incluídos em apresentações. Os documentos [conceitual](../modelo-conceitual.md), [lógico](../modelo-logico.md) e [DER](../der.md) detalham os modelos. O conceitual e o DER também oferecem representações editáveis em Mermaid.

Para alterar a apresentação visual dos SVGs, edite [gerar-diagramas.mjs](gerar-diagramas.mjs) e execute na raiz do projeto:

```powershell
node docs/diagramas/gerar-diagramas.mjs
```

O gerador utiliza somente recursos nativos do Node.js e não altera o banco de dados.
