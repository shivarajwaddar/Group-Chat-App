// We go up two levels (../../) to find the models from the handlers folder
const Message = require("../../models/chatModel");

module.exports = (io, socket) => {
  socket.on("sendMessage", async (data) => {
    try {
      // 1. Save to Database
      const savedMessage = await Message.create({
        content: data.content,
        dbUserId: socket.user.userId, // Taken from the socket.user we set in middleware
      });

      // 2. Broadcast to everyone (io.emit)
      io.emit("receiveMessage", {
        id: savedMessage.id,
        content: savedMessage.content,
        dbUserId: socket.user.userId,
        createdAt: savedMessage.createdAt,
        db_user: { name: socket.user.name },
      });
    } catch (error) {
      console.error("Error saving message:", error);
      socket.emit("error_message", "Could not save message");
    }
  });
};
