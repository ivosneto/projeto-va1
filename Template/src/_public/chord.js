import * as d3 from "d3"

export function draw_chord(edges) {
  // edges: [{category, mechanic, count}]
  const svg = d3.select("#chord_svg")
  if (edges.length === 0) return

  // Build lists
  const categories = Array.from(new Set(edges.map((e) => e.category)))
  // pick top mechanics by total count to avoid overcrowding
  const mechCounts = new Map()
  for (let e of edges) mechCounts.set(e.mechanic, (mechCounts.get(e.mechanic) || 0) + e.count)
  const mechanicsAll = Array.from(mechCounts.entries()).sort((a, b) => b[1] - a[1]).map((m) => m[0])
  const mechanics = mechanicsAll.slice(0, 12)

  // simple bipartite sankey-like drawing: bars for categories and mechanics, links sized by count
  const margin = { top: 20, right: 20, bottom: 20, left: 20 }
  const width = parseInt(svg.style("width")) - margin.left - margin.right
  const height = parseInt(svg.style("height")) - margin.top - margin.bottom
  svg.attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)

  const catX = 20
  const mechX = width - 120

  const yCat = d3.scaleBand().domain(categories).range([margin.top, height - margin.bottom]).padding(0.1)
  const yMech = d3.scaleBand().domain(mechanics).range([margin.top, height - margin.bottom]).padding(0.1)

  const g = svg.selectAll("g.chord_layer").data([0])
  g.enter().append("g").attr("class", "chord_layer")

  const layer = svg.select("g.chord_layer")
  // clear previous contents
  layer.selectAll("*").remove()

  layer.selectAll(".cat_rect").data(categories).enter().append("rect").attr("class", "cat_rect").attr("x", catX).attr("y", (d) => yCat(d)).attr("width", 80).attr("height", yCat.bandwidth()).attr("fill", "#6baed6")
  layer.selectAll(".mech_rect").data(mechanics).enter().append("rect").attr("class", "mech_rect").attr("x", mechX).attr("y", (d) => yMech(d)).attr("width", 80).attr("height", yMech.bandwidth()).attr("fill", "#fd8d3c")

  // Links
  const filteredEdges = edges.filter((e) => mechanics.includes(e.mechanic))
  const maxCount = d3.max(filteredEdges, (e) => e.count) || 1
  const linkScale = d3.scaleLinear().domain([0, maxCount]).range([1, 8])
  const links = layer.selectAll(".link").data(filteredEdges)
  links.enter().append("path").attr("class", "link").attr("d", (d) => {
    const y0 = yCat(d.category) + yCat.bandwidth() / 2
    const y1 = yMech(d.mechanic) + yMech.bandwidth() / 2
    const x0 = catX + 80
    const x1 = mechX
    return `M${x0},${y0} C${(x0 + x1) / 2},${y0} ${(x0 + x1) / 2},${y1} ${x1},${y1}`
  }).attr("stroke", "rgba(0,0,0,0.2)").attr("fill", "none").attr("stroke-width", (d) => linkScale(d.count))

  // labels
  layer.selectAll(".cat_label").data(categories).enter().append("text").attr("x", catX - 6).attr("y", (d) => yCat(d) + yCat.bandwidth() / 2).attr("text-anchor", "end").attr("font-size", 11).text((d) => d)
  layer.selectAll(".mech_label").data(mechanics).enter().append("text").attr("x", mechX + 84).attr("y", (d) => yMech(d) + yMech.bandwidth() / 2).attr("text-anchor", "start").attr("font-size", 11).text((d) => (d.length > 24 ? d.slice(0, 21) + "..." : d))
}

export default draw_chord
