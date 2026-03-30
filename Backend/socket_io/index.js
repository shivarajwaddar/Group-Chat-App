// backend/index.js
const { Server } = require("socket.io");
const authMiddleware = require("./middleware.js");
const registerChatHandlers = require("./handlers/chat.js");
const registerPersonalChatHandlers = require("./handlers/personalChat.js");

const initSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.use(authMiddleware);

  io.on("connection", (socket) => {
    // Get ID from the middleware-authenticated user
    const userId = socket.user.id || socket.user.userId;
    console.log("Connected:", socket.user.name, "ID:", userId);

    // CRITICAL FIX: Every user joins their own private "mailbox" room
    socket.join(`user_${userId}`);

    registerChatHandlers(io, socket);
    registerPersonalChatHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log("Disconnected:", socket.user.name);
    });
  });
};

module.exports = initSocket;
