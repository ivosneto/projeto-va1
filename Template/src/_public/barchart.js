import * as d3 from "d3"

export function draw_barchart(data) {
	console.log("drawing barchart")
	console.log(data)

	const margin = {
		top: 20,
		bottom: 40,
		left: 140,
		right: 20,
	}

	let svg = d3.select("#barchart_svg")
	let g_barchart = d3.select("#g_barchart")
	let g_x_axis_barchart = d3.select("#g_x_axis_barchart")
	let g_y_axis_barchart = d3.select("#g_y_axis_barchart")

	// Defensive: if expected elements are not present, skip drawing
	if (svg.empty() || g_barchart.empty() || g_x_axis_barchart.empty() || g_y_axis_barchart.empty()) {
		return
	}

	let width = parseInt(svg.style("width"))
	let height = parseInt(svg.style("height"))

	svg.attr("viewBox", `0 0 ${width} ${height}`)

	const xScale = d3
		.scaleLinear()
		.domain([0, d3.max(data.map((d) => d.avg_rating)) || 1])
		.nice()
		.range([0, width - margin.left - margin.right])

	const yScale = d3
		.scaleBand()
		.domain(data.map((d) => d.category))
		.range([0, height - margin.top - margin.bottom])
		.padding(0.1)

	let barchart_rect = g_barchart.selectAll(".barchart_rect").data(data)

	barchart_rect
		.enter()
		.append("rect")
		.attr("class", "barchart_rect")
		.merge(barchart_rect)
		.attr("fill", "#2b7bba")
		.attr("x", margin.left)
		.attr("y", (d) => margin.top + yScale(d.category))
		.attr("width", (d) => xScale(d.avg_rating))
		.attr("height", yScale.bandwidth())

	barchart_rect.exit().remove()

	let x_axis = d3.axisBottom(xScale).ticks(4)

	g_x_axis_barchart
		.attr(
			"transform",
			"translate(" + margin.left + "," + (height - margin.bottom) + ")"
		)
		.call(x_axis)

	let y_axis = d3.axisLeft(yScale)

	g_y_axis_barchart
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		.call(y_axis)

	let x_label = g_barchart
		.selectAll(".x_label")
		.data(["Average rating (top categories)"])

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

	let y_label = g_barchart.selectAll(".y_label").data(["Category"])

	y_label
		.enter()
		.append("text")
		.attr("class", "y_label")
		.merge(y_label)
		.attr("x", -height / 2)
		.attr("y", margin.left / 6)
		.attr("text-anchor", "middle")
		.attr("transform", "rotate(-90)")
		.text((d) => d)

	y_label.exit().remove()
}