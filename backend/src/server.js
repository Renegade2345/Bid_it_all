// Import the Express app
import app from "./app.js";

// Import atomic bid processor
import { processBid } from "./services/bidService.js";

// Import Node HTTP
import http from "http";

// Import Socket.io
import { Server } from "socket.io";

// Port config
const PORT = process.env.PORT || 4000;

// Create raw HTTP server
const httpServer = http.createServer(app);

// Attach Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

/**
 * Socket Connection Handler
 */
io.on("connection", (socket) => {
  console.log(" Client connected:", socket.id);
    // Send current server time immediately on connect
  socket.emit("SERVER_TIME", {
    serverTime: Date.now()
  });


  /**
   * BID_PLACED Event
   * payload: { itemId, amount, userId }
   */
  socket.on("BID_PLACED", async (payload) => {
    try {
      const result = await processBid(payload);

      // If bid rejected
      if (!result.ok) {
        socket.emit("BID_REJECTED", {
          reason: result.reason
        });
        return;
      }

      // If bid accepted → broadcast to ALL clients
      io.emit("UPDATE_BID", result.data);

    } catch (err) {
      console.error("Bid processing error:", err);

      socket.emit("BID_REJECTED", {
        reason: "SERVER_ERROR"
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(" Client disconnected:", socket.id);
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server + Socket.io running on http://localhost:${PORT}`);
});
