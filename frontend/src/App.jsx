import { useEffect, useState } from "react"
import { io } from "socket.io-client"

const socket = io("http://localhost:3000")

function App() {
  const [items, setItems] = useState([])
  const [serverOffset, setServerOffset] = useState(0)
  const [socketId, setSocketId] = useState(null)


// Countdown re-render
  useEffect(() => {
  const interval = setInterval(() => {
    setItems(prev => [...prev])
  }, 1000)

  return () => clearInterval(interval)
}, [])


  useEffect(() => {
    // Fetch items
    fetch("http://localhost:3000/items")
      .then(res => res.json())
      .then(data => {
        setItems(data.items)
        setServerOffset(data.serverTime - Date.now())
      })

    socket.on("connect", () => {
      setSocketId(socket.id)
    })

    socket.on("UPDATE_BID", (updatedItem) => {
      setItems(prev =>
        prev.map(item =>
          item.id === updatedItem.id ? updatedItem : item
        )
      )
    })

    socket.on("BID_ERROR", (message) => {
      alert(message)
    })

    return () => {
      socket.off("UPDATE_BID")
      socket.off("BID_ERROR")
    }
  }, [])

  const placeBid = (item) => {
    socket.emit("BID_PLACED", {
      itemId: item.id,
      amount: item.currentBid + 10
    })
  }

  const getRemainingTime = (endsAt) => {
    const remaining = endsAt - (Date.now() + serverOffset)
    return remaining > 0 ? Math.floor(remaining / 1000) : 0
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Live Auction</h1>

      <div style={{ display: "grid", gap: 20 }}>
        {items.map(item => {
          const remaining = getRemainingTime(item.endsAt)

          const isWinning = item.highestBidder === socketId

          return (
            <div
              key={item.id}
              style={{
                border: "1px solid #ccc",
                padding: 20,
                borderRadius: 8
              }}
            >
              <h3>{item.title}</h3>
              <p>Current Bid: ${item.currentBid}</p>
              <p>Time Left: {remaining}s</p>

              {isWinning && <p style={{ color: "green" }}>Winning</p>}

              <button onClick={() => placeBid(item)}>
                Bid +$10
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default App
