const express = require("express");
const multer = require("multer"); // 1. Import Multer
const {
  addMessage,
  getMessages,
  getPrivateMessages,
  getGroupMessages,
} = require("../controllers/chatController");
const authenticateMiddleware = require("../middleware/auth");

const router = express.Router();

// 2. Configure Multer (Memory storage is best for immediate S3 upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // Optional: 5MB limit
});

// 3. Update the "/send" route to accept a single file named 'file'
// This matches the 'formData.append("file", ...)' in your main.js
router.post(
  "/send",
  authenticateMiddleware,
  upload.single("file"), // <--- THIS is the missing link
  addMessage,
);

router.get("/get-messages", authenticateMiddleware, getMessages);

router.get(
  "/get-group-messages/:groupId",
  authenticateMiddleware,
  getGroupMessages,
);

router.get(
  "/get-private-messages/:recipientId",
  authenticateMiddleware,
  getPrivateMessages,
);

module.exports = router;
