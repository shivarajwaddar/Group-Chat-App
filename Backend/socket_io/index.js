const { Server } = require("socket.io");
const authMiddleware = require("./middleware.js");
const registerChatHandlers = require("./handlers/chat.js");

const initSocket = (server) => {
  // Your CORS and Server logic lives here!
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Apply the JWT security check
  io.use(authMiddleware);

  io.on("connection", (socket) => {
    console.log("User connected:", socket.user.name);

    // Link the chat events to this connection
    registerChatHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.user.name);
    });
  });
};

module.exports = initSocket;
