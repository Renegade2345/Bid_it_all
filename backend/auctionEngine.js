const items = new Map()

function initItems() {
  if (items.size > 0) return

  const now = Date.now()


  const sample = [
    {
      id: "1",
      title: "MacBook Pro",
      startingPrice: 1000,
      currentBid: 1000,
      highestBidder: null,
      endsAt: now + 60 * 60 * 1000,
      isActive: true
    },
    {
      id: "2",
      title: "PlayStation 5",
      startingPrice: 500,
      currentBid: 500,
      highestBidder: null,
      endsAt: now + 60 * 60 * 1000,
      isActive: true
    }
  ]

  sample.forEach(item => items.set(item.id, item))
}


function getItems() {
  return Array.from(items.values())
}

function placeBid(itemId, amount, bidderId) {
  const item = items.get(itemId)

  if (!item || !item.isActive) {
    return { success: false, message: "Auction ended" }
  }

  const now = Date.now()

  if (now > item.endsAt) {
    item.isActive = false
    return { success: false, message: "Auction ended" }
  }

  if (amount <= item.currentBid) {
    return { success: false, message: "Outbid" }
  }

  item.currentBid = amount
  item.highestBidder = bidderId

  return { success: true, item }
}

module.exports = {
  initItems,
  getItems,
  placeBid
}
