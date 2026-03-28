const Message = require("../../models/chatModel");
const User = require("../../models/userModel");

module.exports = (io, socket) => {
  // 1. JOIN ROOM: The "Tunnel"
  socket.on("join_room", (data) => {
    socket.join(data.room);
    console.log(`Socket ${socket.id} joined room: ${data.room}`);
  });

  // 2. NEW MESSAGE: The "Data"
  socket.on("new_message", async (data) => {
    try {
      const { room, message } = data;

      // LOGIC CHECK: Split the room string (e.g., "shiva@gmail.com_virat@gmail.com")
      const participants = room.split("_");

      // Find the email that is NOT mine
      const recipientEmail = participants.find(
        (email) => email.toLowerCase() !== socket.user.email.toLowerCase(),
      );

      console.log("Looking for recipient with email:", recipientEmail);

      const recipient = await User.findOne({
        where: { email: recipientEmail },
      });

      if (recipient) {
        console.log("Recipient found! ID:", recipient.id);

        const savedMsg = await Message.create({
          content: message,
          dbUserId: socket.user.userId, // The Sender (from auth middleware)
          recipientId: recipient.id, // The Receiver (MUST NOT BE NULL)
        });

        // BROADCAST: Send to the private room tunnel
        io.to(room).emit("receive_personal_message", {
          room: room,
          message: message,
          senderName: socket.user.name,
          senderEmail: socket.user.email,
          createdAt: savedMsg.createdAt,
        });
      } else {
        // IF YOU SEE THIS IN YOUR TERMINAL: Your room names don't match your user emails!
        console.error(
          "CRITICAL: Recipient not found in DB for email:",
          recipientEmail,
        );
      }
    } catch (err) {
      console.error("Private Chat Error:", err);
    }
  });
};
