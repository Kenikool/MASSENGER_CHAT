import express from "express";
import { protectedRoute } from "../middleware/auth.middlware.js";
import { uploadImage } from "../controllers/upload.controller.js"; 
import multer from "multer";

const upload = multer({ dest: "uploads/" }); 
const router = express.Router();
import {
  getUserForSidebar,
  getMessages,
  sendMessage,
} from "../controllers/message.controller.js";

router.get("/users", protectedRoute, getUserForSidebar);
router.get("/:id", protectedRoute, getMessages);
router.post("/upload", protectedRoute, upload.single("image"), uploadImage);

router.post("/send/:id", protectedRoute, sendMessage);
export default router;
