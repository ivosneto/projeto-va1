import io from "socket.io-client"
import "./app.css"
import {configs} from "../_server/static/configs.js"
import { draw_scatterplot } from "./scatterplot.js"
import { draw_lda_plot } from "./lda_plot.js"
import { draw_barchart } from "./barchart.js"
import * as d3 from "d3"

let hostname = window.location.hostname
let protocol = window.location.protocol
const socketUrl = protocol + "//" + hostname + ":" + configs.port

export const socket = io(socketUrl)
socket.on("connect", () => {
  console.log("Connected to " + socketUrl + ".")
  // Request initial data when connected
  requestData()
})
socket.on("disconnect", () => {
  console.log("Disconnected from " + socketUrl + ".")
})

/**
 * Callback, when the button is pressed to request the data from the server.
 * @param {*} parameters
 */
let requestData = () => {
  console.log("requesting boardgames data from webserver")
  let ldaTopN = parseInt(document.getElementById("lda_top_n").value, 10)
  let ldaDims = parseInt(document.getElementById("lda_dims").value, 10)
  socket.emit("getData", {
    parameters: {
      lda_top_n: Number.isFinite(ldaTopN) ? ldaTopN : 8,
      lda_dims: Number.isFinite(ldaDims) ? ldaDims : 2,
    },
  })
}

/**
 * Assigning the callback to request the data on click.
 */
document.getElementById("load_data_button").onclick = () => {
  requestData()
}

// Auto-request when controls change so UI updates immediately
document.getElementById("lda_top_n").onchange = () => requestData()
document.getElementById("lda_dims").onchange = () => requestData()

/**
 * Object, that will store the loaded data.
 */
let data = {
  scatterplot: undefined,
  lda: undefined,
  lda_dims: 2,
  barchart: undefined,
}

/**
 * Callback that is called, when the requested data was sent from the server and is received in the frontend (here).
 * @param {*} payload
 */
let handleData = (payload) => {
  console.log(`Fresh data from Webserver:`)
  console.log(payload)
  let processed = payload.data || {}
  data.scatterplot = processed.scatter_data || []
  data.lda = processed.lda_data || []
  data.lda_dims = processed.lda_dims || 2
  data.barchart = processed.category_stats || []
  draw_scatterplot(data.scatterplot)
  draw_lda_plot(data.lda, data.lda_dims)
  draw_barchart(data.barchart)
  // simple redraw of main charts
}

socket.on("freshData", handleData)

let width = 0
let height = 0

/**
 * This is an example for visualizations, that are not automatically scalled with the viewBox attribute.
 *
 * IMPORTANT:
 * The called function to draw the data must not do any data preprocessing!
 * To much computational load will result in stuttering and reduced responsiveness!
 */
let checkSize = setInterval(() => {
  let container = d3.select(".visualizations")
  let newWidth = parseInt(container.style("width"))
  let newHeight = parseInt(container.style("height"))
  if (newWidth !== width || newHeight !== height) {
    width = newWidth
    height = newHeight
    if (data.scatterplot) draw_scatterplot(data.scatterplot)
    if (data.lda) draw_lda_plot(data.lda, data.lda_dims)
    if (data.barchart) draw_barchart(data.barchart)
  }
}, 100)
