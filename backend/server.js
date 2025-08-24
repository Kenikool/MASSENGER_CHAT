import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoute from "./routes/auth.route.js";
import cookieParser from "cookie-parser";
import messageRoute from "./routes/message.route.js";
import cors from "cors";
import { app, server } from "./lib/socket.js";
import userRoute from "./routes/user.route.js";
dotenv.config();

const PORT = process.env.PORT || 9000;

// middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

app.use("/api/auth", authRoute);
app.use("/api/messages", messageRoute);
app.use("/api/users", userRoute);
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});
