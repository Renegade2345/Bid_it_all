import fs from "fs";
import path from "path";
import redisClient from "../redis.js";

// Load Lua script once when server starts
const luaScript = fs.readFileSync(
  path.resolve("src/bid.lua"),
  "utf8"
);

export async function processBid({ itemId, amount, userId }) {
  const key = `item:${itemId}`;
  const now = Date.now();

  try {
    const result = await redisClient.eval(luaScript, {
  keys: [key],
  arguments: [
    String(amount),
    String(userId),
    String(now)
  ]
});


    // Auction ended
    if (result === -1) {
      return { ok: false, reason: "AUCTION_ENDED" };
    }



    if (result === -2) {
  return { ok: false, reason: "ITEM_NOT_FOUND" };
}

    // Bid too low
    if (result === 0) {
      return { ok: false, reason: "OUTBID" };
    }

    // Fetch updated item
    const updated = await redisClient.hGetAll(key);

    return {
      ok: true,
      data: {
        itemId,
        newBid: Number(updated.currentBid),
        highestBidder: updated.highestBidder,
        serverTime: now
      }
    };

  } catch (err) {
    console.error("Redis bid error:", err);
    return { ok: false, reason: "SERVER_ERROR" };
  }
}
