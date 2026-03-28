const express = require("express");
const router = express.Router();

// 1. Import the controller
const userController = require("../controllers/userController");

// 2. Import the middleware (Since you used module.exports = authenticate, this IS the function)
const authenticate = require("../middleware/auth");

// --- Public Routes ---
router.post("/signup", userController.signup);
router.post("/signin", userController.signin);

// --- Private Routes ---
// Use 'authenticate' directly here instead of 'authenticate.authenticate'
router.get("/all-users", authenticate, userController.getAllUsers);

module.exports = router;
