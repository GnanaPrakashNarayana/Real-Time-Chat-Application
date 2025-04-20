// backend/src/routes/bookmark.route.js
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { 
  addBookmark, 
  removeBookmark,
  getBookmarks,
  renameBookmark
} from "../controllers/bookmark.controller.js";

const router = express.Router();

router.post("/", protectRoute, addBookmark);
router.delete("/:bookmarkId", protectRoute, removeBookmark);
router.get("/", protectRoute, getBookmarks);
router.put("/:bookmarkId", protectRoute, renameBookmark);

export default router;