import * as d3 from "d3"

let tooltip = null
function ensureTooltip() {
  if (!tooltip) tooltip = d3.select("body").append("div").attr("class", "tooltip")
  return tooltip
}

/**
 * Bipartite chord diagram: categories <-> mechanics co-occurrence.
 * edges: [{category, mechanic, count}], mechanics: list of mechanic names.
 * Category arcs are colored; mechanic arcs are gray. Ribbons inherit the
 * category color, so you can read which mechanics each category relies on.
 */
export function draw_chord(edges, mechanics, { color } = {}) {
  let svg = d3.select("#chord_svg")
  if (svg.empty() || !edges || edges.length === 0) return

  let width = parseInt(svg.style("width"))
  let height = parseInt(svg.style("height"))
  svg.attr("viewBox", `0 0 ${width} ${height}`)
  svg.selectAll("*").remove()

  // Only categories that actually have edges become nodes (ordered by total
  // co-occurrence) — avoids tiny zero-arcs piling labels on top of each other.
  let catTotals = new Map()
  for (let e of edges) catTotals.set(e.category, (catTotals.get(e.category) || 0) + e.count)
  const categories = Array.from(catTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => c)
  const mechs = mechanics && mechanics.length ? mechanics : Array.from(new Set(edges.map((e) => e.mechanic)))

  const nodes = [...categories, ...mechs]
  const index = new Map(nodes.map((n, i) => [n, i]))
  const n = nodes.length

  const matrix = Array.from({ length: n }, () => new Array(n).fill(0))
  for (let e of edges) {
    const i = index.get(e.category)
    const j = index.get(e.mechanic)
    if (i == null || j == null) continue
    matrix[i][j] += e.count
    matrix[j][i] += e.count
  }

  const outer = Math.min(width, height) / 2 - 96
  if (outer < 30) return
  const inner = outer - 12

  const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`)

  const chord = d3.chord().padAngle(0.045).sortSubgroups(d3.descending)(matrix)
  const arc = d3.arc().innerRadius(inner).outerRadius(outer)
  const ribbon = d3.ribbon().radius(inner)

  const isCategory = (i) => i < categories.length
  const nodeColor = (i) =>
    isCategory(i) ? (color ? color(nodes[i]) : "#4a78b5") : "#b9b9b9"

  const tip = ensureTooltip()

  // group arcs
  const group = g.append("g").selectAll("g").data(chord.groups).join("g")
  group
    .append("path")
    .attr("d", arc)
    .attr("fill", (d) => nodeColor(d.index))
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.5)

  // group labels
  group
    .append("text")
    .each((d) => {
      d.angle = (d.startAngle + d.endAngle) / 2
    })
    .attr("dy", "0.35em")
    .attr("transform", (d) => {
      const rot = (d.angle * 180) / Math.PI - 90
      return `rotate(${rot}) translate(${outer + 6}) ${d.angle > Math.PI ? "rotate(180)" : ""}`
    })
    .attr("text-anchor", (d) => (d.angle > Math.PI ? "end" : "start"))
    .attr("font-size", 10)
    .attr("fill", "#333")
    .text((d) => nodes[d.index])

  // ribbons (colored by the category endpoint)
  g.append("g")
    .attr("fill-opacity", 0.7)
    .selectAll("path")
    .data(chord)
    .join("path")
    .attr("d", ribbon)
    .attr("fill", (d) => {
      const catIdx = isCategory(d.source.index) ? d.source.index : d.target.index
      return nodeColor(catIdx)
    })
    .attr("stroke", "rgba(0,0,0,0.1)")
    .on("mousemove", (event, d) => {
      tip
        .style("opacity", 1)
        .style("left", event.pageX + 12 + "px")
        .style("top", event.pageY + 12 + "px")
        .html(`${nodes[d.source.index]} &harr; ${nodes[d.target.index]}<br/>co-occurrences: ${d.source.value}`)
    })
    .on("mouseleave", () => tip.style("opacity", 0))
}
