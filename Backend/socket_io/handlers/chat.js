const { Message } = require("../../models/associations");

module.exports = (io, socket) => {
  // Logic for Group/Global messages
  socket.on("sendMessage", async (data) => {
    try {
      const senderId = socket.user.userId || socket.user.id;

      // 1. SAVE TO DB
      const savedMsg = await Message.create({
        content: data.content,
        dbUserId: senderId,
        groupId: data.groupId || null, // If null, it's Global
        recipientId: null, // Not used for group chats
      });

      // 2. EMIT TO ROOM
      io.to(data.room).emit("receive_message", {
        content: data.content,
        senderId: senderId,
        senderName: socket.user.name,
        room: data.room,
      });
    } catch (err) {
      console.error("Group Chat Error:", err);
    }
  });

  socket.on("join_room", (data) => {
    socket.join(data.room);
  });
};
