import React, { useEffect, useState, createContext } from "react";
import { io } from "socket.io-client";
import { useAuthStore } from "../store/useAuthStore";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { authUser } = useAuthStore();

  useEffect(() => {
    if (authUser) {
      // Connect to your backend socket server with user ID
      const newSocket = io("http://localhost:9000", {
        withCredentials: true,
        query: {
          userId: authUser._id,
        },
      });

      // Socket event listeners
      newSocket.on("connect", () => {
        console.log("✅ Socket connected:", newSocket.id);
        console.log("🔗 User ID:", authUser._id);
      });

      newSocket.on("getOnlineUsers", (users) => {
        console.log("👥 Online users updated:", users);
        setOnlineUsers(users);
      });

      newSocket.on("disconnect", (reason) => {
        console.log("❌ Socket disconnected:", reason);
      });

      newSocket.on("connect_error", (error) => {
        console.error("🚨 Socket connection error:", error);
      });
      
      newSocket.on("reconnect", (attemptNumber) => {
        console.log("🔄 Socket reconnected after", attemptNumber, "attempts");
      });
      
      newSocket.on("reconnect_error", (error) => {
        console.error("🔄❌ Socket reconnection error:", error);
      });

      setSocket(newSocket);

      return () => {
        console.log('Cleaning up socket connection');
        newSocket.disconnect();
      };
    } else {
      // Disconnect socket if no user is authenticated
      if (socket) {
        console.log('Disconnecting socket - no authenticated user');
        socket.disconnect();
        setSocket(null);
        setOnlineUsers([]);
      }
    }
  }, [authUser?._id]); // Only depend on user ID to avoid unnecessary reconnections

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
