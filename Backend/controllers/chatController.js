// Add ArchivedChat to your imports
const { Message, User, ArchivedChat } = require("../models/associations");
const { Op } = require("sequelize");
const S3Service = require("../services/S3services");

// --- 1. GET GLOBAL HISTORY (Updated) ---
const getMessages = async (req, res) => {
  try {
    const whereClause = { recipientId: null, groupId: null };

    // Fetch from both tables
    const [liveMsgs, archivedMsgs] = await Promise.all([
      Message.findAll({
        where: whereClause,
        include: [{ model: User, attributes: ["name"] }],
      }),
      ArchivedChat.findAll({
        where: whereClause,
        include: [{ model: User, attributes: ["name"] }],
      }),
    ]);

    // Combine and sort by createdAt
    const allMessages = [...archivedMsgs, ...liveMsgs].sort(
      (a, b) => a.createdAt - b.createdAt,
    );

    res.status(200).json({ success: true, data: allMessages });
  } catch (err) {
    res.status(500).json({ error: "Global fetch failed" });
  }
};

// --- 2. SAVE NEW MESSAGE (Remains the same - only saves to 'Message' table) ---
const addMessage = async (req, res) => {
  try {
    const { content, groupId, recipientId } = req.body;
    const file = req.file;
    const userId = req.user.userId || req.user.id;

    let finalContent = content;
    if (file) {
      const filename = `ChatApp/User_${userId}/${Date.now()}_${file.originalname}`;
      finalContent = await S3Service.uploadToS3(file.buffer, filename);
    }

    const newMessage = await Message.create({
      content: finalContent,
      dbUserId: userId,
      recipientId: recipientId || null,
      groupId: groupId || null,
    });

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

// --- 3. GET PRIVATE HISTORY (Updated) ---
const getPrivateMessages = async (req, res) => {
  try {
    const recipientId = Number(req.params.recipientId);
    const myId = Number(req.user.userId || req.user.id);

    const whereClause = {
      [Op.or]: [
        { dbUserId: myId, recipientId: recipientId },
        { dbUserId: recipientId, recipientId: myId },
      ],
    };

    const [liveMsgs, archivedMsgs] = await Promise.all([
      Message.findAll({
        where: whereClause,
        include: [{ model: User, attributes: ["name"] }],
      }),
      ArchivedChat.findAll({
        where: whereClause,
        include: [{ model: User, attributes: ["name"] }],
      }),
    ]);

    const allMessages = [...archivedMsgs, ...liveMsgs].sort(
      (a, b) => a.createdAt - b.createdAt,
    );

    res.status(200).json({ success: true, data: allMessages });
  } catch (err) {
    res.status(500).json({ error: "Private fetch failed" });
  }
};

// --- 4. GET GROUP HISTORY (Updated) ---
const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const whereClause = { groupId: groupId };

    const [liveMsgs, archivedMsgs] = await Promise.all([
      Message.findAll({
        where: whereClause,
        include: [{ model: User, attributes: ["name"] }],
      }),
      ArchivedChat.findAll({
        where: whereClause,
        include: [{ model: User, attributes: ["name"] }],
      }),
    ]);

    const allMessages = [...archivedMsgs, ...liveMsgs].sort(
      (a, b) => a.createdAt - b.createdAt,
    );

    res.status(200).json({ success: true, data: allMessages });
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
