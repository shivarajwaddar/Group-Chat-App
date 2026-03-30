const express = require("express");
const {
  addMessage,
  getMessages,
  getPrivateMessages,
  getGroupMessages, // <--- 1. Import this new function
} = require("../controllers/chatController");
const authenticateMiddleware = require("../middleware/auth");

const router = express.Router();

router.post("/send", authenticateMiddleware, addMessage);
router.get("/get-messages", authenticateMiddleware, getMessages);

// 2. Add the missing Group Message route
router.get(
  "/get-group-messages/:groupId", // Matches your frontend call exactly
  authenticateMiddleware,
  getGroupMessages,
);

router.get(
  "/get-private-messages/:recipientId",
  authenticateMiddleware,
  getPrivateMessages,
);

module.exports = router;
