module.exports = (io, socket) => {
  socket.on("sendMessage", (data) => {
    try {
      // 1. DO NOT CALL Message.create() HERE.
      // It is already saved by your Controller via the API.

      // 2. Broadcast to everyone ELSE in the room
      socket.to(data.room).emit("receive_message", {
        ...data,
        senderId: socket.user.id || socket.user.userId,
        senderName: socket.user.name,
      });

      console.log(
        `Group msg from ${socket.user.name} sent to room ${data.room}`,
      );
    } catch (err) {
      console.error("Group Chat Socket Error:", err);
    }
  });

  socket.on("join_room", (data) => {
    socket.join(data.room);
    console.log(`${socket.user.name} joined room: ${data.room}`);
  });
};
