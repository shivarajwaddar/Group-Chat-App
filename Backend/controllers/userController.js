const user = require("../models/userModel"); // Keeping it as you requested
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // FIX: Change the variable name on the left to 'foundUser'
    // If you name it 'user', it conflicts with your import above.
    const foundUser = await user.findOne({ where: { email: email } });

    if (!foundUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, foundUser.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { userId: foundUser.id, name: foundUser.name },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.status(200).json({
      message: "Login successful",
      token: token,
      userId: foundUser.id,
      name: foundUser.name,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const signup = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // FIX: Use 'isUserPresent' or 'found' instead of 'user'
    const isUserPresent = await user.findOne({ where: { email } });

    if (isUserPresent) {
      return res
        .status(400)
        .json({ message: "User Already Exists, Please Signin" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = user.build({
      name,
      email,
      password: hashedPassword,
      phone,
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error during sign-up:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { signin, signup };
