import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL,
  
});

redisClient.on("error", (err) => {
  console.error("❌ Redis error:", err);
});

async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log("✅ Connected to Redis");
  }
}

export { connectRedis };
export default redisClient;
