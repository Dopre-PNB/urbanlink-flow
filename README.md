# UrbanLink Flow

Projeto final de Desenvolvimento de Sistemas: plataforma web simples para cadastrar entregas, comparar percursos e acompanhar uma operação logística. O back-end segue as aulas de Node.js, Express, Sequelize e MySQL; as páginas usam HTML, CSS e JavaScript puro.

## Publicar no GitHub e no Render

O projeto inclui `render.yaml` para hospedar site e API juntos em um Web Service Node, com banco MySQL hospedado separadamente. Siga o [passo a passo de publicação](docs/publicacao-github-render.md). Em produção, o primeiro administrador usa credenciais configuradas no Render e as contas de demonstração não são criadas.

## Começar no Windows

Requisitos: Node.js 22 a 24 e MySQL 8 ou superior. No PowerShell, entre nesta pasta e execute:

```powershell
npm.cmd install
```

A forma mais simples de apresentar usando a instância dedicada é:

```powershell
npm.cmd run demo
```

Esse comando prepara o MySQL local na porta 3307, cria `.env` quando ele não existe, executa o setup e mantém banco e servidor ativos no mesmo terminal. Mantenha esse terminal aberto enquanto usa a plataforma. Se já configurou `.env` para um banco próprio, use a instalação manual abaixo. O comando preserva configurações existentes.

Também é possível executar as etapas separadamente:

**MySQL já instalado:** copie a configuração de exemplo e edite `.env` com endereço, porta, usuário e senha de uma conta que possa criar o banco `urbanlink_flow`. Depois:

```powershell
Copy-Item .env.example .env
npm.cmd run db:setup
npm.cmd start
```

**Instância local isolada para este projeto:** execute:

```powershell
npm.cmd run db:local
npm.cmd run db:setup
npm.cmd start
```

O comando `db:local` prepara uma instância MySQL dedicada ao projeto na porta 3307, cria `.env` automaticamente se não existir e preserva seus dados entre execuções. Use essa opção antes de copiar o exemplo de configuração: o comando preserva um `.env` existente e recusa sobrescrevê-lo. Procura por padrão `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe`; se o MySQL estiver em outro local, defina `$env:MYSQLD_PATH` com o caminho do executável. Para encerrar essa instância depois de fechar a aplicação: `npm.cmd run db:stop`.

Abra [http://localhost:3000](http://localhost:3000). A documentação interativa da API está em [http://localhost:3000/api/docs](http://localhost:3000/api/docs); a especificação está em [http://localhost:3000/api/openapi.json](http://localhost:3000/api/openapi.json). `db:setup` executa o script físico do banco e cria dados de demonstração de forma idempotente; não apaga o banco existente.

## Contas de demonstração

| Perfil        | E-mail                   | Senha        |
| ------------- | ------------------------ | ------------ |
| Administrador | admin@urbanlink.local    | Admin@123    |
| Operador      | operador@urbanlink.local | Operador@123 |

Estas credenciais são destinadas à apresentação local. O administrador cadastra outros usuários. Não há cadastro público. Os dois perfis usam a mesma tela de login; o servidor determina as permissões pelo perfil registrado no banco.

O administrador gerencia usuários, veículos e rotas e pode excluir registros. O operador consulta dados, cria e atualiza entregas e executa simulações. O sistema bloqueia exclusões que quebrariam relacionamentos. Senhas são armazenadas como hashes bcrypt e não aparecem nos retornos da API.

## Como demonstrar

1. Entre como operador e abra Entregas.
2. Selecione a entrega demonstrativa de 100 kg, do Centro de Distribuição ao Mercado Central, com prazo de 20 minutos.
3. Simule circulação normal: Via Central, de 8 km, leva 16 minutos; Via Parque, de 12 km, leva 24 minutos. A Via Central é recomendada e atende ao prazo.
4. Troque para circulação lenta: os tempos passam a 24 e 36 minutos. A recomendação continua sendo Via Central, mas o prazo é ultrapassado.
5. Salve a simulação e confirme a rota para a entrega. Atualize o status para em andamento e depois concluída.
6. Confira os indicadores no Painel. Entre como administrador para demonstrar os cadastros e a diferença de permissões.

Veja o roteiro completo em [docs/roteiro-apresentacao.md](docs/roteiro-apresentacao.md).

## Páginas

| Página           | Finalidade                                                |
| ---------------- | --------------------------------------------------------- |
| `index.html`     | Apresentação pública inspirada no design fornecido.       |
| `login.html`     | Entrada única para administrador e operador.              |
| `painel.html`    | Indicadores e últimas entregas.                           |
| `entregas.html`  | Cadastro, busca, filtro por status/data e acompanhamento. |
| `simulacao.html` | Comparação de percursos, cenários, histórico e mapa.      |
| `cadastros.html` | Abas de veículos, rotas e usuários, para administrador.   |

Agenda corresponde ao filtro por data em Entregas. Mapa é uma seção de Simulação. O menu mantém as referências do design sem acrescentar outras páginas.

## Simulação e limites

As distâncias são estimativas cadastradas para duas alternativas que têm a mesma origem e o mesmo destino. A previsão usa `tempo em minutos = distância em km / velocidade em km/h × 60`: 30 km/h no cenário normal e 20 km/h no lento. Recomenda-se o menor tempo; em caso de igualdade, vence a rota de menor ID. A igualdade com o prazo conta como dentro do prazo.

Os pontos no mapa ilustram o percurso cadastrado. A aplicação não calcula distâncias viárias, GPS ou tráfego ao vivo. O mapa-base do OpenStreetMap depende de internet. Cadastros e cálculos usam a API e o MySQL configurados: locais na demonstração e hospedados na publicação. O monitoramento resulta da atualização de status pelo operador. O Painel consulta a API a cada 30 segundos, pausando a consulta quando a aba fica oculta. A média de tempo e o percentual dentro do prazo vêm da última simulação de cada entrega, não da duração real da viagem.

## Estrutura e documentação

```text
database/schema.sql       banco físico, PK, FK e índices
docs/                     requisitos, modelos, OpenAPI, testes e apresentação
public/                   seis páginas, CSS, JavaScript e imagens
scripts/                  configuração MySQL local, setup e dados iniciais
src/config/               ambiente e conexão Sequelize
src/models/               entidades e relacionamentos
src/services/             regras de negócio e transações
src/controllers/          entrada/saída HTTP
src/routes/               endpoints REST
src/middlewares/          autenticação, autorização e erros
src/app.js                inicialização do Express
tests/                    testes automatizados da API e da interface
```

Documentos principais:

- [Requisitos e regras](docs/requisitos.md)
- [Modelo conceitual](docs/modelo-conceitual.md)
- [Modelo lógico](docs/modelo-logico.md)
- [Matriz de rastreabilidade](docs/matriz-rastreabilidade.md)
- [Plano e casos de teste](docs/plano-de-testes.md)
- [OpenAPI 3](docs/openapi.json)
- [Referências e decisões de escopo](docs/fontes-e-escopo.md)
- [Publicação no GitHub e no Render](docs/publicacao-github-render.md)

O modelo físico está em [database/schema.sql](database/schema.sql). A API segue `/api` e retorna `{ dados }` nas consultas individuais; as listas retornam `{ dados, total, pagina, limite }`. Utilize o token de login no cabeçalho `Authorization: Bearer ...`.

## Verificação

Com banco preparado e servidor ativo, em outro terminal:

```powershell
npm.cmd test
npm.cmd run test:ui
```

Os testes de API usam as contas demonstrativas, criam registros exclusivos com prefixo de teste e limpam somente os IDs que criaram. Se a aplicação usar outra porta, configure antes `$env:TEST_BASE_URL = 'http://127.0.0.1:3001'`. A verificação da interface usa o Google Chrome instalado; como alternativa, instale o Chromium com `npx.cmd playwright install chromium`. As capturas de tela e o relatório ficam em `output/verificacao/`.

Resultados executados e limitações da verificação devem ser registrados em [docs/resultados-testes.md](docs/resultados-testes.md). Alterações significativas devem receber commits descritivos no Git. `.env`, dependências, dados privados e arquivos de execução local não entram no repositório.
