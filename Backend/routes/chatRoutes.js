const express = require("express");
const { addMessage, getMessages } = require("../controllers/chatController");
const authenticateMiddleware = require("../middleware/auth");

const router = express.Router();

// Placeholder for message routes
router.post("/send", authenticateMiddleware, addMessage);
// Add this to your chatRoutes.js
router.get("/get-messages", authenticateMiddleware, getMessages);

module.exports = router;
