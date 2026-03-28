const express = require("express");
const {
  addMessage,
  getMessages,
  getPrivateMessages,
} = require("../controllers/chatController");
const authenticateMiddleware = require("../middleware/auth");

const router = express.Router();

// 1. Send Message (Used for Global/HTTP Fallback)
router.post("/send", authenticateMiddleware, addMessage);

// 2. Get GLOBAL Messages (recipientId is NULL in the DB)
router.get("/get-messages", authenticateMiddleware, getMessages);

// 3. Get PRIVATE Messages (recipientId is the specific User ID)
// FIX: Changed the path to match the frontend call exactly
router.get(
  "/get-private-messages/:recipientId",
  authenticateMiddleware,
  getPrivateMessages,
);

module.exports = router;
