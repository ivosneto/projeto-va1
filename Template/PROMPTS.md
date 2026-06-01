# AI Usage & Prompts

## Transparency note

We want to be fully transparent: none of us had prior experience with the web
stack used in this course (Node.js, D3.js, the websocket template) or with
implementing a dimensionality-reduction library in JavaScript. We therefore used
an AI assistant as a **coding/tooling aid** — to translate our design ideas into
working D3 code, to wire up the template, and to debug.

The **analysis tasks, the choice of visualizations, the interactions and the
insights were ours**. We decided which charts to build (parallel coordinates,
bubble matrix, LDA scatter, chord), why each one fits its analysis task, which
attributes to look at, and what conclusions to draw from the data. The AI did not
choose the design; it helped us express it in a language/framework we did not yet
know.

Below are the main prompts we used, grouped by phase. They reflect the design
decisions we made and handed to the assistant for implementation.

---

## Phase 1 — Environment & template

> "We're new to Node.js and D3. Help us get the provided VISVA template running:
> explain `npm run dev`, the client/server split (webpack on 3000, socket on
> 3231) and how the server sends data to the client via websockets."

> "Walk us through how `index.js` requests data and how a draw function receives
> it, so we can plug our own visualizations into the same flow."

---

## Phase 2 — Analysis tasks (our framing)

> "Our Task 2.1 analysis task is an *Explore / Overall* task: we want to explore
> how perceived quality (rating, reviews) relates to game effort (playtime,
> number of mechanics) across the whole top-100 set. Help us express this as the
> 5-tuple and pick a preceding visualization that is NOT just the template
> scatterplot."

> "Our Task 2.2 task is a *Compare / Group* task: compare game categories to see
> whether they have distinct numeric profiles (playtime, players, min age,
> rating, reviews). We want to use LDA for this. Help us set up the 5-tuple."

---

## Phase 3 — Visualizations we designed

> "We decided on a Parallel Coordinates plot as our main exploration view, with
> axes Rating, Playtime, Min players, Max players, Min age and #Mechanics, one
> line per game, colored by primary category. Implement it in D3 and add per-axis
> brushing so we can filter the games."

> "Add a Bubble Matrix (improved scatter): X = average playtime, Y = average
> rating, bubble size = number of mechanics, color = category, with a tooltip
> showing the game details."

> "For Task 2.2, implement the LDA projection on the server using the druidjs
> library on standardized features, and draw the 2D result. Add a convex hull and
> a centroid per category group so the comparison between groups is clear."

> "Add a Chord diagram showing the co-occurrence between categories and the most
> frequent mechanics, so we can see which mechanics each category relies on."

> "Lay the four charts out in a 2x2 grid with a fixed sidebar, scroll when
> needed, and keep the category colors consistent across all charts."

---

## Phase 4 — Interaction (Task 2.3)

> "We want the LDA interaction to let us pick exactly which categories are used as
> classes. Replace the 'top-N' control with checkboxes of categories, run the LDA
> only on the games of the chosen categories, and recompute automatically when we
> change the selection. Keep the interaction cost low."

> "Also let us change the number of output dimensions (2/3). Since the first two
> LDA discriminants don't change, encode the 3rd dimension as point size when
> d=3."

> "Link the brushing: when we brush on the parallel coordinates, fade the
> non-selected points in the bubble matrix and the LDA, and show how many games
> are selected."

---

## Phase 5 — Readability & insights (our questions)

> "The charts are hard to read. Make them more legible: fix the legends, reduce
> overplotting in the bubble matrix, push the 'Other' lines to the background in
> the parallel coordinates, and make the LDA groups easier to compare."

> "We can't interpret the LDA axes — 'LDA-1/LDA-2' means nothing to us. Find a way
> to describe what each axis represents in terms of the original attributes."

> "Based on the data, what concrete insights can we draw from each chart? Give us
> the numbers (correlations, per-category averages) so we can argue them in the
> presentation."

---

## What we did ourselves

- Defined both analysis tasks and their 5-tuples.
- Chose every visualization and justified why it fits the task.
- Decided the interactions (class selection, dimensions, linked brushing).
- Read the resulting charts and formulated the insights / conclusions.
- Prepared and delivered the presentation.
