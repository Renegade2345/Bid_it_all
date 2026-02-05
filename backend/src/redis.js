import { io } from "socket.io-client";

const socket = io("https://bidding-wars-evvz.onrender.com", {
  transports: ["websocket"]
});

export default socket;
