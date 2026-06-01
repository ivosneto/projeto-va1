import * as d3 from "d3"

let tooltip = null
function ensureTooltip() {
  if (!tooltip) tooltip = d3.select("body").append("div").attr("class", "tooltip")
  return tooltip
}

const DIMS = [
  { key: "rating", label: "Rating" },
  { key: "playtime", label: "Playtime (min)" },
  { key: "minplayers", label: "Min players" },
  { key: "maxplayers", label: "Max players" },
  { key: "minage", label: "Min age" },
  { key: "nMechanics", label: "#Mechanics" },
]

/**
 * Parallel coordinates with per-axis brushing.
 * Calls onBrush(selectedIdSet | null) whenever the selection changes:
 *  - a Set of ids when at least one axis is brushed
 *  - null when no axis is brushed (no filter)
 */
export function draw_parallel_coords(data, { color, onBrush } = {}) {
  let svg = d3.select("#pc_svg")
  if (svg.empty() || !data || data.length === 0) return

  let width = parseInt(svg.style("width"))
  let height = parseInt(svg.style("height"))
  svg.attr("viewBox", `0 0 ${width} ${height}`)
  svg.selectAll("*").remove()

  const margin = { top: 28, right: 24, bottom: 22, left: 24 }
  const innerW = width - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom

  const root = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`)

  // one vertical scale per dimension
  const x = d3.scalePoint().domain(DIMS.map((d) => d.key)).range([0, innerW])
  const y = {}
  for (let dim of DIMS) {
    let ext = d3.extent(data, (d) => d[dim.key])
    if (ext[0] === ext[1]) ext = [ext[0] - 1, ext[1] + 1]
    y[dim.key] = d3.scaleLinear().domain(ext).nice().range([innerH, 0])
  }

  const line = d3.line()
  const pathFor = (d) =>
    line(DIMS.map((dim) => [x(dim.key), y[dim.key](d[dim.key])]))

  // style helpers: "Other" stays light gray in the background; the chosen
  // categories are colored and drawn on top, so the colored lines stand out.
  const isOther = (d) => d.category_primary === "Other"
  const baseStroke = (d) => (isOther(d) ? "#c9ced8" : color ? color(d.category_primary) : "#4a78b5")
  const baseWidth = (d) => (isOther(d) ? 0.6 : 1.2)
  const baseOpacity = (d) => (isOther(d) ? 0.22 : 0.6)

  // Other first (behind), named categories last (on top)
  const ordered = data
    .slice()
    .sort((a, b) => (isOther(a) === isOther(b) ? 0 : isOther(a) ? -1 : 1))

  const tip = ensureTooltip()

  // data polylines
  const lines = root
    .append("g")
    .selectAll("path")
    .data(ordered)
    .join("path")
    .attr("class", "pc_line")
    .attr("d", pathFor)
    .attr("fill", "none")
    .attr("stroke", baseStroke)
    .attr("stroke-width", baseWidth)
    .attr("opacity", baseOpacity)
    .style("cursor", "pointer")
    .on("mouseover", function (event, d) {
      d3.select(this).raise().attr("stroke", baseStroke(d)).attr("stroke-width", 2.8).attr("opacity", 1)
      tip
        .style("opacity", 1)
        .style("left", event.pageX + 12 + "px")
        .style("top", event.pageY + 12 + "px")
        .html(
          `<b>${d.title || "?"}</b><br/>` +
            `Rating: ${d.rating?.toFixed(2)}<br/>` +
            `Playtime: ${d.playtime} min<br/>` +
            `Players: ${d.minplayers}-${d.maxplayers}<br/>` +
            `Min age: ${d.minage}<br/>` +
            `#Mechanics: ${d.nMechanics}<br/>` +
            `Category: ${d.category_primary}`
        )
    })
    .on("mouseout", function (event, d) {
      d3.select(this).attr("stroke", baseStroke(d)).attr("stroke-width", baseWidth(d)).attr("opacity", baseOpacity(d))
      tip.style("opacity", 0)
    })

  // axes + brushes
  const activeBrush = new Map() // dim.key -> [valLow, valHigh]

  const axisG = root
    .selectAll(".pc_axis")
    .data(DIMS)
    .join("g")
    .attr("class", "pc_axis")
    .attr("transform", (d) => `translate(${x(d.key)},0)`)

  axisG.each(function (dim) {
    d3.select(this).call(d3.axisLeft(y[dim.key]).ticks(5))
  })

  // axis titles
  axisG
    .append("text")
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .attr("fill", "#2b3c57")
    .attr("font-size", 11)
    .attr("font-weight", "bold")
    .text((d) => d.label)

  const applySelection = () => {
    if (activeBrush.size === 0) {
      lines.classed("faded", false)
      if (onBrush) onBrush(null)
      return
    }
    const selected = new Set()
    data.forEach((d) => {
      let keep = true
      for (let [key, [lo, hi]] of activeBrush) {
        if (d[key] < lo || d[key] > hi) {
          keep = false
          break
        }
      }
      if (keep) selected.add(d.id)
    })
    lines.classed("faded", (d) => !selected.has(d.id))
    if (onBrush) onBrush(selected)
  }

  axisG.each(function (dim) {
    const brush = d3
      .brushY()
      .extent([
        [-9, 0],
        [9, innerH],
      ])
      .on("brush end", (event) => {
        if (event.selection) {
          let [y1, y0] = event.selection // pixels (y1 top < y0 bottom)
          activeBrush.set(dim.key, [
            y[dim.key].invert(y0),
            y[dim.key].invert(y1),
          ])
        } else {
          activeBrush.delete(dim.key)
        }
        applySelection()
      })
    d3.select(this).append("g").attr("class", "brush").call(brush)
  })
}
