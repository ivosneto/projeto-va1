import * as fs from "fs"
import { print_clientConnected, print_clientDisconnected } from "./static/utils.js"
import { preprocess_boardgames } from "./preprocessing.js"

const file_path = "data/"
const file_name = "boardgames_100.json"

/**
 * Does some console.logs when a client connected.
 * Also sets up the listener, if the client disconnects.
 * @param {*} socket 
 */
export function setupConnection(socket) {
  print_clientConnected(socket.id)

  /**
   * Listener that is called, if client disconnects.
   */
  socket.on("disconnect", () => {
    print_clientDisconnected(socket.id)
  })

  /**
   * # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
   * 
   * !!!!! Here an below, you can/should edit the code  !!!!!
   * - you can modify the getData listener
   * - you can add other listeners for other functionalities
   * 
   * # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
   */


  /**
   * Listener that is called, if a message was sent with the topic "getData"
   * 
   * In this case, the following is done:
   * - Read in the data (.csv in this case) a a stream
   *      (Stream -> data is read in line by line)
   * - Do data preprocessing while reading in:
   *      - Convert values, that can be represented as numbers to numbers
   *      - Calculate the BMI for every data row (person)
   *      - Filtering: if the row has a value, that contradicts the filtering parameters, data row will be excluded
   *          (in this case: weight should not be larger than the max_weight filter-parameter)
   */
  socket.on("getData", (obj) => {
    console.log("Data request received...")
    let parameters = obj?.parameters || {}

    fs.readFile(file_path + file_name, "utf-8", (err, raw) => {
      if (err) {
        console.error("Failed to read dataset", err)
        socket.emit("freshData", {
          timestamp: new Date().getTime(),
          data: {
            scatter_data: [],
            category_stats: [],
            top_categories: [],
            lda_data: [],
          },
          error: "Failed to read dataset",
        })
        return
      }

      let games = []
      try {
        games = JSON.parse(raw)
      } catch (parseErr) {
        console.error("Failed to parse dataset", parseErr)
      }

      let processed = preprocess_boardgames(games, {
        classes: parameters.lda_classes,
        lda_dims: parameters.lda_dims,
      })

      socket.emit("freshData", {
        timestamp: new Date().getTime(),
        data: processed,
      })
      console.log("freshData emitted")
    })
  })
}