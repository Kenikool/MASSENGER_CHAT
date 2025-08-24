// routes/user.route.js

import express from "express";
import { protectedRoute } from "../middleware/auth.middlware.js";
import { getUserStats } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/stats", protectedRoute, getUserStats);

export default router;
