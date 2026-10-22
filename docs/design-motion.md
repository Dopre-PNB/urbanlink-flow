# Identidade visual e movimento

Direção aprovada em 22/10/2026 e integrada às seis páginas existentes. A logo e a fonte Inter originais foram preservadas.

## Páginas

- **Início:** vídeos de rodovia e de entrega com van, bloco do título centralizado na tela com as linhas alinhadas à esquerda, grade técnica, percurso ilustrativo animado e links para as funções reais da plataforma. O cabeçalho apresenta as seções da página e concentra o acesso à plataforma; no celular, esse acesso fica no menu.
- **Login:** a mesma identidade com filme lateral e formulário integrado à autenticação existente.
- **Painel, entregas, simulação e cadastros:** fundo grafite, superfícies discretas, texto marfim e acentos no azul da marca, com tabelas, filtros, indicadores, mapas e diálogos preservados.

`public/css/home.css` e `login.css` cuidam das páginas públicas; `workspace.css` cuida das quatro páginas protegidas, sobre a estrutura de `styles.css`. `public/js/motion.js` e `css/motion.css` compartilham o movimento.

## Comportamento

As trocas entre documentos usam View Transitions onde houver suporte e continuam sendo navegações HTML normais nos demais navegadores. As páginas de trabalho usam movimentos curtos; a apresentação pública usa uma transição mais ampla. Os links, parâmetros de agenda/entrega, filtros, permissões e gravações pela API foram preservados.

A página inicial usa Lenis 1.3.27 para suavizar a roda do mouse, com interpolação de 0,14 e distância original dos gestos. O conteúdo continua usando a rolagem real do documento, preservando o cabeçalho fixo e as seções aderentes. Toque permanece nativo; teclado, links e menu continuam disponíveis. O login e as páginas de trabalho não carregam essa biblioteca. Os arquivos e a licença ficam em `public/vendor/lenis`, sem depender de um CDN durante a navegação.

Vídeos e animações ficam sempre habilitados nas seis páginas, sem opção de ligar ou desligar, conforme solicitado pelo usuário. A preferência do sistema e as antigas escolhas de sessão não desativam o movimento. Os vídeos iniciam automaticamente, sem som e em repetição; ao retornar a uma aba oculta, a reprodução é retomada automaticamente. Na simulação, os percursos reais cadastrados são desenhados progressivamente e os resultados entram em sequência; a geometria, os cálculos e os dados retornados pela API são preservados. Os formulários mantêm seus alvos de clique parados durante a entrada visual. Sem JavaScript, o conteúdo principal continua visível.

Os vídeos foram otimizados para H.264 sem áudio, com início rápido, somando aproximadamente 4,2 MB. Fontes, autores e licença estão em `public/assets/media/media-sources.md`.

## Verificação

Na integração da rolagem suave, o navegador interno confirmou posições intermediárias após um único gesto da roda, inversão do sentido, navegação por âncoras com o afastamento do cabeçalho preservado, tecla Home, bloqueio do fundo com o menu aberto, fechamento por Escape e retorno do login. O login permaneceu sem Lenis e com a altura do documento igual à da janela.

Os testes automatizados e o roteiro manual estão registrados em `docs/resultados-testes.md`. Para visualizar a aplicação completa, use `npm.cmd run demo` e abra <http://127.0.0.1:3000/>. O servidor `preview-concept.js` serve apenas a prévia estática do estudo e não substitui a API/banco da aplicação.
