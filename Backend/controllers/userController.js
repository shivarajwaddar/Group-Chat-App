const user = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");

// --- SIGN IN ---
const signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const foundUser = await user.findOne({ where: { email: email } });

    if (!foundUser) return res.status(404).json({ message: "User not found" });

    const isPasswordValid = await bcrypt.compare(password, foundUser.password);
    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign(
      {
        userId: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }, // Changed from "24h" to "5m"
    );

    res.status(200).json({
      message: "Login successful",
      token: token,
      userId: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// --- SIGN UP ---
const signup = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const isUserPresent = await user.findOne({ where: { email } });

    if (isUserPresent)
      return res.status(400).json({ message: "User Already Exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await user.create({
      name,
      email,
      password: hashedPassword,
      phone,
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// --- GET ALL USERS (The function causing the crash) ---
const getAllUsers = async (req, res) => {
  try {
    const users = await user.findAll({
      where: {
        id: { [Op.ne]: req.user.id }, // Exclude self
      },
      attributes: ["id", "name", "email"],
    });
    res.status(200).json({ success: true, users: users });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// CRITICAL: All three must be exported here
module.exports = {
  signin,
  signup,
  getAllUsers,
};
