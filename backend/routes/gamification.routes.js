import express from "express";
import {
  getLeaderboard,
  getUserAchievements,
  getBadgeProgress,
} from "../controllers/gamification.controller.js";
import { protectedRoute } from "../middleware/auth.middlware.js";

const router = express.Router();

router.get("/achievements", protectedRoute, getUserAchievements);
router.get("/progress", protectedRoute, getBadgeProgress);
router.get("/leaderboard", getLeaderboard); // Leaderboard can be public

export default router;
