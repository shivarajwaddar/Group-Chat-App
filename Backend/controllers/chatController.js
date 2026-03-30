const { Message, User } = require("../models/associations");
const { Op } = require("sequelize");

// --- 1. GET GLOBAL HISTORY ---
const getMessages = async (req, res) => {
  try {
    const messages = await Message.findAll({
      where: {
        recipientId: null,
        groupId: null, // Ensure we don't fetch group chat messages here
      },
      include: [{ model: User, attributes: ["name"] }],
      order: [["createdAt", "ASC"]],
    });
    res.status(200).json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ error: "Global fetch failed" });
  }
};

// --- 2. SAVE NEW GLOBAL MESSAGE (HTTP Fallback) ---
const addMessage = async (req, res) => {
  try {
    const { content } = req.body;
    // FIX: Changed req.user.id to req.user.userId
    const userId = req.user.userId || req.user.id;

    const newMessage = await Message.create({
      content: content,
      dbUserId: userId,
      recipientId: null,
      groupId: null,
    });

    const messageWithUser = await Message.findOne({
      where: { id: newMessage.id },
      include: [{ model: User, attributes: ["name"] }],
    });

    res.status(201).json({ success: true, data: messageWithUser });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// --- 3. GET PRIVATE HISTORY ---
const getPrivateMessages = async (req, res) => {
  try {
    const recipientId = Number(req.params.recipientId);
    // FIX: Changed req.user.id to req.user.userId
    const myId = Number(req.user.userId || req.user.id);

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { dbUserId: myId, recipientId: recipientId },
          { dbUserId: recipientId, recipientId: myId },
        ],
      },
      include: [{ model: User, attributes: ["name"] }],
      order: [["createdAt", "ASC"]],
    });

    res.status(200).json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ error: "Private fetch failed" });
  }
};

// --- NEW: 4. GET GROUP HISTORY ---
const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;

    const messages = await Message.findAll({
      where: { groupId: groupId },
      include: [
        {
          model: User,
          attributes: ["name"], // This allows the UI to show who sent the message
        },
      ],
      order: [["createdAt", "ASC"]], // Keep messages in chronological order
    });

    res.status(200).json({ success: true, data: messages });
  } catch (err) {
    console.error("GET GROUP MESSAGES ERROR:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

module.exports = {
  getMessages,
  addMessage,
  getPrivateMessages,
  getGroupMessages, // Export this for your Group Chat history!
};
