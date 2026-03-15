require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const db = require("./utils/db-connection.js");

// Routes
const userRouter = require("./routes/userRoutes.js");
const chatRouter = require("./routes/chatRoutes.js");

// Import the Socket Manager explicitly
const initSocket = require("./socket_io/index.js");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// API Endpoints
app.use("/api/users", userRouter);
app.use("/api/messages", chatRouter);

// Initialize WebSockets by passing the HTTP server
initSocket(server);

// Start Database and Server
db.sync()
  .then(() => {
    server.listen(3000, () => {
      console.log("Server running on port 3000");
    });
  })
  .catch((err) => console.error("DB Connection Error:", err));

// require("dotenv").config();
// var cors = require("cors");
// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
// const jwt = require("jsonwebtoken"); // Needed for auth

// const db = require("./utils/db-connection");
// const Message = require("./models/chatModel"); // Import your Message model
// const User = require("./models/userModel"); // Import your User model
// const userRouter = require("./routes/userRoutes");
// const chatRouter = require("./routes/chatRoutes");

// const app = express();
// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
// });

// app.use(cors());
// app.use(express.json());

// // --- 1. SOCKET.IO AUTHENTICATION MIDDLEWARE ---
// io.use((socket, next) => {
//   const token = socket.handshake.auth.token;

//   if (!token) {
//     return next(new Error("Authentication error: Token missing"));
//   }

//   jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
//     if (err) return next(new Error("Authentication error: Invalid token"));

//     // Store user data in the socket object for use in events
//     socket.user = decoded;
//     next();
//   });
// });

// app.use("/api/users", userRouter);
// app.use("/api/messages", chatRouter);

// // --- 2. SOCKET.IO CONNECTION LOGIC ---
// io.on("connection", (socket) => {
//   console.log("User authenticated and connected:", socket.user.name);

//   socket.on("sendMessage", async (data) => {
//     try {
//       // A. SAVE TO DATABASE
//       // We use socket.user.id which we got from the token in the middleware
//       const savedMessage = await Message.create({
//         content: data.content,
//         dbUserId: socket.user.userId,
//       });

//       // B. BROADCAST TO ALL
//       // We include the user's name so the frontend can display it
//       io.emit("receiveMessage", {
//         id: savedMessage.id,
//         content: savedMessage.content,
//         dbUserId: socket.user.userId,
//         createdAt: savedMessage.createdAt,
//         db_user: { name: socket.user.name }, // Sending user details back
//       });
//     } catch (error) {
//       console.error("Error saving message:", error);
//       socket.emit("error_message", "Failed to save message to database");
//     }
//   });

//   socket.on("disconnect", () => {
//     console.log("User disconnected:", socket.user.name);
//   });
// });

// db.sync()
//   .then(() => {
//     server.listen(3000, () => {
//       console.log("Server running on port 3000 with WebSockets & Auth");
//     });
//   })
//   .catch((err) => {
//     console.error("DB Connection Error:", err);
//   });
