import * as d3 from "d3"

export function draw_lda_plot(data, lda_dims = 2) {
  console.log("draw lda plot")
  console.log(data)

  const margin = {
    top: 30,
    bottom: 40,
    left: 60,
    right: 40,
  }

  let svg = d3.select("#lda_svg")
  let g_lda = d3.select("#g_lda")
  let g_x_axis = d3.select("#g_x_axis_lda")
  let g_y_axis = d3.select("#g_y_axis_lda")

  let width = parseInt(svg.style("width"))
  let height = parseInt(svg.style("height"))

  svg.attr("viewBox", `0 0 ${width} ${height}`)

  if (!data || data.length === 0) {
    g_lda.selectAll(".lda_point").remove()
    return
  }

  let xExtent = d3.extent(data.map((d) => d.x))
  let yExtent = d3.extent(data.map((d) => d.y))

  const xScale = d3
    .scaleLinear()
    .domain(xExtent)
    .nice()
    .range([0, width - margin.left - margin.right])

  const yScale = d3
    .scaleLinear()
    .domain(yExtent)
    .nice()
    .range([height - margin.top - margin.bottom, 0])

  let categories = Array.from(new Set(data.map((d) => d.category)))
  const colorScale = d3.scaleOrdinal().domain(categories).range(d3.schemeTableau10)

  let points = g_lda.selectAll(".lda_point").data(data)

  points
    .enter()
    .append("circle")
    .attr("class", "lda_point")
    .merge(points)
    .attr("fill", (d) => colorScale(d.category))
    .attr("opacity", 0.85)
    .attr("r", 5)
    .attr("cx", (d) => margin.left + xScale(d.x))
    .attr("cy", (d) => margin.top + yScale(d.y))

  points.exit().remove()

  let x_axis = d3.axisBottom(xScale).ticks(5)
  let y_axis = d3.axisLeft(yScale).ticks(5)

  g_x_axis
    .attr(
      "transform",
      "translate(" + margin.left + "," + (height - margin.bottom) + ")"
    )
    .call(x_axis)

  g_y_axis
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(y_axis)

  let x_label_text = lda_dims >= 2 ? "LDA-1" : "LDA-1"
  let x_label = g_lda.selectAll(".x_label").data([x_label_text])
  x_label
    .enter()
    .append("text")
    .attr("class", "x_label")
    .merge(x_label)
    .attr("x", width / 2)
    .attr("y", height - margin.bottom / 4)
    .attr("text-anchor", "middle")
    .text((d) => d)
  x_label.exit().remove()

  let y_label_text = lda_dims >= 2 ? "LDA-2" : "LDA-2"
  let y_label = g_lda.selectAll(".y_label").data([y_label_text])
  y_label
    .enter()
    .append("text")
    .attr("class", "y_label")
    .merge(y_label)
    .attr("x", -height / 2)
    .attr("y", margin.left / 3)
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text((d) => d)
  y_label.exit().remove()

  let legend = g_lda.selectAll(".legend").data([0])
  legend
    .enter()
    .append("g")
    .attr("class", "legend")
    .merge(legend)
    .attr("transform", `translate(${width - margin.right - 140},${margin.top})`)

  let legend_items = g_lda
    .select(".legend")
    .selectAll(".legend_item")
    .data(categories)

  let legend_enter = legend_items.enter().append("g").attr("class", "legend_item")
  legend_enter.append("rect")
  legend_enter.append("text")

  legend_items = legend_enter.merge(legend_items)
  legend_items.attr("transform", (d, i) => `translate(0, ${i * 18})`)

  legend_items
    .select("rect")
    .attr("width", 12)
    .attr("height", 12)
    .attr("fill", (d) => colorScale(d))

  legend_items
    .select("text")
    .attr("x", 18)
    .attr("y", 10)
    .attr("font-size", 11)
    .text((d) => d)

  legend_items.exit().remove()

  // update legend title count
  g_lda.select(".legend").selectAll(".legend_title").data([`Groups: ${categories.length}`]).join(
    (enter) => enter.append("text").attr("class", "legend_title").attr("x", 0).attr("y", -10).text((d) => d),
    (update) => update.text((d) => d)
  )
}
