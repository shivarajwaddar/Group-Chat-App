// 1. Load Environment Variables at the very top
require("dotenv").config();
var cors = require("cors");

const express = require("express");
const db = require("./utils/db-connection");
const userRouter = require("./routes/userRoutes");
const chatRouter = require("./routes/chatRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRouter);
app.use("/api/messages", chatRouter);

db.sync({ alter: true })
  .then(() => {
    app.listen(3000, () => {
      console.log("Server running on port 3000");
    });
  })
  .catch((err) => {
    console.error("DB Connection Error:", err);
  });
