import express from "express";
import {
  signUp,
  login,
  logout,
  updateProfile,
  checkAuth,
  updateDetails,
  changePassword,
  setupTwoFactor,
  verifyTwoFactor,
} from "../controllers/auth.controller.js";

import { protectedRoute } from "../middleware/auth.middlware.js";
const router = express.Router();

router.post("/signup", signUp);
router.post("/login", login);
router.post("/logout", logout);
router.put("/update-profile", protectedRoute, updateProfile);
router.put("/change-password", protectedRoute, changePassword);
router.put("/update-details", protectedRoute, updateDetails);
router.get("/check", protectedRoute, checkAuth);

// New 2FA routes
router.post("/2fa/setup", protectedRoute, setupTwoFactor);
router.post("/2fa/verify", protectedRoute, verifyTwoFactor);

export default router;
