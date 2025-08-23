import express from "express";
import {
  signUp,
  login,
  logout,
  updateProfile,
  checkAuth,
} from "../controllers/auth.controller.js";

import { protectedRoute } from "../middleware/auth.middlware.js";
const router = express.Router();

router.post("/signup", signUp);
router.post("/login", login);
router.post("/logout", logout);
router.put("/update-profile", protectedRoute, updateProfile);
router.get("/check", protectedRoute, checkAuth);

export default router;
