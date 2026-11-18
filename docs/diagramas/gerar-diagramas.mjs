// Diagramas vetoriais sem dependências. Execute: node docs/diagramas/gerar-diagramas.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const escape = (value) =>
  String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const text = (x, y, value, cls = 'body', anchor = 'start') =>
  `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${escape(value)}</text>`;

function start(title, subtitle, height) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="1640" height="${height}" viewBox="0 0 1640 ${height}" role="img" aria-labelledby="title desc">`,
    `<title id="title">${escape(title)}</title><desc id="desc">Cinco entidades e sete relacionamentos do UrbanLink Flow. Somente a rota escolhida da entrega e o último atualizador da simulação são opcionais.</desc>`,
    `<style>text{font-family:Arial,Helvetica,sans-serif;fill:#173048}.title{font-size:32px;font-weight:700}.subtitle{font-size:17px;fill:#526b80}.name{font-size:23px;font-weight:700;fill:#fff}.body{font-size:18px}.row{font-family:Consolas,monospace;font-size:17px}.label{font-size:16px;font-weight:700;paint-order:stroke;stroke:#f4f7fb;stroke-width:8px;stroke-linejoin:round}.small{font-size:15px;fill:#526b80}.key{fill:#006a70;font-weight:700}.line{fill:none;stroke:#386f94;stroke-width:3;stroke-linejoin:round;stroke-linecap:round}.optional{stroke:#965989;stroke-dasharray:7 5}.point{fill:#386f94}.card{fill:#fff;stroke:#b9cbd9;stroke-width:1.5}</style>`,
    `<rect width="1640" height="${height}" fill="#f4f7fb"/>`,
    text(48, 56, title, 'title'),
    text(48, 90, subtitle, 'subtitle')
  ];
}

function card(out, x, y, w, name, rows) {
  const h = 58 + rows.length * 29 + 18;
  out.push(
    `<rect class="card" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>`,
    `<path d="M${x + 10},${y} H${x + w - 10} Q${x + w},${y} ${x + w},${y + 10} V${y + 54} H${x} V${y + 10} Q${x},${y} ${x + 10},${y}" fill="#123d55"/>`,
    text(x + 20, y + 35, name, 'name')
  );
  rows.forEach((r, i) => out.push(text(x + 20, y + 80 + i * 29, r, 'row')));
  return { x, y, w, h, b: y + h, r: x + w };
}

function edge(out, points, x, y, label, optional = false) {
  out.push(
    `<polyline class="line${optional ? ' optional' : ''}" points="${points.map((p) => p.join(',')).join(' ')}"/>`
  );
  const a = points[0],
    b = points.at(-1);
  out.push(
    `<circle cx="${a[0]}" cy="${a[1]}" r="4" fill="${optional ? '#965989' : '#386f94'}"/>`,
    `<circle cx="${b[0]}" cy="${b[1]}" r="4" fill="${optional ? '#965989' : '#386f94'}"/>`,
    text(x, y, label, 'label', 'middle')
  );
}

// A cardinalidade em cada extremidade descreve quantos registros daquela
// entidade podem estar associados a um registro da entidade oposta.
{
  const out = start(
    'UrbanLink Flow · Modelo conceitual',
    'Entidades do domínio e cardinalidades: 1 = exatamente um · 0..1 = opcional · 0..N = nenhum ou vários',
    1040
  );
  const u = card(out, 60, 160, 430, 'USUÁRIO', [
    'Pessoa autenticada',
    'Nome · e-mail · perfil',
    'Credencial protegida'
  ]);
  const v = card(out, 600, 160, 430, 'VEÍCULO', [
    'Meio de transporte',
    'Nome · placa · capacidade',
    'Disponível ou manutenção'
  ]);
  const r = card(out, 1140, 160, 430, 'ROTA', [
    'Alternativa de percurso',
    'Origem · destino · distância',
    'Pontos no mapa'
  ]);
  const e = card(out, 140, 550, 580, 'ENTREGA', [
    'Operação de transporte',
    'Descrição · peso · prazo',
    'Data agendada · status'
  ]);
  const s = card(out, 940, 550, 580, 'SIMULAÇÃO', [
    'Previsão salva de uma entrega',
    'Cenário · velocidade · prazo',
    'Resultados das alternativas'
  ]);
  edge(
    out,
    [
      [280, u.b],
      [280, 550]
    ],
    280,
    455,
    '1 cadastra 0..N'
  );
  edge(
    out,
    [
      [800, v.b],
      [800, 480],
      [650, 480],
      [650, 550]
    ],
    765,
    468,
    '1 transporta 0..N'
  );
  edge(
    out,
    [
      [1200, r.b],
      [1200, 510],
      [690, 510],
      [690, 550]
    ],
    1065,
    498,
    '0..1 escolhida em 0..N',
    true
  );
  edge(
    out,
    [
      [1430, r.b],
      [1430, 550]
    ],
    1430,
    440,
    '1 recomendada em 0..N'
  );
  edge(
    out,
    [
      [e.r, 650],
      [s.x, 650]
    ],
    830,
    628,
    '1 possui 0..N'
  );
  edge(
    out,
    [
      [u.x, 260],
      [30, 260],
      [30, 860],
      [1110, 860],
      [1110, s.b]
    ],
    600,
    847,
    'USUÁRIO 1 executa 0..N SIMULAÇÕES'
  );
  edge(
    out,
    [
      [u.x, 310],
      [12, 310],
      [12, 920],
      [1370, 920],
      [1370, s.b]
    ],
    690,
    907,
    'USUÁRIO 0..1 atualiza 0..N SIMULAÇÕES',
    true
  );
  out.push(
    text(
      60,
      985,
      'Linha tracejada: participação opcional no lado Usuário atualizador ou Rota escolhida. A tabela de cardinalidades está em modelo-conceitual.md.',
      'small'
    )
  );
  out.push('</svg>');
  writeFileSync(
    fileURLToPath(new URL('./modelo-conceitual.svg', import.meta.url)),
    out.join('\n') + '\n'
  );
}

{
  const out = start(
    'UrbanLink Flow · Diagrama Entidade-Relacionamento',
    'PK = chave primária · FK = chave estrangeira · UQ = único · ? = aceita NULL · cardinalidades explícitas nas relações',
    1430
  );
  const u = card(out, 60, 160, 450, 'usuarios', [
    'PK     id: inteiro gerado',
    '       nome: texto(100)',
    'UQ     email: texto(150)',
    '       senha_hash: texto(255)',
    '       tipo: domínio',
    '       createdAt: data/hora',
    '       updatedAt: data/hora'
  ]);
  const v = card(out, 600, 160, 440, 'veiculos', [
    'PK     id: inteiro gerado',
    '       nome: texto(100)',
    'UQ     placa: texto(15)',
    '       capacidade_kg: decimal(10,2)',
    '       status: domínio',
    '       createdAt: data/hora',
    '       updatedAt: data/hora'
  ]);
  const r = card(out, 1130, 160, 450, 'rotas', [
    'PK     id: inteiro gerado',
    'UQ     nome: texto(100)',
    '       origem: texto(150)',
    '       destino: texto(150)',
    '       distancia_km: decimal(10,2)',
    '       pontos: JSON',
    '       createdAt: data/hora',
    '       updatedAt: data/hora'
  ]);
  const e = card(out, 140, 690, 580, 'entregas', [
    'PK     id: inteiro gerado',
    '       descricao: texto(200)',
    '       origem: texto(150)',
    '       destino: texto(150)',
    '       peso_kg: decimal(10,2)',
    '       prazo_min: decimal(10,2)',
    '       data_agendada: data',
    '       status: domínio',
    'FK     usuario_id → usuarios.id',
    'FK     veiculo_id → veiculos.id',
    'FK ?   rota_id → rotas.id',
    '       createdAt: data/hora',
    '       updatedAt: data/hora'
  ]);
  const s = card(out, 940, 690, 580, 'simulacoes', [
    'PK     id: inteiro gerado',
    'FK     entrega_id → entregas.id',
    '       cenario: domínio',
    '       velocidade_kmh: inteiro',
    '       prazo_min: decimal(10,2)',
    'FK     rota_id → rotas.id',
    '       resultados: JSON',
    'FK     usuario_id → usuarios.id',
    'FK ?   atualizado_por_id → usuarios.id',
    '       createdAt: data/hora',
    '       updatedAt: data/hora'
  ]);
  edge(
    out,
    [
      [280, u.b],
      [280, 690]
    ],
    280,
    565,
    '1 cadastra 0..N'
  );
  edge(
    out,
    [
      [800, v.b],
      [800, 600],
      [650, 600],
      [650, 690]
    ],
    770,
    587,
    '1 transporta 0..N'
  );
  edge(
    out,
    [
      [1200, r.b],
      [1200, 650],
      [690, 650],
      [690, 690]
    ],
    1040,
    636,
    '0..1 escolhida em 0..N',
    true
  );
  edge(
    out,
    [
      [1430, r.b],
      [1430, 690]
    ],
    1430,
    574,
    '1 recomendada em 0..N'
  );
  edge(
    out,
    [
      [e.r, 900],
      [s.x, 900]
    ],
    830,
    878,
    '1 possui 0..N'
  );
  edge(
    out,
    [
      [u.x, 260],
      [30, 260],
      [30, 1260],
      [1110, 1260],
      [1110, s.b]
    ],
    600,
    1247,
    'USUÁRIO 1 executa 0..N SIMULAÇÕES · usuario_id'
  );
  edge(
    out,
    [
      [u.x, 360],
      [12, 360],
      [12, 1330],
      [1370, 1330],
      [1370, s.b]
    ],
    735,
    1317,
    'USUÁRIO 0..1 atualiza 0..N SIMULAÇÕES · atualizado_por_id',
    true
  );
  out.push(
    text(
      60,
      1395,
      'Todas as FKs usam ON DELETE RESTRICT e ON UPDATE RESTRICT. Tipos completos, domínios e regras estão em docs/modelo-logico.md.',
      'small'
    )
  );
  out.push('</svg>');
  writeFileSync(fileURLToPath(new URL('./der.svg', import.meta.url)), out.join('\n') + '\n');
}

function relation(out, x, y, width, name, rows, typeOffset, keyOffset) {
  const height = 86 + rows.length * 28;
  out.push(
    `<rect class="card" x="${x}" y="${y}" width="${width}" height="${height}" rx="10"/>`,
    `<path d="M${x + 10},${y} H${x + width - 10} Q${x + width},${y} ${x + width},${y + 10} V${y + 44} H${x} V${y + 10} Q${x},${y} ${x + 10},${y}" fill="#123d55"/>`,
    text(x + 20, y + 30, name, 'name'),
    text(x + 20, y + 69, 'Atributo', 'column'),
    text(x + typeOffset, y + 69, 'Tipo', 'column'),
    text(x + keyOffset, y + 69, 'Chave / referência', 'column')
  );

  rows.forEach(([attribute, type, key], index) => {
    const top = y + 80 + index * 28;
    if (index % 2 === 0) {
      out.push(`<rect x="${x + 2}" y="${top}" width="${width - 4}" height="28" fill="#edf4f8"/>`);
    }
    out.push(
      text(x + 20, top + 19, attribute, 'row'),
      text(x + typeOffset, top + 19, type, 'small')
    );
    if (key) out.push(text(x + keyOffset, top + 19, key, 'relation-key'));
  });
}

{
  const out = start(
    'UrbanLink Flow · Modelo lógico',
    'Esquema relacional · 5 tabelas · 7 chaves estrangeiras',
    1030
  );
  out.push(
    '<style>.column{font-size:14px;font-weight:700;fill:#526b80}.relation-key{font-size:15px;font-weight:700;fill:#006a70}</style>'
  );
  const timestamps = [
    ['createdAt', 'Data e hora'],
    ['updatedAt', 'Data e hora']
  ];
  relation(
    out,
    48,
    130,
    500,
    'usuarios',
    [
      ['id', 'Inteiro gerado', 'PK'],
      ['nome', 'Texto(100)'],
      ['email', 'Texto(150)', 'UQ'],
      ['senha_hash', 'Texto(255)'],
      ['tipo', 'Domínio de texto'],
      ...timestamps
    ],
    198,
    355
  );
  relation(
    out,
    570,
    130,
    500,
    'veiculos',
    [
      ['id', 'Inteiro gerado', 'PK'],
      ['nome', 'Texto(100)'],
      ['placa', 'Texto(15)', 'UQ'],
      ['capacidade_kg', 'Decimal(10,2)'],
      ['status', 'Domínio de texto'],
      ...timestamps
    ],
    198,
    355
  );
  relation(
    out,
    1092,
    130,
    500,
    'rotas',
    [
      ['id', 'Inteiro gerado', 'PK'],
      ['nome', 'Texto(100)', 'UQ'],
      ['origem', 'Texto(150)'],
      ['destino', 'Texto(150)'],
      ['distancia_km', 'Decimal(10,2)'],
      ['pontos', 'JSON'],
      ...timestamps
    ],
    198,
    355
  );

  relation(
    out,
    48,
    466,
    761,
    'entregas',
    [
      ['id', 'Inteiro gerado', 'PK'],
      ['descricao', 'Texto(200)'],
      ['origem', 'Texto(150)'],
      ['destino', 'Texto(150)'],
      ['peso_kg', 'Decimal(10,2)'],
      ['prazo_min', 'Decimal(10,2)'],
      ['data_agendada', 'Data'],
      ['status', 'Domínio de texto'],
      ['usuario_id', 'Inteiro', 'FK → usuarios.id'],
      ['veiculo_id', 'Inteiro', 'FK → veiculos.id'],
      ['rota_id', 'Inteiro', 'FK → rotas.id · aceita nulo'],
      ...timestamps
    ],
    254,
    448
  );
  relation(
    out,
    831,
    466,
    761,
    'simulacoes',
    [
      ['id', 'Inteiro gerado', 'PK'],
      ['entrega_id', 'Inteiro', 'FK → entregas.id'],
      ['cenario', 'Domínio de texto'],
      ['velocidade_kmh', 'Inteiro'],
      ['prazo_min', 'Decimal(10,2)'],
      ['rota_id', 'Inteiro', 'FK → rotas.id'],
      ['resultados', 'JSON'],
      ['usuario_id', 'Inteiro', 'FK → usuarios.id'],
      ['atualizado_por_id', 'Inteiro', 'FK → usuarios.id · aceita nulo'],
      ...timestamps
    ],
    254,
    448
  );

  out.push(
    text(49, 961, 'PK = chave primária · FK = chave estrangeira · UQ = valor único', 'body'),
    text(
      49,
      992,
      'Os atributos são obrigatórios, exceto os dois marcados com “aceita nulo”.',
      'small'
    ),
    '</svg>'
  );
  writeFileSync(
    fileURLToPath(new URL('./modelo-logico.svg', import.meta.url)),
    out.join('\n') + '\n'
  );
}
