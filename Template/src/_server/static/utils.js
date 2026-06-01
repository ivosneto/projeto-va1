import clc from "cli-color"

/**
 * Prints an Array of Strings with a specific color.
 * @param {*} stringArray
 * @param {*} color
 */
export function printArrayInColor(stringArray, color) {
  for (let i = 0; i < stringArray.length; i++) {
    console.log(color(stringArray[i]))
  }
}
/**
 * Prints a message, on whoch ip and port the webserver is serving the website.
 * @param {*} ip_address
 * @param {*} port
 */
export function print_connectionMessage(ip_address, port) {
  const IPString = "http://" + ip_address + ":" + port
  const LHString = "http://localhost:" + port
  const stringIPAdress = clc.yellow.underline(IPString)
  const stringLocalhost = clc.yellow.underline(LHString)
  const leerzeichen = "\xa0"
  const leerzeichenCountIP = 39 - IPString.length
  let leerraumIP = ""
  let leerraumLH = ""
  for (let i = leerzeichenCountIP; i > 0; i--) {
    leerraumIP = leerraumIP + leerzeichen
  }
  const leerzeichenCountLH = 39 - LHString.length
  for (let i = leerzeichenCountLH; i > 0; i--) {
    leerraumLH = leerraumLH + leerzeichen
  }
  const IPlines = [
    "┌──────────────────────────────────────────────────────────────────────────────┐",
    "│                                                                              │",
    "│ VS-Code: " +
    clc.green("'ctrl + click'") +
    " on the IP below to open the website in your browser. │",
    "│                                                                              │",
    "│ Otherweise you can " +
    clc.green("copy") +
    " the IP to open the website in your browser.          │",
    "│                                                                              │",
    "│ My socket server is running on:       " +
    stringIPAdress +
    leerraumIP +
    "│",
    "│                                                                              │",
    "│ If you can't access with IP, try:     " +
    stringLocalhost +
    leerraumLH +
    "│",
    "│                                                                              │",
    "└──────────────────────────────────────────────────────────────────────────────┘",
  ]

  utils.printArrayInColor(IPlines, clc.cyanBright)
}
/**
 * Prints the socket-id of a new connection.
 * @param {*} socket_id
 */
export function print_clientConnected(socket_id) {
  const clientConnected = [
    "┌──────────────────────────────────────┐",
    "│ New client connected!                │",
    "│ Socket-id:   " + socket_id + "    │",
    "└──────────────────────────────────────┘",
  ]
  printArrayInColor(clientConnected, clc.yellow)
}
/**
 * Prints the socket-id when a client disconnected.
 * @param {*} socket_id
 */
export function print_clientDisconnected(socket_id) {
  const clientDisconnected = [
    "┌──────────────────────────────────────┐",
    "│ Client disconnected!                 │",
    "│ Socket-id:   " + socket_id + "    │",
    "└──────────────────────────────────────┘",
  ]
  printArrayInColor(clientDisconnected, clc.red)
}
/**
 * Prints json error message.
 * @param {*} json
 */
export function print_errorJson(json) {
  const keys = Object.keys(json)
  let printArray = []
  keys.forEach((k) => {
    printArray.push(`${k}: ${json[k]}`)
  }) 
  printArrayInColor(printArray, clc.red)
}