const express = require("express");
const { addMessage } = require("../controllers/chatController");
const authenticateMiddleware = require("../middleware/auth");

const router = express.Router();

// Placeholder for message routes
router.post("/send", authenticateMiddleware, addMessage);

module.exports = router;
