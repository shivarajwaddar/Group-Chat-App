const Message = require("../models/chatModel");

const addMessage = async (req, res) => {
  try {
    const { content } = req.body; // No timestamp here

    if (!content) {
      return res.status(400).json({ error: "Message content is required" });
    }

    const newMessage = await Message.create({
      content,
      dbUserId: req.user.id,
      // If your model has defaultValue: DataTypes.NOW, you can even remove this line:
      timeStamp: new Date(),
    });

    res.status(201).json({
      success: true,
      data: newMessage,
    });
  } catch (err) {
    console.error("Error adding message:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  addMessage,
};
