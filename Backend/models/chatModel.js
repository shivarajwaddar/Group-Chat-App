const sequelize = require("../utils/db-connection.js");
const { DataTypes } = require("sequelize");

const Message = sequelize.define(
  "message",
  {
    content: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // The ID of the person sending the message
    dbUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // NEW: The ID of the person receiving the message
    // If this is NULL, it could mean it's a "Global" group message
    recipientId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  { tableName: "messages" },
);

module.exports = Message;
