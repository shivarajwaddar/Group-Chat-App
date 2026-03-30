const express = require("express");
const router = express.Router();
const groupController = require("../controllers/groupController");
const authenticate = require("../middleware/auth");

// Correct: The path is relative to the prefix in app.js
router.get("/user-groups", authenticate, groupController.getUserGroups);
router.post("/create", authenticate, groupController.createGroup);
console.log("Group routes initialized");

module.exports = router;
