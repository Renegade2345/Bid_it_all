-- KEYS[1] = item key
-- ARGV[1] = bid amount
-- ARGV[2] = userId
-- ARGV[3] = current server timestamp (ms)

local currentBid = redis.call("HGET", KEYS[1], "currentBid")
local auctionEnd = redis.call("HGET", KEYS[1], "auctionEnd")

-- If item doesn't exist
if not currentBid or not auctionEnd then
  return -2
end

currentBid = tonumber(currentBid)
auctionEnd = tonumber(auctionEnd)

-- Auction ended
if tonumber(ARGV[3]) > auctionEnd then
  return -1
end

-- Bid too low
if tonumber(ARGV[1]) <= currentBid then
  return 0
end

-- Accept bid
redis.call("HSET", KEYS[1], "currentBid", ARGV[1])
redis.call("HSET", KEYS[1], "highestBidder", ARGV[2])

return 1
