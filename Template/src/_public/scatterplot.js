import * as d3 from "d3"

export function draw_scatterplot(data) {
  console.log("draw scatterplot")
  console.log(data)

  /**
   * Margins of the visualization.
   */
  const margin = {
    top: 40,
    bottom: 50,
    left: 50,
    right: 50,
  }

  /**
   * Selection of svg and groups to be drawn on.
   */
  let svg = d3.select("#scatterplot_svg")
  let g_scatterplot = d3.select("#g_scatterplot")
  let g_x_axis_scatterplot = d3.select("#g_x_axis_scatterplot")
  let g_y_axis_scatterplot = d3.select("#g_y_axis_scatterplot")

  // Defensive: if the expected svg/group elements are not present, do nothing
  if (svg.empty() || g_scatterplot.empty() || g_x_axis_scatterplot.empty() || g_y_axis_scatterplot.empty()) {
    return
  }

  /**
   * Getting the current width/height of the whole drawing pane.
   */
  let width = parseInt(svg.style("width"))
  let height = parseInt(svg.style("height"))

  svg.attr("viewBox", `0 0 ${width} ${height}`)

  let xMax = d3.max(data.map((d) => d.playtime_avg)) || 1
  let yMax = d3.max(data.map((d) => d.rating_value)) || 1
  let rMax = d3.max(data.map((d) => d.review_count)) || 1

  /**
   * Scale function for the x-axis
   */
  const xScale = d3
    .scaleLinear()
    .domain([0, xMax])
    .nice()
    .range([0, width - margin.left - margin.right])

  /**
   * Scale function for the y-axis
   */
  const yScale = d3
    .scaleLinear()
    .domain([0, yMax])
    .nice()
    .range([height - margin.top - margin.bottom, 0])

  const rScale = d3
    .scaleSqrt()
    .domain([0, rMax])
    .range([3, 14])

  let categories = Array.from(
    new Set(data.map((d) => d.category_primary || "Other"))
  )

  const colorScale = d3.scaleOrdinal().domain(categories).range(d3.schemeTableau10)

  /**
   * Drawing the data itself as circles
   */
  let scatterplot_circle = g_scatterplot
    .selectAll(".scatterplot_circle")
    .data(data)

  scatterplot_circle
    .enter()
    .append("circle")
    .attr("class", "scatterplot_circle")
    .merge(scatterplot_circle)
    .attr("fill", (d) => colorScale(d.category_primary || "Other"))
    .attr("opacity", 0.8)
    .attr("r", (d) => rScale(d.review_count))
    .attr("cx", (d) => margin.left + xScale(d.playtime_avg))
    .attr("cy", (d) => yScale(d.rating_value) + margin.top)

  scatterplot_circle.exit().remove()

  /**
   * Drawing the x-axis for the visualized data
   */
  let x_axis = d3.axisBottom(xScale).ticks(6)
  let y_axis = d3.axisLeft(yScale).ticks(6)

  let x_grid = d3
    .axisBottom(xScale)
    .ticks(6)
    .tickSize(-(height - margin.top - margin.bottom))
    .tickFormat("")

  let y_grid = d3
    .axisLeft(yScale)
    .ticks(6)
    .tickSize(-(width - margin.left - margin.right))
    .tickFormat("")

  let g_x_grid = g_scatterplot.selectAll(".x_grid").data([0])
  g_x_grid
    .enter()
    .append("g")
    .attr("class", "x_grid")
    .merge(g_x_grid)
    .attr(
      "transform",
      "translate(" + margin.left + "," + (height - margin.bottom) + ")"
    )
    .call(x_grid)

  let g_y_grid = g_scatterplot.selectAll(".y_grid").data([0])
  g_y_grid
    .enter()
    .append("g")
    .attr("class", "y_grid")
    .merge(g_y_grid)
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(y_grid)

  g_x_axis_scatterplot
    .attr(
      "transform",
      "translate(" + margin.left + "," + (height - margin.bottom) + ")"
    )
    .call(x_axis)

  /**
   * Drawing the y-axis for the visualized data
   */
  g_y_axis_scatterplot
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(y_axis)

  /**
   * Drawing the x-axis label
   */
  let x_label = g_scatterplot
    .selectAll(".x_label")
    .data(["Average playtime (min)"])

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

  /**
   * Drawing the y-axis label
   */
  let y_label = g_scatterplot
    .selectAll(".y_label")
    .data(["Average rating"])

  y_label
    .enter()
    .append("text")
    .attr("class", "y_label")
    .merge(y_label)
    .attr("x", -height / 2)
    .attr("y", margin.left / 4)
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text((d) => d)

  y_label.exit().remove()

  let legend = g_scatterplot.selectAll(".legend").data([0])
  legend
    .enter()
    .append("g")
    .attr("class", "legend")
    .merge(legend)
    .attr("transform", `translate(${width - margin.right - 140},${margin.top})`)

  let legend_items = g_scatterplot
    .select(".legend")
    .selectAll(".legend_item")
    .data(categories)

  let legend_enter = legend_items
    .enter()
    .append("g")
    .attr("class", "legend_item")

  legend_enter.append("rect")
  legend_enter.append("text")

  legend_items = legend_enter.merge(legend_items)
  legend_items
    .attr("transform", (d, i) => `translate(0, ${i * 18})`)

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
}