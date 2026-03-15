// socket-io/handlers/personalChat.js
const Message = require("../../models/chatModel"); // Import your Message model

module.exports = (io, socket) => {
  // 1. Join a specific room (e.g., room_user1_user2)
  socket.on("join_room", (data) => {
    socket.join(data.room);
    console.log(`User ${socket.user.name} joined room: ${data.room}`);
  });

  // 2. Handle private messages
  socket.on("new_message", async (data) => {
    try {
      // Save to database
      const savedMsg = await Message.create({
        content: data.message,
        dbUserId: socket.user.userId,
        recipientId: data.recipientId, // Assuming you have this column
      });

      // Emit ONLY to the people in that specific room
      io.to(data.room).emit("receive_personal_message", {
        id: savedMsg.id,
        content: savedMsg.content,
        senderName: socket.user.name,
        room: data.room,
      });
    } catch (err) {
      console.error("Personal chat error:", err);
    }
  });
};
