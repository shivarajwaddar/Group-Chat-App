const { Message } = require("../../models/associations");

module.exports = (io, socket) => {
  // Logic for Private messages
  socket.on("sendPersonalMessage", async (data) => {
    try {
      const senderId = socket.user.userId || socket.user.id;

      // 1. SAVE TO DB
      const savedMsg = await Message.create({
        content: data.content,
        dbUserId: senderId,
        recipientId: data.recipientId, // CRITICAL: This was NULL before
        groupId: null,
      });

      // 2. EMIT TO PRIVATE ROOM
      io.to(data.room).emit("receive_message", {
        content: data.content,
        senderId: senderId,
        senderName: socket.user.name,
        room: data.room,
      });
    } catch (err) {
      console.error("Personal Chat Error:", err);
    }
  });
};
