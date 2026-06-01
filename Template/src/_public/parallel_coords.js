import * as d3 from "d3"

export function draw_parallel(data, onSelection) {
  // data: array of objects with id, title, rating, playtime, minplayers, maxplayers, nCategories, nMechanics, category_primary
  const container = d3.select(".parallel")
  const svg = container.select("svg")
  if (svg.empty()) return

  const margin = { top: 30, right: 10, bottom: 10, left: 10 }
  const width = parseInt(svg.style("width")) - margin.left - margin.right
  const height = parseInt(svg.style("height")) - margin.top - margin.bottom

  svg.attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)

  const dimensions = [
    { key: "rating", label: "Rating" },
    { key: "playtime", label: "Avg Playtime" },
    { key: "minplayers", label: "Min Players" },
    { key: "maxplayers", label: "Max Players" },
    { key: "nCategories", label: "#Categories" },
    { key: "nMechanics", label: "#Mechanics" },
  ]

  const g = svg.selectAll("g.pc_layer").data([0])
  const gEnter = g.enter().append("g").attr("class", "pc_layer")
  const layer = gEnter.merge(g)
  layer.selectAll(".pc_line").remove()
  layer.selectAll(".pc_axis").remove()

  const yScales = {}
  dimensions.forEach((dim) => {
    const extent = d3.extent(data.map((d) => d[dim.key]))
    yScales[dim.key] = d3.scaleLinear().domain(extent).range([height, 0]).nice()
  })

  const xScale = d3.scalePoint().domain(dimensions.map((d) => d.key)).range([0, width])

  // Lines
  const line = d3.line().x((d) => xScale(d.key)).y((d) => yScales[d.key](d.value))

  const paths = layer
    .selectAll(".pc_line")
    .data(data, (d) => d.id)
  paths
    .enter()
    .append("path")
    .attr("class", "pc_line")
    .attr("d", (d) => line(dimensions.map((dim) => ({ key: dim.key, value: d[dim.key] }))))
    .attr("stroke", (d) => "#888")
    .attr("stroke-width", 1)
    .attr("fill", "none")
    .attr("opacity", 0.6)

  // Axes + brushes
  const axisG = layer
    .selectAll(".pc_axis")
    .data(dimensions)
    .enter()
    .append("g")
    .attr("class", "pc_axis")
    .attr("transform", (d) => `translate(${xScale(d.key)},0)`)

  axisG.append("g").each(function (d) {
    d3.select(this).call(d3.axisLeft(yScales[d.key]).ticks(4))
  })

  axisG.append("text").attr("y", -8).attr("text-anchor", "middle").text((d) => d.label)

  // Brush for each axis
  axisG.append("g").attr("class", "brush").each(function (dim) {
    d3.select(this).call(
      d3
        .brushY()
        .extent([[-10, 0], [10, height]])
        .on("brush end", function (event) {
          const sel = event.selection
          const active = new Set()
          if (sel) {
            const [y0, y1] = sel.map((v) => yScales[dim.key].invert(v))
            data.forEach((d) => {
              if (d[dim.key] >= y0 && d[dim.key] <= y1) active.add(d.id)
            })
          }
          // compute intersection of active ids across all brushes
          const brushes = layer.selectAll('.brush').nodes()
          let intersection = new Set(data.map((d) => d.id))
          brushes.forEach((bnode) => {
            const selb = d3.select(bnode).datum()
          })
          // For simplicity: if any brush has selection, use that set; otherwise full set
          let selectedIds = sel ? Array.from(active) : data.map((d) => d.id)
          if (typeof onSelection === 'function') onSelection(selectedIds)
        })
    )
  })
}

export default draw_parallel
