import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { app, server } from "./lib/socket.js";
import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
import userRoutes from "./routes/user.routes.js";
import gamificationRoutes from "./routes/gamification.routes.js";
import reactionRoutes from "./routes/reaction.routes.js";
import groupRoutes from "./routes/group.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import path from "path";
dotenv.config();

const PORT = process.env.PORT || 9000;
const __dirname = path.resolve();
// middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/reactions", reactionRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/ai", aiRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/client/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "dist", "index.html"));
  });
}
// Debug: Log registered routes
console.log("📋 Registered API routes:");
console.log("  • /api/auth - Authentication routes");
console.log("  • /api/messages - Message routes");
console.log("  • /api/users - User routes");
console.log("  • /api/gamification - Gamification routes");
console.log("  • /api/reactions - Reaction routes");
console.log("  • /api/groups - Group routes");
console.log("  • /api/ai - AI routes (including /health)");
console.log("");
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});
