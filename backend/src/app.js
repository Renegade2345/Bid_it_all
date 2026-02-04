import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import redisClient, { connectRedis } from "./redis.js";



const app = express();

app.use(cors());
app.use(express.json());
await connectRedis();



const items = [
  {
    id: uuidv4(),
    title: "MacBook Pro M3",
    startingPrice: 1200,
    currentBid: 1200,
    auctionEndTime: Date.now() + 5 * 60 * 1000 // 5 minutes
  },
  {
    id: uuidv4(),
    title: "iPhone 15 Pro",
    startingPrice: 900,
    currentBid: 900,
    auctionEndTime: Date.now() + 8 * 60 * 1000
  }
];


app.get("/items", (req, res) => {
  res.json(items);
});

export default app;
