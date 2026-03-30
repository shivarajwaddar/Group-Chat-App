// backend/handlers/personalChat.js
module.exports = (io, socket) => {
  socket.on("sendPersonalMessage", (data) => {
    try {
      const senderId = socket.user.id || socket.user.userId;
      const recipientId = data.recipientId;

      if (!recipientId) return console.error("No recipientId provided");

      // Send the message to the recipient's private room
      socket.to(`user_${recipientId}`).emit("receive_message", {
        ...data,
        senderId: senderId,
        senderName: socket.user.name,
        // We tell the receiver's UI: "This belongs to the chat with ME"
        room: `personal_${senderId}`,
      });

      console.log(`Msg from ${senderId} sent to user_${recipientId}`);
    } catch (err) {
      console.error("Personal Chat Socket Error:", err);
    }
  });
};
