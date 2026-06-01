import express from "express";
import ip from "ip";
import { Server } from "socket.io";
import { configs } from "./configs.js";
import { setupConnection } from "../websocket.js";
import * as http from "http"

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: "*",
  },
})

/**
 * Defines the folder to be served.
 */
app.use(express.static("public"))

/**
 * Callback, when a client connected.
 */
io.on("connection", setupConnection)

/**
 * Defines the port, the website (/the folder) is served on.
 */
server.listen(configs.port, () => {
  console.log("listening on *:" + configs.port)
})
