# Project - Visual Analytics (Notes for Slides)

# Task 1 - Setup

## Environment
- Language: JavaScript (Node.js + browser)
- Base template: Template folder
- Dataset used in the tasks: data/boardgames_100.json

## Scripts (package.json)
- `npm run dev`: development server (hot reload)
- `npm run build`: optimized build
- `npm run server`: server for the build

## How to run
- `npm run dev`
- Open http://localhost:3000
- The dashboard loads automatically (the "Load boardgames" button forces a reload).

Note: pressing F5 does not restart the server. To apply backend changes, stop the server with Ctrl+C and run `npm run dev` again.

---

# Task 2 - Visualizing a Dataset

## Goal
- Build a visualization to explore the board games dataset (BoardGameGeek top-100).
- Document the decisions: analysis tasks, preprocessing and visual choices.

## Dataset
- File: data/boardgames_100.json
- Source: Graph Drawing 2023 Contest (BoardGameGeek)
- Note: the recommendations field is not used in this task.

## Available fields
- id: unique game identifier
- year: publication year
- minplayers / maxplayers: player range
- minplaytime / maxplaytime: playtime range (min)
- minage: recommended minimum age
- rating: { rating, num_of_reviews }
- types.categories: list of { id, name }
- types.mechanics: list of { id, name }
- credit.designer: list of { id, name }

---

# Task 2.1 - Preceding Visualization: Exploration

## Task 5-tuple
- Goal: Explore
- Means: interactive visualization (linked views + brushing)
- Characteristics: multivariate, quantitative + categorical, distributions and correlations
- Target: relationship between perceived quality and game effort/complexity
- Cardinality: Overall

**Task (plain text):**
Explore how perceived quality (rating and review volume) is distributed as a function of average playtime and complexity, identifying general patterns across the whole set.

## Chosen visualization and rationale
For the Overall exploration we use **two complementary views** (neither is the template scatterplot "as is"):

**1. Parallel Coordinates + Brush (main exploration view)**
- Axes: Rating, Playtime, Min players, Max players, Min age, #Mechanics.
- Each game is a line; color = primary category.
- **Per-axis brushing**: dragging on any axis filters the set and the result **propagates** to the Bubble Matrix and the LDA (linked views).

**Why it is appropriate (Explore / Overall):**
- Shows all numeric variables at once over the whole set (Overall cardinality).
- Supports finding multivariate patterns/correlations and outliers that a single 2D scatter cannot reveal.
- Brushing turns passive exploration into active exploration without leaving the Overall cardinality (it only highlights subsets).

**2. Bubble Matrix (improved scatter)**
- X = `playtime_avg`, Y = `rating_value`, **size = number of mechanics**, color = category, **tooltip** with details.
- Gives an intuitive reading of time vs quality with complexity (mechanics) as a third variable.

## Basic elements (included vs excluded)
**Included (and why):**
- Axes with labels and gridlines in the Bubble Matrix: precise reading of values.
- Color legend by category (consistent across all charts): interprets the color channel.
- Size with `scaleSqrt` (area proportional to the value): correct perception of magnitude.
- Tooltip in the Bubble Matrix: detail on demand without cluttering the overview.
- Axis titles in the Parallel Coordinates: identify each dimension.

**Excluded (and why):**
- Fixed text label on every point/line: with 100 items it would cause occlusion; solved via tooltip.
- Starting the Bubble Matrix Y axis at zero: top-100 ratings are concentrated (~7.6 to 8.7); we use the real extent with padding to discriminate better without distorting the Overall comparison.
- Trend line: omitted so as not to suggest a correlation the data does not show.

## Preprocessing applied
- `playtime_avg = (minplaytime + maxplaytime) / 2`.
- `players_avg = (minplayers + maxplayers) / 2`.
- `rating_value = rating.rating` and `review_count = rating.num_of_reviews`.
- `category_primary` = first available category.
- Top categories kept for color; the rest become "Other".

Example of server-side computations:
```js
let playtime_avg = (minplaytime + maxplaytime) / 2
let players_avg = (minplayers + maxplayers) / 2
```

## How the code is structured (references)
**Server (reading and preprocessing)**
- [Template/src/_server/websocket.js](Template/src/_server/websocket.js)
  - Reads `data/boardgames_100.json`, emits `freshData`.
- [Template/src/_server/preprocessing.js](Template/src/_server/preprocessing.js)
  - Produces `pc_data` (parallel coords), `bubble_data`, `lda_data`, `chord_edges` and `top_mechanics`.

**Front-end (request + drawing)**
- [Template/src/_public/index.js](Template/src/_public/index.js)
  - Orchestrates the drawings, the consistent color scale and the linked brushing.
- [Template/src/_public/parallel_coords.js](Template/src/_public/parallel_coords.js)
  - Parallel coordinates with per-axis brush (`onBrush` callback).
- [Template/src/_public/bubble_matrix.js](Template/src/_public/bubble_matrix.js)
  - Bubble scatter with tooltip; reacts to the brush filter.
- [Template/src/html/template.html](Template/src/html/template.html)
  - 2x2 layout with cards and scroll.
- [Template/src/_public/app.css](Template/src/_public/app.css)
  - Styles for cards, tooltip, hull and the "faded" state.

## Insights (exploration)
- **Rating is very concentrated**: 7.70 to 8.68, median 8.07. Since these are the top-100, almost no attribute strongly separates quality.
- **Playtime**: median 90 min, P90 150 min, with one ~500 min outlier. #Mechanics: median 9, max 21.
- **Correlations** (Parallel Coordinates / Bubble): rating x #mechanics = **+0.36** (more mechanics -> slightly better rated, the strongest relationship); playtime x #mechanics = +0.29; minage x #mechanics = +0.30; rating x playtime = +0.17 (weak); **rating x reviews = -0.22** (the most popular are not the best rated — popularity != quality).
- **By category**: Civilization (rating 8.24, 157 min, 11.5 mech) and Adventure (8.20, 128 min, 12.1 mech) are the "heaviest" and best rated; Card Game is the lightest (63 min, 6.6 mech).
- **LDA (centroids + hull)**: the group centroids all sit near the origin and the hulls overlap heavily -> **the theme (category) does not define a distinct numeric profile**; Adventure is the most spread-out group.
- **Chord**: Hand Management (52), Solo/Solitaire (49) and Variable Player Powers (48) are "cross-cutting" mechanics (appear in almost every category); others, like Worker Placement, concentrate more in Economic.

---

# Task 2.2 - Subsequent Visualization: LDA

## Task 5-tuple
- Goal: Compare
- Means: model visualization (2D LDA projection)
- Characteristics: Group (categories), multivariate, numeric + categorical
- Target: compare category groups by the combination of game attributes
- Cardinality: Overall

**Task (plain text):**
Compare game categories to check whether the groups have distinct profiles considering average playtime, player range, minimum age, rating and reviews.

## Why LDA is appropriate
- LDA maximizes the separation between labeled groups (categories), ideal for comparison.
- Reduces the numeric dimensions to 2D while preserving the contrast between groups.
- Lets us observe overlap or separation between categories across the whole set.

## Preprocessing for LDA
- Feature vector: `playtime_avg`, `players_avg`, `minage`, `rating_value`, `log10(review_count + 1)`.
- Standardization (z-score) to avoid scale dominance.
- Labels by primary category (only the chosen classes take part).
- Removal of classes with fewer than 2 samples.

## Chosen visualization and rationale
- 2D scatterplot of the LDA projection.
- **Axes described by attributes**: since LDA-1/LDA-2 are abstract directions (no unit), each axis label lists the attributes most correlated with it and their sign — e.g. "LDA-1: ↑Min age ↑Rating ↑Playtime", "LDA-2: ↑Players ↑Playtime". This stops the axis from being a black box. A caption in the card explains how to read it (point = game, diamond = center, proximity = similar profile).
- **Centroid per group (diamond)** + **convex hull**: the diamond marks the center of each category (clear comparison even when hulls overlap); the dashed hull hints at the group's region.
- Color by category (consistent with the other charts) and a legend with only the groups present.
- Reacts to the parallel coordinates **brush**: points outside the selection are faded.

**Why it is appropriate:**
- After the reduction, the distance between groups/centroids represents differences in the attribute profile.
- The axis labels provide interpretability; the centroids summarize each group, making the comparison immediate.

## How the code is structured (references)
**Server (LDA):**
- [Template/src/_server/preprocessing.js](Template/src/_server/preprocessing.js)
  - `build_lda_projection` with standardization and LDA via druidjs; also computes the axis descriptions.
- [Template/src/_server/websocket.js](Template/src/_server/websocket.js)
  - Payload includes `lda_data` and `lda_axes`.

**Front-end (LDA):**
- [Template/src/_public/lda_plot.js](Template/src/_public/lda_plot.js)
  - LDA scatter with hull, centroids, described axes and legend.
- [Template/src/_public/index.js](Template/src/_public/index.js)
  - Calls `draw_lda_plot`.

---

# Task 2.3 - Tightly integrated: Interacting with LDA parameters

## Implemented interactions
The two types of interaction the assignment mentions ("changing either the amount of output dimensions, **or the classes chosen**") are implemented. Both trigger a recomputation of the LDA model on the server (the *Model Building* component of the VA pipeline):

1. **Chosen classes** — `lda_classes` (category checkboxes). The user marks exactly **which categories** become LDA classes. The LDA runs **only** on the games of those categories (focused comparison, no "Other"); the other charts color by those categories + "Other". At least 2 categories (each with >=2 games) are needed for the LDA to discriminate — otherwise the card shows a message.
2. **LDA dimensions** — `lda_dims` (2 / 3). Sets the number of output dimensions. The scatter always shows LDA-1 (X) vs LDA-2 (Y); since the first two discriminants are the same for d=2 or d=3 (only the sign changes), **with d=3 the 3rd dimension (LDA-3) is encoded as point size** (label "Size = LDA-3"). With d=2 the points have a uniform size.

Each control has an `onchange` that calls `requestData()` ([index.js](Template/src/_public/index.js)), re-sending the parameters over the socket; the server reprocesses and re-emits `freshData`. The checkboxes are built from the stable `all_categories` list (top-12 by frequency, with a color swatch and a count).

## Cost of interaction (kept low)
- Interaction by **direct selection** (checkbox / dropdown), no typing — low physical and cognitive cost.
- Automatic recompute on check/uncheck (no need to click "Load"); immediate feedback.
- The heavy preprocessing stays on the server; the front-end only redraws. The category list and the dimension domain are small and discrete, avoiding invalid states.

## How to use it for analysis
- **Choosing the classes** lets you compare exactly the groups of interest (e.g. only "Economic" vs "Fantasy") and see whether they separate in the LDA space, without noise from the other categories.
- Adding/removing a category shows whether it overlaps (similar profile) or stands out (distinct profile) from the other groups.
- Toggling **d** lets you check whether there is separation in a 3rd discriminant direction (via size).

---

# Implemented dashboard (overview)

2x2 grid layout with scroll (see [template.html](Template/src/html/template.html)). Fixed sidebar with controls + task descriptions; category color **consistent** across all charts.

- **Top-left: Parallel Coordinates + Brush (Task 2.1)** — multivariate exploration; dragging on an axis filters and propagates to the other charts.
- **Top-right: Bubble Matrix (Task 2.1)** — playtime x rating, size = #mechanics, tooltip.
- **Bottom-left: LDA Scatter + Convex Hull (Task 2.2/2.3)** — group comparison; reacts to the class checkboxes, to d (size = LDA-3) and to the brush.
- **Bottom-right: Chord (relations)** — category ↔ mechanic co-occurrence (top 8 mechanics).

Linked brushing: the filter made in the Parallel Coordinates fades the non-selected points in the Bubble Matrix and the LDA; the sidebar counter shows how many games are selected. The "Clear filter" button resets it.

Files actually used by the app:
- `src/_public/index.js` — orchestration, consistent color, linked brushing, controls.
- `src/_public/parallel_coords.js` — Task 2.1 (brush).
- `src/_public/bubble_matrix.js` — Task 2.1 (scatter + tooltip).
- `src/_public/lda_plot.js` — Task 2.2/2.3 (LDA + hull + size LDA-3).
- `src/_public/chord.js` — category ↔ mechanic relations.
- `src/_server/websocket.js` — reads the JSON and emits `freshData`.
- `src/_server/preprocessing.js` — preprocessing of all structures + `build_lda_projection`.

## How to run
1. `cd Template && npm run dev`
2. Open `http://localhost:3000` (page on 3000; socket on 3231 — [configs.js](Template/src/_server/static/configs.js)).
3. Loads automatically. Check/uncheck categories (LDA classes), change the LDA dimensions and use the parallel coordinates brush.

## Future improvements (not implemented)
- Extend the linked brush to the Chord as well.
- Allow reordering/grouping mechanics in the Chord to reduce crossings.
- Tooltip also on the parallel coordinates lines.
- Server-side caching for repeated LDA parameters.
