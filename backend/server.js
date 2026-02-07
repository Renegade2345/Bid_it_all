const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const cors = require("cors")
const path = require("path")

const { initItems, getItems, placeBid } = require("./auctionEngine")


const app = express()
const server = http.createServer(app)

const io = new Server(server) // no hardcoded CORS for production

const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())


initItems()


const scheduleAuctionEnd = (item) => {
  const delay = item.endsAt - Date.now()

  if (delay <= 0) {
    item.isActive = false
    return
  }

  setTimeout(() => {
    item.isActive = false
    io.to(item.id).emit("AUCTION_ENDED", item)
    console.log(`Auction ended for item ${item.id}`)
  }, delay)
}

getItems().forEach(scheduleAuctionEnd)



app.get("/items", (req, res) => {
  res.json({
    serverTime: Date.now(),
    items: getItems()
  })
})



io.on("connection", (socket) => {
  console.log("Client connected:", socket.id)

  socket.on("JOIN_ITEM", (itemId) => {
    socket.join(itemId)
  })

  socket.on("BID_PLACED", ({ itemId, amount }) => {
    const result = placeBid(itemId, amount, socket.id)

    if (!result.success) {
      return socket.emit("BID_ERROR", result.message)
    }

    io.to(itemId).emit("UPDATE_BID", result.item)
  })

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id)
  })
})




if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")))

  app.get((req, res) => {
    res.sendFile(
      path.join(__dirname, "../frontend/dist/index.html")
    )
  })
}



server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
