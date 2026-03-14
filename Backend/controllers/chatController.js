// Import from your associations file to ensure the relationship is active
const { Message, User } = require("../models/associations");

// 1. Fetch all messages with User details
const getMessages = async (req, res) => {
  try {
    const messages = await Message.findAll({
      // We "Include" the User model to get the sender's name automatically
      include: [
        {
          model: User,
          attributes: ["name"], // ONLY get the name, safety first!
        },
      ],
      // We use the default createdAt for ordering
      order: [["createdAt", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 2. Save a new message
const addMessage = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Content required" });

    const newMessage = await Message.create({
      content: content,
      dbUserId: req.user.id,
    });

    // OPTIMIZATION: Fetch the message again WITH the User name
    // This ensures that when you broadcast it, the name is included!
    const messageWithUser = await Message.findOne({
      where: { id: newMessage.id },
      include: [{ model: User, attributes: ["name"] }],
    });

    res.status(201).json({ success: true, data: messageWithUser });
  } catch (err) {
    console.error("Error adding message:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getMessages,
  addMessage,
};
