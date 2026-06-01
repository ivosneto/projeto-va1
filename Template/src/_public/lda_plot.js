import * as d3 from "d3"

/**
 * LDA scatter with a convex hull per group (category), to make group
 * separation/overlap clear (Compare). When d>=3, the 3rd discriminant is
 * encoded as point size. Supports a selectedIds filter from the brush.
 */
export function draw_lda_plot(data, lda_dims = 2, { color, selectedIds } = {}) {
  let svg = d3.select("#lda_svg")
  if (svg.empty()) return

  let width = parseInt(svg.style("width"))
  let height = parseInt(svg.style("height"))
  svg.attr("viewBox", `0 0 ${width} ${height}`)
  svg.selectAll("*").remove()

  if (!data || data.length === 0) {
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#888")
      .attr("font-size", 13)
      .text("Selecione ao menos 2 categorias (com >=2 jogos cada)")
    return
  }

  const margin = { top: 28, right: 130, bottom: 42, left: 52 }
  const innerW = width - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`)

  const x = d3.scaleLinear().domain(d3.extent(data, (d) => d.x)).nice().range([0, innerW])
  const y = d3.scaleLinear().domain(d3.extent(data, (d) => d.y)).nice().range([innerH, 0])

  const categories = color ? color.domain() : Array.from(new Set(data.map((d) => d.category)))
  const col = (c) => (color ? color(c) : "#4a78b5")

  // size encoding for the 3rd LDA dimension when d>=3
  const hasZ = lda_dims >= 3 && data.some((d) => Number.isFinite(d.z))
  let rScale = null
  if (hasZ) {
    rScale = d3.scaleLinear().domain(d3.extent(data.filter((d) => Number.isFinite(d.z)), (d) => d.z)).range([3, 11])
  }

  // axes
  g.append("g").attr("transform", `translate(0,${innerH})`).call(d3.axisBottom(x).ticks(5))
  g.append("g").call(d3.axisLeft(y).ticks(5))
  g.append("text").attr("class", "x_label").attr("x", innerW / 2).attr("y", innerH + 36).attr("text-anchor", "middle").text("LDA-1")
  g.append("text").attr("class", "y_label").attr("transform", "rotate(-90)").attr("x", -innerH / 2).attr("y", -38).attr("text-anchor", "middle").text("LDA-2")

  // convex hull per group
  const hulls = g.append("g")
  categories.forEach((cat) => {
    const pts = data.filter((d) => d.category === cat).map((d) => [x(d.x), y(d.y)])
    if (pts.length < 3) return
    const hull = d3.polygonHull(pts)
    if (!hull) return
    hulls
      .append("path")
      .attr("class", "hull")
      .attr("d", "M" + hull.map((p) => p.join(",")).join("L") + "Z")
      .attr("fill", col(cat))
      .attr("stroke", col(cat))
  })

  // points
  g.append("g")
    .selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", (d) => x(d.x))
    .attr("cy", (d) => y(d.y))
    .attr("r", (d) => (hasZ && Number.isFinite(d.z) ? rScale(d.z) : 5))
    .attr("fill", (d) => col(d.category))
    .attr("opacity", 0.85)
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.5)
    .classed("faded", (d) => selectedIds && !selectedIds.has(d.id))

  if (hasZ) {
    g.append("text")
      .attr("x", 0)
      .attr("y", -12)
      .attr("font-size", 11)
      .attr("fill", "#444")
      .text("Tamanho = LDA-3")
  }

  // legend
  const legend = svg
    .append("g")
    .attr("transform", `translate(${margin.left + innerW + 16},${margin.top})`)
  legend
    .append("text")
    .attr("x", 0)
    .attr("y", -10)
    .attr("font-size", 11)
    .attr("font-weight", "bold")
    .text(`Groups: ${categories.length}`)
  legend
    .selectAll("g")
    .data(categories)
    .join("g")
    .attr("transform", (d, i) => `translate(0,${i * 17})`)
    .each(function (d) {
      const row = d3.select(this)
      row.append("rect").attr("width", 12).attr("height", 12).attr("fill", col(d))
      row.append("text").attr("x", 17).attr("y", 10).attr("font-size", 11).text(d)
    })
}
