# Identidade visual — UrbanLink Flow

A identidade aproxima a plataforma do universo de mapas e operações urbanas,
com interfaces claras, nome legível e uma linguagem visual consistente.

## Referências

- [Mapbox](https://www.mapbox.com/brand-guidelines): legibilidade da marca e presença visual dos mapas.
- [Onfleet](https://support.onfleet.com/hc/en-us/articles/360023669612-Map-Sidebar): organização de entregas, navegação e informações do percurso.
- [Linear](https://linear.app/): tipografia, alinhamento, hierarquia e acabamento dos componentes.
- [Samsara](https://www.samsara.com/company/news/press-releases/samsara-brand-refresh-physical-ai): identidade ligada ao movimento e às operações logísticas.

As referências orientam a composição; o símbolo e os componentes da UrbanLink
Flow foram desenhados para este projeto.

## Marca e cores

O símbolo representa um percurso contínuo com dois pontos de conexão e forma
um U geométrico. O nome completo aparece em uma linha, com “Flow” em azul.
Os SVGs preservam a nitidez em diferentes tamanhos e usam letras em contornos.

| Uso                                 | Cor       |
| ----------------------------------- | --------- |
| Navy: navegação e áreas de destaque | `#0B1729` |
| Azul: ações principais e marca      | `#2563EB` |
| Fundo das telas                     | `#F6F8FB` |
| Texto principal                     | `#17243B` |
| Texto secundário                    | `#64748B` |
| Bordas                              | `#E2E8F0` |

`brand-logo.svg` atende fundos claros; `brand-logo-light.svg` atende fundos
escuros. `brand-mark.svg` contém o símbolo isolado e `favicon.svg` identifica
a aba do navegador. As imagens anteriores permanecem como materiais de origem.

## Tipografia e componentes

A fonte Inter Variable 4.1 é servida pelo próprio projeto, com pesos de 100 a
900 e licença SIL Open Font License 1.1 em `public/assets/fonts/LICENSE.txt`.
Os títulos, números e textos usam a mesma família, com tamanho e peso para
estabelecer hierarquia. Os ícones são lineares e acompanham rótulos legíveis.

Cartões, tabelas, formulários e botões compartilham cores e espaçamentos.
Sombras, bordas, cantos arredondados e estados de interação são discretos.
O foco de teclado permanece visível e as tabelas podem rolar dentro de seu
próprio espaço quando a tela é estreita.

## Aplicação nas seis páginas

- **Início:** apresenta a marca, o propósito e o acesso à plataforma.
- **Login:** usa a mesma identidade em uma composição dedicada ao acesso.
- **Painel:** organiza indicadores e o acompanhamento das entregas.
- **Entregas:** prioriza filtros, tabela e ações operacionais.
- **Simulação:** organiza parâmetros, resultados e mapa com hierarquia comum.
- **Cadastros:** mantém a linguagem dos formulários e tabelas da operação.

As páginas internas compartilham a navegação lateral no computador, adaptada
para telas menores. A composição se ajusta a computador, tablet e celular.

## Manutenção

A interface continua em HTML e CSS, sem framework de interface. `brand.css`
centraliza a fonte e os utilitários da marca; `styles.css` contém as variáveis
de cor e os componentes compartilhados; `marketing.css` organiza início e
login; `workspace.css` define a composição das quatro telas internas. A
identidade visual não exige mudanças nas regras do backend.
