const User = require("./userModel");
const Message = require("./chatModel");

// --- 1. SENDER RELATIONSHIP ---
// A User can send many messages
User.hasMany(Message, {
  foreignKey: "dbUserId",
  onDelete: "CASCADE",
});

// A Message belongs to a Sender (User)
Message.belongsTo(User, {
  foreignKey: "dbUserId",
});

// --- 2. RECIPIENT RELATIONSHIP (For Private Chat) ---
// A User can also be the recipient of many messages
User.hasMany(Message, {
  foreignKey: "recipientId",
  as: "receivedMessages", // We use an alias to distinguish from sent messages
  onDelete: "CASCADE",
});

// A Message belongs to a Recipient (User)
Message.belongsTo(User, {
  foreignKey: "recipientId",
  as: "recipient", // Alias used for including recipient data in queries
});

module.exports = { User, Message };
