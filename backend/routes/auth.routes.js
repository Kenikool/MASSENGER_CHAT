// routes/auth.routes.js
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
  disableTwoFactor,
  verifyAccount,
  requestEmailChange,
  verifyEmailChange,
  markBadgeAsSeen,
  resendVerificationEmail,
  requestMagicLink,
  magicLogin,
  deleteAccount,
  getSessions,
  revokeSession,
} from "../controllers/auth.controller.js";
import { protectedRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signUp);
router.post("/login", login);
router.post("/logout", logout);

// ✅ Add the new email verification routes
router.get("/verify-account", verifyAccount);
router.post("/request-email-change", protectedRoute, requestEmailChange);
router.post("/verify-email-change", verifyEmailChange);

// Existing protected routes
router.put("/update-profile", protectedRoute, updateProfile);
router.put("/change-password", protectedRoute, changePassword);
router.put("/update-details", protectedRoute, updateDetails);

router.get("/check", protectedRoute, checkAuth);

// router.post("/2fa/setup", protectedRoute, setupTwoFactor);
// router.post("/2fa/verify", protectedRoute, verifyTwoFactor);

router.post("/setup-two-factor", protectedRoute, setupTwoFactor);
router.post("/verify-two-factor", protectedRoute, verifyTwoFactor);
router.post("/disable-two-factor", protectedRoute, disableTwoFactor);

// badge
router.put("/mark-badge-seen", protectedRoute, markBadgeAsSeen);

router.post("/resend-verification", resendVerificationEmail);

router.post("/request-magic-link", requestMagicLink);
router.get("/magic-login/:token", magicLogin);
router.delete("/delete-account", protectedRoute, deleteAccount);

router.get("/sessions", protectedRoute, getSessions);
router.delete("/sessions/:sessionId", protectedRoute, revokeSession);

export default router;
