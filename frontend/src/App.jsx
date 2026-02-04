import { useEffect, useState, useCallback } from "react";
import socket from "./socket";

/* ========= Persistent User ID ========= */

const USER_ID =
  localStorage.getItem("auctionUser") ||
  (() => {
    const id = "user_" + Math.floor(Math.random() * 10000);
    localStorage.setItem("auctionUser", id);
    return id;
  })();

function App() {
  /* ========= State ========= */

  const [items, setItems] = useState([]);
  const [displayPrices, setDisplayPrices] = useState({});
  const [timeOffset, setTimeOffset] = useState(0);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [outbidItems, setOutbidItems] = useState({});
  const [flashItems, setFlashItems] = useState({});

  /* ========= Fetch Items ========= */

  useEffect(() => {
    fetch("https://bidding-wars-evvz.onrender.com/items")
      .then(res => res.json())
      .then(data => {
        setItems(data);

        const prices = {};
        data.forEach(i => (prices[i.id] = i.currentBid));
        setDisplayPrices(prices);
      });
  }, []);

  /* ========= Server Time Sync ========= */

  useEffect(() => {
    socket.on("SERVER_TIME", ({ serverTime }) => {
      const offset = serverTime - Date.now();
      setTimeOffset(offset);
    });

    return () => socket.off("SERVER_TIME");
  }, []);

  /* ========= Clock Ticker ========= */

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /* ========= Price Animation ========= */

  const animatePrice = useCallback((id, newPrice) => {
    setDisplayPrices(prev => {
      const start = prev[id] ?? newPrice;
      const duration = 300;
      const startTime = performance.now();

      const step = (currentTime) => {
        const progress = Math.min(
          (currentTime - startTime) / duration,
          1
        );

        const value = Math.floor(
          start + (newPrice - start) * progress
        );

        setDisplayPrices(p => ({ ...p, [id]: value }));

        if (progress < 1) requestAnimationFrame(step);
      };

      requestAnimationFrame(step);
      return prev;
    });
  }, []);

  /* ========= Real-Time Bid Updates ========= */

  useEffect(() => {
    socket.on("UPDATE_BID", (data) => {
      setItems(prev =>
        prev.map(item =>
          item.id === data.itemId
            ? {
                ...item,
                currentBid: data.newBid,
                highestBidder: data.highestBidder
              }
            : item
        )
      );

      animatePrice(data.itemId, data.newBid);

      setFlashItems(prev => ({ ...prev, [data.itemId]: true }));
      setTimeout(() => {
        setFlashItems(prev => ({ ...prev, [data.itemId]: false }));
      }, 600);

      if (data.highestBidder !== USER_ID) {
        setOutbidItems(prev => ({ ...prev, [data.itemId]: true }));
        setTimeout(() => {
          setOutbidItems(prev => ({ ...prev, [data.itemId]: false }));
        }, 500);
      }
    });

    return () => socket.off("UPDATE_BID");
  }, [animatePrice]);

  /* ========= Place Bid ========= */

  const placeBid = (item) => {
    socket.emit("BID_PLACED", {
      itemId: item.id,
      amount: item.currentBid + 10,
      userId: USER_ID
    });
  };

  /* ========= Countdown ========= */

  const getRemainingTime = (endTime) => {
    const now = currentTime + timeOffset;
    const diff = endTime - now;

    if (diff <= 0) return "Auction Ended";

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return {
      text: `${minutes}m ${seconds}s`,
      secondsLeft: diff / 1000
    };
  };

  /* ========= Render ========= */

  return (
    <>
      <div className="noise"></div>
      <div className="bg-blob blob1"></div>
      <div className="bg-blob blob2"></div>
      <div className="bg-blob blob3"></div>

      <nav className="navbar">
        <div className="logo"> Live Auction</div>
        <div className="user">👤 {USER_ID}</div>
      </nav>

      <div className="container">
        <div className="grid">
          {items.map(item => {
            const time = getRemainingTime(item.auctionEndTime);
            const secondsLeft =
              typeof time === "string"
                ? 0
                : time.secondsLeft;

            return (
              <div
                key={item.id}
                className={`card 
                  ${flashItems[item.id] ? "flash" : ""}
                  ${outbidItems[item.id] ? "shake" : ""}
                  ${secondsLeft <= 10 && secondsLeft > 0 ? "pulse" : ""}
                `}
              >
                <h3>{item.title}</h3>

                <div className="price">
                  ${displayPrices[item.id] ?? item.currentBid}
                </div>

                <div className="timer">
                  ⏳ {typeof time === "string" ? time : time.text}
                </div>

                {item.highestBidder === USER_ID && (
                  <div className="winning">
                    🏆 Winning
                  </div>
                )}

                <button
                  onClick={() => placeBid(item)}
                  disabled={typeof time === "string"}
                >
                  Bid +$10
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default App;
