import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import redisClient, { connectRedis } from "./redis.js";

const app = express();

app.use(cors());
app.use(express.json());

await connectRedis();



async function seedAuctions() {
  const existing = await redisClient.keys("item:*");

  if (existing.length > 0) {
    console.log("Auctions already seeded");
    return;
  }

  const items = [
    {
      id: uuidv4(),
      title: "MacBook Pro M3",
      startingPrice: 1200,
      currentBid: 1200,
      auctionEndTime: Date.now() + 60 * 60 * 1000,
      highestBidder: ""
    },
    {
      id: uuidv4(),
      title: "iPhone 15 Pro",
      startingPrice: 900,
      currentBid: 900,
      auctionEndTime: Date.now() + 60 * 60 * 1000,
      highestBidder: ""
    }
  ];

  for (const item of items) {
    await redisClient.hSet(`item:${item.id}`, item);
  }

  console.log("Auctions seeded in Redis");
}

await seedAuctions();



app.get("/items", async (req, res) => {
  const keys = await redisClient.keys("item:*");
  const items = [];

  for (const key of keys) {
    const item = await redisClient.hGetAll(key);

    items.push({
      ...item,
      startingPrice: Number(item.startingPrice),
      currentBid: Number(item.currentBid),
      auctionEndTime: Number(item.auctionEndTime)
    });
  }

  res.json(items);
});

export default app;
