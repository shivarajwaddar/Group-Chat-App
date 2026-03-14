const User = require("./userModel");
const Message = require("./chatModel");

// 1. One-to-Many Relationship
// A User can send many messages
User.hasMany(Message, {
  foreignKey: "dbUserId", // This links to the column in your Message model
  onDelete: "CASCADE", // If a user is deleted, their messages are deleted too
});

// 2. BelongsTo Relationship
// Each Message belongs to a specific User
Message.belongsTo(User, {
  foreignKey: "dbUserId", // Ensuring both use the same key name
});

module.exports = { User, Message };
