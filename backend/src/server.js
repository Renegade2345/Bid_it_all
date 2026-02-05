import app from "./app.js";
import { processBid } from "./services/bidService.js";
import http from "http";
import { Server } from "socket.io";

const PORT = process.env.PORT || 4000;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  socket.emit("SERVER_TIME", {
    serverTime: Date.now()
  });

  socket.on("BID_PLACED", async (payload) => {
    console.log("🔥 BID_PLACED RECEIVED:", payload);

    try {
      const result = await processBid(payload);
      console.log("🧠 PROCESS RESULT:", result);

      if (!result.ok) {
        socket.emit("BID_REJECTED", {
          reason: result.reason
        });
        return;
      }

      console.log("📡 Broadcasting UPDATE_BID:", result.data);

      io.emit("UPDATE_BID", result.data);

    } catch (err) {
      console.error("❌ Bid processing error:", err);

      socket.emit("BID_REJECTED", {
        reason: "SERVER_ERROR"
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
