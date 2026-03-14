require("dotenv").config();
var cors = require("cors");
const express = require("express");
const http = require("http"); // 1. Import Node's built-in HTTP module
const { Server } = require("socket.io"); // 2. Import Socket.io

const db = require("./utils/db-connection");
const userRouter = require("./routes/userRoutes");
const chatRouter = require("./routes/chatRoutes");

const app = express();

// Create the HTTP server using the Express app
const server = http.createServer(app);

// 3. Initialize Socket.io and attach it to the server
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust this in production for security
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

app.use("/api/users", userRouter);
app.use("/api/messages", chatRouter);

// 4. Socket.io Connection Logic
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // When a user sends a message, tell the server to broadcast it
  socket.on("sendMessage", (newMessage) => {
    // broadcast.emit sends to everyone EXCEPT the sender
    socket.broadcast.emit("receiveMessage", newMessage);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// 5. IMPORTANT: Start 'server', not 'app'
db.sync()
  .then(() => {
    server.listen(3000, () => {
      console.log("Server running on port 3000 with WebSockets");
    });
  })
  .catch((err) => {
    console.error("DB Connection Error:", err);
  });
