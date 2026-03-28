// controllers/chatController.js

// Import from your associations file to ensure the relationship is active
const { Message, User } = require("../models/associations");
const { Op } = require("sequelize");

// --- 1. GET GLOBAL HISTORY ---
// Only fetches messages where recipientId is NULL (The Public Group)
const getMessages = async (req, res) => {
  try {
    const messages = await Message.findAll({
      where: {
        recipientId: null,
      },
      include: [
        {
          model: User,
          attributes: ["name"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (err) {
    console.error("Error fetching global messages:", err);
    res.status(500).json({ error: "Global fetch failed" });
  }
};

// --- 2. SAVE NEW GLOBAL MESSAGE ---
// Used when sending a message via HTTP instead of Socket
const addMessage = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Content required" });

    const newMessage = await Message.create({
      content: content,
      dbUserId: req.user.id,
      recipientId: null, // Explicitly marked as Global
    });

    // Fetch again to include the User Name for the UI
    const messageWithUser = await Message.findOne({
      where: { id: newMessage.id },
      include: [{ model: User, attributes: ["name"] }],
    });

    res.status(201).json({
      success: true,
      data: messageWithUser,
    });
  } catch (err) {
    console.error("Error adding message:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// --- 3. GET PRIVATE HISTORY ---
// Fetches only messages between YOU and a SPECIFIC user
const getPrivateMessages = async (req, res) => {
  try {
    // Safety: Convert IDs to Numbers to ensure SQL matches correctly
    const recipientId = Number(req.params.recipientId);
    const myId = Number(req.user.id);

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { dbUserId: myId, recipientId: recipientId }, // I sent to them
          { dbUserId: recipientId, recipientId: myId }, // They sent to me
        ],
      },
      include: [
        {
          model: User,
          attributes: ["name"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (err) {
    console.error("Error fetching private history:", err);
    res.status(500).json({ error: "Private fetch failed" });
  }
};

module.exports = {
  getMessages,
  addMessage,
  getPrivateMessages,
};
