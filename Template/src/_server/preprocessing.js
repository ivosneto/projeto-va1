/**
 * Helper functions to preprocess the boardgames dataset.
 */

import * as druid from "@saehrimnir/druidjs"

const to_number = (value) => {
  if (value === null || value === undefined || value === "") return NaN
  let parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : NaN
}

const safe_first_category = (game) => {
  let categories = game?.types?.categories
  if (Array.isArray(categories) && categories.length > 0) {
    return categories[0].name || "Unknown"
  }
  return "Unknown"
}

export function preprocess_boardgames(games, options = {}) {
  let top_limit = Number.isFinite(options.top_limit) ? options.top_limit : 8
  let lda_dims = Number.isFinite(options.lda_dims) ? options.lda_dims : 2
  let cleaned = []

  for (let game of games) {
    let minplaytime = to_number(game.minplaytime)
    let maxplaytime = to_number(game.maxplaytime)
    let minplayers = to_number(game.minplayers)
    let maxplayers = to_number(game.maxplayers)
    let rating_value = to_number(game?.rating?.rating)
    let review_count = to_number(game?.rating?.num_of_reviews)

    if (!Number.isFinite(minplaytime) || !Number.isFinite(maxplaytime)) continue
    if (!Number.isFinite(rating_value)) continue

    let playtime_avg = (minplaytime + maxplaytime) / 2
    let players_avg = Number.isFinite(minplayers) && Number.isFinite(maxplayers)
      ? (minplayers + maxplayers) / 2
      : NaN

    cleaned.push({
      title: game.title || "",
      id: game.id,
      year: to_number(game.year),
      minplayers,
      maxplayers,
      minplaytime,
      maxplaytime,
      minage: to_number(game.minage),
      rating_value,
      review_count: Number.isFinite(review_count) ? review_count : 0,
      playtime_avg,
      players_avg,
      category_primary: safe_first_category(game),
      categories: Array.isArray(game?.types?.categories)
        ? game.types.categories.map((c) => c.name).filter(Boolean)
        : [],
      mechanics: Array.isArray(game?.types?.mechanics)
        ? game.types.mechanics.map((m) => m.name).filter(Boolean)
        : [],
    })
  }

  let category_counts = new Map()
  for (let game of cleaned) {
    let cat = game.category_primary || "Unknown"
    category_counts.set(cat, (category_counts.get(cat) || 0) + 1)
  }

  let top_categories = Array.from(category_counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, top_limit)
    .map(([name]) => name)

  let scatter_data = cleaned.map((game) => ({
    ...game,
    category_primary: top_categories.includes(game.category_primary)
      ? game.category_primary
      : "Other",
  }))

  let category_stats_map = new Map()
  for (let game of cleaned) {
    for (let category of game.categories) {
      if (!category_stats_map.has(category)) {
        category_stats_map.set(category, { sum_rating: 0, count: 0 })
      }
      let entry = category_stats_map.get(category)
      entry.sum_rating += game.rating_value
      entry.count += 1
    }
  }

  let category_stats = Array.from(category_stats_map.entries())
    .map(([category, stats]) => ({
      category,
      avg_rating: stats.count > 0 ? stats.sum_rating / stats.count : 0,
      count: stats.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  let lda_data = build_lda_projection(cleaned, top_categories, lda_dims)

  // Parallel coordinates data: select numeric dimensions and counts
  let pc_data = cleaned.map((g) => ({
    id: g.id,
    title: g.title,
    rating: g.rating_value,
    playtime: g.playtime_avg,
    minplayers: g.minplayers,
    maxplayers: g.maxplayers,
    nCategories: g.categories.length,
    nMechanics: g.mechanics.length,
    category_primary: top_categories.includes(g.category_primary)
      ? g.category_primary
      : "Other",
  }))

  // Chord edges: counts of category <-> mechanic
  let chord_map = new Map()
  for (let g of cleaned) {
    let cat = top_categories.includes(g.category_primary) ? g.category_primary : "Other"
    for (let mech of g.mechanics) {
      let key = `${cat}||${mech}`
      chord_map.set(key, (chord_map.get(key) || 0) + 1)
    }
  }
  let chord_edges = Array.from(chord_map.entries()).map(([k, v]) => {
    let [category, mechanic] = k.split("||")
    return { category, mechanic, count: v }
  })

  return {
    scatter_data,
    category_stats,
    top_categories,
    lda_data,
    lda_dims,
    pc_data,
    chord_edges,
  }
}

function build_lda_projection(cleaned, top_categories, lda_dims = 2) {
  let rows = []
  let labels = []

  for (let game of cleaned) {
    let playtime_avg = game.playtime_avg
    let players_avg = game.players_avg
    let minage = game.minage
    let rating_value = game.rating_value
    let review_log = Math.log10(game.review_count + 1)

    let features = [playtime_avg, players_avg, minage, rating_value, review_log]
    if (features.some((v) => !Number.isFinite(v))) continue

    let label = top_categories.includes(game.category_primary)
      ? game.category_primary
      : "Other"

    rows.push(features)
    labels.push(label)
  }

  if (rows.length < 2) return []

  let label_counts = new Map()
  for (let label of labels) {
    label_counts.set(label, (label_counts.get(label) || 0) + 1)
  }

  let filtered_rows = []
  let filtered_labels = []
  for (let i = 0; i < rows.length; i++) {
    let label = labels[i]
    if ((label_counts.get(label) || 0) < 2) continue
    filtered_rows.push(rows[i])
    filtered_labels.push(label)
  }

  if (filtered_rows.length < 2) return []

  let standardized = standardize_rows(filtered_rows)
  const X = druid.Matrix.from(standardized)
  let dims = Number.isFinite(lda_dims) ? Math.max(2, lda_dims) : 2
  const reductionLDA = new druid.LDA(X, { labels: filtered_labels, d: dims })
  const result = reductionLDA.transform()

  let coords = typeof result.to2dArray === "function"
    ? result.to2dArray()
    : result.to2dArray

  return coords.map((xy, i) => ({
    x: xy[0],
    y: xy[1],
    category: filtered_labels[i],
  }))
}

function standardize_rows(rows) {
  let dims = rows[0].length
  let means = new Array(dims).fill(0)
  let stds = new Array(dims).fill(0)

  for (let row of rows) {
    for (let i = 0; i < dims; i++) {
      means[i] += row[i]
    }
  }

  for (let i = 0; i < dims; i++) {
    means[i] /= rows.length
  }

  for (let row of rows) {
    for (let i = 0; i < dims; i++) {
      let diff = row[i] - means[i]
      stds[i] += diff * diff
    }
  }

  for (let i = 0; i < dims; i++) {
    stds[i] = Math.sqrt(stds[i] / rows.length) || 1
  }

  return rows.map((row) =>
    row.map((value, i) => (value - means[i]) / stds[i])
  )
}