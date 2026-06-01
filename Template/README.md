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
Para a exploracao Overall usamos **duas vistas complementares** (nenhuma e o scatterplot do template "as is"):

**1. Parallel Coordinates + Brush (vista principal de exploracao)**
- Eixos: Rating, Playtime, Min players, Max players, Min age, #Mechanics.
- Cada jogo e uma linha; cor = categoria principal.
- **Brushing por eixo**: arrastando em qualquer eixo filtra o conjunto e o resultado **propaga** para o Bubble Matrix e o LDA (views ligadas).

**Por que e apropriado (Explore / Overall):**
- Mostra todas as variaveis numericas ao mesmo tempo no conjunto inteiro (cardinalidade Overall).
- Suporta achar padroes/correlacoes e outliers multivariados que um unico scatter 2D nao revela.
- O brush transforma exploracao passiva em ativa, sem sair da cardinalidade Overall (so realca subconjuntos).

**2. Bubble Matrix (scatter melhorado)**
- X = `playtime_avg`, Y = `rating_value`, **tamanho = nº de mecanicas**, cor = categoria, **tooltip** com detalhes.
- Da uma leitura intuitiva de tempo x qualidade com a complexidade (mecanicas) como 3a variavel.

## Elementos basicos (incluidos x excluidos)
**Incluidos (e por que):**
- Eixos com labels e gridlines no Bubble Matrix: leitura precisa de valores.
- Legenda de cores por categoria (consistente em todos os graficos): interpreta o canal de cor.
- Tamanho com `scaleSqrt` (area proporcional ao valor): percepcao correta de magnitude.
- Tooltip no Bubble Matrix: detalhe sob demanda sem poluir a visao geral.
- Titulos de eixo nas Parallel Coordinates: identificam cada dimensao.

**Excluidos (e por que):**
- Rotulo de texto fixo em cada ponto/linha: com 100 itens geraria oclusao; resolvido via tooltip.
- Eixo Y do Bubble Matrix comecando em zero: o rating do top-100 fica concentrado (~7.6 a 8.7); usamos o extent real com folga para discriminar melhor sem distorcer a comparacao Overall.
- Linha de tendencia: omitida para nao sugerir correlacao que os dados nao mostram.

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
  - Leitura de `data/boardgames_100.json`, emissao de `freshData`.
- [Template/src/_server/preprocessing.js](Template/src/_server/preprocessing.js)
  - Gera `pc_data` (parallel coords), `bubble_data`, `lda_data`, `chord_edges` e `top_mechanics`.

**Front-end (request + desenho)**
- [Template/src/_public/index.js](Template/src/_public/index.js)
  - Orquestra os desenhos, escala de cor consistente e o brushing ligado.
- [Template/src/_public/parallel_coords.js](Template/src/_public/parallel_coords.js)
  - Parallel coordinates com brush por eixo (callback `onBrush`).
- [Template/src/_public/bubble_matrix.js](Template/src/_public/bubble_matrix.js)
  - Bubble scatter com tooltip; reage ao filtro do brush.
- [Template/src/html/template.html](Template/src/html/template.html)
  - Layout 2x2 com cards e scroll.
- [Template/src/_public/app.css](Template/src/_public/app.css)
  - Estilos dos cards, tooltip, hull e estado "faded".

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
- Scatterplot 2D da projecao LDA (eixos LDA-1 e LDA-2).
- **Convex hull por grupo (categoria)**: a area de cada categoria fica explicita, deixando clara a sobreposicao/separacao entre grupos (essencial para o Goal=Compare).
- Cor por categoria (consistente com os outros graficos) e legenda.
- Reage ao **brush** das parallel coordinates: pontos fora da selecao ficam esmaecidos.

**Por que e adequada:**
- Apos a reducao, a distancia entre grupos representa diferencas no perfil.
- O hull resume cada grupo numa regiao, tornando a comparacao visual imediata (clusters vs sobreposicao).

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

# Task 2.3 - Tightly integrated: Interacting with LDA parameters

## Interacoes implementadas
Os dois tipos de interacao que o enunciado cita ("changing either the amount of output dimensions, **or the classes chosen**") estao implementados. Ambos disparam um recalculo do modelo LDA no servidor (componente *Model Building* do pipeline de VA):

1. **Classes escolhidas** — `lda_classes` (checkboxes de categorias). O usuario marca exatamente **quais categorias** entram como classes do LDA. O LDA roda **somente** nos jogos dessas categorias (comparacao focada, sem "Other"); os demais graficos colorem por essas categorias + "Other". E preciso ao menos 2 categorias (com >=2 jogos cada) para o LDA discriminar — caso contrario o card mostra uma mensagem.
2. **Dimensoes LDA** — `lda_dims` (2 / 3). Define o numero de dimensoes de saida. O scatter mostra sempre LDA-1 (X) vs LDA-2 (Y); como os dois primeiros discriminantes sao iguais para d=2 ou d=3 (so muda o sinal), **com d=3 a 3a dimensao (LDA-3) e codificada no tamanho do ponto** (rotulo "Tamanho = LDA-3"). Com d=2 os pontos tem tamanho uniforme.

Cada controle tem `onchange` que chama `requestData()` ([index.js](Template/src/_public/index.js)), reenviando os parametros via socket; o servidor reprocessa e reemite `freshData`. Os checkboxes sao montados a partir da lista estavel `all_categories` (top-12 por frequencia, com swatch de cor e contagem).

## Custo da interacao (mantido baixo)
- Interacao por **selecao direta** (checkbox / dropdown), sem digitacao — baixo custo fisico e cognitivo.
- Recalculo automatico ao marcar/desmarcar (nao exige clicar em "Load"); feedback imediato.
- O preprocessamento pesado fica no servidor; o front-end so redesenha. A lista de categorias e o dominio das dimensoes sao pequenos e discretos, evitando estados invalidos.

## Como usar para analise
- **Escolher as classes** permite comparar exatamente os grupos de interesse (ex: so "Economic" vs "Fantasy") e ver se eles se separam no espaco LDA, sem ruido das demais categorias.
- Incluir/remover uma categoria mostra se ela se sobrepoe (perfil parecido) ou se destaca (perfil distinto) dos outros grupos.
- Alternar **d** permite checar se ha separacao numa 3a direcao discriminante (via tamanho).

---

# Dashboard implementado (visao geral)

Layout em grid 2x2 com scroll (ver [template.html](Template/src/html/template.html)). Lateral fixa com controles + descricao das tasks; cor das categorias **consistente** em todos os graficos.

- **Superior esquerdo: Parallel Coordinates + Brush (Task 2.1)** — exploracao multivariada; arrastar em um eixo filtra e propaga para os outros graficos.
- **Superior direito: Bubble Matrix (Task 2.1)** — tempo x rating, tamanho = #mecanicas, tooltip.
- **Inferior esquerdo: LDA Scatter + Convex Hull (Task 2.2/2.3)** — comparacao de grupos; responde aos checkboxes de classes, ao d (tamanho = LDA-3) e ao brush.
- **Inferior direito: Chord (relacoes)** — co-ocorrencia categoria ↔ mecanica (top 8 mecanicas).

Brushing ligado: o filtro feito nas Parallel Coordinates esmaece os pontos nao selecionados no Bubble Matrix e no LDA; o contador da lateral mostra quantos jogos estao selecionados. Botao "Limpar filtro" reseta.

Arquivos efetivamente usados pelo app:
- `src/_public/index.js` — orquestracao, cor consistente, brushing ligado, controles.
- `src/_public/parallel_coords.js` — Task 2.1 (brush).
- `src/_public/bubble_matrix.js` — Task 2.1 (scatter + tooltip).
- `src/_public/lda_plot.js` — Task 2.2/2.3 (LDA + hull + tamanho LDA-3).
- `src/_public/chord.js` — relacoes categoria ↔ mecanica.
- `src/_server/websocket.js` — leitura do JSON e emissao de `freshData`.
- `src/_server/preprocessing.js` — preprocessamento de todas as estruturas + `build_lda_projection`.

## Como rodar
1. `cd Template && npm run dev`
2. Abra `http://localhost:3000` (pagina na 3000; socket na 3231 — [configs.js](Template/src/_server/static/configs.js)).
3. Carrega automaticamente. Marque/desmarque categorias (classes do LDA), mude as Dimensoes LDA e use o brush das parallel coordinates.

## Melhorias futuras (nao implementadas)
- Estender o brush ligado tambem ao Chord.
- Permitir reordenar/agrupar mecanicas no Chord para reduzir cruzamentos.
- Tooltip tambem nas linhas das parallel coordinates.
- Caching no servidor para parametros LDA repetidos.
