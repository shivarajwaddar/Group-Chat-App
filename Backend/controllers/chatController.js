const { Message, User } = require("../models/associations");
const { Op } = require("sequelize");
const S3Service = require("../services/S3services"); // Your S3 logic

// --- 1. GET GLOBAL HISTORY ---
const getMessages = async (req, res) => {
  try {
    const messages = await Message.findAll({
      where: {
        recipientId: null,
        groupId: null,
      },
      include: [{ model: User, attributes: ["name"] }],
      order: [["createdAt", "ASC"]],
    });
    res.status(200).json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ error: "Global fetch failed" });
  }
};

// --- 2. SAVE NEW MESSAGE (Enhanced for S3 & Multi-type) ---
const addMessage = async (req, res) => {
  try {
    const { content, groupId, recipientId } = req.body;
    const file = req.file; // From multer middleware
    const userId = req.user.userId || req.user.id;

    let finalContent = content;

    // Logic: If a file exists, upload to S3 and overwrite finalContent with the URL
    if (file) {
      const filename = `ChatApp/User_${userId}/${Date.now()}_${file.originalname}`;
      finalContent = await S3Service.uploadToS3(file.buffer, filename);
    }

    // Create the message in DB
    const newMessage = await Message.create({
      content: finalContent,
      dbUserId: userId,
      recipientId: recipientId || null, // Dynamic: works for private
      groupId: groupId || null, // Dynamic: works for groups
    });

    // Fetch the message with User name to send back to UI/Socket
    const messageWithUser = await Message.findOne({
      where: { id: newMessage.id },
      include: [{ model: User, attributes: ["name"] }],
    });

    res.status(201).json({ success: true, data: messageWithUser });
  } catch (err) {
    console.error("ADD MESSAGE ERROR:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// --- 3. GET PRIVATE HISTORY ---
const getPrivateMessages = async (req, res) => {
  try {
    const recipientId = Number(req.params.recipientId);
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

// --- 4. GET GROUP HISTORY ---
const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;

    const messages = await Message.findAll({
      where: { groupId: groupId },
      include: [{ model: User, attributes: ["name"] }],
      order: [["createdAt", "ASC"]],
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
  getGroupMessages,
};
