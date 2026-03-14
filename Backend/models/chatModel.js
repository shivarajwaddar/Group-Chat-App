const sequelize = require("../utils/db-connection");
const { DataTypes } = require("sequelize");

const Message = sequelize.define(
  "message",
  {
    content: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // You don't need timeStamp, dbUserId, or dbUserName here.
    // Sequelize adds 'createdAt' automatically.
    // The User ID will be added by the Association below.
  },
  { tableName: "messages" },
);

module.exports = Message;
