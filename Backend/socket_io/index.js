const { Server } = require("socket.io");
const authMiddleware = require("./middleware.js"); // Your Socket JWT check
const registerChatHandlers = require("./handlers/chat.js");
const registerPersonalChatHandlers = require("./handlers/personalChat.js");

const initSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.use(authMiddleware);

  io.on("connection", (socket) => {
    console.log("Connected:", socket.user.name);

    registerChatHandlers(io, socket);
    registerPersonalChatHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log("Disconnected:", socket.user.name);
    });
  });
};

module.exports = initSocket;
