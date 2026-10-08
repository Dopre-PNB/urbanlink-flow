# Contrato de integração da implementação

Base `/api`. Erros `{ mensagem }`. Sucesso de listagens sempre `{ dados: [], total, pagina, limite }`. Singular `{ dados: objeto }`; login `{ token, usuario: { id, nome, email, tipo } }`; delete `{ mensagem }`. Datas ISO, números JSON. Página padrão 1, limite padrão 10 (máximo 100). Header `Authorization: Bearer JWT`. Sessão no front-end em sessionStorage. Senha mínimo 8 caracteres.

## Páginas

`/` ou `index.html` público, `login.html`, `painel.html`, `entregas.html`, `simulacao.html` (mapa como seção), `cadastros.html` (administrador: abas veículos/rotas/usuários). Todas servidas pelo Express na mesma origem. Operador consulta recursos e realiza entregas/simulações; só administrador escreve veículos/rotas/usuários e exclui registros. Não há cadastro público.

## Endpoints

- `GET /api/health` público: `{ status: 'ok', banco: 'conectado' }`.
- `POST /api/login` body email/senha.
- `GET /api/me` dados usuário atual, nunca hash/senha.
- CRUD `/api/usuarios` admin: nome, email, senha (opcional no PUT), tipo enum administrador/operador. Não remover próprio usuário ou último administrador; vínculos bloqueiam exclusão. Perfis atuais verificados no banco em cada requisição.
- CRUD `/api/veiculos`: nome, placa (única), capacidade_kg (>0), status enum disponivel/manutencao. GET para ambos perfis, escrita admin. Retorno inclui `ocupado` boolean calculado das entregas em_andamento. Não mudar veículo ocupado para manutenção ou capacidade menor que carga ativa.
- CRUD `/api/rotas`: nome, origem, destino, distancia_km (>0), pontos array com 2 a 30 objetos `{lat,lng}`. Distâncias são estimativas cadastradas, não medidas de ruas. GET ambos, escrita admin. Nome único para evitar duplicatas. DELETE bloqueado se existem vínculos.
- CRUD `/api/entregas`: descricao, origem, destino, peso_kg (>0), prazo_min (>0), data_agendada (YYYY-MM-DD), veiculo_id, rota_id (nullable antes da escolha), status (pendente/em_andamento/concluida/cancelada), usuario_id automático no POST. Retorno inclui `codigo` ULF-0001, `veiculo` e `rota` (objetos associados), `usuario` (id,nome). GET filtros `busca`, `status`, `data`. Ambos criam/atualizam, só admin exclui. Verificar veículo disponível e capacidade; rota, quando escolhida, deve corresponder origem/destino. Nenhuma entrega pode iniciar sem rota. Transições pendente→em_andamento/cancelada, em_andamento→concluida/cancelada, estado terminal não retrocede. Edição de dados gerais só enquanto pendente. Transação/lock ao verificar concorrência de uso de veículo. Nunca aceitar usuario_id vindo do cliente.
- `POST /api/simulacoes/prever` body `{ entrega_id, cenario: 'normal'|'lento' }`. Calcula sem gravar. Só rotas que coincidem com origem/destino da entrega. Retorno singular dados: `{ entrega_id, cenario, velocidade_kmh:30|20, prazo_min, recomendada_id, resultados:[{rota_id,nome,origem,destino,distancia_km,tempo_min,dentro_prazo,pontos}] }`. Menor tempo vence, desempate menor id, arredondar tempo a 2 decimais.
- CRUD `/api/simulacoes`: POST mesmo body acima, calcula e persiste o resultado com usuario_id autenticado e rota_id recomendada; não altera a rota da entrega automaticamente. PUT /:id recalcula o mesmo registro para novo cenario (entrega_id imutável), guarda autoria original e atualizado_por_id do token. GET filtro entrega_id, busca opcional. DELETE só admin. Retorno inclui campos de previsão, id, usuario_id, atualizado_por_id, rota_id, entrega (id,codigo,descricao), usuario (id,nome), timestamps. JSON resultados é snapshot. GET /:id singular. Frontend salvar usa POST e confirmar rota usa PUT /entregas/:id {rota_id:recomendada_id}.
- `GET /api/painel`: `{ dados:{ total_entregas, pendentes, em_andamento, concluidas, canceladas, veiculos_disponiveis, total_veiculos, tempo_medio_min, dentro_prazo_percentual, ultimas_entregas:[] } }`. Indicadores de tempo/prazo representam simulações (última por entrega) e não tempo real de execução. Mostrar essa legenda. Polling 30s com pausa em aba oculta.

GET singular em todos CRUD. POST 201, GET/PUT 200, DELETE 200; validação 400, login/token 401, perfil 403, inexistente 404, vínculo/conflito 409. Não expor erro interno de banco.

## Dados de demonstração

Administrador `admin@urbanlink.local` senha `Admin@123`; operador `operador@urbanlink.local` senha `Operador@123` (somente demonstração local, hashes bcrypt). Dois veículos e duas alternativas de rota com a MESMA origem `Centro de Distribuição` e destino `Mercado Central`: `Via Central` 8 km e `Via Parque` 12 km. Pontos em São Paulo com trajetos diferentes, dados ilustrativos. Uma entrega pendente, prazo 20 min, peso 100 kg, veículo disponível e data do dia. 30 km/h: 16/24 minutos; 20 km/h: 24/36 minutos.

## Implementação

Camadas ensinadas: routes → middleware → controllers → services → models, CommonJS. Sequelize/MySQL, timestamps createdAt/updatedAt. MySQL real. Script SQL físico completo para criar banco/tabelas; setup executa SQL de forma idempotente, seed idempotente. Sem sync force/alter, sem SQLite ou JSON como substituto do banco. SVG pequeno para ícones, HTML/CSS/JS nativos no front-end, biblioteca Leaflet local. Aplicação não publica dados nem cria GitHub remoto.
