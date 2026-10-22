# Conceito visual — UrbanLink Motion

Estudo local inspirado na direção editorial e no movimento do Atlas Motion. A logo e a fonte Inter existentes foram preservadas. Após aprovação, essa direção foi integrada às seis páginas existentes do UrbanLink Flow; o estudo permanece em `/conceito/` para comparação.

## Abrir a prévia

Na pasta do projeto, execute `node scripts/preview-concept.js` e abra <http://127.0.0.1:4173/conceito/>. O servidor de prévia é independente do banco e da API. O projeto Express existente também serve a pasta `/conceito/` quando estiver em execução.

## O que experimentar

- Abertura com vídeo aéreo de rodovia, manchete em camadas, grade técnica e deslocamento sutil na rolagem.
- Seção de rotas com desenho progressivo do percurso.
- Vídeo de operação entre galpão e van ao lado de etapas de planejamento.
- Navegação para **A operação**, com transição entre os dois documentos onde houver suporte.
- Comparação ilustrativa de Via Central e Via Parque nos cenários normal e lento. O cálculo utiliza distâncias de 8 e 12 km e velocidades de 30 e 20 km/h, com prazo de 20 minutos.
- Menu móvel, pausa dos vídeos e controle **Ativar/Pausar animações**. Por padrão, a preferência de movimento reduzido do dispositivo é respeitada; o controle permite ativação explícita apenas nesta sessão da prévia.

## Limites do estudo

O objetivo é avaliar linguagem visual e movimento. Os dados da operação são ilustrativos e não são salvos. As rotas do desenho não representam navegação viária. Nada foi publicado no site de produção.

Os arquivos de vídeo ficam em `public/assets/media/`, compartilhados pelo estudo e pelas páginas existentes, para evitar duplicação e dependência de players externos. As fontes e a licença estão em `public/assets/media/media-sources.md`. As filmagens são referências visuais; não representam frota, clientes ou funcionários do UrbanLink Flow.
