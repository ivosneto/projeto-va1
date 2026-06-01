import * as d3 from "d3"

export function draw_bubble_matrix(data) {
  const svg = d3.select("#bubble_svg")
  const g = d3.select("#g_bubble")
  if (!data) return

  const margin = { top: 30, right: 20, bottom: 40, left: 50 }
  const width = parseInt(svg.style("width")) - margin.left - margin.right
  const height = parseInt(svg.style("height")) - margin.top - margin.bottom
  svg.attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)

  const xScale = d3.scaleLinear().domain(d3.extent(data, (d) => d.playtime)).nice().range([0, width])
  const yScale = d3.scaleLinear().domain(d3.extent(data, (d) => d.rating)).nice().range([height, 0])
  const rScale = d3.scaleSqrt().domain([0, d3.max(data, (d) => d.nMechanics || 1)]).range([3, 12])

  const categories = Array.from(new Set(data.map((d) => d.category_primary)))
  const color = d3.scaleOrdinal().domain(categories).range(d3.schemeTableau10)

  const points = g.selectAll(".bubble_point").data(data, (d) => d.id)

  points
    .enter()
    .append("circle")
    .attr("class", "bubble_point")
    .merge(points)
    .attr("cx", (d) => margin.left + xScale(d.playtime))
    .attr("cy", (d) => margin.top + yScale(d.rating))
    .attr("r", (d) => rScale(d.nMechanics || 1))
    .attr("fill", (d) => color(d.category_primary))
    .attr("opacity", 0.8)

  points.exit().remove()

  const xAxis = d3.axisBottom(xScale).ticks(6)
  const yAxis = d3.axisLeft(yScale).ticks(6)

  const gx = d3.select("#g_x_axis_bubble")
  const gy = d3.select("#g_y_axis_bubble")
  gx.attr("transform", `translate(${margin.left},${height + margin.top})`).call(xAxis)
  gy.attr("transform", `translate(${margin.left},${margin.top})`).call(yAxis)

  // simple tooltip
  const tooltip = d3.select("body").selectAll(".tooltip").data([0])
  const ttEnter = tooltip.enter().append("div").attr("class", "tooltip").style("position", "absolute").style("pointer-events", "none").style("background", "white").style("padding", "6px").style("border", "1px solid #ccc").style("display", "none")

  g.selectAll(".bubble_point")
    .on("mouseover", function (event, d) {
      ttEnter.merge(tooltip).style("display", "block").html(`<b>${d.title}</b><br/>Rating: ${d.rating}<br/>Reviews: ${d.nMechanics}`)
    })
    .on("mousemove", function (event) {
      ttEnter.merge(tooltip).style("left", event.pageX + 8 + "px").style("top", event.pageY + 8 + "px")
    })
    .on("mouseout", function () {
      ttEnter.merge(tooltip).style("display", "none")
    })
}

export default draw_bubble_matrix
