// routes/user.route.js

import express from "express";
import { protectedRoute } from "../middleware/auth.middleware.js";
import {
  getUserStats,
  getPublicProfile,
  getPublicStats,
  updateStatus,
  updateProfileCustomization,
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/stats", protectedRoute, getUserStats);
router.get("/profile/:userId", getPublicProfile);
router.get("/public-stats/:userId", getPublicStats);
router.post("/status", protectedRoute, updateStatus);
router.put(
  "/profile-customization",
  protectedRoute,
  updateProfileCustomization
);

export default router;
