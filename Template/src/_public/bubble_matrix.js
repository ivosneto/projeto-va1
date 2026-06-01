import * as d3 from "d3"

let tooltip = null
function ensureTooltip() {
  if (!tooltip) {
    tooltip = d3.select("body").append("div").attr("class", "tooltip")
  }
  return tooltip
}

/**
 * Bubble matrix: playtime (x) vs rating (y), bubble size = #mechanics,
 * color = primary category. Supports a selectedIds filter (from the parallel
 * coordinates brush) to fade out non-selected games.
 */
export function draw_bubble_matrix(data, { color, selectedIds } = {}) {
  let svg = d3.select("#bubble_svg")
  if (svg.empty() || !data || data.length === 0) return

  let width = parseInt(svg.style("width"))
  let height = parseInt(svg.style("height"))
  svg.attr("viewBox", `0 0 ${width} ${height}`)
  svg.selectAll("*").remove()

  const margin = { top: 16, right: 130, bottom: 46, left: 52 }
  const innerW = width - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`)

  const x = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.playtime_avg) || 1])
    .nice()
    .range([0, innerW])

  let yExt = d3.extent(data, (d) => d.rating_value)
  let yPad = (yExt[1] - yExt[0]) * 0.1 || 0.5
  const y = d3
    .scaleLinear()
    .domain([yExt[0] - yPad, yExt[1] + yPad])
    .nice()
    .range([innerH, 0])

  const r = d3
    .scaleSqrt()
    .domain([0, d3.max(data, (d) => d.nMechanics) || 1])
    .range([3, 15])

  // gridlines
  g.append("g")
    .attr("class", "y_grid")
    .call(d3.axisLeft(y).ticks(6).tickSize(-innerW).tickFormat(""))
  g.append("g")
    .attr("class", "x_grid")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(6).tickSize(-innerH).tickFormat(""))

  // axes
  g.append("g").attr("transform", `translate(0,${innerH})`).call(d3.axisBottom(x).ticks(6))
  g.append("g").call(d3.axisLeft(y).ticks(6))

  // axis labels
  g.append("text")
    .attr("class", "x_label")
    .attr("x", innerW / 2)
    .attr("y", innerH + 38)
    .attr("text-anchor", "middle")
    .text("Average playtime (min)")
  g.append("text")
    .attr("class", "y_label")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerH / 2)
    .attr("y", -38)
    .attr("text-anchor", "middle")
    .text("Average rating")

  const tip = ensureTooltip()

  g.append("g")
    .selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", (d) => x(d.playtime_avg))
    .attr("cy", (d) => y(d.rating_value))
    .attr("r", (d) => r(d.nMechanics))
    .attr("fill", (d) => (color ? color(d.category_primary) : "#4a78b5"))
    .attr("opacity", 0.8)
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.6)
    .classed("faded", (d) => selectedIds && !selectedIds.has(d.id))
    .on("mousemove", (event, d) => {
      tip
        .style("opacity", 1)
        .style("left", event.pageX + 12 + "px")
        .style("top", event.pageY + 12 + "px")
        .html(
          `<b>${d.title || "?"}</b><br/>` +
            `Rating: ${d.rating_value?.toFixed(2)}<br/>` +
            `Playtime: ${d.playtime_avg} min<br/>` +
            `Mecanicas: ${d.nMechanics}<br/>` +
            `Reviews: ${d.review_count}<br/>` +
            `Categoria: ${d.category_primary}`
        )
    })
    .on("mouseleave", () => tip.style("opacity", 0))

  // color legend
  const cats = color ? color.domain() : Array.from(new Set(data.map((d) => d.category_primary)))
  const legend = svg
    .append("g")
    .attr("transform", `translate(${margin.left + innerW + 16},${margin.top})`)
  legend
    .selectAll("g")
    .data(cats)
    .join("g")
    .attr("transform", (d, i) => `translate(0,${i * 17})`)
    .each(function (d) {
      const row = d3.select(this)
      row
        .append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", color ? color(d) : "#4a78b5")
      row.append("text").attr("x", 17).attr("y", 10).attr("font-size", 11).text(d)
    })
}
