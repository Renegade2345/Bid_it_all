import { useEffect, useState } from "react"
import { io } from "socket.io-client"

const socket = io()

function App() {
  const [items, setItems] = useState([])
  const [serverOffset, setServerOffset] = useState(0)
  const [socketId, setSocketId] = useState(null)

  const [recentlyUpdated, setRecentlyUpdated] = useState(null)
  const [outbidItems, setOutbidItems] = useState(new Set())

  // Countdown re-render every second
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
        data.items.forEach(item => {
  socket.emit("JOIN_ITEM", item.id)
})

        setServerOffset(data.serverTime - Date.now())
      })

    socket.on("connect", () => {
      setSocketId(socket.id)
    })

    socket.on("AUCTION_ENDED", (item) => {
      setItems(prev =>
        prev.map(i =>
          i.id === item.id ? item : i
        )
      )
    })

    socket.on("UPDATE_BID", (updatedItem) => {
      setItems(prev =>
        prev.map(item =>
          item.id === updatedItem.id ? updatedItem : item
        )
      )

      // Flash animation
      setRecentlyUpdated(updatedItem.id)
      setTimeout(() => {
        setRecentlyUpdated(null)
      }, 1000)

      // Outbid / Winning logic
      if (updatedItem.highestBidder !== socket.id) {
        setOutbidItems(prev => new Set(prev).add(updatedItem.id))
      } else {
        setOutbidItems(prev => {
          const copy = new Set(prev)
          copy.delete(updatedItem.id)
          return copy
        })
      }
    })

    return () => {
      socket.off("UPDATE_BID")
      socket.off("AUCTION_ENDED")
    }
  }, [])

  const placeBid = (item) => {
    if (!item.isActive) return

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
                border: "1px solid #ddd",
                padding: 20,
                borderRadius: 10,
                backgroundColor:
                  recentlyUpdated === item.id ? "#d1fae5" : "#ffffff",
                transition: "background-color 0.4s ease",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                color: "#111"


              }}
            >
              <h3>{item.title}</h3>
              <p>Current Bid: ${item.currentBid}</p>
              <p>Time Left: {remaining}s</p>

              {remaining === 0 && (
                <p style={{ color: "gray", fontWeight: "bold" }}>
                  Auction Ended
                </p>
              )}

              {isWinning && remaining > 0 && (
                <p style={{ color: "green", fontWeight: "bold" }}>
                  Winning
                </p>
              )}

              {outbidItems.has(item.id) && remaining > 0 && (
                <p style={{ color: "red", fontWeight: "bold" }}>
                  Outbid
                </p>
              )}

              <button
                disabled={remaining === 0 || !item.isActive}
                onClick={() => placeBid(item)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  border: "none",
                  backgroundColor:
                    remaining === 0 ? "#ccc" : "#2563eb",
                  color: "white",
                  cursor:
                    remaining === 0 ? "not-allowed" : "pointer"
                }}
              >
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
