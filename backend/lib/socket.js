import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
  },
});

// function to get receiver socket id
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// // used to store online users
const userSocketMap = {}; // {userId: socketId}

// // listening to events connect

// connecting to the socket
io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  // if user is logged in
  const userId = socket.handshake.query.userId;
  // if user is logged in then add to the userSocketMap
  if (userId) userSocketMap[userId] = socket.id;

  // this broadcast is used to send events to all the connected clients
  // io.emit() is used to send events to all the connected clients
  // getonlineUsers(); is the event name
  io.emit("getOnlineUsers", Object.keys(userSocketMap));
  // disconnecting from the socket
  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    // when a user is disconnected then remove from the userSocketMap
    delete userSocketMap[userId];
    // emit the getOnlineUsers event to all the connected clients to know which users are online or this guy is offline
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
