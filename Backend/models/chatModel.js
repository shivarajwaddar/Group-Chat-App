const sequelize = require("../utils/db-connection");
const { DataTypes } = require("sequelize");

const Message = sequelize.define(
  "message",
  {
    content: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    timeStamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    // ADD THIS: The link to the User who sent the message
    // This allows you to say "This message belongs to User #5"
    dbUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "messages",
  },
);

module.exports = Message;
