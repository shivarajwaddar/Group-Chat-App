// models/archivedChatModel.js
const { DataTypes } = require("sequelize");
const sequelize = require("../utils/db-connection");

const ArchivedChat = sequelize.define("archived_chat", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  content: { type: DataTypes.TEXT, allowNull: false },
  dbUserId: { type: DataTypes.INTEGER },
  groupId: { type: DataTypes.INTEGER },
  recipientId: { type: DataTypes.INTEGER },
  createdAt: { type: DataTypes.DATE }, // We preserve the original timestamp
});

module.exports = ArchivedChat;
