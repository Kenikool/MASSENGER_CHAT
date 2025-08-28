import express from "express";
import { protectedRoute } from "../middleware/auth.middleware.js";
import {
  createGroup,
  getUserGroups,
  getGroupDetails,
  updateGroup,
  addMembers,
  removeMember,
  updateMemberRole,
  leaveGroup,
  generateInviteLink,
  joinGroupViaInvite,
  deleteGroup,
} from "../controllers/group.controller.js";

const router = express.Router();

// Test endpoint for group functionality
router.get("/test", protectedRoute, (req, res) => {
  res.json({
    message: "Group routes are working",
    user: req.user._id.toString(),
    timestamp: new Date().toISOString()
  });
});

// Group CRUD operations
router.post("/create", protectedRoute, createGroup);
router.get("/", protectedRoute, getUserGroups);
router.get("/:groupId", protectedRoute, getGroupDetails);
router.put("/:groupId", protectedRoute, updateGroup);
router.delete("/:groupId", protectedRoute, deleteGroup);

// Member management
router.post("/:groupId/members", protectedRoute, addMembers);
router.delete("/:groupId/members/:memberId", protectedRoute, removeMember);
router.put("/:groupId/members/:memberId/role", protectedRoute, updateMemberRole);
router.post("/:groupId/leave", protectedRoute, leaveGroup);

// Invite system
router.post("/:groupId/invite", protectedRoute, generateInviteLink);
router.post("/join/:inviteCode", protectedRoute, joinGroupViaInvite);

export default router;