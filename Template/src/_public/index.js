import io from "socket.io-client"
import "./app.css"
import { configs } from "../_server/static/configs.js"
import { draw_parallel_coords } from "./parallel_coords.js"
import { draw_bubble_matrix } from "./bubble_matrix.js"
import { draw_lda_plot } from "./lda_plot.js"
import { draw_chord } from "./chord.js"
import * as d3 from "d3"

let hostname = window.location.hostname
let protocol = window.location.protocol
const socketUrl = protocol + "//" + hostname + ":" + configs.port

export const socket = io(socketUrl)
socket.on("connect", () => {
  console.log("Connected to " + socketUrl + ".")
  requestData()
})
socket.on("disconnect", () => {
  console.log("Disconnected from " + socketUrl + ".")
})

/** Read the categories currently checked in the sidebar. */
function checkedClasses() {
  return Array.from(
    document.querySelectorAll("#class_checkboxes input[type=checkbox]:checked")
  ).map((el) => el.value)
}

let requestData = () => {
  let ldaDims = parseInt(document.getElementById("lda_dims").value, 10)
  socket.emit("getData", {
    parameters: {
      lda_classes: checkedClasses(),
      lda_dims: Number.isFinite(ldaDims) ? ldaDims : 2,
    },
  })
}

document.getElementById("load_data_button").onclick = () => requestData()
document.getElementById("lda_dims").onchange = () => requestData()
document.getElementById("reset_brush").onclick = () => {
  state.selectedIds = null
  redrawLinked()
  draw_parallel_coords(state.pc, { color: state.color, onBrush: handleBrush }) // clears brushes
}

/**
 * Application state.
 */
let state = {
  pc: [],
  bubble: [],
  lda: [],
  lda_dims: 2,
  chord: [],
  mechanics: [],
  color: null,
  selectedIds: null,
  checkboxesBuilt: false,
}

function buildColor(all_categories) {
  let domain = (all_categories || []).map((c) => c.name).concat(["Other"])
  domain = Array.from(new Set(domain))
  return d3.scaleOrdinal().domain(domain).range(d3.schemeTableau10.concat(d3.schemeSet3))
}

// Build the category checkboxes once, from the stable all_categories list.
function buildCheckboxes(all_categories, chosen) {
  let container = d3.select("#class_checkboxes")
  container.selectAll("*").remove()
  let chosenSet = new Set(chosen)

  all_categories.forEach((cat) => {
    let row = container.append("label").attr("class", "chk-row")
    row
      .append("input")
      .attr("type", "checkbox")
      .attr("value", cat.name)
      .property("checked", chosenSet.has(cat.name))
      .on("change", () => requestData())
    row
      .append("span")
      .attr("class", "chk-swatch")
      .style("background", state.color(cat.name))
    row.append("span").text(cat.name)
    row.append("span").attr("class", "chk-count").text(cat.count)
  })
  state.checkboxesBuilt = true
}

function updateSelectionInfo() {
  let el = document.getElementById("selection_info")
  if (!el) return
  let n = state.selectedIds ? state.selectedIds.size : state.bubble.length
  el.textContent = `${n} jogos selecionados`
}

// re-draw only the charts that react to the brush selection
function redrawLinked() {
  draw_bubble_matrix(state.bubble, { color: state.color, selectedIds: state.selectedIds })
  draw_lda_plot(state.lda, state.lda_dims, { color: state.color, selectedIds: state.selectedIds })
  updateSelectionInfo()
}

function handleBrush(selectedIds) {
  state.selectedIds = selectedIds
  redrawLinked()
}

function drawAll() {
  draw_parallel_coords(state.pc, { color: state.color, onBrush: handleBrush })
  draw_bubble_matrix(state.bubble, { color: state.color, selectedIds: state.selectedIds })
  draw_lda_plot(state.lda, state.lda_dims, { color: state.color, selectedIds: state.selectedIds })
  draw_chord(state.chord, state.mechanics, { color: state.color })
  updateSelectionInfo()
}

let handleData = (payload) => {
  let p = payload.data || {}
  state.pc = p.pc_data || []
  state.bubble = p.bubble_data || []
  state.lda = p.lda_data || []
  state.lda_dims = p.lda_dims || 2
  state.chord = p.chord_edges || []
  state.mechanics = p.top_mechanics || []
  state.color = buildColor(p.all_categories)
  state.selectedIds = null // parameters changed -> reset filter

  if (!state.checkboxesBuilt && p.all_categories) {
    buildCheckboxes(p.all_categories, p.top_categories || [])
  }
  drawAll()
}

socket.on("freshData", handleData)

// Redraw on container resize. Skips parallel-coords while a brush is active to
// avoid wiping the selection.
let width = 0
setInterval(() => {
  let container = d3.select(".visualizations")
  if (container.empty()) return
  let newWidth = parseInt(container.style("width"))
  if (newWidth !== width) {
    width = newWidth
    if (state.bubble.length) {
      if (!state.selectedIds) {
        draw_parallel_coords(state.pc, { color: state.color, onBrush: handleBrush })
      }
      draw_bubble_matrix(state.bubble, { color: state.color, selectedIds: state.selectedIds })
      draw_lda_plot(state.lda, state.lda_dims, { color: state.color, selectedIds: state.selectedIds })
      draw_chord(state.chord, state.mechanics, { color: state.color })
    }
  }
}, 300)
