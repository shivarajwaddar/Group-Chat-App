const Message = require("../../models/chatModel");

module.exports = (io, socket) => {
  // Listen for the public "sendMessage" event
  socket.on("sendMessage", async (data) => {
    try {
      // 1. Save to Database with recipientId as NULL (Global)
      const savedMessage = await Message.create({
        content: data.content,
        dbUserId: socket.user.userId,
        recipientId: null, // Explicitly null for group chat
      });

      // 2. Broadcast to EVERYONE connected
      io.emit("receiveMessage", {
        id: savedMessage.id,
        content: savedMessage.content,
        dbUserId: socket.user.userId,
        createdAt: savedMessage.createdAt,
        db_user: { name: socket.user.name }, // Pass name for the UI
      });
    } catch (error) {
      console.error("Global Chat Error:", error);
      socket.emit("error_message", "Could not send global message");
    }
  });
};
