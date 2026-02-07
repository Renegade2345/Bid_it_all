const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const cors = require("cors")
const { initItems, getItems, placeBid } = require("./auctionEngine")

const app = express()
app.use(cors())
app.use(express.json())

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173"
  }
})

const PORT = process.env.PORT || 3000

initItems()

const scheduleAuctionEnd = (item) => {
  const delay = item.endsAt - Date.now()

  if (delay <= 0) return

  setTimeout(() => {
    item.isActive = false
    io.to(item.id).emit("AUCTION_ENDED", item)
  }, delay)
}

getItems().forEach(scheduleAuctionEnd)


// REST
app.get("/items", (req, res) => {
  res.json({
    serverTime: Date.now(),
    items: getItems()
  })
})

// SOCKET
io.on("connection", (socket) => {
  console.log("Connected:", socket.id)

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
})

server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`)
})
