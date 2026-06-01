# Projeto - Visual Analytics (Notas para Slides)

# Task 1 - Setup

## Ambiente
- Linguagem: JavaScript (Node.js + navegador)
- Template base: pasta Template
- Dataset usado nas tasks: data/boardgames_100.json

## Scripts (package.json)
- `npm run dev`: servidor de desenvolvimento (hot reload)
- `npm run build`: build otimizado
- `npm run server`: servidor para build

## Como rodar
- `npm run dev`
- Abrir http://localhost:3000
- Clicar em "Load boardgames"

Observacao: dar F5 nao reinicia o servidor. Para aplicar mudancas do backend, pare o servidor com Ctrl+C e rode `npm run dev` novamente.

---

# Task 2 - Visualizing a Dataset

## Objetivo
- Criar uma visualizacao para explorar o dataset de jogos de tabuleiro (top-100 do BoardGameGeek).
- Documentar decisoes: tarefas de analise, preprocessamento e escolhas visuais.

## Dataset
- Arquivo: data/boardgames_100.json
- Fonte: Graph Drawing 2023 Contest (BoardGameGeek)
- Observacao: nao usar o campo de recommendations nesta task.

## Campos disponiveis
- id: identificador unico do jogo
- year: ano de publicacao
- minplayers / maxplayers: faixa de jogadores
- minplaytime / maxplaytime: faixa de tempo de jogo (min)
- minage: idade minima recomendada
- rating: { rating, num_of_reviews }
- types.categories: lista { id, name }
- types.mechanics: lista { id, name }
- credit.designer: lista { id, name }

## Tarefas de analise (propostas)
- Comparar popularidade (rating e numero de reviews) entre categorias e mecanicas.
- Identificar relacao entre duracao de jogo e rating.
- Observar distribuicao de ano de publicacao vs. rating.
- Ver como faixa de jogadores ou idade minima se relaciona com rating.

---

# Task 2.1 - Preceding Visualization: Exploracao

## 5-tuple da tarefa
- Goal: Explore
- Means: Visualizacao interativa (carregamento sob demanda)
- Characteristics: multivariado, quantitativo + categorial, distribuicoes e correlacoes
- Target: relacao entre qualidade percebida e esforco de jogo
- Cardinality: Overall

**Tarefa (texto direto):**
Explorar como a qualidade percebida (rating e volume de reviews) se distribui em funcao do tempo medio de jogo, identificando padroes gerais no conjunto completo.

## Visualizacao escolhida e justificativa
- Scatterplot com **playtime_avg** no eixo X e **rating_value** no eixo Y.
- **Tamanho do ponto** representa `num_of_reviews` (proxy de confianca/popularidade).
- **Cor** representa a categoria principal do jogo (top categorias, resto em "Other").
- **Gridlines** para leitura precisa e **legenda** para reduzir ambiguidade.

**Por que e apropriado:**
- Quantitativo x quantitativo suporta exploracao de correlacao (tempo vs rating).
- Tamanho do ponto adiciona dimensao de confianca sem poluir o grafico.
- Cor ajuda a perceber padroes por categoria em nivel geral.
- Cardinalidade Overall e respeitada (dataset inteiro, sem filtros por default).

## Preprocessamento aplicado
- `playtime_avg = (minplaytime + maxplaytime) / 2`.
- `players_avg = (minplayers + maxplayers) / 2`.
- `rating_value = rating.rating` e `review_count = rating.num_of_reviews`.
- `category_primary` = primeira categoria disponivel.
- Categorias top-8 para cor; as demais viram "Other".
- Estatisticas agregadas por categoria (media de rating e contagem).

Exemplo de calculos no servidor:
```js
let playtime_avg = (minplaytime + maxplaytime) / 2
let players_avg = (minplayers + maxplayers) / 2
```

## Como o codigo foi feito (referencias)
**Servidor (leitura e preprocessamento)**
- [Template/src/_server/websocket.js](Template/src/_server/websocket.js)
  - Leitura de `data/boardgames_100.json`.
  - Emissao de `freshData` com `scatter_data` e `lda_data`.
- [Template/src/_server/preprocessing.js](Template/src/_server/preprocessing.js)
  - Preprocessamento dos jogos e agregacao por categoria.

**Front-end (request + desenho)**
- [Template/src/_public/index.js](Template/src/_public/index.js)
  - Botao carrega dados via socket e dispara os desenhos.
- [Template/src/_public/scatterplot.js](Template/src/_public/scatterplot.js)
  - Scatterplot com cor por categoria, tamanho por reviews e gridlines.
- [Template/src/html/template.html](Template/src/html/template.html)
  - Ajuste do layout e texto da Task 2.1.
- [Template/src/_public/app.css](Template/src/_public/app.css)
  - Estilos de painel e gridlines.

## Insights (primeira exploracao)
- Os ratings do top-100 estao concentrados: media 8.09, mediana 8.07, com 80% entre 7.76 e 8.50.
- O tempo medio de jogo se concentra em 45 a 150 min (P10 a P90), com mediana de 90 min.
- Categorias mais frequentes no conjunto: Economic (42), Fantasy (22), Science Fiction (22) e Adventure (19).
- As categorias primarias mais comuns tem rating medio muito proximo (ex: Adventure 8.20, Economic 8.16, Card Game 8.01), sugerindo que o tema por si so nao separa fortemente a qualidade percebida.

## Improvements planejados
- Adicionar tooltip com nome do jogo e valores detalhados para reduzir leitura ambigua.
- Incluir filtro por categoria e por faixa de playtime para exploracao segmentada.
- Mostrar uma linha de tendencia (regressao simples) para facilitar a interpretacao global.
- Ajustar escala de tamanho com log para evitar que jogos com reviews muito altos dominem o grafico.
- Acrescentar uma segunda visualizacao (ex: histograma de playtime) para apoiar o contexto.

---

# Task 2.2 - Subsequent Visualization: LDA

## 5-tuple da tarefa
- Goal: Compare
- Means: Visualizacao do modelo (projecao LDA em 2D)
- Characteristics: Group (categorias), multivariado, numerico + categorial
- Target: comparar grupos de categorias pela combinacao de atributos do jogo
- Cardinality: Overall

**Tarefa (texto direto):**
Comparar categorias de jogos para verificar se grupos tem perfis distintos considerando tempo medio, faixa de jogadores, idade minima, rating e reviews.

## Por que LDA e apropriado
- LDA maximiza a separacao entre grupos rotulados (categorias), ideal para comparacao.
- Reduz as dimensoes numericas para 2D preservando contraste entre grupos.
- Permite observar sobreposicao ou separacao entre categorias no conjunto inteiro.

## Preprocessamento para LDA
- Vetor de features: `playtime_avg`, `players_avg`, `minage`, `rating_value`, `log10(review_count + 1)`.
- Padronizacao (z-score) para evitar dominancia de escala.
- Labels por categoria primaria (top categorias, resto "Other").
- Remocao de classes com menos de 2 amostras.

## Visualizacao escolhida e justificativa
- Scatterplot 2D da projecao LDA (eixos LDA-1 e LDA-2) no painel esquerdo.
- Bar chart permanece como apoio para contexto de categorias.
- Cor por categoria para comparar grupos.
- Legenda para identificar grupos rapidamente.

**Por que e adequada:**
- Apos a reducao, a distancia entre grupos representa diferencas no perfil.
- Permite comparacao visual clara de clusters e sobreposicoes.

## Como o codigo foi feito (referencias)
**Servidor (LDA):**
- [Template/src/_server/preprocessing.js](Template/src/_server/preprocessing.js)
  - `build_lda_projection` com padronizacao e LDA via druidjs.
- [Template/src/_server/websocket.js](Template/src/_server/websocket.js)
  - Payload inclui `lda_data`.

**Front-end (LDA):**
- [Template/src/_public/lda_plot.js](Template/src/_public/lda_plot.js)
  - Scatterplot LDA com legenda.
- [Template/src/_public/index.js](Template/src/_public/index.js)
  - Chamada de `draw_lda_plot`.

---

# Task 2.3 - Interacting with LDA parameters

## Interacao implementada
- Selecionar o numero de categorias (top-N) usadas como classes no LDA.

---

# Dashboard Consolidado (Tasks 2.1–2.3)

Decidimos agrupar as visualizacoes num unico painel 2x2 para facilitar a exploracao e a comparacao:

- Top-left: **Parallel Coordinates + Brush** (Exploracao). Permite filtrar por ranges em multiplas variaveis ao mesmo tempo.
- Top-right: **Bubble Matrix** (Bubble/Scatter melhorado). Eixo X = `playtime_avg`, Eixo Y = `rating_value`, tamanho = `#mechanics`, cor = `category_primary`.
- Bottom-left: **LDA Scatter** (Comparacao). Projecao LDA (2D) com legenda e suporte a atualizacao por top-N e dims.
- Bottom-right: **Chord / Sankey-like** (Relacoes Categoria ↔ Mecanica). Mostra contagens de combinacoes categoria-mecanica.

Arquivos principais:
- `src/_public/parallel_coords.js` — implementa Parallel Coordinates com brushing; retorna lista de `id`s selecionados para filtrar outros graficos.
- `src/_public/bubble_matrix.js` — bubble scatter com tooltip e eixos.
- `src/_public/lda_plot.js` — LDA scatter (apresenta LDA-1 vs LDA-2) e legenda.
- `src/_public/chord.js` — desenho simples de ligações entre categorias e mecânicas.
- `src/_server/preprocessing.js` — agora retorna `pc_data` (parallel coords), `chord_edges` (category-mechanic counts), alem de `scatter_data` e `lda_data`.

Como usar:
1. `npm run dev`
2. Abra `http://localhost:3000`
3. O dashboard carrega automaticamente. Use os controles na lateral para alterar `Top categorias (LDA)` e `Dimensoes LDA`.
4. No canto superior esquerdo (Parallel Coordinates) arraste nas escalas (brush) para selecionar subconjuntos — os outros graficos sao atualizados com o filtro.
5. No Bubble Matrix, passe o mouse para ver tooltip com detalhes do jogo.

Design e justificativa (resumo):
- O Parallel Coordinates suporta exploracao multivariada (Goal=Explore).
- O Bubble Matrix fornece uma leitura intuitiva de tempo vs rating com importancia (tamanho) e categoria (cor).
- O LDA Scatter responde ao objetivo Compare — compara grupos no espaco reduzido.
- O Chord mostra relacoes categoria↔mecanica para insights de co-ocorrencia.

Proximos passos / melhorias:
- Adicionar convex-hulls por grupo no LDA para visualizar sobreposicao.
- Melhorar brushing para combinar multiplos eixos (interseccao correta).
- Otimizar chords com matriz e d3-chord para visual mais compacto.
- Adicionar caching de respostas no servidor para parametros LDA repetidos.
- Selecionar o numero de dimensoes do LDA (2 ou 3).
- O grafico mostra LDA-1 vs LDA-2; quando d=3, as duas primeiras dimensoes sao exibidas.

## Como usar para analise
- Variar o top-N mostra se categorias menos frequentes mudam a separacao entre grupos.
- Aumentar d permite observar se a separacao melhora (mesmo que a visualizacao 2D use apenas duas dimensoes).
- Comparar a nuvem resultante com diferentes parametros ajuda a validar estabilidade dos grupos.

## Onde esta no codigo
- Controles do painel: [Template/src/html/template.html](Template/src/html/template.html)
- Envio de parametros: [Template/src/_public/index.js](Template/src/_public/index.js)
- Preprocessamento LDA: [Template/src/_server/preprocessing.js](Template/src/_server/preprocessing.js)
